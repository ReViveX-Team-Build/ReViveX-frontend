"use client";

import { useParams } from "next/navigation";

export default function PatientDetailedReportPage() {
  const params = useParams();
  const patientId = params?.id as string;

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#0B1E33] dark:text-slate-100">
          Patient Detailed Report
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">
          Clinical performance and caregiver information
        </p>
      </header>

      <div className="space-y-8">
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-[#0B1E33] dark:text-slate-100 mb-4">
            Patient Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <Info label="Patient ID" value={patientId.toUpperCase()} />
            <Info label="Assigned Doctor" value="Dr. Silva" />
            <Info label="Rehabilitation Type" value="Neuro Motor Recovery" />
            <Info label="Enrollment Date" value="2026-01-10" />
          </div>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-[#0B1E33] dark:text-slate-100 mb-4">
            Performance Metrics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Metric label="Session Completion Rate" value="82%" status="good" />
            <Metric
              label="Missed Sessions"
              value="3 in last 30 days"
              status="warning"
            />
            <Metric
              label="Improvement Trend"
              value="+12% Grip Strength"
              status="good"
            />
            <Metric
              label="Cognitive Accuracy Trend"
              value="-4% decline"
              status="bad"
            />
            <Metric
              label="Reaction Time Improvement"
              value="-9% faster"
              status="good"
            />
            <Metric
              label="Engagement Streak"
              value="5 days active"
              status="good"
            />
          </div>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-[#0B1E33] dark:text-slate-100 mb-4">
            Missed Session History
          </h2>

          <ul className="text-sm text-gray-600 dark:text-slate-300 space-y-2">
            <li>2026-02-28 — Grip Strength Training</li>
            <li>2026-02-15 — Cognitive Memory Exercise</li>
            <li>2026-01-30 — Grip Strength Training</li>
          </ul>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-[#0B1E33] dark:text-slate-100 mb-4">
            Caregiver Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <Info label="Caregiver Name" value="Anjali Perera" />
            <Info label="Relationship" value="Daughter" />
            <Info label="Contact Number" value="+94 77 123 4567" />
            <Info label="Email" value="anjali.perera@email.com" />
          </div>
        </section>

        <section className="bg-[#F7F9FC] dark:bg-slate-800/50 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
          <h2 className="font-bold text-[#0B1E33] dark:text-slate-100 mb-4">
            Clinical Notes
          </h2>

          <textarea
            placeholder="Add observations or update rehabilitation strategy..."
            className="w-full h-32 px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          />

          <button className="mt-4 bg-teal-600 hover:bg-teal-500 text-white px-6 py-2 rounded-xl font-semibold transition">
            Save Notes
          </button>
        </section>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="font-medium text-gray-800 dark:text-slate-200">{value}</p>
    </div>
  );
}

function Metric({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: "good" | "warning" | "bad";
}) {
  const color =
    status === "good"
      ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
      : status === "warning"
        ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
        : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";

  return (
    <div className="border border-gray-200 dark:border-slate-700 dark:bg-slate-700/30 rounded-xl p-4">
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="font-semibold text-gray-800 dark:text-slate-200 mb-2">
        {value}
      </p>
      <span className={`px-2 py-1 text-xs rounded-full ${color}`}>
        {status.toUpperCase()}
      </span>
    </div>
  );
}
