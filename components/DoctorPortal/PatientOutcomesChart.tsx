"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const data = [
  { condition: "Stroke", Declined: 8, Improved: 65, Stable: 27 },
  { condition: "TBI", Declined: 6, Improved: 72, Stable: 22 },
  { condition: "MS", Declined: 10, Improved: 60, Stable: 30 },
  { condition: "Parkinson's", Declined: 5, Improved: 70, Stable: 25 },
];

export default function PatientOutcomesChart() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-4">
        Patient Outcomes by Condition
      </h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="condition" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Declined" stackId="a" fill="#ef4444" />
          <Bar dataKey="Improved" stackId="a" fill="#22c55e" />
          <Bar dataKey="Stable" stackId="a" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
