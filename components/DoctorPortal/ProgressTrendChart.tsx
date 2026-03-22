"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/app/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export default function ProgressTrendChart() {
  const [user] = useAuthState(auth);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const sQuery = query(collection(db, "scheduled_sessions"), where("doctorId", "==", user.uid), where("status", "==", "completed"));
        const sSnap = await getDocs(sQuery);
        
        const monthlyStats: Record<string, { count: number; totalLevel: number }> = {};
        
        // Process dates into month strings (e.g. "Jan", "Feb")
        sSnap.forEach(doc => {
          const s = doc.data();
          if (!s.scheduledDate) return;
          const date = new Date(s.scheduledDate);
          const month = date.toLocaleString('default', { month: 'short' });
          
          if (!monthlyStats[month]) monthlyStats[month] = { count: 0, totalLevel: 0 };
          monthlyStats[month].count += 1;
          monthlyStats[month].totalLevel += (s.level || 1);
        });

        // Convert to array and format
        const chartData = Object.keys(monthlyStats).map(month => ({
          month,
          sessions: monthlyStats[month].count,
          improvement: parseFloat((monthlyStats[month].totalLevel / monthlyStats[month].count).toFixed(1))
        }));

        // Sort months roughly (this assumes data is within the same year for simplicity)
        const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        chartData.sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));

        setData(chartData.length > 0 ? chartData : [{ month: "Current", sessions: 0, improvement: 0 }]);
      } catch (err) {
        console.error("Error fetching progress trends", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <h2 className="text-base font-bold text-[#0B1E33] dark:text-slate-100 mb-4">Clinic Progress Trend</h2>
      {loading ? (
        <div className="flex justify-center items-center h-[280px]"><Loader2 className="animate-spin text-teal-500" /></div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
            <XAxis dataKey="month" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}} />
            <Legend wrapperStyle={{fontSize: 12, paddingTop: 10}} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="improvement"
              stroke="#14b8a6"
              strokeWidth={3}
              dot={{r: 4, strokeWidth: 2}}
              name="Avg Level Achieved"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="sessions"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{r: 4, strokeWidth: 2}}
              name="Sessions Completed"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}