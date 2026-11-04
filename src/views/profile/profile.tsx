import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { apiRequest, jsonRequest } from "../../api/client";
import { useModal } from "../../components/modal-provider";
import { useSession } from "../../hooks/auth/session-context";

const Profile = () => {
  const { showAlert } = useModal();
  const { user, setUser, refreshSession, isSessionLoading, sessionError } =
    useSession();
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  useEffect(() => {
    if (sessionError) showAlert("error", sessionError);
  }, [sessionError, showAlert]);

  const handleUpdateName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingName(true);

    try {
      await apiRequest("/api/auth/update-user", jsonRequest("POST", { name }));
      const updatedUser = await refreshSession();
      if (!updatedUser) throw new Error("No se pudo actualizar la sesión.");
      setUser(updatedUser);
      setName(updatedUser.name);
      showAlert("success", "Tu nombre se ha actualizado.");
    } catch (requestError) {
      showAlert(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "No se pudo actualizar tu nombre.",
      );
    } finally {
      setIsSavingName(false);
    }
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      showAlert("error", "La nueva contraseña y su confirmación no coinciden.");
      return;
    }
    if (newPassword.length < 8) {
      showAlert("error", "La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setIsSavingPassword(true);
    try {
      await apiRequest(
        "/api/auth/change-password",
        jsonRequest("POST", {
          currentPassword,
          newPassword,
          revokeOtherSessions: false,
        }),
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showAlert("success", "Tu contraseña se ha actualizado.");
    } catch (requestError) {
      showAlert(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "No se pudo cambiar la contraseña.",
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleRetrySession = async () => {
    try {
      await refreshSession();
    } catch (requestError) {
      showAlert(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "No se pudo cargar el perfil.",
      );
    }
  };

  return (
    <section className="page-shell mx-auto max-w-2xl space-y-5">
      <div className="page-heading">
        <p className="page-eyebrow">Tu cuenta</p>
        <h1 className="page-title">Mi perfil</h1>
        <p className="page-description">
          Gestiona tus datos personales y mantén tu cuenta segura.
        </p>
      </div>

      {isSessionLoading ? (
        <p className="surface-card p-5 text-sm text-slate-500" role="status">
          Cargando perfil...
        </p>
      ) : !user ? (
        <div className="surface-card p-5 text-sm text-slate-600">
          {sessionError ? (
            <button
              className="font-semibold text-sky-700"
              onClick={handleRetrySession}
              type="button"
            >
              Reintentar
            </button>
          ) : (
            <>
              Inicia sesión para consultar tu perfil.{" "}
              <Link className="font-semibold text-sky-700" to="/">
                Ir al inicio de sesión
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <form
            className="surface-card space-y-4 p-4 sm:p-5"
            onSubmit={handleUpdateName}
          >
            <h2 className="text-base font-bold text-slate-800 sm:text-lg">
              Datos personales
            </h2>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Nombre</span>
              <input
                autoComplete="name"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
                maxLength={100}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">
                Correo electrónico
              </span>
              <input
                autoComplete="email"
                className="w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                readOnly
                type="email"
                value={user.email}
              />
              <span className="block text-xs text-slate-500">
                El cambio de correo no está habilitado en la API.
              </span>
            </label>
            <button
              className="min-h-11 w-full rounded-xl bg-sky-700 px-4 py-2.5 font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              disabled={isSavingName || name.trim() === user.name}
              type="submit"
            >
              {isSavingName ? "Guardando..." : "Guardar nombre"}
            </button>
          </form>

          <form
            className="surface-card space-y-4 p-4 sm:p-5"
            onSubmit={handleChangePassword}
          >
            <h2 className="text-base font-bold text-slate-800 sm:text-lg">
              Cambiar contraseña
            </h2>
            <PasswordField
              autoComplete="current-password"
              label="Contraseña actual"
              onChange={setCurrentPassword}
              value={currentPassword}
            />
            <PasswordField
              autoComplete="new-password"
              label="Nueva contraseña"
              minLength={8}
              onChange={setNewPassword}
              value={newPassword}
            />
            <PasswordField
              autoComplete="new-password"
              label="Repetir nueva contraseña"
              minLength={8}
              onChange={setConfirmPassword}
              value={confirmPassword}
            />
            <button
              className="min-h-11 w-full rounded-xl bg-sky-700 px-4 py-2.5 font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              disabled={
                isSavingPassword ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
              type="submit"
            >
              {isSavingPassword ? "Actualizando..." : "Cambiar contraseña"}
            </button>
          </form>
        </>
      )}
    </section>
  );
};

interface PasswordFieldProps {
  label: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  minLength?: number;
}

const PasswordField = ({
  label,
  autoComplete,
  value,
  onChange,
  minLength,
}: PasswordFieldProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className="relative block">
        <input
          autoComplete={autoComplete}
          className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
          minLength={minLength}
          onChange={(event) => onChange(event.target.value)}
          required
          type={isPasswordVisible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={
            isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"
          }
          aria-pressed={isPasswordVisible}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700"
          onClick={() => setIsPasswordVisible((visible) => !visible)}
          type="button"
        >
          {isPasswordVisible ? (
            <EyeOff aria-hidden="true" size={18} />
          ) : (
            <Eye aria-hidden="true" size={18} />
          )}
        </button>
      </span>
    </label>
  );
};

export default Profile;
