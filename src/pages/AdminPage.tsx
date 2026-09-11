import { useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { decodeJwt } from "@/auth/claims";
import { ROLE_LABELS } from "@/auth/roles";
import { RoleGate } from "@/components/RoleGate";
import { ROLES } from "@/auth/roles";

function ClaimRow({ name, value }: { name: string; value: unknown }) {
  return (
    <tr className="border-b border-gray-800 last:border-0">
      <td className="px-3 py-2 align-top font-mono text-xs text-blue-300">{name}</td>
      <td className="break-all px-3 py-2 font-mono text-xs text-gray-300">
        {typeof value === "string" ? value : JSON.stringify(value)}
      </td>
    </tr>
  );
}

export function AdminPage() {
  const account = useAuthStore((state) => state.account);
  const roles = useAuthStore((state) => state.roles);
  const token = useAuthStore((state) => state.token);
  const refreshing = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);

  const accessClaims = useMemo(
    () => (token ? decodeJwt(token) : null),
    [token],
  );

  const claims = accessClaims ? Object.entries(accessClaims) : [];

  return (
    <RoleGate roles={[ROLES.ADMIN]}>
      <div className="space-y-4">
        <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h1 className="text-2xl font-bold text-white">Panel Admin</h1>
          <p className="mt-1 text-sm text-gray-400">
            Diagnóstico de seguridad: claims del JWT emitido por Entra ID y
            validado por el API Gateway.
          </p>
        </section>

        <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-3 text-lg font-semibold text-white">Roles detectados</h2>
          {roles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1 text-sm text-blue-300"
                >
                  {ROLE_LABELS[role]} <span className="text-blue-500">({role})</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-amber-300">
              No se detectaron roles. Asigna el rol {ROLES.ADMIN} al usuario en
              Entra ID (app roles) y vuelve a iniciar sesión.
            </p>
          )}
          <p className="mt-3 text-sm text-gray-500">
            La autorización también se aplica en el backend por rol, no solo en
            esta UI.
          </p>
        </section>

        <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">Claims del Access Token</h2>
          <p className="mb-3 text-sm text-gray-400">
            Decodificados en el cliente para depuración (el Gateway los valida
            con JWKS; aquí no se verifican).
          </p>
          {refreshing ? (
            <p className="text-sm text-gray-300">Adquiriendo token...</p>
          ) : error ? (
            <p className="text-sm text-amber-300">{error}</p>
          ) : accessClaims ? (
            <div className="overflow-x-auto rounded-lg border border-gray-800">
              <table className="w-full">
                <tbody>
                  {claims.map(([claim, value]) => (
                    <ClaimRow key={claim} name={claim} value={value} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Sin token aún. Realiza una petición a /productos o /pedidos.
            </p>
          )}
          <p className="mt-3 text-xs text-gray-600">
            Cuenta activa: {account?.username ?? "—"}
          </p>
        </section>
      </div>
    </RoleGate>
  );
}