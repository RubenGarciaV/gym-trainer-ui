import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Plus, X } from "lucide-react";
import { apiRequest, jsonRequest } from "../../api/client";
import type { WeightEntry, Workout } from "../../api/types";
import { useToast } from "../../components/toast-provider";

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
});

const Home = () => {
  const showToast = useToast();
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWeightFormOpen, setIsWeightFormOpen] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const weightDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      apiRequest<WeightEntry[]>("/api/v1/weight-entries"),
      apiRequest<Workout[]>("/api/v1/workouts"),
    ])
      .then(([entries, workoutHistory]) => {
        if (!active) return;
        setWeightEntries(entries);
        setWorkouts(workoutHistory);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        showToast(
          "error",
          requestError instanceof Error
            ? requestError.message
            : "No se pudieron cargar los datos.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [showToast]);

  useEffect(() => {
    const dialog = weightDialogRef.current;
    if (!dialog) return;

    if (isWeightFormOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isWeightFormOpen && dialog.open) {
      dialog.close();
    }
  }, [isWeightFormOpen]);

  const weightHistory = weightEntries
    .slice()
    .reverse()
    .map((entry) => ({
      date: dateFormatter.format(new Date(entry.measuredAt)),
      weight: entry.weightKg,
    }));

  const handleAddWeight = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingWeight(true);

    const measuredAt = new Date();
    measuredAt.setHours(0, 0, 0, 0);

    try {
      const entry = await apiRequest<WeightEntry>(
        "/api/v1/weight-entries",
        jsonRequest("POST", {
          weightKg: Number(weightInput),
          measuredAt: measuredAt.toISOString(),
        }),
      );
      setWeightEntries((current) =>
        [...current, entry].sort(
          (a, b) =>
            new Date(b.measuredAt).getTime() -
            new Date(a.measuredAt).getTime(),
        ),
      );
      setWeightInput("");
      setIsWeightFormOpen(false);
      showToast("success", "Peso registrado para hoy.");
    } catch (requestError) {
      showToast(
        "error",
        requestError instanceof Error
          ? requestError.message
          : "No se pudo registrar el peso.",
      );
    } finally {
      setIsSavingWeight(false);
    }
  };

  const workoutDurationHistory = workouts
    .filter(
      (workout): workout is Workout & { startedAt: string } =>
        workout.startedAt !== null,
    )
    .map((workout) => {
      const duration = Math.round(
        (new Date(workout.completedAt).getTime() -
          new Date(workout.startedAt).getTime()) /
          60_000,
      );

      return {
        date: dateFormatter.format(new Date(workout.completedAt)),
        name: workout.name,
        duration,
        completedAt: new Date(workout.completedAt).getTime(),
      };
    })
    .filter(({ duration }) => duration >= 0)
    .sort((a, b) => a.completedAt - b.completedAt)
    .slice(-7);

  return (
    <section className="space-y-6 p-4">
    <h1 className="text-2xl font-bold text-slate-800">Resumen</h1>

    {isLoading ? (
        <p className="text-sm text-slate-500">Cargando tus estadísticas...</p>
      ) : (
        <>
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <header className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Evolución del peso</h2>
              <button
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                onClick={() => {
                  setIsWeightFormOpen(true);
                }}
                type="button"
              >
                <Plus aria-hidden="true" size={16} />
                Añadir peso
              </button>
            </header>

            {weightHistory.length ? (
              <div className="history-chart h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={weightHistory}
                    margin={{ top: 8, right: 12, bottom: 8, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                      domain={["dataMin - 1", "dataMax + 1"]}
                      unit=" kg"
                      width={72}
                    />
                    <Tooltip formatter={(value) => [`${value} kg`, "Peso"]} />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      name="Peso"
                      stroke="#0284c7"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-slate-500">
                Aún no has registrado mediciones de peso.
              </p>
            )}
          </article>

          <dialog
            aria-labelledby="weight-dialog-title"
            aria-describedby="weight-dialog-description"
            className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-slate-200 bg-white p-0 text-slate-800 shadow-xl backdrop:bg-slate-950/50"
            onCancel={(event) => {
              event.preventDefault();
              setIsWeightFormOpen(false);
            }}
            onClose={() => setIsWeightFormOpen(false)}
            onClick={(event) => {
              if (event.target === weightDialogRef.current) {
                setIsWeightFormOpen(false);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                setIsWeightFormOpen(false);
              }
            }}
            ref={weightDialogRef}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-bold" id="weight-dialog-title">
                Añadir peso
              </h2>
              <button
                aria-label="Cerrar"
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                onClick={() => setIsWeightFormOpen(false)}
                type="button"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <form className="space-y-4 p-5" onSubmit={handleAddWeight}>
              <p
                className="text-sm text-slate-600"
                id="weight-dialog-description"
              >
                La medición se guardará con la fecha de hoy, sin hora.
              </p>
              <label className="block space-y-1">
                <span className="block text-sm font-medium text-slate-700">
                  Peso (kg)
                </span>
                <input
                  autoFocus
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  max="999.99"
                  min="1"
                  onChange={(event) => setWeightInput(event.target.value)}
                  required
                  step="0.01"
                  type="number"
                  value={weightInput}
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => setIsWeightFormOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSavingWeight}
                  type="submit"
                >
                  {isSavingWeight ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </dialog>

          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">
              Duración de los últimos 7 entrenamientos
            </h2>
            {workoutDurationHistory.length ? (
              <div className="history-chart h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={workoutDurationHistory}
                    margin={{ top: 8, right: 12, bottom: 8, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis unit=" min" width={72} />
                    <Tooltip
                      labelFormatter={(_, payload) =>
                        payload[0]?.payload.name ?? ""
                      }
                      formatter={(value) => [`${value} min`, "Duración"]}
                    />
                    <Bar
                      dataKey="duration"
                      name="Duración"
                      fill="#0284c7"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-slate-500">
                Aún no hay entrenamientos con duración registrada.
              </p>
            )}
          </article>
        </>
      )}
    </section>
  );
};

export default Home;
