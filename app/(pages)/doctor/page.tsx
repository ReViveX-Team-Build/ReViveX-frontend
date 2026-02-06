import Link from "next/link";

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

export default function DoctorDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Header */}
        <header className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800">
            Welcome back, Dr. Silva
          </h2>
          <p className="text-gray-500 mt-1">Patient rehabilitation overview</p>
        </header>

        {/* Top Stats */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard title="Total Patients" value="12" />
          <StatCard title="Active Today" value="7" />
          <StatCard title="Avg Adherence" value="84%" />
          <StatCard title="Alerts" value="2" alert />
        </section>

        {/* Main Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Overview */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h4 className="font-bold text-[#0B1E33] mb-5">Patient Overview</h4>

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
        </section>
      </main>
    </div>
  );
}

/* ---------- Components ---------- */

function StatCard({ title, value, alert }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600">
          📊
        </div>
        {alert && (
          <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded-full">
            Alert
          </span>
        )}
      </div>

      <p className="text-2xl font-bold text-[#0B1E33]">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
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
      className={`flex justify-between items-center p-4 rounded-xl mb-3 ${
        warning ? "bg-red-50" : "bg-gray-50"
      }`}>
      <div>
        <p className="font-semibold text-gray-800">{name}</p>
        <p className="text-xs text-gray-500">Grip: {grip}</p>
      </div>

      <div className="text-right">
        <p className="font-bold text-gray-800">{adherence}</p>
        <p
          className={`text-xs font-medium ${
            warning ? "text-red-600" : "text-green-600"
          }`}>
          {status}
        </p>
      </div>
    </div>
  );
}
