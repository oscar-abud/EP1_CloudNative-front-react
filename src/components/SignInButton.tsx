import { useAuthStore } from "@/store/authStore";
import { isConfigured } from "@/config/env";

export function SignInButton() {
  const login = useAuthStore((state) => state.login);

  if (!isConfigured) {
    return (
      <p className="text-sm text-amber-300">
        Falta configuración: completa las variables del archivo .env
        (clientId, tenantId, API Base URL y scope) y reinicia el dev server.
      </p>
    );
  }

  return (
    <button
      type="button"
      className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      onClick={() => void login()}
    >
      Iniciar sesión con Microsoft
    </button>
  );
}
