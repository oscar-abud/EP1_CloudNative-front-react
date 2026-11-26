import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/api/useApi";
import { ENDPOINT_KAFKA_CLUSTER, ENDPOINT_MENSAJERIA } from "@/api/endpoints";
import { useCollection } from "@/hooks/useCollection";
import { usePolling } from "@/hooks/usePolling";
import { Spinner } from "@/components/Spinner";
import { tdClass, thClass } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import type { KafkaCluster, KafkaResumenEventos, MetricaVenta } from "@/types";

const POLL_MS = 5000;

export function KafkaMonitorPanel() {
  const api = useApi();

  const [cluster, setCluster] = useState<KafkaCluster | null>(null);
  const [resumen, setResumen] = useState<KafkaResumenEventos | null>(null);

  // Acumulado de ventas que calcula el grupo pedidos360-analitica a partir del
  // stream y deja en Supabase.
  const ventas = useCollection<MetricaVenta>(
    useCallback(
      () => api.get<MetricaVenta[]>(`${ENDPOINT_MENSAJERIA}/ventas`, { toast: false }),
      [api],
    ),
  );
  const { reload: reloadVentas } = ventas;

  const refrescar = useCallback(() => {
    api
      .get<KafkaCluster>(ENDPOINT_KAFKA_CLUSTER, { toast: false })
      .then(setCluster)
      .catch(() => setCluster(null));

    api
      .get<KafkaResumenEventos>(`${ENDPOINT_MENSAJERIA}/metricas`, { toast: false })
      .then(setResumen)
      .catch(() => setResumen(null));
  }, [api]);

  useEffect(refrescar, [refrescar]);

  usePolling(
    useCallback(() => {
      refrescar();
      reloadVentas();
    }, [refrescar, reloadVentas]),
    POLL_MS,
  );

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-white">Clúster Kafka</h2>
          {cluster ? (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300">
              {cluster.brokers.length} brokers conectados
            </span>
          ) : (
            <span className="rounded-full bg-red-500/15 px-3 py-1 text-sm text-red-300">
              sin conexión
            </span>
          )}
        </div>

        {!cluster ? (
          <p className="text-sm text-gray-400">
            No se pudo contactar al clúster. Revisa que docker/kafka-cluster esté levantado y que
            pedidos360-kafka-admin apunte a los brokers correctos.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className={thClass}>Broker</th>
                <th className={thClass}>Host</th>
                <th className={thClass}>Puerto</th>
                <th className={thClass}>Rol</th>
              </tr>
            </thead>
            <tbody>
              {cluster.brokers.map((broker) => (
                <tr key={broker.nodeId} className="border-b border-gray-800/60">
                  <td className={`${tdClass} font-medium text-white`}>{broker.nodeId}</td>
                  <td className={tdClass}>{broker.host}</td>
                  <td className={tdClass}>{broker.port}</td>
                  <td className={tdClass}>
                    {broker.esController ? (
                      <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-300">
                        controller
                      </span>
                    ) : (
                      <span className="text-gray-400">broker</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-1 text-lg font-semibold text-white">Eventos vistos por el back</h2>
        <p className="mb-3 text-sm text-gray-400">
          Contador del consumer group <span className="text-gray-300">pedidos360-back-cache</span>.
          Lee el mismo tópico que <span className="text-gray-300">pedidos360-analitica</span> del
          worker: al ser grupos distintos, cada uno recibe todos los eventos.
        </p>

        {!resumen ? (
          <p className="text-sm text-gray-400">Sin datos todavía.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-blue-500/15 px-3 py-1 text-blue-300">
                {resumen.total} eventos
              </span>
              {Object.entries(resumen.porTipo).map(([tipo, cantidad]) => (
                <span key={tipo} className="rounded-full bg-gray-500/15 px-3 py-1 text-gray-300">
                  {tipo}: {cantidad}
                </span>
              ))}
            </div>

            {Object.keys(resumen.particiones).length > 0 && (
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="text-gray-400">Reparto por partición:</span>
                {Object.entries(resumen.particiones).map(([particion, cantidad]) => (
                  <span
                    key={particion}
                    className="rounded-full bg-violet-500/15 px-3 py-1 text-violet-300"
                  >
                    partición {particion}: {cantidad}
                  </span>
                ))}
              </div>
            )}

            {resumen.ultimoEvento && (
              <p className="text-sm text-gray-400">
                Último: <span className="text-gray-200">{resumen.ultimoEvento.tipo}</span>{" "}
                {resumen.ultimoEvento.id} (partición {resumen.ultimoEvento.partition}, offset{" "}
                {resumen.ultimoEvento.offset})
              </p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-1 text-lg font-semibold text-white">
          Ventas por producto ({ventas.data.length})
        </h2>
        <p className="mb-3 text-sm text-gray-400">
          Lo calcula el grupo <span className="text-gray-300">pedidos360-analitica</span> leyendo el
          stream de pedidos, y lo publica además en el tópico compactado{" "}
          <span className="text-gray-300">pedidos.metricas.v1</span>.
        </p>

        {ventas.error && <p className="text-sm text-red-300">{ventas.error}</p>}

        {ventas.loading && ventas.data.length === 0 ? (
          <Spinner />
        ) : ventas.data.length === 0 ? (
          <p className="text-sm text-gray-400">
            Todavía no hay ventas acumuladas. Crea un pedido con productos para ver el stream en
            acción.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className={thClass}>Producto</th>
                <th className={thClass}>Unidades</th>
                <th className={thClass}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {ventas.data.map((venta) => (
                <tr key={venta.productoId} className="border-b border-gray-800/60">
                  <td className={`${tdClass} font-medium text-white`}>{venta.nombre}</td>
                  <td className={tdClass}>{venta.unidades}</td>
                  <td className={tdClass}>{formatPrice(venta.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
