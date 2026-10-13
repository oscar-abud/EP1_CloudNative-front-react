import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useApi } from "@/api/useApi";
import { ENDPOINT_RABBIT_EXCHANGES } from "@/api/endpoints";
import { useCollection } from "@/hooks/useCollection";
import { Spinner } from "@/components/Spinner";
import { ConfirmDelete } from "@/components/mensajeria/ConfirmDelete";
import { btnDanger, btnPrimary, inputClass, labelClass, tdClass, thClass } from "@/components/ui";
import { apiErrorMessage } from "@/lib/format";
import { EXCHANGE_TYPES, type ExchangeType, type RabbitExchange, type RabbitExchangeInput } from "@/types";

export function ExchangesPanel() {
  const api = useApi();
  const { data: exchanges, loading, error, reload } = useCollection<RabbitExchange>(
    useCallback(() => api.get<RabbitExchange[]>(ENDPOINT_RABBIT_EXCHANGES), [api]),
  );

  const [name, setName] = useState("");
  const [type, setType] = useState<ExchangeType>("topic");
  const [durable, setDurable] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<RabbitExchange | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setFormError(null);
    const body: RabbitExchangeInput = { name: name.trim(), type, durable };
    try {
      await api.post(ENDPOINT_RABBIT_EXCHANGES, body);
      toast.success(`Exchange ${body.name} (${type}) creado`);
      setName("");
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
      await api.del(`${ENDPOINT_RABBIT_EXCHANGES}/${encodeURIComponent(deleting.name)}`);
      toast.success(`Exchange ${deleting.name} eliminado`);
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
        <h2 className="mb-3 text-lg font-semibold text-white">Nuevo exchange</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="ex-nombre">Nombre *</label>
            <input
              id="ex-nombre"
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej: pedidos.facturacion"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="ex-tipo">Tipo *</label>
            <select id="ex-tipo" className={inputClass} value={type} onChange={(e) => setType(e.target.value as ExchangeType)}>
              {EXCHANGE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 pb-2 text-sm text-gray-300">
              <input type="checkbox" checked={durable} onChange={(e) => setDurable(e.target.checked)} className="h-4 w-4" />
              Durable
            </label>
            <button type="submit" className={`${btnPrimary} flex-1`} disabled={creating || name.trim() === ""}>
              {creating ? "Creando..." : "Crear"}
            </button>
          </div>
        </div>
        {formError && (
          <p className="mt-3 rounded-md border border-red-900 bg-red-950 p-3 text-sm text-red-300">{formError}</p>
        )}
      </form>

      {error && <p className="rounded-md border border-red-900 bg-red-950 p-3 text-sm text-red-300">{error}</p>}

      {loading ? (
        <Spinner label="Cargando exchanges..." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className={thClass}>Exchange</th>
                <th className={thClass}>Tipo</th>
                <th className={thClass}>Durable</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody>
              {exchanges.map((ex) => (
                <tr key={ex.name} className="border-b border-gray-800 last:border-0">
                  <td className={tdClass}>
                    <p className="font-mono text-xs text-white">{ex.name}</p>
                    {ex.protected && <p className="text-xs text-gray-500">topología base</p>}
                  </td>
                  <td className={tdClass}>
                    <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-300">{ex.type}</span>
                  </td>
                  <td className={tdClass}>{ex.durable ? "Sí" : "No"}</td>
                  <td className={`${tdClass} text-right`}>
                    {!ex.protected && (
                      <button
                        type="button"
                        className={btnDanger}
                        onClick={() => {
                          setDeleteError(null);
                          setDeleting(ex);
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
          title="Eliminar exchange"
          submitting={submitting}
          error={deleteError}
          onCancel={() => setDeleting(null)}
          onConfirm={() => void handleDelete()}
        >
          ¿Eliminar el exchange <span className="font-mono text-white">{deleting.name}</span>? Sus bindings
          también se eliminan.
        </ConfirmDelete>
      )}
    </div>
  );
}
