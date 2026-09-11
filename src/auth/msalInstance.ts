import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "@/auth/msalConfig";

// Instancia única de MSAL para toda la app (patrón Singleton).
// Se crea una sola vez aquí y se reutiliza en el store de auth,
// nunca se vuelve a instanciar en otro archivo.
export const msalInstance = new PublicClientApplication(msalConfig);
