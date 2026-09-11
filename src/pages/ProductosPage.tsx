import { useCallback, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { canManageRoles } from "@/auth/roles";
import { useApi } from "@/api/useApi";
import { ENDPOINT_PRODUCTOS } from "@/api/endpoints";
import { useCollection } from "@/hooks/useCollection";
import { Spinner } from "@/components/Spinner";
import { Modal } from "@/components/Modal";
import { ProductoForm } from "@/components/ProductoForm";
import { btnPrimary, btnDanger, tdClass, thClass } from "@/components/ui";
import { errorMessage, formatPrice } from "@/lib/format";
import type { Producto, ProductoInput } from "@/types";

export function ProductosPage() {
  const api = useApi();
  const canManage = useAuthStore((state) => canManageRoles(state.roles));
  const { data: productos, loading, error, reload } = useCollection<Producto>(
    useCallback(() => api.get<Producto[]>(ENDPOINT_PRODUCTOS), [api]),
  );

  const [modal, setModal] = useState<"closed" | "create" | "edit">("closed");
  const [editing, setEditing] = useState<Producto | null>(null);
  const [deleting, setDeleting] = useState<Producto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setModal("create");
  }

  function openEdit(producto: Producto) {
    setEditing(producto);
    setFormError(null);
    setModal("edit");
  }

  function closeModal() {
    setModal("closed");
    setEditing(null);
    setFormError(null);
  }

  async function handleSubmit(data: ProductoInput) {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) {
        await api.put<Producto>(`${ENDPOINT_PRODUCTOS}/${editing.id}`, data);
      } else {
        await api.post<Producto>(ENDPOINT_PRODUCTOS, data);
      }
      closeModal();
      reload();
    } catch (submitError) {
      setFormError(errorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) {
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await api.del(`${ENDPOINT_PRODUCTOS}/${deleting.id}`);
      setDeleting(null);
      reload();
    } catch (deleteError) {
      setFormError(errorMessage(deleteError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Catálogo de Productos</h1>
          <p className="text-sm text-gray-400">
            {canManage
              ? "Podrás crear, editar y eliminar productos."
              : "Solo lectura para tu rol."}
          </p>
        </div>
        {canManage && (
          <button type="button" className={btnPrimary} onClick={openCreate}>
            + Nuevo producto
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-md border border-red-900 bg-red-950 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <Spinner label="Cargando productos..." />
      ) : productos.length === 0 ? (
        <p className="rounded-lg border border-gray-800 bg-gray-900 p-6 text-sm text-gray-400">
          No hay productos para mostrar.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className={thClass}>Nombre</th>
                <th className={thClass}>Categoría</th>
                <th className={`${thClass} text-right`}>Precio</th>
                <th className={`${thClass} text-right`}>Stock</th>
                <th className={thClass}>Estado</th>
                {canManage && <th className={thClass}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => (
                <tr key={producto.id} className="border-b border-gray-800 last:border-0">
                  <td className={tdClass}>
                    <p className="font-medium text-white">{producto.nombre}</p>
                    {producto.descripcion && (
                      <p className="text-xs text-gray-500">{producto.descripcion}</p>
                    )}
                  </td>
                  <td className={tdClass}>
                    <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
                      {producto.categoria || "Sin categoría"}
                    </span>
                  </td>
                  <td className={`${tdClass} text-right font-medium text-emerald-300`}>
                    {formatPrice(producto.precio)}
                  </td>
                  <td className={`${tdClass} text-right`}>
                    <span className={producto.stock <= 5 ? "text-red-300" : "text-gray-200"}>
                      {producto.stock}
                    </span>
                  </td>
                  <td className={tdClass}>
                    <span
                      className={
                        producto.activo
                          ? "text-emerald-300"
                          : "text-gray-500"
                      }
                    >
                      {producto.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  {canManage && (
                    <td className={tdClass}>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-gray-700 px-2 py-1 text-xs text-gray-200 hover:bg-gray-800"
                          onClick={() => openEdit(producto)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={btnDanger}
                          onClick={() => {
                            setDeleting(producto);
                            setFormError(null);
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(modal === "create" || modal === "edit") && (
        <Modal
          title={modal === "edit" ? "Editar producto" : "Nuevo producto"}
          onClose={closeModal}
        >
          <ProductoForm
            initial={editing}
            submitting={submitting}
            error={formError}
            onCancel={closeModal}
            onSubmit={(data) => void handleSubmit(data)}
          />
        </Modal>
      )}

      {deleting && (
        <Modal
          title="Eliminar producto"
          onClose={() => setDeleting(null)}
        >
          <p className="text-sm text-gray-300">
            ¿Confirmas que deseas eliminar{" "}
            <span className="font-medium text-white">{deleting.nombre}</span>?
            Esta acción no se puede deshacer.
          </p>
          {formError && (
            <p className="mt-3 rounded-md border border-red-900 bg-red-950 p-3 text-sm text-red-300">
              {formError}
            </p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
              onClick={() => setDeleting(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
              disabled={submitting}
              onClick={() => void handleDelete()}
            >
              {submitting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}