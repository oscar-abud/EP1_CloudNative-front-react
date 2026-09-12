import { useCallback, useMemo } from "react";
import { fetchData } from "@/service/api";
import { useAuthStore } from "@/store/authStore";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiClient {
  get: <T>(path: string) => Promise<T>;
  post: <T>(path: string, body?: unknown) => Promise<T>;
  put: <T>(path: string, body?: unknown) => Promise<T>;
  patch: <T>(path: string, body?: unknown) => Promise<T>;
  del: <T>(path: string) => Promise<T>;
  ready: boolean;
  refreshing: boolean;
  error: string | null;
}

// fetchData espera el endpoint SIN "/" inicial (arma la URL como
// `${API_URL}/${endpoint}`); nuestras rutas (ENDPOINT_PRODUCTOS, etc.) sí
// llevan el "/" adelante para usarse en React Router, así que se recorta acá.
function toFetchDataEndpoint(path: string): string {
  return path.replace(/^\/+/, "");
}

export function useApi(): ApiClient {
  const token = useAuthStore((state) => state.token);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const loadToken = useAuthStore((state) => state.loadToken);

  const send = useCallback(
    async <T,>(method: Method, path: string, body?: unknown): Promise<T> => {
      // Asegura que haya un token fresco (y espejado en localStorage) antes
      // de que fetchData arme el header Authorization.
      if (!useAuthStore.getState().token) {
        await loadToken();
      }

      return (await fetchData(toFetchDataEndpoint(path), method, undefined, body)) as T;
    },
    [loadToken],
  );

  return useMemo<ApiClient>(
    () => ({
      get: (path) => send("GET", path),
      post: (path, body) => send("POST", path, body),
      put: (path, body) => send("PUT", path, body),
      patch: (path, body) => send("PATCH", path, body),
      del: (path) => send("DELETE", path),
      ready: Boolean(token),
      refreshing: loading,
      error,
    }),
    [send, token, loading, error],
  );
}
