import { Link } from "react-router-dom";
import { btnPrimary } from "@/components/ui";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="text-6xl font-bold text-gray-700">404</p>
      <h1 className="text-xl font-semibold text-white">Página no encontrada</h1>
      <Link to="/" className={btnPrimary}>
        Volver al inicio
      </Link>
    </div>
  );
}