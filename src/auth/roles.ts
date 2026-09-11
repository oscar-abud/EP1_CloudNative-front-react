export const ROLES = {
  ADMIN: "Admin",
  OPERADOR: "Operador",
  CLIENTE: "Cliente",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<AppRole, string> = {
  Admin: "Administrador",
  Operador: "Operador",
  Cliente: "Cliente",
};

export function isAppRole(value: string): value is AppRole {
  return Object.values(ROLES).includes(value as AppRole);
}

export function isAdminRole(roles: AppRole[]): boolean {
  return roles.includes(ROLES.ADMIN);
}

export function canManageRoles(roles: AppRole[]): boolean {
  return roles.includes(ROLES.ADMIN) || roles.includes(ROLES.OPERADOR);
}
