"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Lock, Play, Activity, Brain, Dumbbell, 
    Zap, Calendar, CheckCircle2, Stethoscope, ChevronRight 
} from 'lucide-react';

// --- TYPES ---
type Category = 'ALL' | 'MOTOR' | 'COGNITIVE' | 'STRENGTH';

const LevelsPage = () => {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState<Category>('ALL');

    // --- MOCK DATA: DOCTOR'S ASSIGNMENT ---
    // In a real app, you would fetch this from your Firebase/Backend
    const assignedSession = {
        title: "Rhythm Reef",
        levelId: 2,
        duration: "15 Mins",
        doctorNote: "Focus on maintaining grip strength during the fast sections.",
        path: "/game/level-2", // Direct link to the assigned game
        isCompleted: false
    };

    // --- DATA: ALL LEVELS ---
    const levels = [
        { 
            id: 1, 
            title: "The Flow", 
            category: "MOTOR",
            desc: "Calibration & Motor Control", 
            locked: false, 
            path: "/game/level-1", 
            difficulty: "Easy",
            color: "text-[#00FFFF]",
            bgColor: "bg-[#00FFFF]"
        },
        { 
            id: 2, 
            title: "Rhythm Reef", 
            category: "MOTOR",
            desc: "Timing & Coordination", 
            locked: false, 
            path: "/game/level-2", 
            difficulty: "Medium",
            color: "text-[#FF00FF]",
            bgColor: "bg-[#FF00FF]"
        },
        { 
            id: 3, 
            title: "Memory Trench", 
            category: "COGNITIVE",
            desc: "Cognitive Dual-Tasking", 
            locked: true, 
            path: "/game/level-3", 
            difficulty: "Hard",
            color: "text-[#FFFF00]",
            bgColor: "bg-[#FFFF00]"
        },
        { 
            id: 4, 
            title: "Precision Peaks", 
            category: "MOTOR",
            desc: "Fine Motor Skills", 
            locked: true, 
            path: "/game/level-4", 
            difficulty: "Hard",
            color: "text-[#00FF00]",
            bgColor: "bg-[#00FF00]"
        },
        { 
            id: 5, 
            title: "Abyss Mastery", 
            category: "STRENGTH",
            desc: "Endurance & Strength", 
            locked: true, 
            path: "/game/level-5", 
            difficulty: "Expert",
            color: "text-[#FF4500]",
            bgColor: "bg-[#FF4500]"
        },
    ];

    // Filter Logic
    const filteredLevels = activeCategory === 'ALL' 
        ? levels 
        : levels.filter(l => l.category === activeCategory);

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-[#0B1E33] to-[#020c1b] text-white p-6 md:p-10 overflow-x-hidden relative">
            
            {/* Ambient Background Glows */}
            <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] bg-[#2DD4BF]/20 rounded-full blur-[150px] pointer-events-none" />
            
            {/* --- HEADER --- */}
            <div className="max-w-7xl mx-auto mb-8">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 mb-2">
                    MISSION CONTROL
                </h1>
                <p className="text-slate-400 text-lg">Your rehabilitation roadmap.</p>
            </div>

            <div className="max-w-7xl mx-auto flex flex-col gap-12">
                
                {/* --- 1. HERO SECTION: THE DOCTOR'S ASSIGNMENT --- */}
                {/* This is the "Decorated" Card you requested */}
                <div className="relative group w-full rounded-[2.5rem] border border-[#2DD4BF]/30 bg-gradient-to-r from-[#0f1f38] to-[#0B1E33] p-1 overflow-hidden shadow-[0_0_50px_-10px_rgba(45,212,191,0.15)]">
                    
                    {/* Glowing Border Animation */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2DD4BF]/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

                    <div className="relative bg-[#0B1E33]/80 backdrop-blur-xl rounded-[2.3rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        
                        {/* Left Info */}
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-[#2DD4BF] text-[#0B1E33] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 animate-pulse">
                                    <div className="w-2 h-2 bg-[#0B1E33] rounded-full" />
                                    Assigned For Today
                                </div>
                                <div className="text-slate-400 text-sm flex items-center gap-2">
                                    <Calendar size={14} /> {new Date().toLocaleDateString()}
                                </div>
                            </div>

                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                    {assignedSession.title} <span className="text-[#2DD4BF]">Protocol</span>
                                </h2>
                                <p className="text-slate-300 text-lg max-w-xl leading-relaxed flex items-start gap-2">
                                    <Stethoscope className="text-[#2DD4BF] mt-1 shrink-0" size={18} />
                                    <span>
                                        <span className="text-[#2DD4BF] font-bold">Dr. Note:</span> "{assignedSession.doctorNote}"
                                    </span>
                                </p>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm text-slate-300 flex items-center gap-2">
                                    <Activity size={16} className="text-yellow-400" />
                                    Target: {assignedSession.duration}
                                </div>
                                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm text-slate-300 flex items-center gap-2">
                                    <Brain size={16} className="text-purple-400" />
                                    Focus: Timing
                                </div>
                            </div>
                        </div>

                        {/* Right Action Button */}
                        <div className="shrink-0 w-full md:w-auto">
                            <button 
                                onClick={() => router.push(assignedSession.path)}
                                className="relative w-full md:w-64 h-20 bg-gradient-to-r from-[#2DD4BF] to-[#0ea5e9] rounded-2xl flex items-center justify-center gap-4 text-[#0B1E33] font-black text-xl tracking-wide group hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_40px_rgba(45,212,191,0.4)] hover:shadow-[0_0_60px_rgba(45,212,191,0.6)]"
                            >
                                <Play fill="currentColor" size={24} />
                                START SESSION
                                
                                {/* Inner sheen effect */}
                                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <p className="text-center text-slate-500 text-xs mt-3 uppercase tracking-wider">
                                Mandatory Session
                            </p>
                        </div>
                    </div>
                </div>


                {/* --- 2. DIVIDER & FILTERS --- */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/10 pb-4">
                    <div>
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                            <CheckCircle2 className="text-slate-500" /> 
                            Module Library
                        </h3>
                        <p className="text-slate-400 text-sm">Replay unlocked levels for extra practice.</p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex gap-2 bg-white/5 p-1 rounded-xl backdrop-blur-md">
                        <FilterTab label="All" active={activeCategory === 'ALL'} onClick={() => setActiveCategory('ALL')} />
                        <FilterTab label="Motor" active={activeCategory === 'MOTOR'} onClick={() => setActiveCategory('MOTOR')} />
                        <FilterTab label="Cognitive" active={activeCategory === 'COGNITIVE'} onClick={() => setActiveCategory('COGNITIVE')} />
                    </div>
                </div>


                {/* --- 3. THE GRID (Manual Selection) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                    {filteredLevels.map((level) => (
                        <div 
                            key={level.id}
                            onClick={() => !level.locked && router.push(level.path)}
                            className={`
                                group relative overflow-hidden rounded-[2rem] border transition-all duration-500
                                ${level.locked 
                                    ? 'border-white/5 bg-white/5 cursor-not-allowed grayscale opacity-60' 
                                    : 'border-white/10 bg-[#112240]/50 hover:border-[#2DD4BF]/50 hover:bg-[#112240] hover:shadow-[0_0_30px_-5px_rgba(45,212,191,0.2)] cursor-pointer hover:-translate-y-1'
                                }
                            `}
                        >
                            <div className="p-8 h-full flex flex-col relative z-20">
                                <div className="flex justify-between items-start mb-6">
                                    <span className="text-4xl font-black text-white/10 font-mono">0{level.id}</span>
                                    {level.locked ? (
                                        <div className="bg-white/5 px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold text-slate-400 border border-white/10">
                                            <Lock size={12} /> LOCKED
                                        </div>
                                    ) : (
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold border border-white/10 bg-white/5 ${level.color}`}>
                                            {level.difficulty}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-8">
                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#2DD4BF] transition-colors">
                                        {level.title}
                                    </h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        {level.desc}
                                    </p>
                                </div>

                                <div className="mt-auto">
                                    {!level.locked && (
                                        <button className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-white font-bold text-sm hover:bg-[#2DD4BF] hover:text-[#0B1E33] hover:border-[#2DD4BF] transition-all flex items-center justify-center gap-2">
                                            REPLAY LEVEL <ChevronRight size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

// --- HELPER COMPONENT ---
const FilterTab = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`
            px-5 py-2 rounded-lg text-xs font-bold transition-all duration-300
            ${active 
                ? 'bg-[#2DD4BF] text-[#0B1E33] shadow-lg shadow-[#2DD4BF]/20' 
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }
        `}
    >
        {label}
    </button>
);

export default LevelsPage;