"use client";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from "recharts";

const data = [
  { condition: "Stroke",      adherence: 88 },
  { condition: "TBI",         adherence: 82 },
  { condition: "MS",          adherence: 79 },
  { condition: "Parkinson's", adherence: 91 },
];

export default function AdherenceRateChart() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-700 mb-4">
        Adherence Rate by Condition
      </h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="condition" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Bar dataKey="adherence" fill="#14b8a6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}