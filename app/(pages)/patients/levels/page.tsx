"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock, Play, Activity, Brain,
  Zap, Calendar, CheckCircle2, Stethoscope,
  ChevronRight, Target, Timer, TrendingUp,
  Shield, Cpu, Radio, Waves, Sparkles,
  Trophy, Star, Clock, BarChart3
} from 'lucide-react';

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */
type Category = 'ALL' | 'MOTOR' | 'COGNITIVE' | 'STRENGTH';

interface Level {
  id: number;
  title: string;
  category: Category;
  desc: string;
  locked: boolean;
  path: string;
  difficulty: string;
  difficultyN: number;
  accentHex: string;
  icon: React.ReactNode;
  xp: number;
  duration: string;
  completedSessions: number;
  targetSessions: number;
  tags: string[];
}

/* ═══════════════════════════════════════════
   DATA
═══════════════════════════════════════════ */
const LEVELS: Level[] = [
  {
    id: 1, title: "The Flow", category: "MOTOR",
    desc: "Baseline calibration and introductory motor control. Establishes your squeeze-force baseline for the hardware sensor.",
    locked: false, path: "/game/level-1", difficulty: "Calibration", difficultyN: 1,
    accentHex: "#14b8a6",
    icon: <Waves size={20} />, xp: 120, duration: "10 min",
    completedSessions: 4, targetSessions: 5,
    tags: ["Sensor Setup", "Motor"],
  },
  {
    id: 2, title: "Rhythm Reef", category: "MOTOR",
    desc: "Develop grip timing and fine coordination. Synchronise your squeeze cadence with oncoming pearl patterns.",
    locked: false, path: "/game/level-2", difficulty: "Medium", difficultyN: 2,
    accentHex: "#8b5cf6",
    icon: <Radio size={20} />, xp: 280, duration: "15 min",
    completedSessions: 2, targetSessions: 5,
    tags: ["Timing", "Coordination"],
  },
  {
    id: 3, title: "Memory Trench", category: "COGNITIVE",
    desc: "Cognitive dual-tasking protocol. Navigate while sequencing colour targets from working memory.",
    locked: true, path: "/game/level-3", difficulty: "Hard", difficultyN: 3,
    accentHex: "#f59e0b",
    icon: <Brain size={20} />, xp: 450, duration: "20 min",
    completedSessions: 0, targetSessions: 5,
    tags: ["Dual-Task", "Memory"],
  },
  {
    id: 4, title: "Precision Peaks", category: "MOTOR",
    desc: "Micro-force control training. Thread the fish through sub-pixel gate windows at increasing speed.",
    locked: true, path: "/game/level-4", difficulty: "Hard", difficultyN: 4,
    accentHex: "#22c55e",
    icon: <Target size={20} />, xp: 600, duration: "20 min",
    completedSessions: 0, targetSessions: 5,
    tags: ["Fine Motor", "Speed"],
  },
  {
    id: 5, title: "Abyss Mastery", category: "STRENGTH",
    desc: "Sustained endurance protocol. Maintain consistent grip force for the full session against adaptive resistance.",
    locked: true, path: "/game/level-5", difficulty: "Expert", difficultyN: 5,
    accentHex: "#ef4444",
    icon: <Shield size={20} />, xp: 1000, duration: "25 min",
    completedSessions: 0, targetSessions: 5,
    tags: ["Endurance", "Strength"],
  },
];

const ASSIGNED = {
  title: "Rhythm Reef",
  levelId: 2,
  duration: "15 Mins",
  doctorNote: "Focus on maintaining grip strength during the fast sections. Aim for consistent timing — not maximum force.",
  path: "/game/level-2",
};

/* ═══════════════════════════════════════════
   GLOBAL CSS
═══════════════════════════════════════════ */
const GLOBAL_CSS = `
  @keyframes shimmer {
    0%   { transform: translateX(-200%); }
    100% { transform: translateX(200%);  }
  }
  @keyframes scanline {
    0%   { top: -10%; opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { top: 110%; opacity: 0; }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  .anim-up         { animation: fadeSlideUp 0.55s cubic-bezier(0.4,0,0.2,1) both; }
  .anim-up.d1      { animation-delay: 0.07s; }
  .anim-up.d2      { animation-delay: 0.14s; }
  .anim-up.d3      { animation-delay: 0.21s; }
  .anim-up.d4      { animation-delay: 0.28s; }
  .anim-up.d5      { animation-delay: 0.35s; }
`;

