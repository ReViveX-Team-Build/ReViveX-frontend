"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Gamepad2, Zap, Settings2, Brain, Save, Play, Send, Activity,
  BookOpen, Users, ChevronDown, Check, ArrowLeft, Search, Bot,
  Shield, ClipboardList, User, CheckCircle2, AlertCircle, ChevronRight,
} from "lucide-react";
import { useDarkMode } from "@/app/lib/hooks/useDarkMode";
import { auth, db } from "../../../lib/firebase";
import { type User as FirebaseUser } from "firebase/auth";
import {
  collection, query, where, getDocs, addDoc, setDoc, doc, Timestamp, orderBy,
} from "firebase/firestore";
import { getPatientsByDoctor } from "../../../lib/db/users";
import { getCohortSessionsThisWeek, getLastSessionPerPatient } from "../../../lib/db/sessions";
import type { PatientData, TherapyProtocol, GameId } from "../../../lib/db/types";

/* ─── Display shape ─────────────────────────────────── */
interface DisplayPatient {
  id: string;
  name: string;
  pid: string;
  condition: string;
  status: "High" | "Medium" | "Low";
  sub: string;
  adherence: number;
  hasProtocol: boolean;
}

interface SavedProtocolTemplate {
  name: string;
  game: string;
  patientCount: number;
  protocolId: string;
}

/* ─── Game definitions ───────────────────────────────── */
const GAMES = [
  {
    value: "synapse_racer" as GameId,
    label: "Synapse Racer",
    tag: "Motor Focus",
    emoji: "🚀",
    benefit: "Patients control altitude by squeezing the BP Bulb. Promotes grip strength modulation, impulse control, and sustained motor output. Ideal for stroke and Parkinson's patients working on hand function recovery.",
  },
  {
    value: "rhythm_reef" as GameId,
    label: "Rhythm Reef",
    tag: "Timing & Coordination",
    emoji: "🎵",
    benefit: "Match squeeze cadence to oncoming patterns. Trains rhythmic grip timing and finger-hand synchronisation. Suitable for stroke and neurological coordination disorders.",
  },
  {
    value: "grip_surge" as GameId,
    label: "Grip Surge",
    tag: "Cognitive Dual-Task",
    emoji: "🧠",
    benefit: "Navigate obstacles while memorising colour sequences. Combines fine motor control with working memory training. Designed for TBI and post-surgical cognitive rehabilitation.",
  },
];

const DIFFICULTY_LABELS = ["Easy", "Medium", "Hard", "Expert"];
const DIFFICULTY_COLORS = ["#22c55e", "#f59e0b", "#f97316", "#ef4444"];
const DIFFICULTY_MAP: Record<number, "easy"|"medium"|"hard"|"expert"> = {
  0:"easy", 1:"medium", 2:"hard", 3:"expert"
};

/* ─── Helpers ────────────────────────────────────────── */
function statusColor(s: string) {
  return s === "High" ? "#22c55e" : s === "Medium" ? "#f59e0b" : "#ef4444";
}
function adherenceColor(v: number) {
  return v >= 80 ? "#22c55e" : v >= 55 ? "#f97316" : "#ef4444";
}
function getStatus(a: number): "High"|"Medium"|"Low" {
  return a >= 80 ? "High" : a >= 55 ? "Medium" : "Low";
}
function initials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("");
}

