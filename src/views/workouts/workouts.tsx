import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import type { Routine } from "../../api/types";

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
});

const Workouts = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    apiRequest<Routine[]>("/api/v1/routines")
      .then((result) => {
        if (active) setRoutines(result);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(
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
  }, []);

  return (
    <section className="space-y-5 p-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mis rutinas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Rutinas de entrenamiento que has creado.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
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
                <span className="text-xs text-slate-500">
                  Actualizada el{" "}
                  {dateFormatter.format(new Date(routine.updatedAt))}
                </span>
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
                      <span className="text-xs text-slate-400">
                        {exercise.exercise.muscleGroups.join(" · ")}
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
    </section>
  );
};

export default Workouts;
