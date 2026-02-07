import React from "react";

/* ---------- Interfaces ---------- */
interface StatCardProps {
  title: string;
  value: string;
  alert?: boolean;
}

interface PatientRowProps {
  name: string;
  grip: string;
  adherence: string;
  status: string;
  warning?: boolean;
}

/* ---------- Main Component ---------- */
export default function DoctorDashboard() {
  // NOTICE: No outer <div className="min-h-screen">. 
  // We just return the content directly.
  return (
    <div className="space-y-8"> 
      
      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-[#0B1E33]">
            Welcome back, Dr. Silva
          </h2>
          <p className="text-gray-500 mt-1">Patient rehabilitation overview</p>
        </div>
      </header>

      {/* Top Stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Patients" value="12" />
        <StatCard title="Active Today" value="7" />
        <StatCard title="Avg Adherence" value="84%" />
        <StatCard title="Alerts" value="2" alert />
      </section>

      {/* Main Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Overview */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="text-lg font-bold text-[#0B1E33] mb-5">Patient Status</h4>

          <div className="space-y-3">
            <PatientRow
              name="John Doe"
              grip="Improving"
              adherence="92%"
              status="Active"
            />
            <PatientRow
              name="Sara K."
              grip="Declining"
              adherence="61%"
              status="Needs Review"
              warning
            />
            <PatientRow
              name="Amal P."
              grip="Stable"
              adherence="78%"
              status="Active"
            />
          </div>
        </div>

        {/* Example: A Calendar or Upcoming box could go here in col-span-1 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <h4 className="text-lg font-bold text-[#0B1E33] mb-5">Quick Actions</h4>
           <button className="w-full py-3 bg-[#0B1E33] text-white rounded-xl mb-3 font-semibold text-sm">Add New Patient</button>
           <button className="w-full py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50">View Schedule</button>
        </div>

      </section>
    </div>
  );
}

/* ---------- Helper Components ---------- */

function StatCard({ title, value, alert }: StatCardProps) {
  return (
    <div
      className={`rounded-2xl p-6 shadow-sm text-white transition-transform hover:scale-105 ${
        alert ? "bg-red-500" : "bg-[#0B1E33]"
      }`}
    >
      <p className="text-sm text-white/70 font-medium">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

function PatientRow({
  name,
  grip,
  adherence,
  status,
  warning,
}: PatientRowProps) {
  return (
    <div
      className={`flex justify-between items-center p-4 rounded-xl transition-colors ${
        warning ? "bg-red-50 border border-red-100" : "bg-gray-50 hover:bg-gray-100"
      }`}
    >
      <div>
        <p className="font-bold text-[#0B1E33]">{name}</p>
        <p className="text-xs text-gray-500 mt-0.5">Grip: <span className="font-medium">{grip}</span></p>
      </div>

      <div className="text-right">
        <p className="font-bold text-[#0B1E33]">{adherence}</p>
        <p
          className={`text-xs font-bold uppercase tracking-wider ${
            warning ? "text-red-500" : "text-green-600"
          }`}
        >
          {status}
        </p>
      </div>
    </div>
  );
}