/* ═══════════════════════════════════════════
   CANVAS NEURAL NETWORK
═══════════════════════════════════════════ */
interface NNode {
  x: number; y: number;
  homeX: number; homeY: number;
  vx: number; vy: number;
  level: Level;
  pulsePhase: number;
}
interface NEdge { from: number; to: number; progress: number; speed: number; }

const NeuralNetworkCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<NNode[]>([]);
  const edgesRef = useRef<NEdge[]>([]);
  const rafRef   = useRef<number>(0);
  const tsRef    = useRef<number>(0);

  const init = useCallback((w: number, h: number) => {
    const pos = [
      { x: w * 0.10, y: h * 0.60 },
      { x: w * 0.30, y: h * 0.28 },
      { x: w * 0.52, y: h * 0.65 },
      { x: w * 0.72, y: h * 0.25 },
      { x: w * 0.90, y: h * 0.60 },
    ];
    nodesRef.current = LEVELS.map((lvl, i) => ({
      x: pos[i].x, y: pos[i].y,
      homeX: pos[i].x, homeY: pos[i].y,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      level: lvl,
      pulsePhase: Math.random() * Math.PI * 2,
    }));
    edgesRef.current = [
      { from: 0, to: 1, progress: 0,   speed: 0.0028 },
      { from: 1, to: 2, progress: 0.3, speed: 0.0022 },
      { from: 2, to: 3, progress: 0.6, speed: 0.0025 },
      { from: 3, to: 4, progress: 0.1, speed: 0.0020 },
      { from: 0, to: 2, progress: 0.5, speed: 0.0015 },
      { from: 1, to: 3, progress: 0.7, speed: 0.0018 },
    ];
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let dpr = window.devicePixelRatio || 1;

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      init(rect.width, rect.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = (ts: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const W = rect.width, H = rect.height;
      tsRef.current = ts * 0.001;

      ctx.clearRect(0, 0, W, H);

      // Edges
      edgesRef.current.forEach(edge => {
        edge.progress = (edge.progress + edge.speed) % 1;
        const n1 = nodesRef.current[edge.from];
        const n2 = nodesRef.current[edge.to];
        if (!n1 || !n2) return;
        const both = !n1.level.locked && !n2.level.locked;

        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.strokeStyle = both ? 'rgba(20,184,166,0.18)' : 'rgba(148,163,184,0.10)';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (both) {
          const sx = n1.x + (n2.x - n1.x) * edge.progress;
          const sy = n1.y + (n2.y - n1.y) * edge.progress;
          const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, 6);
          grd.addColorStop(0, 'rgba(20,184,166,0.9)');
          grd.addColorStop(1, 'rgba(20,184,166,0)');
          ctx.beginPath();
          ctx.arc(sx, sy, 6, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }
      });

      // Nodes
      nodesRef.current.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        if (Math.abs(node.x - node.homeX) > 12) node.vx *= -1;
        if (Math.abs(node.y - node.homeY) > 12) node.vy *= -1;

        const pulse = Math.sin(tsRef.current * 1.4 + node.pulsePhase);
        const r     = node.level.locked ? 17 : 21 + pulse * 1.5;
        const acc   = node.level.locked ? '#94a3b8' : node.level.accentHex;

        // Glow
        if (!node.level.locked) {
          const gr = r + 12 + pulse * 4;
          const g  = ctx.createRadialGradient(node.x, node.y, r * 0.4, node.x, node.y, gr);
          g.addColorStop(0, `${acc}28`);
          g.addColorStop(1, `${acc}00`);
          ctx.beginPath();
          ctx.arc(node.x, node.y, gr, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        }

        // Circle fill
        const cf = ctx.createRadialGradient(node.x - r * 0.3, node.y - r * 0.3, 0, node.x, node.y, r);
        cf.addColorStop(0, '#ffffff');
        cf.addColorStop(1, node.level.locked ? '#f1f5f9' : `${acc}18`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = cf;
        ctx.shadowColor = acc;
        ctx.shadowBlur  = node.level.locked ? 0 : 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = node.level.locked ? 'rgba(148,163,184,0.35)' : `${acc}70`;
        ctx.lineWidth   = 1.5;
        ctx.stroke();

        // Number
        ctx.fillStyle = node.level.locked ? '#94a3b8' : acc;
        ctx.font = `bold ${Math.floor(r * 0.7)}px monospace`;
        ctx.textAlign     = 'center';
        ctx.textBaseline  = 'middle';
        ctx.fillText(`${node.level.id}`, node.x, node.y);

        // Label
        ctx.fillStyle = node.level.locked ? '#94a3b8' : '#0f172a';
        ctx.font      = 'bold 9px system-ui, sans-serif';
        ctx.fillText(node.level.title.split(' ')[0], node.x, node.y + r + 11);
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [init]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

/* ═══════════════════════════════════════════
   DIFFICULTY DOTS
═══════════════════════════════════════════ */
const DifficultyDots: React.FC<{ level: Level }> = ({ level }) => (
  <div className="flex gap-1">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="w-5 h-1.5 rounded-full transition-all duration-300"
        style={{ background: i < level.difficultyN ? level.accentHex : 'rgba(0,0,0,0.08)' }} />
    ))}
  </div>
);

/* ═══════════════════════════════════════════
   FILTER TAB
═══════════════════════════════════════════ */
const FilterTab = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick}
    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300"
    style={active
      ? { background: '#0B1E33', color: '#fff', boxShadow: '0 2px 10px rgba(11,30,51,0.2)' }
      : { background: 'transparent', color: '#94a3b8' }
    }>
    {label}
  </button>
);

/* ═══════════════════════════════════════════
   LEVEL CARD
═══════════════════════════════════════════ */
const LevelCard: React.FC<{ level: Level; index: number; onClick: () => void }> = ({ level, index, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const prog = level.targetSessions > 0 ? (level.completedSessions / level.targetSessions) * 100 : 0;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`anim-up d${Math.min(index + 1, 5)} relative overflow-hidden rounded-[1.75rem] transition-all duration-400 select-none`}
      style={{
        cursor: level.locked ? 'not-allowed' : 'pointer',
        background: '#ffffff',
        border: `1.5px solid ${hovered && !level.locked ? level.accentHex + '55' : 'rgba(226,232,240,1)'}`,
        boxShadow: hovered && !level.locked
          ? `0 20px 50px ${level.accentHex}15, 0 4px 16px rgba(0,0,0,0.05)`
          : '0 1px 4px rgba(0,0,0,0.04)',
        transform: hovered && !level.locked ? 'translateY(-5px)' : 'translateY(0)',
        filter: level.locked ? 'grayscale(0.35) opacity(0.65)' : 'none',
      }}
    >
      {/* Shimmer */}
      {hovered && !level.locked && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[1.75rem]">
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '55%', height: '100%',
            background: `linear-gradient(105deg, transparent 35%, ${level.accentHex}10 50%, transparent 65%)`,
            animation: 'shimmer 1.5s ease-in-out infinite',
          }} />
        </div>
      )}

      {/* Accent stripe */}
      <div className="h-1 w-full" style={{ background: level.locked ? '#e2e8f0' : level.accentHex }} />

      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: `${level.accentHex}14`, color: level.accentHex }}>
              {level.icon}
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: level.accentHex }}>
                {level.category}
              </div>
              <div className="font-black text-[#0B1E33] text-base leading-tight">{level.title}</div>
            </div>
          </div>
          {level.locked ? (
            <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full">
              <Lock size={10} className="text-slate-400" />
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Locked</span>
            </div>
          ) : (
            <span className="text-[10px] font-black text-slate-300 font-mono">#{String(level.id).padStart(2,'0')}</span>
          )}
        </div>

        <p className="text-slate-500 text-xs leading-relaxed mb-4">{level.desc}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {level.tags.map(tag => (
            <span key={tag} className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: `${level.accentHex}10`, color: level.accentHex }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Difficulty */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Difficulty</span>
            <span className="text-[10px] font-bold" style={{ color: level.accentHex }}>{level.difficulty}</span>
          </div>
          <DifficultyDots level={level} />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-5 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Clock size={11} className="text-slate-400" /> {level.duration}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Zap size={11} className="text-slate-400" /> {level.xp} XP
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <CheckCircle2 size={11} className="text-slate-400" /> {level.completedSessions}/{level.targetSessions}
          </div>
        </div>

        {/* Progress bar */}
        {!level.locked && (
          <div className="mb-5">
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${prog}%`, background: level.accentHex }} />
            </div>
          </div>
        )}

        {/* CTA */}
        {!level.locked && (
          <button
            className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300"
            style={hovered
              ? { background: level.accentHex, color: '#fff', boxShadow: `0 8px 24px ${level.accentHex}40` }
              : { background: `${level.accentHex}0f`, color: level.accentHex }
            }>
            {hovered ? <Play size={12} fill="currentColor" /> : <ChevronRight size={12} />}
            {hovered ? 'Launch Protocol' : 'Replay Level'}
          </button>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
const LevelsPage: React.FC = () => {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<Category>('ALL');
  const [clock, setClock] = useState('');

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setClock(fmt());
    const id = setInterval(() => setClock(fmt()), 1000);
    return () => clearInterval(id);
  }, []);

  const filteredLevels = activeCategory === 'ALL' ? LEVELS : LEVELS.filter(l => l.category === activeCategory);
  const assigned = LEVELS.find(l => l.id === ASSIGNED.levelId)!;

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-800 pb-16 selection:bg-teal-500/30 overflow-x-hidden">
      <style>{GLOBAL_CSS}</style>

      {/* Ambient glows — same as home page */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[900px] h-[900px] bg-teal-400/5 rounded-full blur-[120px] -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-violet-500/5 rounded-full blur-[100px] translate-y-1/3" />
      </div>

      <main className="max-w-7xl mx-auto p-6 md:p-10 relative z-10">

        {/* ── HEADER ── */}
        <header className="anim-up flex flex-col md:flex-row justify-between items-end mb-10">
          <div>
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mission Control</span>
            <h1 className="text-4xl md:text-5xl font-black text-[#0B1E33] tracking-tight mb-2">
              Your Roadmap.
            </h1>
            <p className="text-slate-500 font-medium max-w-md">
              <span className="text-teal-600 font-bold">2 levels</span> unlocked ·{" "}
              <span className="text-violet-600 font-bold">400 XP</span> earned this week
            </p>
          </div>

          {/* Gamification strip — mirrors home page style exactly */}
          <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-white shadow-lg shadow-slate-200/50 mt-4 md:mt-0">
            <div className="flex items-center gap-3 px-4 py-2 bg-teal-50 rounded-xl">
              <Cpu size={18} className="text-teal-600" />
              <div>
                <p className="text-[10px] font-bold text-teal-500 uppercase">System</p>
                <p className="text-sm font-black text-teal-700 leading-none font-mono">{clock}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex items-center gap-3 px-4 py-2">
              <Trophy size={18} className="text-[#0B1E33]" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total XP</p>
                <p className="text-lg font-black text-[#0B1E33] leading-none">400</p>
              </div>
            </div>
          </div>
        </header>

        {/* ── MAIN GRID (matches home's 12-col layout) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT — 8 cols */}
          <div className="lg:col-span-8 flex flex-col gap-8">

            {/* ─ HERO: ASSIGNED SESSION (dark card — same as home's hero portal) ─ */}
            <div className="anim-up d1 relative w-full rounded-[2.5rem] overflow-hidden shadow-2xl shadow-teal-900/10 bg-[#0B1E33]">

              {/* Scanline */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div style={{
                  position: 'absolute', left: 0, right: 0, height: '15%',
                  background: 'linear-gradient(to bottom, transparent, rgba(45,212,191,0.06), transparent)',
                  animation: 'scanline 5s linear infinite',
                }} />
              </div>

              {/* Grid */}
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(45,212,191,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(45,212,191,0.04) 1px,transparent 1px)',
                backgroundSize: '36px 36px',
              }} />

              {/* Diagonal accents */}
              <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none overflow-hidden">
                {[{ r: '-25deg', o: '10%' }, { r: '-40deg', o: '28%' }].map((a, i) => (
                  <div key={i} style={{
                    position: 'absolute', top: '-20%', right: a.o,
                    width: '1px', height: '160%',
                    background: `linear-gradient(to bottom,transparent,rgba(45,212,191,${0.10 - i * 0.04}),transparent)`,
                    transform: `rotate(${a.r})`,
                  }} />
                ))}
              </div>

              <div className="relative z-10 p-8 md:p-10">
                {/* Top */}
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full">
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                    <span className="text-white/90 text-xs font-bold tracking-wider uppercase">Today's Assignment</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/50 text-xs font-medium">
                    <Clock size={14} /> {ASSIGNED.duration}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                  <div className="space-y-4 flex-1">
                    <div>
                      <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
                        {ASSIGNED.title}<span className="text-teal-400"> Protocol</span>
                      </h2>
                      <div className="text-[11px] uppercase tracking-[0.2em] text-white/40 mt-2 font-mono">
                        Level 02 · Motor · {assigned.duration}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 max-w-lg">
                      <Stethoscope size={15} className="text-teal-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-white/70 leading-relaxed">
                        <span className="text-teal-400 font-bold">Dr. Note: </span>{ASSIGNED.doctorNote}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {[
                        { icon: <Activity size={13} />, label: 'Focus', val: 'Timing',  c: '#fbbf24' },
                        { icon: <Brain    size={13} />, label: 'Type',  val: 'Motor',   c: '#a78bfa' },
                        { icon: <Zap      size={13} />, label: 'XP',    val: '+280',    c: '#2DD4BF' },
                      ].map(s => (
                        <div key={s.label}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-white/70 border border-white/[0.08] bg-white/[0.04]">
                          <span style={{ color: s.c }}>{s.icon}</span>
                          <span className="text-white/30 text-[10px] uppercase tracking-wide">{s.label}:</span>
                          <span className="font-bold text-white/80">{s.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA — same shimmer button as home */}
                  <div className="shrink-0">
                    <button
                      onClick={() => router.push(ASSIGNED.path)}
                      className="relative overflow-hidden bg-teal-500 hover:bg-teal-400 text-[#0B1E33] px-10 py-5 rounded-2xl font-black text-lg flex items-center gap-3 transition-all shadow-[0_0_40px_rgba(20,184,166,0.35)] hover:shadow-[0_0_60px_rgba(20,184,166,0.55)] hover:scale-105 active:scale-95"
                    >
                      <div className="absolute inset-0 bg-white/30 skew-x-12"
                        style={{ animation: 'shimmer 2s ease-in-out infinite' }} />
                      <Play size={22} className="fill-[#0B1E33] relative z-10" />
                      <span className="relative z-10">START</span>
                    </button>
                    <p className="text-center text-white/25 text-[10px] mt-2 uppercase tracking-widest">Mandatory</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-8 pt-6 border-t border-white/[0.07]">
                  <div className="flex justify-between text-[10px] text-white/30 uppercase tracking-widest mb-2">
                    <span>Session Progress</span>
                    <span className="text-teal-400">40%</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
                    <div className="h-full w-[40%] bg-gradient-to-r from-teal-400/70 to-teal-400 rounded-full"
                      style={{ boxShadow: '0 0 12px rgba(45,212,191,0.5)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* ─ LIBRARY HEADER + FILTERS ─ */}
            <div className="anim-up d2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-black text-[#0B1E33] tracking-tight">Module Library</h3>
                <p className="text-xs text-slate-400 uppercase tracking-wider mt-0.5 font-bold">
                  Replay unlocked levels · Accumulate XP
                </p>
              </div>
              <div className="flex gap-1 bg-white/70 backdrop-blur-md p-1 rounded-2xl border border-white shadow-sm">
                {(['ALL', 'MOTOR', 'COGNITIVE', 'STRENGTH'] as Category[]).map(cat => (
                  <FilterTab key={cat} label={cat} active={activeCategory === cat} onClick={() => setActiveCategory(cat)} />
                ))}
              </div>
            </div>

            {/* ─ LEVEL CARDS ─ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredLevels.map((level, i) => (
                <LevelCard key={level.id} level={level} index={i}
                  onClick={() => !level.locked && router.push(level.path)} />
              ))}
            </div>
          </div>

          {/* RIGHT — 4 cols */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* ─ NEURAL NETWORK VISUALISER (new unique element) ─ */}
            <div className="anim-up d1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <div>
                  <h3 className="font-black text-[#0B1E33] text-sm">Progression Map</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">Neural pathway visualiser</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 rounded-xl">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">Live</span>
                </div>
              </div>
              <div style={{ height: 210 }}>
                <NeuralNetworkCanvas />
              </div>
              <div className="flex items-center justify-center gap-5 px-6 pb-5 pt-1">
                {[{ c: '#14b8a6', l: 'Unlocked' }, { c: '#94a3b8', l: 'Locked' }].map(item => (
                  <div key={item.l} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: item.c }} />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.l}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-teal-400 rounded-full" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Signal</span>
                </div>
              </div>
            </div>

            {/* ─ AI INSIGHT (mirrors home page style exactly) ─ */}
            <div className="anim-up d2 relative overflow-hidden bg-gradient-to-b from-white to-slate-50 p-6 rounded-[2.5rem] border border-white shadow-xl shadow-indigo-100/50">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="font-bold text-[#0B1E33]">Clinical Insight</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium mb-4">
                  Your <span className="text-indigo-600 font-bold">grip consistency</span> improved 12% since last week. Dr. Perera notes you're ready for Memory Trench — complete one more Rhythm Reef session to unlock it.
                </p>
                <button className="w-full py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors uppercase tracking-wider">
                  View Full Analysis
                </button>
              </div>
            </div>

            {/* ─ SESSION METRICS (dark card — mirrors home's System Status) ─ */}
            <div className="anim-up d3 bg-[#0B1E33] rounded-[2.5rem] p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div style={{
                  position: 'absolute', left: 0, right: 0, height: '20%',
                  background: 'linear-gradient(to bottom, transparent, rgba(45,212,191,0.06), transparent)',
                  animation: 'scanline 4s linear infinite',
                }} />
              </div>

              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold flex items-center gap-2 text-sm">
                    <BarChart3 size={16} className="text-teal-400" /> Clinical Metrics
                  </h3>
                  <span className="px-2 py-1 bg-teal-500/20 text-teal-400 text-[10px] font-bold rounded uppercase border border-teal-500/30">
                    This Week
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Grip Accuracy',  val: 84, color: '#2DD4BF', icon: <Activity size={13} /> },
                    { label: 'Reaction Speed', val: 71, color: '#a78bfa', icon: <Zap       size={13} /> },
                    { label: 'Session Streak', val: 60, color: '#fbbf24', icon: <Star      size={13} /> },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <span style={{ color: m.color }}>{m.icon}</span>{m.label}
                        </div>
                        <span className="text-xs font-black font-mono" style={{ color: m.color }}>{m.val}%</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{
                            width: `${m.val}%`, background: m.color,
                            boxShadow: `0 0 8px ${m.color}80`,
                            transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
                          }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-white/[0.07] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center shrink-0">
                    <Stethoscope size={13} className="text-teal-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-white/80">Next Review</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">Friday · Dr. Perera · 09:00</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─ LOCKED TEASER (mirrors home's lock card) ─ */}
            <div className="anim-up d4 p-6 rounded-[2rem] border border-slate-200 border-dashed text-center bg-white/50">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock size={20} className="text-slate-400" />
              </div>
              <p className="text-sm font-black text-slate-500">Memory Trench unlocks soon</p>
              <p className="text-xs text-slate-400 mt-1">Complete 1 more Rhythm Reef session</p>
              <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full w-4/5 rounded-full"
                  style={{ background: 'linear-gradient(to right, #c4b5fd, #8b5cf6)' }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 font-bold">4 / 5 sessions</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default LevelsPage;