import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useApi } from "@/api/useApi";
import { ENDPOINT_RABBIT_EXCHANGES, ENDPOINT_RABBIT_QUEUES } from "@/api/endpoints";
import { useCollection } from "@/hooks/useCollection";
import { usePolling } from "@/hooks/usePolling";
import { Spinner } from "@/components/Spinner";
import { ConfirmDelete } from "@/components/mensajeria/ConfirmDelete";
import { btnDanger, btnPrimary, inputClass, labelClass, tdClass, thClass } from "@/components/ui";
import { apiErrorMessage } from "@/lib/format";
import type { RabbitExchange, RabbitQueue, RabbitQueueInput } from "@/types";

const POLL_MS = 5000;

function optionalNumber(value: string): number | undefined {
  return value.trim() === "" ? undefined : Number(value);
}

export function ColasPanel() {
  const api = useApi();
  const { data: colas, loading, error, reload } = useCollection<RabbitQueue>(
    useCallback(() => api.get<RabbitQueue[]>(ENDPOINT_RABBIT_QUEUES, { toast: false }), [api]),
  );
  const { data: exchanges } = useCollection<RabbitExchange>(
    useCallback(() => api.get<RabbitExchange[]>(ENDPOINT_RABBIT_EXCHANGES, { toast: false }), [api]),
  );
  usePolling(reload, POLL_MS);

  const [name, setName] = useState("");
  const [durable, setDurable] = useState(true);
  const [ttl, setTtl] = useState("");
  const [maxLength, setMaxLength] = useState("");
  const [dlx, setDlx] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<RabbitQueue | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setFormError(null);
    const body: RabbitQueueInput = {
      name: name.trim(),
      durable,
      messageTtlMs: optionalNumber(ttl),
      maxLength: optionalNumber(maxLength),
      deadLetterExchange: dlx || undefined,
    };
    try {
      await api.post(ENDPOINT_RABBIT_QUEUES, body);
      toast.success(`Cola ${body.name} creada`);
      setName("");
      setTtl("");
      setMaxLength("");
      setDlx("");
      reload();
    } catch (createError) {
      setFormError(apiErrorMessage(createError));
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setSubmitting(true);
    setDeleteError(null);
    try {
      // Si la cola tiene mensajes, el usuario ya fue advertido en el modal.
      const force = deleting.messages > 0 ? "?force=true" : "";
      await api.del(`${ENDPOINT_RABBIT_QUEUES}/${encodeURIComponent(deleting.name)}${force}`);
      toast.success(`Cola ${deleting.name} eliminada`);
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
        <h2 className="mb-3 text-lg font-semibold text-white">Nueva cola</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className={labelClass} htmlFor="cola-nombre">Nombre *</label>
            <input
              id="cola-nombre"
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej: pedidos.facturacion.queue"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="cola-ttl">TTL mensajes (ms)</label>
            <input id="cola-ttl" type="number" min="1" className={inputClass} value={ttl} onChange={(e) => setTtl(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="cola-max">Máx. mensajes</label>
            <input id="cola-max" type="number" min="1" className={inputClass} value={maxLength} onChange={(e) => setMaxLength(e.target.value)} />
          </div>
          <div className="lg:col-span-2">
            <label className={labelClass} htmlFor="cola-dlx">Dead letter exchange</label>
            <select id="cola-dlx" className={inputClass} value={dlx} onChange={(e) => setDlx(e.target.value)}>
              <option value="">(ninguno)</option>
              {exchanges.map((ex) => (
                <option key={ex.name} value={ex.name}>{ex.name}</option>
              ))}
            </select>
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm text-gray-300">
            <input type="checkbox" checked={durable} onChange={(e) => setDurable(e.target.checked)} className="h-4 w-4" />
            Durable
          </label>
          <div className="flex items-end">
            <button type="submit" className={`${btnPrimary} w-full`} disabled={creating || name.trim() === ""}>
              {creating ? "Creando..." : "Crear cola"}
            </button>
          </div>
        </div>
        {formError && (
          <p className="mt-3 rounded-md border border-red-900 bg-red-950 p-3 text-sm text-red-300">{formError}</p>
        )}
      </form>

      {error && <p className="rounded-md border border-red-900 bg-red-950 p-3 text-sm text-red-300">{error}</p>}

      {loading && colas.length === 0 ? (
        <Spinner label="Cargando colas..." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className={thClass}>Cola</th>
                <th className={thClass}>Argumentos</th>
                <th className={`${thClass} text-right`}>Listos</th>
                <th className={`${thClass} text-right`}>Sin ACK</th>
                <th className={`${thClass} text-right`}>Consumidores</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody>
              {colas.map((cola) => (
                <tr key={cola.name} className="border-b border-gray-800 last:border-0">
                  <td className={tdClass}>
                    <p className="font-mono text-xs text-white">{cola.name}</p>
                    <p className="text-xs text-gray-500">
                      {cola.durable ? "durable" : "transitoria"}
                      {cola.protected && " · topología base"}
                    </p>
                  </td>
                  <td className={`${tdClass} font-mono text-xs text-gray-400`}>
                    {Object.entries(cola.arguments)
                      .filter(([key]) => key !== "x-queue-type")
                      .map(([key, value]) => `${key}=${String(value)}`)
                      .join(", ") || "—"}
                  </td>
                  <td className={`${tdClass} text-right`}>{cola.messagesReady}</td>
                  <td className={`${tdClass} text-right`}>{cola.messagesUnacked}</td>
                  <td className={`${tdClass} text-right`}>{cola.consumers}</td>
                  <td className={`${tdClass} text-right`}>
                    {!cola.protected && (
                      <button
                        type="button"
                        className={btnDanger}
                        onClick={() => {
                          setDeleteError(null);
                          setDeleting(cola);
                        }}
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleting && (
        <ConfirmDelete
          title="Eliminar cola"
          submitting={submitting}
          error={deleteError}
          onCancel={() => setDeleting(null)}
          onConfirm={() => void handleDelete()}
        >
          ¿Eliminar la cola <span className="font-mono text-white">{deleting.name}</span>?
          {deleting.messages > 0 && (
            <p className="mt-2 text-amber-300">
              Tiene {deleting.messages} mensajes: se perderán.
            </p>
          )}
        </ConfirmDelete>
      )}
    </div>
  );
}
