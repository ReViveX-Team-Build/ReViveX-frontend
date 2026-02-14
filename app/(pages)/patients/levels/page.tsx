"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Play, Trophy } from 'lucide-react';

const LevelsPage = () => {
    const router = useRouter();

    const levels = [
        { 
            id: 1, 
            title: "The Flow", 
            desc: "Calibration & Motor Control", 
            locked: false, 
            path: "/game/level-1", // Links to your new immersive route
            color: "#00FFFF" 
        },
        { 
            id: 2, 
            title: "Rhythm Reef", 
            desc: "Timing & Coordination", 
            locked: false, 
            path: "/game/level-2", 
            color: "#FF00FF" 
        },
        // Add more levels here...
    ];

    return (
        <div className="min-h-screen w-full p-8 flex flex-col items-center animate-in fade-in zoom-in duration-500">
            
            <div className="text-center mb-12 mt-4">
                <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-white to-[#00FFFF] bg-clip-text text-transparent tracking-tighter">
                    MISSION CONTROL
                </h1>
                <p className="text-slate-400 text-lg">Select a neural module to begin rehabilitation.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
                {levels.map((level) => (
                    <div 
                        key={level.id}
                        onClick={() => !level.locked && router.push(level.path)}
                        className={`
                            relative group p-8 rounded-3xl border border-white/10 
                            backdrop-blur-xl bg-white/5 transition-all duration-300
                            ${level.locked ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:-translate-y-2 hover:bg-white/10 cursor-pointer shadow-2xl hover:shadow-[0_0_40px_rgba(0,255,255,0.2)]'}
                        `}
                        style={{ borderTop: `4px solid ${level.color}` }}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <span className="text-4xl font-black text-white/10 font-mono">0{level.id}</span>
                            {level.locked ? <Lock className="text-slate-500" /> : <Trophy className="text-[#00FFFF]" />}
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[#00FFFF] transition-colors">
                            {level.title}
                        </h3>
                        <p className="text-slate-400 text-sm mb-8">{level.desc}</p>

                        {!level.locked && (
                            <button className="w-full py-3 rounded-xl bg-[#00FFFF]/10 text-[#00FFFF] font-bold border border-[#00FFFF]/50 group-hover:bg-[#00FFFF] group-hover:text-black transition-all flex items-center justify-center gap-2">
                                <Play size={18} fill="currentColor" /> START
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LevelsPage;