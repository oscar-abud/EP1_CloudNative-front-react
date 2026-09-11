import type { Configuration } from "@azure/msal-browser";
import { env } from "@/config/env";

export const msalConfig: Configuration = {
  auth: {
    clientId: env.azureClientId,
    authority: `https://login.microsoftonline.com/${env.azureTenantId}`,
    redirectUri: env.azureRedirectUri,
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
};
