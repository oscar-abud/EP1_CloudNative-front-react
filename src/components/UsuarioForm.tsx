import { useState } from "react";
import { ROLES, ROLE_LABELS, type AppRole } from "@/auth/roles";
import type { UsuarioInput } from "@/types";
import { btnPrimary, btnSecondary, inputClass, labelClass } from "@/components/ui";

interface UsuarioFormProps {
  domain: string;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (data: UsuarioInput) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Contraseña temporal que cumple la política por defecto de Entra ID
// (mayúscula, minúscula, número y símbolo). El usuario la cambia al entrar.
function generatePassword(): string {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnpqrstuvwxyz", "23456789", "!@#$%*?"];
  const all = sets.join("");
  const random = (chars: string) =>
    chars[crypto.getRandomValues(new Uint32Array(1))[0] % chars.length];
  const chars = [...sets.map(random), ...Array.from({ length: 8 }, () => random(all))];
  // Fisher-Yates para que los 4 caracteres obligatorios no queden al inicio.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export function UsuarioForm({ domain, submitting, error, onCancel, onSubmit }: UsuarioFormProps) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(generatePassword);
  const [rol, setRol] = useState<AppRole>(ROLES.CLIENTE);

  const canSubmit =
    nombre.trim() !== "" && EMAIL_REGEX.test(email.trim()) && password.length >= 8;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    onSubmit({ nombre: nombre.trim(), email: email.trim(), password, rol });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="usuario-nombre">
          Nombre completo *
        </label>
        <input
          id="usuario-nombre"
          className={inputClass}
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          placeholder="Ej: María González"
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="usuario-email">
          Usuario (UPN) *
        </label>
        <input
          id="usuario-email"
          className={inputClass}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={`usuario@${domain || "tu-tenant.onmicrosoft.com"}`}
        />
        <p className="mt-1 text-xs text-gray-500">
          Debe usar un dominio verificado del tenant{domain ? ` (ej: @${domain})` : ""}.
        </p>
      </div>
      <div>
        <label className={labelClass} htmlFor="usuario-password">
          Contraseña temporal *
        </label>
        <div className="flex gap-2">
          <input
            id="usuario-password"
            className={`${inputClass} font-mono`}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            className={btnSecondary}
            onClick={() => setPassword(generatePassword())}
          >
            Generar
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Cópiala y entrégala al usuario: deberá cambiarla en su primer inicio de sesión.
        </p>
      </div>
      <div>
        <label className={labelClass} htmlFor="usuario-rol">
          Rol inicial *
        </label>
        <select
          id="usuario-rol"
          className={inputClass}
          value={rol}
          onChange={(event) => setRol(event.target.value as AppRole)}
        >
          {Object.values(ROLES).map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="rounded-md border border-red-900 bg-red-950 p-3 text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" className={btnSecondary} disabled={submitting} onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className={btnPrimary} disabled={submitting || !canSubmit}>
          {submitting ? "Creando..." : "Crear usuario"}
        </button>
      </div>
    </form>
  );
}
