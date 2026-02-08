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
