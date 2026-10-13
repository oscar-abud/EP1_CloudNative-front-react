import type { ReactNode } from "react";
import { Modal } from "@/components/Modal";
import { btnSecondary } from "@/components/ui";

interface ConfirmDeleteProps {
  title: string;
  children: ReactNode;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDelete({ title, children, submitting, error, onCancel, onConfirm }: ConfirmDeleteProps) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="text-sm text-gray-300">{children}</div>
      {error && (
        <p className="mt-3 rounded-md border border-red-900 bg-red-950 p-3 text-sm text-red-300">{error}</p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className={btnSecondary} onClick={onCancel}>
          Cancelar
        </button>
        <button
          type="button"
          className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
          disabled={submitting}
          onClick={onConfirm}
        >
          {submitting ? "Eliminando..." : "Eliminar"}
        </button>
      </div>
    </Modal>
  );
}
