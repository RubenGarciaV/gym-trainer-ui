import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Plus, Scale, X } from "lucide-react";
import { apiRequest, jsonRequest } from "../../api/client";
import type {
  BodyMeasurementEntry,
  WeightEntry,
  Workout,
} from "../../api/types";
import { useModal } from "../../components/modal-provider";

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
});

const measurementOptions = [
  { key: "chestCm", label: "Pecho" },
  { key: "waistCm", label: "Cintura" },
  { key: "hipCm", label: "Cadera" },
  { key: "armCm", label: "Brazo" },
  { key: "thighCm", label: "Muslo" },
  { key: "calfCm", label: "Gemelo" },
] as const;

type MeasurementKey = (typeof measurementOptions)[number]["key"];
type MeasurementSelection = MeasurementKey | "all";

const measurementColors = [
  "#0284c7",
  "#e11d48",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#0891b2",
];

const Home = () => {
  const { showAlert } = useModal();
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [bodyMeasurements, setBodyMeasurements] = useState<
    BodyMeasurementEntry[]
  >([]);
  const [selectedMeasurement, setSelectedMeasurement] =
    useState<MeasurementSelection>("all");
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
      apiRequest<BodyMeasurementEntry[]>("/api/v1/body-measurements"),
      apiRequest<Workout[]>("/api/v1/workouts"),
    ])
      .then(([entries, measurements, workoutHistory]) => {
        if (!active) return;
        setWeightEntries(entries);
        setBodyMeasurements(measurements);
        setWorkouts(workoutHistory);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        showAlert(
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
  }, [showAlert]);

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

  const measurementHistory = bodyMeasurements
    .slice()
    .sort(
      (a, b) =>
        new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime(),
    )
    .map(({
      chestCm,
      waistCm,
      hipCm,
      armCm,
      thighCm,
      calfCm,
      measuredAt,
    }) => ({
      date: dateFormatter.format(new Date(measuredAt)),
      chestCm,
      waistCm,
      hipCm,
      armCm,
      thighCm,
      calfCm,
    }));
  const selectedMeasurementOption =
    selectedMeasurement === "all"
      ? null
      : measurementOptions.find(({ key }) => key === selectedMeasurement);
  const selectedMeasurementHistory =
    selectedMeasurement === "all"
      ? measurementHistory
      : measurementHistory
          .filter((entry) => entry[selectedMeasurement] !== null)

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
      showAlert("success", "Peso registrado para hoy.");
    } catch (requestError) {
      showAlert(
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
  const latestWeight = weightEntries.reduce<WeightEntry | null>(
    (latest, entry) =>
      !latest || new Date(entry.measuredAt) > new Date(latest.measuredAt)
        ? entry
        : latest,
    null,
  );

  return (
    <section className="page-shell space-y-5 sm:space-y-6">
      <div className="page-heading">
        <p className="page-eyebrow">Tu progreso</p>
        <h1 className="page-title">Resumen</h1>
        <p className="page-description">
          Una mirada rápida a tu actividad y evolución.
        </p>
      </div>

    {isLoading ? (
        <p className="surface-card p-5 text-sm text-slate-500" role="status">
          Cargando tus estadísticas...
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <article className="surface-card p-4">
              <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <Activity aria-hidden="true" size={18} />
              </div>
              <p className="text-2xl font-bold tracking-tight text-slate-800">
                {workouts.length}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Entrenamientos
              </p>
            </article>
            <article className="surface-card p-4">
              <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Scale aria-hidden="true" size={18} />
              </div>
              <p className="text-2xl font-bold tracking-tight text-slate-800">
                {latestWeight ? `${latestWeight.weightKg} kg` : "—"}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Último peso
              </p>
            </article>
          </div>

          <article className="surface-card p-4 sm:p-5">
            <header className="mb-4">
              <h2 className="text-base font-bold text-slate-800 sm:text-lg">
                Evolución de tus medidas
              </h2>
            </header>

            <label className="mb-4 block max-w-xs space-y-1">
              <select
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
                onChange={(event) => {
                  if (event.target.value === "all") {
                    setSelectedMeasurement("all");
                    return;
                  }
                  const option = measurementOptions.find(
                    ({ key }) => key === event.target.value,
                  );
                  if (option) setSelectedMeasurement(option.key);
                }}
                value={selectedMeasurement}
              >
                <option value="all">Todas las partes</option>
                {measurementOptions.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            {selectedMeasurementHistory.length ? (
              <div className="history-chart chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={selectedMeasurementHistory}
                    margin={{ top: 8, right: 12, bottom: 8, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                      domain={["dataMin - 2", "dataMax + 2"]}
                      unit=" cm"
                      width={72}
                    />
                    <Tooltip formatter={(value) => [`${value} cm`]} />
                    {selectedMeasurement === "all" ? (
                      <>
                        <Legend />
                        {measurementOptions.map(({ key, label }, index) => (
                          <Line
                            activeDot={{ r: 6 }}
                            dataKey={key}
                            dot={{ r: 3 }}
                            key={key}
                            name={label}
                            stroke={measurementColors[index]}
                            strokeWidth={2}
                            type="monotone"
                          />
                        ))}
                      </>
                    ) : (
                      <Line
                        type="monotone"
                        dataKey={selectedMeasurement}
                        name={selectedMeasurementOption?.label}
                        stroke={measurementColors[0]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-slate-500">
                {bodyMeasurements.length
                  ? selectedMeasurementOption
                    ? `Aún no has registrado medidas de ${selectedMeasurementOption.label.toLocaleLowerCase()}.`
                    : "Aún no has registrado medidas corporales."
                  : "Aún no has registrado medidas corporales."}
              </p>
            )}
          </article>

          <article className="surface-card p-4 sm:p-5">
            <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-800 sm:text-lg">
                  Evolución del peso
                </h2>
              </div>
              <button
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-sky-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-800"
                onClick={() => {
                  setIsWeightFormOpen(true);
                }}
                type="button"
              >
                <Plus aria-hidden="true" size={17} />
                Añadir peso
              </button>
            </header>

            {weightHistory.length ? (
              <div className="history-chart chart-container">
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
            className="mobile-sheet m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-slate-200 bg-white p-0 text-slate-800 shadow-xl"
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

          <article className="surface-card p-4 sm:p-5">
            <h2 className="text-base font-bold text-slate-800 sm:text-lg">
              Duración de tus entrenamientos
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Tiempo de tus últimas 7 sesiones completadas.
            </p>
            {workoutDurationHistory.length ? (
              <div className="history-chart chart-container mt-4">
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