/* ═══════════════════════════════════════════════════════════
   CSS (unchanged from original)
═══════════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  .tp * { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; box-sizing: border-box; }
  .tp .mono { font-family: 'JetBrains Mono', monospace; }
  @keyframes tpFadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes tpCardPop { 0%{opacity:0;transform:translateY(14px) scale(0.975)} 100%{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes tpShimmer { 0%{transform:translateX(-200%) skewX(-15deg)} 100%{transform:translateX(400%) skewX(-15deg)} }
  @keyframes tpBarShimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }
  @keyframes tpGlow { 0%,100%{box-shadow:0 0 0 0 rgba(45,212,191,0.40)} 50%{box-shadow:0 0 0 10px rgba(45,212,191,0)} }
  @keyframes tpScanLine { 0%{top:-4%;opacity:0} 6%{opacity:1} 92%{opacity:0.5} 100%{top:108%;opacity:0} }
  @keyframes tpDot { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes tpSensorFlash { 0%,100%{color:#2DD4BF} 50%{color:#67e8f9} }
  @keyframes tpProtocolIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes tpSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes tpSavedPop { 0%{opacity:0;transform:scale(0.80) translateY(8px)} 70%{transform:scale(1.06)} 100%{opacity:1;transform:scale(1) translateY(0)} }
  .tp-patient-btn { width:100%;text-align:left;background:none;border:none;padding:10px 12px;border-radius:14px;cursor:pointer;transition:all 0.2s ease;display:flex;align-items:center;gap:10px; }
  .tp-patient-btn:hover { background:rgba(99,102,241,0.07); }
  .tp-patient-btn.active { background:linear-gradient(135deg,rgba(99,102,241,0.13),rgba(79,70,229,0.08));border:1.5px solid rgba(99,102,241,0.28); }
  .tp-card { background:#fff;border-radius:18px;border:1px solid rgba(226,232,240,0.9);box-shadow:0 2px 20px rgba(11,30,51,0.06);padding:24px;transition:box-shadow 0.28s ease; }
  .tp-card:hover { box-shadow:0 8px 40px rgba(11,30,51,0.10); }
  .tp-section-title { display:flex;align-items:center;gap:10px;font-size:15px;font-weight:800;color:#0B1E33;margin-bottom:18px; }
  .tp-section-title .icon-wrap { width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:rgba(45,212,191,0.10);color:#2DD4BF;flex-shrink:0; }
  .tp-game-card { padding:14px 16px;border-radius:14px;border:1.5px solid #e2e8f0;cursor:pointer;transition:all 0.2s ease;display:flex;align-items:center;gap:13px;font-family:'Plus Jakarta Sans',sans-serif; }
  .tp-game-card:hover { border-color:rgba(99,102,241,0.35);background:rgba(99,102,241,0.04); }
  .tp-game-card.active { border-color:rgba(99,102,241,0.50);background:rgba(99,102,241,0.06);box-shadow:0 0 0 3px rgba(99,102,241,0.10); }
  .tp-benefit { background:rgba(240,253,250,1);border:1px solid rgba(45,212,191,0.22);border-radius:12px;padding:14px 16px;margin-top:14px; }
  .tp-benefit-label { font-size:12.5px;font-weight:700;color:#0f766e;margin-bottom:5px; }
  .tp-benefit-text { font-size:12px;color:#475569;line-height:1.72; }
  .tp-pill { display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:99px;font-size:12.5px;font-weight:700;cursor:pointer;border:1.5px solid transparent;transition:all 0.2s ease;font-family:'Plus Jakarta Sans',sans-serif; }
  .tp-pill.active { background:rgba(45,212,191,0.10);border-color:rgba(45,212,191,0.40);color:#0f766e; }
  .tp-pill.inactive { background:#f8fafc;border-color:#e2e8f0;color:#64748b; }
  .tp-pill.inactive:hover { border-color:rgba(45,212,191,0.30);color:#0f766e; }
  .tp-hand-btn { flex:1;padding:13px 10px;border-radius:12px;font-size:13.5px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.22s ease;border:1.5px solid #e2e8f0;font-family:'Plus Jakarta Sans',sans-serif; }
  .tp-hand-btn.active { border-color:#2DD4BF;color:#0f766e;background:rgba(45,212,191,0.07);box-shadow:0 0 0 3px rgba(45,212,191,0.12); }
  .tp-hand-btn.inactive { background:#fff;color:#475569; }
  .tp-hand-btn.inactive:hover { border-color:rgba(45,212,191,0.30); }
  .tp-slider { -webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:99px;outline:none;cursor:pointer; }
  .tp-slider.teal { background:linear-gradient(to right,#2DD4BF var(--val,45%),#e2e8f0 var(--val,45%)); }
  .tp-slider.purple { background:linear-gradient(to right,#8b5cf6 var(--val,50%),#e2e8f0 var(--val,50%)); }
  .tp-slider::-webkit-slider-thumb { -webkit-appearance:none;appearance:none;width:18px;height:18px;border-radius:50%;cursor:pointer;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.18);transition:transform 0.15s ease; }
  .tp-slider.teal::-webkit-slider-thumb { background:#2DD4BF; }
  .tp-slider.purple::-webkit-slider-thumb { background:#8b5cf6; }
  .tp-slider::-webkit-slider-thumb:hover { transform:scale(1.2); }
  .tp-toggle-wrap { display:flex;align-items:center;justify-content:space-between;padding:13px 15px;border-radius:13px;background:rgba(240,244,248,0.7);border:1px solid rgba(226,232,240,0.8);cursor:pointer;transition:all 0.2s ease; }
  .tp-toggle-wrap:hover { background:rgba(240,253,250,0.8);border-color:rgba(45,212,191,0.22); }
  .tp-toggle-track { width:46px;height:24px;border-radius:99px;position:relative;transition:background 0.25s ease;flex-shrink:0; }
  .tp-toggle-track.on { background:#2DD4BF; }
  .tp-toggle-track.off { background:#cbd5e1; }
  .tp-toggle-thumb { position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.20);transition:left 0.25s cubic-bezier(0.22,1,0.36,1); }
  .tp-toggle-track.on .tp-toggle-thumb { left:25px; }
  .tp-toggle-track.off .tp-toggle-thumb { left:3px; }
  .tp-dur-input { width:80px;padding:10px 12px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:14px;font-weight:700;color:#0B1E33;outline:none;text-align:center;transition:all 0.2s ease;font-family:'JetBrains Mono',monospace; }
  .tp-dur-input:focus { border-color:rgba(45,212,191,0.6);box-shadow:0 0 0 3px rgba(45,212,191,0.10); }
  .tp-btn-preview { flex:1;padding:12px;border-radius:13px;border:none;cursor:pointer;background:linear-gradient(135deg,#2DD4BF,#0891b2);color:#0B1E33;font-size:13.5px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 20px rgba(45,212,191,0.35);transition:all 0.22s ease;position:relative;overflow:hidden;font-family:'Plus Jakarta Sans',sans-serif; }
  .tp-btn-preview::after { content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);animation:tpShimmer 2.8s ease-in-out infinite; }
  .tp-btn-preview:hover { transform:translateY(-2px);box-shadow:0 8px 28px rgba(45,212,191,0.45); }
  .tp-btn-assign { flex:1;padding:12px;border-radius:13px;border:none;cursor:pointer;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;font-size:13.5px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 20px rgba(99,102,241,0.30);transition:all 0.22s ease;position:relative;overflow:hidden;font-family:'Plus Jakarta Sans',sans-serif; }
  .tp-btn-assign::after { content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.20),transparent);animation:tpShimmer 3s ease-in-out infinite 0.4s; }
  .tp-btn-assign:hover { transform:translateY(-2px);box-shadow:0 8px 28px rgba(99,102,241,0.40); }
  .tp-protocol-item { padding:14px 16px;border-radius:12px;border:1px solid rgba(226,232,240,0.8);transition:all 0.2s ease;cursor:pointer;animation:tpProtocolIn 0.4s cubic-bezier(0.22,1,0.36,1) both; }
  .tp-protocol-item:hover { border-color:rgba(45,212,191,0.35);background:rgba(240,253,250,0.6);transform:translateX(3px); }
  .tp-sidebar-scroll::-webkit-scrollbar { width:3px; }
  .tp-sidebar-scroll::-webkit-scrollbar-thumb { background:rgba(99,102,241,0.22);border-radius:99px; }
  .tp-saved-badge { display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:12px;background:rgba(34,197,94,0.10);border:1px solid rgba(34,197,94,0.28);color:#15803d;font-size:13px;font-weight:800;animation:tpSavedPop 0.4s cubic-bezier(0.22,1,0.36,1) both;font-family:'Plus Jakarta Sans',sans-serif; }
  .tp-outer-layout { display:flex;gap:18px;align-items:flex-start; }
  .tp-main-grid { display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;flex:1;min-width:0; }
  @media (max-width:1200px) { .tp-main-grid { grid-template-columns:1fr; } }
  @media (max-width:900px) { .tp-sidebar-wrap { display:none !important; } }
  @media (max-width:600px) { .tp .tp-outer { padding:16px 14px !important; } .tp-btn-row { flex-direction:column !important; } }
  .dark .tp-card { background:#1e293b;border-color:rgba(51,65,85,0.9);box-shadow:0 2px 20px rgba(0,0,0,0.20); }
  .dark .tp-section-title { color:#f1f5f9; }
  .dark .tp-game-card { border-color:#334155; }
  .dark .tp-game-card:hover { border-color:rgba(99,102,241,0.40);background:rgba(99,102,241,0.10); }
  .dark .tp-game-card.active { border-color:rgba(99,102,241,0.55);background:rgba(99,102,241,0.12);box-shadow:0 0 0 3px rgba(99,102,241,0.14); }
  .dark .tp-benefit { background:rgba(15,118,110,0.14);border-color:rgba(45,212,191,0.22); }
  .dark .tp-benefit-label { color:#2DD4BF; }
  .dark .tp-benefit-text { color:#94a3b8; }
  .dark .tp-pill.inactive { background:#334155;border-color:#475569;color:#94a3b8; }
  .dark .tp-hand-btn.inactive { background:#1e293b;color:#94a3b8;border-color:#334155; }
  .dark .tp-toggle-wrap { background:rgba(30,41,59,0.90);border-color:rgba(51,65,85,0.8); }
  .dark .tp-slider.teal { background:linear-gradient(to right,#2DD4BF var(--val,45%),#334155 var(--val,45%)); }
  .dark .tp-slider.purple { background:linear-gradient(to right,#8b5cf6 var(--val,50%),#334155 var(--val,50%)); }
  .dark .tp-slider::-webkit-slider-thumb { border-color:#1e293b; }
  .dark .tp-dur-input { background:#334155;border-color:#475569;color:#f1f5f9; }
  .dark .tp-protocol-item { border-color:#334155; }
  .dark .tp-patient-btn:hover { background:rgba(99,102,241,0.12); }
  .dark .tp-patient-btn.active { background:linear-gradient(135deg,rgba(99,102,241,0.20),rgba(79,70,229,0.14));border-color:rgba(99,102,241,0.40); }
`;

/* ═══════════════════════════════════════════════════════════
   GAME CANVAS (unchanged)
═══════════════════════════════════════════════════════════ */
interface Pipe { x: number; gapY: number; scored: boolean; }

