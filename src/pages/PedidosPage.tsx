import { useCallback, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { canManageRoles } from "@/auth/roles";
import { useApi } from "@/api/useApi";
import { useCollection } from "@/hooks/useCollection";
import { Spinner } from "@/components/Spinner";
import { Modal } from "@/components/Modal";
import { PedidoForm } from "@/components/PedidoForm";
import { btnPrimary } from "@/components/ui";
import { errorMessage, formatDate, formatPrice } from "@/lib/format";
import { type Pedido, type PedidoInput, type PedidoEstado, type Producto } from "@/types";

const estadoClass: Record<PedidoEstado, string> = {
  pendiente: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  en_proceso: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  enviado: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  entregado: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  cancelado: "bg-red-500/15 text-red-300 border-red-500/30",
};

const estadoLabels: Record<PedidoEstado, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export function PedidosPage() {
  const api = useApi();
  const canManage = useAuthStore((state) => canManageRoles(state.roles));
  const { data: pedidos, loading, error, reload } = useCollection<Pedido>(
    useCallback(() => api.get<Pedido[]>("/pedidos"), [api]),
  );
  const { data: productos } = useCollection<Producto>(
    useCallback(() => api.get<Producto[]>("/productos"), [api]),
  );

  const [modal, setModal] = useState<"closed" | "create" | "edit">("closed");
  const [editing, setEditing] = useState<Pedido | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setModal("create");
  }

  function openEdit(pedido: Pedido) {
    setEditing(pedido);
    setFormError(null);
    setModal("edit");
  }

  function closeModal() {
    setModal("closed");
    setEditing(null);
    setFormError(null);
  }

  async function handleSubmit(data: PedidoInput) {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) {
        await api.put<Pedido>(`/pedidos/${editing.id}`, data);
      } else {
        await api.post<Pedido>("/pedidos", data);
      }
      closeModal();
      reload();
    } catch (submitError) {
      setFormError(errorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Pedidos</h1>
          <p className="text-sm text-gray-400">
            {canManage
              ? "Puedes crear pedidos y actualizar su estado."
              : "Puedes registrar tus pedidos."}
          </p>
        </div>
        <button type="button" className={btnPrimary} onClick={openCreate}>
          + Nuevo pedido
        </button>
      </div>

      {error && (
        <p className="rounded-md border border-red-900 bg-red-950 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <Spinner label="Cargando pedidos..." />
      ) : pedidos.length === 0 ? (
        <p className="rounded-lg border border-gray-800 bg-gray-900 p-6 text-sm text-gray-400">
          No hay pedidos para mostrar.
        </p>
      ) : (
        <div className="space-y-3">
          {pedidos.map((pedido) => (
            <div
              key={pedido.id}
              className="rounded-xl border border-gray-800 bg-gray-900 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">
                    Pedido #{pedido.id.slice(0, 8)}
                  </p>
                  <p className="text-sm text-gray-400">{pedido.clienteNombre}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${estadoClass[pedido.estado]}`}
                  >
                    {estadoLabels[pedido.estado]}
                  </span>
                  <span className="text-sm font-semibold text-emerald-300">
                    {formatPrice(pedido.total)}
                  </span>
                </div>
              </div>
              <ul className="mt-3 space-y-1">
                {pedido.items.map((item) => (
                  <li key={item.productoId} className="flex justify-between text-sm">
                    <span className="text-gray-300">
                      {item.nombre} <span className="text-gray-500">x{item.cantidad}</span>
                    </span>
                    <span className="text-gray-400">
                      {formatPrice(item.precioUnitario * item.cantidad)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between">
                {pedido.createdAt && (
                  <span className="text-xs text-gray-600">{formatDate(pedido.createdAt)}</span>
                )}
                {canManage && (
                  <button
                    type="button"
                    className="rounded-md border border-gray-700 px-2 py-1 text-xs text-gray-200 hover:bg-gray-800"
                    onClick={() => openEdit(pedido)}
                  >
                    Cambiar estado
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === "create" || modal === "edit") && (
        <Modal
          title={modal === "edit" ? "Actualizar pedido" : "Nuevo pedido"}
          onClose={closeModal}
        >
          <PedidoForm
            productos={productos}
            initial={editing}
            permiteEstado={canManage}
            submitting={submitting}
            error={formError}
            onCancel={closeModal}
            onSubmit={(data) => void handleSubmit(data)}
          />
        </Modal>
      )}
    </div>
  );
}