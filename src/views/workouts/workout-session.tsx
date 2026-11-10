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
import { useWorkoutProgress } from "../../hooks/workouts/workout-progress-context";

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
  const {
    activeWorkout,
    startWorkout,
    updateWorkoutProgress,
    prepareRestBellSound,
    clearWorkout,
  } = useWorkoutProgress();
  const startedAt = searchParams.get("startedAt");
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [restRemaining, setRestRemaining] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const hasCompletedWorkoutRef = useRef(false);
  const restTimerRef = useRef<HTMLDivElement>(null);
  const sessionStartedAt = startedAt ? new Date(startedAt) : null;
  const hasValidStartTime =
    sessionStartedAt !== null &&
    Number.isFinite(sessionStartedAt.getTime()) &&
    sessionStartedAt.getTime() <= Date.now();
  const isDifferentActiveWorkout =
    !!activeWorkout &&
    (activeWorkout.routineId !== routineId ||
      activeWorkout.startedAt !== startedAt);
  const completedSetIds = new Set(activeWorkout?.completedSetIds ?? []);
  const restEndsAt = activeWorkout?.restEndsAt ?? null;
  const restSetId = activeWorkout?.restSetId ?? null;

  useEffect(() => {
    if (hasCompletedWorkoutRef.current) return;

    if (isDifferentActiveWorkout && activeWorkout) {
      navigate(
        `/workouts/${encodeURIComponent(activeWorkout.routineId)}/start?startedAt=${encodeURIComponent(activeWorkout.startedAt)}`,
        { replace: true },
      );
      return;
    }

    if (!activeWorkout && routineId && startedAt && hasValidStartTime) {
      startWorkout(routineId, startedAt);
    }
  }, [
    activeWorkout,
    hasValidStartTime,
    isDifferentActiveWorkout,
    navigate,
    routineId,
    startWorkout,
    startedAt,
  ]);

  useEffect(() => {
    let active = true;

    if (!routineId) {
      setLoadError("No se ha indicado una rutina.");
      setIsLoading(false);
      return;
    }

    if (!hasValidStartTime || isDifferentActiveWorkout) {
      if (isDifferentActiveWorkout) return;
      setLoadError("Inicia el entrenamiento desde una rutina guardada.");
      setIsLoading(false);
      return;
    }

    if (activeWorkout?.routine) {
      setRoutine(activeWorkout.routine);
      setIsLoading(false);
      return;
    }

    apiRequest<Routine>(`/api/v1/routines/${encodeURIComponent(routineId)}`)
      .then((result) => {
        if (active) {
          setRoutine(result);
          updateWorkoutProgress({ routine: result });
        }
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
  }, [
    activeWorkout?.routine,
    hasValidStartTime,
    isDifferentActiveWorkout,
    routineId,
    showAlert,
    updateWorkoutProgress,
  ]);

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
    };

    updateRemaining();
    const interval = window.setInterval(updateRemaining, 250);
    return () => window.clearInterval(interval);
  }, [restEndsAt]);

  useEffect(() => {
    if (restSetId) {
      restTimerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [restSetId]);

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
      hasCompletedWorkoutRef.current = true;
      clearWorkout();
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
      updateWorkoutProgress({
        completedSetIds: [...nextCompleted],
        restEndsAt: null,
        restSetId: null,
      });
      return;
    }

    nextCompleted.add(setId);
    updateWorkoutProgress({ completedSetIds: [...nextCompleted] });

    if (nextCompleted.size === sessionSets.length) {
      await completeWorkout();
      return;
    }

    if (!isLast && exercise.restSeconds > 0) {
      prepareRestBellSound();
      updateWorkoutProgress({
        restEndsAt: Date.now() + exercise.restSeconds * 1000,
        restSetId: setId,
      });
    }
  };

  const leaveWorkout = async () => {
    const shouldLeave = await confirmAction(
      "El progreso de este entrenamiento se perderá. ¿Quieres salir?",
      "Salir del entrenamiento",
    );
    if (shouldLeave) {
      clearWorkout();
      navigate("/workouts");
    }
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
      <section className="page-shell mx-auto max-w-3xl space-y-4">
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

  if (totalSets === 0) {
    return (
      <section className="page-shell mx-auto max-w-3xl space-y-4">
        <h1 className="page-title">{routine.name}</h1>
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
    <section className="page-shell mx-auto max-w-3xl space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <button
            className="mb-3 inline-flex min-h-10 items-center gap-1 rounded-lg pr-2 text-sm font-semibold text-sky-700 hover:text-sky-900"
            onClick={() => void leaveWorkout()}
            type="button"
          >
            <ArrowLeft aria-hidden="true" size={17} />
            Salir
          </button>
          <p className="page-eyebrow">Entrenamiento en curso</p>
          <h1 className="page-title">{routine.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Iniciado el {dateTimeFormatter.format(sessionStartedAt!)}
          </p>
        </div>
        <span className="mt-7 shrink-0 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 sm:text-sm">
          {progress} / {totalSets} series
        </span>
      </header>

      <div className="space-y-4">
        {routine.exercises.map((exercise) => (
          <article
            className="surface-card p-4 sm:p-5"
            key={exercise.id}
          >
            <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex min-w-0 items-center gap-2 break-words font-bold text-slate-800">
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
                    className={`rounded-xl px-2 transition ${
                      isChecked ? "bg-emerald-50/70" : ""
                    }`}
                    key={set.id}
                  >
                    <div className="flex items-center justify-between gap-3 py-3">
                      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                        <input
                          aria-label={`Marcar serie ${set.setNumber} de ${exercise.exercise.name} como completada`}
                          checked={isChecked}
                          className="size-6 shrink-0 accent-sky-700"
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
                    </div>
                    {restSetId === set.id && restRemaining > 0 && (
                      <div
                        aria-live="polite"
                        className="mb-2 ml-9 flex scroll-mt-20 scroll-mb-24 items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950 sm:ml-10"
                        ref={restTimerRef}
                        role="status"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Clock3
                            aria-hidden="true"
                            className="shrink-0 text-amber-700"
                            size={18}
                          />
                          <span className="text-xs font-semibold sm:text-sm">
                            Descanso
                          </span>
                        </div>
                        <span className="min-w-12 text-right text-lg font-bold tabular-nums">
                          {Math.floor(restRemaining / 60)}:
                          {String(restRemaining % 60).padStart(2, "0")}
                        </span>
                        <button
                          aria-label="Saltar descanso"
                          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-amber-800 hover:bg-amber-100"
                          onClick={() => {
                            updateWorkoutProgress({
                              restEndsAt: null,
                              restSetId: null,
                            });
                          }}
                          type="button"
                        >
                          <SkipForward aria-hidden="true" size={17} />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </div>

      <button
        className="min-h-12 w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSaving}
        onClick={() => void completeWorkout()}
        type="button"
      >
        {isSaving ? "Guardando entrenamiento..." : "Completar entrenamiento"}
      </button>
    </section>
  );
};

export default WorkoutSession;
