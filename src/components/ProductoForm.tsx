import { useState } from "react";
import type { Producto, ProductoInput } from "@/types";
import { btnPrimary, btnSecondary, inputClass, labelClass } from "@/components/ui";

interface ProductoFormProps {
  initial?: Producto | null;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (data: ProductoInput) => void;
}

export function ProductoForm({
  initial,
  submitting,
  error,
  onCancel,
  onSubmit,
}: ProductoFormProps) {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [precio, setPrecio] = useState(initial ? String(initial.precio) : "");
  const [stock, setStock] = useState(initial ? String(initial.stock) : "");
  const [categoria, setCategoria] = useState(initial?.categoria ?? "");
  const [activo, setActivo] = useState(initial?.activo ?? true);

  const canSubmit =
    nombre.trim() !== "" && precio !== "" && !Number.isNaN(Number(precio));

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    onSubmit({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio: Number(precio),
      stock: Number(stock) || 0,
      categoria: categoria.trim(),
      activo,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="producto-nombre">
          Nombre *
        </label>
        <input
          id="producto-nombre"
          className={inputClass}
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          placeholder="Ej: Silla ejecutiva"
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="producto-descripcion">
          Descripción
        </label>
        <textarea
          id="producto-descripcion"
          className={inputClass}
          rows={3}
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="producto-precio">
            Precio (CLP) *
          </label>
          <input
            id="producto-precio"
            type="number"
            min="0"
            className={inputClass}
            value={precio}
            onChange={(event) => setPrecio(event.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="producto-stock">
            Stock
          </label>
          <input
            id="producto-stock"
            type="number"
            min="0"
            className={inputClass}
            value={stock}
            onChange={(event) => setStock(event.target.value)}
          />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="producto-categoria">
          Categoría
        </label>
        <input
          id="producto-categoria"
          className={inputClass}
          value={categoria}
          onChange={(event) => setCategoria(event.target.value)}
          placeholder="Ej: Oficina"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={activo}
          onChange={(event) => setActivo(event.target.checked)}
          className="h-4 w-4"
        />
        Producto activo
      </label>
      {error && (
        <p className="rounded-md border border-red-900 bg-red-950 p-3 text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" className={btnSecondary} disabled={submitting} onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className={btnPrimary} disabled={submitting || !canSubmit}>
          {submitting ? "Guardando..." : initial ? "Actualizar" : "Crear"}
        </button>
      </div>
    </form>
  );
}