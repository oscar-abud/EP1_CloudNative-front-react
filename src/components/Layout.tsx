import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { displayNameFromAccount } from "@/auth/claims";
import { ROLES, ROLE_LABELS, isAdminRole } from "@/auth/roles";
import { SignOutButton } from "@/components/SignOutButton";

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-blue-600 text-white"
      : "text-gray-300 hover:bg-gray-800 hover:text-white"
  }`;
}

export function Layout() {
  const account = useAuthStore((state) => state.account);
  const roles = useAuthStore((state) => state.roles);
  const name = displayNameFromAccount(account);
  const isAdmin = isAdminRole(roles);
  const roleLabels = roles.map((role) => ROLE_LABELS[role]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <span className="text-lg font-bold text-white">
            Pedidos<span className="text-blue-400">360</span>
          </span>
          <nav className="flex items-center gap-1">
            <NavLink to="/" className={navLinkClass} end>
              Inicio
            </NavLink>
            <NavLink to="/productos" className={navLinkClass}>
              Productos
            </NavLink>
            <NavLink to="/pedidos" className={navLinkClass}>
              Pedidos
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={navLinkClass}>
                Admin
              </NavLink>
            )}
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-gray-200">{name}</p>
              <p className="text-xs text-gray-500">
                {roleLabels.length > 0 ? roleLabels.join(", ") : "Sin rol asignado"}
              </p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <footer className="mt-8 border-t border-gray-800 py-4">
        <p className="mx-auto max-w-6xl px-4 text-xs text-gray-600">
          EP1 · React + MSAL &rarr; Entra ID &rarr; AWS API Gateway (JWT
          Authorizer) &rarr; Backend &rarr; Supabase/PostgreSQL. Roles:{" "}
          {ROLES.ADMIN}, {ROLES.OPERADOR}, {ROLES.CLIENTE}.
        </p>
      </footer>
    </div>
  );
}
