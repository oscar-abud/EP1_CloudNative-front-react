import { create } from "zustand";
import { InteractionRequiredAuthError, type AccountInfo } from "@azure/msal-browser";
import { msalInstance } from "@/auth/msalInstance";
import { loginRequest, apiTokenRequest } from "@/auth/authConfig";
import { rolesFromAccessToken } from "@/auth/claims";
import type { AppRole } from "@/auth/roles";

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Error desconocido al autenticar con Microsoft Entra ID";
}

interface AuthState {
  account: AccountInfo | null;
  token: string | null;
  roles: AppRole[];
  loading: boolean;
  error: string | null;
  init: () => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  hasRole: (...roles: AppRole[]) => boolean;
}

// Estado global de autenticación (Zustand). Reemplaza los antiguos
// TokenProvider + RolesProvider: una sola fuente de verdad para
// cuenta, token y roles, sin Context ni Providers anidados.
export const useAuthStore = create<AuthState>((set, get) => ({
  account: null,
  token: null,
  roles: [],
  loading: false,
  error: null,

  // Se llama una vez al arrancar la app, después de inicializar MSAL.
  init: () => {
    const account = msalInstance.getActiveAccount();
    set({ account });
    if (account) {
      void get().loadToken();
    }
  },

  // Redirige la pestaña actual a Microsoft (misma pantalla, sin popup).
  // Al volver, main.tsx procesa la respuesta y llama a init().
  login: async () => {
    await msalInstance.loginRedirect(loginRequest);
  },

  logout: async () => {
    await msalInstance.logoutRedirect();
  },

  // Pide el Access Token para el API Gateway: primero en silencio,
  // y si Entra ID lo requiere, muestra el popup de login.
  loadToken: async () => {
    const account = get().account;
    if (!account) {
      return;
    }

    set({ loading: true, error: null });
    const request = { ...apiTokenRequest, account };

    try {
      const result = await msalInstance.acquireTokenSilent(request);
      set({ token: result.accessToken, roles: rolesFromAccessToken(result.accessToken) });
    } catch (silentError) {
      if (!(silentError instanceof InteractionRequiredAuthError)) {
        set({ error: toMessage(silentError) });
        return;
      }
      try {
        const result = await msalInstance.acquireTokenPopup(request);
        set({ token: result.accessToken, roles: rolesFromAccessToken(result.accessToken) });
      } catch (popupError) {
        set({ error: toMessage(popupError), token: null });
      }
    } finally {
      set({ loading: false });
    }
  },

  hasRole: (...roles) => roles.some((role) => get().roles.includes(role)),
}));
