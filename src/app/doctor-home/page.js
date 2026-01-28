import Link from "next/link";
import {
  Home,
  Users,
  MessageCircle,
  BarChart3,
  Settings
} from "lucide-react";


export default function DoctorDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar Navigation (Doctor) */}
      <aside className="w-64 bg-[#0B1E33] text-white hidden md:flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center font-bold text-lg text-[#0B1E33]">
            R
          </div>
          <div>
            <h1 className="text-xl font-bold">ReViveX</h1>
            <p className="text-xs text-gray-400">Doctor Portal</p>
          </div>
        </div>

        <nav className="space-y-2">
          <button className="flex items-center gap-3 w-full px-4 py-3 bg-teal-500 text-[#0B1E33] rounded-xl font-semibold">
            <Home size={18} />
            Dashboard
          </button>

          <button className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/10 rounded-xl text-gray-300">
            <Users size={18} />
            Patients
          </button>

          <button className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/10 rounded-xl text-gray-300">
            <MessageCircle size={18} />
            Messages
          </button>

          <button className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/10 rounded-xl text-gray-300">
            <BarChart3 size={18} />
            Analytics
          </button>

          <button className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/10 rounded-xl text-gray-300">
            <Settings size={18} />
            Settings
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">

        {/* Header */}
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            Welcome back, Dr. Silva
          </h2>
          <p className="text-gray-500 mt-1">
            Patient rehabilitation overview
          </p>
        </header>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Patients" value="12" />
          <StatCard title="Active Today" value="7" />
          <StatCard title="Avg Adherence" value="84%" />
          <StatCard title="Alerts" value="2" alert />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Patient Overview */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h4 className="font-bold text-[#0B1E33] mb-4">
              Patient Overview
            </h4>

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

          {/* Side Panel (Doctor Focus) */}
          <div className="bg-[#0B1E33] text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

            <div className="relative z-10">
              <h4 className="font-bold mb-4">Doctor Actions</h4>

              <div className="space-y-3">
                <Link href="/doctor-home/messages">
                  <button className="w-full bg-teal-500 hover:bg-teal-400 text-[#0B1E33] font-bold py-3 rounded-xl transition">
                    Open Messages
                  </button>
                </Link>

                <Link href="/doctor-home/patients">
                  <button className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl transition">
                    View All Patients
                  </button>
                </Link>

                <button className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl transition">
                  Review Analytics
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

/* ---------- Components ---------- */

function StatCard({ title, value, alert }) {
  return (
    <div
      className={`rounded-2xl p-5 shadow-sm text-white ${
        alert ? "bg-red-500" : "bg-[#0B1E33]"
      }`}
    >
      <p className="text-sm text-gray-300">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function PatientRow({ name, grip, adherence, status, warning }) {
  return (
    <div
      className={`flex justify-between items-center p-4 rounded-xl mb-3 ${
        warning ? "bg-red-50" : "bg-gray-50"
      }`}
    >
      <div>
        <p className="font-semibold text-gray-800">{name}</p>
        <p className="text-xs text-gray-500">
          Grip: {grip}
        </p>
      </div>

      <div className="text-right">
        <p className="font-bold text-gray-800">{adherence}</p>
        <p
          className={`text-xs font-medium ${
            warning ? "text-red-600" : "text-green-600"
          }`}
        >
          {status}
        </p>
      </div>
    </div>
  );
}