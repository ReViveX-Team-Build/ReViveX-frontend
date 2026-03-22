"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/app/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export default function AdherenceRateChart() {
  const [user] = useAuthState(auth);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // 1. Get all patients for this doctor to map their conditions
        const pQuery = query(collection(db, "users"), where("assignedDoctorId", "==", user.uid));
        const pSnap = await getDocs(pQuery);
        const conditionMap: Record<string, string> = {};
        pSnap.forEach(doc => {
          conditionMap[doc.id] = doc.data().condition || "Other";
        });

        // 2. Get all sessions
        const sQuery = query(collection(db, "scheduled_sessions"), where("doctorId", "==", user.uid));
        const sSnap = await getDocs(sQuery);
        
        // 3. Tally adherence by condition
        const stats: Record<string, { total: number; completed: number }> = {};
        
        sSnap.forEach(doc => {
          const s = doc.data();
          const condition = conditionMap[s.patientId] || "Other";
          if (!stats[condition]) stats[condition] = { total: 0, completed: 0 };
          
          stats[condition].total += 1;
          if (s.status === "completed") stats[condition].completed += 1;
        });

        // 4. Format for Recharts
        const chartData = Object.keys(stats).map(condition => ({
          condition: condition.length > 10 ? condition.substring(0, 10) + '...' : condition, // truncate long names
          adherence: stats[condition].total > 0 
            ? Math.round((stats[condition].completed / stats[condition].total) * 100) 
            : 0
        }));

        setData(chartData.length > 0 ? chartData : [{ condition: "No Data", adherence: 0 }]);
      } catch (err) {
        console.error("Error fetching adherence chart data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <h2 className="text-base font-bold text-[#0B1E33] dark:text-slate-100 mb-4">Adherence Rate by Condition</h2>
      {loading ? (
        <div className="flex justify-center items-center h-[280px]"><Loader2 className="animate-spin text-teal-500" /></div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis dataKey="condition" tick={{fontSize: 12}} />
            <YAxis domain={[0, 100]} tick={{fontSize: 12}} />
            <Tooltip cursor={{fill: 'rgba(45,212,191,0.1)'}} contentStyle={{borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}} />
            <Bar dataKey="adherence" fill="#14b8a6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}