"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/app/lib/firebase";
import { getDoctorAdherenceSummary } from "@/app/lib/db/schedule";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ChevronRight, FileText, Loader2, Users } from "lucide-react";

// Existing Component Imports
import ReportKPICard from "@/components/DoctorPortal/ReportKPICard";
import PatientOutcomesChart from "@/components/DoctorPortal/PatientOutcomesChart";
import AdherenceRateChart from "@/components/DoctorPortal/AdherenceRateChart";
import DeviceStatusChart from "@/components/DoctorPortal/DeviceStatusChart";

export default function DoctorReportsPage() {
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // KPIs
  const [adherenceRate, setAdherenceRate] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [missedSessions, setMissedSessions] = useState(0);
  const [sessionsThisWeek, setSessionsThisWeek] = useState(0);

  // Real Patients List for the Directory
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (authLoading) return;
      if (!user) {
        router.push("/auth/doctor/signin");
        return;
      }

      try {
        setError(null);
        // 1. Fetch KPIs
        const summary = await getDoctorAdherenceSummary(user.uid);
        setAdherenceRate(summary.adherenceRate);
        setCompletedSessions(summary.completedSessions);
        setMissedSessions(summary.missedSessions);
        setSessionsThisWeek(summary.sessionsThisWeek);

        // 2. Fetch Doctor's Patients for the Directory
        const q = query(
          collection(db, "users"),
          where("role", "==", "patient"),
          where("assignedDoctorId", "==", user.uid),
          where("connectionStatus", "==", "accepted")
        );
        const snap = await getDocs(q);
        setPatients(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error("Failed to load metrics:", e);
        setError("Could not load adherence metrics.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user, authLoading, router]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B1E33] dark:text-slate-100 tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Comprehensive clinical performance metrics and outcomes
          </p>
        </div>
        <button className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2">
          <FileText size={16} /> Export Global Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportKPICard
          title="Adherence Rate"
          value={loading ? "--" : `${adherenceRate}%`}
          subtext={error ?? "Completed vs. Scheduled"}
          icon="📈"
        />
        <ReportKPICard
          title="Completed Sessions"
          value={loading ? "--" : String(completedSessions)}
          subtext="Marked completed"
          icon="✅"
        />
        <ReportKPICard
          title="Missed Sessions"
          value={loading ? "--" : String(missedSessions)}
          subtext="Auto-marked from elapsed time"
          icon="⚠️"
        />
        <ReportKPICard
          title="Sessions This Week"
          value={loading ? "--" : String(sessionsThisWeek)}
          subtext="Current calendar week"
          icon="🗓️"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PatientOutcomesChart />
        <AdherenceRateChart />
        <div className="lg:col-span-2">
          <DeviceStatusChart />
        </div>
      </div>

      {/* Patient Reports Directory */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Users size={20} />
          </div>
          <div>
            <h2 className="font-bold text-[#0B1E33] dark:text-slate-100 text-lg">Individual Patient Reports</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Select a patient to view detailed analytics and clinical notes.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-teal-500" /></div>
        ) : patients.length === 0 ? (
          <div className="p-10 text-center text-slate-500">No active patients found.</div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {patients.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/doctor/reports/${p.id}`)}
                className="flex items-center justify-between p-4 hover:bg-teal-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                    {p.name ? p.name.charAt(0).toUpperCase() : "P"}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{p.name || "Unknown Patient"}</div>
                    <div className="text-xs text-slate-500 font-mono">ID: {p.patientId || p.id.slice(0, 8)} | {p.condition || "Neurological Rehab"}</div>
                  </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-teal-500 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}