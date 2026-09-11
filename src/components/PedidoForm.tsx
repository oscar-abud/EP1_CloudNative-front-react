import { useMemo, useState } from "react";
import { PEDIDO_ESTADOS, type Pedido, type PedidoEstado, type PedidoInput, type Producto } from "@/types";
import { btnPrimary, btnSecondary, inputClass, labelClass } from "@/components/ui";

interface CarritoItem {
  productoId: string;
  cantidad: number;
}

interface PedidoFormProps {
  productos: Producto[];
  initial?: Pedido | null;
  permiteEstado: boolean;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (data: PedidoInput) => void;
}

const estadoLabels: Record<PedidoEstado, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export function PedidoForm({
  productos,
  initial,
  permiteEstado,
  submitting,
  error,
  onCancel,
  onSubmit,
}: PedidoFormProps) {
  const [clienteNombre, setClienteNombre] = useState(initial?.clienteNombre ?? "");
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [items, setItems] = useState<CarritoItem[]>(
    () => initial?.items.map((item) => ({ productoId: item.productoId, cantidad: item.cantidad })) ?? [],
  );
  const [estado, setEstado] = useState<PedidoEstado>(initial?.estado ?? "pendiente");

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const producto = productos.find((p) => p.id === item.productoId);
      return sum + (producto ? producto.precio * item.cantidad : 0);
    }, 0);
  }, [items, productos]);

  const activos = productos.filter((producto) => producto.activo);

  function handleAgregar() {
    if (!productoId || Number(cantidad) <= 0) {
      return;
    }
    setItems((current) => {
      const exists = current.find((item) => item.productoId === productoId);
      if (exists) {
        return current.map((item) =>
          item.productoId === productoId
            ? { ...item, cantidad: item.cantidad + Number(cantidad) }
            : item,
        );
      }
      return [...current, { productoId, cantidad: Number(cantidad) }];
    });
    setCantidad("1");
  }

  function handleQuitar(productoIdToRemove: string) {
    setItems((current) => current.filter((item) => item.productoId !== productoIdToRemove));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (items.length === 0 || clienteNombre.trim() === "") {
      return;
    }
    onSubmit({
      clienteNombre: clienteNombre.trim(),
      items,
      estado,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="pedido-cliente">
          Cliente *
        </label>
        <input
          id="pedido-cliente"
          className={inputClass}
          value={clienteNombre}
          onChange={(event) => setClienteNombre(event.target.value)}
          placeholder="Nombre o razón social"
        />
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
        <div className="mb-3 grid grid-cols-[1fr_100px_auto] items-end gap-2">
          <div>
            <label className={labelClass} htmlFor="pedido-producto">
              Producto
            </label>
            <select
              id="pedido-producto"
              className={inputClass}
              value={productoId}
              disabled={activos.length === 0}
              onChange={(event) => setProductoId(event.target.value)}
            >
              <option value="">
                {activos.length === 0 ? "No hay productos activos" : "Selecciona un producto"}
              </option>
              {activos.map((producto) => (
                <option key={producto.id} value={producto.id}>
                  {producto.nombre} — ${producto.precio.toLocaleString("es-CL")} (stock {producto.stock})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="pedido-cantidad">
              Cantidad
            </label>
            <input
              id="pedido-cantidad"
              type="number"
              min="1"
              className={inputClass}
              value={cantidad}
              onChange={(event) => setCantidad(event.target.value)}
            />
          </div>
          <button
            type="button"
            className="rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700"
            onClick={handleAgregar}
          >
            Agregar
          </button>
        </div>

        {items.length > 0 ? (
          <table className="w-full text-sm">
            <tbody>
              {items.map((item) => {
                const producto = productos.find((p) => p.id === item.productoId);
                return (
                  <tr key={item.productoId} className="border-t border-gray-800">
                    <td className="py-2 text-gray-200">{producto?.nombre ?? "Desconocido"}</td>
                    <td className="py-2 text-gray-400">x{item.cantidad}</td>
                    <td className="py-2 text-right text-gray-200">
                      ${((producto?.precio ?? 0) * item.cantidad).toLocaleString("es-CL")}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        className="text-xs text-red-400 hover:text-red-300"
                        onClick={() => handleQuitar(item.productoId)}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-500">Sin productos agregados.</p>
        )}
        <p className="mt-3 text-right text-lg font-semibold text-white">
          Total: ${total.toLocaleString("es-CL")}
        </p>
      </div>

      {permiteEstado && (
        <div>
          <label className={labelClass} htmlFor="pedido-estado">
            Estado
          </label>
          <select
            id="pedido-estado"
            className={inputClass}
            value={estado}
            onChange={(event) => setEstado(event.target.value as PedidoEstado)}
          >
            {PEDIDO_ESTADOS.map((estadoOption) => (
              <option key={estadoOption} value={estadoOption}>
                {estadoLabels[estadoOption]}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p className="rounded-md border border-red-900 bg-red-950 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" className={btnSecondary} disabled={submitting} onClick={onCancel}>
          Cancelar
        </button>
        <button
          type="submit"
          className={btnPrimary}
          disabled={submitting || items.length === 0 || clienteNombre.trim() === ""}
        >
          {submitting ? "Guardando..." : initial ? "Actualizar" : "Crear pedido"}
        </button>
      </div>
    </form>
  );
}