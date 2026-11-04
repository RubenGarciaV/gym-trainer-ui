import { useEffect, useRef, useState } from "react";
import { Pencil, Play, Trash2, X } from "lucide-react";
import { apiRequest, jsonRequest } from "../../api/client";
import { useModal } from "../../components/modal-provider";
import type { Routine } from "../../api/types";
import RoutineForm, { type RoutineInput } from "../training/routine-form";
import { useNavigate } from "react-router-dom";

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
    <section className="space-y-5 p-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mis rutinas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Rutinas de entrenamiento que has creado.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Cargando rutinas...</p>
      ) : routines.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Todavía no has creado ninguna rutina.
        </p>
      ) : (
        <div className="space-y-4">
          {routines.map((routine) => (
            <article
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              key={routine.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-800">
                  {routine.name}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    aria-label={`Iniciar entrenamiento ${routine.name}`}
                    className="rounded-md p-2 text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={routine.exercises.length === 0}
                    onClick={() => {
                      const startedAt = new Date().toISOString();
                      navigate(
                        `/workouts/${encodeURIComponent(routine.id)}/start?startedAt=${encodeURIComponent(startedAt)}`,
                      );
                    }}
                    type="button"
                  >
                    <Play aria-hidden="true" size={17} />
                  </button>
                  <button
                    aria-label={`Editar rutina ${routine.name}`}
                    className="rounded-md p-2 text-sky-700 hover:bg-sky-50"
                    onClick={() => {
                      setEditingRoutine(routine);
                    }}
                    type="button"
                  >
                    <Pencil aria-hidden="true" size={17} />
                  </button>
                  <button
                    aria-label={`Borrar rutina ${routine.name}`}
                    className="rounded-md p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={deletingRoutineId === routine.id}
                    onClick={() => void deleteRoutine(routine)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={17} />
                  </button>
                </div>
              </div>

              {routine.exercises.length ? (
                <ul className="mt-3 divide-y divide-slate-100">
                  {routine.exercises.map((exercise) => (
                    <li
                      className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                      key={exercise.id}
                    >
                      <div>
                        <p className="font-medium text-slate-700">
                          {exercise.exercise.name}
                        </p>
                        <ul className="mt-1 space-y-1 text-xs text-slate-500">
                          {exercise.sets.map((set) => (
                            <li key={set.id}>
                              Serie {set.setNumber}: {set.reps} repeticiones
                              {set.weightKg !== null
                                ? ` · ${set.weightKg} kg`
                                : " · sin peso objetivo"}
                            </li>
                          ))}
                          <li>{exercise.restSeconds} s de descanso</li>
                        </ul>
                      </div>
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
        className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-0 text-slate-800 shadow-xl backdrop:bg-slate-950/50"
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
