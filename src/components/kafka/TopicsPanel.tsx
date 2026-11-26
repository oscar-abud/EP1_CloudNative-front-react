import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useApi } from "@/api/useApi";
import { ENDPOINT_KAFKA_TOPICS } from "@/api/endpoints";
import { useCollection } from "@/hooks/useCollection";
import { usePolling } from "@/hooks/usePolling";
import { Spinner } from "@/components/Spinner";
import { ConfirmDelete } from "@/components/mensajeria/ConfirmDelete";
import { btnDanger, btnPrimary, inputClass, labelClass, tdClass, thClass } from "@/components/ui";
import { apiErrorMessage } from "@/lib/format";
import { CLEANUP_POLICIES, type CleanupPolicy, type KafkaTopic, type KafkaTopicInput } from "@/types";

const POLL_MS = 5000;

// Kafka guarda las configuraciones como texto. -1 significa "sin retención por
// tiempo", que es lo normal en un tópico compactado.
function formatRetencion(retentionMs: string | null): string {
  if (retentionMs === null) return "-";
  const ms = Number(retentionMs);
  if (ms < 0) return "sin límite";
  const dias = ms / 86_400_000;
  if (dias >= 1) return `${Number(dias.toFixed(1))} d`;
  const horas = ms / 3_600_000;
  if (horas >= 1) return `${Number(horas.toFixed(1))} h`;
  return `${Math.round(ms / 1000)} s`;
}

