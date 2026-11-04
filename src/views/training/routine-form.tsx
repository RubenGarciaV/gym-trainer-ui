import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Check, ChevronDown, Plus, Search, Trash2 } from "lucide-react";
import { apiRequest } from "../../api/client";
import { useModal } from "../../components/modal-provider";
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

const normalizeSearchText = (value: string) =>
  value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es");

interface ExerciseAutocompleteProps {
  label: string;
  exercises: ApiExercise[];
  selectedId: string;
  disabled: boolean;
  onSelect: (exerciseId: string) => void;
}

const ExerciseAutocomplete = ({
  label,
  exercises,
  selectedId,
  disabled,
  onSelect,
}: ExerciseAutocompleteProps) => {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const selectedExercise = exercises.find(({ id }) => id === selectedId);

  const filteredExercises = useMemo(() => {
      const searchTerms = normalizeSearchText(query.trim())
        .split(/\s+/)
        .filter(Boolean);
      if (!searchTerms.length) return exercises;

      return exercises.filter(({ name, muscleGroups }) => {
        const searchableText = normalizeSearchText(
          `${name} ${muscleGroups.join(" ")}`,
        );
        return searchTerms.every((term) => searchableText.includes(term));
      });
  }, [exercises, query]);

  useEffect(() => {
      if (selectedExercise) setQuery(selectedExercise.name);
  }, [selectedExercise]);

  const selectExercise = (exercise: ApiExercise) => {
      setQuery(exercise.name);
      setIsOpen(false);
      setActiveIndex(0);
      onSelect(exercise.id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!isOpen) {
          setActiveIndex(0);
          setIsOpen(true);
          return;
        }
        setIsOpen(true);
        setActiveIndex((index) =>
          filteredExercises.length
            ? index < 0
              ? 0
              : (index + 1) % filteredExercises.length
            : -1,
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (!isOpen) {
          setActiveIndex(filteredExercises.length - 1);
          setIsOpen(true);
          return;
        }
        setIsOpen(true);
        setActiveIndex((index) =>
          filteredExercises.length
            ? index < 0
              ? filteredExercises.length - 1
              : (index - 1 + filteredExercises.length) % filteredExercises.length
            : -1,
        );
      } else if (event.key === "Enter" && isOpen && filteredExercises.length) {
        event.preventDefault();
        selectExercise(filteredExercises[activeIndex] ?? filteredExercises[0]);
      } else if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        setIsOpen(false);
      }
  };

  return (
      <div
        className="relative"
        onBlur={(event) => {
          if (
            !(event.relatedTarget instanceof Node) ||
            !containerRef.current?.contains(event.relatedTarget)
          ) {
            setIsOpen(false);
          }
        }}
        ref={containerRef}
      >
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            aria-activedescendant={
              isOpen && filteredExercises[activeIndex]
                ? `${listboxId}-option-${filteredExercises[activeIndex].id}`
                : undefined
            }
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-label={label}
            autoComplete="off"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-base focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
            disabled={disabled}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(-1);
              setIsOpen(true);
              if (selectedId) onSelect("");
            }}
            onFocus={() => {
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled ? "Cargando ejercicios..." : "Escribe para buscar..."
            }
            role="combobox"
            value={query}
          />
          <ChevronDown
            aria-hidden="true"
            className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            size={18}
          />
        </div>

        {isOpen && !disabled && (
          <ul
            className="absolute inset-x-0 top-full z-20 mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
            id={listboxId}
            role="listbox"
          >
            {filteredExercises.length ? (
              filteredExercises.map((exercise, index) => (
                <li
                  aria-selected={exercise.id === selectedId}
                  className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
                    index === activeIndex
                      ? "bg-sky-50 text-sky-900"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                  id={`${listboxId}-option-${exercise.id}`}
                  key={exercise.id}
                  onClick={() => selectExercise(exercise)}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  role="option"
                >
                  <span className="min-w-0">
                    <span className="block font-medium">{exercise.name}</span>
                    {exercise.muscleGroups.length > 0 && (
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {exercise.muscleGroups.join(", ")}
                      </span>
                    )}
                  </span>
                  {exercise.id === selectedId && (
                    <Check
                      aria-hidden="true"
                      className="shrink-0 text-emerald-600"
                      size={17}
                    />
                  )}
                </li>
              ))
            ) : (
              <li
                className="px-3 py-4 text-center text-sm text-slate-500"
                role="status"
              >
                No se encontraron ejercicios.
              </li>
            )}
          </ul>
        )}
      </div>
  );
};

const RoutineForm = ({
  initialRoutine,
  submitLabel,
  onSubmit,
  onCancel,
}: RoutineFormProps) => {
  const { showAlert } = useModal();
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
        showAlert(
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
  }, [showAlert]);

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
      showAlert("error", "Selecciona un ejercicio en cada apartado.");
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
      showAlert(
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
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
          maxLength={100}
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
      </label>

      {drafts.map((draft, index) => (
        <fieldset
          className="surface-card space-y-4 p-4 sm:p-5"
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

          <div className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">
              Ejercicio
            </span>
            <ExerciseAutocomplete
              disabled={isLoadingExercises || exercises.length === 0}
              exercises={exercises}
              label={`Buscar ejercicio ${index + 1}`}
              onSelect={(exerciseId) =>
                updateExercise(draft.key, { exerciseId })
              }
              selectedId={draft.exerciseId}
            />
          </div>

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
