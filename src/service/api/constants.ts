import { env } from "@/config/env";

// Mismo API Gateway que usa src/api (env.apiBaseUrl): las peticiones de
// fetchData también pasan por el JWT Authorizer / CORS de AWS, no van
// directo al backend en Render.
export const BFF_URL: string | undefined = env.apiBaseUrl || undefined;
