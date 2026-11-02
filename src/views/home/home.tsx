import { useState } from "react";
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
import Select from "../../components/select/select";

const weightHistory = [
  { date: "01/06", weight: 82.4 },
  { date: "08/06", weight: 81.9 },
  { date: "15/06", weight: 81.2 },
  { date: "15/06", weight: 81.2 },
  { date: "15/06", weight: 81.2 },
  { date: "15/06", weight: 81.2 },
  { date: "15/06", weight: 81.2 },
  { date: "15/06", weight: 81.2 },
  { date: "22/06", weight: 80.8 },
  { date: "29/06", weight: 80.3 },
  { date: "06/07", weight: 79.7 },
];

const workoutDurationHistory = [
  { date: "02/10", name: "Tren superior", duration: 52 },
  { date: "07/10", name: "Pierna", duration: 46 },
  { date: "12/10", name: "Full body", duration: 61 },
  { date: "17/10", name: "Pecho y tríceps", duration: 48 },
  { date: "22/10", name: "Espalda y bíceps", duration: 57 },
  { date: "27/10", name: "Pierna", duration: 43 },
  { date: "01/11", name: "Full body", duration: 55 },
];

const exerciseWeightHistory = {
  "Press banca": [
    { date: "01/10", weight: 50 },
    { date: "08/10", weight: 52.5 },
    { date: "15/10", weight: 52.5 },
    { date: "22/10", weight: 55 },
    { date: "29/10", weight: 57.5 },
  ],
  Sentadilla: [
    { date: "01/10", weight: 70 },
    { date: "08/10", weight: 70 },
    { date: "15/10", weight: 72.5 },
    { date: "22/10", weight: 75 },
    { date: "29/10", weight: 75 },
  ],
  "Peso muerto": [
    { date: "01/10", weight: 90 },
    { date: "08/10", weight: 95 },
    { date: "15/10", weight: 95 },
    { date: "22/10", weight: 100 },
    { date: "29/10", weight: 105 },
  ],
  "Press militar": [
    { date: "01/10", weight: 30 },
    { date: "08/10", weight: 32.5 },
    { date: "15/10", weight: 32.5 },
    { date: "22/10", weight: 35 },
    { date: "29/10", weight: 35 },
  ],
  "Remo con barra": [
    { date: "01/10", weight: 45 },
    { date: "08/10", weight: 47.5 },
    { date: "15/10", weight: 50 },
    { date: "22/10", weight: 50 },
    { date: "29/10", weight: 52.5 },
  ],
};

type ExerciseName = keyof typeof exerciseWeightHistory;

const Home = () => {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseName>("Press banca");

  return (
    <section className="space-y-8 p-4">
      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">Histórico de peso</h2>
        <div className="history-chart h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightHistory} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
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
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">Duración de los últimos 7 entrenos</h2>
        <div className="history-chart h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workoutDurationHistory} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis unit=" min" width={72} />
              <Tooltip
                labelFormatter={(_, payload) => payload[0]?.payload.name ?? ""}
                formatter={(value) => [`${value} min`, "Duración"]}
              />
              <Bar dataKey="duration" name="Duración" fill="#0284c7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Histórico de peso por ejercicio</h2>
          <Select
            options={Object.keys(exerciseWeightHistory)}
            selected={selectedExercise}
            onChange={(value) => setSelectedExercise(value as ExerciseName)}
          />
        </div>
        <div className="history-chart h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={exerciseWeightHistory[selectedExercise]}
              margin={{ top: 8, right: 12, bottom: 8, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis unit=" kg" width={72} />
              <Tooltip formatter={(value) => [`${value} kg`, "Peso"]} />
              <Line
                type="monotone"
                dataKey="weight"
                name={selectedExercise}
                stroke="#0284c7"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}

export default Home;
