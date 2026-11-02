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

const Home = () => {
  return (
    <section className="space-y-8 p-4">
      <div>
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
      </div>

      <div>
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
      </div>
    </section>
  );
}

export default Home;
