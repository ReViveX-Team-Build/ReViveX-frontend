"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/app/lib/firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ArrowLeft, Save, Loader2, User, Activity, CheckCircle2 } from "lucide-react";

export default function PatientDetailedReportPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params?.id as string;
  const [user] = useAuthState(auth);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Real Data States
  const [patientData, setPatientData] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [metrics, setMetrics] = useState({
    total: 0,
    completed: 0,
    missed: 0,
    rate: 0
  });

  useEffect(() => {
    const fetchDetailedData = async () => {
      if (!user || !patientId) return;
      try {
        // 1. Fetch Patient Document
        const pRef = doc(db, "users", patientId);
        const pSnap = await getDoc(pRef);
        
        if (pSnap.exists()) {
          const data = pSnap.data();
          setPatientData(data);
          setNotes(data.clinicalNotes || ""); // Load existing notes
        }

        // 2. Fetch all their game sessions to calculate real metrics
        const sQuery = query(collection(db, "scheduled_sessions"), where("patientId", "==", patientId));
        const sSnap = await getDocs(sQuery);
        
        let completed = 0;
        let missed = 0;
        const total = sSnap.docs.length;

        sSnap.docs.forEach(doc => {
          const s = doc.data();
          if (s.status === "completed") completed++;
          if (s.status === "missed") missed++;
        });

        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        setMetrics({ total, completed, missed, rate });

      } catch (err) {
        console.error("Failed to fetch patient report data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedData();
  }, [user, patientId]);

  const handleSaveNotes = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateDoc(doc(db, "users", patientId), {
        clinicalNotes: notes
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000); // Hide success message after 3s
    } catch (error) {
      console.error("Error saving notes:", error);
      alert("Failed to save notes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="animate-spin text-teal-500 w-10 h-10" />
      </div>
    );
  }

  if (!patientData) {
    return <div className="p-8 text-center text-red-500">Patient not found or access denied.</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto transition-colors duration-200">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-teal-600 mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Directory
      </button>

      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B1E33] dark:text-slate-100 tracking-tight">
            {patientData.name}'s Report
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">
            Clinical performance, adherence, and caregiver information
          </p>
        </div>
      </header>

      <div className="space-y-8">
        
        {/* Patient Overview */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-7 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-5 text-[#0B1E33] dark:text-slate-100">
            <User size={18} className="text-teal-500" />
            <h2 className="font-bold text-lg">Patient Overview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <Info label="Patient ID" value={patientData.patientId || patientId.slice(0, 8).toUpperCase()} />
            <Info label="Condition" value={patientData.condition || "Neuro Motor Recovery"} />
            <Info label="Email" value={patientData.email || "N/A"} />
            <Info label="Account Created" value={patientData.createdAt ? new Date(patientData.createdAt.seconds * 1000).toLocaleDateString() : "Recent"} />
          </div>
        </section>

        {/* Performance Metrics */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-7 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-5 text-[#0B1E33] dark:text-slate-100">
            <Activity size={18} className="text-teal-500" />
            <h2 className="font-bold text-lg">ReViveX Metrics</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Metric 
              label="Session Adherence" 
              value={`${metrics.rate}%`} 
              status={metrics.rate >= 75 ? "good" : metrics.rate >= 50 ? "warning" : "bad"} 
            />
            <Metric label="Total Assigned" value={String(metrics.total)} status="good" />
            <Metric label="Completed" value={String(metrics.completed)} status="good" />
            <Metric 
              label="Missed Sessions" 
              value={String(metrics.missed)} 
              status={metrics.missed > 2 ? "warning" : "good"} 
            />
          </div>
        </section>

        {/* Caregiver Information */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-7 shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-[#0B1E33] dark:text-slate-100 mb-5 text-lg">
            Caregiver Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <Info label="Caregiver Name" value={patientData.caregiverName || "Not provided"} />
            <Info label="Relationship" value={patientData.caregiverRelation || "Not provided"} />
            <Info label="Contact Number" value={patientData.caregiverPhone || "Not provided"} />
            <Info label="Email" value={patientData.caregiverEmail || "Not provided"} />
          </div>
        </section>

        {/* Clinical Notes (Now functional!) */}
        <section className="bg-[#F0FDFB] dark:bg-slate-800/50 rounded-2xl p-7 border border-teal-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-bl-full pointer-events-none" />
          
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-[#0B1E33] dark:text-slate-100 text-lg">
              Clinical Notes
            </h2>
            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs font-bold text-teal-600 bg-teal-100 px-3 py-1 rounded-full animate-pulse">
                <CheckCircle2 size={12} /> Saved Successfully
              </span>
            )}
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add observations, progression markers, or update the rehabilitation strategy..."
            className="w-full h-40 px-5 py-4 rounded-xl border border-teal-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-none shadow-inner"
          />

          <div className="mt-5 flex justify-end">
            <button 
              onClick={handleSaveNotes}
              disabled={saving}
              className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? "Saving..." : "Save Notes"}
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}

// Sub-components
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 tracking-wide uppercase">{label}</p>
      <p className="font-semibold text-slate-800 dark:text-slate-200 text-base">{value}</p>
    </div>
  );
}

function Metric({ label, value, status }: { label: string; value: string; status: "good" | "warning" | "bad" }) {
  const color =
    status === "good" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50" : 
    status === "warning" ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-100 dark:border-amber-800/50" : 
    "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border-rose-100 dark:border-rose-800/50";

  return (
    <div className={`border rounded-2xl p-5 ${color} flex flex-col justify-between`}>
      <p className="text-xs font-bold opacity-70 mb-2 tracking-wide uppercase">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-extrabold">{value}</p>
        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-white/50 dark:bg-black/20 mix-blend-multiply dark:mix-blend-screen">
          {status.toUpperCase()}
        </span>
      </div>
    </div>
  );
}