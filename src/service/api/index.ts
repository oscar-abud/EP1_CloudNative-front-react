import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { BFF_URL } from "./constants";

// export const API_URL: string | undefined = import.meta.env.VITE_API_URL;
export const API_URL: string | undefined = BFF_URL;

export const fetchData = async (
  endpoint: string,
  method: string,
  id?: string,
  body?: unknown,
  haveToast: boolean = true,
) => {
  const storedToken = localStorage.getItem("token");
  let headers: { [key: string]: string } = {};

  if (!(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (storedToken) {
    const { token } = JSON.parse(storedToken);
    headers = { ...headers, Authorization: `Bearer ${token}` };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- config mezcla forma de axios según el método/body
    const config: any = {
      url: `${API_URL}/${endpoint}${id ? `/${id}` : ""}`,
      method,
      headers,
    };

    // Solo agregar data si no es DELETE y hay body
    if (method.toUpperCase() !== "DELETE" && body !== undefined) {
      config.data = body instanceof FormData ? body : JSON.stringify(body);
    }

    const { data } = await axios(config);
    return data;
  } catch (error) {
    console.error(error);
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError?.response?.status === 401) {
      if (endpoint === "login") {
        toast.error(
          axiosError?.response?.data?.message ??
            "Usuario y/o contraseña inválida",
        );
      } else {
        toast.error("Tu sesión ha caducado");
        localStorage.clear();
        setTimeout(() => {
          location.reload();
        }, 2000);
      }
    } else {
      if (haveToast) {
        toast.error(
          axiosError?.response?.data?.message ?? "Error al obtener los datos",
        );
      }
      throw error;
    }
  }
};
