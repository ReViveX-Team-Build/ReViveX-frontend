"use client";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/app/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Loader2 } from "lucide-react";

const COLORS = ["#14b8a6", "#ef4444"];

export default function DeviceStatusChart() {
  const [user] = useAuthState(auth);
  const [data, setData] = useState([{ name: "Active", value: 0 }, { name: "Offline", value: 0 }]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const sQuery = query(collection(db, "scheduled_sessions"), where("doctorId", "==", user.uid), where("status", "==", "completed"));
        const sSnap = await getDocs(sQuery);
        
        // Find unique patients who completed a session recently
        const activePatients = new Set();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        sSnap.forEach(doc => {
          const s = doc.data();
          const sessionDate = new Date(s.scheduledDate);
          if (sessionDate >= sevenDaysAgo) {
            activePatients.add(s.patientId);
          }
        });

        // Get total patients
        const pQuery = query(collection(db, "users"), where("assignedDoctorId", "==", user.uid), where("role", "==", "patient"));
        const pSnap = await getDocs(pQuery);
        const totalPatients = pSnap.docs.length;

        const activeCount = activePatients.size;
        const offlineCount = Math.max(0, totalPatients - activeCount);

        setData([
          { name: "Active (Used in last 7 days)", value: activeCount },
          { name: "Offline / Inactive", value: offlineCount }
        ]);

      } catch (err) {
        console.error("Error fetching device status", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const total = data[0].value + data[1].value;
  const activeRate = total > 0 ? ((data[0].value / total) * 100).toFixed(1) : "0.0";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-between">
      <h2 className="text-base font-bold text-[#0B1E33] dark:text-slate-100 mb-4">Patient Hardware Status</h2>
      {loading ? (
        <div className="flex justify-center items-center h-[220px]"><Loader2 className="animate-spin text-teal-500" /></div>
      ) : total === 0 ? (
        <div className="flex justify-center items-center h-[220px] text-slate-400 text-sm">No connected devices</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" stroke="none">
                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index]} />)}
              </Pie>
              <Tooltip contentStyle={{borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-teal-500"/> Online Rate</span>
              <span className="font-bold text-teal-600 dark:text-teal-400">{activeRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400"/> Total Hardware</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"/> Needs Attention</span>
              <span className="font-bold text-red-500">{data[1].value}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}