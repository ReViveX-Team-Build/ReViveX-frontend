import React from "react";
import Link from "next/link";
import { Play } from "lucide-react";

export default function PatientDashboard() {
  return (
    <div className="space-y-8">
      
      {/* HEADER SECTION */}
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-[#0B1E33]">Welcome back, John!</h2>
          <p className="text-gray-500 mt-1">You are doing great. Keep up the momentum.</p>
        </div>
        <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm border border-orange-200">
           🔥 3 Day Streak
        </div>
      </header>

    </div>
  );
}

      {/* HERO CARD: UP NEXT */}
      <div className="bg-[#0B1E33] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
         
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 w-80 h-80 bg-[#2DD4BF]/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-[#2DD4BF]/20 transition-all duration-500"></div>

         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div>
             <div className="flex items-center gap-3 mb-4">
               <span className="bg-[#2DD4BF] text-[#0B1E33] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                 Up Next
               </span>
               <span className="text-gray-300 text-sm font-medium">Today, 10:30 AM</span>
             </div>
             
             <h3 className="text-3xl font-bold mb-2">Synapse Racer: Protocol A</h3>
             <p className="text-gray-400 max-w-md">Targeting Right Hand Motor Control • Moderate Resistance • 15 Mins</p>
           </div>

           <Link href="/patients/game">
             <button className="bg-[#2DD4BF] hover:bg-[#20cbb5] text-[#0B1E33] font-bold py-4 px-8 rounded-2xl shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all active:scale-95 flex items-center gap-3">
               <Play size={20} fill="#0B1E33" /> Start Session
             </button>
           </Link>
         </div>
      </div>
