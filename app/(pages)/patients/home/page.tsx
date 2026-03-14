const mockAdherenceData = {
  nextSession: {
    data: "Feb 10 2025",
    time: "10.30 AM",
    hand: "Right Hand",
  },
  weekly: {
    completed: 5,
    total: 7,
    percentage: 71,
  },
};

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Hand,
  TrendingUp,
  CheckCircle2,
  Wifi,
  Zap,
  ArrowRight,
  Activity,
  Brain,
  Footprints,
  ChevronRight,
  Sparkles,
  Shield,
  CircleCheck,
  Bot,
  Send,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────
const patient = {
  name: "Silva",
  initials: "PB",
  streak: 5,
  xp: 2450,
};

const nextSession = {
  date: "Nov 17",
  year: "2025",
  time: "10:30 AM",
  hand: "Right Hand",
  protocol: "Protocol A",
  duration: "15 min",
};

const adherence = {
  score: 71,
  completed: 5,
  total: 7,
};

const quickStats = [
  { label: "Grip Strength", value: 15,  suffix: "%", prefix: "+", icon: Activity,  color: "#2DD4BF", bg: "rgba(45,212,191,0.10)" },
  { label: "Memory Success", value: 85, suffix: "%", prefix: "+", icon: Brain,      color: "#6366f1", bg: "rgba(99,102,241,0.10)" },
  { label: "Journey",        value: 40, suffix: "%", prefix: "+", icon: Footprints, color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
];

const aiMessages = [
  "Ready for your session! Your grip strength is trending up! 💪",
  "You've completed 5/7 sessions this week — amazing consistency!",
  "Morning sessions show 23% better results for you. Let's go! 🚀",
];

// ─── Animated Number ─────────────────────────────────────────────────────────
function AnimNum({ to, prefix = "", suffix = "", delay = 0, dur = 1200 }: {
  to: number; prefix?: string; suffix?: string; delay?: number; dur?: number;
}) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let start: number | null = null;
      const raf = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(e * to));
        if (p < 1) requestAnimationFrame(raf);
        else setVal(to);
      };
      requestAnimationFrame(raf);
    }, delay);
    return () => clearTimeout(t);
  }, [to, delay, dur]);
  return <>{prefix}{val}{suffix}</>;
}

// ─── Progress Arc (SVG) ──────────────────────────────────────────────────────
function ProgressArc({ value, size = 80, stroke = 6, color = "#2DD4BF", delay = 0 }: {
  value: number; size?: number; stroke?: number; color?: string; delay?: number;
}) {
  const [prog, setProg] = useState(0);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (prog / 100) * circ;

  useEffect(() => {
    const t = setTimeout(() => {
      let start: number | null = null;
      const raf = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 1400, 1);
        const e = 1 - Math.pow(1 - p, 3);
        setProg(e * value);
        if (p < 1) requestAnimationFrame(raf);
        else setProg(value);
      };
      requestAnimationFrame(raf);
    }, delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(45,212,191,0.10)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.05s linear", filter: `drop-shadow(0 0 6px ${color}88)` }}
      />
    </svg>
  );
}

// ─── Adherence Bar ─────────────────────────────────────────────────────────
function AdherenceBar({ value, delay = 0 }: { value: number; delay?: number }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div style={{ height: 10, background: "rgba(45,212,191,0.10)", borderRadius: 99, overflow: "hidden", position: "relative" }}>
      <div style={{
        height: "100%", borderRadius: 99,
        width: `${w}%`,
        background: "linear-gradient(90deg, #14b8a6, #2DD4BF, #67e8f9)",
        transition: "width 1.4s cubic-bezier(0.22,1,0.36,1)",
        boxShadow: "0 0 12px rgba(45,212,191,0.5)",
        position: "relative",
      }}>
        {/* Shimmer sweep */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
          animation: "barShimmer 2s ease-in-out infinite",
        }} />
      </div>
    </div>
  );
}

