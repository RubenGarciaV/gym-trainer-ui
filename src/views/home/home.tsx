import { useEffect, useState } from "react";
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
import { apiRequest } from "../../api/client";
import type { WeightEntry, Workout } from "../../api/types";

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
});

const Home = () => {
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
        setError(
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
  }, []);

  const weightHistory = weightEntries
    .slice()
    .reverse()
    .map((entry) => ({
      date: dateFormatter.format(new Date(entry.measuredAt)),
      weight: entry.weightKg,
    }));

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

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-500">Cargando tus estadísticas...</p>
      ) : (
        <>
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Evolución del peso</h2>
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