const GameCanvas: React.FC<{ pressure: number; hand: string }> = ({ pressure, hand }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gRef = useRef({
    ctx: null as CanvasRenderingContext2D | null,
    rafId: 0, paused: false, dpr: 1, W: 0, H: 0,
    skyGrad: null as CanvasGradient | null, gridImg: null as HTMLCanvasElement | null,
    pipes: [{ x: 340, gapY: 120, scored: false }, { x: 560, gapY: 90, scored: false }] as Pipe[],
    ballY: 140, score: 42, t: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const g = gRef.current;
    g.ctx = canvas.getContext("2d", { alpha: false });
    if (!g.ctx) return;
    g.dpr = Math.min(window.devicePixelRatio || 1, 2);

    const buildCache = () => {
      const ctx = g.ctx!;
      const rect = canvas.getBoundingClientRect();
      g.W = rect.width; g.H = rect.height;
      canvas.width = g.W * g.dpr; canvas.height = g.H * g.dpr;
      const sky = ctx.createLinearGradient(0, 0, 0, g.H);
      sky.addColorStop(0, "#b8e4f9"); sky.addColorStop(1, "#ddf0fc");
      g.skyGrad = sky;
      const grid = document.createElement("canvas");
      grid.width = canvas.width; grid.height = canvas.height;
      const gc = grid.getContext("2d")!;
      gc.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      gc.strokeStyle = "rgba(255,255,255,0.30)"; gc.lineWidth = 0.5;
      gc.beginPath();
      for (let x = 0; x <= g.W; x += 36) { gc.moveTo(x, 0); gc.lineTo(x, g.H); }
      for (let y = 0; y <= g.H; y += 36) { gc.moveTo(0, y); gc.lineTo(g.W, y); }
      gc.stroke(); g.gridImg = grid;
    };
    buildCache();
    const ro = new ResizeObserver(() => buildCache()); ro.observe(canvas);
    const onVis = () => { g.paused = document.hidden; };
    document.addEventListener("visibilitychange", onVis);

    const PIPE_W = 52, GAP = 110, PIPE_SPD = 1.1;
    const draw = () => {
      g.rafId = requestAnimationFrame(draw);
      if (g.paused || !g.ctx) return;
      const ctx = g.ctx; const { W, H, dpr } = g;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); g.t += 0.018;
      ctx.fillStyle = g.skyGrad!; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(g.gridImg!, 0, 0, W, H);
      ctx.setLineDash([8, 5]); ctx.strokeStyle = "rgba(45,212,191,0.55)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke(); ctx.setLineDash([]);
      for (const pipe of g.pipes) {
        pipe.x -= PIPE_SPD;
        if (pipe.x < -PIPE_W) { pipe.x = W + 20; pipe.gapY = 70 + Math.random() * (H - 160); pipe.scored = false; }
        if (!pipe.scored && pipe.x < 80) { g.score++; pipe.scored = true; }
        const btmY = pipe.gapY + GAP;
        const pg = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_W, 0);
        pg.addColorStop(0, "#1a9a4a"); pg.addColorStop(0.4, "#22c55e"); pg.addColorStop(1, "#16a34a");
        ctx.fillStyle = pg;
        ctx.beginPath(); ctx.roundRect(pipe.x, 0, PIPE_W, pipe.gapY, [0, 0, 6, 6]); ctx.fill();
        ctx.beginPath(); ctx.roundRect(pipe.x, btmY, PIPE_W, H - btmY, [6, 6, 0, 0]); ctx.fill();
        ctx.fillStyle = "#15803d";
        ctx.beginPath(); ctx.roundRect(pipe.x - 4, pipe.gapY - 18, PIPE_W + 8, 18, [4, 4, 0, 0]); ctx.fill();
        ctx.beginPath(); ctx.roundRect(pipe.x - 4, btmY, PIPE_W + 8, 18, [0, 0, 4, 4]); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.10)";
        ctx.fillRect(pipe.x + 8, 0, 10, pipe.gapY); ctx.fillRect(pipe.x + 8, btmY, 10, H - btmY);
      }
      const ballX = W * 0.22; g.ballY = H / 2 + Math.sin(g.t * 1.3) * 55;
      const glowR = ctx.createRadialGradient(ballX, g.ballY, 0, ballX, g.ballY, 28);
      glowR.addColorStop(0, "rgba(251,146,60,0.45)"); glowR.addColorStop(1, "rgba(251,146,60,0)");
      ctx.fillStyle = glowR; ctx.beginPath(); ctx.arc(ballX, g.ballY, 28, 0, Math.PI * 2); ctx.fill();
      const ballG = ctx.createRadialGradient(ballX - 5, g.ballY - 5, 2, ballX, g.ballY, 18);
      ballG.addColorStop(0, "#fde68a"); ballG.addColorStop(0.5, "#fb923c"); ballG.addColorStop(1, "#ea580c");
      ctx.fillStyle = ballG; ctx.beginPath(); ctx.arc(ballX, g.ballY, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.32)"; ctx.beginPath();
      ctx.ellipse(ballX - 5, g.ballY - 7, 7, 5, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.font = 'bold 26px "Plus Jakarta Sans"';
      ctx.textAlign = "left"; ctx.fillText(String(g.score), 18, 36);
      ctx.fillStyle = "rgba(255,255,255,0.42)"; ctx.font = '10px "JetBrains Mono"';
      ctx.fillText("SCORE", 18, 52);
    };
    draw();
    return () => { cancelAnimationFrame(g.rafId); ro.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  return (
    <div style={{ position:"relative", borderRadius:12, overflow:"hidden", border:"1px solid rgba(226,232,240,0.8)" }}>
      <canvas ref={canvasRef} style={{ width:"100%", height:220, display:"block" }} />
      <div style={{ position:"absolute", top:12, right:12, background:"#0B1E33", borderRadius:10, padding:"10px 14px", border:"1px solid rgba(45,212,191,0.22)", boxShadow:"0 4px 20px rgba(11,30,51,0.40)", minWidth:148 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"#2DD4BF", boxShadow:"0 0 6px #2DD4BF", animation:"tpDot 2s ease-in-out infinite" }} />
          <span style={{ fontSize:10.5, fontWeight:800, color:"#fff" }}>Live Preview</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
          <Activity size={10} color="#2DD4BF" />
          <span className="mono" style={{ fontSize:10, color:"#2DD4BF", animation:"tpSensorFlash 2.2s ease-in-out infinite" }}>Pressure: {pressure}kPa</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <Zap size={10} color="#fbbf24" />
          <span className="mono" style={{ fontSize:10, color:"#fbbf24" }}>Hand: {hand}</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Toggle ─────────────────────────────────────────── */
function Toggle({ on, onChange, label, sub }: { on: boolean; onChange: () => void; label: string; sub: string }) {
  const isDark = useDarkMode();
  return (
    <div className="tp-toggle-wrap" onClick={onChange}>
      <div>
        <div style={{ fontSize:13, fontWeight:700, color:isDark?"#f1f5f9":"#0B1E33" }}>{label}</div>
        <div style={{ fontSize:11.5, color:isDark?"#94a3b8":"#64748b", marginTop:2 }}>{sub}</div>
      </div>
      <div className={`tp-toggle-track ${on?"on":"off"}`}><div className="tp-toggle-thumb"/></div>
    </div>
  );
}

/* ─── Mini Bar ───────────────────────────────────────── */
function MiniBar({ value, color }: { value: number; color: string }) {
  const isDark = useDarkMode();
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 250); return () => clearTimeout(t); }, [value]);
  return (
    <div style={{ width:42, height:4, background:isDark?"rgba(255,255,255,0.08)":"rgba(11,30,51,0.08)", borderRadius:99, overflow:"hidden", flexShrink:0 }}>
      <div style={{ height:"100%", borderRadius:99, width:`${w}%`, background:color, transition:"width 0.9s cubic-bezier(0.22,1,0.36,1)" }}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   INNER PAGE
═══════════════════════════════════════════════════════════ */
function TherapyProtocolsInner() {
  const searchParams = useSearchParams();
  const paramPatient = searchParams.get("patient");

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [patients, setPatients] = useState<DisplayPatient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [savedTemplates, setSavedTemplates] = useState<SavedProtocolTemplate[]>([]);
  const [selectedId, setSelectedId] = useState(paramPatient ?? "");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [game, setGame] = useState<GameId>("synapse_racer");
  const [inputSrc, setInputSrc] = useState<"bp" | "imu">("bp");
  const [hand, setHand] = useState<"left" | "right">("right");
  const [gripForce, setGripForce] = useState(45);
  const [tremor, setTremor] = useState(true);
  const [difficulty, setDifficulty] = useState(1);
  const [duration, setDuration] = useState(15);
  const [audioHints, setAudioHints] = useState(true);
  const [visualGuides, setVisualGuides] = useState(true);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(5);
  const [pressure, setPressure] = useState(45);
  const [savedState, setSavedState] = useState<"idle"|"saving"|"saved">("idle");
  const [protocolSet, setProtocolSet] = useState<Set<string>>(new Set());
  const isDark = useDarkMode();

  // Auth
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u: FirebaseUser | null) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (paramPatient) setSelectedId(paramPatient); }, [paramPatient]);

  // Pressure simulator
  useEffect(() => {
    if (!mounted) return;
    const iv = setInterval(() => {
      setPressure(p => Math.max(30, Math.min(75, p + (Math.random() - 0.5) * 6)));
    }, 1400);
    return () => clearInterval(iv);
  }, [mounted]);

  // Load patients + protocols
  useEffect(() => {
    if (!user) return;
    (async () => {
      setPatientsLoading(true);
      try {
        // Fetch patients assigned to this doctor
        const rawPatients = await getPatientsByDoctor(user.uid);
        if (!rawPatients.length) { setPatients([]); setPatientsLoading(false); return; }

        const uids = rawPatients.map(p => p.uid);

        // Fetch adherence data
        const [weekSessions, lastSessionMap] = await Promise.all([
          getCohortSessionsThisWeek(uids),
          getLastSessionPerPatient(uids),
        ]);

        // Fetch all protocols for this doctor
        const protSnap = await getDocs(
          query(collection(db, "protocols"), where("doctorId", "==", user.uid))
        );
        const protocolPatientIds = new Set<string>();
        const templateMap = new Map<string, number>();

        protSnap.docs.forEach(d => {
          const data = d.data() as TherapyProtocol;
          protocolPatientIds.add(data.patientId);
          // Count patients per game for templates
          const key = data.gameId;
          templateMap.set(key, (templateMap.get(key) ?? 0) + 1);
        });

        setProtocolSet(protocolPatientIds);

        // Build saved templates from real protocols
        const templates: SavedProtocolTemplate[] = [];
        const seen = new Set<string>();
        protSnap.docs.forEach(d => {
          const data = d.data() as TherapyProtocol;
          const gameName = GAMES.find(g => g.value === data.gameId)?.label ?? data.gameId;
          const key = `${data.gameId}-${data.settings.difficulty}`;
          if (!seen.has(key)) {
            seen.add(key);
            templates.push({
              name: `${gameName} — ${data.settings.difficulty.charAt(0).toUpperCase() + data.settings.difficulty.slice(1)}`,
              game: gameName,
              patientCount: templateMap.get(data.gameId) ?? 1,
              protocolId: d.id,
            });
          }
        });
        setSavedTemplates(templates.slice(0, 5));

        // Map to display patients
        const spwMap = new Map<string, number>();
        protSnap.docs.forEach(d => {
          const data = d.data() as TherapyProtocol;
          spwMap.set(data.patientId, data.sessionsPerWeek ?? 5);
        });

        const display: DisplayPatient[] = rawPatients.map(p => {
          const spw = spwMap.get(p.uid) ?? 5;
          const done = weekSessions.filter(s => s.userId === p.uid && s.durationSeconds > 60).length;
          const adherence = Math.min(100, Math.round((done / spw) * 100));
          return {
            id: p.uid,
            name: p.name,
            pid: (p as any).patientId ?? p.uid.slice(0, 7).toUpperCase(),
            condition: p.condition,
            status: getStatus(adherence),
            sub: p.subscriptionPlan === "ai_companion" ? "AI Companion" : "Standard",
            adherence,
            hasProtocol: protocolPatientIds.has(p.uid),
          };
        });
        setPatients(display);
      } catch (e) {
        console.error("Protocol page load error:", e);
      } finally {
        setPatientsLoading(false);
      }
    })();
  }, [user]);

  // Load existing protocol when patient selected
  useEffect(() => {
    if (!selectedId || !user) return;
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "protocols"), where("patientId", "==", selectedId), where("doctorId", "==", user.uid))
        );
        if (!snap.empty) {
          const existing = snap.docs
            .map(d => ({ id: d.id, ...d.data() } as TherapyProtocol))
            .sort((a, b) => b.assignedDate.seconds - a.assignedDate.seconds)[0];
          setGame(existing.gameId);
          setHand(existing.targetHand === "both" ? "right" : existing.targetHand);
          setInputSrc(existing.hardwareFocus === "mpx_pressure" ? "bp" : "imu");
          setGripForce(existing.settings.gripMvcPercent);
          setTremor(existing.settings.tremorFilter);
          setDifficulty(["easy","medium","hard","expert"].indexOf(existing.settings.difficulty));
          setAudioHints(existing.settings.audioHints);
          setVisualGuides(existing.settings.visualGuides);
          setSessionsPerWeek(existing.sessionsPerWeek);
        } else {
          // Reset to defaults for new patient
          setGame("synapse_racer"); setInputSrc("bp"); setHand("right");
          setGripForce(45); setDifficulty(1); setDuration(15);
          setTremor(true); setAudioHints(true); setVisualGuides(true); setSessionsPerWeek(5);
        }
      } catch (e) { console.error(e); }
    })();
    setSavedState("idle");
  }, [selectedId, user]);

  /* ── Assign protocol to Firestore ── */
  const handleAssign = async () => {
    if (!patient || !user) return;
    setSavedState("saving");
    try {
      const protocol: Omit<TherapyProtocol, "id"> = {
        doctorId: user.uid,
        patientId: patient.id,
        gameId: game,
        level: difficulty + 1,
        targetHand: hand,
        hardwareFocus: inputSrc === "bp" ? "mpx_pressure" : "mpu_motion",
        assignedDate: Timestamp.now(),
        sessionsPerWeek,
        settings: {
          difficulty: DIFFICULTY_MAP[difficulty],
          gripMvcPercent: gripForce,
          audioHints,
          visualGuides,
          tremorFilter: tremor,
        },
      };

      // Check if protocol already exists for this patient
      const existing = await getDocs(
        query(collection(db, "protocols"),
          where("patientId", "==", patient.id),
          where("doctorId", "==", user.uid))
      );

      if (!existing.empty) {
        // Update existing
        await setDoc(doc(db, "protocols", existing.docs[0].id), protocol);
      } else {
        await addDoc(collection(db, "protocols"), protocol);
      }

      setProtocolSet(prev => new Set([...prev, patient.id]));
      setPatients(prev => prev.map(p => p.id === patient.id ? { ...p, hasProtocol: true } : p));
      setSavedState("saved");
      setTimeout(() => setSavedState("idle"), 2500);
    } catch (e) {
      console.error("Assign protocol failed:", e);
      setSavedState("idle");
    }
  };

  if (!mounted) return null;

  /* ── Derived ── */
  const patient = patients.find(p => p.id === selectedId) ?? null;
  const selectedGame = GAMES.find(g => g.value === game) ?? GAMES[0];
  const diffLabel = DIFFICULTY_LABELS[Math.min(difficulty, 3)];
  const diffColor = DIFFICULTY_COLORS[Math.min(difficulty, 3)];
  const filteredSidebar = patients.filter(p =>
    p.name.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
    p.pid.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  /* ── No patient state ── */
  const NoPatientState = () => (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"52px 28px", textAlign:"center" }}>
      <div style={{ position:"relative", marginBottom:24 }}>
        <div style={{ width:88, height:88, borderRadius:24, background:"linear-gradient(135deg,rgba(99,102,241,0.12),rgba(79,70,229,0.06))", border:"2px solid rgba(99,102,241,0.18)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto" }}>
          <ClipboardList size={36} color="#6366f1" />
        </div>
        <div style={{ position:"absolute", top:-4, right:-4, width:28, height:28, borderRadius:"50%", background:"rgba(45,212,191,0.12)", border:"2px solid rgba(45,212,191,0.28)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <User size={13} color="#2DD4BF" />
        </div>
      </div>
      <h2 style={{ fontSize:22, fontWeight:800, color:isDark?"#f1f5f9":"#0B1E33", margin:"0 0 10px" }}>Select a Patient</h2>
      <p style={{ fontSize:14, color:isDark?"#94a3b8":"#64748b", margin:"0 0 28px", maxWidth:340, lineHeight:1.7 }}>
        Choose a patient from the list to configure their personalised therapy protocol.
      </p>
      {patientsLoading ? (
        <div style={{ display:"flex", alignItems:"center", gap:10, color:"#94a3b8", fontSize:13 }}>
          <div style={{ width:16, height:16, border:"2px solid rgba(45,212,191,0.3)", borderTopColor:"#2DD4BF", borderRadius:"50%", animation:"tpSpin 1s linear infinite" }}/>
          Loading patients…
        </div>
      ) : (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", maxWidth:480 }}>
          {patients.slice(0, 8).map(p => {
            const ac = adherenceColor(p.adherence);
            return (
              <button key={p.id} onClick={() => setSelectedId(p.id)}
                style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"8px 14px", borderRadius:12, background:isDark?"#1e293b":"#fff", border:`1.5px solid ${ac}30`, cursor:"pointer", transition:"all 0.2s ease", fontFamily:"'Plus Jakarta Sans',sans-serif" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ac; e.currentTarget.style.background = `${ac}0a`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${ac}30`; e.currentTarget.style.background = isDark?"#1e293b":"#fff"; }}>
                <div style={{ width:22, height:22, borderRadius:7, background:`${ac}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8.5, fontWeight:800, color:ac }}>
                  {initials(p.name)}
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:isDark?"#f1f5f9":"#0B1E33" }}>{p.name.split(" ")[0]}</span>
                {p.hasProtocol && <CheckCircle2 size={11} color="#22c55e" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  /* ── Protocol Builder ── */
  const ProtocolBuilder = () => (
    <div className="tp-main-grid">
      {/* LEFT */}
      <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
        {/* Game Selection */}
        <div className="tp-card" style={{ animation:"tpCardPop 0.50s cubic-bezier(0.22,1,0.36,1) 0.05s both" }}>
          <div className="tp-section-title"><span className="icon-wrap"><Gamepad2 size={15}/></span>Game Selection</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {GAMES.map(g => (
              <button key={g.value} className={`tp-game-card ${game === g.value ? "active" : ""}`} onClick={() => setGame(g.value)}>
                <div style={{ width:40, height:40, borderRadius:12, flexShrink:0, background:game===g.value?"rgba(99,102,241,0.10)":isDark?"#334155":"#f1f5f9", border:game===g.value?"1.5px solid rgba(99,102,241,0.30)":isDark?"1.5px solid #475569":"1.5px solid #e2e8f0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{g.emoji}</div>
                <div style={{ flex:1, textAlign:"left" }}>
                  <div style={{ fontSize:13.5, fontWeight:700, color:isDark?"#f1f5f9":"#0B1E33" }}>{g.label}</div>
                  <div className="mono" style={{ fontSize:9, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.12em", marginTop:2 }}>{g.tag}</div>
                </div>
                {game === g.value && <div style={{ width:20, height:20, borderRadius:"50%", background:"#6366f1", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Check size={11} color="#fff" strokeWidth={3}/></div>}
              </button>
            ))}
          </div>
          <div className="tp-benefit" style={{ marginTop:16 }}>
            <div className="tp-benefit-label">Medical Benefit:</div>
            <div className="tp-benefit-text">{selectedGame.benefit}</div>
          </div>
        </div>

        {/* Hardware Calibration */}
        <div className="tp-card" style={{ animation:"tpCardPop 0.50s cubic-bezier(0.22,1,0.36,1) 0.12s both" }}>
          <div className="tp-section-title"><span className="icon-wrap"><Settings2 size={15}/></span>Hardware Calibration</div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12.5, fontWeight:600, color:isDark?"#94a3b8":"#475569", marginBottom:10 }}>Input Source</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <button className={`tp-pill ${inputSrc==="bp"?"active":"inactive"}`} onClick={() => setInputSrc("bp")}><Activity size={12}/> BP Bulb Pressure</button>
              <button className={`tp-pill ${inputSrc==="imu"?"active":"inactive"}`} onClick={() => setInputSrc("imu")}><Zap size={12}/> IMU Motion</button>
            </div>
          </div>
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:12.5, fontWeight:600, color:isDark?"#94a3b8":"#475569", marginBottom:10 }}>Target Hand</div>
            <div style={{ display:"flex", gap:10 }}>
              <button className={`tp-hand-btn ${hand==="left"?"active":"inactive"}`} onClick={() => setHand("left")}><span style={{ fontSize:17 }}>🤚</span> Left Hand</button>
              <button className={`tp-hand-btn ${hand==="right"?"active":"inactive"}`} onClick={() => setHand("right")}><span style={{ fontSize:17 }}>✋</span> Right Hand</button>
            </div>
          </div>
          <div style={{ marginBottom:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:700, color:isDark?"#f1f5f9":"#0B1E33" }}>Grip Force Sensitivity (MVC)</div>
              <span className="mono" style={{ fontSize:14, fontWeight:800, color:"#2DD4BF" }}>{gripForce}%</span>
            </div>
            <input type="range" min={5} max={100} value={gripForce} className="tp-slider teal"
              style={{"--val":`${gripForce}%`} as React.CSSProperties}
              onChange={e => setGripForce(Number(e.target.value))} />
            <p style={{ fontSize:11.5, color:isDark?"#94a3b8":"#64748b", marginTop:7, lineHeight:1.6 }}>% of Maximum Voluntary Contraction required to control the game</p>
          </div>
          <Toggle on={tremor} onChange={() => setTremor(v => !v)} label="Tremor Filter" sub="Active stabilization to reduce tremor artifacts"/>
        </div>

        {/* Game Logic */}
        <div className="tp-card" style={{ animation:"tpCardPop 0.50s cubic-bezier(0.22,1,0.36,1) 0.19s both" }}>
          <div className="tp-section-title"><span className="icon-wrap" style={{ background:"rgba(99,102,241,0.10)", color:"#6366f1" }}><Brain size={15}/></span>Game Logic Settings</div>
          <div style={{ marginBottom:22 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:700, color:isDark?"#f1f5f9":"#0B1E33" }}>Speed / Difficulty</div>
              <span className="mono" style={{ fontSize:13, fontWeight:700, color:diffColor }}>{diffLabel}</span>
            </div>
            <input type="range" min={0} max={3} value={difficulty} className="tp-slider purple"
              style={{"--val":`${(difficulty/3)*100}%`} as React.CSSProperties}
              onChange={e => setDifficulty(Number(e.target.value))} />
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
              {DIFFICULTY_LABELS.map((l, i) => (
                <span key={l} className="mono" style={{ fontSize:9, color:i===difficulty?diffColor:"#94a3b8", fontWeight:i===difficulty?700:500, letterSpacing:"0.08em" }}>{l}</span>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:13, fontWeight:700, color:isDark?"#f1f5f9":"#0B1E33", marginBottom:10 }}>Session Duration</div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <input type="number" min={5} max={60} value={duration} className="tp-dur-input" onChange={e => setDuration(Number(e.target.value))}/>
              <span style={{ fontSize:13, color:isDark?"#94a3b8":"#64748b", fontWeight:500 }}>minutes per session</span>
            </div>
          </div>
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:13, fontWeight:700, color:isDark?"#f1f5f9":"#0B1E33", marginBottom:10 }}>Sessions Per Week</div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <input type="number" min={1} max={7} value={sessionsPerWeek} className="tp-dur-input" onChange={e => setSessionsPerWeek(Number(e.target.value))}/>
              <span style={{ fontSize:13, color:isDark?"#94a3b8":"#64748b", fontWeight:500 }}>sessions/week (used for adherence %)</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:isDark?"#f1f5f9":"#0B1E33", marginBottom:12 }}>Assistance Cues</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <Toggle on={audioHints} onChange={() => setAudioHints(v => !v)} label="Audio Hints" sub="Voice prompts and sound cues during gameplay"/>
              <Toggle on={visualGuides} onChange={() => setVisualGuides(v => !v)} label="Visual Path Guides" sub="Overlay guides to assist target navigation"/>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
        {/* Live Preview */}
        <div className="tp-card" style={{ animation:"tpCardPop 0.50s cubic-bezier(0.22,1,0.36,1) 0.07s both", position:"sticky", top:20 }}>
          <div className="tp-section-title"><span className="icon-wrap" style={{ background:"rgba(251,191,36,0.12)", color:"#f59e0b" }}><Zap size={15}/></span>Live Preview</div>
          <GameCanvas pressure={Math.round(pressure)} hand={hand==="right"?"Right":"Left"}/>
          <div style={{ marginTop:16, padding:"14px 16px", background:isDark?"rgba(30,41,59,0.80)":"rgba(240,244,248,0.8)", borderRadius:14, border:isDark?"1px solid #334155":"1px solid rgba(226,232,240,0.8)" }}>
            <div className="mono" style={{ fontSize:9, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:10, fontWeight:700 }}>Protocol Summary</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"7px 14px" }}>
              {[
                { label:"Game", val:selectedGame.label },
                { label:"Hand", val:`${hand.charAt(0).toUpperCase()+hand.slice(1)} Hand` },
                { label:"Input", val:inputSrc==="bp"?"BP Bulb":"IMU Motion" },
                { label:"Grip MVC", val:`${gripForce}%` },
                { label:"Difficulty", val:diffLabel },
                { label:"Duration", val:`${duration} min` },
                { label:"Sessions/wk", val:String(sessionsPerWeek) },
              ].map(row => (
                <div key={row.label}>
                  <div className="mono" style={{ fontSize:8.5, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.10em" }}>{row.label}</div>
                  <div style={{ fontSize:12.5, fontWeight:700, color:isDark?"#f1f5f9":"#0B1E33", marginTop:1 }}>{row.val}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="tp-btn-row" style={{ display:"flex", gap:9, marginTop:14 }}>
            <button className="tp-btn-preview"><Play size={15} fill="currentColor" style={{ position:"relative", zIndex:2 }}/><span style={{ position:"relative", zIndex:2 }}>Preview</span></button>
            <button className="tp-btn-assign" onClick={handleAssign} disabled={savedState==="saving"}>
              {savedState==="saving"
                ? <div style={{ width:15, height:15, border:"2.5px solid rgba(255,255,255,0.25)", borderTopColor:"#fff", borderRadius:"50%", animation:"tpSpin 0.75s linear infinite" }}/>
                : <Send size={14} style={{ position:"relative", zIndex:2 }}/>}
              <span style={{ position:"relative", zIndex:2 }}>
                {savedState==="saving" ? "Assigning…" : `Assign to ${patient?.name.split(" ")[0]}`}
              </span>
            </button>
          </div>
          {savedState==="saved" && (
            <div className="tp-saved-badge" style={{ marginTop:12, width:"100%", justifyContent:"center" }}>
              <CheckCircle2 size={16} color="#15803d"/>
              Protocol assigned to {patient?.name.split(" ")[0]}!
            </div>
          )}
        </div>

        {/* Saved Protocol Templates */}
        <div className="tp-card" style={{ animation:"tpCardPop 0.50s cubic-bezier(0.22,1,0.36,1) 0.17s both" }}>
          <div className="tp-section-title"><span className="icon-wrap" style={{ background:"rgba(99,102,241,0.10)", color:"#6366f1" }}><BookOpen size={15}/></span>Saved Protocol Templates</div>
          {savedTemplates.length === 0 ? (
            <p style={{ fontSize:13, color:"#94a3b8", textAlign:"center", padding:"16px 0" }}>No templates yet — assign protocols to create templates.</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              {savedTemplates.map((proto, i) => (
                <div key={proto.name} className="tp-protocol-item" style={{ animationDelay:`${0.22+i*0.07}s` }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:isDark?"#f1f5f9":"#0B1E33" }}>{proto.name}</span>
                    <div style={{ width:22, height:22, borderRadius:"50%", background:"rgba(45,212,191,0.10)", border:"1px solid rgba(45,212,191,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <ChevronRight size={12} color="#2DD4BF"/>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:11.5, color:isDark?"#94a3b8":"#64748b", fontWeight:500 }}>{proto.game}</span>
                    <span style={{ fontSize:10, color:"#94a3b8" }}>•</span>
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <Users size={10} color="#94a3b8"/>
                      <span className="mono" style={{ fontSize:10, color:"#94a3b8", fontWeight:600 }}>{proto.patientCount} patients</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* ── Full render ── */
  return (
    <div className="tp" style={{ minHeight:"100vh", background:isDark?"#0f172a":"#F0F4F8", paddingBottom:52 }}>
      <style>{CSS}</style>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-8%", right:"6%", width:650, height:650, background:"radial-gradient(circle,rgba(45,212,191,0.052),transparent 65%)", borderRadius:"50%" }}/>
        <div style={{ position:"absolute", bottom:"-10%", left:"4%", width:550, height:550, background:"radial-gradient(circle,rgba(99,102,241,0.04),transparent 65%)", borderRadius:"50%" }}/>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(11,30,51,0.020) 1px,transparent 1px),linear-gradient(90deg,rgba(11,30,51,0.020) 1px,transparent 1px)", backgroundSize:"52px 52px" }}/>
      </div>

      <div className="tp-outer" style={{ maxWidth:1340, margin:"0 auto", padding:"28px 24px", position:"relative", zIndex:1 }}>
        {/* Header */}
        <div style={{ marginBottom:24, animation:"tpFadeUp 0.50s ease both", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
          <div>
            <p className="mono" style={{ fontSize:9, color:"rgba(45,212,191,0.72)", textTransform:"uppercase", letterSpacing:"0.22em", marginBottom:5, fontWeight:600 }}>Neuro-Rehabilitation</p>
            <h1 style={{ fontSize:"clamp(1.5rem,2.8vw,2rem)", fontWeight:800, color:isDark?"#f1f5f9":"#0B1E33", margin:0, lineHeight:1.15 }}>
              Therapy Protocols &amp; <span style={{ color:"#2DD4BF" }}>Game Config</span>
            </h1>
            <p style={{ fontSize:13.5, color:isDark?"#94a3b8":"#64748b", marginTop:5, fontWeight:500 }}>
              {patient ? <>Configuring protocol for <span style={{ color:"#6366f1", fontWeight:800 }}>{patient.name}</span> · {patient.condition}</> : "Select a patient from the sidebar to configure their protocol"}
            </p>
          </div>
          <Link href="/doctor/patients" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"9px 18px", borderRadius:12, background:isDark?"#1e293b":"#fff", border:isDark?"1.5px solid #334155":"1.5px solid rgba(226,232,240,0.9)", fontSize:13, fontWeight:700, color:isDark?"#94a3b8":"#64748b", textDecoration:"none" }}>
            <ArrowLeft size={14}/> Back to Patients
          </Link>
        </div>

        <div className="tp-outer-layout">
          {/* Sidebar */}
          <div className="tp-sidebar-wrap" style={{ width:275, flexShrink:0, background:isDark?"#1e293b":"#fff", borderRadius:20, border:isDark?"1px solid #334155":"1px solid rgba(226,232,240,0.9)", boxShadow:isDark?"0 2px 20px rgba(0,0,0,0.25)":"0 2px 20px rgba(11,30,51,0.06)", overflow:"hidden", display:"flex", flexDirection:"column", position:"sticky", top:20, maxHeight:"calc(100vh - 60px)" }}>
            <div style={{ padding:"16px 15px 12px", borderBottom:isDark?"1px solid #334155":"1px solid rgba(226,232,240,0.8)", background:isDark?"linear-gradient(135deg,#1e293b,#1a1f35)":"linear-gradient(135deg,#f8f7ff,#f0effe)", flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:12 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:"rgba(99,102,241,0.10)", display:"flex", alignItems:"center", justifyContent:"center", color:"#6366f1" }}><Users size={15}/></div>
                <div>
                  <div style={{ fontSize:13.5, fontWeight:800, color:isDark?"#f1f5f9":"#0B1E33" }}>All Patients</div>
                  <div className="mono" style={{ fontSize:8.5, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.12em" }}>
                    {patientsLoading ? "Loading…" : `${protocolSet.size}/${patients.length} protocols set`}
                  </div>
                </div>
              </div>
              <div style={{ height:4, background:"rgba(99,102,241,0.10)", borderRadius:99, overflow:"hidden", marginBottom:12 }}>
                <div style={{ height:"100%", borderRadius:99, width:patients.length ? `${(protocolSet.size/patients.length)*100}%` : "0%", background:"linear-gradient(90deg,#6366f1,#8b5cf6)", transition:"width 0.8s cubic-bezier(0.22,1,0.36,1)" }}/>
              </div>
              <div style={{ position:"relative" }}>
                <Search size={13} color="#94a3b8" style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                <input value={sidebarSearch} onChange={e => setSidebarSearch(e.target.value)} placeholder="Search patients..."
                  style={{ width:"100%", padding:"8px 10px 8px 30px", background:isDark?"#334155":"rgba(240,244,248,0.9)", border:isDark?"1px solid #475569":"1px solid rgba(226,232,240,0.9)", borderRadius:10, fontSize:12, color:isDark?"#f1f5f9":"#0B1E33", outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif" }}/>
              </div>
            </div>

            <div className="tp-sidebar-scroll" style={{ flex:1, overflowY:"auto", padding:"8px" }}>
              {patientsLoading ? (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 0", gap:8 }}>
                  <div style={{ width:16, height:16, border:"2px solid rgba(45,212,191,0.3)", borderTopColor:"#2DD4BF", borderRadius:"50%", animation:"tpSpin 1s linear infinite" }}/>
                  <span style={{ fontSize:12, color:"#94a3b8" }}>Loading…</span>
                </div>
              ) : filteredSidebar.map(p => {
                const ac = adherenceColor(p.adherence);
                const sc = statusColor(p.status);
                const isA = p.id === selectedId;
                const hasP = protocolSet.has(p.id);
                return (
                  <button key={p.id} className={`tp-patient-btn ${isA?"active":""}`} onClick={() => setSelectedId(p.id)}>
                    <div style={{ position:"relative", flexShrink:0 }}>
                      <div style={{ width:38, height:38, borderRadius:12, background:isA?"linear-gradient(135deg,#6366f1,#4f46e5)":`${ac}18`, border:`1.5px solid ${isA?"transparent":ac+"38"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10.5, fontWeight:800, color:isA?"#fff":ac }}>
                        {initials(p.name)}
                      </div>
                      <div style={{ position:"absolute", bottom:-2, right:-2, width:12, height:12, borderRadius:"50%", background:hasP?"#22c55e":isDark?"#1e293b":"#fff", border:hasP?"none":`2.5px solid ${sc}`, boxShadow:hasP?"0 0 4px rgba(34,197,94,0.6)":"none" }}/>
                    </div>
                    <div style={{ flex:1, minWidth:0, textAlign:"left" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:4 }}>
                        <span style={{ fontSize:12.5, fontWeight:700, color:isDark?"#f1f5f9":"#0B1E33", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:108 }}>{p.name}</span>
                        <MiniBar value={p.adherence} color={ac}/>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:2 }}>
                        <span className="mono" style={{ fontSize:8.5, color:"#6366f1", background:"rgba(99,102,241,0.08)", padding:"1px 5px", borderRadius:5 }}>{p.pid}</span>
                        <span style={{ fontSize:10.5, color:"#94a3b8" }}>{p.condition}</span>
                      </div>
                      <div className="mono" style={{ fontSize:9, color:hasP?"#22c55e":"#94a3b8", marginTop:2, fontWeight:hasP?700:500 }}>
                        {hasP ? "✓ Protocol set" : "No protocol yet"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", animation:"tpFadeUp 0.50s ease 0.06s both" }}>
            {patient && (
              <div style={{ marginBottom:18, background:"#0B1E33", borderRadius:18, padding:"16px 22px", display:"flex", alignItems:"center", gap:16, boxShadow:"0 8px 32px rgba(11,30,51,0.18)", position:"relative", overflow:"hidden", flexWrap:"wrap" }}>
                <div style={{ position:"absolute", inset:0, pointerEvents:"none", backgroundImage:"linear-gradient(rgba(45,212,191,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(45,212,191,0.04) 1px,transparent 1px)", backgroundSize:"28px 28px" }}/>
                <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}><div style={{ position:"absolute", left:0, right:0, height:"18%", background:"linear-gradient(to bottom,transparent,rgba(45,212,191,0.05),transparent)", animation:"tpScanLine 5s linear infinite" }}/></div>
                <div style={{ position:"relative", zIndex:2, flexShrink:0 }}>
                  <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${adherenceColor(patient.adherence)},${adherenceColor(patient.adherence)}aa)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#fff", boxShadow:`0 0 0 2.5px ${adherenceColor(patient.adherence)}40,0 4px 18px ${adherenceColor(patient.adherence)}30`, animation:"tpGlow 3s ease-in-out infinite" }}>
                    {initials(patient.name)}
                  </div>
                </div>
                <div style={{ position:"relative", zIndex:2, flex:1 }}>
                  <p className="mono" style={{ fontSize:8, color:"rgba(45,212,191,0.60)", textTransform:"uppercase", letterSpacing:"0.22em", marginBottom:3 }}>Configuring Protocol For</p>
                  <div style={{ fontSize:16, fontWeight:800, color:"#fff" }}>{patient.name}</div>
                  <div style={{ display:"flex", gap:10, marginTop:5, flexWrap:"wrap" }}>
                    <span className="mono" style={{ fontSize:10, color:"#2DD4BF", background:"rgba(45,212,191,0.12)", border:"1px solid rgba(45,212,191,0.20)", padding:"1px 8px", borderRadius:6 }}>{patient.pid}</span>
                    <span style={{ fontSize:11.5, color:"rgba(255,255,255,0.40)" }}>{patient.condition}</span>
                    <span style={{ fontSize:11.5, color:statusColor(patient.status), fontWeight:700 }}>{patient.status} Adherence · {patient.adherence}%</span>
                  </div>
                </div>
                <div style={{ position:"relative", zIndex:2, display:"flex", gap:9, flexWrap:"wrap" }}>
                  {patient.sub === "AI Companion"
                    ? <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(45,212,191,0.10)", border:"1px solid rgba(45,212,191,0.22)", borderRadius:11, padding:"7px 12px" }}><Bot size={12} color="#2DD4BF"/><span style={{ fontSize:11, fontWeight:700, color:"#2DD4BF" }}>AI Companion</span></div>
                    : <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:11, padding:"7px 12px" }}><Shield size={12} color="rgba(255,255,255,0.35)"/><span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.40)" }}>Standard</span></div>}
                  {protocolSet.has(patient.id) && (
                    <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(34,197,94,0.10)", border:"1px solid rgba(34,197,94,0.25)", borderRadius:11, padding:"7px 12px" }}>
                      <CheckCircle2 size={12} color="#22c55e"/><span style={{ fontSize:11, fontWeight:700, color:"#22c55e" }}>Protocol Active</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {selectedId ? ProtocolBuilder() : NoPatientState()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TherapyProtocolsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center"><div className="text-sm text-gray-500">Loading…</div></div>}>
      <TherapyProtocolsInner />
    </Suspense>
  );
}