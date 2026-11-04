import { useEffect, useRef, useState } from "react";
import { ChevronRight, Clock3, Dumbbell, X } from "lucide-react";
import { apiRequest } from "../../api/client";
import { useModal } from "../../components/modal-provider";
import type { Workout } from "../../api/types";

const dateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

const formatDuration = (startedAt: string | null, completedAt: string) => {
  if (!startedAt) return "Duración no disponible";

  const minutes = Math.round(
    (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60_000,
  );
  if (!Number.isFinite(minutes) || minutes < 0) return "Duración no disponible";
  if (minutes === 0) return "<1 min";
  if (minutes < 60) return `${minutes} min`;

  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
};

const formatWorkoutCounts = (workout: Workout) => {
  const setCount = workout.exercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0,
  );
  const exerciseCount = workout.exercises.length;

  return `${exerciseCount} ${
    exerciseCount === 1 ? "ejercicio" : "ejercicios"
  } · ${setCount} ${setCount === 1 ? "serie" : "series"}`;
};

const History = () => {
  const { showAlert } = useModal();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const workoutDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = workoutDialogRef.current;
    if (!dialog) return;

    if (selectedWorkout && !dialog.open) {
      dialog.showModal();
      dialog
        .querySelector<HTMLButtonElement>("[data-dialog-close]")
        ?.focus();
    } else if (!selectedWorkout && dialog.open) {
      dialog.close();
    }
  }, [selectedWorkout]);

  useEffect(() => {
    let active = true;

    apiRequest<Workout[]>("/api/v1/workouts")
      .then((result) => {
        if (active) setWorkouts(result);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        showAlert(
          "error",
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar el historial de entrenamientos.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [showAlert]);

  return (
    <section className="page-shell space-y-5">
      <div className="page-heading">
        <p className="page-eyebrow">Tu recorrido</p>
        <h1 className="page-title">Historial</h1>
        <p className="page-description">
          Revisa tus sesiones y el trabajo que has completado.
        </p>
      </div>

      {isLoading ? (
        <p className="surface-card p-5 text-sm text-slate-500" role="status">
          Cargando historial...
        </p>
      ) : workouts.length === 0 ? (
        <div className="surface-card px-5 py-10 text-center sm:py-14">
          <h2 className="text-lg font-bold text-slate-800">Aún no hay sesiones</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Cuando completes una rutina, aquí tendrás un resumen de tus entrenamientos.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {workouts.map((workout) => (
            <article
              aria-label={`Ver series de ${workout.name}`}
              className="surface-card min-w-0 cursor-pointer p-4 text-left transition hover:border-sky-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-600 sm:p-5"
              onClick={() => setSelectedWorkout(workout)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedWorkout(workout);
                }
              }}
              key={workout.id}
              role="button"
              tabIndex={0}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="break-words text-lg font-bold text-slate-800">
                    {workout.name}
                  </h2>
                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    <p>
                      <span className="font-semibold text-slate-600">Inicio</span>
                      {" · "}
                      {workout.startedAt
                        ? dateTimeFormatter.format(new Date(workout.startedAt))
                        : "No disponible"}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-600">Fin</span>
                      {" · "}
                      {dateTimeFormatter.format(new Date(workout.completedAt))}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800">
                  {formatDuration(workout.startedAt, workout.completedAt)}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500">
                  {formatWorkoutCounts(workout)}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700">
                  Ver detalles
                  <ChevronRight aria-hidden="true" size={16} />
                </span>
              </div>

              {workout.notes && (
                <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
                  {workout.notes}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      <dialog
        aria-describedby="workout-detail-description"
        aria-labelledby="workout-detail-title"
        className="mobile-sheet m-auto w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white p-0 text-slate-800 shadow-xl"
        onClick={(event) => {
          if (event.target === workoutDialogRef.current) {
            setSelectedWorkout(null);
          }
        }}
        onClose={() => setSelectedWorkout(null)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setSelectedWorkout(null);
        }}
        ref={workoutDialogRef}
      >
        {selectedWorkout && (
          <>
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="page-eyebrow">Detalle del entrenamiento</p>
                <h2
                  className="break-words text-xl font-bold tracking-tight text-slate-800"
                  id="workout-detail-title"
                >
                  {selectedWorkout.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500" id="workout-detail-description">
                  {selectedWorkout.startedAt
                    ? `Inicio ${dateTimeFormatter.format(new Date(selectedWorkout.startedAt))} · `
                    : ""}
                  Fin {dateTimeFormatter.format(new Date(selectedWorkout.completedAt))}
                  {" · "}
                  {formatDuration(
                    selectedWorkout.startedAt,
                    selectedWorkout.completedAt,
                  )}
                </p>
              </div>
              <button
                aria-label="Cerrar detalle del entrenamiento"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                data-dialog-close
                onClick={() => setSelectedWorkout(null)}
                type="button"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </header>

            <div className="max-h-[min(65dvh,36rem)] space-y-4 overflow-y-auto p-4 sm:max-h-[min(65dvh,40rem)] sm:p-6">
              {selectedWorkout.exercises.map((exercise) => (
                <section
                  aria-label={exercise.exerciseName}
                  className="rounded-xl border border-slate-200 p-3 sm:p-4"
                  key={exercise.id}
                >
                  <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <h3 className="flex min-w-0 items-center gap-2 font-semibold text-slate-800">
                      <Dumbbell
                        aria-hidden="true"
                        className="shrink-0 text-sky-700"
                        size={17}
                      />
                      <span className="break-words">{exercise.exerciseName}</span>
                    </h3>
                    {exercise.restSeconds !== null && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[0.7rem] font-medium text-slate-600">
                        <Clock3 aria-hidden="true" size={13} />
                        {exercise.restSeconds} s descanso
                      </span>
                    )}
                  </header>

                  <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)] gap-2 border-b border-slate-100 px-2 pb-2 text-[0.68rem] font-semibold uppercase tracking-wide text-slate-400">
                    <span>Serie</span>
                    <span>Repeticiones</span>
                    <span className="text-right">Peso</span>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {exercise.sets.map((set) => (
                      <li
                        className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)] items-center gap-2 px-2 py-2.5 text-sm"
                        key={set.id}
                      >
                        <span className="font-medium text-slate-700">
                          Serie {set.setNumber}
                        </span>
                        <span className="text-slate-600">{set.reps} reps</span>
                        <span className="text-right font-medium text-slate-700">
                          {set.weightKg === null ? "—" : `${set.weightKg} kg`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}
      </dialog>
    </section>
  );
};

export default History;
