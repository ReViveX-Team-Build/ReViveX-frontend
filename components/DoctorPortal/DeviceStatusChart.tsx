"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "BP Bulb Active", value: 142 },
  { name: "Offline/Inactive", value: 5 },
];

const COLORS = ["#14b8a6", "#ef4444"];

export default function DeviceStatusChart() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-700 mb-4">
        Device Status
      </h2>
    </div>
  );
}

<ResponsiveContainer width="100%" height={220}>
  <PieChart>
    <Pie
      data={data}
      cx="50%"
      cy="50%"
      innerRadius={60}
      outerRadius={90}
      dataKey="value"
    >
      {data.map((entry, index) => (
        <Cell key={index} fill={COLORS[index]} />
      ))}
    </Pie>
    <Tooltip />
  </PieChart>
</ResponsiveContainer>