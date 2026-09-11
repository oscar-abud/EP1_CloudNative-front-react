import { env } from "@/config/env";

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (response.status === 204) {
    return undefined;
  }
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export async function apiRequest<T>(
  accessToken: string,
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  if (!env.apiBaseUrl) {
    throw new ApiError(
      "Falta VITE_API_BASE_URL. No se puede contactar al API Gateway.",
      0,
    );
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  if (!response.ok) {
    const detail = await parseBody(response).catch(() => undefined);
    throw new ApiError(
      `API Gateway respondió ${response.status} ${response.statusText}`,
      response.status,
      detail,
    );
  }

  return (await parseBody(response)) as T;
}
