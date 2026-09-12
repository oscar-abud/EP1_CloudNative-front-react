import axios, { type AxiosError, type AxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { BFF_URL } from "./constants";

// export const API_URL: string | undefined = import.meta.env.VITE_API_URL;
export const API_URL: string | undefined = BFF_URL;

declare module "axios" {
  // Flag propia para que el response interceptor sepa si esta petición en
  // particular debe mostrar el toast genérico de error (fetchData la recibe
  // como parámetro "haveToast").
  export interface AxiosRequestConfig {
    haveToast?: boolean;
  }
}

// Instancia de axios dedicada (Singleton) con sus interceptors configurados
// una sola vez acá, en vez de repetir la lógica de auth/errores en cada
// llamada a fetchData.
const api = axios.create({ baseURL: API_URL });

// Interceptor de request: adjunta el token Bearer (guardado por el store de
// auth en localStorage) a toda petición saliente.
api.interceptors.request.use((config) => {
  const storedToken = localStorage.getItem("token");

  if (!(config.data instanceof FormData)) {
    config.headers.set("Content-Type", "application/json");
  }

  if (storedToken) {
    const { token } = JSON.parse(storedToken);
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

// Interceptor de response: maneja los errores en un solo lugar (401 ->
// sesión caducada / credenciales inválidas, resto -> toast genérico) en vez
// de repetir el try/catch en cada llamada.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    console.error(error);
    const endpoint = error.config?.url ?? "";
    const haveToast = error.config?.haveToast ?? true;

    if (error.response?.status === 401) {
      if (endpoint === "login") {
        toast.error(
          error.response?.data?.message ?? "Usuario y/o contraseña inválida",
        );
      } else {
        toast.error("Tu sesión ha caducado");
        localStorage.clear();
        setTimeout(() => {
          location.reload();
        }, 2000);
      }
    } else if (haveToast) {
      toast.error(error.response?.data?.message ?? "Error al obtener los datos");
    }

    return Promise.reject(error);
  },
);

export const fetchData = async (
  endpoint: string,
  method: string,
  id?: string,
  body?: unknown,
  haveToast: boolean = true,
) => {
  const config: AxiosRequestConfig = {
    url: `${endpoint}${id ? `/${id}` : ""}`,
    method,
    haveToast,
  };

  // Solo agregar data si no es DELETE y hay body
  if (method.toUpperCase() !== "DELETE" && body !== undefined) {
    config.data = body instanceof FormData ? body : JSON.stringify(body);
  }

  const { data } = await api.request(config);
  return data;
};
