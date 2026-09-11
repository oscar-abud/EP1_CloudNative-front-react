import type { ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";
import type { AppRole } from "@/auth/roles";

interface RoleGateProps {
  roles: AppRole[];
  children: ReactNode;
}

export function RoleGate({ roles, children }: RoleGateProps) {
  const hasRole = useAuthStore((state) => state.hasRole);
  const allowed = hasRole(...roles);

  return allowed ? (
    children
  ) : (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
      No tienes permiso para ver este contenido. Rol requerido:{" "}
      {roles.join(" o ")}.
    </div>
  );
}
