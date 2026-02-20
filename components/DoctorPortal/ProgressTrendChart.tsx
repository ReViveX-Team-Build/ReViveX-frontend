"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

const data = [
  { month: "Jul", improvement: 4.2, sessions: 380 },
  { month: "Aug", improvement: 5.1, sessions: 410 },
  { month: "Sep", improvement: 5.8, sessions: 450 },
  { month: "Oct", improvement: 6.3, sessions: 615 },
  { month: "Nov", improvement: 7.0, sessions: 530 },
  { month: "Dec", improvement: 7.8, sessions: 560 },
  { month: "Jan", improvement: 8.2, sessions: 590 },
];

export default function ProgressTrendChart() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-700 mb-4">
        7-Month Progress Trend
      </h2>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="improvement"
            stroke="#14b8a6"
            name="Avg Improvement %"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="sessions"
            stroke="#8b5cf6"
            name="Sessions Completed"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}