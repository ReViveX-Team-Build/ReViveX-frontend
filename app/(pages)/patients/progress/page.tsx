'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Flame, Zap, TrendingUp, Brain, Sparkles,
  Shield, CheckCircle2, AlertCircle, Lock,
  Activity, Cpu, Star, Target, Award,
  ChevronRight, Clock, Calendar, BarChart3,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
  ReferenceLine,
} from 'recharts';

/* ══════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════ */

// 30-day grip strength trend (kPa)
const STRENGTH_DATA = [
  { day: 'Nov 1',  right: 28, left: 44 }, { day: 'Nov 2',  right: 30, left: 45 },
  { day: 'Nov 3',  right: 29, left: 44 }, { day: 'Nov 4',  right: 31, left: 46 },
  { day: 'Nov 5',  right: 33, left: 46 }, { day: 'Nov 6',  right: 32, left: 47 },
  { day: 'Nov 7',  right: 34, left: 47 }, { day: 'Nov 8',  right: 35, left: 48 },
  { day: 'Nov 9',  right: 34, left: 47 }, { day: 'Nov 10', right: 36, left: 48 },
  { day: 'Nov 11', right: 37, left: 49 }, { day: 'Nov 12', right: 36, left: 48 },
  { day: 'Nov 13', right: 38, left: 49 }, { day: 'Nov 14', right: 39, left: 50 },
  { day: 'Nov 15', right: 38, left: 50 }, { day: 'Nov 16', right: 41, left: 51 },
  { day: 'Nov 17', right: 40, left: 51 }, { day: 'Nov 18', right: 42, left: 52 },
  { day: 'Nov 19', right: 43, left: 52 }, { day: 'Nov 20', right: 42, left: 52 },
  { day: 'Nov 21', right: 44, left: 53 }, { day: 'Nov 22', right: 45, left: 53 },
  { day: 'Nov 23', right: 44, left: 54 }, { day: 'Nov 24', right: 46, left: 54 },
  { day: 'Nov 25', right: 47, left: 55 }, { day: 'Nov 26', right: 46, left: 55 },
  { day: 'Nov 27', right: 49, left: 56 }, { day: 'Nov 28', right: 50, left: 56 },
  { day: 'Nov 29', right: 51, left: 57 }, { day: 'Nov 30', right: 52, left: 57 },
];

// Weekly endurance (seconds sustained before 20% drop)
const ENDURANCE_DATA = [
  { week: 'Wk 1', endurance: 62, drop: 28 },
  { week: 'Wk 2', endurance: 71, drop: 23 },
  { week: 'Wk 3', endurance: 79, drop: 19 },
  { week: 'Wk 4', endurance: 88, drop: 15 },
];

// Session log
const SESSIONS = [
  { date: '2025-11-30', game: 'Synapse Racer',  duration: '18 min', force: '52 kPa', accuracy: 91, status: 'completed' },
  { date: '2025-11-29', game: 'Memory Gate',    duration: '15 min', force: '49 kPa', accuracy: 85, status: 'completed' },
  { date: '2025-11-28', game: 'Synapse Racer',  duration: '18 min', force: '51 kPa', accuracy: 88, status: 'completed' },
  { date: '2025-11-27', game: 'Rhythm Reef',    duration: '12 min', force: '47 kPa', accuracy: 79, status: 'completed' },
  { date: '2025-11-26', game: 'Synapse Racer',  duration: '0 min',  force: '—',      accuracy: 0,  status: 'missed'    },
  { date: '2025-11-25', game: 'Memory Gate',    duration: '16 min', force: '45 kPa', accuracy: 82, status: 'completed' },
  { date: '2025-11-24', game: 'Synapse Racer',  duration: '18 min', force: '44 kPa', accuracy: 78, status: 'completed' },
];

// Badges
const BADGES = [
  { id: 1, icon: '🎯', label: 'First Session',     desc: 'Completed your first rehab session',              unlocked: true,  xpReq: 0    },
  { id: 2, icon: '🔥', label: '3-Day Streak',       desc: 'Played 3 days in a row',                          unlocked: true,  xpReq: 150  },
  { id: 3, icon: '💪', label: 'Iron Squeeze',        desc: 'Reached 50 kPa peak grip force',                  unlocked: true,  xpReq: 500  },
  { id: 4, icon: '⚡', label: 'Perfect Accuracy',    desc: 'Scored 90%+ accuracy in a session',               unlocked: true,  xpReq: 300  },
  { id: 5, icon: '🏆', label: '7-Day Streak',        desc: 'Play 7 consecutive days',                         unlocked: false, xpReq: 1000 },
  { id: 6, icon: '🧠', label: 'Dual Tasker',         desc: 'Complete 10 Memory Gate sessions',                unlocked: false, xpReq: 1500 },
  { id: 7, icon: '🎵', label: 'Rhythm Master',       desc: 'Perfect timing score in Rhythm Reef',             unlocked: false, xpReq: 2000 },
  { id: 8, icon: '💎', label: 'Iron Grip',           desc: 'Reach +20% grip improvement from baseline',      unlocked: false, xpReq: 3000 },
  { id: 9, icon: '🚀', label: 'Synapse Elite',       desc: 'Complete 25 Synapse Racer sessions at Expert',   unlocked: false, xpReq: 5000 },
];

