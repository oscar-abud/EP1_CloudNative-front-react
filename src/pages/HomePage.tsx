import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { displayNameFromAccount } from "@/auth/claims";
import { ROLE_LABELS } from "@/auth/roles";
import { btnPrimary, btnSecondary } from "@/components/ui";
import { isConfigured } from "@/config/env";

export function HomePage() {
  const account = useAuthStore((state) => state.account);
  const roles = useAuthStore((state) => state.roles);
  const token = useAuthStore((state) => state.token);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(new Date().toLocaleTimeString("es-CL"));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const name = displayNameFromAccount(account);
  const roleLabels = roles.length > 0 ? roles.map((role) => ROLE_LABELS[role]).join(", ") : "Sin rol asignado";

  const steps = [
    ["1. Auth Login", "MSAL redirige a Microsoft Entra ID. Recibes el JWT de acceso."],
    ["2. Request HTTP", "React llama al API Gateway con Authorization: Bearer <JWT>."],
    ["3. Valida JWKS", "El Gateway verifica firma, vigencia, iss y aud contra Entra ID."],
    ["4. Proxy Request", "Con token válido, el Gateway reenvía al backend Express/NestJS."],
    ["5. SQL / CRUD", "El backend autoriza por rol (Admin, Operador, Cliente) y usa Supabase."],
  ] as const;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h1 className="text-2xl font-bold text-white">
          Hola, {name || "usuario"} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Rol: <span className="font-medium text-blue-300">{roleLabels}</span>
        </p>
        <p className="mt-4 text-sm text-gray-300">
          Bienvenido al catálogo de productos y gestión de pedidos (Pedidos360).
          Explora <Link to="/productos" className="text-blue-400 hover:underline">Productos</Link> y{" "}
          <Link to="/pedidos" className="text-blue-400 hover:underline">Pedidos</Link> según tu rol.
        </p>

        {!isConfigured && (
          <p className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            La app aún no está conectada. Completa las variables de entorno en
            tu archivo <code className="font-mono">.env</code> (ver{` `}
            <code className="font-mono">.env.example</code>) y reinicia el dev server.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-1 text-lg font-semibold text-white">Estado del Access Token</h2>
        <p className="mb-3 text-sm text-gray-400">
          El token se adquiere en silencio y se adjunta en cada petición al API Gateway.
        </p>
        {loading ? (
          <p className="text-sm text-gray-300">Adquiriendo token de Entra ID...</p>
        ) : token ? (
          <p className="text-sm text-emerald-300">
            ✓ Token obtenido por {account?.username ?? "la cuenta activa"}
          </p>
        ) : (
          <p className="text-sm text-amber-300">
            {error ?? "No se ha obtenido token todavía."}
          </p>
        )}
        <p className="mt-2 text-sm text-gray-500">
          {clock}
        </p>
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Flujo de la arquitectura EP1</h2>
        <ol className="space-y-3">
          {steps.map(([title, description]) => (
            <li key={title} className="flex gap-4">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {title.split(".")[0]}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-200">{title}</p>
                <p className="text-sm text-gray-400">{description}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex gap-2">
          <Link to="/productos" className={btnPrimary}>
            Ver productos
          </Link>
          <Link to="/pedidos" className={btnSecondary}>
            Ver pedidos
          </Link>
        </div>
      </section>
    </div>
  );
}