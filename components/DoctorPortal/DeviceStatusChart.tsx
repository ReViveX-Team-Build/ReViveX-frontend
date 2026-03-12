"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "BP Bulb Active", value: 142 },
  { name: "Offline/Inactive", value: 5 },
];

const COLORS = ["#14b8a6", "#ef4444"];

export default function DeviceStatusChart() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-4">
        Device Status
      </h2>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            dataKey="value">
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex justify-between">
          <span>Online Rate</span>
          <span className="font-semibold">96.6%</span>
        </div>
        <div className="flex justify-between">
          <span>Total Devices</span>
          <span className="font-semibold">147</span>
        </div>
        <div className="flex justify-between">
          <span>Needs Attention</span>
          <span className="font-semibold text-red-500">5</span>
        </div>
      </div>
    </div>
  );
}
