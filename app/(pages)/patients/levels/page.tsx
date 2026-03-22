"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDarkMode } from "@/app/lib/hooks/useDarkMode";
import {
  Lock,
  Play,
  Activity,
  Brain,
  Zap,
  CheckCircle2,
  Stethoscope,
  ChevronRight,
  Target,
  Timer,
  TrendingUp,
  Shield,
  Cpu,
  Radio,
  Waves,
  Sparkles,
  Trophy,
  Star,
  Clock,
  BarChart3,
  Flame,
  BookOpen,
} from "lucide-react";

// --- FIREBASE IMPORTS ---
import { auth, db } from "@/app/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  PatientData,
  TherapyProtocol,
  GameSession,
} from "@/app/lib/db/types";
import { useAuthState } from "react-firebase-hooks/auth";

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */
type Category = "ALL" | "MOTOR" | "COGNITIVE" | "STRENGTH";

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
   BASE DATA LIBRARY (Testing Phase Maps)
═══════════════════════════════════════════ */
const BASE_LEVELS: Level[] = [
  {
    id: 1,
    title: "Synapse Racer: Base",
    category: "MOTOR",
    desc: "Motor baseline. Practice your squeeze control to collect golden pearls with forgiving pressure limits.",
    locked: false,
    path: "/games/synapse_racer?level=1",
    difficulty: "Easy",
    difficultyN: 1,
    accentHex: "#2DD4BF",
    icon: <Waves size={18} />,
    xp: 120,
    duration: "10 min",
    completedSessions: 4,
    targetSessions: 5,
    tags: ["Sensor Setup", "Motor"],
  },
  {
    id: 2,
    title: "Synapse Racer: Pro",
    category: "COGNITIVE",
    desc: "Cognitive dual-tasking. Collect blue targets and avoid red decoys under strict pressure constraints.",
    locked: false,
    path: "/games/synapse_racer?level=2",
    difficulty: "Medium",
    difficultyN: 2,
    accentHex: "#8b5cf6",
    icon: <Brain size={18} />,
    xp: 280,
    duration: "15 min",
    completedSessions: 2,
    targetSessions: 5,
    tags: ["Dual-Task", "Coordination"],
  },
  {
    id: 3,
    title: "Memory Gate: Novice",
    category: "COGNITIVE",
    desc: "Introduction to dual-tasking. Match sequences while holding sustained grip force.",
    locked: false,
    path: "/games/memory_gate?level=1",
    difficulty: "Medium",
    difficultyN: 3,
    accentHex: "#f59e0b",
    icon: <Brain size={18} />,
    xp: 450,
    duration: "15 min",
    completedSessions: 0,
    targetSessions: 5,
    tags: ["Dual-Task", "Memory"],
  },
  {
    id: 4,
    title: "Memory Gate: Advanced",
    category: "COGNITIVE",
    desc: "Complex sequencing under time pressure. Strains working memory alongside muscle endurance.",
    locked: false,
    path: "/games/memory_gate?level=2",
    difficulty: "Hard",
    difficultyN: 4,
    accentHex: "#22c55e",
    icon: <Target size={18} />,
    xp: 600,
    duration: "20 min",
    completedSessions: 0,
    targetSessions: 5,
    tags: ["Memory", "Speed"],
  },
  {
    id: 5,
    title: "Memory Gate: Elite",
    category: "STRENGTH",
    desc: "Ultimate cognitive-motor challenge. Long sequences and heavy resistance constraints.",
    locked: false,
    path: "/games/memory_gate?level=3",
    difficulty: "Expert",
    difficultyN: 5,
    accentHex: "#ef4444",
    icon: <Shield size={18} />,
    xp: 1000,
    duration: "25 min",
    completedSessions: 0,
    targetSessions: 5,
    tags: ["Endurance", "Cognitive"],
  },
];

/* ═══════════════════════════════════════════
   ANIMATED NUMBER
═══════════════════════════════════════════ */
function AnimNum({
  to,
  suffix = "",
  delay = 0,
}: {
  to: number;
  suffix?: string;
  delay?: number;
}) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let start: number | null = null;
      const raf = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 1200, 1);
        const e = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(e * to));
        if (p < 1) requestAnimationFrame(raf);
        else setVal(to);
      };
      requestAnimationFrame(raf);
    }, delay);
    return () => clearTimeout(t);
  }, [to, delay]);
  return (
    <>
      {val}
      {suffix}
    </>
  );
}