/* ══════════════════════════════════════════════════════════
   CSS
══════════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

  .pp * { font-family:'Plus Jakarta Sans',system-ui,sans-serif; box-sizing:border-box; }
  .pp .mono { font-family:'JetBrains Mono',monospace; }

  /* ── Keyframes ────────────────────────────────── */
  @keyframes ppFadeUp {
    from { opacity:0; transform:translateY(22px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes ppCardPop {
    0%   { opacity:0; transform:translateY(16px) scale(0.972); }
    100% { opacity:1; transform:translateY(0)    scale(1); }
  }
  @keyframes ppShimmer {
    0%   { transform:translateX(-200%) skewX(-12deg); }
    100% { transform:translateX(500%)  skewX(-12deg); }
  }
  @keyframes ppScanLine {
    0%   { top:-5%;  opacity:0; }
    8%   { opacity:1; }
    92%  { opacity:0.45; }
    100% { top:110%; opacity:0; }
  }
  @keyframes ppGlow {
    0%,100% { box-shadow:0 0 0 0 rgba(45,212,191,0.38); }
    50%     { box-shadow:0 0 0 10px rgba(45,212,191,0); }
  }
  @keyframes ppPulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%     { opacity:0.7; transform:scale(1.06); }
  }
  @keyframes ppFlame {
    0%,100% { transform:scale(1)   rotate(-3deg); }
    50%     { transform:scale(1.15) rotate(3deg); }
  }
  @keyframes ppRingFill {
    from { stroke-dashoffset:var(--ring-from); }
    to   { stroke-dashoffset:var(--ring-to); }
  }
  @keyframes ppBarFill {
    from { width:0%; }
    to   { width:var(--bar-w); }
  }
  @keyframes ppCountUp {
    from { opacity:0; transform:scale(0.80); }
    to   { opacity:1; transform:scale(1); }
  }
  @keyframes ppBadgePop {
    0%   { opacity:0; transform:scale(0.70); }
    70%  { transform:scale(1.08); }
    100% { opacity:1; transform:scale(1); }
  }
  @keyframes ppDot {
    0%,100% { opacity:1; }
    50%     { opacity:0.25; }
  }
  @keyframes ppFloat {
    0%,100% { transform:translateY(0px); }
    50%     { transform:translateY(-5px); }
  }
  @keyframes ppXpBar {
    from { width:0; }
    to   { width:var(--xp-w); }
  }
  @keyframes ppStreakPop {
    0%   { transform:scale(0); opacity:0; }
    60%  { transform:scale(1.15); }
    100% { transform:scale(1); opacity:1; }
  }

  /* ── Cards ────────────────────────────────────── */
  .pp-card {
    background:#fff; border-radius:20px;
    border:1px solid rgba(226,232,240,0.9);
    box-shadow:0 2px 18px rgba(11,30,51,0.055);
    transition:box-shadow 0.28s ease, transform 0.28s ease;
    overflow:hidden;
  }
  .pp-card:hover {
    box-shadow:0 10px 40px rgba(11,30,51,0.10);
    transform:translateY(-2px);
  }

  /* ── Hero stat cards ──────────────────────────── */
  .pp-hero-card {
    padding:24px 22px; border-radius:20px;
    border:1.5px solid rgba(226,232,240,0.85);
    background:#fff; position:relative; overflow:hidden;
    transition:all 0.28s cubic-bezier(0.22,1,0.36,1);
  }
  .pp-hero-card:hover {
    transform:translateY(-4px);
    box-shadow:0 14px 40px rgba(11,30,51,0.12);
  }
  .pp-hero-card::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent);
    animation:ppShimmer 4.5s ease-in-out infinite; opacity:0;
    transition:opacity 0.3s;
  }
  .pp-hero-card:hover::after { opacity:1; }

  /* ── Badge grid ───────────────────────────────── */
  .pp-badge {
    border-radius:16px; padding:18px 14px;
    display:flex; flex-direction:column; align-items:center;
    gap:10px; text-align:center; cursor:default;
    transition:all 0.25s cubic-bezier(0.22,1,0.36,1);
    position:relative; overflow:hidden;
  }
  .pp-badge.unlocked {
    background:#fff; border:1.5px solid rgba(226,232,240,0.9);
    box-shadow:0 2px 12px rgba(11,30,51,0.05);
  }
  .pp-badge.unlocked:hover {
    transform:translateY(-4px) scale(1.02);
    box-shadow:0 12px 32px rgba(11,30,51,0.12);
  }
  .pp-badge.locked {
    background:rgba(240,244,248,0.6);
    border:1.5px dashed rgba(203,213,225,0.8);
  }

  /* ── Session table ────────────────────────────── */
  .pp-session-row { transition:background 0.15s ease; }
  .pp-session-row:hover td { background:rgba(45,212,191,0.028) !important; }

  /* ── Balance bar ──────────────────────────────── */
  .pp-balance-fill {
    height:100%; border-radius:99px;
    transition:none;
    position:relative; overflow:hidden;
  }
  .pp-balance-fill::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.30),transparent);
    animation:ppShimmer 3s ease-in-out infinite;
  }

  /* ── Scrollbar ────────────────────────────────── */
  .pp-scroll::-webkit-scrollbar { height:3px; }
  .pp-scroll::-webkit-scrollbar-thumb { background:rgba(45,212,191,0.28); border-radius:99px; }

  /* ── Tooltip override ─────────────────────────── */
  .pp-tooltip {
    background:#0B1E33 !important; border:1px solid rgba(45,212,191,0.22) !important;
    border-radius:12px !important; padding:10px 14px !important;
    box-shadow:0 8px 24px rgba(11,30,51,0.35) !important;
  }

  /* ── Grid layouts ─────────────────────────────── */
  .pp-hero-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
  .pp-mid-grid  { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
  .pp-badge-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }

  @media (max-width:1100px) { .pp-hero-grid { grid-template-columns:repeat(2,1fr); } .pp-badge-grid { grid-template-columns:repeat(3,1fr); } }
  @media (max-width:900px)  { .pp-mid-grid { grid-template-columns:1fr; } }
  @media (max-width:640px)  {
    .pp-hero-grid { grid-template-columns:repeat(2,1fr); }
    .pp-badge-grid{ grid-template-columns:repeat(2,1fr); }
    .pp .pp-pad  { padding:18px 14px !important; }
  }
