import { env } from "@/config/env";

// URL del backend (BFF) de otro proyecto: NO es el API Gateway de AWS
// (ese es env.apiBaseUrl, usado por src/api). Se lee de VITE_BFF_URL
// reutilizando el mismo módulo de env (DRY: un solo lugar parsea env).
export const BFF_URL: string | undefined = env.bffUrl;
