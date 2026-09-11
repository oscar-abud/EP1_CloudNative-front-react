import { useCallback, useMemo } from "react";
import { apiRequest, ApiError, type ApiRequestOptions } from "@/api/client";
import { useAuthStore } from "@/store/authStore";

type BodyOptions = Omit<ApiRequestOptions, "method">;

export interface ApiClient {
  get: <T>(path: string, options?: BodyOptions) => Promise<T>;
  post: <T>(path: string, body?: unknown, options?: BodyOptions) => Promise<T>;
  put: <T>(path: string, body?: unknown, options?: BodyOptions) => Promise<T>;
  patch: <T>(path: string, body?: unknown, options?: BodyOptions) => Promise<T>;
  del: <T>(path: string, options?: BodyOptions) => Promise<T>;
  ready: boolean;
  refreshing: boolean;
  error: string | null;
}

export function useApi(): ApiClient {
  const token = useAuthStore((state) => state.token);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const loadToken = useAuthStore((state) => state.loadToken);

  const resolveToken = useCallback(async (): Promise<string> => {
    if (token) {
      return token;
    }
    await loadToken();
    const fresh = useAuthStore.getState().token;
    if (!fresh) {
      throw new ApiError(
        "No se pudo obtener el Access Token de Entra ID. Inicia sesión nuevamente.",
        401,
      );
    }
    return fresh;
  }, [token, loadToken]);

  const send = useCallback(
    async <T,>(
      method: ApiRequestOptions["method"],
      path: string,
      body?: unknown,
      options?: BodyOptions,
    ): Promise<T> => {
      const accessToken = await resolveToken();
      return apiRequest<T>(accessToken, path, { ...options, method, body });
    },
    [resolveToken],
  );

  return useMemo<ApiClient>(
    () => ({
      get: (path, options) => send("GET", path, undefined, options),
      post: (path, body, options) => send("POST", path, body, options),
      put: (path, body, options) => send("PUT", path, body, options),
      patch: (path, body, options) => send("PATCH", path, body, options),
      del: (path, options) => send("DELETE", path, undefined, options),
      ready: Boolean(token),
      refreshing: loading,
      error,
    }),
    [send, token, loading, error],
  );
}
