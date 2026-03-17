"use client";

import ReportKPICard from "@/components/DoctorPortal/ReportKPICard";
import PatientOutcomesChart from "@/components/DoctorPortal/PatientOutcomesChart";
import AdherenceRateChart from "@/components/DoctorPortal/AdherenceRateChart";
import DeviceStatusChart from "@/components/DoctorPortal/DeviceStatusChart";
import ProgressTrendChart from "@/components/DoctorPortal/ProgressTrendChart";

import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/lib/firebase";
import { getDoctorAdherenceSummary } from "@/app/lib/db/schedule";

export default function DoctorReportsPage() {
  const [user, authLoading] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adherenceRate, setAdherenceRate] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [missedSessions, setMissedSessions] = useState(0);
  const [sessionsThisWeek, setSessionsThisWeek] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (authLoading) return;
      if (!user) {
        setLoading(false);
        setError("Please sign in to load report metrics.");
        return;
      }

      try {
        setError(null);
        const summary = await getDoctorAdherenceSummary(user.uid);
        setAdherenceRate(summary.adherenceRate);
        setCompletedSessions(summary.completedSessions);
        setMissedSessions(summary.missedSessions);
        setSessionsThisWeek(summary.sessionsThisWeek);
      } catch (e) {
        console.error("Failed to load adherence metrics:", e);
        setError("Could not load adherence metrics.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user, authLoading]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
            Reports & Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
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
          title="Adherence Rate"
          value={loading ? "--" : `${adherenceRate}%`}
          subtext={error ?? "Completed / scheduled (non-cancelled)"}
          icon="📈"
        />
        <ReportKPICard
          title="Completed Sessions"
          value={loading ? "--" : String(completedSessions)}
          subtext="Marked completed from schedule"
          icon="✅"
        />
        <ReportKPICard
          title="Missed Sessions"
          value={loading ? "--" : String(missedSessions)}
          subtext="Auto-marked from elapsed schedule"
          icon="⚠️"
        />
        <ReportKPICard
          title="Sessions This Week"
          value={loading ? "--" : String(sessionsThisWeek)}
          subtext="Current calendar week"
          icon="🗓️"
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
