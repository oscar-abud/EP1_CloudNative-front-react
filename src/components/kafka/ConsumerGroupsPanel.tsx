import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useApi } from "@/api/useApi";
import { ENDPOINT_KAFKA_GROUPS } from "@/api/endpoints";
import { useCollection } from "@/hooks/useCollection";
import { usePolling } from "@/hooks/usePolling";
import { Spinner } from "@/components/Spinner";
import { btnDanger, tdClass, thClass } from "@/components/ui";
import { apiErrorMessage } from "@/lib/format";
import type { KafkaConsumerGroup, KafkaConsumerGroupResumen } from "@/types";

const POLL_MS = 5000;

// Stable = repartiendo y consumiendo con normalidad.
// Empty = el grupo existe pero no tiene consumidores conectados.
// PreparingRebalance / CompletingRebalance = está repartiendo particiones.
const ESTADOS: Record<string, string> = {
  Stable: "bg-emerald-500/15 text-emerald-300",
  Empty: "bg-gray-500/15 text-gray-300",
  PreparingRebalance: "bg-amber-500/15 text-amber-300",
  CompletingRebalance: "bg-amber-500/15 text-amber-300",
  Dead: "bg-red-500/15 text-red-300",
};

export function ConsumerGroupsPanel() {
  const api = useApi();
  const { data: grupos, loading, error, reload } = useCollection<KafkaConsumerGroupResumen>(
    useCallback(
      () => api.get<KafkaConsumerGroupResumen[]>(ENDPOINT_KAFKA_GROUPS, { toast: false }),
      [api],
    ),
  );
  usePolling(reload, POLL_MS);

  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<KafkaConsumerGroup | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const cargarDetalle = useCallback(
    (groupId: string) => {
      api
        .get<KafkaConsumerGroup>(`${ENDPOINT_KAFKA_GROUPS}/${encodeURIComponent(groupId)}`, {
          toast: false,
        })
        .then(setDetalle)
        .catch(() => setDetalle(null))
        .finally(() => setCargandoDetalle(false));
    },
    [api],
  );

  // El detalle se pide al seleccionar el grupo, no desde un efecto: así no se
  // encadenan renders y el spinner solo aparece la primera vez.
  function seleccionar(groupId: string) {
    if (seleccionado === groupId) {
      setSeleccionado(null);
      setDetalle(null);
      return;
    }
    setSeleccionado(groupId);
    setDetalle(null);
    setCargandoDetalle(true);
    cargarDetalle(groupId);
  }

  // El detalle también se refresca solo: así se ve bajar el lag en vivo.
  usePolling(
    useCallback(() => {
      if (seleccionado) cargarDetalle(seleccionado);
    }, [seleccionado, cargarDetalle]),
    POLL_MS,
  );

  // Kafka exige que el grupo esté detenido para mover sus offsets: si hay
  // consumidores conectados, el servicio responde 409.
  async function handleReset(groupId: string, to: "earliest" | "latest", topic: string) {
    try {
      await api.post(`${ENDPOINT_KAFKA_GROUPS}/${encodeURIComponent(groupId)}/reset-offsets`, {
        topic,
        to,
      });
      toast.success(`Offsets de ${groupId} movidos a ${to} en ${topic}`);
      cargarDetalle(groupId);
    } catch (resetError) {
      toast.error(apiErrorMessage(resetError));
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-1 text-lg font-semibold text-white">Consumer groups ({grupos.length})</h2>
        <p className="mb-3 text-sm text-gray-400">
          Cada grupo lleva su propio offset: varios grupos pueden leer el mismo tópico sin
          competir. Dentro de un grupo, en cambio, las particiones se reparten entre sus miembros.
        </p>

        {error && <p className="text-sm text-red-300">{error}</p>}

        {loading && grupos.length === 0 ? (
          <Spinner />
        ) : grupos.length === 0 ? (
          <p className="text-sm text-gray-400">
            Todavía no hay consumer groups. Kafka los crea cuando un consumidor se conecta por
            primera vez: levanta el worker con KAFKA_ENABLED=true.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className={thClass}>Grupo</th>
                  <th className={thClass}>Estado</th>
                  <th className={thClass}>Miembros</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {grupos.map((grupo) => (
                  <tr key={grupo.groupId} className="border-b border-gray-800/60">
                    <td className={`${tdClass} font-medium text-white`}>
                      {grupo.groupId}
                      {grupo.protected && (
                        <span className="ml-2 rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-300">
                          base
                        </span>
                      )}
                    </td>
                    <td className={tdClass}>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          ESTADOS[grupo.state] ?? "bg-gray-500/15 text-gray-300"
                        }`}
                      >
                        {grupo.state}
                      </span>
                    </td>
                    <td className={tdClass}>{grupo.miembros}</td>
                    <td className={`${tdClass} text-right`}>
                      <button
                        type="button"
                        className={btnDanger}
                        onClick={() => seleccionar(grupo.groupId)}
                      >
                        {seleccionado === grupo.groupId ? "Ocultar" : "Ver detalle"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {seleccionado && (
        <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">{seleccionado}</h2>
          <p className="mb-3 text-sm text-gray-400">
            El lag es cuántos mensajes le faltan por leer a cada partición. Si crece sin parar, el
            consumidor no da abasto y hay que levantar otra instancia.
          </p>

          {cargandoDetalle && !detalle ? (
            <Spinner />
          ) : !detalle ? (
            <p className="text-sm text-gray-400">No se pudo cargar el detalle del grupo.</p>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-blue-500/15 px-3 py-1 text-blue-300">
                  Lag total: {detalle.lagTotal}
                </span>
                <span
                  className={`rounded-full px-3 py-1 ${
                    ESTADOS[detalle.state] ?? "bg-gray-500/15 text-gray-300"
                  }`}
                >
                  {detalle.state}
                </span>
                <span className="rounded-full bg-gray-500/15 px-3 py-1 text-gray-300">
                  {detalle.members.length} miembro(s)
                </span>
              </div>

              {detalle.members.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-300">
                    Miembros conectados
                  </h3>
                  <ul className="space-y-1 text-sm text-gray-400">
                    {detalle.members.map((member) => (
                      <li key={member.memberId}>
                        <span className="text-gray-200">{member.clientId}</span> — {member.clientHost}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detalle.topics.map((topic) => (
                <div key={topic.topic}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-300">
                      {topic.topic} — lag {topic.lagTotal}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={btnDanger}
                        onClick={() => handleReset(detalle.groupId, "earliest", topic.topic)}
                      >
                        Reprocesar todo
                      </button>
                      <button
                        type="button"
                        className={btnDanger}
                        onClick={() => handleReset(detalle.groupId, "latest", topic.topic)}
                      >
                        Saltar al final
                      </button>
                    </div>
                  </div>

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className={thClass}>Partición</th>
                        <th className={thClass}>Offset leído</th>
                        <th className={thClass}>Último offset</th>
                        <th className={thClass}>Lag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topic.particiones.map((particion) => (
                        <tr key={particion.particion} className="border-b border-gray-800/60">
                          <td className={tdClass}>{particion.particion}</td>
                          <td className={tdClass}>
                            {particion.offsetCommitteado < 0 ? "sin leer" : particion.offsetCommitteado}
                          </td>
                          <td className={tdClass}>{particion.highWatermark}</td>
                          <td className={tdClass}>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs ${
                                particion.lag === 0
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-amber-500/15 text-amber-300"
                              }`}
                            >
                              {particion.lag}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              {detalle.topics.length === 0 && (
                <p className="text-sm text-gray-400">
                  El grupo todavía no ha confirmado ningún offset.
                </p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
