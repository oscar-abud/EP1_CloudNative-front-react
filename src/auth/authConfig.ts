import type { RedirectRequest, SilentRequest } from "@azure/msal-browser";
import { env } from "@/config/env";

// Solo scopes de identidad: el login no debe depender de que el scope de la
// API ya exista en Entra ID. Ese scope se pide aparte, en apiTokenRequest,
// cuando de verdad se va a llamar al API Gateway (consentimiento incremental).
export const loginRequest: RedirectRequest = {
  scopes: ["openid", "profile", "email"],
};

export const apiTokenRequest: SilentRequest = {
  scopes: [env.apiScope].filter(Boolean),
};
