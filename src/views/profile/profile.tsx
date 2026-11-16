import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { apiRequest, jsonRequest } from "../../api/client";
import type { BodyMeasurementEntry } from "../../api/types";
import { useModal } from "../../components/modal-provider";
import { useSession } from "../../hooks/auth/session-context";

const measurementFields = [
  { key: "chestCm", label: "Pecho" },
  { key: "waistCm", label: "Cintura" },
  { key: "hipCm", label: "Cadera" },
  { key: "armCm", label: "Brazo" },
  { key: "thighCm", label: "Muslo" },
  { key: "calfCm", label: "Gemelo" },
] as const;

type MeasurementField = (typeof measurementFields)[number]["key"];

const emptyMeasurementValues = (): Record<MeasurementField, string> => ({
  chestCm: "",
  waistCm: "",
  hipCm: "",
  armCm: "",
  thighCm: "",
  calfCm: "",
});

const getLocalDate = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const measurementDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const Profile = () => {
  const { showAlert } = useModal();
  const { user, setUser, refreshSession, isSessionLoading, sessionError } =
    useSession();
  const [name, setName] = useState("");
  const [bodyMeasurements, setBodyMeasurements] = useState<
    BodyMeasurementEntry[]
  >([]);
  const [measurementValues, setMeasurementValues] = useState(
    emptyMeasurementValues,
  );
  const [measurementDate, setMeasurementDate] = useState(getLocalDate);
  const [editingMeasurementId, setEditingMeasurementId] = useState<string | null>(
    null,
  );
  const [editingMeasurementValues, setEditingMeasurementValues] = useState(
    emptyMeasurementValues,
  );
  const [editingMeasurementDate, setEditingMeasurementDate] = useState(
    getLocalDate,
  );
  const [isLoadingMeasurements, setIsLoadingMeasurements] = useState(true);
  const [isSavingMeasurements, setIsSavingMeasurements] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setIsLoadingMeasurements(false);
      return;
    }

    let active = true;
    setIsLoadingMeasurements(true);
    apiRequest<BodyMeasurementEntry[]>("/api/v1/body-measurements")
      .then((entries) => {
        if (active) setBodyMeasurements(entries);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        showAlert(
          "error",
          requestError instanceof Error
            ? requestError.message
            : "No se pudieron cargar tus medidas corporales.",
        );
      })
      .finally(() => {
        if (active) setIsLoadingMeasurements(false);
      });

    return () => {
      active = false;
    };
  }, [showAlert, userId]);

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

  const getMeasurementPayload = (
    values: Record<MeasurementField, string>,
  ): Partial<Record<MeasurementField, number>> => {
    const measurements: Partial<Record<MeasurementField, number>> = {};
    for (const { key } of measurementFields) {
      const value = values[key];
      if (value !== "") measurements[key] = Number(value);
    }
    return measurements;
  };

  const handleAddMeasurements = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const measurements = getMeasurementPayload(measurementValues);
    if (Object.keys(measurements).length === 0) {
      showAlert("error", "Añade al menos una medida corporal.");
      return;
    }

    setIsSavingMeasurements(true);
    try {
      const measuredAt = new Date(`${measurementDate}T00:00:00`).toISOString();
      const entry = await apiRequest<BodyMeasurementEntry>(
        "/api/v1/body-measurements",
        jsonRequest("POST", { ...measurements, measuredAt }),
      );
      setBodyMeasurements((current) =>
        [entry, ...current].sort(
          (a, b) =>
            new Date(b.measuredAt).getTime() -
            new Date(a.measuredAt).getTime(),
        ),
      );
      setMeasurementValues(emptyMeasurementValues());
      setMeasurementDate(getLocalDate());
      showAlert("success", "Tus medidas corporales se han guardado.");
    } catch (requestError) {
      showAlert(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "No se pudieron guardar tus medidas corporales.",
      );
    } finally {
      setIsSavingMeasurements(false);
    }
  };

  const handleStartEditMeasurement = (entry: BodyMeasurementEntry) => {
    setEditingMeasurementId(entry.id);
    setEditingMeasurementDate(
      new Date(entry.measuredAt).toISOString().slice(0, 10),
    );
    setEditingMeasurementValues({
      chestCm: entry.chestCm === null ? "" : String(entry.chestCm),
      waistCm: entry.waistCm === null ? "" : String(entry.waistCm),
      hipCm: entry.hipCm === null ? "" : String(entry.hipCm),
      armCm: entry.armCm === null ? "" : String(entry.armCm),
      thighCm: entry.thighCm === null ? "" : String(entry.thighCm),
      calfCm: entry.calfCm === null ? "" : String(entry.calfCm),
    });
  };

  const handleCancelEditMeasurement = () => {
    setEditingMeasurementId(null);
    setEditingMeasurementValues(emptyMeasurementValues());
    setEditingMeasurementDate(getLocalDate());
  };

  const handleUpdateMeasurement = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!editingMeasurementId) return;

    const measurements = getMeasurementPayload(editingMeasurementValues);
    if (Object.keys(measurements).length === 0) {
      showAlert("error", "Añade al menos una medida corporal.");
      return;
    }

    setIsSavingMeasurements(true);
    try {
      const measuredAt = new Date(
        `${editingMeasurementDate}T00:00:00`,
      ).toISOString();
      const updatedEntry = await apiRequest<BodyMeasurementEntry>(
        `/api/v1/body-measurements/${editingMeasurementId}`,
        jsonRequest("PATCH", { ...measurements, measuredAt }),
      );
      setBodyMeasurements((current) =>
        current
          .map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry))
          .sort(
            (a, b) =>
              new Date(b.measuredAt).getTime() -
              new Date(a.measuredAt).getTime(),
          ),
      );
      handleCancelEditMeasurement();
      showAlert("success", "Las medidas corporales se han actualizado.");
    } catch (requestError) {
      showAlert(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "No se pudieron actualizar tus medidas corporales.",
      );
    } finally {
      setIsSavingMeasurements(false);
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

          <section className="surface-card space-y-4 p-4 sm:p-5">
            <div>
              <h2 className="text-base font-bold text-slate-800 sm:text-lg">
                Medidas corporales
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Registra tus medidas en centímetros para seguir tu progreso.
              </p>
            </div>
            <form className="space-y-4" onSubmit={handleAddMeasurements}>
              <div className="grid gap-3 sm:grid-cols-2">
                {measurementFields.map(({ key, label }) => (
                  <label className="block space-y-1" key={key}>
                    <span className="text-sm font-medium text-slate-700">
                      {label} (cm)
                    </span>
                    <input
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
                      max="999.99"
                      min="0.01"
                      onChange={(event) =>
                        setMeasurementValues((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                      placeholder="Opcional"
                      step="0.01"
                      type="number"
                      value={measurementValues[key]}
                    />
                  </label>
                ))}
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-slate-700">
                    Fecha
                  </span>
                  <input
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    onChange={(event) => setMeasurementDate(event.target.value)}
                    required
                    type="date"
                    value={measurementDate}
                  />
                </label>
              </div>
              <button
                className="min-h-11 w-full rounded-xl bg-sky-700 px-4 py-2.5 font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                disabled={isSavingMeasurements}
                type="submit"
              >
                {isSavingMeasurements ? "Guardando..." : "Guardar medidas"}
              </button>
            </form>

            <div className="border-t border-slate-100 pt-4">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left text-sm font-semibold text-slate-800">
                  <span>Historial de medidas</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                    {bodyMeasurements.length}
                  </span>
                </summary>
                <div className="mt-3">
                  {isLoadingMeasurements ? (
                    <p className="text-sm text-slate-500" role="status">
                      Cargando medidas...
                    </p>
                  ) : bodyMeasurements.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Todavía no has registrado medidas corporales.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {bodyMeasurements.map((entry) => {
                        const isEditing = editingMeasurementId === entry.id;

                        return (
                          <li
                            className="rounded-lg bg-slate-50 p-3"
                            key={entry.id}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-xs font-medium text-slate-500">
                                {measurementDateFormatter.format(
                                  new Date(entry.measuredAt),
                                )}
                              </p>
                              {!isEditing && (
                                <p
                                  className="text-xs font-semibold text-sky-700 hover:text-sky-800"
                                  onClick={() => handleStartEditMeasurement(entry)}
                                  role="button"
                                >
                                  Editar
                                </p>
                              )}
                            </div>

                            {isEditing ? (
                              <form
                                className="mt-3 space-y-3"
                                onSubmit={handleUpdateMeasurement}
                              >
                                <div className="grid gap-3 sm:grid-cols-2">
                                  {measurementFields.map(({ key, label }) => (
                                    <label
                                      className="block space-y-1"
                                      key={`${entry.id}-${key}`}
                                    >
                                      <span className="text-xs font-medium text-slate-700">
                                        {label} (cm)
                                      </span>
                                      <input
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
                                        max="999.99"
                                        min="0.01"
                                        onChange={(event) =>
                                          setEditingMeasurementValues((current) => ({
                                            ...current,
                                            [key]: event.target.value,
                                          }))
                                        }
                                        step="0.01"
                                        type="number"
                                        value={editingMeasurementValues[key]}
                                      />
                                    </label>
                                  ))}
                                  <label className="block space-y-1">
                                    <span className="text-xs font-medium text-slate-700">
                                      Fecha
                                    </span>
                                    <input
                                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
                                      onChange={(event) =>
                                        setEditingMeasurementDate(event.target.value)
                                      }
                                      required
                                      type="date"
                                      value={editingMeasurementDate}
                                    />
                                  </label>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    className="min-h-10 rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={isSavingMeasurements}
                                    type="submit"
                                  >
                                    {isSavingMeasurements
                                      ? "Guardando..."
                                      : "Guardar"}
                                  </button>
                                  <button
                                    className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                    onClick={handleCancelEditMeasurement}
                                    type="button"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-3">
                                {measurementFields.map(({ key, label }) =>
                                  entry[key] === null ? null : (
                                    <div
                                      className="flex justify-between gap-2 text-sm"
                                      key={`${entry.id}-${key}`}
                                    >
                                      <dt className="text-slate-500">{label}</dt>
                                      <dd className="font-medium text-slate-700">
                                        {entry[key]} cm
                                      </dd>
                                    </div>
                                  ),
                                )}
                              </dl>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </details>
            </div>
          </section>

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
