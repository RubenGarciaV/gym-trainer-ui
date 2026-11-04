import { useEffect, useState } from "react";
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

const History = () => {
  const { showAlert } = useModal();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    <section className="space-y-5 p-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Historial</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sesiones de entrenamiento que has completado.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Cargando historial...</p>
      ) : workouts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Todavía no has completado ningún entrenamiento.
        </p>
      ) : (
        <div className="space-y-4">
          {workouts.map((workout) => (
            <article
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              key={workout.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    {workout.name}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Inicio:{" "}
                    {workout.startedAt
                      ? dateTimeFormatter.format(new Date(workout.startedAt))
                      : "No disponible"}
                  </p>
                  <p className="text-sm text-slate-500">
                    Fin:{" "}
                    {dateTimeFormatter.format(new Date(workout.completedAt))}
                  </p>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-800">
                  {formatDuration(workout.startedAt, workout.completedAt)}
                </span>
              </div>

              <ul className="mt-4 divide-y divide-slate-100">
                {workout.exercises.map((exercise) => (
                  <li
                    className="flex flex-wrap justify-between gap-2 py-2 text-sm"
                    key={exercise.id}
                  >
                    <span className="font-medium text-slate-700">
                      {exercise.exerciseName}
                    </span>
                    <span className="text-slate-500">
                      {exercise.sets.length} series
                    </span>
                  </li>
                ))}
              </ul>

              {workout.notes && (
                <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
                  {workout.notes}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default History;