export function TopicsPanel() {
  const api = useApi();
  const { data: topics, loading, error, reload } = useCollection<KafkaTopic>(
    // Sin toast: con polling cada 5s, un error repetiría el aviso sin parar.
    useCallback(() => api.get<KafkaTopic[]>(ENDPOINT_KAFKA_TOPICS, { toast: false }), [api]),
  );
  usePolling(reload, POLL_MS);

  const [name, setName] = useState("");
  const [numPartitions, setNumPartitions] = useState(3);
  const [replicationFactor, setReplicationFactor] = useState(3);
  const [cleanupPolicy, setCleanupPolicy] = useState<CleanupPolicy>("delete");
  const [retentionDias, setRetentionDias] = useState("7");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editando, setEditando] = useState<KafkaTopic | null>(null);
  const [nuevaRetencionDias, setNuevaRetencionDias] = useState("");
  const [nuevaPolicy, setNuevaPolicy] = useState<CleanupPolicy>("delete");
  const [guardando, setGuardando] = useState(false);

  const [deleting, setDeleting] = useState<KafkaTopic | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setFormError(null);

    const body: KafkaTopicInput = {
      name: name.trim(),
      numPartitions,
      replicationFactor,
      cleanupPolicy,
    };
    // En un tópico compactado la retención por tiempo no aplica.
    if (cleanupPolicy !== "compact" && retentionDias.trim() !== "") {
      body.retentionMs = Number(retentionDias) * 86_400_000;
    }

    try {
      await api.post(ENDPOINT_KAFKA_TOPICS, body);
      toast.success(`Tópico ${body.name} creado con ${numPartitions} particiones (RF ${replicationFactor})`);
      setName("");
      reload();
    } catch (createError) {
      setFormError(apiErrorMessage(createError));
    } finally {
      setCreating(false);
    }
  }

  function abrirEdicion(topic: KafkaTopic) {
    setEditando(topic);
    setNuevaPolicy((topic.cleanupPolicy as CleanupPolicy) ?? "delete");
    const ms = Number(topic.retentionMs ?? 0);
    setNuevaRetencionDias(ms > 0 ? String(ms / 86_400_000) : "");
  }

  async function handleGuardarConfig() {
    if (!editando) return;
    setGuardando(true);
    try {
      const configs: Record<string, string> = { "cleanup.policy": nuevaPolicy };
      if (nuevaRetencionDias.trim() !== "") {
        configs["retention.ms"] = String(Number(nuevaRetencionDias) * 86_400_000);
      }
      await api.patch(`${ENDPOINT_KAFKA_TOPICS}/${encodeURIComponent(editando.name)}/config`, { configs });
      toast.success(`Configuración de ${editando.name} actualizada`);
      setEditando(null);
      reload();
    } catch (saveError) {
      toast.error(apiErrorMessage(saveError));
    } finally {
      setGuardando(false);
    }
  }

  // Kafka solo permite AUMENTAR particiones: reducirlas dejaría mensajes
  // huérfanos y rompería el orden garantizado por key.
  async function handleAgregarParticion(topic: KafkaTopic) {
    try {
      await api.post(`${ENDPOINT_KAFKA_TOPICS}/${encodeURIComponent(topic.name)}/partitions`, {
        count: topic.numPartitions + 1,
      });
      toast.success(`${topic.name}: ahora tiene ${topic.numPartitions + 1} particiones`);
      reload();
    } catch (addError) {
      toast.error(apiErrorMessage(addError));
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setSubmitting(true);
    setDeleteError(null);
    try {
      await api.del(`${ENDPOINT_KAFKA_TOPICS}/${encodeURIComponent(deleting.name)}`);
      toast.success(`Tópico ${deleting.name} eliminado`);
      setDeleting(null);
      reload();
    } catch (removeError) {
      setDeleteError(apiErrorMessage(removeError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-1 text-lg font-semibold text-white">Nuevo tópico</h2>
        <p className="mb-3 text-sm text-gray-400">
          Las particiones reparten la carga entre los consumidores de un grupo; el factor de
          replicación es en cuántos brokers se copia cada partición (el clúster tiene 3).
        </p>
        <div className="grid gap-3 sm:grid-cols-5">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="kt-nombre">Nombre *</label>
            <input
              id="kt-nombre"
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej: pedidos.facturacion.v1"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="kt-part">Particiones</label>
            <input
              id="kt-part"
              type="number"
              min={1}
              max={12}
              className={inputClass}
              value={numPartitions}
              onChange={(e) => setNumPartitions(Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="kt-rf">Réplicas</label>
            <input
              id="kt-rf"
              type="number"
              min={1}
              max={3}
              className={inputClass}
              value={replicationFactor}
              onChange={(e) => setReplicationFactor(Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="kt-policy">Cleanup policy</label>
            <select
              id="kt-policy"
              className={inputClass}
              value={cleanupPolicy}
              onChange={(e) => setCleanupPolicy(e.target.value as CleanupPolicy)}
            >
              {CLEANUP_POLICIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-5">
          <div>
            <label className={labelClass} htmlFor="kt-ret">Retención (días)</label>
            <input
              id="kt-ret"
              type="number"
              min={1}
              className={inputClass}
              value={retentionDias}
              onChange={(e) => setRetentionDias(e.target.value)}
              disabled={cleanupPolicy === "compact"}
              placeholder={cleanupPolicy === "compact" ? "no aplica" : "7"}
            />
          </div>
          <div className="flex items-end sm:col-span-2">
            <button type="submit" className={btnPrimary} disabled={creating || name.trim() === ""}>
              {creating ? "Creando..." : "Crear tópico"}
            </button>
          </div>
        </div>

        {cleanupPolicy === "compact" && (
          <p className="mt-3 text-sm text-gray-400">
            <span className="text-violet-300">compact</span>: el tópico se comporta como una tabla
            de estado y conserva el último mensaje de cada key, así que no se borra por tiempo.
          </p>
        )}
        {formError && <p className="mt-3 text-sm text-red-300">{formError}</p>}
      </form>

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-1 text-lg font-semibold text-white">Tópicos ({topics.length})</h2>
        <p className="mb-3 text-sm text-gray-400">
          ISR es el número de réplicas en sincronía. Si baja del factor de replicación, hay un
          broker caído o atrasado.
        </p>

        {error && <p className="text-sm text-red-300">{error}</p>}

        {loading && topics.length === 0 ? (
          <Spinner />
        ) : topics.length === 0 ? (
          <p className="text-sm text-gray-400">
            No hay tópicos. Córre <code className="text-gray-300">pnpm topics:bootstrap</code> en
            pedidos360-kafka-admin para crear la topología.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className={thClass}>Tópico</th>
                  <th className={thClass}>Particiones</th>
                  <th className={thClass}>RF</th>
                  <th className={thClass}>Cleanup policy</th>
                  <th className={thClass}>Retención</th>
                  <th className={thClass}>min.ISR</th>
                  <th className={thClass}>Estado</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {topics.map((topic) => (
                  <tr key={topic.name} className="border-b border-gray-800/60">
                    <td className={`${tdClass} font-medium text-white`}>
                      {topic.name}
                      {topic.protected && (
                        <span className="ml-2 rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-300">
                          base
                        </span>
                      )}
                    </td>
                    <td className={tdClass}>{topic.numPartitions}</td>
                    <td className={tdClass}>{topic.replicationFactor}</td>
                    <td className={tdClass}>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          topic.cleanupPolicy.includes("compact")
                            ? "bg-violet-500/15 text-violet-300"
                            : "bg-gray-500/15 text-gray-300"
                        }`}
                      >
                        {topic.cleanupPolicy}
                      </span>
                    </td>
                    <td className={tdClass}>{formatRetencion(topic.retentionMs)}</td>
                    <td className={tdClass}>{topic.minInsyncReplicas ?? "-"}</td>
                    <td className={tdClass}>
                      {topic.particionesSincronizadas ? (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                          en sincronía
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">
                          réplicas atrasadas
                        </span>
                      )}
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <div className="flex justify-end gap-2">
                        <button type="button" className={btnDanger} onClick={() => abrirEdicion(topic)}>
                          Configurar
                        </button>
                        <button
                          type="button"
                          className={btnDanger}
                          onClick={() => handleAgregarParticion(topic)}
                        >
                          + partición
                        </button>
                        {!topic.protected && (
                          <button type="button" className={btnDanger} onClick={() => setDeleting(topic)}>
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editando && (
        <ConfirmDelete
          title={`Configurar ${editando.name}`}
          submitting={guardando}
          error={null}
          onCancel={() => setEditando(null)}
          onConfirm={handleGuardarConfig}
        >
          <div className="space-y-3">
            <div>
              <label className={labelClass} htmlFor="kt-edit-policy">Cleanup policy</label>
              <select
                id="kt-edit-policy"
                className={inputClass}
                value={nuevaPolicy}
                onChange={(e) => setNuevaPolicy(e.target.value as CleanupPolicy)}
              >
                {CLEANUP_POLICIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="kt-edit-ret">Retención (días)</label>
              <input
                id="kt-edit-ret"
                type="number"
                min={1}
                className={inputClass}
                value={nuevaRetencionDias}
                onChange={(e) => setNuevaRetencionDias(e.target.value)}
                placeholder="dejar vacío para no cambiarla"
              />
            </div>
          </div>
        </ConfirmDelete>
      )}

      {deleting && (
        <ConfirmDelete
          title={`Eliminar ${deleting.name}`}
          submitting={submitting}
          error={deleteError}
          onCancel={() => {
            setDeleting(null);
            setDeleteError(null);
          }}
          onConfirm={handleDelete}
        >
          Se eliminarán el tópico y todos sus mensajes en las {deleting.numPartitions} particiones.
          Esta acción no se puede deshacer.
        </ConfirmDelete>
      )}
    </div>
  );
}
