import { useAuthStore } from "@/store/authStore";

export function SignOutButton() {
  const logout = useAuthStore((state) => state.logout);

  return (
    <button
      type="button"
      className="rounded-md border border-gray-700 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-800"
      onClick={() => void logout()}
    >
      Cerrar sesión
    </button>
  );
}
