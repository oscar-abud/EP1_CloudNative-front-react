import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useApi } from "@/api/useApi";
import { ENDPOINT_RABBIT_BINDINGS, ENDPOINT_RABBIT_EXCHANGES, ENDPOINT_RABBIT_QUEUES } from "@/api/endpoints";
import { useCollection } from "@/hooks/useCollection";
import { Spinner } from "@/components/Spinner";
import { ConfirmDelete } from "@/components/mensajeria/ConfirmDelete";
import { btnDanger, btnPrimary, inputClass, labelClass, tdClass, thClass } from "@/components/ui";
import { apiErrorMessage } from "@/lib/format";
import type { RabbitBinding, RabbitBindingInput, RabbitExchange, RabbitQueue } from "@/types";

function bindingKey(b: RabbitBindingInput): string {
  return `${b.source}|${b.destinationType}|${b.destination}|${b.routingKey}`;
}

export function BindingsPanel() {
  const api = useApi();
  const { data: bindings, loading, error, reload } = useCollection<RabbitBinding>(
    useCallback(() => api.get<RabbitBinding[]>(ENDPOINT_RABBIT_BINDINGS), [api]),
  );
  const { data: exchanges } = useCollection<RabbitExchange>(
    useCallback(() => api.get<RabbitExchange[]>(ENDPOINT_RABBIT_EXCHANGES, { toast: false }), [api]),
  );
  const { data: colas } = useCollection<RabbitQueue>(
    useCallback(() => api.get<RabbitQueue[]>(ENDPOINT_RABBIT_QUEUES, { toast: false }), [api]),
  );

  const [form, setForm] = useState<RabbitBindingInput>({
    source: "",
    destination: "",
    destinationType: "queue",
    routingKey: "",
  });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<RabbitBinding | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const destinos =
    form.destinationType === "queue" ? colas.map((c) => c.name) : exchanges.map((e) => e.name);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setFormError(null);
    try {
      await api.post(ENDPOINT_RABBIT_BINDINGS, form);
      toast.success(`Binding ${form.source} → ${form.destination} creado`);
      setForm((current) => ({ ...current, routingKey: "" }));
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
    const query = new URLSearchParams({
      source: deleting.source,
      destination: deleting.destination,
      destinationType: deleting.destinationType,
      routingKey: deleting.routingKey,
    });
    try {
      await api.del(`${ENDPOINT_RABBIT_BINDINGS}?${query.toString()}`);
      toast.success("Binding eliminado");
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
        <h2 className="mb-3 text-lg font-semibold text-white">Nuevo binding</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className={labelClass} htmlFor="b-source">Exchange origen *</label>
            <select
              id="b-source"
              className={inputClass}
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            >
              <option value="">Selecciona...</option>
              {exchanges.map((ex) => (
                <option key={ex.name} value={ex.name}>{ex.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="b-type">Tipo destino</label>
            <select
              id="b-type"
              className={inputClass}
              value={form.destinationType}
              onChange={(e) =>
                setForm({ ...form, destinationType: e.target.value as "queue" | "exchange", destination: "" })
              }
            >
              <option value="queue">Cola</option>
              <option value="exchange">Exchange</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="b-dest">Destino *</label>
            <select
              id="b-dest"
              className={inputClass}
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
            >
              <option value="">Selecciona...</option>
              {destinos.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="b-rk">Routing key</label>
            <input
              id="b-rk"
              className={inputClass}
              value={form.routingKey}
              onChange={(e) => setForm({ ...form, routingKey: e.target.value })}
              placeholder="ej: pedido.#"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className={`${btnPrimary} w-full`}
              disabled={creating || !form.source || !form.destination}
            >
              {creating ? "Creando..." : "Crear binding"}
            </button>
          </div>
        </div>
        {formError && (
          <p className="mt-3 rounded-md border border-red-900 bg-red-950 p-3 text-sm text-red-300">{formError}</p>
        )}
      </form>

      {error && <p className="rounded-md border border-red-900 bg-red-950 p-3 text-sm text-red-300">{error}</p>}

      {loading ? (
        <Spinner label="Cargando bindings..." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className={thClass}>Origen</th>
                <th className={thClass}>Routing key / argumentos</th>
                <th className={thClass}>Destino</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody>
              {bindings.map((b) => (
                <tr key={bindingKey(b) + JSON.stringify(b.arguments)} className="border-b border-gray-800 last:border-0">
                  <td className={`${tdClass} font-mono text-xs text-white`}>{b.source}</td>
                  <td className={`${tdClass} font-mono text-xs text-blue-300`}>
                    {b.routingKey || (Object.keys(b.arguments).length > 0 ? JSON.stringify(b.arguments) : "(vacía)")}
                  </td>
                  <td className={tdClass}>
                    <p className="font-mono text-xs text-white">{b.destination}</p>
                    <p className="text-xs text-gray-500">
                      {b.destinationType === "queue" ? "cola" : "exchange"}
                      {b.protected && " · topología base"}
                    </p>
                  </td>
                  <td className={`${tdClass} text-right`}>
                    {!b.protected && (
                      <button
                        type="button"
                        className={btnDanger}
                        onClick={() => {
                          setDeleteError(null);
                          setDeleting(b);
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
          title="Eliminar binding"
          submitting={submitting}
          error={deleteError}
          onCancel={() => setDeleting(null)}
          onConfirm={() => void handleDelete()}
        >
          ¿Eliminar el binding <span className="font-mono text-white">{deleting.source}</span> →{" "}
          <span className="font-mono text-white">{deleting.destination}</span>
          {deleting.routingKey && (
            <>
              {" "}con routing key <span className="font-mono text-blue-300">{deleting.routingKey}</span>
            </>
          )}
          ?
        </ConfirmDelete>
      )}
    </div>
  );
}