// ─── Floating AI Robot ───────────────────────────────────────────────────────
function AIRobot() {
  return (
    <div style={{ position: "relative", width: 72, height: 72, animation: "robotFloat 3s ease-in-out infinite" }}>
      {/* Body */}
      <div style={{
        width: 52, height: 44, background: "linear-gradient(135deg, #2DD4BF, #0891b2)",
        borderRadius: 14, margin: "12px auto 0",
        position: "relative", boxShadow: "0 8px 24px rgba(45,212,191,0.40)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {/* Eyes */}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ width: 10, height: 10, background: "#fff", borderRadius: "50%", position: "relative" }}>
            <div style={{ width: 5, height: 5, background: "#0B1E33", borderRadius: "50%", position: "absolute", top: 2, left: 2, animation: "eyeBlink 4s ease-in-out infinite" }} />
          </div>
          <div style={{ width: 10, height: 10, background: "#fff", borderRadius: "50%", position: "relative" }}>
            <div style={{ width: 5, height: 5, background: "#0B1E33", borderRadius: "50%", position: "absolute", top: 2, left: 2, animation: "eyeBlink 4s ease-in-out infinite 0.1s" }} />
          </div>
        </div>
        {/* Mouth dots */}
        <div style={{ position: "absolute", bottom: 9, display: "flex", gap: 4 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 4, height: 4, background: "rgba(255,255,255,0.7)", borderRadius: "50%",
              animation: `mouthPulse 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.18}s`,
            }} />
          ))}
        </div>
      </div>
      {/* Head */}
      <div style={{
        width: 40, height: 22, background: "linear-gradient(135deg, #0891b2, #2DD4BF)",
        borderRadius: "10px 10px 4px 4px",
        position: "absolute", top: 0, left: 16,
        boxShadow: "0 -2px 10px rgba(45,212,191,0.30)",
      }}>
        {/* Antenna */}
        <div style={{ width: 3, height: 10, background: "#2DD4BF", borderRadius: 99, position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)" }}>
          <div style={{ width: 7, height: 7, background: "#fff", borderRadius: "50%", position: "absolute", top: -4, left: -2, boxShadow: "0 0 8px #2DD4BF", animation: "antennaPulse 1.5s ease-in-out infinite" }} />
        </div>
      </div>
      {/* Arms */}
      <div style={{ position: "absolute", top: 22, left: 2, width: 8, height: 22, background: "linear-gradient(180deg,#2DD4BF,#0891b2)", borderRadius: 99, animation: "armWave 3s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: 22, right: 2, width: 8, height: 22, background: "linear-gradient(180deg,#2DD4BF,#0891b2)", borderRadius: 99, animation: "armWave 3s ease-in-out infinite 0.5s" }} />
    </div>
  );
}

// ─── Particle Dots ─────────────────────────────────────────────────────────
function Particles({ count = 12 }: { count?: number }) {
  const dots = useRef(Array.from({ length: count }, () => ({
    x: Math.random() * 100,
    size: Math.random() * 3 + 1,
    dur: Math.random() * 6 + 5,
    delay: Math.random() * 8,
    opacity: Math.random() * 0.15 + 0.04,
  }))).current;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {dots.map((d, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${d.x}%`, bottom: -6,
          width: d.size, height: d.size,
          borderRadius: "50%",
          background: "#2DD4BF",
          opacity: 0,
          animation: `particleRise ${d.dur}s linear infinite`,
          animationDelay: `${d.delay}s`,
        }} />
      ))}
    </div>
  );
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  .pat-dash * { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; box-sizing: border-box; }
  .pat-dash .mono { font-family: 'JetBrains Mono', monospace; }

  /* ── Keyframes ─────────────────────────────────────────── */
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(24px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes cardPop {
    0%   { opacity:0; transform:translateY(18px) scale(0.97); }
    100% { opacity:1; transform:translateY(0)    scale(1); }
  }
  @keyframes barShimmer {
    0%   { transform:translateX(-100%); }
    100% { transform:translateX(200%); }
  }
  @keyframes robotFloat {
    0%,100% { transform:translateY(0) rotate(-1deg); }
    50%     { transform:translateY(-8px) rotate(1deg); }
  }
  @keyframes armWave {
    0%,100% { transform:rotate(0deg); transform-origin:top center; }
    40%     { transform:rotate(18deg); transform-origin:top center; }
  }
  @keyframes eyeBlink {
    0%,90%,100% { transform:scaleY(1); }
    95%          { transform:scaleY(0.1); }
  }
  @keyframes mouthPulse {
    0%,100% { transform:scale(1); opacity:0.7; }
    50%     { transform:scale(1.4); opacity:1; }
  }
  @keyframes antennaPulse {
    0%,100% { box-shadow:0 0 6px #2DD4BF; transform:scale(1); }
    50%     { box-shadow:0 0 14px #2DD4BF, 0 0 24px rgba(45,212,191,0.4); transform:scale(1.2); }
  }
  @keyframes particleRise {
    0%   { opacity:0;    transform:translateY(0); }
    10%  { opacity:0.9; }
    85%  { opacity:0.4; }
    100% { opacity:0;    transform:translateY(-320px); }
  }
  @keyframes pulseRing {
    0%   { transform:scale(0.85); opacity:0.6; }
    100% { transform:scale(2.2);  opacity:0; }
  }
  @keyframes scanLine {
    0%   { top:-2%;  opacity:0; }
    5%   { opacity:1; }
    95%  { opacity:0.5; }
    100% { top:105%; opacity:0; }
  }
  @keyframes msgFadeIn {
    from { opacity:0; transform:translateX(-10px) scale(0.96); }
    to   { opacity:1; transform:translateX(0) scale(1); }
  }
  @keyframes wifiPulse {
    0%,100% { opacity:1; }
    50%     { opacity:0.4; }
  }
  @keyframes headerShine {
    0%   { transform:translateX(-200%) skewX(-15deg); }
    100% { transform:translateX(400%)  skewX(-15deg); }
  }
  @keyframes statBounce {
    0%   { opacity:0; transform:scale(0.7) translateY(12px); }
    70%  { transform:scale(1.06) translateY(-3px); }
    100% { opacity:1; transform:scale(1) translateY(0); }
  }
  @keyframes deviceGlow {
    0%,100% { box-shadow:0 0 0 0 rgba(45,212,191,0.4); }
    50%     { box-shadow:0 0 0 10px rgba(45,212,191,0); }
  }
  @keyframes checkPop {
    0%   { transform:scale(0) rotate(-20deg); opacity:0; }
    60%  { transform:scale(1.2) rotate(4deg); }
    100% { transform:scale(1) rotate(0); opacity:1; }
  }

  /* ── Component Transitions ─────────────────────────────── */
  .pat-card { transition:transform 0.3s ease, box-shadow 0.3s ease; }
  .pat-card:hover { transform:translateY(-4px); box-shadow:0 20px 60px rgba(11,30,51,0.12) !important; }

  .stat-chip { transition:all 0.25s ease; }
  .stat-chip:hover { transform:translateY(-3px) scale(1.03); }

  .teal-btn { transition:all 0.25s ease; position:relative; overflow:hidden; }
  .teal-btn::after {
    content:'';
    position:absolute; inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);
    animation:headerShine 2.5s ease-in-out infinite;
  }
  .teal-btn:hover { transform:translateY(-2px); box-shadow:0 12px 40px rgba(45,212,191,0.45) !important; }

  .ai-btn { transition:all 0.22s ease; }
  .ai-btn:hover { background:rgba(45,212,191,0.18) !important; transform:scale(1.02); }

  .hw-card { transition:all 0.3s ease; }
  .hw-card:hover { transform:translateY(-3px); box-shadow:0 16px 44px rgba(11,30,51,0.10) !important; }

  /* ── Responsive Layout Classes ─────────────────────────── */
  .resp-header        { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px; }
  .resp-header-left   { display:flex; align-items:center; gap:18px; }
  .resp-header-right  { display:flex; gap:12px; flex-wrap:wrap; }
  .resp-two-col       { display:grid; grid-template-columns:1.15fr 1fr; gap:20px; margin-bottom:20px; }
  .resp-session-grid  { display:grid; grid-template-columns:1fr 1fr; gap:8px 24px; flex:1; }
  .resp-stats-grid    { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
  .resp-arcs-row      { display:flex; justify-content:center; gap:32px; margin-top:18px; padding-top:16px; border-top:1px solid #f1f5f9; }
  .resp-hw-grid       { display:grid; grid-template-columns:1fr 1fr; gap:16px; }

  @media (max-width:1024px) {
    .resp-two-col { grid-template-columns:1fr; }
  }

  @media (max-width:640px) {
    .pat-dash main  { padding:16px 14px !important; }
    .resp-header    { flex-direction:column; align-items:flex-start; }
    .resp-header-right { width:100%; }
    .resp-header-right > div { flex:1; min-width:0; }
    .resp-header-left { gap:12px; }
    .resp-two-col   { grid-template-columns:1fr; gap:14px; }
    .resp-hw-grid   { grid-template-columns:1fr; gap:12px; }
    .resp-arcs-row  { gap:18px; }
    .stat-chip      { padding:10px 8px !important; }
    .resp-robot-hide { display:none; }
  }

  @media (max-width:380px) {
    .resp-session-grid { grid-template-columns:1fr; }
    .resp-arcs-row     { gap:12px; }
    .resp-stats-grid   { gap:5px; }
  }
`;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PatientHome() {
  const [mounted, setMounted] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [msgVisible, setMsgVisible] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  // Cycle AI messages
  useEffect(() => {
    const iv = setInterval(() => {
      setMsgVisible(false);
      setTimeout(() => {
        setMsgIdx(i => (i + 1) % aiMessages.length);
        setMsgVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  if (!mounted) return null;

  return (
    <div className="pat-dash" style={{ minHeight: "100vh", background: "#F0F4F8", paddingBottom: 48 }}>
      <style>{CSS}</style>

      {/* ── Ambient BG ─────────────────────────────────────────────────── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", right: "5%", width: 700, height: 700,
          background: "radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "5%", width: 600, height: 600,
          background: "radial-gradient(circle, rgba(99,102,241,0.045) 0%, transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(11,30,51,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(11,30,51,0.022) 1px, transparent 1px)",
          backgroundSize: "52px 52px" }} />
      </div>

        {/* Bottom Grid Placeholders */}
        
        <div className='bg-white p-6 rounded-2xl shadow-sm border-gray-100'>
          <h4 className='text-lg font-semibold text-[#0B1E33] mb-6'>
            Session & Adherence Status
          </h4>

          {/* Next Therapy Session */}

          <div className='bg-gray-50 rounded-xl p-5 mb-6'>
            <h5 className='font-semibold text-[#0B1E33] mb-4'>
              Next Therapy Session
            </h5>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center'>
                📅
                </div>
                <div>
                  <p className='text-gray-500'>Date</p>
                  <p className='font-semibold text-teal-600'>{mockAdherenceData.nextSession.data}</p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center'>
                ⏰
                </div>
                <div>
                  <p className='text-gray-500'>Time</p>
                  <p className='font-semibold text-teal-600'>{mockAdherenceData.nextSession.time}</p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center'>
                ✋
                </div>
                <div>
                  <p className='text-gray-500'>Prescribed Hand</p>
                  <p className='font-semibold text-teal-600'>{mockAdherenceData.nextSession.hand}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Adherence */}

          <div className='bg-green-50 rounded-xl p-5'>
            <div className='flex items-center justify-between mb-3'>
              <h5 className='font-semibold text-[#0B1E33]'>
                Weekly Adherence Score
              </h5>

              <p className='text-2xl font-bold text-green-600'>
                {mockAdherenceData.weekly.percentage}%
              </p>
            </div>

            {/* Progress Bar */}

            <div className='w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3'>
              <div 
              className='h-full bg-amber-600'
              style={{
                width: `${mockAdherenceData.weekly.percentage}%`,
              }}
              />
            </div>

            <p className='text-sm text-gray-600'>
              {mockAdherenceData.weekly.completed} /{" "}
              {mockAdherenceData.weekly.total} sessions completed this week 
            </p>
          </div>
        </div>

        <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-48'>
          <h4 className='font-bold text-[#0B1E33] mb-4'>AI Companion</h4>
          <div className='h-full flex items-center justify-center text-gray-400 bg-gray-50 
          rounded-xl border border-dashed border-gray-200'>
            Chat Bot Loading....
          </div>
        </div>

        <div className='bg-white p-6 rounded-2xl shadow-sm border-gray-100'>
          <div className='flex items-center justify-between mb-6'>
          <h4 className='text-lg font-semibold text-[#0B1E33] mb-6'>
            Quick Stats
          </h4>

          <button className='flex items-center gap-2 text-teal-500 font-medium hover:text-teal-600 transition'>
                 View Deyails →
            </button>
          </div>
          
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
            <div className='rounded-x1 p-5 border border-green-200 bg-gradient-to-br from-green-50 to-white'>
              <div className='flex items-center gap-2 text-green-600 mb-2'>
                <span>📈</span>
                <p className='text-sm font-medium'>Grip Strength</p>
              </div>
              <p className='text-2xl font-bold text-green-700'>
                +15% <span className='text-sm'>↗</span>
              </p>
            </div>

            <div className='rounded-xl p-5 border border-teal-200 bg-gradient-to-br from-teal-50 to-white'>
              <div className='flex items-center gap-2 text-teal-600 mb-2'>
              <span>🧠</span>
              <p className='text-sm font-medium'>Meomory Sucess</p>
              </div>
              <p className='text-2xl font-bold text-teal-700'>85%</p>
            </div>

            <div className='rounded-xl p-5 border border-teal-200 bg-gradient-to-br from-teal-50 to-white'>
              <div className='flex items-center gap-2 text-teal-600 mb-2'>
              <span>📊</span>
              <p className='text-sm font-medium'>Journey</p>
              </div>
              <p className='text-2xl font-bold text-teal-700'>40%</p>
            </div>
          </div>
        </div>

        {/* Hardware Status and Input Confirmation */}
        <div className='bg-white rounded-2xl shadow-sm border-gray-100 p-6'>
            <h4 className='text-lg font-semibold text-[#0B1E33] mb-6'>
              Hardware Status & Input Confirmation
            </h4> 

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
            <div className='rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-6'>
                <div className='flex items-center justify-between mb-4'>
                <h5 className='font-semibold text-[#0B1E33]'>Device Status</h5>

            {/* Next Therapy Session Inner Card */}
            <div style={{
              background: "linear-gradient(135deg, rgba(45,212,191,0.05) 0%, rgba(8,145,178,0.03) 100%)",
              border: "1px solid rgba(45,212,191,0.18)",
              borderRadius: 18, padding: "20px",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100,
                background: "radial-gradient(circle, rgba(45,212,191,0.10), transparent 70%)" }} />

              <div className="mono" style={{ fontSize: 9.5, color: "#94a3b8", textTransform: "uppercase",
                letterSpacing: "0.16em", marginBottom: 16 }}>Next Therapy Session</div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
                {/* Calendar visual */}
                <div style={{
                  width: 60, height: 64, borderRadius: 14,
                  background: "#0B1E33",
                  display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0,
                  boxShadow: "0 4px 16px rgba(11,30,51,0.18)",
                }}>
                  <div style={{ background: "#2DD4BF", padding: "4px 0", textAlign: "center" }}>
                    <span className="mono" style={{ fontSize: 8, fontWeight: 700, color: "#0B1E33",
                      textTransform: "uppercase", letterSpacing: "0.10em" }}>NOV</span>
                  </div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>17</span>
                  </div>
                </div>

                {/* Session details */}
                <div className="resp-session-grid">
                  {[
                    { label: "Date", value: `${nextSession.date}, ${nextSession.year}`, icon: Calendar },
                    { label: "Time", value: nextSession.time, icon: Clock },
                    { label: "Prescribed Hand", value: nextSession.hand, icon: Hand, highlight: true },
                    { label: "Duration", value: nextSession.duration, icon: Activity },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="mono" style={{ fontSize: 8.5, color: "#94a3b8",
                        textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 3 }}>{item.label}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <item.icon size={12} color={item.highlight ? "#2DD4BF" : "#64748b"} />
                        <span style={{ fontSize: 13, fontWeight: item.highlight ? 800 : 600,
                          color: item.highlight ? "#2DD4BF" : "#0B1E33" }}>{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Adherence Score */}
            <div style={{
              background: "#f8fafc",
              border: "1px solid rgba(226,232,240,0.8)",
              borderRadius: 18, padding: "20px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0B1E33" }}>Weekly Adherence Score</div>
                  <div className="mono" style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>
                    {adherence.completed}/{adherence.total} Sessions Completed This Week
                  </div>

              {/* Session dots */}
              <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                {Array.from({ length: adherence.total }).map((_, i) => (
                  <div key={i} style={{
                    flex: 1, height: 6, borderRadius: 99,
                    background: i < adherence.completed
                      ? "linear-gradient(90deg,#14b8a6,#2DD4BF)"
                      : "rgba(45,212,191,0.12)",
                    boxShadow: i < adherence.completed ? "0 0 6px rgba(45,212,191,0.4)" : "none",
                    transition: "all 0.3s ease",
                    animation: "cardPop 0.4s cubic-bezier(0.22,1,0.36,1) both",
                    animationDelay: `${0.6 + i * 0.08}s`,
                  } as React.CSSProperties} />
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <Link href="/patients/schedule" className="teal-btn" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "linear-gradient(135deg, #2DD4BF 0%, #0891b2 100%)",
              color: "#fff", fontWeight: 800, fontSize: 14,
              borderRadius: 16, padding: "16px",
              textDecoration: "none",
              boxShadow: "0 6px 28px rgba(45,212,191,0.35)",
              letterSpacing: "0.02em",
            }}>
              <Calendar size={18} />
              View Full Schedule
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* ── RIGHT COLUMN ───────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* AI Companion Card */}
            <div className="pat-card" style={{
              animation: "cardPop 0.6s cubic-bezier(0.22,1,0.36,1) 0.22s both",
              background: "linear-gradient(135deg, #e8fdfb 0%, #d1f7f3 40%, #e0f7fa 100%)",
              borderRadius: 24, padding: "22px 22px 20px",
              border: "1.5px solid rgba(45,212,191,0.28)",
              boxShadow: "0 2px 20px rgba(45,212,191,0.10)",
              position: "relative", overflow: "hidden",
              flex: 1,
            }}>
              <Particles count={8} />

              {/* Glow */}
              <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200,
                background: "radial-gradient(circle, rgba(45,212,191,0.15), transparent 70%)",
                animation: "deviceGlow 4s ease-in-out infinite" }} />

              <div style={{ position: "relative", zIndex: 2 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 11,
                    background: "rgba(45,212,191,0.18)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#0891b2" }}>
                    <Bot size={19} />
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Device ID</p>
                    <p className='text-lg font-semibold text-[#0B1E33]'>R-103</p>
                  </div>
                </div>

                {/* Robot + Chat */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginBottom: 18 }}>
                  <div className="resp-robot-hide"><AIRobot /></div>
                  {/* Chat bubble */}
                  <div style={{
                    flex: 1,
                    background: "#fff",
                    borderRadius: "16px 16px 16px 4px",
                    padding: "12px 16px",
                    boxShadow: "0 4px 20px rgba(11,30,51,0.08)",
                    opacity: msgVisible ? 1 : 0,
                    transform: msgVisible ? "translateX(0)" : "translateX(-8px)",
                    transition: "opacity 0.35s ease, transform 0.35s ease",
                    position: "relative",
                    border: "1px solid rgba(45,212,191,0.12)",
                  }}>
                    {/* Typing indicator or message */}
                    <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                      {aiMessages[msgIdx]}
                    </p>
                    {/* Message dots at bottom */}
                    <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                      {[0,1,2].map(i => (
                        <div key={i} style={{ width: 5, height: 5, borderRadius: "50%",
                          background: "#2DD4BF", opacity: 0.5,
                          animation: `mouthPulse 1.2s ease-in-out infinite`,
                          animationDelay: `${i * 0.2}s` }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Open AI Companion Button */}
                <button className="ai-btn" style={{
                  width: "100%",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "rgba(45,212,191,0.12)",
                  border: "1.5px solid rgba(45,212,191,0.30)",
                  borderRadius: 14, padding: "13px 18px",
                  cursor: "pointer", color: "#0B1E33",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Open AI Companion</span>
                  <div style={{ width: 30, height: 30, borderRadius: "50%",
                    background: "#2DD4BF", display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(45,212,191,0.40)" }}>
                    <Send size={13} color="#fff" />
                  </div>
                </button>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="pat-card" style={{
              animation: "cardPop 0.6s cubic-bezier(0.22,1,0.36,1) 0.32s both",
              background: "#fff",
              borderRadius: 24, padding: "22px",
              border: "1px solid rgba(226,232,240,0.8)",
              boxShadow: "0 2px 20px rgba(11,30,51,0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10,
                    background: "rgba(45,212,191,0.10)",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#2DD4BF" }}>
                    <TrendingUp size={17} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0B1E33", margin: 0 }}>Quick Stats</h3>
                </div>
                <Link href="/patients/stats" style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: 11, fontWeight: 700, color: "#2DD4BF", textDecoration: "none" }}>
                  View Details <ChevronRight size={14} />
                </Link>
              </div>

              <div className="resp-stats-grid">
                {quickStats.map((s, i) => (
                  <div key={s.label} className="stat-chip" style={{
                    background: s.bg,
                    borderRadius: 16, padding: "14px 12px",
                    textAlign: "center",
                    border: `1px solid ${s.color}22`,
                    animation: "statBounce 0.55s cubic-bezier(0.22,1,0.36,1) both",
                    animationDelay: `${0.4 + i * 0.1}s`,
                    cursor: "default",
                  }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9,
                        background: `${s.color}20`,
                        display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
                        <s.icon size={15} />
                      </div>
                    </div>
                    <div style={{ fontSize: "1.45rem", fontWeight: 800, color: s.color,
                      lineHeight: 1, letterSpacing: "-0.02em",
                      textShadow: `0 0 16px ${s.color}60` }}>
                      <AnimNum to={s.value} prefix={s.prefix} suffix={s.suffix} delay={500 + i * 100} />
                    </div>
                    <div className="mono" style={{ fontSize: 8.5, color: "#94a3b8",
                      textTransform: "uppercase", letterSpacing: "0.10em", marginTop: 5 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Progress arcs row */}
              <div className="resp-arcs-row">
                {quickStats.map((s, i) => (
                  <div key={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ position: "relative" }}>
                      <ProgressArc value={s.value} size={52} stroke={4.5} color={s.color} delay={600 + i * 120} />
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <s.icon size={13} color={s.color} />
                      </div>
                    </div>
                    <span className="mono" style={{ fontSize: 8, color: "#94a3b8",
                      textTransform: "uppercase", letterSpacing: "0.10em" }}>{s.label.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 3 · HARDWARE STATUS
        ══════════════════════════════════════════════════════════════ */}
        <div style={{
          animation: "cardPop 0.6s cubic-bezier(0.22,1,0.36,1) 0.44s both",
          background: "#fff",
          borderRadius: 24, padding: "24px 28px",
          border: "1px solid rgba(226,232,240,0.8)",
          boxShadow: "0 2px 20px rgba(11,30,51,0.06)",
        }}>
          {/* Section header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10,
              background: "rgba(16,185,129,0.10)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
              <Shield size={17} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0B1E33", margin: 0 }}>Hardware Status & Input Confirmation</h2>
              <p className="mono" style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.14em", marginTop: 3 }}>Device readiness for your session</p>
            </div>
          </div>

          <div className="resp-hw-grid">

            {/* Device Status */}
            <div className="hw-card" style={{
              background: "linear-gradient(135deg, #f0fdf8 0%, #ecfdf5 100%)",
              borderRadius: 18, padding: "22px",
              border: "1.5px solid rgba(16,185,129,0.20)",
              boxShadow: "0 2px 16px rgba(16,185,129,0.07)",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120,
                background: "radial-gradient(circle, rgba(16,185,129,0.08), transparent 70%)" }} />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, position: "relative", zIndex: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0B1E33" }}>Device Status</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6,
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.25)",
                  borderRadius: 99, padding: "4px 12px" }}>
                  <CircleCheck size={13} color="#10b981" />
                  <span className="mono" style={{ fontSize: 9.5, fontWeight: 700, color: "#10b981", letterSpacing: "0.08em" }}>Connected</span>
                </div>
              </div>

              <div className="resp-header-left" style={{ position: "relative", zIndex: 2 }}>
                {/* WiFi Icon */}
                <div style={{ position: "relative" }}>
                  <div style={{
                    width: 68, height: 68, borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(45,212,191,0.15), rgba(45,212,191,0.05))",
                    border: "2px solid rgba(45,212,191,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    animation: "deviceGlow 2.5s ease-in-out infinite",
                  }}>
                    <Wifi size={28} color="#2DD4BF" />
                  </div>
                  {/* Pulse rings */}
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%",
                    border: "2px solid rgba(45,212,191,0.3)",
                    animation: "pulseRing 2.5s ease-out infinite" }} />
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%",
                    border: "2px solid rgba(45,212,191,0.2)",
                    animation: "pulseRing 2.5s ease-out infinite 0.8s" }} />
                </div>

                <div>
                  <p className='font-semibold text-[#0B1E33]'>
                    BP Bulb Pressure Sensor
                  </p>

                  <p className='text-sm text-gray-500'>
                    Rubber inflation bulb with tube 
                  </p>
                </div>  

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, position: "relative", zIndex: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0B1E33" }}>Input Device Confirmed</span>
              </div>

              <div style={{ display: "flex", gap: 18, alignItems: "center", position: "relative", zIndex: 2 }}>
                {/* Bulb SVG Icon */}
                <div style={{
                  width: 72, height: 80, borderRadius: 16,
                  background: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(45,212,191,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 4px 16px rgba(11,30,51,0.07)",
                }}>
                  {/* BP Bulb SVG */}
                  <svg width="38" height="52" viewBox="0 0 38 52" fill="none">
                    {/* Bulb body */}
                    <ellipse cx="19" cy="20" rx="14" ry="16" fill="#2DD4BF" opacity="0.85"/>
                    <ellipse cx="19" cy="20" rx="10" ry="12" fill="rgba(255,255,255,0.25)"/>
                    {/* Squeeze ridges */}
                    <ellipse cx="19" cy="36" rx="8" ry="5" fill="#0891b2" opacity="0.7"/>
                    <ellipse cx="19" cy="38" rx="6" ry="4" fill="#0891b2" opacity="0.5"/>
                    {/* Tube */}
                    <line x1="19" y1="40" x2="19" y2="52" stroke="#64748b" strokeWidth="3" strokeLinecap="round"/>
                    {/* Highlight */}
                    <ellipse cx="13" cy="14" rx="3.5" ry="5" fill="rgba(255,255,255,0.35)" transform="rotate(-20 13 14)"/>
                  </svg>
                </div>

                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0B1E33", marginBottom: 4 }}>BP Bulb Pressure Sensor</div>
                  <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, marginBottom: 10 }}>
                    Rubber inflation bulb with tube
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7,
                    animation: "checkPop 0.5s cubic-bezier(0.22,1,0.36,1) 1.2s both",
                    opacity: 0,
                  }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%",
                      background: "rgba(16,185,129,0.12)",
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CheckCircle2 size={13} color="#10b981" />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>System Ready</span>
                  </div>
                </div>
              </div>

              <p className='flex items-center gap-2 text-green-600 font-medium text-sm'>
                System Ready
              </p>

            </div>
          </div>
          
        </div>

      </main>
    </div>
  );
}
