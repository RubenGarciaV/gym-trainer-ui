import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Clock3, Dumbbell, SkipForward } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiRequest, jsonRequest } from "../../api/client";
import type {
  Routine,
  RoutineExercise,
  Workout,
  WorkoutSet,
} from "../../api/types";
import { useModal } from "../../components/modal-provider";

const dateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

interface SessionSet {
  exercise: RoutineExercise;
  set: WorkoutSet;
  isLast: boolean;
}

const WorkoutSession = () => {
  const { routineId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showAlert, confirmAction } = useModal();
  const startedAt = searchParams.get("startedAt");
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [completedSetIds, setCompletedSetIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [restRemaining, setRestRemaining] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const sessionStartedAt = startedAt ? new Date(startedAt) : null;
  const hasValidStartTime =
    sessionStartedAt !== null &&
    Number.isFinite(sessionStartedAt.getTime()) &&
    sessionStartedAt.getTime() <= Date.now();

  useEffect(() => {
    let active = true;

    if (!routineId) {
      setLoadError("No se ha indicado una rutina.");
      setIsLoading(false);
      return;
    }

    if (!hasValidStartTime) {
      setLoadError("Inicia el entrenamiento desde una rutina guardada.");
      setIsLoading(false);
      return;
    }

    apiRequest<Routine>(`/api/v1/routines/${encodeURIComponent(routineId)}`)
      .then((result) => {
        if (active) setRoutine(result);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        const message =
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar la rutina.";
        setLoadError(message);
        showAlert("error", message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hasValidStartTime, routineId, showAlert]);

  const sessionSets = useMemo<SessionSet[]>(
    () =>
      routine
        ? routine.exercises.flatMap((exercise) =>
            exercise.sets.map((set) => ({
              exercise,
              set,
              isLast:
                exercise === routine.exercises.at(-1) &&
                set === exercise.sets.at(-1),
            })),
          )
        : [],
    [routine],
  );

  useEffect(() => {
    if (restEndsAt === null) {
      setRestRemaining(0);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(
        0,
        Math.ceil((restEndsAt - Date.now()) / 1000),
      );
      setRestRemaining(remaining);
      if (remaining === 0) setRestEndsAt(null);
    };

    updateRemaining();
    const interval = window.setInterval(updateRemaining, 250);
    return () => window.clearInterval(interval);
  }, [restEndsAt]);

  const completeWorkout = async () => {
    if (!routine || !startedAt || !hasValidStartTime || isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    try {
      await apiRequest<Workout>(
        "/api/v1/workouts",
        jsonRequest("POST", {
          name: routine.name,
          routineId: routine.id,
          startedAt,
          completedAt: new Date().toISOString(),
          exercises: routine.exercises.map((exercise) => ({
            exerciseId: exercise.exerciseId,
            position: exercise.position,
            restSeconds: exercise.restSeconds,
            sets: exercise.sets.map((set) => ({
              setNumber: set.setNumber,
              reps: set.reps,
              weightKg: set.weightKg,
            })),
          })),
        }),
      );
      showAlert("success", `Has completado «${routine.name}».`);
      navigate("/history", { replace: true });
    } catch (requestError) {
      showAlert(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "No se pudo guardar el entrenamiento.",
      );
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const toggleSet = async (sessionSet: SessionSet) => {
    if (isSaving || restRemaining > 0) return;

    const { exercise, set, isLast } = sessionSet;
    const setId = set.id;
    const nextCompleted = new Set(completedSetIds);
    if (nextCompleted.has(setId)) {
      nextCompleted.delete(setId);
      setCompletedSetIds(nextCompleted);
      setRestEndsAt(null);
      return;
    }

    nextCompleted.add(setId);
    setCompletedSetIds(nextCompleted);

    if (nextCompleted.size === sessionSets.length) {
      await completeWorkout();
      return;
    }

    if (!isLast && exercise.restSeconds > 0) {
      setRestEndsAt(Date.now() + exercise.restSeconds * 1000);
    }
  };

  const leaveWorkout = async () => {
    const shouldLeave = await confirmAction(
      "El progreso de este entrenamiento se perderá. ¿Quieres salir?",
      "Salir del entrenamiento",
    );
    if (shouldLeave) navigate("/workouts");
  };

  if (isLoading) {
    return (
      <main
        className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500"
        role="status"
      >
        Cargando rutina...
      </main>
    );
  }

  if (!routine || loadError) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-slate-600">
          {loadError || "No se pudo cargar la rutina."}
        </p>
        <button
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
          onClick={() => navigate("/workouts")}
          type="button"
        >
          <ArrowLeft aria-hidden="true" size={18} />
          Volver a mis rutinas
        </button>
      </section>
    );
  }

  const progress = completedSetIds.size;
  const totalSets = sessionSets.length;
  const isComplete = totalSets > 0 && progress === totalSets;

  if (totalSets === 0) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 p-4">
        <h1 className="text-2xl font-bold text-slate-800">{routine.name}</h1>
        <p className="text-sm text-slate-600">
          Esta rutina todavía no tiene ejercicios para completar.
        </p>
        <button
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
          onClick={() => navigate("/workouts")}
          type="button"
        >
          <ArrowLeft aria-hidden="true" size={18} />
          Volver a mis rutinas
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5 p-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <button
            className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:text-sky-900"
            onClick={() => void leaveWorkout()}
            type="button"
          >
            <ArrowLeft aria-hidden="true" size={17} />
            Salir
          </button>
          <h1 className="text-2xl font-bold text-slate-800">{routine.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Iniciado el {dateTimeFormatter.format(sessionStartedAt!)}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-800">
          {progress} / {totalSets} series
        </span>
      </header>

      {restRemaining > 0 && (
        <div
          aria-live="polite"
          className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950"
          role="status"
        >
          <div className="flex items-center gap-3">
            <Clock3 aria-hidden="true" className="shrink-0" size={22} />
            <div>
              <p className="font-semibold">Tiempo de descanso</p>
              <p className="text-sm">Prepara la siguiente serie.</p>
            </div>
          </div>
          <span className="min-w-16 text-right text-2xl font-bold tabular-nums">
            {Math.floor(restRemaining / 60)}:
            {String(restRemaining % 60).padStart(2, "0")}
          </span>
          <button
            aria-label="Saltar descanso"
            className="rounded-md p-2 text-amber-800 hover:bg-amber-100"
            onClick={() => setRestEndsAt(null)}
            type="button"
          >
            <SkipForward aria-hidden="true" size={19} />
          </button>
        </div>
      )}

      <div className="space-y-4">
        {routine.exercises.map((exercise) => (
          <article
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            key={exercise.id}
          >
            <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-semibold text-slate-800">
                <Dumbbell
                  aria-hidden="true"
                  className="text-sky-700"
                  size={18}
                />
                {exercise.exercise.name}
              </h2>
              <span className="text-xs text-slate-500">
                Descanso: {exercise.restSeconds} s
              </span>
            </header>
            <ul className="divide-y divide-slate-100">
              {exercise.sets.map((set) => {
                const isChecked = completedSetIds.has(set.id);
                const isDisabled = isSaving || restRemaining > 0;

                return (
                  <li
                    className="flex items-center justify-between gap-3 py-3"
                    key={set.id}
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                      <input
                        aria-label={`Marcar serie ${set.setNumber} de ${exercise.exercise.name} como completada`}
                        checked={isChecked}
                        className="size-5 shrink-0 accent-sky-600"
                        disabled={isDisabled}
                        onChange={() => {
                          const item = sessionSets.find(
                            ({ set: sessionSet }) => sessionSet.id === set.id,
                          );
                          if (item) void toggleSet(item);
                        }}
                        type="checkbox"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-700">
                          Serie {set.setNumber} · {set.reps} repeticiones
                        </span>
                        <span className="block text-xs text-slate-500">
                          {set.weightKg !== null
                            ? `${set.weightKg} kg`
                            : "Sin peso objetivo"}
                        </span>
                      </span>
                    </label>
                    {isChecked && (
                      <Check
                        aria-label="Serie completada"
                        className="shrink-0 text-emerald-600"
                        size={18}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </div>

      {isComplete && (
        <button
          className="w-full rounded-md bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSaving}
          onClick={() => void completeWorkout()}
          type="button"
        >
          {isSaving ? "Guardando entrenamiento..." : "Guardar entrenamiento"}
        </button>
      )}
    </section>
  );
};

export default WorkoutSession;