/* ═══════════════════════════════════════════
   CSS
═══════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  .lv-dash * { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; box-sizing: border-box; }
  .lv-dash .mono { font-family: 'JetBrains Mono', monospace; }

  @keyframes fadeUp {
    from { opacity:0; transform:translateY(22px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes cardPop {
    0%   { opacity:0; transform:translateY(18px) scale(0.97); }
    100% { opacity:1; transform:translateY(0)    scale(1); }
  }
  @keyframes barShimmer {
    0%   { transform:translateX(-100%); }
    100% { transform:translateX(250%); }
  }
  @keyframes headerShine {
    0%   { transform:translateX(-200%) skewX(-15deg); }
    100% { transform:translateX(400%)  skewX(-15deg); }
  }
  @keyframes scanLine {
    0%   { top:-4%;  opacity:0; }
    6%   { opacity:1; }
    92%  { opacity:0.6; }
    100% { top:108%; opacity:0; }
  }
  @keyframes deviceGlow {
    0%,100% { box-shadow:0 0 0 0 rgba(45,212,191,0.38); }
    50%     { box-shadow:0 0 0 10px rgba(45,212,191,0); }
  }
  @keyframes pulseRing {
    0%   { transform:scale(0.85); opacity:0.6; }
    100% { transform:scale(2.2);  opacity:0; }
  }
  @keyframes statBounce {
    0%   { opacity:0; transform:scale(0.72) translateY(12px); }
    70%  { transform:scale(1.05) translateY(-3px); }
    100% { opacity:1; transform:scale(1) translateY(0); }
  }
  @keyframes checkPop {
    0%   { transform:scale(0) rotate(-20deg); opacity:0; }
    60%  { transform:scale(1.2) rotate(4deg); }
    100% { transform:scale(1)   rotate(0);    opacity:1; }
  }
  @keyframes dotBlink {
    0%,100% { opacity:1; }
    50%     { opacity:0.25; }
  }
  @keyframes shimmerSlide {
    0%   { transform:translateX(-200%); }
    100% { transform:translateX(300%);  }
  }
  @keyframes barFill {
    from { width:0%; }
    to   { width:var(--bar-w,0%); }
  }

  .lv-card {
    transition: transform 0.28s cubic-bezier(0.22,1,0.36,1), box-shadow 0.28s ease;
    background: #fff;
    border-radius: 22px;
    border: 1px solid rgba(226,232,240,0.9);
    box-shadow: 0 2px 18px rgba(11,30,51,0.055);
  }
  .lv-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 22px 56px rgba(11,30,51,0.11) !important;
  }
  .lv-card.locked {
    filter: grayscale(0.3);
    opacity: 0.65;
    cursor: not-allowed;
  }
  .lv-card.locked:hover { transform: none; }

  .lv-cta-btn {
    transition: all 0.25s ease;
    position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    border-radius: 14px; padding: 13px; width: 100%;
    font-weight: 800; font-size: 12px; letter-spacing: 0.06em;
    text-transform: uppercase; cursor: pointer; border: none;
  }
  .lv-cta-btn::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);
    animation: headerShine 2.8s ease-in-out infinite;
  }
  .lv-cta-btn:hover { transform: translateY(-2px); }

  .lv-filter-btn {
    padding: 8px 16px; border-radius: 12px; border: none; cursor: pointer;
    font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em;
    transition: all 0.2s ease;
  }

  .lv-tag {
    padding: 3px 10px; border-radius: 99px;
    font-size: 9.5px; font-weight: 700; font-family: 'JetBrains Mono', monospace;
  }

  .lv-stat-row-item {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; color: #94a3b8;
  }

  .lv-main-grid     { display:grid; grid-template-columns:1fr 380px; gap:22px; }
  .lv-cards-grid    { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .lv-metrics-grid  { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
  .lv-filter-strip  { display:flex; flex-wrap:wrap; gap:4px; }

  @media (max-width:1280px) {
    .lv-main-grid { grid-template-columns:1fr 340px; }
  }
  @media (max-width:1100px) {
    .lv-main-grid { grid-template-columns:1fr; }
    .lv-sidebar { display:none; }
  }
  @media (max-width:820px) {
    .lv-cards-grid { grid-template-columns:1fr; }
  }
  @media (max-width:640px) {
    .lv-dash main { padding:16px 14px !important; }
    .lv-hero-inner { flex-direction:column !important; gap:20px !important; }
    .lv-hero-cta   { width:100% !important; }
    .lv-hero-badges{ flex-wrap:wrap !important; }
    .lv-metrics-grid { grid-template-columns:1fr; gap:8px; }
    .lv-hdr-right  { display:none !important; }
  }
  @media (max-width:480px) {
    .lv-filter-strip .lv-filter-btn { padding:7px 10px !important; font-size:8.5px !important; }
  }

  /* ── Dark Mode Surface Overrides ─────────────────────── */
  .dark .lv-dash [style*="background:#fff"],
  .dark .lv-dash [style*="background: #fff"],
  .dark .lv-dash [style*="background: rgb(255,255,255)"],
  .dark .lv-dash [style*="background: rgb(255, 255, 255)"],
  .dark .lv-dash [style*="background:#f8fafc"],
  .dark .lv-dash [style*="background: #f8fafc"],
  .dark .lv-dash [style*="background: rgb(248,250,252)"],
  .dark .lv-dash [style*="background: rgb(248, 250, 252)"],
  .dark .lv-dash [style*="background: rgba(255,255,255"],
  .dark .lv-dash [style*="background: rgba(255, 255, 255"],
  .dark .lv-dash [style*="background: rgba(240,244,248"],
  .dark .lv-dash [style*="background: rgba(240, 244, 248"],
  .dark .lv-dash [style*="background: rgba(248,247,255"],
  .dark .lv-dash [style*="background: rgba(248, 247, 255"],
  .dark .lv-dash [style*="background: rgba(240,240,255"],
  .dark .lv-dash [style*="background: rgba(240, 240, 255"],
  .dark .lv-dash [style*="background:linear-gradient(135deg, #f0fdf8"],
  .dark .lv-dash [style*="background: linear-gradient(135deg, #f0fdf8"],
  .dark .lv-dash [style*="background:linear-gradient(135deg,#f8f7ff"],
  .dark .lv-dash [style*="background: linear-gradient(135deg,#f8f7ff"],
  .dark .lv-dash [style*="background:linear-gradient(135deg, #f8f7ff"],
  .dark .lv-dash [style*="background: linear-gradient(135deg, #f8f7ff"],
  .dark .lv-dash [style*="background:linear-gradient(145deg,rgba(99,102,241,0.07)"],
  .dark .lv-dash [style*="background: linear-gradient(145deg,rgba(99,102,241,0.07)"],
  .dark .lv-dash [style*="background:linear-gradient(135deg, rgb(240, 253, 248)"],
  .dark .lv-dash [style*="background: linear-gradient(135deg, rgb(240, 253, 248)"],
  .dark .lv-dash [style*="background:linear-gradient(135deg, rgb(248, 247, 255)"],
  .dark .lv-dash [style*="background: linear-gradient(135deg, rgb(248, 247, 255)"] {
    background: #0f172a !important;
    border-color: rgba(71,85,105,0.65) !important;
    box-shadow: 0 6px 24px rgba(2,6,23,0.35) !important;
  }

  .dark .lv-dash [style*="color: #0B1E33"],
  .dark .lv-dash [style*="color:#0B1E33"],
  .dark .lv-dash [style*="color: rgb(11,30,51)"],
  .dark .lv-dash [style*="color: rgb(11, 30, 51)"] {
    color: #e2e8f0 !important;
  }

  .dark .lv-dash [style*="color: #64748b"],
  .dark .lv-dash [style*="color:#64748b"],
  .dark .lv-dash [style*="color: rgb(100,116,139)"],
  .dark .lv-dash [style*="color: rgb(100, 116, 139)"],
  .dark .lv-dash [style*="color: #94a3b8"],
  .dark .lv-dash [style*="color:#94a3b8"],
  .dark .lv-dash [style*="color: rgb(148,163,184)"],
  .dark .lv-dash [style*="color: rgb(148, 163, 184)"] {
    color: #94a3b8 !important;
  }

  .dark .lv-dash [style*="border: 1px solid rgba(226,232,240"],
  .dark .lv-dash [style*="border: 1.5px solid rgba(226,232,240"],
  .dark .lv-dash [style*="border: 1px solid rgba(226, 232, 240"],
  .dark .lv-dash [style*="border: 1.5px solid rgba(226, 232, 240"],
  .dark .lv-dash [style*="border: 1px solid rgb(226, 232, 240)"],
  .dark .lv-dash [style*="border: 1.5px solid rgb(226, 232, 240)"],
  .dark .lv-dash [style*="border-top: 1px solid rgba(226,232,240"],
  .dark .lv-dash [style*="borderTop: 1px solid rgba(226,232,240"] {
    border-color: rgba(71,85,105,0.65) !important;
  }

  .dark .lv-dash .lv-card {
    background: #0f172a !important;
    border-color: rgba(71,85,105,0.65) !important;
  }
