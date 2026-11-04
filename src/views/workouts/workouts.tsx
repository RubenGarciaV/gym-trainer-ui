import { useEffect, useRef, useState } from "react";
import { ClipboardList, Pencil, Play, Plus, Trash2, X } from "lucide-react";
import { apiRequest, jsonRequest } from "../../api/client";
import { useModal } from "../../components/modal-provider";
import type { Routine } from "../../api/types";
import RoutineForm, { type RoutineInput } from "../training/routine-form";
import { Link, useNavigate } from "react-router-dom";

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
});

const Workouts = () => {
  const navigate = useNavigate();
  const { showAlert, confirmAction } = useModal();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [deletingRoutineId, setDeletingRoutineId] = useState<string | null>(null);
  const editDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = editDialogRef.current;
    if (!dialog) return;

    if (editingRoutine && !dialog.open) {
      dialog.showModal();
    } else if (!editingRoutine && dialog.open) {
      dialog.close();
    }
  }, [editingRoutine]);

  useEffect(() => {
    let active = true;

    apiRequest<Routine[]>("/api/v1/routines")
      .then((result) => {
        if (active) setRoutines(result);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        showAlert(
          "error",
          requestError instanceof Error
            ? requestError.message
            : "No se pudieron cargar tus rutinas.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [showAlert]);

  const updateRoutine = async (input: RoutineInput) => {
    if (!editingRoutine) return;

    const updatedRoutine = await apiRequest<Routine>(
      `/api/v1/routines/${encodeURIComponent(editingRoutine.id)}`,
      jsonRequest("PATCH", input),
    );
    setRoutines((current) =>
      current.map((routine) =>
        routine.id === updatedRoutine.id ? updatedRoutine : routine,
      ),
    );
    setEditingRoutine(null);
    showAlert("success", `La rutina «${updatedRoutine.name}» se ha actualizado.`);
  };

  const deleteRoutine = async (routine: Routine) => {
    if (!(await confirmAction(
      `¿Seguro que quieres borrar la rutina «${routine.name}»?`,
      "Borrar rutina",
    ))) {
      return;
    }

    setDeletingRoutineId(routine.id);
    try {
      await apiRequest<void>(
        `/api/v1/routines/${encodeURIComponent(routine.id)}`,
        { method: "DELETE" },
      );
      setRoutines((current) =>
        current.filter((item) => item.id !== routine.id),
      );
      showAlert("success", `La rutina «${routine.name}» se ha borrado.`);
    } catch (requestError) {
      showAlert(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "No se pudo borrar la rutina.",
      );
    } finally {
      setDeletingRoutineId(null);
    }
  };

  return (
    <section className="page-shell space-y-5">
      <div className="page-heading flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="page-eyebrow">Tu plan</p>
          <h1 className="page-title">Mis rutinas</h1>
          <p className="page-description">
            Tus entrenamientos listos para empezar cuando quieras.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 sm:w-auto"
          to="/training"
        >
          <Plus aria-hidden="true" size={18} />
          Crear rutina
        </Link>
      </div>

      {isLoading ? (
        <p className="surface-card p-5 text-sm text-slate-500" role="status">
          Cargando rutinas...
        </p>
      ) : routines.length === 0 ? (
        <div className="surface-card flex flex-col items-center px-5 py-10 text-center sm:py-14">
          <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-sky-50 text-sky-700">
            <ClipboardList aria-hidden="true" size={25} />
          </span>
          <h2 className="text-lg font-bold text-slate-800">Empieza con tu primera rutina</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
            Elige tus ejercicios, define las series y deja tu próximo entrenamiento preparado.
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800"
            to="/training"
          >
            <Plus aria-hidden="true" size={18} />
            Crear mi rutina
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {routines.map((routine) => (
            <article
              className="surface-card min-w-0 overflow-hidden p-4 sm:p-5"
              key={routine.id}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="break-words text-lg font-bold tracking-tight text-slate-800 sm:text-xl">
                    {routine.name}
                  </h2>
                  <p className="mt-1.5 text-xs font-medium text-slate-500">
                    {routine.exercises.length}{" "}
                    {routine.exercises.length === 1 ? "ejercicio" : "ejercicios"}
                    {" · "}
                    {routine.exercises.reduce(
                      (total, exercise) => total + exercise.sets.length,
                      0,
                    )}{" "}
                    series en total
                  </p>
                </div>
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <button
                    aria-label={`Iniciar entrenamiento ${routine.name}`}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                    disabled={routine.exercises.length === 0}
                    onClick={() => {
                      const startedAt = new Date().toISOString();
                      navigate(
                        `/workouts/${encodeURIComponent(routine.id)}/start?startedAt=${encodeURIComponent(startedAt)}`,
                      );
                    }}
                    type="button"
                  >
                    <Play aria-hidden="true" size={17} fill="currentColor" />
                    Iniciar
                  </button>
                  <button
                    aria-label={`Editar rutina ${routine.name}`}
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                    onClick={() => {
                      setEditingRoutine(routine);
                    }}
                    type="button"
                  >
                    <Pencil aria-hidden="true" size={17} />
                  </button>
                  <button
                    aria-label={`Borrar rutina ${routine.name}`}
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={deletingRoutineId === routine.id}
                    onClick={() => void deleteRoutine(routine)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={17} />
                  </button>
                </div>
              </div>

              {routine.exercises.length ? (
                <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
                  {routine.exercises.map((exercise) => (
                    <li
                      className="flex min-w-0 flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                      key={exercise.id}
                    >
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-slate-800">
                          {exercise.exercise.name}
                        </p>
                        <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                          {exercise.sets.map((set) => (
                            <li key={set.id}>
                              {set.setNumber}: {set.reps} reps
                              {set.weightKg !== null
                                ? ` · ${set.weightKg} kg`
                                : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[0.7rem] font-medium text-slate-600">
                        {exercise.restSeconds}s descanso
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Esta rutina todavía no tiene ejercicios.
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      <dialog
        aria-labelledby="edit-routine-title"
        className="mobile-sheet m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-0 text-slate-800 shadow-xl"
        onCancel={(event) => {
          event.preventDefault();
          setEditingRoutine(null);
        }}
        onClose={() => setEditingRoutine(null)}
        onClick={(event) => {
          if (event.target === editDialogRef.current) {
            setEditingRoutine(null);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setEditingRoutine(null);
          }
        }}
        ref={editDialogRef}
      >
        {editingRoutine && (
          <div className="p-5">
            <header className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold" id="edit-routine-title">
                Editar rutina
              </h2>
              <button
                aria-label="Cerrar"
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                onClick={() => setEditingRoutine(null)}
                type="button"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </header>
            <RoutineForm
              initialRoutine={editingRoutine}
              key={editingRoutine.id}
              onCancel={() => setEditingRoutine(null)}
              onSubmit={updateRoutine}
              submitLabel="Guardar cambios"
            />
          </div>
        )}
      </dialog>
    </section>
  );
};

export default Workouts;