`;

/* ══════════════════════════════════════════════════════════
   ANIMATED COUNTER HOOK
══════════════════════════════════════════════════════════ */
function useCounter(target: number, duration = 1400, delay = 0, decimals = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t0 = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setVal(parseFloat((ease * target).toFixed(decimals)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t0);
  }, [target, duration, delay, decimals]);
  return val;
}

/* ══════════════════════════════════════════════════════════
   CIRCULAR PROGRESS RING
══════════════════════════════════════════════════════════ */
function RingProgress({ pct, size = 88, stroke = 7, color = '#2DD4BF', delay = 0 }: {
  pct: number; size?: number; stroke?: number; color?: string; delay?: number;
}) {
  const r   = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  const offset = circ - (animated ? (pct / 100) * circ : circ);

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      {/* Track */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(226,232,240,0.8)" strokeWidth={stroke} />
      {/* Fill */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{
          strokeDashoffset: offset,
          transition: animated ? `stroke-dashoffset ${1.2}s cubic-bezier(0.22,1,0.36,1) ${delay * 0.001}s` : 'none',
          filter: `drop-shadow(0 0 5px ${color}66)`,
        }}
      />
      {/* Glow dot at tip */}
      {animated && (
        <circle
          cx={size / 2 + r * Math.cos((2 * Math.PI * pct / 100) - Math.PI / 2)}
          cy={size / 2 + r * Math.sin((2 * Math.PI * pct / 100) - Math.PI / 2)}
          r={stroke / 2 + 1}
          fill={color}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      )}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════
   ANIMATED BALANCE BAR
══════════════════════════════════════════════════════════ */
function BalanceBar({ label, pct, color, max, delay }: {
  label: string; pct: number; color: string; max: number; delay: number;
}) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), delay);
    return () => clearTimeout(t);
  }, [pct, delay]);
  const displayPct = useCounter(pct, 1200, delay);

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 7px ${color}80` }} />
          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0B1E33' }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span className="mono" style={{ fontSize: 17, fontWeight: 800, color }}>{displayPct}</span>
          <span className="mono" style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>kPa</span>
        </div>
      </div>
      <div style={{ height: 12, background: 'rgba(226,232,240,0.7)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
        <div
          className="pp-balance-fill"
          style={{
            width: `${(w / max) * 100}%`,
            background: `linear-gradient(90deg,${color},${color}bb)`,
            transition: `width 1.2s cubic-bezier(0.22,1,0.36,1) ${delay * 0.001}s`,
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        <span className="mono" style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.10em' }}>0 kPa</span>
        <span className="mono" style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.10em' }}>{max} kPa</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CUSTOM CHART TOOLTIP
══════════════════════════════════════════════════════════ */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0B1E33', border: '1px solid rgba(45,212,191,0.25)', borderRadius: 12, padding: '10px 16px', boxShadow: '0 8px 28px rgba(11,30,51,0.35)' }}>
      <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(45,212,191,0.60)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 7 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, fontWeight: 700, color: '#fff' }}>
            {p.name === 'right' ? 'Right Hand' : p.name === 'left' ? 'Left Hand' : p.name === 'endurance' ? 'Sustained' : 'Fatigue Drop'}
          </span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: p.color, marginLeft: 'auto' }}>
            {p.value}{p.name === 'drop' ? '%' : p.name === 'endurance' ? 's' : ' kPa'}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function PatientProgressPage() {
  const [mounted, setMounted] = useState(false);
  const [activeChart, setActiveChart] = useState<'strength' | 'endurance'>('strength');
  const [hoveredBadge, setHoveredBadge] = useState<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Animated counters
  const xp         = useCounter(2450, 1600, 300);
  const streak     = useCounter(5,    800,  500);
  const journey    = useCounter(40,   1400, 200);
  const gripImprov = useCounter(15,   1200, 400);

  if (!mounted) return null;

  /* ── Thin XP bar width ─────────────────────────────── */
  const xpToNext = 3000;
  const xpPct    = (2450 / xpToNext) * 100;

  return (
    <div className="pp" style={{ minHeight: '100vh', background: '#F0F4F8', paddingBottom: 72 }}>
      <style>{CSS}</style>

      {/* ── Ambient BG ───────────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '4%',   width: 680, height: 680, background: 'radial-gradient(circle,rgba(45,212,191,0.052),transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-12%', left: '3%', width: 560, height: 560, background: 'radial-gradient(circle,rgba(99,102,241,0.042),transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: '40%', left: '45%',    width: 400, height: 400, background: 'radial-gradient(circle,rgba(245,158,11,0.025),transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(11,30,51,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(11,30,51,0.018) 1px,transparent 1px)', backgroundSize: '52px 52px' }} />
      </div>

      <div className="pp-pad" style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 24px', position: 'relative', zIndex: 1 }}>

        {/* ════════════════════════════════════════════════════
            HERO HEADER — Dark card with XP bar
        ════════════════════════════════════════════════════ */}
        <div style={{
          background: '#0B1E33', borderRadius: 24, marginBottom: 24,
          overflow: 'hidden', position: 'relative',
          animation: 'ppFadeUp 0.50s ease both',
        }}>
          {/* Grid + Scan */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(45,212,191,0.038) 1px,transparent 1px),linear-gradient(90deg,rgba(45,212,191,0.038) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, height: '20%', background: 'linear-gradient(to bottom,transparent,rgba(45,212,191,0.05),transparent)', animation: 'ppScanLine 5.5s linear infinite' }} />
          </div>

          <div style={{ position: 'relative', zIndex: 2, padding: '28px 32px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
              {/* Left: Patient info */}
              <div>
                <p className="mono" style={{ fontSize: 9, color: 'rgba(45,212,191,0.60)', textTransform: 'uppercase', letterSpacing: '0.24em', marginBottom: 8, fontWeight: 600 }}>
                  ReViveX · Neuro-Rehabilitation
                </p>
                <h1 style={{ fontSize: 'clamp(1.55rem,2.8vw,2.1rem)', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.12 }}>
                  My Progress
                </h1>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.40)', marginTop: 6, fontWeight: 500 }}>
                  Anura Dissanayaka · <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(45,212,191,0.70)' }}>P002</span> · TBI Recovery
                </p>
              </div>

              {/* Right: Level badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Level pill */}
                <div style={{
                  padding: '10px 18px', borderRadius: 14,
                  background: 'linear-gradient(135deg,rgba(99,102,241,0.22),rgba(79,70,229,0.12))',
                  border: '1.5px solid rgba(99,102,241,0.30)',
                  animation: 'ppFloat 3.5s ease-in-out infinite',
                }}>
                  <div className="mono" style={{ fontSize: 8.5, color: 'rgba(139,92,246,0.70)', textTransform: 'uppercase', letterSpacing: '0.20em', marginBottom: 3 }}>Level</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#a78bfa', lineHeight: 1, fontFamily: "'JetBrains Mono',monospace" }}>07</div>
                </div>

                {/* Status dot */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 10, background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.20)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.8)', animation: 'ppDot 2s ease-in-out infinite' }} />
                    <span className="mono" style={{ fontSize: 9, color: '#22c55e', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Active Streak</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 10, background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.18)' }}>
                    <Cpu size={10} color="rgba(45,212,191,0.70)" />
                    <span className="mono" style={{ fontSize: 9, color: 'rgba(45,212,191,0.70)', fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase' }}>Sensor Calibrated</span>
                  </div>
                </div>
              </div>
            </div>

            {/* XP Bar */}
            <div style={{ marginTop: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Zap size={13} color="#a78bfa" />
                  <span className="mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.50)', fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                    XP Progress — Level 7 → 8
                  </span>
                </div>
                <span className="mono" style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700 }}>
                  2,450 / 3,000 XP
                </span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  background: 'linear-gradient(90deg,#6366f1,#a78bfa)',
                  width: `${xpPct}%`,
                  transition: 'width 1.4s cubic-bezier(0.22,1,0.36,1) 0.5s',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)', animation: 'ppShimmer 2.2s ease-in-out infinite' }} />
                </div>
              </div>
              <p className="mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 6, letterSpacing: '0.10em' }}>
                550 XP remaining to unlock Level 8
              </p>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            1. HERO STAT CARDS
        ════════════════════════════════════════════════════ */}
        <div className="pp-hero-grid" style={{ marginBottom: 22 }}>

          {/* Journey */}
          <div className="pp-hero-card" style={{ animation: 'ppCardPop 0.48s cubic-bezier(0.22,1,0.36,1) 0.08s both' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <p className="mono" style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 6, fontWeight: 700 }}>Total Journey</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                  <span style={{ fontSize: 34, fontWeight: 900, color: '#0B1E33', lineHeight: 1, fontFamily: "'JetBrains Mono',monospace" }}>{Math.round(journey)}</span>
                  <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: '#2DD4BF' }}>%</span>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 5, fontWeight: 500 }}>
                  of recovery milestone
                </p>
              </div>
              <RingProgress pct={40} size={72} stroke={6} color="#2DD4BF" delay={300} />
            </div>
            <div style={{ height: 3, background: 'rgba(226,232,240,0.7)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, width: `${journey}%`, background: 'linear-gradient(90deg,#2DD4BF,#0891b2)', transition: 'width 1.4s cubic-bezier(0.22,1,0.36,1) 0.3s' }} />
            </div>
          </div>

          {/* Streak */}
          <div className="pp-hero-card" style={{ animation: 'ppCardPop 0.48s cubic-bezier(0.22,1,0.36,1) 0.14s both', borderColor: 'rgba(251,146,60,0.25)' }}>
            <p className="mono" style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 10, fontWeight: 700 }}>Current Streak</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 54, height: 54, borderRadius: 16,
                background: 'rgba(251,146,60,0.10)', border: '1.5px solid rgba(251,146,60,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, flexShrink: 0,
                animation: 'ppFlame 2.2s ease-in-out infinite',
              }}>
                🔥
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: '#ea580c', lineHeight: 1, fontFamily: "'JetBrains Mono',monospace" }}>{Math.round(streak)}</span>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: '#fb923c' }}>days</span>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 3, fontWeight: 500 }}>Keep it going!</p>
              </div>
            </div>
            {/* Streak dots */}
            <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
              {['M','T','W','T','F','S','S'].map((d, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    height: 6, borderRadius: 99, marginBottom: 5,
                    background: i < 5 ? '#f97316' : 'rgba(226,232,240,0.7)',
                    boxShadow: i < 5 ? '0 0 6px rgba(249,115,22,0.5)' : 'none',
                    transition: `background 0.3s ease ${i * 0.08}s`,
                  }} />
                  <span className="mono" style={{ fontSize: 8, color: i < 5 ? '#f97316' : '#cbd5e1', fontWeight: i < 5 ? 700 : 500 }}>{d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total XP */}
          <div className="pp-hero-card" style={{ animation: 'ppCardPop 0.48s cubic-bezier(0.22,1,0.36,1) 0.20s both', borderColor: 'rgba(99,102,241,0.22)' }}>
            <p className="mono" style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 10, fontWeight: 700 }}>Total XP Earned</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 54, height: 54, borderRadius: 16,
                background: 'rgba(99,102,241,0.10)', border: '1.5px solid rgba(99,102,241,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'ppGlow 3s ease-in-out infinite',
              }}>
                <Zap size={24} color="#6366f1" fill="#6366f1" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 34, fontWeight: 900, color: '#6366f1', lineHeight: 1, fontFamily: "'JetBrains Mono',monospace" }}>{xp.toLocaleString()}</span>
                  <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa' }}>XP</span>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 3, fontWeight: 500 }}>Across 34 sessions</p>
              </div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 6 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i < 3 ? 'linear-gradient(90deg,#6366f1,#8b5cf6)' : 'rgba(226,232,240,0.7)', transition: `background 0.4s ease ${i * 0.1}s` }} />
              ))}
            </div>
            <p className="mono" style={{ fontSize: 9, color: '#94a3b8', marginTop: 6 }}>3 / 4 milestones unlocked</p>
          </div>

          {/* Grip Improvement */}
          <div className="pp-hero-card" style={{ animation: 'ppCardPop 0.48s cubic-bezier(0.22,1,0.36,1) 0.26s both', borderColor: 'rgba(34,197,94,0.22)' }}>
            <p className="mono" style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 10, fontWeight: 700 }}>Grip Improvement</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 54, height: 54, borderRadius: 16,
                background: 'rgba(34,197,94,0.10)', border: '1.5px solid rgba(34,197,94,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TrendingUp size={24} color="#22c55e" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: '#16a34a', lineHeight: 1, fontFamily: "'JetBrains Mono',monospace" }}>+{Math.round(gripImprov)}</span>
                  <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>%</span>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 3, fontWeight: 500 }}>Since Day 1 baseline</p>
              </div>
            </div>
            <div style={{ marginTop: 16, padding: '8px 12px', borderRadius: 10, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={12} color="#22c55e" />
              <span style={{ fontSize: 11.5, color: '#15803d', fontWeight: 700 }}>Goal: +20% — 5% remaining</span>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            2. AI INSIGHT CARD
        ════════════════════════════════════════════════════ */}
        <div className="pp-card" style={{
          marginBottom: 22, animation: 'ppCardPop 0.48s cubic-bezier(0.22,1,0.36,1) 0.28s both',
          border: '1.5px solid rgba(99,102,241,0.22)', overflow: 'hidden',
        }}>
          {/* Header stripe */}
          <div style={{
            background: 'linear-gradient(135deg,#0B1E33 0%,#1a1040 100%)',
            padding: '16px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            position: 'relative', overflow: 'hidden', flexWrap: 'wrap',
          }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.06) 1px,transparent 1px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={18} color="#a78bfa" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>AI Weekly Analysis</div>
                <div className="mono" style={{ fontSize: 9, color: 'rgba(167,139,250,0.55)', textTransform: 'uppercase', letterSpacing: '0.18em', marginTop: 1 }}>
                  Powered by Gemini 1.5 Flash · Week of Nov 25–30
                </div>
              </div>
            </div>
            <div style={{ position: 'relative', zIndex: 1, padding: '5px 12px', borderRadius: 99, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.28)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa', animation: 'ppDot 2.2s ease-in-out infinite' }} />
              <span className="mono" style={{ fontSize: 8.5, color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em' }}>AI Companion</span>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, color: '#6366f1', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono',monospace" }}>Clinical Observations</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {[
                    { type: 'positive', text: 'Peak grip force improved by 8 kPa this week — the strongest single-week gain recorded since therapy began.' },
                    { type: 'positive', text: 'Session adherence reached 86% (6 of 7 prescribed sessions completed). Excellent consistency maintained.' },
                    { type: 'positive', text: 'Right-hand endurance sustained for an average of 88 seconds before a 20% drop — 14% longer than Week 3.' },
                    { type: 'warning', text: 'One session was missed on Thursday (Nov 26). Maintaining the 7-session weekly schedule will maximise neuroplasticity benefit.' },
                    { type: 'warning', text: 'Left-to-right hand force ratio at 60% — within expected range for this recovery stage, but continued bilateral sessions are recommended.' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 12px', borderRadius: 10, background: item.type === 'positive' ? 'rgba(34,197,94,0.05)' : 'rgba(245,158,11,0.05)', border: `1px solid ${item.type === 'positive' ? 'rgba(34,197,94,0.16)' : 'rgba(245,158,11,0.20)'}` }}>
                      {item.type === 'positive'
                        ? <CheckCircle2 size={14} color="#22c55e" style={{ flexShrink: 0, marginTop: 1 }} />
                        : <AlertCircle  size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
                      }
                      <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.65, margin: 0 }}>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation box */}
              <div style={{ width: 240, flexShrink: 0 }}>
                <div style={{ background: 'linear-gradient(145deg,rgba(99,102,241,0.07),rgba(79,70,229,0.03))', border: '1.5px solid rgba(99,102,241,0.18)', borderRadius: 16, padding: '18px 16px', height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <p className="mono" style={{ fontSize: 8.5, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 700, marginBottom: 8 }}>AI Recommendation</p>
                    <p style={{ fontSize: 12.5, color: '#1e293b', lineHeight: 1.7, fontWeight: 500 }}>
                      Maintain adequate hydration before each session. Dehydration reduces muscle contractility, which may artificially lower your peak kPa readings.
                    </p>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(99,102,241,0.14)', paddingTop: 14 }}>
                    <p className="mono" style={{ fontSize: 8.5, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 8 }}>Next Milestone</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 20 }}>💎</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#0B1E33' }}>Iron Grip</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Reach +20% improvement</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 10, height: 5, background: 'rgba(226,232,240,0.7)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '75%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: 99, transition: 'width 1s ease 0.5s' }} />
                    </div>
                    <p className="mono" style={{ fontSize: 9, color: '#94a3b8', marginTop: 5 }}>75% — 5% remaining</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            3. CHARTS
        ════════════════════════════════════════════════════ */}
        <div className="pp-card" style={{ marginBottom: 22, animation: 'ppCardPop 0.48s cubic-bezier(0.22,1,0.36,1) 0.32s both', padding: '22px 24px' }}>

          {/* Chart header + toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(45,212,191,0.10)', border: '1px solid rgba(45,212,191,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2DD4BF' }}>
                <BarChart3 size={16} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0B1E33' }}>
                  {activeChart === 'strength' ? '30-Day Grip Strength Trend' : 'Muscle Endurance Progress'}
                </div>
                <div className="mono" style={{ fontSize: 9, color: '#94a3b8', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  {activeChart === 'strength' ? 'Peak force in kPa · Right vs Left hand' : 'Sustained squeeze time · Weekly fatigue index'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['strength', 'endurance'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveChart(tab)} style={{
                  padding: '7px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: activeChart === tab ? '#0B1E33' : '#f1f5f9',
                  color: activeChart === tab ? '#fff' : '#64748b',
                  fontSize: 12.5, fontWeight: 700, transition: 'all 0.2s ease',
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  boxShadow: activeChart === tab ? '0 4px 14px rgba(11,30,51,0.22)' : 'none',
                }}>
                  {tab === 'strength' ? 'Strength' : 'Endurance'}
                </button>
              ))}
            </div>
          </div>

          {/* Recharts */}
          {activeChart === 'strength' ? (
            <>
              {/* Legend */}
              <div style={{ display: 'flex', gap: 20, marginBottom: 12, marginLeft: 8 }}>
                {[{ color: '#2DD4BF', label: 'Right Hand (Affected)' }, { color: '#6366f1', label: 'Left Hand (Healthy)' }].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 24, height: 3, borderRadius: 99, background: l.color }} />
                    <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>{l.label}</span>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={STRENGTH_DATA} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                  <defs>
                    <linearGradient id="rightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2DD4BF" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="leftGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(226,232,240,0.6)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} unit=" kPa" />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="right" stroke="#2DD4BF" strokeWidth={2.5} fill="url(#rightGrad)" dot={false} activeDot={{ r: 5, fill: '#2DD4BF', strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="left"  stroke="#6366f1" strokeWidth={2}   fill="url(#leftGrad)"  dot={false} activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }} strokeDasharray="5 3" />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
                {[
                  { label: 'Start (Nov 1)',  val: '28 kPa', color: '#94a3b8' },
                  { label: 'Current',        val: '52 kPa', color: '#2DD4BF' },
                  { label: 'Improvement',    val: '+85%',   color: '#22c55e' },
                  { label: 'Personal Best',  val: '52 kPa', color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, padding: '10px 12px', background: 'rgba(240,244,248,0.7)', borderRadius: 12, border: '1px solid rgba(226,232,240,0.8)' }}>
                    <div className="mono" style={{ fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono',monospace" }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.18)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={14} color="#2DD4BF" />
                <span style={{ fontSize: 13, color: '#0f766e', fontWeight: 700 }}>You are sustaining your grip 42% longer than Week 1 — a major endurance milestone! 💪</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ENDURANCE_DATA} margin={{ top: 4, right: 8, bottom: 0, left: -12 }} barGap={6}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(226,232,240,0.6)" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="endurance" fill="#2DD4BF" radius={[8,8,0,0]} maxBarSize={52}
                    background={{ fill: 'rgba(226,232,240,0.3)' }} />
                  <Bar dataKey="drop"      fill="#f97316" radius={[8,8,0,0]} maxBarSize={52} opacity={0.75} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 14, height: 6, borderRadius: 99, background: '#2DD4BF' }} />
                  <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Sustained (seconds)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 14, height: 6, borderRadius: 99, background: '#f97316' }} />
                  <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Endurance Drop %</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ════════════════════════════════════════════════════
            4. BILATERAL BALANCE + 6. PROTOCOL STATUS
        ════════════════════════════════════════════════════ */}
        <div className="pp-mid-grid" style={{ marginBottom: 22 }}>

          {/* Bilateral Balance */}
          <div className="pp-card" style={{ padding: '22px 24px', animation: 'ppCardPop 0.48s cubic-bezier(0.22,1,0.36,1) 0.36s both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(45,212,191,0.10)', border: '1px solid rgba(45,212,191,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2DD4BF' }}>
                <Activity size={15} />
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0B1E33' }}>Bilateral Balance</div>
                <div className="mono" style={{ fontSize: 9, color: '#94a3b8', marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Left vs Right hand strength</div>
              </div>
            </div>

            <BalanceBar label="Right Hand (Affected)" pct={52} color="#2DD4BF" max={80} delay={500} />
            <BalanceBar label="Left Hand (Healthy)"   pct={57} color="#6366f1" max={80} delay={650} />

            {/* Ratio gauge */}
            <div style={{ marginTop: 8, padding: '14px 16px', borderRadius: 14, background: 'rgba(240,244,248,0.8)', border: '1px solid rgba(226,232,240,0.8)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span className="mono" style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700 }}>Hand Symmetry Ratio</span>
                <span className="mono" style={{ fontSize: 14, fontWeight: 800, color: '#0B1E33' }}>91<span style={{ fontSize: 10, color: '#94a3b8' }}>%</span></span>
              </div>
              <div style={{ height: 8, background: 'rgba(226,232,240,0.8)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: 'rgba(11,30,51,0.18)', zIndex: 2 }} />
                <div style={{ height: '100%', width: '91%', borderRadius: 99, background: 'linear-gradient(90deg,#6366f1,#2DD4BF)', transition: 'width 1.2s cubic-bezier(0.22,1,0.36,1) 0.8s', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)', animation: 'ppShimmer 3s ease-in-out infinite' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Right (affected)</span>
                <div style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.20)' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a' }}>↑ +6% this week</span>
                </div>
                <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Left (healthy)</span>
              </div>
            </div>

            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.16)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Brain size={13} color="#6366f1" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: '#4338ca', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                At this rate of improvement, bilateral symmetry is projected to reach 100% within <strong>6–8 weeks</strong>.
              </p>
            </div>
          </div>

          {/* Protocol & Hardware Status */}
          <div className="pp-card" style={{ padding: '22px 24px', animation: 'ppCardPop 0.48s cubic-bezier(0.22,1,0.36,1) 0.42s both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(11,30,51,0.07)', border: '1px solid rgba(11,30,51,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B1E33' }}>
                <Target size={15} />
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0B1E33' }}>Protocol & Device</div>
                <div className="mono" style={{ fontSize: 9, color: '#94a3b8', marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Assigned by Dr. Wickramasinghe</div>
              </div>
            </div>

            {/* Protocol details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Target Hand',   val: 'Right ✋',  color: '#2DD4BF' },
                { label: 'Current Game',  val: 'Synapse Racer', color: '#6366f1' },
                { label: 'Difficulty',    val: 'Medium',   color: '#f59e0b' },
                { label: 'Sessions/Week', val: '7',         color: '#0B1E33' },
                { label: 'Grip MVC',      val: '65%',       color: '#2DD4BF' },
                { label: 'Duration',      val: '18 min',    color: '#0B1E33' },
              ].map(item => (
                <div key={item.label} style={{ padding: '11px 13px', background: 'rgba(240,244,248,0.7)', borderRadius: 12, border: '1px solid rgba(226,232,240,0.8)' }}>
                  <div className="mono" style={{ fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: item.color, fontFamily: item.label === 'Grip MVC' || item.label === 'Duration' || item.label === 'Sessions/Week' ? "'JetBrains Mono',monospace" : 'inherit' }}>{item.val}</div>
                </div>
              ))}
            </div>

            {/* Assistance toggles (read-only) */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              {[
                { label: '🔊 Audio Hints',      on: true  },
                { label: '👁 Visual Guides',     on: true  },
                { label: '📳 Tremor Filter',     on: true  },
              ].map(tog => (
                <div key={tog.label} style={{
                  padding: '6px 12px', borderRadius: 99, fontSize: 11.5, fontWeight: 700,
                  background: tog.on ? 'rgba(34,197,94,0.08)' : 'rgba(240,244,248,0.7)',
                  border: `1px solid ${tog.on ? 'rgba(34,197,94,0.22)' : 'rgba(226,232,240,0.8)'}`,
                  color: tog.on ? '#15803d' : '#94a3b8',
                }}>
                  {tog.label}
                </div>
              ))}
            </div>

            {/* Hardware status */}
            <div style={{ padding: '14px 16px', borderRadius: 14, background: '#0B1E33', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(45,212,191,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(45,212,191,0.05) 1px,transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="mono" style={{ fontSize: 8, color: 'rgba(45,212,191,0.55)', textTransform: 'uppercase', letterSpacing: '0.20em', marginBottom: 10, fontWeight: 700 }}>Hardware Status</div>
                {[
                  { icon: <Cpu size={11} />,      label: 'MPX5010DP Sensor', status: 'Calibrated & Ready', ok: true  },
                  { icon: <Activity size={11} />, label: 'ESP32 Module',      status: 'Online — R-102',     ok: true  },
                  { icon: <Shield size={11} />,   label: 'Data Encryption',   status: 'TLS 1.3 Active',     ok: true  },
                ].map(hw => (
                  <div key={hw.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ color: hw.ok ? '#2DD4BF' : '#ef4444' }}>{hw.icon}</div>
                    <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', fontWeight: 500, flex: 1 }}>{hw.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: hw.ok ? '#22c55e' : '#ef4444', boxShadow: `0 0 5px ${hw.ok ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)'}`, animation: 'ppDot 2s ease-in-out infinite' }} />
                      <span className="mono" style={{ fontSize: 9, color: hw.ok ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{hw.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            5. TROPHY CABINET
        ════════════════════════════════════════════════════ */}
        <div className="pp-card" style={{ padding: '22px 24px', marginBottom: 22, animation: 'ppCardPop 0.48s cubic-bezier(0.22,1,0.36,1) 0.44s both' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={16} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0B1E33' }}>Trophy Cabinet</div>
                <div className="mono" style={{ fontSize: 9, color: '#94a3b8', marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  {BADGES.filter(b => b.unlocked).length} / {BADGES.length} milestones unlocked
                </div>
              </div>
            </div>
            <div style={{ padding: '5px 14px', borderRadius: 99, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Star size={12} color="#f59e0b" fill="#f59e0b" />
              <span className="mono" style={{ fontSize: 9.5, color: '#d97706', fontWeight: 700 }}>
                {BADGES.filter(b => b.unlocked).length} Earned · {BADGES.filter(b => !b.unlocked).length} Locked
              </span>
            </div>
          </div>

          <div className="pp-badge-grid">
            {BADGES.map((badge, i) => (
              <div
                key={badge.id}
                className={`pp-badge ${badge.unlocked ? 'unlocked' : 'locked'}`}
                style={{ animationDelay: `${0.48 + i * 0.06}s`, animation: `ppBadgePop 0.5s cubic-bezier(0.22,1,0.36,1) ${0.48 + i * 0.06}s both` }}
                onMouseEnter={() => setHoveredBadge(badge.id)}
                onMouseLeave={() => setHoveredBadge(null)}
              >
                {/* Shimmer for unlocked */}
                {badge.unlocked && (
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)', animation: hoveredBadge === badge.id ? 'ppShimmer 1s ease-in-out' : 'none', pointerEvents: 'none', borderRadius: 14 }} />
                )}

                {/* Emoji */}
                <div style={{
                  fontSize: 28, width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 16,
                  background: badge.unlocked
                    ? 'linear-gradient(135deg,rgba(45,212,191,0.12),rgba(99,102,241,0.08))'
                    : 'rgba(226,232,240,0.4)',
                  border: badge.unlocked
                    ? '1.5px solid rgba(45,212,191,0.25)'
                    : '1.5px solid rgba(226,232,240,0.8)',
                  filter: badge.unlocked ? 'none' : 'grayscale(1) opacity(0.4)',
                  boxShadow: badge.unlocked ? '0 4px 16px rgba(45,212,191,0.14)' : 'none',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                }}>
                  {badge.icon}
                  {/* Lock overlay */}
                  {!badge.unlocked && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, background: 'rgba(248,250,252,0.6)' }}>
                      <Lock size={14} color="#cbd5e1" />
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: badge.unlocked ? '#0B1E33' : '#94a3b8', marginBottom: 3 }}>
                    {badge.label}
                  </div>
                  <div style={{ fontSize: 10.5, color: badge.unlocked ? '#64748b' : '#cbd5e1', lineHeight: 1.5 }}>
                    {badge.desc}
                  </div>
                  {!badge.unlocked && (
                    <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 99, background: 'rgba(226,232,240,0.6)', border: '1px solid rgba(203,213,225,0.8)' }}>
                      <Zap size={9} color="#94a3b8" />
                      <span className="mono" style={{ fontSize: 8.5, color: '#94a3b8', fontWeight: 700 }}>
                        {badge.xpReq.toLocaleString()} XP
                      </span>
                    </div>
                  )}
                  {badge.unlocked && (
                    <div style={{ marginTop: 5, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <CheckCircle2 size={10} color="#22c55e" />
                      <span className="mono" style={{ fontSize: 8.5, color: '#22c55e', fontWeight: 700 }}>Unlocked</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            7. SESSION LOG
        ════════════════════════════════════════════════════ */}
        <div className="pp-card" style={{ animation: 'ppCardPop 0.48s cubic-bezier(0.22,1,0.36,1) 0.50s both', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(11,30,51,0.07)', border: '1px solid rgba(11,30,51,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B1E33' }}>
                <Calendar size={15} />
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0B1E33' }}>Session History</div>
                <div className="mono" style={{ fontSize: 9, color: '#94a3b8', marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Last 7 sessions</div>
              </div>
            </div>
            <div style={{ padding: '5px 14px', borderRadius: 99, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={12} color="#22c55e" />
              <span className="mono" style={{ fontSize: 9.5, color: '#15803d', fontWeight: 700 }}>86% Completion Rate</span>
            </div>
          </div>

          <div className="pp-scroll" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
              <thead>
                <tr>
                  {['Date', 'Game Played', 'Duration', 'Avg Force', 'Accuracy', 'Status'].map(h => (
                    <th key={h} style={{
                      padding: '11px 16px', textAlign: 'left',
                      fontSize: 9.5, fontWeight: 700, color: '#64748b',
                      textTransform: 'uppercase', letterSpacing: '0.12em',
                      fontFamily: "'JetBrains Mono',monospace",
                      borderBottom: '1.5px solid rgba(226,232,240,0.8)',
                      background: '#fafbfc', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SESSIONS.map((s, i) => (
                  <tr key={i} className="pp-session-row" style={{ animationDelay: `${0.55 + i * 0.04}s`, animation: `ppFadeUp 0.40s ease ${0.55 + i * 0.04}s both` }}>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(226,232,240,0.6)', verticalAlign: 'middle' }}>
                      <span className="mono" style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{s.date}</span>
                    </td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(226,232,240,0.6)', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.game === 'Synapse Racer' ? '#2DD4BF' : s.game === 'Memory Gate' ? '#6366f1' : '#f59e0b', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0B1E33' }}>{s.game}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(226,232,240,0.6)', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={11} color="#94a3b8" />
                        <span className="mono" style={{ fontSize: 12, color: s.status === 'missed' ? '#ef4444' : '#334155', fontWeight: 600 }}>{s.duration}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(226,232,240,0.6)', verticalAlign: 'middle' }}>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: s.status === 'missed' ? '#94a3b8' : '#2DD4BF' }}>{s.force}</span>
                    </td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(226,232,240,0.6)', verticalAlign: 'middle' }}>
                      {s.status !== 'missed' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 52, height: 4, background: 'rgba(226,232,240,0.7)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${s.accuracy}%`, background: s.accuracy >= 85 ? '#22c55e' : s.accuracy >= 70 ? '#f59e0b' : '#ef4444', borderRadius: 99 }} />
                          </div>
                          <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: s.accuracy >= 85 ? '#16a34a' : s.accuracy >= 70 ? '#d97706' : '#dc2626' }}>{s.accuracy}%</span>
                        </div>
                      ) : (
                        <span className="mono" style={{ fontSize: 11, color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(226,232,240,0.6)', verticalAlign: 'middle' }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '4px 11px', borderRadius: 99,
                        background: s.status === 'completed' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${s.status === 'completed' ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.22)'}`,
                      }}>
                        {s.status === 'completed'
                          ? <CheckCircle2 size={10} color="#22c55e" />
                          : <AlertCircle  size={10} color="#ef4444" />
                        }
                        <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: s.status === 'completed' ? '#15803d' : '#dc2626', textTransform: 'uppercase', letterSpacing: '0.10em' }}>
                          {s.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 24px', borderTop: '1px solid rgba(226,232,240,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <span className="mono" style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.10em' }}>
              6 of 7 sessions completed this week
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}