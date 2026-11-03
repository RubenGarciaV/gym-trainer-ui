import { useEffect, useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { apiRequest } from "../../api/client";
import { useToast } from "../../components/toast-provider";
import type { ApiExercise, Routine } from "../../api/types";

export interface RoutineExerciseInput {
  exerciseId: string;
  position: number;
  restSeconds: number;
  sets: Array<{
    setNumber: number;
    reps: number;
    weightKg: number | null;
  }>;
}

export interface RoutineInput {
  name: string;
  exercises: RoutineExerciseInput[];
}

interface SetDraft {
  reps: string;
  weightKg: string;
}

interface ExerciseDraft {
  key: number;
  exerciseId: string;
  restSeconds: string;
  sets: SetDraft[];
}

interface RoutineFormProps {
  initialRoutine?: Routine;
  submitLabel: string;
  onSubmit: (input: RoutineInput) => Promise<void>;
  onCancel?: () => void;
}

const newSetDraft = (): SetDraft => ({ reps: "10", weightKg: "" });

const newExerciseDraft = (key: number): ExerciseDraft => ({
  key,
  exerciseId: "",
  restSeconds: "90",
  sets: [newSetDraft(), newSetDraft(), newSetDraft()],
});

const toDrafts = (routine?: Routine): ExerciseDraft[] =>
  routine?.exercises.length
    ? routine.exercises.map((exercise, index) => ({
        key: index,
        exerciseId: exercise.exerciseId,
        restSeconds: String(exercise.restSeconds),
        sets: exercise.sets.map((set) => ({
          reps: String(set.reps),
          weightKg: set.weightKg === null ? "" : String(set.weightKg),
        })),
      }))
    : [newExerciseDraft(0)];

const RoutineForm = ({
  initialRoutine,
  submitLabel,
  onSubmit,
  onCancel,
}: RoutineFormProps) => {
  const showToast = useToast();
  const [exercises, setExercises] = useState<ApiExercise[]>([]);
  const [name, setName] = useState(initialRoutine?.name ?? "");
  const [drafts, setDrafts] = useState(() => toDrafts(initialRoutine));
  const [nextKey, setNextKey] = useState(drafts.length);
  const [isLoadingExercises, setIsLoadingExercises] = useState(true);
  const [exerciseLoadFailed, setExerciseLoadFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;

    apiRequest<ApiExercise[]>("/api/v1/exercises")
      .then((result) => {
        if (active) setExercises(result);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setExerciseLoadFailed(true);
        showToast(
          "error",
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar el catálogo de ejercicios.",
        );
      })
      .finally(() => {
        if (active) setIsLoadingExercises(false);
      });

    return () => {
      active = false;
    };
  }, [showToast]);

  const updateExercise = (
    key: number,
    update: Partial<Pick<ExerciseDraft, "exerciseId" | "restSeconds">>,
  ) => {
    setDrafts((current) =>
      current.map((draft) =>
        draft.key === key ? { ...draft, ...update } : draft,
      ),
    );
  };

  const updateSet = (
    exerciseKey: number,
    setIndex: number,
    update: Partial<SetDraft>,
  ) => {
    setDrafts((current) =>
      current.map((draft) =>
        draft.key === exerciseKey
          ? {
              ...draft,
              sets: draft.sets.map((set, index) =>
                index === setIndex ? { ...set, ...update } : set,
              ),
            }
          : draft,
      ),
    );
  };

  const addExercise = () => {
    setDrafts((current) => [...current, newExerciseDraft(nextKey)]);
    setNextKey((current) => current + 1);
  };

  const addSet = (exerciseKey: number) => {
    setDrafts((current) =>
      current.map((draft) =>
        draft.key === exerciseKey && draft.sets.length < 100
          ? { ...draft, sets: [...draft.sets, newSetDraft()] }
          : draft,
      ),
    );
  };

  const removeSet = (exerciseKey: number, setIndex: number) => {
    setDrafts((current) =>
      current.map((draft) =>
        draft.key === exerciseKey && draft.sets.length > 1
          ? {
              ...draft,
              sets: draft.sets.filter((_, index) => index !== setIndex),
            }
          : draft,
      ),
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (drafts.some((draft) => !draft.exerciseId)) {
      showToast("error", "Selecciona un ejercicio en cada apartado.");
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit({
        name,
        exercises: drafts.map((draft, position) => ({
          exerciseId: draft.exerciseId,
          position,
          restSeconds: Number(draft.restSeconds),
          sets: draft.sets.map((set, index) => ({
            setNumber: index + 1,
            reps: Number(set.reps),
            weightKg: set.weightKg ? Number(set.weightKg) : null,
          })),
        })),
      });
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "No se pudo guardar la rutina.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">
          Nombre de la rutina
        </span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
          maxLength={100}
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
      </label>

      {drafts.map((draft, index) => (
        <fieldset
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          key={draft.key}
        >
          <div className="flex items-center justify-between">
            <legend className="font-semibold text-slate-800">
              Ejercicio {index + 1}
            </legend>
            {drafts.length > 1 && (
              <button
                aria-label={`Eliminar ejercicio ${index + 1}`}
                className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"
                onClick={() =>
                  setDrafts((current) =>
                    current.filter((item) => item.key !== draft.key),
                  )
                }
                type="button"
              >
                <Trash2 aria-hidden="true" size={18} />
              </button>
            )}
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">
              Ejercicio
            </span>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
              disabled={isLoadingExercises || exercises.length === 0}
              onChange={(event) =>
                updateExercise(draft.key, { exerciseId: event.target.value })
              }
              required
              value={draft.exerciseId}
            >
              <option value="">
                {isLoadingExercises
                  ? "Cargando ejercicios..."
                  : "Selecciona un ejercicio"}
              </option>
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Series</h3>
            {draft.sets.map((set, setIndex) => (
              <div
                className="rounded-lg bg-slate-50 p-3"
                key={`${draft.key}-set-${setIndex}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    Serie {setIndex + 1}
                  </span>
                  <button
                    aria-label={`Eliminar serie ${setIndex + 1} del ejercicio ${index + 1}`}
                    className="rounded-md p-1 text-slate-500 hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={draft.sets.length === 1}
                    onClick={() => removeSet(draft.key, setIndex)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <NumberInput
                    label="Repeticiones"
                    max={1000}
                    min={1}
                    onChange={(value) =>
                      updateSet(draft.key, setIndex, { reps: value })
                    }
                    value={set.reps}
                  />
                  <NumberInput
                    label="Peso (kg)"
                    max={99999.99}
                    min={0}
                    onChange={(value) =>
                      updateSet(draft.key, setIndex, { weightKg: value })
                    }
                    optional
                    step="0.01"
                    value={set.weightKg}
                  />
                </div>
              </div>
            ))}
            <button
              className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={draft.sets.length >= 100}
              onClick={() => addSet(draft.key)}
              type="button"
            >
              <Plus aria-hidden="true" size={16} />
              Añadir serie
            </button>
          </div>

          <NumberInput
            label="Descanso entre series (s)"
            max={3600}
            min={0}
            onChange={(value) =>
              updateExercise(draft.key, { restSeconds: value })
            }
            value={draft.restSeconds}
          />
        </fieldset>
      ))}

      <button
        className="flex w-full items-center justify-center gap-2 rounded-md border border-sky-600 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
        disabled={isLoadingExercises || exercises.length === 0}
        onClick={addExercise}
        type="button"
      >
        <Plus aria-hidden="true" size={18} />
        Añadir ejercicio
      </button>

      {!isLoadingExercises && exercises.length === 0 && !exerciseLoadFailed && (
        <p className="text-sm text-slate-500">
          El catálogo no tiene ejercicios disponibles.
        </p>
      )}

      <div className={onCancel ? "flex justify-end gap-2" : ""}>
        {onCancel && (
          <button
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
        )}
        <button
          className={`${onCancel ? "" : "w-full"} rounded-md bg-sky-600 px-4 py-3 font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60`}
          disabled={isSaving || isLoadingExercises || exercises.length === 0}
          type="submit"
        >
          {isSaving ? "Guardando rutina..." : submitLabel}
        </button>
      </div>
    </form>
  );
};

interface NumberInputProps {
  label: string;
  min: number;
  max: number;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
  step?: string;
}

const NumberInput = ({
  label,
  min,
  max,
  value,
  onChange,
  optional = false,
  step = "1",
}: NumberInputProps) => (
  <label className="block space-y-1">
    <span className="block text-xs font-medium text-slate-600">{label}</span>
    <input
      className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
      max={max}
      min={min}
      onChange={(event) => onChange(event.target.value)}
      required={!optional}
      step={step}
      type="number"
      value={value}
    />
  </label>
);

export default RoutineForm;
