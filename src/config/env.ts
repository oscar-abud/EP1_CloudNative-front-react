const raw = import.meta.env;

function required(value: string | undefined, key: string): string {
  if (!value || value.trim() === "") {
    console.warn(
      `[config] Falta ${key}. Copia .env.example a .env y completa tus datos de Entra ID / API Gateway.`,
    );
    return "";
  }
  return value;
}

export const env = {
  azureClientId: required(raw.VITE_AZURE_CLIENT_ID, "VITE_AZURE_CLIENT_ID"),
  azureTenantId:
    required(raw.VITE_AZURE_TENANT_ID, "VITE_AZURE_TENANT_ID") || "common",
  azureRedirectUri: raw.VITE_AZURE_REDIRECT_URI || window.location.origin,
  apiBaseUrl: (raw.VITE_API_BASE_URL ?? "").replace(/\/+$/, ""),
  apiScope: required(raw.VITE_API_SCOPE, "VITE_API_SCOPE"),
  // Microservicio pedidos360-rabbit-admin. Si no se define, se asume que el
  // API Gateway lo expone bajo la misma URL base (ruta /rabbit/*).
  rabbitAdminUrl: (raw.VITE_RABBIT_ADMIN_URL || raw.VITE_API_BASE_URL || "").replace(/\/+$/, ""),
} as const;

export const isConfigured =
  env.azureClientId !== "" && env.apiBaseUrl !== "" && env.apiScope !== "";
