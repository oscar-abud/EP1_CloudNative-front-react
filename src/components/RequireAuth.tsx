import type { ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";
import { SignInButton } from "@/components/SignInButton";

export function RequireAuth({ children }: { children: ReactNode }) {
  const account = useAuthStore((state) => state.account);

  if (!account) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
        <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <h1 className="mb-2 text-xl font-semibold text-white">
            Inicia sesión
          </h1>
          <p className="mb-6 text-sm text-gray-400">
            Autentícate con tu cuenta de Microsoft (Entra ID). opencode emitirá
            un JWT que el API Gateway validará antes de llegar al backend.
          </p>
          <SignInButton />
        </div>
      </div>
    );
  }

  return children;
}
