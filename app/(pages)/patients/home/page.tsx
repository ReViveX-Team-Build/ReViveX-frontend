"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Play,
  Zap,
  Trophy,
  Activity,
  TrendingUp,
  BrainCircuit,
  Wifi,
  Clock,
  Battery,
  Sparkles,
  Lock,
  Gamepad2,
  CalendarCheck,
  Gauge,
  Cpu
} from "lucide-react";

// --- Data ---
const userData = {
  name: "John",
  streak: 3,
  xp: 2450,
  nextSession: {
    title: "Synapse Racer",
    protocol: "Protocol A",
    focus: "Right Hand Motor Control",
    duration: "15 min",
    difficulty: "Moderate",
    time: "10:30 AM",
  },
  stats: {
    grip: "+15%",
    memory: "Top 10%",
    adherence: "92%"
  }
};

export default function PatientDashboard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-sans text-slate-800 pb-12 selection:bg-teal-500/30">
      
      {/* --- BACKGROUND AMBIENCE --- */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[1000px] h-[1000px] bg-teal-400/5 rounded-full blur-[120px] -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[100px] translate-y-1/3"></div>
      </div>

      <main className="max-w-7xl mx-auto p-6 md:p-10 relative z-10">
        
        {/* --- 1. HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-end mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
             <h1 className="text-4xl md:text-5xl font-black text-[#0B1E33] tracking-tight mb-2">
              <span className="block text-lg font-bold text-slate-400 uppercase tracking-widest mb-1">ReViveX Portal</span>
              Hello, {userData.name}.
            </h1>
            <p className="text-slate-500 font-medium max-w-md">
              System is calibrated and ready. Your prescribed session is loaded.
            </p>
          </div>

          {/* Gamification Strip */}
          <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-white shadow-lg shadow-slate-200/50 mt-4 md:mt-0">
            <div className="flex items-center gap-3 px-4 py-2 bg-orange-50 rounded-xl">
              <div className="relative">
                <Zap size={20} className="fill-orange-500 text-orange-600" />
                <div className="absolute inset-0 bg-orange-400 blur-lg opacity-40 animate-pulse"></div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-orange-400 uppercase">Streak</p>
                <p className="text-lg font-bold text-orange-600 leading-none">{userData.streak} Days</p>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="flex items-center gap-3 px-4 py-2">
              <Trophy size={20} className="text-teal-600" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total XP</p>
                <p className="text-lg font-bold text-[#0B1E33] leading-none">{userData.xp}</p>
              </div>
            </div>
          </div>
        </header>


        {/* --- 2. MAIN LAYOUT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- LEFT COLUMN (The Stage) --- */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* HERO CARD: IMMERSIVE GAME PORTAL */}
            <Link href="/patients/levels" className="group relative block w-full aspect-[16/9] md:aspect-[21/9] rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-teal-900/20 hover:-translate-y-1">
              
              {/* Dynamic Background */}
              <div className="absolute inset-0 bg-[#0B1E33]">
                {/* Abstract Mesh Gradient */}
                <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[150%] bg-[conic-gradient(at_center,_var(--tw-gradient-stops))] from-teal-500/20 via-[#0B1E33] to-[#0B1E33] animate-spin-slow opacity-60"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#0B1E33] via-[#0B1E33]/80 to-transparent"></div>
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-between z-20">
                
                {/* Top Badge */}
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-white text-xs font-bold tracking-wider uppercase">
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                      Recommended Session
                   </div>
                   <div className="hidden md:flex items-center gap-2 text-white/60 text-sm font-medium">
                      <Clock size={16} /> {userData.nextSession.duration}
                   </div>
                </div>

                {/* Main Title Area */}
                <div className="max-w-xl space-y-4">
                   <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-lg group-hover:text-teal-50 transition-colors">
                      {userData.nextSession.title}
                   </h2>
                   
                   <div className="flex flex-wrap items-center gap-4 text-slate-300">
                      <span className="flex items-center gap-2 bg-[#0B1E33]/50 px-3 py-1 rounded-lg border border-white/10">
                        <Gamepad2 size={16} className="text-teal-400" />
                        <span className="text-sm font-bold text-white">{userData.nextSession.protocol}</span>
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                      <span className="text-sm">{userData.nextSession.focus}</span>
                   </div>
                </div>

                {/* Bottom Action Area */}
                <div className="flex items-center gap-6 mt-6">
                   <button className="relative overflow-hidden bg-teal-500 hover:bg-teal-400 text-[#0B1E33] px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-3 transition-all shadow-[0_0_40px_rgba(20,184,166,0.4)] group-hover:shadow-[0_0_60px_rgba(20,184,166,0.6)] group-hover:scale-105">
                      <Play size={24} className="fill-[#0B1E33] relative z-10" />
                      <span className="relative z-10">START</span>
                   </button>
                   
                   <div className="hidden md:block h-px flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
                   
                   <div className="hidden md:flex flex-col items-end text-right">
                      <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Difficulty</span>
                      <div className="flex gap-1 mt-1">
                         <div className="w-8 h-2 bg-teal-500 rounded-full"></div>
                         <div className="w-8 h-2 bg-teal-500 rounded-full"></div>
                         <div className="w-8 h-2 bg-white/20 rounded-full"></div>
                      </div>
                   </div>
                </div>
              </div>
            </Link>


            {/* SECONDARY STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Grip Strength", value: userData.stats.grip, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                { label: "Memory Rank", value: userData.stats.memory, icon: BrainCircuit, color: "text-purple-500", bg: "bg-purple-500/10" },
                { label: "Adherence", value: userData.stats.adherence, icon: CalendarCheck, color: "text-blue-500", bg: "bg-blue-500/10" },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group">
                   <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                         <stat.icon size={24} />
                      </div>
                      <div className={`w-2 h-2 rounded-full ${stat.bg.replace('/10','')} animate-pulse`}></div>
                   </div>
                   <p className="text-3xl font-black text-slate-800 tracking-tight">{stat.value}</p>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>


          {/* --- RIGHT COLUMN (The Control Panel) --- */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* 1. SYSTEM INTEGRITY - THE "LEGIT" VERSION */}
            {/* This uses the darker, grid-based visual you liked */}
            <div className="bg-[#0B1E33] rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden">
               {/* Technical Grid Pattern */}
               <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#2DD4BF 1px, transparent 1px), linear-gradient(90deg, #2DD4BF 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
               
               <div className="relative z-10">
                 <div className="flex justify-between items-center mb-6">
                   <h3 className="font-bold text-lg flex items-center gap-2">
                     <Wifi size={18} className="text-teal-400" /> System Integrity
                   </h3>
                   <span className="h-2 w-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></span>
                 </div>

                 <div className="space-y-3">
                   {/* DEVICE 1: MAIN UNIT */}
                   <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.2)]">
                          <Cpu size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">ReViveX Main Unit</p>
                          <p className="text-[10px] text-slate-400">ID: RVX-103-A</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        ONLINE
                      </span>
                   </div>

                   {/* DEVICE 2: BP BULB SENSOR */}
                   <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.2)]">
                          <Gauge size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">Pneumatic Bulb</p>
                          <p className="text-[10px] text-slate-400">Pressure Input</p>
                        </div>
                      </div>
                       <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            READY
                        </span>
                        <span className="text-[9px] text-slate-500">
                            0.0 PSI (Calibrated)
                        </span>
                      </div>
                   </div>
                 </div>
                 
                 <div className="mt-6 pt-4 border-t border-white/10 flex justify-between text-center">
                    <div>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Latency</p>
                        <p className="text-xs font-mono text-teal-400">12ms</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Signal</p>
                        <p className="text-xs font-mono text-teal-400">-42dBm</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Version</p>
                        <p className="text-xs font-mono text-slate-300">v2.1.0</p>
                    </div>
                 </div>
               </div>
            </div>

            {/* 2. AI INSIGHT CARD */}
            <div className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 p-6 rounded-[2.5rem] border border-white shadow-xl shadow-indigo-100/50">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                      <Sparkles size={20} />
                   </div>
                   <h3 className="font-bold text-[#0B1E33]">Daily Insight</h3>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    "Great work yesterday. Your <span className="text-indigo-600 font-bold">pressure control</span> on the bulb was consistent. I recommend tackling the hard session now while your cognitive load is low."
                  </p>
                  <button className="w-full py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors">
                    View Analysis Details
                  </button>
                </div>
              </div>
            </div>
            
            {/* 3. LOCKED/UPCOMING */}
             <div className="p-6 rounded-[2.5rem] border border-slate-200 border-dashed text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                   <Lock size={20} />
                </div>
                <p className="text-sm font-bold text-slate-400">Level 5 Unlocks in 2 Days</p>
             </div>

          </div>
        </div>
      </main>
    </div>
  );
}