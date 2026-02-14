"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Lock, Play, Activity, Brain, Dumbbell, 
    LayoutGrid, Zap, TrendingUp 
} from 'lucide-react';

// --- TYPES ---
type Category = 'ALL' | 'MOTOR' | 'COGNITIVE' | 'STRENGTH';

const LevelsPage = () => {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState<Category>('ALL');

    // --- DATA ---
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
        // 1. BACKGROUND: Deep Blue Gradient (Matches Global Theme but Darker)
        <div className="min-h-screen w-full bg-gradient-to-b from-[#0B1E33] to-[#020c1b] text-white p-8 overflow-hidden relative">
            
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#2DD4BF]/10 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00FFFF]/5 rounded-full blur-[128px] pointer-events-none" />

            {/* 2. HEADER SECTION */}
            <div className="relative z-10 max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h2 className="text-[#2DD4BF] font-bold tracking-widest text-sm uppercase mb-2">Rehabilitation Protocols</h2>
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-slate-400">
                        MISSION CONTROL
                    </h1>
                </div>

                {/* 3. FILTER PILLS (Replaces Sidebar) */}
                <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl backdrop-blur-md border border-white/10">
                    <FilterTab label="All" active={activeCategory === 'ALL'} onClick={() => setActiveCategory('ALL')} />
                    <FilterTab label="Motor" active={activeCategory === 'MOTOR'} onClick={() => setActiveCategory('MOTOR')} />
                    <FilterTab label="Cognitive" active={activeCategory === 'COGNITIVE'} onClick={() => setActiveCategory('COGNITIVE')} />
                    <FilterTab label="Strength" active={activeCategory === 'STRENGTH'} onClick={() => setActiveCategory('STRENGTH')} />
                </div>
            </div>

            {/* 4. CARDS GRID */}
            <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                {filteredLevels.map((level, index) => (
                    <div 
                        key={level.id}
                        onClick={() => !level.locked && router.push(level.path)}
                        className={`
                            group relative overflow-hidden rounded-[2rem] border transition-all duration-500
                            ${level.locked 
                                ? 'border-white/5 bg-white/5 cursor-not-allowed grayscale opacity-60' 
                                : 'border-white/10 bg-[#112240]/80 hover:border-[#2DD4BF]/50 hover:shadow-[0_0_40px_-10px_rgba(45,212,191,0.3)] cursor-pointer hover:-translate-y-2'
                            }
                        `}
                    >
                        {/* Card Content Container */}
                        <div className="p-8 h-full flex flex-col relative z-20">
                            
                            {/* Top Row: Number & Difficulty */}
                            <div className="flex justify-between items-start mb-6">
                                <span className="text-4xl font-black text-white/10 font-mono">
                                    0{level.id}
                                </span>
                                {level.locked ? (
                                    <div className="bg-white/5 px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold text-slate-400 border border-white/10">
                                        <Lock size={12} /> LOCKED
                                    </div>
                                ) : (
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold border border-white/10 bg-white/5 ${level.color}`}>
                                        {level.difficulty.toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Middle: Title & Desc */}
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[#2DD4BF] transition-colors duration-300">
                                    {level.title}
                                </h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {level.desc}
                                </p>
                            </div>

                            {/* Bottom: Action Button */}
                            <div className="mt-auto">
                                {!level.locked ? (
                                    <button className="w-full py-4 rounded-xl bg-[#2DD4BF] text-[#0B1E33] font-bold text-sm tracking-wide flex items-center justify-center gap-2 group-hover:scale-[1.02] transition-transform duration-300 shadow-lg shadow-[#2DD4BF]/20">
                                        <Play size={18} fill="currentColor" /> START SESSION
                                    </button>
                                ) : (
                                    <div className="w-full py-4 rounded-xl border border-dashed border-white/10 text-white/20 font-bold text-sm text-center">
                                        COMPLETE LEVEL {level.id - 1} TO UNLOCK
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Hover Gradient Overlay */}
                        {!level.locked && (
                            <div className="absolute inset-0 bg-gradient-to-t from-[#2DD4BF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- HELPER COMPONENT ---
const FilterTab = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`
            px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300
            ${active 
                ? 'bg-[#2DD4BF] text-[#0B1E33] shadow-lg shadow-[#2DD4BF]/25' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }
        `}
    >
        {label}
    </button>
);

export default LevelsPage;