`;

/* ═══════════════════════════════════════════
   NEURAL NETWORK CANVAS
═══════════════════════════════════════════ */
interface NNode {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  level: Level;
  pulsePhase: number;
}
interface NEdge {
  from: number;
  to: number;
  progress: number;
  speed: number;
}

const NeuralNetworkCanvas: React.FC<{ levels: Level[] }> = ({ levels }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<NNode[]>([]);
  const edgesRef = useRef<NEdge[]>([]);
  const rafRef = useRef<number>(0);
  const tsRef = useRef<number>(0);

  const init = useCallback(
    (w: number, h: number) => {
      const pos = [
        { x: w * 0.12, y: h * 0.62 },
        { x: w * 0.32, y: h * 0.27 },
        { x: w * 0.54, y: h * 0.66 },
        { x: w * 0.74, y: h * 0.24 },
        { x: w * 0.9, y: h * 0.6 },
      ];
      nodesRef.current = levels.map((lvl, i) => ({
        x: pos[i].x,
        y: pos[i].y,
        homeX: pos[i].x,
        homeY: pos[i].y,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
        level: lvl,
        pulsePhase: Math.random() * Math.PI * 2,
      }));
      edgesRef.current = [
        { from: 0, to: 1, progress: 0, speed: 0.0028 },
        { from: 1, to: 2, progress: 0.3, speed: 0.0022 },
        { from: 2, to: 3, progress: 0.6, speed: 0.0025 },
        { from: 3, to: 4, progress: 0.1, speed: 0.002 },
        { from: 0, to: 2, progress: 0.5, speed: 0.0015 },
        { from: 1, to: 3, progress: 0.75, speed: 0.0018 },
      ];
    },
    [levels],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dpr = window.devicePixelRatio || 1;

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
      init(rect.width, rect.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (ts: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const W = rect.width,
        H = rect.height;
      tsRef.current = ts * 0.001;
      ctx.clearRect(0, 0, W, H);

      edgesRef.current.forEach((edge) => {
        edge.progress = (edge.progress + edge.speed) % 1;
        const n1 = nodesRef.current[edge.from];
        const n2 = nodesRef.current[edge.to];
        if (!n1 || !n2) return;
        const both = !n1.level.locked && !n2.level.locked;
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.strokeStyle = both
          ? "rgba(45,212,191,0.20)"
          : "rgba(148,163,184,0.10)";
        ctx.lineWidth = 1;
        ctx.stroke();
        if (both) {
          const sx = n1.x + (n2.x - n1.x) * edge.progress;
          const sy = n1.y + (n2.y - n1.y) * edge.progress;
          const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, 7);
          grd.addColorStop(0, "rgba(45,212,191,0.95)");
          grd.addColorStop(1, "rgba(45,212,191,0)");
          ctx.beginPath();
          ctx.arc(sx, sy, 7, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }
      });

      nodesRef.current.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        if (Math.abs(node.x - node.homeX) > 12) node.vx *= -1;
        if (Math.abs(node.y - node.homeY) > 12) node.vy *= -1;
        const pulse = Math.sin(tsRef.current * 1.4 + node.pulsePhase);
        const r = node.level.locked ? 17 : 21 + pulse * 1.5;
        const acc = node.level.locked ? "#94a3b8" : node.level.accentHex;
        if (!node.level.locked) {
          const gr = r + 14 + pulse * 4;
          const g = ctx.createRadialGradient(
            node.x,
            node.y,
            r * 0.4,
            node.x,
            node.y,
            gr,
          );
          g.addColorStop(0, `${acc}30`);
          g.addColorStop(1, `${acc}00`);
          ctx.beginPath();
          ctx.arc(node.x, node.y, gr, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        }
        const cf = ctx.createRadialGradient(
          node.x - r * 0.3,
          node.y - r * 0.3,
          0,
          node.x,
          node.y,
          r,
        );
        cf.addColorStop(0, "#ffffff");
        cf.addColorStop(1, node.level.locked ? "#f1f5f9" : `${acc}1a`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = cf;
        ctx.shadowColor = acc;
        ctx.shadowBlur = node.level.locked ? 0 : 14;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = node.level.locked
          ? "rgba(148,163,184,0.35)"
          : `${acc}75`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = node.level.locked ? "#94a3b8" : acc;
        ctx.font = `800 ${Math.floor(r * 0.68)}px 'Plus Jakarta Sans', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${node.level.id}`, node.x, node.y);
        ctx.fillStyle = node.level.locked ? "#94a3b8" : "#0f172a";
        ctx.font = `700 9px 'Plus Jakarta Sans', sans-serif`;
        ctx.fillText(node.level.title.split(" ")[0], node.x, node.y + r + 12);
      });

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
};

/* ═══════════════════════════════════════════
   ANIMATED PROGRESS BAR
═══════════════════════════════════════════ */
function AnimBar({
  value,
  color,
  delay = 0,
}: {
  value: number;
  color: string;
  delay?: number;
}) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div
      style={{
        height: 6,
        background: "rgba(11,30,51,0.07)",
        borderRadius: 99,
        overflow: "hidden",
        position: "relative",
      }}>
      <div
        style={{
          height: "100%",
          borderRadius: 99,
          width: `${w}%`,
          background: color,
          boxShadow: `0 0 8px ${color}70`,
          transition: "width 1.2s cubic-bezier(0.22,1,0.36,1)",
          position: "relative",
        }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)",
            animation: "barShimmer 2.2s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   DIFFICULTY DOTS
═══════════════════════════════════════════ */
function DiffDots({ level }: { level: Level }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 18,
            height: 5,
            borderRadius: 99,
            background:
              i < level.difficultyN ? level.accentHex : "rgba(11,30,51,0.08)",
            transition: "background 0.3s ease",
            boxShadow:
              i < level.difficultyN ? `0 0 5px ${level.accentHex}60` : "none",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   LEVEL CARD
═══════════════════════════════════════════ */
function LevelCard({ level, onClick }: { level: Level; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const prog =
    level.targetSessions > 0
      ? (level.completedSessions / level.targetSessions) * 100
      : 0;
  const accentRgb = level.locked ? "#94a3b8" : level.accentHex;

  return (
    <div
      onClick={onClick}
      className={`lv-card${level.locked ? " locked" : ""}`}
      onMouseEnter={() => !level.locked && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        animation: "cardPop 0.55s cubic-bezier(0.22,1,0.36,1) both",
        border: `1.5px solid ${hov ? accentRgb + "44" : "rgba(226,232,240,0.9)"}`,
        position: "relative",
        overflow: "hidden",
        cursor: level.locked ? "not-allowed" : "pointer",
      }}>
      {/* Shimmer overlay on hover */}
      {hov && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
            borderRadius: 22,
          }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: "55%",
              background: `linear-gradient(105deg,transparent 30%,${level.accentHex}0e 50%,transparent 70%)`,
              animation: "shimmerSlide 1.6s ease-in-out infinite",
            }}
          />
        </div>
      )}

      {/* Accent top bar */}
      <div
        style={{
          height: 4,
          background: level.locked ? "#e2e8f0" : level.accentHex,
          width: "100%",
          boxShadow: level.locked ? "none" : `0 0 12px ${level.accentHex}60`,
        }}
      />

      <div style={{ padding: "20px 20px 18px" }}>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 14,
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: `${accentRgb}14`,
                color: accentRgb,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
              {level.icon}
            </div>
            <div>
              <div
                className="mono"
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: accentRgb,
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  marginBottom: 3,
                }}>
                {level.category}
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#0B1E33",
                  lineHeight: 1.2,
                }}>
                {level.title}
              </div>
            </div>
          </div>

          {level.locked ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(148,163,184,0.10)",
                border: "1px solid rgba(148,163,184,0.20)",
                borderRadius: 99,
                padding: "3px 10px",
              }}>
              <Lock size={10} color="#94a3b8" />
              <span
                className="mono"
                style={{
                  fontSize: 8.5,
                  color: "#94a3b8",
                  fontWeight: 700,
                  letterSpacing: "0.10em",
                }}>
                LOCKED
              </span>
            </div>
          ) : (
            <span
              className="mono"
              style={{ fontSize: 10, color: "#cbd5e1", fontWeight: 600 }}>
              #{String(level.id).padStart(2, "0")}
            </span>
          )}
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: 12,
            color: "#64748b",
            lineHeight: 1.65,
            marginBottom: 14,
          }}>
          {level.desc}
        </p>

        {/* Tags */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 14,
          }}>
          {level.tags.map((tag) => (
            <span
              key={tag}
              className="lv-tag"
              style={{
                background: `${accentRgb}10`,
                color: accentRgb,
              }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Difficulty */}
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 7,
            }}>
            <span
              className="mono"
              style={{
                fontSize: 8.5,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                fontWeight: 700,
              }}>
              Difficulty
            </span>
            <span
              className="mono"
              style={{ fontSize: 8.5, color: accentRgb, fontWeight: 700 }}>
              {level.difficulty}
            </span>
          </div>
          <DiffDots level={level} />
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            paddingTop: 12,
            paddingBottom: 12,
            borderTop: "1px solid rgba(226,232,240,0.8)",
            borderBottom: "1px solid rgba(226,232,240,0.8)",
            marginBottom: 14,
          }}>
          <div className="lv-stat-row-item">
            <Clock size={11} color="#cbd5e1" />
            {level.duration}
          </div>
          <div className="lv-stat-row-item">
            <Zap size={11} color="#cbd5e1" />
            {level.xp} XP
          </div>
          <div className="lv-stat-row-item">
            <CheckCircle2
              size={11}
              color={level.completedSessions > 0 ? accentRgb : "#cbd5e1"}
            />
            {level.completedSessions}/{level.targetSessions}
          </div>
        </div>

        {/* Progress bar */}
        {!level.locked && (
          <div style={{ marginBottom: 14 }}>
            <AnimBar value={prog} color={level.accentHex} delay={200} />
          </div>
        )}

        {/* CTA */}
        {!level.locked && (
          <button
            className="lv-cta-btn"
            style={{
              background: hov
                ? `linear-gradient(135deg,${level.accentHex},${level.accentHex}cc)`
                : `${level.accentHex}10`,
              color: hov
                ? level.accentHex === "#2DD4BF"
                  ? "#0B1E33"
                  : "#fff"
                : level.accentHex,
              boxShadow: hov ? `0 8px 28px ${level.accentHex}40` : "none",
            }}>
            {hov ? (
              <Play
                size={13}
                fill="currentColor"
                style={{ position: "relative", zIndex: 2 }}
              />
            ) : (
              <ChevronRight
                size={13}
                style={{ position: "relative", zIndex: 2 }}
              />
            )}
            <span style={{ position: "relative", zIndex: 2 }}>
              {hov ? "Launch Protocol" : "Replay Level"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   FILTER TAB
═══════════════════════════════════════════ */
function FilterTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="lv-filter-btn mono"
      onClick={onClick}
      style={
        active
          ? {
              background: "#0B1E33",
              color: "#fff",
              boxShadow: "0 2px 12px rgba(11,30,51,0.18)",
            }
          : { background: "transparent", color: "#94a3b8" }
      }>
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function LevelsPage() {
  const isDark = useDarkMode();
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);
  const [activeCategory, setActiveCategory] = useState<Category>("ALL");
  const [clock, setClock] = useState("");
  const [mounted, setMounted] = useState(false);

  // --- FIREBASE STATES ---
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [activeProtocol, setActiveProtocol] = useState<TherapyProtocol | null>(null);
  const [nextSession, setNextSession] = useState<GameSession | null>(null);
  const [clinicalStats, setClinicalStats] = useState({
    accuracy: 0,
    streak: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Clock tick
  useEffect(() => {
    setMounted(true);
    const fmt = () =>
      new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    setClock(fmt());
    const id = setInterval(() => setClock(fmt()), 1000);
    return () => clearInterval(id);
  }, []);

  // --- FETCH DATA FROM FIREBASE ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const uid = user?.uid;
        if (!uid) return;

        // 1. Fetch Patient Data (XP, Streaks, Unlocks)
        const userSnap = await getDoc(doc(db, "users", uid));
        let userData: PatientData | null = null;
        if (userSnap.exists()) {
          userData = userSnap.data() as PatientData;
          setPatientData(userData);
        }

        // 2. Fetch Doctor's Protocol Assignment
        const protocolQuery = query(
          collection(db, "protocols"),
          where("patientId", "==", uid),
        );
        const protocolSnap = await getDocs(protocolQuery);
        if (!protocolSnap.empty) {
          setActiveProtocol(protocolSnap.docs[0].data() as TherapyProtocol);
        }

        // 3. Fetch Recent Sessions (To calculate Accuracy & Find Next Scheduled)
        const sessionQuery = query(
          collection(db, "scheduled_sessions"),
          where("patientId", "==", uid)
        );
        const sSnap = await getDocs(sessionQuery);
        const allSessions = sSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        
        const now = new Date();
        let totalAccuracy = 0;
        let count = 0;

        const futureSessions = allSessions.filter((s: any) => {
          if (s.status === "completed") {
             if (s.accuracy) {
                 totalAccuracy += s.accuracy;
                 count++;
             }
             return false;
          }
          if (s.status === "cancelled" || s.status === "missed") return false;
          return new Date(`${s.scheduledDate}T${s.scheduledTime}`) >= now;
        }).sort((a: any, b: any) => new Date(`${a.scheduledDate}T${a.scheduledTime}`).getTime() - new Date(`${b.scheduledDate}T${b.scheduledTime}`).getTime());

        if (futureSessions.length > 0) {
          setNextSession(futureSessions[0] as GameSession);
        }

        setClinicalStats({
          accuracy: count > 0 ? Math.round(totalAccuracy / count) : 0,
          streak: userData?.gamification?.currentStreak || 0,
        });

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (authLoading) return;
    fetchData();
  }, [user?.uid, authLoading]);

  if (!mounted) return null;

  // Render a seamless loading state that doesn't break the aesthetic
  if (isLoading) {
    return (
      <div
        className="lv-dash"
        style={{
          minHeight: "100vh",
          background: isDark ? "#0b1220" : "#F0F4F8",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "4px solid rgba(45,212,191,0.2)",
            borderTopColor: "#2DD4BF",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // --- DYNAMIC LEVEL MAPPING ---
  // 🔴 FORCED UNLOCKED FOR TESTING PHASE (as requested)
  const dynamicLevels = BASE_LEVELS.map((level) => ({
    ...level,
    locked: false, 
  }));

  const filteredLevels =
    activeCategory === "ALL"
      ? dynamicLevels
      : dynamicLevels.filter((l) => l.category === activeCategory);

  // Dynamic variables for UI bindings
  const unlockedCount = dynamicLevels.filter(l => !l.locked).length;
  const totalXp = (patientData as any)?.xp || patientData?.gamification?.totalXp || 0;

  // Dynamic Hero Card Data based on next scheduled session
  const activeGameId = nextSession?.gameId || activeProtocol?.gameId || "synapse_racer";
  const assignedTitle = activeGameId === "synapse_racer" ? "Synapse Racer" : (activeGameId.includes("memory") ? "Memory Gate" : "Therapy Game");
  
  const assignedLevelId = nextSession?.level || activeProtocol?.level || 1;
  const assignedLevelData = dynamicLevels.find((l) => l.id === assignedLevelId) || dynamicLevels[0];
  
  const assignedDuration = (nextSession as any)?.durationMinutes ? `${(nextSession as any).durationMinutes} min` : "15 min";
  
  const targetHandRaw = nextSession?.targetHand || activeProtocol?.targetHand || "right";
  const targetHandFormatted = targetHandRaw.charAt(0).toUpperCase() + targetHandRaw.slice(1) + " Hand";
  
  const doctorInstructions = activeProtocol?.doctorNote || "Focus on maintaining grip strength during the fast sections. Aim for consistent timing — not maximum force.";
  
  const assignedPath = `/games/${activeGameId}?sessionId=${nextSession?.id || 'practice'}&level=${assignedLevelId}`;

  // Find next locked level for the Teaser
  const nextLockedLevel = dynamicLevels.find((l) => l.locked);

  return (
    <div
      className="lv-dash"
      style={{
        minHeight: "100vh",
        background: isDark ? "#0b1220" : "#F0F4F8",
        paddingBottom: 52,
      }}>
      <style>{CSS}</style>

      {/* ── Ambient BG ───────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
        }}>
        <div
          style={{
            position: "absolute",
            top: "-8%",
            right: "8%",
            width: 750,
            height: 750,
            background:
              "radial-gradient(circle,rgba(45,212,191,0.055) 0%,transparent 65%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-8%",
            left: "4%",
            width: 600,
            height: 600,
            background:
              "radial-gradient(circle,rgba(139,92,246,0.04) 0%,transparent 65%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: isDark
              ? "linear-gradient(rgba(148,163,184,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.035) 1px,transparent 1px)"
              : "linear-gradient(rgba(11,30,51,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(11,30,51,0.022) 1px,transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
      </div>

      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "28px 24px",
          position: "relative",
          zIndex: 1,
        }}>
        {/* ════════════════════════════════════════════════════════
            HEADER
        ════════════════════════════════════════════════════════ */}
        <div
          style={{
            animation: "fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both",
            background: "#fff",
            borderRadius: 22,
            padding: "20px 28px",
            marginBottom: 24,
            border: "1.5px solid rgba(45,212,191,0.22)",
            boxShadow: "0 4px 32px rgba(11,30,51,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            position: "relative",
            overflow: "hidden",
          }}>
          {/* Glow + shimmer */}
          <div
            style={{
              position: "absolute",
              top: -30,
              left: -30,
              width: 180,
              height: 180,
              background:
                "radial-gradient(circle,rgba(45,212,191,0.08),transparent 70%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              pointerEvents: "none",
            }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg,transparent,rgba(45,212,191,0.06),transparent)",
                animation: "headerShine 4s ease-in-out infinite",
              }}
            />
          </div>

          {/* Left */}
          <div style={{ position: "relative", zIndex: 2 }}>
            <p
              className="mono"
              style={{
                fontSize: 9.5,
                color: "rgba(45,212,191,0.7)",
                textTransform: "uppercase",
                letterSpacing: "0.20em",
                marginBottom: 4,
                fontWeight: 600,
              }}>
              Mission Control
            </p>
            <h1
              style={{
                fontSize: "clamp(1.5rem,2.6vw,2rem)",
                fontWeight: 800,
                color: "#0B1E33",
                margin: 0,
                lineHeight: 1.15,
              }}>
              Your <span style={{ color: "#2DD4BF" }}>Roadmap.</span>
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "#94a3b8",
                marginTop: 5,
                fontWeight: 500,
              }}>
              <span style={{ color: "#2DD4BF", fontWeight: 700 }}>
                {unlockedCount} levels
              </span>{" "}
              unlocked ·{" "}
              <span style={{ color: "#8b5cf6", fontWeight: 700 }}>
                {totalXp} XP
              </span>{" "}
              earned overall
            </p>
          </div>

          {/* Right: stat badges */}
          <div
            className="lv-hdr-right"
            style={{
              display: "flex",
              gap: 12,
              position: "relative",
              zIndex: 2,
            }}>
            {/* Clock */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(45,212,191,0.07)",
                border: "1px solid rgba(45,212,191,0.18)",
                borderRadius: 14,
                padding: "10px 16px",
              }}>
              <Cpu size={16} color="#2DD4BF" />
              <div>
                <div
                  className="mono"
                  style={{
                    fontSize: 9,
                    color: "#2DD4BF",
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                  }}>
                  System
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#0B1E33",
                    lineHeight: 1,
                  }}>
                  {clock}
                </div>
              </div>
            </div>

            {/* Total XP */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(245,158,11,0.07)",
                border: "1px solid rgba(245,158,11,0.18)",
                borderRadius: 14,
                padding: "10px 16px",
              }}>
              <span style={{ fontSize: 17 }}>🔥</span>
              <div>
                <div
                  className="mono"
                  style={{
                    fontSize: 9,
                    color: "#f59e0b",
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                  }}>
                  Total XP
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#0B1E33",
                    lineHeight: 1,
                  }}>
                  <AnimNum to={totalXp} delay={300} />
                </div>
              </div>
            </div>

            {/* Trophy */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(99,102,241,0.07)",
                border: "1px solid rgba(99,102,241,0.18)",
                borderRadius: 14,
                padding: "10px 16px",
              }}>
              <Trophy size={16} color="#6366f1" />
              <div>
                <div
                  className="mono"
                  style={{
                    fontSize: 9,
                    color: "#6366f1",
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                  }}>
                  Levels
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#0B1E33",
                    lineHeight: 1,
                  }}>
                  {unlockedCount} / {BASE_LEVELS.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            MAIN GRID
        ════════════════════════════════════════════════════════ */}
        <div className="lv-main-grid">
          {/* ── LEFT COLUMN ────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
           {/* ── HERO: ASSIGNED SESSION ────────────────────────── */}
            <div
              style={{
                animation: "cardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.08s both",
                background: "#0B1E33",
                borderRadius: 24,
                overflow: "hidden",
                boxShadow: "0 16px 60px rgba(11,30,51,0.22), 0 0 0 1px rgba(45,212,191,0.08)",
                position: "relative",
              }}>
              {/* Grid overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  backgroundImage: "linear-gradient(rgba(45,212,191,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(45,212,191,0.04) 1px,transparent 1px)",
                  backgroundSize: "36px 36px",
                }}
              />
              {/* Scanline */}
              <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: "14%",
                    background: "linear-gradient(to bottom,transparent,rgba(45,212,191,0.06),transparent)",
                    animation: "scanLine 5s linear infinite",
                  }}
                />
              </div>
              {/* Diagonal accent lines */}
              <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", overflow: "hidden", pointerEvents: "none" }}>
                {[ { r: "-25deg", o: "10%" }, { r: "-42deg", o: "28%" } ].map((a, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute", top: "-20%", right: a.o, width: 1, height: "160%",
                      background: `linear-gradient(to bottom,transparent,rgba(45,212,191,${0.09 - i * 0.04}),transparent)`,
                      transform: `rotate(${a.r})`,
                    }}
                  />
                ))}
              </div>

              <div style={{ position: "relative", zIndex: 2, padding: "28px 28px 24px" }}>
                {/* Top badge + duration */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 99, padding: "6px 16px" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#2DD4BF", boxShadow: "0 0 6px #2DD4BF", animation: "dotBlink 2s ease-in-out infinite" }} />
                    <span className="mono" style={{ fontSize: 9.5, color: "rgba(255,255,255,0.80)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em" }}>
                      Today's Assignment
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.35)" }}>
                    <Clock size={13} />
                    <span className="mono" style={{ fontSize: 11, fontWeight: 500 }}>
                      {assignedDuration}
                    </span>
                  </div>
                </div>

                {/* Main content */}
                <div className="lv-hero-inner" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 28 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 16 }}>
                      <h2 style={{ fontSize: "clamp(1.8rem,3.2vw,2.6rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>
                        {assignedTitle}
                        <span style={{ color: "#2DD4BF" }}> Protocol</span>
                      </h2>
                      <div className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.30)", textTransform: "uppercase", letterSpacing: "0.20em", marginTop: 8 }}>
                        Level {String(assignedLevelId).padStart(2, "0")} · {targetHandFormatted} · {activeProtocol?.settings?.difficulty || "Medium"}
                      </div>
                    </div>

                    {/* Doctor note */}
                    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 16px", marginBottom: 18, display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <Stethoscope size={14} color="#2DD4BF" style={{ flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.60)", lineHeight: 1.65, margin: 0 }}>
                        <span style={{ color: "#2DD4BF", fontWeight: 700 }}>Dr. Note: </span>
                        {activeProtocol?.doctorNote || "Follow the standard protocol instructions and maintain steady movements during the session."}
                      </p>
                    </div>

                    {/* Stat badges */}
                    <div className="lv-hero-badges" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {[
                        { icon: <Activity size={12} />, label: "Focus", val: assignedLevelData.tags[0] || "Motor", c: "#fbbf24" },
                        { icon: <Brain size={12} />, label: "Type", val: assignedLevelData.category, c: "#a78bfa" },
                        { icon: <Zap size={12} />, label: "XP", val: `+${assignedLevelData.xp}`, c: "#2DD4BF" },
                      ].map((s) => (
                        <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "7px 12px" }}>
                          <span style={{ color: s.c }}>{s.icon}</span>
                          <span className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.12em" }}>{s.label}:</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.80)" }}>{s.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="lv-hero-cta" style={{ flexShrink: 0 }}>
                    <button
                      onClick={() => router.push(assignedPath)}
                      className="lv-cta-btn"
                      style={{ background: "linear-gradient(135deg,#2DD4BF,#0891b2)", color: "#0B1E33", padding: "16px 32px", width: "auto", borderRadius: 18, fontSize: 15, fontWeight: 800, letterSpacing: "0.04em", boxShadow: "0 0 40px rgba(45,212,191,0.38)" }}>
                      <Play size={20} fill="#0B1E33" style={{ position: "relative", zIndex: 2 }} />
                      <span style={{ position: "relative", zIndex: 2 }}>START</span>
                    </button>
                    <div className="mono" style={{ textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.18em", marginTop: 8 }}>
                      Mandatory Session
                    </div>
                  </div>
                </div>

                {/* Session progress - Fixed to 0% for an unstarted session */}
                <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.16em" }}>Session Progress</span>
                    <span className="mono" style={{ fontSize: 9, color: "#2DD4BF", fontWeight: 700 }}>0%</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "0%", borderRadius: 99, background: "linear-gradient(90deg,rgba(45,212,191,0.7),#2DD4BF)", boxShadow: "0 0 12px rgba(45,212,191,0.5)" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── DOCTOR'S PROTOCOL SETTINGS ──────────────────────── */}
            <div
              style={{
                animation:
                  "cardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.12s both",
                background: "#fff",
                borderRadius: 22,
                border: "1px solid rgba(226,232,240,0.9)",
                boxShadow: "0 2px 18px rgba(11,30,51,0.055)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: "rgba(45,212,191,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#2DD4BF",
                  }}>
                  <Stethoscope size={16} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#0B1E33",
                      margin: 0,
                    }}>
                    Clinical Parameters
                  </h3>
                  <p
                    className="mono"
                    style={{
                      fontSize: 9,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      marginTop: 2,
                      fontWeight: 700,
                    }}>
                    Strict hardware settings by your neurologist
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}>
                {/* Target Hand */}
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: 14,
                    padding: "12px 16px",
                    border: "1px solid rgba(226,232,240,0.6)",
                  }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: 8.5,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}>
                    Target Hand
                  </span>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#0B1E33",
                      marginTop: 4,
                    }}>
                    {activeProtocol?.targetHand
                      ? activeProtocol.targetHand.toUpperCase()
                      : "RIGHT"}
                  </div>
                </div>

                {/* Hardware Focus */}
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: 14,
                    padding: "12px 16px",
                    border: "1px solid rgba(226,232,240,0.6)",
                  }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: 8.5,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}>
                    Hardware Focus
                  </span>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#0B1E33",
                      marginTop: 4,
                    }}>
                    {activeProtocol?.hardwareFocus === "mpx_pressure"
                      ? "MPX SENSOR"
                      : "IMU MOTION"}
                  </div>
                </div>

                {/* Visual Guides Toggle */}
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: 14,
                    padding: "12px 16px",
                    border: "1px solid rgba(226,232,240,0.6)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: 8.5,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}>
                    Visual Guides
                  </span>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: activeProtocol?.settings?.visualGuides
                          ? "#2DD4BF"
                          : "#94a3b8",
                      }}>
                      {activeProtocol?.settings?.visualGuides ? "ON" : "OFF"}
                    </span>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: activeProtocol?.settings?.visualGuides
                          ? "#2DD4BF"
                          : "#cbd5e1",
                        boxShadow: activeProtocol?.settings?.visualGuides
                          ? "0 0 6px rgba(45,212,191,0.6)"
                          : "none",
                      }}
                    />
                  </div>
                </div>

                {/* Audio Hints Toggle */}
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: 14,
                    padding: "12px 16px",
                    border: "1px solid rgba(226,232,240,0.6)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: 8.5,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}>
                    Audio Hints
                  </span>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: activeProtocol?.settings?.audioHints
                          ? "#8b5cf6"
                          : "#94a3b8",
                      }}>
                      {activeProtocol?.settings?.audioHints ? "ON" : "OFF"}
                    </span>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: activeProtocol?.settings?.audioHints
                          ? "#8b5cf6"
                          : "#cbd5e1",
                        boxShadow: activeProtocol?.settings?.audioHints
                          ? "0 0 6px rgba(139,92,246,0.6)"
                          : "none",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── LIBRARY HEADER + FILTERS ─────────────────────── */}
            <div
              style={{
                animation:
                  "cardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.16s both",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 14,
              }}>
              <div>
                <h3
                  style={{
                    fontSize: 17,
                    fontWeight: 800,
                    color: "#0B1E33",
                    margin: 0,
                  }}>
                  Module Library
                </h3>
                <p
                  className="mono"
                  style={{
                    fontSize: 9.5,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                    marginTop: 4,
                    fontWeight: 700,
                  }}>
                  Replay unlocked levels · Accumulate XP
                </p>
              </div>
              <div
                className="lv-filter-strip"
                style={{
                  background: "rgba(255,255,255,0.85)",
                  border: "1px solid rgba(226,232,240,0.8)",
                  borderRadius: 16,
                  padding: "4px",
                  boxShadow: "0 2px 12px rgba(11,30,51,0.06)",
                }}>
                {(["ALL", "MOTOR", "COGNITIVE", "STRENGTH"] as Category[]).map(
                  (cat) => (
                    <FilterTab
                      key={cat}
                      label={cat}
                      active={activeCategory === cat}
                      onClick={() => setActiveCategory(cat)}
                    />
                  ),
                )}
              </div>
            </div>

            {/* ── LEVEL CARDS GRID ──────────────────────────────── */}
            <div
              className="lv-cards-grid"
              style={{
                animation:
                  "cardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.22s both",
              }}>
              {filteredLevels.map((level) => (
                <LevelCard
                  key={level.id}
                  level={level}
                  onClick={() => !level.locked && router.push(level.path)}
                />
              ))}
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ──────────────────────────────────── */}
          <div
            className="lv-sidebar"
            style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Neural Network Visualiser */}
            <div
              className="lv-card"
              style={{
                animation:
                  "cardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.10s both",
                overflow: "hidden",
              }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 20px 8px",
                }}>
                <div>
                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#0B1E33",
                      margin: 0,
                    }}>
                    Progression Map
                  </h3>
                  <p
                    className="mono"
                    style={{
                      fontSize: 8.5,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      marginTop: 3,
                      fontWeight: 700,
                    }}>
                    Neural pathway visualiser
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(45,212,191,0.08)",
                    border: "1px solid rgba(45,212,191,0.18)",
                    borderRadius: 10,
                    padding: "5px 10px",
                  }}>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#2DD4BF",
                      animation: "dotBlink 2s ease-in-out infinite",
                    }}
                  />
                  <span
                    className="mono"
                    style={{
                      fontSize: 9,
                      color: "#2DD4BF",
                      fontWeight: 700,
                      letterSpacing: "0.10em",
                    }}>
                    LIVE
                  </span>
                </div>
              </div>
              <div style={{ height: 200 }}>
                <NeuralNetworkCanvas levels={dynamicLevels} />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 20,
                  padding: "6px 20px 16px",
                  borderTop: "1px solid rgba(226,232,240,0.6)",
                  flexWrap: "wrap",
                }}>
                {[
                  { c: "#2DD4BF", l: "Unlocked" },
                  { c: "#94a3b8", l: "Locked" },
                ].map((item) => (
                  <div
                    key={item.l}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: item.c,
                      }}
                    />
                    <span
                      className="mono"
                      style={{
                        fontSize: 8.5,
                        color: "#94a3b8",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.10em",
                      }}>
                      {item.l}
                    </span>
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 16,
                      height: 2.5,
                      background: "#2DD4BF",
                      borderRadius: 99,
                    }}
                  />
                  <span
                    className="mono"
                    style={{
                      fontSize: 8.5,
                      color: "#94a3b8",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.10em",
                    }}>
                    Signal
                  </span>
                </div>
              </div>
            </div>

            {/* AI Clinical Insight */}
            <div
              className="lv-card"
              style={{
                animation:
                  "cardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.20s both",
                background: "linear-gradient(135deg,#f8f7ff 0%,#f0f0ff 100%)",
                border: "1.5px solid rgba(99,102,241,0.18)",
                boxShadow: "0 4px 20px rgba(99,102,241,0.08)",
                padding: "22px",
                position: "relative",
                overflow: "hidden",
              }}>
              <div
                style={{
                  position: "absolute",
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  background:
                    "radial-gradient(circle,rgba(99,102,241,0.10),transparent 70%)",
                }}
              />
              <div style={{ position: "relative", zIndex: 2 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 14,
                  }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 11,
                      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 16px rgba(99,102,241,0.30)",
                    }}>
                    <Sparkles size={17} color="#fff" />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#0B1E33",
                        margin: 0,
                      }}>
                      Clinical Insight
                    </h3>
                    <div
                      className="mono"
                      style={{
                        fontSize: 8.5,
                        color: "rgba(99,102,241,0.7)",
                        textTransform: "uppercase",
                        letterSpacing: "0.14em",
                        marginTop: 2,
                        fontWeight: 600,
                      }}>
                      AI Generated
                    </div>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: 12.5,
                    color: "#475569",
                    lineHeight: 1.7,
                    marginBottom: 14,
                  }}>
                  Your{" "}
                  <span style={{ color: "#6366f1", fontWeight: 700 }}>
                    grip consistency
                  </span>{" "}
                  improved 12% since last week. You are ready
                  to push the boundaries on the next level — complete
                  one more session to unlock further milestones.
                </p>
                <button
                  onClick={() => router.push("/patients/progress")}
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: 13,
                    background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.20)",
                    color: "#6366f1",
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.10em",
                    textTransform: "uppercase",
                    transition: "all 0.2s ease",
                  }}>
                  View Full Analysis
                </button>
              </div>
            </div>

            {/* Clinical Metrics — dark card */}
            <div
              style={{
                animation:
                  "cardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.30s both",
                background: "#0B1E33",
                borderRadius: 22,
                border: "1px solid rgba(45,212,191,0.10)",
                boxShadow: "0 8px 36px rgba(11,30,51,0.18)",
                padding: "22px",
                position: "relative",
                overflow: "hidden",
              }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  overflow: "hidden",
                  pointerEvents: "none",
                }}>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: "20%",
                    background:
                      "linear-gradient(to bottom,transparent,rgba(45,212,191,0.05),transparent)",
                    animation: "scanLine 4s linear infinite",
                  }}
                />
              </div>
              <div style={{ position: "relative", zIndex: 2 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                  }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <BarChart3 size={15} color="#2DD4BF" />
                    <span
                      style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>
                      Clinical Metrics
                    </span>
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 8.5,
                      color: "#2DD4BF",
                      fontWeight: 700,
                      letterSpacing: "0.10em",
                      textTransform: "uppercase",
                      background: "rgba(45,212,191,0.12)",
                      border: "1px solid rgba(45,212,191,0.22)",
                      borderRadius: 8,
                      padding: "4px 10px",
                    }}>
                    This Week
                  </div>
                </div>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    {
                      label: "Grip Accuracy",
                      val: clinicalStats.accuracy,
                      color: "#2DD4BF",
                      icon: <Activity size={12} />,
                    },
                    {
                      label: "Reaction Speed",
                      val: 71,
                      color: "#a78bfa",
                      icon: <Zap size={12} />,
                    },
                    {
                      label: "Session Streak",
                      val: clinicalStats.streak,
                      color: "#fbbf24",
                      icon: <Star size={12} />,
                    },
                  ].map((m, i) => (
                    <div key={m.label}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 6,
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 11,
                            color: "rgba(255,255,255,0.50)",
                          }}>
                          <span style={{ color: m.color }}>{m.icon}</span>
                          {m.label}
                        </div>
                        <span
                          className="mono"
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: m.color,
                          }}>
                          {m.val}
                          {m.label === "Session Streak" ? "" : "%"}
                        </span>
                      </div>
                      <AnimBar
                        value={
                          m.label === "Session Streak"
                            ? Math.min(m.val * 10, 100)
                            : m.val
                        }
                        color={m.color}
                        delay={400 + i * 120}
                      />
                    </div>
                  ))}
                </div>

                {/* Next review */}
                <div
                  style={{
                    marginTop: 18,
                    paddingTop: 16,
                    borderTop: "1px solid rgba(255,255,255,0.07)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 11,
                      background: "rgba(45,212,191,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                    <Stethoscope size={14} color="#2DD4BF" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.75)",
                      }}>
                      Next Review
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: 9,
                        color: "rgba(255,255,255,0.30)",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        marginTop: 2,
                      }}>
                      Friday · Doctor · 09:00
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Locked Teaser */}
            {nextLockedLevel && (
              <div
                style={{
                  animation:
                    "cardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.38s both",
                  background: isDark ? "#0f172a" : "#fff",
                  borderRadius: 20,
                  padding: "22px",
                  border: isDark
                    ? "1.5px dashed rgba(139,92,246,0.4)"
                    : "1.5px dashed rgba(139,92,246,0.25)",
                  textAlign: "center",
                  boxShadow: isDark
                    ? "0 8px 28px rgba(2,6,23,0.4)"
                    : "0 2px 14px rgba(139,92,246,0.06)",
                }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "rgba(139,92,246,0.08)",
                    border: "1px solid rgba(139,92,246,0.16)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}>
                  <Lock size={18} color="#8b5cf6" />
                </div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: isDark ? "#e2e8f0" : "#0B1E33",
                    margin: "0 0 6px",
                  }}>
                  {nextLockedLevel.title} unlocks soon
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: isDark ? "#94a3b8" : "#94a3b8",
                    margin: "0 0 14px",
                  }}>
                  Complete 1 more session
                </p>
                <div
                  style={{
                    height: 6,
                    background: "rgba(139,92,246,0.10)",
                    borderRadius: 99,
                    overflow: "hidden",
                    marginBottom: 8,
                  }}>
                  <div
                    style={{
                      height: "100%",
                      width: "80%",
                      borderRadius: 99,
                      background: "linear-gradient(90deg,#c4b5fd,#8b5cf6)",
                      boxShadow: "0 0 8px rgba(139,92,246,0.4)",
                    }}
                  />
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: 9,
                    color: "#8b5cf6",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                  }}>
                  4 / 5 sessions
                </span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}