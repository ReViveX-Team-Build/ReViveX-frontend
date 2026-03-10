import ReportKPICard from "@/components/DoctorPortal/ReportKPICard";
import PatientOutcomesChart from "@/components/DoctorPortal/PatientOutcomesChart";
import AdherenceRateChart from "@/components/DoctorPortal/AdherenceRateChart";
import DeviceStatusChart from "@/components/DoctorPortal/DeviceStatusChart";
import ProgressTrendChart from "@/components/DoctorPortal/ProgressTrendChart";

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
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Reports & Analytics
          </h1>
          <p className="text-slate-500 mt-1">
            Comprehensive clinical performance metrics and outcomes
          </p>
        </div>
        <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          ↑ Export Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportKPICard
          title="Total Patients"
          value="147"
          subtext="+12 this month"
          icon="👤"
        />
        <ReportKPICard
          title="Avg Adherence"
          value="84.8%"
          subtext="+2.3% vs last month"
          icon="📈"
        />
        <ReportKPICard
          title="Avg Improvement"
          value="+8.2%"
          subtext="Grip strength gain"
          icon="💪"
        />
        <ReportKPICard
          title="Success Rate"
          value="89%"
          subtext="Target achievement"
          icon="🎯"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PatientOutcomesChart />
        <AdherenceRateChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProgressTrendChart />
        </div>
        <DeviceStatusChart />
      </div>

    </div>
  );
}