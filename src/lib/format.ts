export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Error desconocido";
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