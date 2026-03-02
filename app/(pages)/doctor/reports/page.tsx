'use client';

import Link from "next/link";

type Patient = {
  id: string;
  name: string;
  status: "Stable" | "Improving" | "Needs Attention";
};

const patients: Patient[] = [
  { id: "rvx-001", name: "Nimal Perera", status: "Improving" },
  { id: "rvx-002", name: "Saman Silva", status: "Needs Attention" },
];

export default function DoctorReportsPage() {
  return (
    <div className="p-8 max-w-6xl">

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#0B1E33]">
          Patient Reports
        </h1>
        <p className="text-gray-500 mt-1">
          Select a patient to view detailed clinical insights
        </p>
      </header>

      <div className="space-y-4">
        {patients.map((patient) => (
          <Link key={patient.id} href={`/doctor/reports/${patient.id}`}>
            <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-teal-500 hover:-translate-y-1 flex justify-between items-center">

              <div>
                <p className="font-semibold text-[#0B1E33] group-hover:text-teal-600 transition">
                  {patient.name}
                </p>
                <p className="text-sm text-gray-500">
                  Patient ID: {patient.id.toUpperCase()}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 text-xs rounded-full ${
                    patient.status === "Improving"
                      ? "bg-green-100 text-green-600"
                      : patient.status === "Needs Attention"
                      ? "bg-red-100 text-red-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  {patient.status}
                </span>

                <span className="text-gray-400 group-hover:text-teal-600 transition">
                  →
                </span>
              </div>

            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}