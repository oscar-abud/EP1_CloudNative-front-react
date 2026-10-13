import { isAxiosError } from "axios";

export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Error desconocido";
}

// Prefiere el mensaje que devuelve el backend ({ message }) sobre el genérico de axios.
export function apiErrorMessage(error: unknown): string {
  if (isAxiosError<{ message?: string }>(error) && error.response?.data?.message) {
    return error.response.data.message;
  }
  return errorMessage(error);
}

export function formatPrice(value: number): string {
  return `$${value.toLocaleString("es-CL")}`;
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("es-CL");
}