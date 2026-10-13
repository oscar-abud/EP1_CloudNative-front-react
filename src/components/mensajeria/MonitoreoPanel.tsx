import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useApi } from "@/api/useApi";
import { ENDPOINT_MENSAJERIA } from "@/api/endpoints";
import { useCollection } from "@/hooks/useCollection";
import { usePolling } from "@/hooks/usePolling";
import { Spinner } from "@/components/Spinner";
import { btnSecondary, tdClass, thClass } from "@/components/ui";
import { formatDate, formatPrice } from "@/lib/format";
import type { MensajeDlq, Ticket } from "@/types";

const POLL_MS = 5000;

const MOTIVOS: Record<string, string> = {
  rejected: "NACK tras reintentos",
  "no-recuperable": "Error no recuperable",
  expired: "Expiró (TTL)",
  maxlen: "Cola llena (max-length)",
  unrouted: "Sin cola destino",
};

const SIMULACIONES = [
  {
    fallo: undefined,
    label: "Pedido OK",
    detalle: "Se procesa y genera ticket",
  },
  {
    fallo: "transitorio",
    label: "Fallo transitorio",
    detalle: "3 reintentos (1s, 2s, 4s) → NACK → DLQ",
  },
  {
    fallo: "permanente",
    label: "Fallo permanente",
    detalle: "Sin reintentos → DLQ",
  },
] as const;

export function MonitoreoPanel() {
  const api = useApi();
  const [rabbitEstado, setRabbitEstado] = useState<string>("...");
  const [enviando, setEnviando] = useState<string | null>(null);

  // Lecturas silenciosas: con polling, un error repetiría el toast cada 5s
  // (el error se muestra igual dentro de cada sección).
  const dlq = useCollection<MensajeDlq>(
    useCallback(() => api.get<MensajeDlq[]>(`${ENDPOINT_MENSAJERIA}/dlq`, { toast: false }), [api]),
  );
  const tickets = useCollection<Ticket>(
    useCallback(() => api.get<Ticket[]>(`${ENDPOINT_MENSAJERIA}/tickets`, { toast: false }), [api]),
  );
  const { reload: reloadDlq } = dlq;
  const { reload: reloadTickets } = tickets;

  const refrescarEstado = useCallback(() => {
    api
      .get<{ rabbitmq: string }>(`${ENDPOINT_MENSAJERIA}/estado`, { toast: false })
      .then((data) => setRabbitEstado(data.rabbitmq))
      .catch(() => setRabbitEstado("desconocido"));
  }, [api]);

  useEffect(refrescarEstado, [refrescarEstado]);

  usePolling(
    useCallback(() => {
      reloadDlq();
      reloadTickets();
      refrescarEstado();
    }, [reloadDlq, reloadTickets, refrescarEstado]),
    POLL_MS,
  );

  async function simular(fallo?: string) {
    setEnviando(fallo ?? "ok");
    try {
      await api.post(`${ENDPOINT_MENSAJERIA}/simular`, fallo ? { fallo } : {});
      toast.success("Evento publicado en RabbitMQ. Mira cómo se procesa abajo.");
    } catch {
      // El interceptor de axios ya muestra el toast con el mensaje del backend.
    } finally {
      setEnviando(null);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Simular eventos</h2>
            <p className="text-sm text-gray-400">
              Publica un <code className="text-blue-300">pedido.creado</code> de prueba y sigue
              su recorrido por las colas.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              rabbitEstado === "conectado"
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-red-500/15 text-red-300"
            }`}
          >
            RabbitMQ: {rabbitEstado}
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {SIMULACIONES.map((sim) => (
            <button
              key={sim.label}
              type="button"
              className={`${btnSecondary} text-left`}
              disabled={enviando !== null}
              onClick={() => void simular(sim.fallo)}
            >
              <span className="block font-medium text-white">
                {enviando === (sim.fallo ?? "ok") ? "Publicando..." : sim.label}
              </span>
              <span className="block text-xs text-gray-400">{sim.detalle}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-red-900/50 bg-gray-900 p-6">
        <h2 className="mb-1 text-lg font-semibold text-white">
          Dead Letter Queue <span className="text-sm text-red-300">({dlq.data.length})</span>
        </h2>
        <p className="mb-3 text-sm text-gray-400">
          Mensajes que no se pudieron procesar (se actualiza cada {POLL_MS / 1000}s).
        </p>
        {dlq.error && <p className="text-sm text-red-300">{dlq.error}</p>}
        {dlq.loading && dlq.data.length === 0 ? (
          <Spinner label="Cargando DLQ..." />
        ) : dlq.data.length === 0 ? (
          <p className="text-sm text-gray-500">Sin mensajes muertos. 🎉</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className={thClass}>Fecha</th>
                  <th className={thClass}>Evento</th>
                  <th className={thClass}>Cola</th>
                  <th className={thClass}>Motivo</th>
                  <th className={`${thClass} text-right`}>Reintentos</th>
                  <th className={thClass}>Error</th>
                </tr>
              </thead>
              <tbody>
                {dlq.data.map((m) => (
                  <tr key={m.id} className="border-b border-gray-800 last:border-0">
                    <td className={`${tdClass} whitespace-nowrap text-gray-400`}>{formatDate(m.createdAt)}</td>
                    <td className={tdClass}>
                      <p className="text-white">{m.tipo ?? "—"}</p>
                      <p className="font-mono text-xs text-gray-500">{m.eventoId}</p>
                    </td>
                    <td className={`${tdClass} font-mono text-xs`}>{m.colaOrigen ?? "—"}</td>
                    <td className={tdClass}>
                      <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-300">
                        {MOTIVOS[m.motivo] ?? m.motivo}
                      </span>
                    </td>
                    <td className={`${tdClass} text-right`}>{m.intentos}</td>
                    <td className={`${tdClass} text-xs text-gray-400`}>{m.error ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-1 text-lg font-semibold text-white">
          Tickets generados <span className="text-sm text-emerald-300">({tickets.data.length})</span>
        </h2>
        <p className="mb-3 text-sm text-gray-400">
          Resultado del consumidor de tickets (eventos procesados con éxito).
        </p>
        {tickets.error && <p className="text-sm text-red-300">{tickets.error}</p>}
        {tickets.loading && tickets.data.length === 0 ? (
          <Spinner label="Cargando tickets..." />
        ) : tickets.data.length === 0 ? (
          <p className="text-sm text-gray-500">Aún no hay tickets.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className={thClass}>Ticket</th>
                  <th className={thClass}>Cliente</th>
                  <th className={`${thClass} text-right`}>Total</th>
                  <th className={thClass}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {tickets.data.map((t) => (
                  <tr key={t.id} className="border-b border-gray-800 last:border-0">
                    <td className={`${tdClass} font-mono text-xs text-emerald-300`}>{t.numero}</td>
                    <td className={tdClass}>{t.clienteNombre}</td>
                    <td className={`${tdClass} text-right`}>{formatPrice(t.total)}</td>
                    <td className={`${tdClass} whitespace-nowrap text-gray-400`}>{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
