"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/app/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export default function PatientOutcomesChart() {
  const [user] = useAuthState(auth);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const pQuery = query(collection(db, "users"), where("assignedDoctorId", "==", user.uid));
        const pSnap = await getDocs(pQuery);
        const patients = pSnap.docs.map(d => ({ id: d.id, condition: d.data().condition || "Other" }));

        const sQuery = query(collection(db, "scheduled_sessions"), where("doctorId", "==", user.uid));
        const sSnap = await getDocs(sQuery);
        
        // Map patientId -> max level achieved
        const patientLevels: Record<string, number> = {};
        sSnap.forEach(doc => {
          const s = doc.data();
          if (s.status === "completed") {
            patientLevels[s.patientId] = Math.max(patientLevels[s.patientId] || 1, s.level || 1);
          }
        });

        // Group by condition
        const stats: Record<string, { Improved: number; Stable: number; Declined: number }> = {};
        
        patients.forEach(p => {
          if (!stats[p.condition]) stats[p.condition] = { Improved: 0, Stable: 0, Declined: 0 };
          const maxLvl = patientLevels[p.id] || 0;
          
          if (maxLvl > 3) stats[p.condition].Improved += 1;
          else if (maxLvl > 1) stats[p.condition].Stable += 1;
          else stats[p.condition].Declined += 1;
        });

        const chartData = Object.keys(stats).map(condition => ({
          condition: condition.length > 10 ? condition.substring(0, 10) + '...' : condition,
          Improved: stats[condition].Improved,
          Stable: stats[condition].Stable,
          Declined: stats[condition].Declined,
        }));

        setData(chartData.length > 0 ? chartData : [{ condition: "No Data", Improved: 0, Stable: 0, Declined: 0 }]);
      } catch (err) {
        console.error("Error fetching outcomes", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <h2 className="text-base font-bold text-[#0B1E33] dark:text-slate-100 mb-4">Patient Outcomes by Condition</h2>
      {loading ? (
        <div className="flex justify-center items-center h-[280px]"><Loader2 className="animate-spin text-teal-500" /></div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis dataKey="condition" tick={{fontSize: 12}} />
            <YAxis tick={{fontSize: 12}} />
            <Tooltip cursor={{fill: 'rgba(45,212,191,0.1)'}} contentStyle={{borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}} />
            <Legend wrapperStyle={{fontSize: 12, paddingTop: 10}} />
            <Bar dataKey="Declined" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} />
            <Bar dataKey="Stable" stackId="a" fill="#f59e0b" />
            <Bar dataKey="Improved" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}