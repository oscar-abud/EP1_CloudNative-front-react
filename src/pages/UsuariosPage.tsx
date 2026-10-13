import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { ROLES, ROLE_LABELS, type AppRole } from "@/auth/roles";
import { decodeJwt } from "@/auth/claims";
import { useApi } from "@/api/useApi";
import { ENDPOINT_USUARIOS } from "@/api/endpoints";
import { useCollection } from "@/hooks/useCollection";
import { RoleGate } from "@/components/RoleGate";
import { Spinner } from "@/components/Spinner";
import { Modal } from "@/components/Modal";
import { UsuarioForm } from "@/components/UsuarioForm";
import { btnPrimary, btnSecondary, inputClass, tdClass, thClass } from "@/components/ui";
import { apiErrorMessage } from "@/lib/format";
import type { Usuario, UsuarioInput } from "@/types";

const ALL_ROLES = Object.values(ROLES);

export function UsuariosPage() {
  return (
    <RoleGate roles={[ROLES.ADMIN]}>
      <UsuariosPanel />
    </RoleGate>
  );
}

// Separado de UsuariosPage para que no se llame a GET /usuarios si el
// usuario no es Admin (el backend igual respondería 403).
function UsuariosPanel() {
  const api = useApi();
  const account = useAuthStore((state) => state.account);
  const token = useAuthStore((state) => state.token);
  const myOid = token ? (decodeJwt(token)?.oid as string | undefined) : undefined;
  const domain = account?.username.split("@")[1] ?? "";

  const { data: usuarios, loading, error, reload } = useCollection<Usuario>(
    useCallback(() => api.get<Usuario[]>(ENDPOINT_USUARIOS), [api]),
  );

  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<{ usuario: Usuario; rol: AppRole } | null>(null);
  const [selectedRole, setSelectedRole] = useState<Record<string, AppRole>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function closeModals() {
    setCreating(false);
    setRemoving(null);
    setFormError(null);
  }

  async function handleCreate(data: UsuarioInput) {
    setSubmitting(true);
    setFormError(null);
    try {
      const usuario = await api.post<Usuario>(ENDPOINT_USUARIOS, data);
      toast.success(`Usuario ${usuario.email} creado con rol ${ROLE_LABELS[data.rol]}`);
      closeModals();
      reload();
    } catch (createError) {
      setFormError(apiErrorMessage(createError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssign(usuario: Usuario, rol: AppRole) {
    setBusyId(usuario.id);
    try {
      await api.post(`${ENDPOINT_USUARIOS}/${usuario.id}/roles`, { rol });
      toast.success(`Rol ${ROLE_LABELS[rol]} asignado a ${usuario.nombre}`);
      reload();
    } catch {
      // El interceptor de axios ya muestra el toast con el mensaje del backend.
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove() {
    if (!removing) {
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await api.del(`${ENDPOINT_USUARIOS}/${removing.usuario.id}/roles/${removing.rol}`);
      toast.success(`Rol ${ROLE_LABELS[removing.rol]} quitado a ${removing.usuario.nombre}`);
      closeModals();
      reload();
    } catch (removeError) {
      setFormError(apiErrorMessage(removeError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuarios y roles</h1>
          <p className="text-sm text-gray-400">
            Usuarios del tenant de Entra ID y sus roles en Pedidos360. Los
            cambios de rol se reflejan en el token cuando el usuario vuelve a
            iniciar sesión.
          </p>
        </div>
        <button
          type="button"
          className={btnPrimary}
          onClick={() => {
            setFormError(null);
            setCreating(true);
          }}
        >
          + Nuevo usuario
        </button>
      </div>

      {error && (
        <p className="rounded-md border border-red-900 bg-red-950 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <Spinner label="Cargando usuarios..." />
      ) : usuarios.length === 0 ? (
        <p className="rounded-lg border border-gray-800 bg-gray-900 p-6 text-sm text-gray-400">
          No hay usuarios para mostrar.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className={thClass}>Usuario</th>
                <th className={thClass}>Estado</th>
                <th className={thClass}>Roles</th>
                <th className={thClass}>Asignar rol</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => {
                const available = ALL_ROLES.filter((role) => !usuario.roles.includes(role));
                // Si el rol elegido ya fue asignado (tras reload), vuelve al primero disponible.
                const selected = available.includes(selectedRole[usuario.id])
                  ? selectedRole[usuario.id]
                  : available[0];
                const isMe = usuario.id === myOid;

                return (
                  <tr key={usuario.id} className="border-b border-gray-800 last:border-0">
                    <td className={tdClass}>
                      <p className="font-medium text-white">
                        {usuario.nombre}
                        {isMe && <span className="ml-2 text-xs text-blue-400">(tú)</span>}
                      </p>
                      <p className="text-xs text-gray-500">{usuario.email}</p>
                    </td>
                    <td className={tdClass}>
                      <span className={usuario.activo ? "text-emerald-300" : "text-gray-500"}>
                        {usuario.activo ? "Activo" : "Deshabilitado"}
                      </span>
                    </td>
                    <td className={tdClass}>
                      {usuario.roles.length === 0 ? (
                        <span className="text-xs text-gray-500">Sin rol</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {usuario.roles.map((rol) => {
                            const locked = isMe && rol === ROLES.ADMIN;
                            return (
                              <span
                                key={rol}
                                className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/15 px-2 py-0.5 text-xs text-blue-300"
                              >
                                {ROLE_LABELS[rol]}
                                {!locked && (
                                  <button
                                    type="button"
                                    className="text-blue-400 hover:text-red-300"
                                    aria-label={`Quitar rol ${ROLE_LABELS[rol]}`}
                                    onClick={() => {
                                      setFormError(null);
                                      setRemoving({ usuario, rol });
                                    }}
                                  >
                                    ✕
                                  </button>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className={tdClass}>
                      {available.length === 0 ? (
                        <span className="text-xs text-gray-500">Tiene todos los roles</span>
                      ) : (
                        <div className="flex gap-2">
                          <select
                            className={`${inputClass} w-36 py-1`}
                            value={selected}
                            onChange={(event) =>
                              setSelectedRole((current) => ({
                                ...current,
                                [usuario.id]: event.target.value as AppRole,
                              }))
                            }
                          >
                            {available.map((role) => (
                              <option key={role} value={role}>
                                {ROLE_LABELS[role]}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="rounded-md border border-gray-700 px-2 py-1 text-xs text-gray-200 hover:bg-gray-800 disabled:opacity-50"
                            disabled={busyId === usuario.id}
                            onClick={() => void handleAssign(usuario, selected)}
                          >
                            {busyId === usuario.id ? "Asignando..." : "Asignar"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <Modal title="Nuevo usuario" onClose={closeModals}>
          <UsuarioForm
            domain={domain}
            submitting={submitting}
            error={formError}
            onCancel={closeModals}
            onSubmit={(data) => void handleCreate(data)}
          />
        </Modal>
      )}

      {removing && (
        <Modal title="Quitar rol" onClose={closeModals}>
          <p className="text-sm text-gray-300">
            ¿Confirmas que deseas quitar el rol{" "}
            <span className="font-medium text-white">{ROLE_LABELS[removing.rol]}</span> a{" "}
            <span className="font-medium text-white">{removing.usuario.nombre}</span>?
          </p>
          {formError && (
            <p className="mt-3 rounded-md border border-red-900 bg-red-950 p-3 text-sm text-red-300">
              {formError}
            </p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className={btnSecondary} onClick={closeModals}>
              Cancelar
            </button>
            <button
              type="button"
              className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
              disabled={submitting}
              onClick={() => void handleRemove()}
            >
              {submitting ? "Quitando..." : "Quitar rol"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
