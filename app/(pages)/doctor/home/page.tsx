import React from "react";
import { Users, Activity, Clock, ArrowUpRight } from "lucide-react";

export default function DoctorDashboard() {
  return (
    <div className="space-y-8">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1E33]">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Welcome back, Dr. Silva. Here is today's patient activity.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-[#0B1E33] bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
            📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users size={24} />
            </div>
            <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              +12% <ArrowUpRight size={12} className="ml-1"/>
            </span>
          </div>
          <h3 className="text-3xl font-bold text-[#0B1E33]">24</h3>
          <p className="text-sm text-gray-500">Total Active Patients</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-teal-50 text-[#2DD4BF] rounded-xl">
              <Activity size={24} />
            </div>
            <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              +5% <ArrowUpRight size={12} className="ml-1"/>
            </span>
          </div>
          <h3 className="text-3xl font-bold text-[#0B1E33]">8</h3>
          <p className="text-sm text-gray-500">Sessions Today</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Clock size={24} />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-[#0B1E33]">12m</h3>
          <p className="text-sm text-gray-500">Avg. Session Duration</p>
        </div>
      </div>

      {/* RECENT PATIENTS SECTION */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-[#0B1E33] mb-6">Recent Patient Activity</h2>
        
        <div className="space-y-4">
          {/* Patient Item 1 */}
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">JD</div>
              <div>
                <p className="font-bold text-[#0B1E33]">John Doe</p>
                <p className="text-xs text-gray-500">Synapse Racer - Protocol A</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#2DD4BF]">92% Accuracy</p>
              <p className="text-xs text-gray-400">2 mins ago</p>
            </div>
          </div>

          {/* Patient Item 2 */}
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">SK</div>
              <div>
                <p className="font-bold text-[#0B1E33]">Sarah K.</p>
                <p className="text-xs text-gray-500">Memory Dive - Level 2</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-orange-500">78% Accuracy</p>
              <p className="text-xs text-gray-400">15 mins ago</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}