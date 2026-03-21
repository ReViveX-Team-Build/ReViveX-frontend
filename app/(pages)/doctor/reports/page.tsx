"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/lib/firebase";
import { getDoctorAdherenceSummary } from "@/app/lib/db/schedule";

export default function DoctorReportsPage() {
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);
  const [metrics, setMetrics] = useState<DoctorReportMetrics | null>(null);
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
        router.push("/auth/doctor/signin");
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
  }, [user, authLoading, router]);

  // Animated counters
  const adherence = useCounter(metrics?.adherenceRate || 0, 1600, 300);
  const gripStrength = useCounter(metrics?.averagePeakGripStrength || 0, 1400, 400, 1);
  const reactionTime = useCounter(metrics?.averageReactionTime || 0, 1200, 500, 0);
  const cognitiveAcc = useCounter(metrics?.averageCognitiveAccuracy || 0, 1400, 350, 1);

  // Mock chart data (replace with real data when available)
  const strengthData = [
    { day: 'Week 1', avg: 28 }, { day: 'Week 2', avg: 32 },
    { day: 'Week 3', avg: 36 }, { day: 'Week 4', avg: 42 },
  ];

  const accuracyData = [
    { day: 'Week 1', accuracy: 72 }, { day: 'Week 2', accuracy: 78 },
    { day: 'Week 3', accuracy: 82 }, { day: 'Week 4', accuracy: 85 },
  ];

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-teal-500 animate-spin" />
          <p className="text-slate-500">Loading report metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-800 font-semibold">Error Loading Reports</p>
          <p className="text-red-600 text-sm mt-2">{error || "No data available"}</p>
        </div>
      </div>
    );
  }

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

              <div style={{ 
                padding: '16px', 
                background: 'rgba(240,244,248,0.7)', 
                borderRadius: 12, 
                border: '1px solid rgba(226,232,240,0.8)' 
              }}>
                <p style={{ 
                  fontFamily: "'JetBrains Mono',monospace", 
                  fontSize: 9, 
                  color: '#94a3b8', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.12em', 
                  marginBottom: 8 
                }}>
                  Avg Duration
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: '#0B1E33', fontFamily: "'JetBrains Mono',monospace" }}>
                    {metrics.averageSessionDuration.toFixed(1)}
                  </span>
                  <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>min</span>
                </div>
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>per session</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 🔴 NEW: Patient Reports Directory */}
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
                    <div className="text-xs text-slate-500 font-mono">ID: {p.patientId || p.id.slice(0,8)} | {p.condition || "Neurological Rehab"}</div>
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