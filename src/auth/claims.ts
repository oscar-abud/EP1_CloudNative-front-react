import type { AccountInfo } from "@azure/msal-browser";
import { isAppRole, type AppRole } from "@/auth/roles";

export interface JwtPayload {
  [claim: string]: unknown;
  roles?: string[];
  name?: string;
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }
    return JSON.parse(base64UrlDecode(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

export function rolesFromAccessToken(token: string): AppRole[] {
  const roles = decodeJwt(token)?.roles;
  return Array.isArray(roles) ? roles.filter(isAppRole) : [];
}

export function displayNameFromAccount(account: AccountInfo | null): string {
  return account?.name || account?.username || "";
}
