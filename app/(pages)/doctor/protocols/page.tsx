"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Gamepad2, Zap, Settings2, Brain, Play, Send, Activity,
  BookOpen, Users, Check, ArrowLeft, Search, Bot,
  Shield, ClipboardList, User, CheckCircle2, ChevronRight, Waves,
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

/* ─── Types ──────────────────────────────────────────── */
interface DisplayPatient {
  id: string; name: string; pid: string; condition: string;
  status: "High"|"Medium"|"Low"; sub: string; adherence: number; hasProtocol: boolean;
}
interface SavedProtocolTemplate {
  name: string; game: string; patientCount: number; protocolId: string;
}

/* ─── Games — Synapse Racer + Memory Gate only ───────── */
const GAMES = [
  {
    value: "synapse_racer" as GameId,
    label: "Synapse Racer",
    tag: "Motor Focus · Level 1 & 2",
    emoji: "🐟",
    accent: "#2DD4BF",
    accentFaint: "rgba(45,212,191,.10)",
    benefit: "Patients control a fish by squeezing the BP Bulb — squeeze to swim up, release to dive. Level 1 is pure motor baseline (single gold pearl). Level 2 adds cognitive dual-tasking: collect blue targets, avoid red decoys under strict pressure constraints. Ideal for stroke and Parkinson's patients working on hand function and impulse control.",
  },
  {
    value: "memory_gate" as GameId,
    label: "Memory Gate",
    tag: "Cognitive Dual-Task",
    emoji: "🧠",
    accent: "#f59e0b",
    accentFaint: "rgba(245,158,11,.10)",
    benefit: "Match squeeze cadence to oncoming colour sequences while maintaining sustained grip force. Trains rhythmic grip timing, finger-hand synchronisation, and working memory simultaneously. Designed for TBI, post-surgical, and stroke cognitive rehabilitation.",
  },
];

const LEVEL_LABELS: Record<string, string[]> = {
  synapse_racer: ["Level 1 — Motor Baseline", "Level 2 — Cognitive Dual-Task"],
  memory_gate:   ["Novice", "Advanced", "Elite"],
};

/* ─── Helpers ────────────────────────────────────────── */
function statusColor(s: string) { return s==="High"?"#22c55e":s==="Medium"?"#f59e0b":"#ef4444"; }
function adherenceColor(v: number) { return v>=80?"#22c55e":v>=55?"#f97316":"#ef4444"; }
function getStatus(a: number): "High"|"Medium"|"Low" { return a>=80?"High":a>=55?"Medium":"Low"; }
function initials(name: string) { return name.split(" ").map(w=>w[0]).slice(0,2).join(""); }

/* ═══════════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  .tp * { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; box-sizing: border-box; }
  .tp .mono { font-family: 'JetBrains Mono', monospace; }

  @keyframes tpFadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes tpCardPop { 0%{opacity:0;transform:translateY(14px) scale(.975)} 100%{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes tpShimmer { 0%{transform:translateX(-200%) skewX(-15deg)} 100%{transform:translateX(400%) skewX(-15deg)} }
  @keyframes tpGlow    { 0%,100%{box-shadow:0 0 0 0 rgba(45,212,191,.40)} 50%{box-shadow:0 0 0 10px rgba(45,212,191,0)} }
  @keyframes tpScanLine{ 0%{top:-4%;opacity:0} 6%{opacity:1} 92%{opacity:.5} 100%{top:108%;opacity:0} }
  @keyframes tpDot     { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes tpSensorFlash{ 0%,100%{color:#2DD4BF} 50%{color:#67e8f9} }
  @keyframes tpSpin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes tpSavedPop{ 0%{opacity:0;transform:scale(.80) translateY(8px)} 70%{transform:scale(1.06)} 100%{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes tpPulseRing { 0%{transform:scale(.85);opacity:.7} 100%{transform:scale(2.2);opacity:0} }
  @keyframes tpFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  @keyframes tpBubble  { 0%{transform:translateY(0) scale(1);opacity:.7} 100%{transform:translateY(-80px) scale(.5);opacity:0} }
  @keyframes tpPearlGlow { 0%,100%{filter:drop-shadow(0 0 4px #FFD700)} 50%{filter:drop-shadow(0 0 12px #FFD700)} }
  @keyframes tpFishWiggle { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(.92)} }
  @keyframes tpWave    { 0%{d:path("M0,18 Q60,8 120,18 Q180,28 240,18 Q300,8 360,18")} 100%{d:path("M0,18 Q60,28 120,18 Q180,8 240,18 Q300,28 360,18")} }
  @keyframes tpProtocolIn{ from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes tpLevelPop  { 0%{opacity:0;transform:scale(.88)} 100%{opacity:1;transform:scale(1)} }

  .tp-patient-btn{width:100%;text-align:left;background:none;border:none;padding:10px 12px;border-radius:14px;cursor:pointer;transition:all .2s ease;display:flex;align-items:center;gap:10px}
  .tp-patient-btn:hover{background:rgba(99,102,241,.07)}
  .tp-patient-btn.active{background:linear-gradient(135deg,rgba(99,102,241,.13),rgba(79,70,229,.08));border:1.5px solid rgba(99,102,241,.28)}

  .tp-card{background:#fff;border-radius:20px;border:1px solid rgba(226,232,240,.9);box-shadow:0 2px 20px rgba(11,30,51,.06);padding:24px;transition:box-shadow .28s ease,transform .28s ease}
  .tp-card:hover{box-shadow:0 12px 48px rgba(11,30,51,.10)}

  .tp-section-title{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:800;color:#0B1E33;margin-bottom:18px}
  .tp-section-title .icon-wrap{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:rgba(45,212,191,.10);color:#2DD4BF;flex-shrink:0}

  .tp-game-card{padding:18px 20px;border-radius:16px;border:2px solid #e2e8f0;cursor:pointer;transition:all .22s ease;display:flex;align-items:center;gap:16px;font-family:'Plus Jakarta Sans',sans-serif;position:relative;overflow:hidden}
  .tp-game-card::before{content:'';position:absolute;inset:0;opacity:0;transition:opacity .22s ease;background:linear-gradient(135deg,var(--gc-a,rgba(45,212,191,.08)),transparent)}
  .tp-game-card:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,.08)}
  .tp-game-card:hover::before{opacity:1}
  .tp-game-card.active{border-color:var(--gc-border,rgba(45,212,191,.50));box-shadow:0 0 0 4px var(--gc-ring,rgba(45,212,191,.10)),0 8px 28px rgba(0,0,0,.08)}
  .tp-game-card.active::before{opacity:1}

  .tp-level-pill{padding:10px 18px;border-radius:12px;border:1.5px solid #e2e8f0;cursor:pointer;transition:all .2s ease;font-size:13px;font-weight:700;background:#fff;font-family:'Plus Jakarta Sans',sans-serif;animation:tpLevelPop .3s cubic-bezier(.22,1,.36,1) both}
  .tp-level-pill.active{border-color:rgba(45,212,191,.50);background:rgba(45,212,191,.06);color:#0f766e;box-shadow:0 0 0 3px rgba(45,212,191,.10)}
  .tp-level-pill:not(.active):hover{border-color:rgba(45,212,191,.30);background:rgba(45,212,191,.03)}

  .tp-pill{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:99px;font-size:12.5px;font-weight:700;cursor:pointer;border:1.5px solid transparent;transition:all .2s ease;font-family:'Plus Jakarta Sans',sans-serif}
  .tp-pill.active{background:rgba(45,212,191,.10);border-color:rgba(45,212,191,.40);color:#0f766e}
  .tp-pill.inactive{background:#f8fafc;border-color:#e2e8f0;color:#64748b}
  .tp-pill.inactive:hover{border-color:rgba(45,212,191,.30);color:#0f766e}

  .tp-hand-btn{flex:1;padding:13px 10px;border-radius:12px;font-size:13.5px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .22s ease;border:1.5px solid #e2e8f0;font-family:'Plus Jakarta Sans',sans-serif}
  .tp-hand-btn.active{border-color:#2DD4BF;color:#0f766e;background:rgba(45,212,191,.07);box-shadow:0 0 0 3px rgba(45,212,191,.12)}
  .tp-hand-btn.inactive{background:#fff;color:#475569}
  .tp-hand-btn.inactive:hover{border-color:rgba(45,212,191,.30)}

  .tp-slider{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:99px;outline:none;cursor:pointer}
  .tp-slider.teal{background:linear-gradient(to right,#2DD4BF var(--val,45%),#e2e8f0 var(--val,45%))}
  .tp-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:20px;height:20px;border-radius:50%;cursor:pointer;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.18);transition:transform .15s ease;background:#2DD4BF}
  .tp-slider::-webkit-slider-thumb:hover{transform:scale(1.25)}

  .tp-toggle-wrap{display:flex;align-items:center;justify-content:space-between;padding:13px 15px;border-radius:13px;background:rgba(240,244,248,.7);border:1px solid rgba(226,232,240,.8);cursor:pointer;transition:all .2s ease}
  .tp-toggle-wrap:hover{background:rgba(240,253,250,.8);border-color:rgba(45,212,191,.22)}
  .tp-toggle-track{width:46px;height:24px;border-radius:99px;position:relative;transition:background .25s ease;flex-shrink:0}
  .tp-toggle-track.on{background:#2DD4BF}
  .tp-toggle-track.off{background:#cbd5e1}
  .tp-toggle-thumb{position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.20);transition:left .25s cubic-bezier(.22,1,.36,1)}
  .tp-toggle-track.on .tp-toggle-thumb{left:25px}
  .tp-toggle-track.off .tp-toggle-thumb{left:3px}

  .tp-dur-input{width:80px;padding:10px 12px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:14px;font-weight:700;color:#0B1E33;outline:none;text-align:center;transition:all .2s ease;font-family:'JetBrains Mono',monospace}
  .tp-dur-input:focus{border-color:rgba(45,212,191,.6);box-shadow:0 0 0 3px rgba(45,212,191,.10)}

  .tp-btn-preview{flex:1;padding:12px;border-radius:13px;border:none;cursor:pointer;background:linear-gradient(135deg,#2DD4BF,#0891b2);color:#0B1E33;font-size:13.5px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 20px rgba(45,212,191,.35);transition:all .22s ease;position:relative;overflow:hidden;font-family:'Plus Jakarta Sans',sans-serif}
  .tp-btn-preview::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent);animation:tpShimmer 2.8s ease-in-out infinite}
  .tp-btn-preview:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(45,212,191,.45)}

  .tp-btn-assign{flex:1;padding:12px;border-radius:13px;border:none;cursor:pointer;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;font-size:13.5px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 20px rgba(99,102,241,.30);transition:all .22s ease;position:relative;overflow:hidden;font-family:'Plus Jakarta Sans',sans-serif}
  .tp-btn-assign::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.20),transparent);animation:tpShimmer 3s ease-in-out infinite .4s}
  .tp-btn-assign:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(99,102,241,.40)}

  .tp-protocol-item{padding:14px 16px;border-radius:12px;border:1px solid rgba(226,232,240,.8);transition:all .2s ease;cursor:pointer;animation:tpProtocolIn .4s cubic-bezier(.22,1,.36,1) both}
  .tp-protocol-item:hover{border-color:rgba(45,212,191,.35);background:rgba(240,253,250,.6);transform:translateX(3px)}
  .tp-sidebar-scroll::-webkit-scrollbar{width:3px}
  .tp-sidebar-scroll::-webkit-scrollbar-thumb{background:rgba(99,102,241,.22);border-radius:99px}
  .tp-saved-badge{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:12px;background:rgba(34,197,94,.10);border:1px solid rgba(34,197,94,.28);color:#15803d;font-size:13px;font-weight:800;animation:tpSavedPop .4s cubic-bezier(.22,1,.36,1) both;font-family:'Plus Jakarta Sans',sans-serif}
  .tp-outer-layout{display:flex;gap:18px;align-items:flex-start}
  .tp-main-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;flex:1;min-width:0}

  .tp-benefit{background:rgba(240,253,250,1);border:1px solid rgba(45,212,191,.22);border-radius:12px;padding:14px 16px;margin-top:14px}
  .tp-benefit-label{font-size:12.5px;font-weight:700;color:#0f766e;margin-bottom:5px}
  .tp-benefit-text{font-size:12px;color:#475569;line-height:1.72}

  @media (max-width:1200px){.tp-main-grid{grid-template-columns:1fr}}
  @media (max-width:900px){.tp-sidebar-wrap{display:none !important}}
  @media (max-width:600px){.tp .tp-outer{padding:16px 14px !important} .tp-btn-row{flex-direction:column !important}}

  .dark .tp-card{background:#1e293b;border-color:rgba(51,65,85,.9)}
  .dark .tp-section-title{color:#f1f5f9}
  .dark .tp-game-card{border-color:#334155}
  .dark .tp-benefit{background:rgba(15,118,110,.14);border-color:rgba(45,212,191,.22)}
  .dark .tp-benefit-label{color:#2DD4BF}
  .dark .tp-benefit-text{color:#94a3b8}
  .dark .tp-pill.inactive{background:#334155;border-color:#475569;color:#94a3b8}
  .dark .tp-hand-btn.inactive{background:#1e293b;color:#94a3b8;border-color:#334155}
  .dark .tp-toggle-wrap{background:rgba(30,41,59,.90);border-color:rgba(51,65,85,.8)}
  .dark .tp-slider.teal{background:linear-gradient(to right,#2DD4BF var(--val,45%),#334155 var(--val,45%))}
  .dark .tp-dur-input{background:#334155;border-color:#475569;color:#f1f5f9}
  .dark .tp-protocol-item{border-color:#334155}
  .dark .tp-patient-btn:hover{background:rgba(99,102,241,.12)}
  .dark .tp-patient-btn.active{background:linear-gradient(135deg,rgba(99,102,241,.20),rgba(79,70,229,.14));border-color:rgba(99,102,241,.40)}
  .dark .tp-level-pill{background:#1e293b;border-color:#334155;color:#94a3b8}
  .dark .tp-level-pill.active{border-color:rgba(45,212,191,.50);background:rgba(45,212,191,.10);color:#2DD4BF}
`;

/* ═══════════════════════════════════════════════════════
   SYNAPSE RACER PREVIEW CANVAS
   — Underwater scene matching the real game aesthetic
═══════════════════════════════════════════════════════ */
const SynapsePreviewCanvas: React.FC<{ pressure: number; hand: string; level: number }> = ({ pressure, hand, level }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gRef = useRef({
    ctx: null as CanvasRenderingContext2D | null,
    rafId: 0, paused: false, dpr: 1, W: 0, H: 0, t: 0,
    fishY: 0, fishVY: 0,
    pearls: [] as { x: number; y: number; isTarget: boolean; collected: boolean; opacity: number }[],
    bubbles: [] as { x: number; y: number; r: number; vy: number; opacity: number }[],
    dustX: 0,
    score: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const g = gRef.current;
    g.dpr = Math.min(window.devicePixelRatio || 1, 2);
    g.ctx = canvas.getContext("2d", { alpha: false });
    if (!g.ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      g.W = rect.width; g.H = rect.height;
      canvas.width = g.W * g.dpr; canvas.height = g.H * g.dpr;
      g.fishY = g.H / 2;
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);

    // Init bubbles
    g.bubbles = Array.from({ length: 18 }, () => ({
      x: Math.random() * 1000, y: Math.random() * 300,
      r: Math.random() * 2.5 + 0.8,
      vy: -(Math.random() * 0.4 + 0.2),
      opacity: Math.random() * 0.4 + 0.15,
    }));

    // Init pearls
    const spawnPearl = (x: number) => {
      const isTarget = level <= 1 || Math.random() > 0.5;
      return { x, y: 60 + Math.random() * (g.H - 100), isTarget, collected: false, opacity: 1 };
    };
    g.pearls = [spawnPearl(300), spawnPearl(520)];
    if (level >= 2) g.pearls.push({ x: 420, y: 140, isTarget: false, collected: false, opacity: 1 });

    const onVis = () => { g.paused = document.hidden; };
    document.addEventListener("visibilitychange", onVis);

    const draw = () => {
      g.rafId = requestAnimationFrame(draw);
      if (g.paused || !g.ctx) return;
      const ctx = g.ctx; const { W, H, dpr } = g;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.t += 0.016; g.dustX += 1.2;

      // ── Sky gradient (above water line) ──────────────────────────────────
      const surfY = H * 0.18;
      const skyGrad = ctx.createLinearGradient(0, 0, 0, surfY);
      skyGrad.addColorStop(0, "#3a7bd5");
      skyGrad.addColorStop(1, "#6fb1e8");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, surfY);

      // ── Water body ───────────────────────────────────────────────────────
      const waterGrad = ctx.createLinearGradient(0, surfY, 0, H);
      waterGrad.addColorStop(0, "#1a8acc");
      waterGrad.addColorStop(0.4, "#0d5c96");
      waterGrad.addColorStop(1, "#062d52");
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, surfY, W, H - surfY);

      // ── Wireframe terrain (mimics the GLSL hills) ────────────────────────
      for (let layer = 0; layer < 3; layer++) {
        const speed = [0.3, 0.6, 1.0][layer];
        const alpha = [0.18, 0.28, 0.40][layer];
        const baseY = H * [0.85, 0.82, 0.78][layer];
        const amp = [12, 18, 22][layer];
        const offsetX = -g.dustX * speed;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(45,212,191,${alpha})`;
        ctx.lineWidth = 0.8;

        for (let xi = -40; xi <= W + 40; xi += 28) {
          const nx = xi + offsetX;
          const y = baseY + Math.sin((xi * 0.035) + g.t * 0.6 + layer * 1.2) * amp
                          + Math.sin((xi * 0.018) + g.t * 0.3 + layer * 0.7) * amp * 0.4;
          // Vertical line from terrain point up (wireframe effect)
          ctx.moveTo(xi, baseY + amp * 1.2);
          ctx.lineTo(xi, y);
        }
        ctx.stroke();

        // Horizontal cross-hatch
        ctx.beginPath();
        ctx.strokeStyle = `rgba(45,212,191,${alpha * 0.6})`;
        for (let yi = 0; yi < 5; yi++) {
          const rowY = baseY - amp + yi * (amp * 0.5);
          ctx.moveTo(0, rowY);
          for (let xi = 0; xi <= W; xi += 4) {
            const y = rowY + Math.sin((xi * 0.035) + g.t * 0.6 + layer * 1.2 + yi * 0.4) * amp * 0.3;
            ctx.lineTo(xi, y);
          }
        }
        ctx.stroke();
      }

      // ── Surface wave ─────────────────────────────────────────────────────
      ctx.beginPath();
      ctx.moveTo(0, surfY);
      for (let x = 0; x <= W; x += 4) {
        const y = surfY + Math.sin(x * 0.04 + g.t * 2.2) * 3 + Math.sin(x * 0.025 + g.t * 1.4) * 2;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, surfY - 6); ctx.lineTo(0, surfY - 6); ctx.closePath();
      const waveGrad = ctx.createLinearGradient(0, surfY - 6, 0, surfY + 4);
      waveGrad.addColorStop(0, "rgba(120,200,240,.55)");
      waveGrad.addColorStop(1, "rgba(30,140,210,.0)");
      ctx.fillStyle = waveGrad; ctx.fill();

      // ── Light shafts ─────────────────────────────────────────────────────
      for (let i = 0; i < 4; i++) {
        const sx = W * (0.15 + i * 0.25) + Math.sin(g.t * 0.4 + i) * 20;
        const shaftGrad = ctx.createLinearGradient(sx, surfY, sx + 30, H * 0.75);
        shaftGrad.addColorStop(0, "rgba(100,200,255,.07)");
        shaftGrad.addColorStop(1, "rgba(100,200,255,.0)");
        ctx.fillStyle = shaftGrad;
        ctx.beginPath();
        ctx.moveTo(sx, surfY); ctx.lineTo(sx + 22, H * 0.75); ctx.lineTo(sx + 42, H * 0.75); ctx.lineTo(sx + 20, surfY);
        ctx.closePath(); ctx.fill();
      }

      // ── Data dust particles ───────────────────────────────────────────────
      ctx.fillStyle = "rgba(45,212,191,.5)";
      for (let i = 0; i < 40; i++) {
        const px = ((i * 137 + g.dustX * 0.5) % (W + 80)) - 20;
        const py = H * 0.25 + ((i * 73) % (H * 0.6)) + Math.sin(g.t + i * 0.7) * 5;
        const pr = 0.6 + (i % 3) * 0.3;
        ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
      }

      // ── Bubbles ───────────────────────────────────────────────────────────
      g.bubbles.forEach(b => {
        b.y += b.vy;
        if (b.y < surfY - 10) { b.y = H - 10; b.x = Math.random() * W; }
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(150,220,255,${b.opacity})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
        ctx.fillStyle = `rgba(200,240,255,${b.opacity * 0.15})`;
        ctx.fill();
      });

      // ── Pearls ───────────────────────────────────────────────────────────
      g.pearls = g.pearls.map(p => {
        const np = { ...p, x: p.x - 1.1 };
        if (np.x < -20) {
          return { x: W + 30, y: 50 + Math.random() * (H * 0.65), isTarget: level <= 1 || Math.random() > 0.5, collected: false, opacity: 1 };
        }
        // Glow ring
        const glowColor = np.isTarget ? (level <= 1 ? "#FFD700" : "#00BFFF") : "#FF4500";
        const cr = 10;
        const ringG = ctx.createRadialGradient(np.x, np.y, 0, np.x, np.y, cr + 8);
        ringG.addColorStop(0, `${glowColor}60`);
        ringG.addColorStop(1, `${glowColor}00`);
        ctx.fillStyle = ringG;
        ctx.beginPath(); ctx.arc(np.x, np.y, cr + 8, 0, Math.PI * 2); ctx.fill();
        // Pearl body
        const pGrad = ctx.createRadialGradient(np.x - 3, np.y - 3, 1, np.x, np.y, cr);
        pGrad.addColorStop(0, "#fff");
        pGrad.addColorStop(0.4, glowColor);
        pGrad.addColorStop(1, np.isTarget ? (level <= 1 ? "#c8860a" : "#005fa3") : "#8B0000");
        ctx.fillStyle = pGrad;
        ctx.beginPath(); ctx.arc(np.x, np.y, cr, 0, Math.PI * 2); ctx.fill();
        // Shine
        ctx.fillStyle = "rgba(255,255,255,.35)";
        ctx.beginPath(); ctx.ellipse(np.x - 3, np.y - 3, 3, 2, -0.5, 0, Math.PI * 2); ctx.fill();
        return np;
      });

      // ── Fish (player) ────────────────────────────────────────────────────
      // Smooth swim animation
      g.fishY = g.H * 0.5 + Math.sin(g.t * 1.1) * 45;
      const fx = W * 0.22, fy = g.fishY;
      const wiggle = Math.sin(g.t * 8) * 0.06;

      ctx.save(); ctx.translate(fx, fy);

      // Glow aura
      const fishGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, 28);
      fishGlow.addColorStop(0, "rgba(45,212,191,.35)");
      fishGlow.addColorStop(1, "rgba(45,212,191,0)");
      ctx.fillStyle = fishGlow;
      ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.fill();

      // Tail
      ctx.fillStyle = "#14a896";
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(-28, -11 + wiggle * 80);
      ctx.lineTo(-28, 11 - wiggle * 80);
      ctx.closePath(); ctx.fill();

      // Body
      const bodyG = ctx.createRadialGradient(-2, -3, 2, 0, 0, 15);
      bodyG.addColorStop(0, "#6ee7df");
      bodyG.addColorStop(0.5, "#2DD4BF");
      bodyG.addColorStop(1, "#0e7a70");
      ctx.fillStyle = bodyG;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2); ctx.fill();

      // Stripe
      ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-10, -5); ctx.lineTo(8, -7); ctx.stroke();

      // Eye
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(10, -3, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#0B1E33";
      ctx.beginPath(); ctx.arc(11, -3, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.6)";
      ctx.beginPath(); ctx.arc(11.5, -4, 0.7, 0, Math.PI * 2); ctx.fill();

      ctx.restore();

      // ── HUD overlay ───────────────────────────────────────────────────────
      ctx.fillStyle = "rgba(6,15,35,.72)";
      ctx.beginPath();
      const hudX = W - 162, hudY = 12;
      const hudW = 148, hudH = 76;
      (ctx as any).roundRect ? (ctx as any).roundRect(hudX, hudY, hudW, hudH, 12) : ctx.rect(hudX, hudY, hudW, hudH);
      ctx.fill();
      ctx.strokeStyle = "rgba(45,212,191,.28)"; ctx.lineWidth = 1;
      ctx.stroke();

      // Live dot
      ctx.fillStyle = "#2DD4BF";
      ctx.beginPath(); ctx.arc(hudX + 14, hudY + 15, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(45,212,191,.25)";
      ctx.beginPath(); ctx.arc(hudX + 14, hudY + 15, 7, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = 'bold 10.5px "Plus Jakarta Sans"';
      ctx.textAlign = "left"; ctx.fillText("Live Preview", hudX + 24, hudY + 19);

      ctx.fillStyle = "#2DD4BF";
      ctx.font = '9.5px "JetBrains Mono"';
      ctx.fillText(`Grip: ${pressure} kPa`, hudX + 14, hudY + 37);
      ctx.fillStyle = "#fbbf24";
      ctx.fillText(`Hand: ${hand}`, hudX + 14, hudY + 52);
      ctx.fillStyle = "rgba(255,255,255,.45)";
      ctx.fillText(`Lvl ${level <= 1 ? 1 : 2} · ${level <= 1 ? "Motor" : "Cognitive"}`, hudX + 14, hudY + 67);

      // ── Level 2: show colour-coded pearl legend ───────────────────────────
      if (level >= 2) {
        ctx.fillStyle = "rgba(6,15,35,.60)";
        ctx.beginPath();
        const lgX = 12, lgY = H - 46, lgW = 148, lgH = 34;
        (ctx as any).roundRect ? (ctx as any).roundRect(lgX, lgY, lgW, lgH, 10) : ctx.rect(lgX, lgY, lgW, lgH);
        ctx.fill();
        // Blue target
        ctx.fillStyle = "#00BFFF";
        ctx.beginPath(); ctx.arc(lgX + 14, lgY + 17, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.6)";
        ctx.font = '9px "Plus Jakarta Sans"'; ctx.textAlign = "left";
        ctx.fillText("Collect", lgX + 25, lgY + 21);
        // Red decoy
        ctx.fillStyle = "#FF4500";
        ctx.beginPath(); ctx.arc(lgX + 88, lgY + 17, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.6)";
        ctx.fillText("Avoid", lgX + 99, lgY + 21);
      }
    };
    draw();
    return () => { cancelAnimationFrame(g.rafId); ro.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, [level]);

  return (
    <div style={{ position:"relative", borderRadius:14, overflow:"hidden", border:"1.5px solid rgba(45,212,191,.28)", boxShadow:"0 8px 32px rgba(6,25,55,.28)" }}>
      <canvas ref={canvasRef} style={{ width:"100%", height:240, display:"block" }} />
    </div>
  );
};

/* ─── Memory Gate Preview ────────────────────────────── */
const MemoryGatePreview: React.FC<{ level: number }> = ({ level }) => {
  const [seq, setSeq] = useState<string[]>([]);
  const [active, setActive] = useState(-1);
  const colors = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b"];
  const labels = ["RED", "BLUE", "GREEN", "AMBER"];

  useEffect(() => {
    const newSeq = Array.from({ length: 3 + level }, () => colors[Math.floor(Math.random() * colors.length)]);
    setSeq(newSeq);
    let i = 0;
    const iv = setInterval(() => { setActive(i % (3 + level)); i++; }, 700);
    return () => clearInterval(iv);
  }, [level]);

  return (
    <div style={{ borderRadius:14, overflow:"hidden", border:"1.5px solid rgba(245,158,11,.28)", boxShadow:"0 8px 32px rgba(6,25,55,.28)", background:"linear-gradient(145deg,#0B1E33,#061525)", height:240, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20, position:"relative" }}>
      {/* BG grid */}
      <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(245,158,11,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(245,158,11,.04) 1px,transparent 1px)", backgroundSize:"28px 28px" }} />
      <div style={{ position:"absolute", inset:0, overflow:"hidden" }}>
        <div style={{ position:"absolute", left:0, right:0, height:"14%", background:"linear-gradient(to bottom,transparent,rgba(245,158,11,.04),transparent)", animation:"tpScanLine 4s linear infinite" }} />
      </div>

      <div style={{ position:"relative", zIndex:2, textAlign:"center" }}>
        <div className="mono" style={{ fontSize:9, color:"rgba(245,158,11,.6)", textTransform:"uppercase", letterSpacing:".22em", marginBottom:8 }}>Memory Gate Preview</div>
        <div className="mono" style={{ fontSize:10.5, color:"rgba(255,255,255,.45)", letterSpacing:".10em" }}>Match the colour sequence</div>
      </div>

      {/* Colour pads */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, position:"relative", zIndex:2 }}>
        {colors.map((c, i) => (
          <div key={c} style={{ width:72, height:52, borderRadius:12, background:seq[active%seq.length]===c ? `${c}` : `${c}22`, border:`1.5px solid ${c}${seq[active%seq.length]===c?"":"44"}`, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .18s ease", boxShadow:seq[active%seq.length]===c?`0 0 20px ${c}66`:"none" }}>
            <span className="mono" style={{ fontSize:9, fontWeight:700, color:seq[active%seq.length]===c?"#fff":"rgba(255,255,255,.3)", letterSpacing:".10em" }}>{labels[i]}</span>
          </div>
        ))}
      </div>

      {/* Sequence dots */}
      <div style={{ display:"flex", gap:6, position:"relative", zIndex:2 }}>
        {seq.map((c, i) => (
          <div key={i} style={{ width:i===active%seq.length?14:8, height:8, borderRadius:99, background:i===active%seq.length?c:"rgba(255,255,255,.15)", transition:"all .18s ease", boxShadow:i===active%seq.length?`0 0 8px ${c}`:"none" }} />
        ))}
      </div>

      <div style={{ position:"absolute", top:12, right:12, zIndex:3, background:"rgba(6,15,35,.72)", border:"1px solid rgba(245,158,11,.28)", borderRadius:10, padding:"7px 12px" }}>
        <div className="mono" style={{ fontSize:9, color:"#f59e0b", letterSpacing:".10em" }}>LEVEL {level + 1} · {["Novice","Advanced","Elite"][level]}</div>
      </div>
    </div>
  );
};

/* ─── Toggle ─────────────────────────────────────────── */
function Toggle({ on, onChange, label, sub }: { on:boolean; onChange:()=>void; label:string; sub:string }) {
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
function MiniBar({ value, color }: { value:number; color:string }) {
  const isDark = useDarkMode();
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(()=>setW(value),250); return ()=>clearTimeout(t); }, [value]);
  return (
    <div style={{ width:42, height:4, background:isDark?"rgba(255,255,255,.08)":"rgba(11,30,51,.08)", borderRadius:99, overflow:"hidden", flexShrink:0 }}>
      <div style={{ height:"100%", borderRadius:99, width:`${w}%`, background:color, transition:"width .9s cubic-bezier(.22,1,.36,1)" }}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   INNER PAGE
═══════════════════════════════════════════════════════ */
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
  const [inputSrc, setInputSrc] = useState<"bp"|"imu">("bp");
  const [hand, setHand] = useState<"left"|"right">("right");
  const [gripForce, setGripForce] = useState(45);
  const [tremor, setTremor] = useState(true);
  const [levelIdx, setLevelIdx] = useState(0);   // level within the selected game
  const [duration, setDuration] = useState(15);
  const [audioHints, setAudioHints] = useState(true);
  const [visualGuides, setVisualGuides] = useState(true);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(5);
  const [pressure, setPressure] = useState(45);
  const [savedState, setSavedState] = useState<"idle"|"saving"|"saved">("idle");
  const [protocolSet, setProtocolSet] = useState<Set<string>>(new Set());
  const isDark = useDarkMode();

  useEffect(() => { const unsub = auth.onAuthStateChanged((u: FirebaseUser | null) => setUser(u)); return () => unsub(); }, []);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (paramPatient) setSelectedId(paramPatient); }, [paramPatient]);

  // Pressure sim
  useEffect(() => {
    if (!mounted) return;
    const iv = setInterval(() => { setPressure(p => Math.max(30, Math.min(75, p + (Math.random() - 0.5) * 6))); }, 1400);
    return () => clearInterval(iv);
  }, [mounted]);

  // Load patients
  useEffect(() => {
    if (!user) return;
    (async () => {
      setPatientsLoading(true);
      try {
        const rawPatients = await getPatientsByDoctor(user.uid);
        if (!rawPatients.length) { setPatients([]); setPatientsLoading(false); return; }
        const uids = rawPatients.map(p => p.uid);
        const [weekSessions] = await Promise.all([
          getCohortSessionsThisWeek(uids),
          getLastSessionPerPatient(uids),
        ]);
        const protSnap = await getDocs(query(collection(db,"protocols"), where("doctorId","==",user.uid)));
        const protocolPatientIds = new Set<string>();
        const templateMap = new Map<string,number>();
        protSnap.docs.forEach(d => {
          const data = d.data() as TherapyProtocol;
          protocolPatientIds.add(data.patientId);
          templateMap.set(data.gameId, (templateMap.get(data.gameId) ?? 0) + 1);
        });
        setProtocolSet(protocolPatientIds);
        const templates: SavedProtocolTemplate[] = [];
        const seen = new Set<string>();
        protSnap.docs.forEach(d => {
          const data = d.data() as TherapyProtocol;
          const gameName = GAMES.find(g => g.value === data.gameId)?.label ?? data.gameId;
          const key = `${data.gameId}-${data.level}`;
          if (!seen.has(key)) {
            seen.add(key);
            templates.push({ name:`${gameName} — Level ${data.level}`, game:gameName, patientCount:templateMap.get(data.gameId)??1, protocolId:d.id });
          }
        });
        setSavedTemplates(templates.slice(0, 5));
        const spwMap = new Map<string,number>();
        protSnap.docs.forEach(d => { const data=d.data() as TherapyProtocol; spwMap.set(data.patientId, data.sessionsPerWeek??5); });
        const display: DisplayPatient[] = rawPatients.map(p => {
          const spw = spwMap.get(p.uid) ?? 5;
          const done = weekSessions.filter(s => s.userId===p.uid && s.durationSeconds>60).length;
          const adherence = Math.min(100, Math.round((done/spw)*100));
          return { id:p.uid, name:p.name, pid:(p as any).patientId??p.uid.slice(0,7).toUpperCase(), condition:p.condition, status:getStatus(adherence), sub:p.subscriptionPlan==="ai_companion"?"AI Companion":"Standard", adherence, hasProtocol:protocolPatientIds.has(p.uid) };
        });
        setPatients(display);
      } catch(e) { console.error(e); } finally { setPatientsLoading(false); }
    })();
  }, [user]);

  // Load existing protocol
  useEffect(() => {
    if (!selectedId || !user) return;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db,"protocols"), where("patientId","==",selectedId), where("doctorId","==",user.uid)));
        if (!snap.empty) {
          const existing = snap.docs.map(d=>({id:d.id,...d.data()} as TherapyProtocol)).sort((a,b)=>b.assignedDate.seconds-a.assignedDate.seconds)[0];
          setGame(existing.gameId);
          setHand(existing.targetHand==="both"?"right":existing.targetHand);
          setInputSrc(existing.hardwareFocus==="mpx_pressure"?"bp":"imu");
          setGripForce(existing.settings.gripMvcPercent);
          setTremor(existing.settings.tremorFilter);
          setLevelIdx(Math.max(0, (existing.level ?? 1) - 1));
          setAudioHints(existing.settings.audioHints);
          setVisualGuides(existing.settings.visualGuides);
          setSessionsPerWeek(existing.sessionsPerWeek);
        } else {
          setGame("synapse_racer"); setInputSrc("bp"); setHand("right");
          setGripForce(45); setLevelIdx(0); setDuration(15);
          setTremor(true); setAudioHints(true); setVisualGuides(true); setSessionsPerWeek(5);
        }
      } catch(e) { console.error(e); }
    })();
    setSavedState("idle");
  }, [selectedId, user]);

  const handleAssign = async () => {
    if (!patient || !user) return;
    setSavedState("saving");
    try {
      const diffMap = ["easy","medium","hard","expert"] as const;
      const protocol: Omit<TherapyProtocol,"id"> = {
        doctorId: user.uid, patientId: patient.id, gameId: game,
        level: levelIdx + 1, targetHand: hand,
        hardwareFocus: inputSrc==="bp"?"mpx_pressure":"mpu_motion",
        assignedDate: Timestamp.now(), sessionsPerWeek,
        settings: { difficulty:diffMap[Math.min(levelIdx,3)], gripMvcPercent:gripForce, audioHints, visualGuides, tremorFilter:tremor },
      };
      const existing = await getDocs(query(collection(db,"protocols"), where("patientId","==",patient.id), where("doctorId","==",user.uid)));
      if (!existing.empty) await setDoc(doc(db,"protocols",existing.docs[0].id), protocol);
      else await addDoc(collection(db,"protocols"), protocol);
      setProtocolSet(prev => new Set([...prev, patient.id]));
      setPatients(prev => prev.map(p => p.id===patient.id ? {...p,hasProtocol:true} : p));
      setSavedState("saved");
      setTimeout(() => setSavedState("idle"), 2500);
    } catch(e) { console.error(e); setSavedState("idle"); }
  };

  if (!mounted) return null;

  const patient = patients.find(p=>p.id===selectedId) ?? null;
  const selectedGame = GAMES.find(g=>g.value===game) ?? GAMES[0];
  const levelLabels = LEVEL_LABELS[game] ?? ["Level 1"];
  const filteredSidebar = patients.filter(p =>
    p.name.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
    p.pid.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  /* ── No patient ── */
  const NoPatientState = () => (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"52px 28px", textAlign:"center" }}>
      <div style={{ position:"relative", marginBottom:24 }}>
        <div style={{ width:88, height:88, borderRadius:24, background:"linear-gradient(135deg,rgba(99,102,241,.12),rgba(79,70,229,.06))", border:"2px solid rgba(99,102,241,.18)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto" }}>
          <ClipboardList size={36} color="#6366f1" />
        </div>
        <div style={{ position:"absolute", top:-4, right:-4, width:28, height:28, borderRadius:"50%", background:"rgba(45,212,191,.12)", border:"2px solid rgba(45,212,191,.28)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <User size={13} color="#2DD4BF" />
        </div>
      </div>
      <h2 style={{ fontSize:22, fontWeight:800, color:isDark?"#f1f5f9":"#0B1E33", margin:"0 0 10px" }}>Select a Patient</h2>
      <p style={{ fontSize:14, color:isDark?"#94a3b8":"#64748b", margin:"0 0 28px", maxWidth:340, lineHeight:1.7 }}>
        Choose a patient from the list to configure their personalised therapy protocol.
      </p>
      {patientsLoading ? (
        <div style={{ display:"flex", alignItems:"center", gap:10, color:"#94a3b8", fontSize:13 }}>
          <div style={{ width:16, height:16, border:"2px solid rgba(45,212,191,.3)", borderTopColor:"#2DD4BF", borderRadius:"50%", animation:"tpSpin 1s linear infinite" }}/>
          Loading patients…
        </div>
      ) : (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", maxWidth:480 }}>
          {patients.slice(0,8).map(p => {
            const ac = adherenceColor(p.adherence);
            return (
              <button key={p.id} onClick={() => setSelectedId(p.id)}
                style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"8px 14px", borderRadius:12, background:isDark?"#1e293b":"#fff", border:`1.5px solid ${ac}30`, cursor:"pointer", transition:"all .2s ease", fontFamily:"'Plus Jakarta Sans',sans-serif" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=ac; e.currentTarget.style.background=`${ac}0a`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=`${ac}30`; e.currentTarget.style.background=isDark?"#1e293b":"#fff"; }}>
                <div style={{ width:22, height:22, borderRadius:7, background:`${ac}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8.5, fontWeight:800, color:ac }}>{initials(p.name)}</div>
                <span style={{ fontSize:12, fontWeight:700, color:isDark?"#f1f5f9":"#0B1E33" }}>{p.name.split(" ")[0]}</span>
                {p.hasProtocol && <CheckCircle2 size={11} color="#22c55e"/>}
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
        <div className="tp-card" style={{ animation:"tpCardPop .50s cubic-bezier(.22,1,.36,1) .05s both" }}>
          <div className="tp-section-title"><span className="icon-wrap"><Gamepad2 size={15}/></span>Game Selection</div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {GAMES.map(g => (
              <button key={g.value}
                className={`tp-game-card ${game===g.value?"active":""}`}
                style={{ "--gc-a":g.accentFaint, "--gc-border":g.accent+"80", "--gc-ring":g.accent+"18" } as React.CSSProperties}
                onClick={() => { setGame(g.value); setLevelIdx(0); }}>
                <div style={{ width:48, height:48, borderRadius:14, flexShrink:0, background:game===g.value?g.accentFaint:isDark?"#334155":"#f1f5f9", border:`2px solid ${game===g.value?g.accent+"60":isDark?"#475569":"#e2e8f0"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, transition:"all .2s ease" }}>
                  {g.emoji}
                </div>
                <div style={{ flex:1, textAlign:"left" }}>
                  <div style={{ fontSize:14, fontWeight:800, color:isDark?"#f1f5f9":"#0B1E33", marginBottom:3 }}>{g.label}</div>
                  <div className="mono" style={{ fontSize:9, color:game===g.value?g.accent:"#94a3b8", textTransform:"uppercase", letterSpacing:".12em" }}>{g.tag}</div>
                </div>
                {game===g.value && (
                  <div style={{ width:24, height:24, borderRadius:"50%", background:g.accent, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 0 12px ${g.accent}60` }}>
                    <Check size={13} color="#fff" strokeWidth={3}/>
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="tp-benefit" style={{ marginTop:16 }}>
            <div className="tp-benefit-label">Medical Benefit:</div>
            <div className="tp-benefit-text">{selectedGame.benefit}</div>
          </div>
        </div>

        {/* Level Selection */}
        <div className="tp-card" style={{ animation:"tpCardPop .50s cubic-bezier(.22,1,.36,1) .10s both" }}>
          <div className="tp-section-title">
            <span className="icon-wrap" style={{ background:`${selectedGame.accentFaint}`, color:selectedGame.accent }}><Waves size={15}/></span>
            Level Selection
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {levelLabels.map((label, i) => (
              <button key={i} className={`tp-level-pill ${levelIdx===i?"active":""}`}
                style={{ animationDelay:`${i*.06}s`, display:"flex", alignItems:"center", gap:10, textAlign:"left" }}
                onClick={() => setLevelIdx(i)}>
                <div style={{ width:28, height:28, borderRadius:8, background:levelIdx===i?`${selectedGame.accent}20`:"rgba(148,163,184,.10)", border:`1.5px solid ${levelIdx===i?selectedGame.accent+"60":"rgba(226,232,240,.8)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:11, fontWeight:800, color:levelIdx===i?selectedGame.accent:"#94a3b8" }}>
                  {i+1}
                </div>
                <span>{label}</span>
                {levelIdx===i && <CheckCircle2 size={14} color={selectedGame.accent} style={{ marginLeft:"auto" }}/>}
              </button>
            ))}
          </div>
          <p style={{ fontSize:11.5, color:isDark?"#94a3b8":"#64748b", marginTop:12, lineHeight:1.65, padding:"10px 14px", background:isDark?"rgba(30,41,59,.6)":"rgba(240,244,248,.8)", borderRadius:10, border:isDark?"1px solid #334155":"1px solid rgba(226,232,240,.8)" }}>
            {game==="synapse_racer"
              ? levelIdx===0 ? "Level 1 — Motor Baseline: single gold pearl, forgiving pressure, slower scroll. Perfect for initial assessment."
                             : "Level 2 — Cognitive Dual-Task: blue targets + red decoys, strict pressure fail conditions, faster scroll speed."
              : `${levelLabels[levelIdx]}: Sequence length increases with level. Higher levels add time pressure and reduced visual cues.`}
          </p>
        </div>

        {/* Hardware Calibration */}
        <div className="tp-card" style={{ animation:"tpCardPop .50s cubic-bezier(.22,1,.36,1) .15s both" }}>
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
              <div style={{ fontSize:13, fontWeight:700, color:isDark?"#f1f5f9":"#0B1E33" }}>Grip Sensitivity (MVC)</div>
              <span className="mono" style={{ fontSize:14, fontWeight:800, color:"#2DD4BF" }}>{gripForce}%</span>
            </div>
            <input type="range" min={5} max={100} value={gripForce} className="tp-slider teal"
              style={{"--val":`${gripForce}%`} as React.CSSProperties}
              onChange={e => setGripForce(Number(e.target.value))}/>
            <p style={{ fontSize:11.5, color:isDark?"#94a3b8":"#64748b", marginTop:7, lineHeight:1.6 }}>
              % of Maximum Voluntary Contraction required to activate game input. Lower = more sensitive.
            </p>
          </div>
          <Toggle on={tremor} onChange={() => setTremor(v=>!v)} label="Tremor Filter" sub="Active stabilization to reduce tremor artifacts"/>
        </div>

        {/* Session Settings */}
        <div className="tp-card" style={{ animation:"tpCardPop .50s cubic-bezier(.22,1,.36,1) .20s both" }}>
          <div className="tp-section-title"><span className="icon-wrap" style={{ background:"rgba(99,102,241,.10)", color:"#6366f1" }}><Brain size={15}/></span>Session Settings</div>
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
              <span style={{ fontSize:13, color:isDark?"#94a3b8":"#64748b", fontWeight:500 }}>sessions / week</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:isDark?"#f1f5f9":"#0B1E33", marginBottom:12 }}>Assistance Cues</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <Toggle on={audioHints} onChange={() => setAudioHints(v=>!v)} label="Audio Hints" sub="Voice prompts and sound cues during gameplay"/>
              <Toggle on={visualGuides} onChange={() => setVisualGuides(v=>!v)} label="Visual Path Guides" sub="Overlay guides to assist target navigation"/>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
        {/* Live Preview */}
        <div className="tp-card" style={{ animation:"tpCardPop .50s cubic-bezier(.22,1,.36,1) .07s both", position:"sticky", top:20 }}>
          <div className="tp-section-title">
            <span className="icon-wrap" style={{ background:`${selectedGame.accentFaint}`, color:selectedGame.accent }}><Zap size={15}/></span>
            Live Game Preview
            <div className="mono" style={{ marginLeft:"auto", fontSize:8.5, color:"rgba(45,212,191,.7)", background:"rgba(45,212,191,.08)", border:"1px solid rgba(45,212,191,.20)", borderRadius:8, padding:"2px 9px", display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:"#2DD4BF", animation:"tpDot 2s ease-in-out infinite" }}/>
              LIVE
            </div>
          </div>

          {/* Render the right preview for the selected game */}
          {game === "synapse_racer"
            ? <SynapsePreviewCanvas pressure={Math.round(pressure)} hand={hand==="right"?"Right":"Left"} level={levelIdx}/>
            : <MemoryGatePreview level={levelIdx}/>}

          {/* Protocol Summary */}
          <div style={{ marginTop:16, padding:"14px 16px", background:isDark?"rgba(30,41,59,.80)":"rgba(240,244,248,.8)", borderRadius:14, border:isDark?"1px solid #334155":"1px solid rgba(226,232,240,.8)" }}>
            <div className="mono" style={{ fontSize:9, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".14em", marginBottom:10, fontWeight:700 }}>Protocol Summary</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"7px 14px" }}>
              {[
                { label:"Game", val:selectedGame.label },
                { label:"Hand", val:`${hand.charAt(0).toUpperCase()+hand.slice(1)} Hand` },
                { label:"Input", val:inputSrc==="bp"?"BP Bulb":"IMU Motion" },
                { label:"Sensitivity", val:`${gripForce}% MVC` },
                { label:"Level", val:levelLabels[levelIdx] },
                { label:"Duration", val:`${duration} min` },
                { label:"Sessions/wk", val:String(sessionsPerWeek) },
              ].map(row => (
                <div key={row.label}>
                  <div className="mono" style={{ fontSize:8.5, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".10em" }}>{row.label}</div>
                  <div style={{ fontSize:12.5, fontWeight:700, color:isDark?"#f1f5f9":"#0B1E33", marginTop:1 }}>{row.val}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="tp-btn-row" style={{ display:"flex", gap:9, marginTop:14 }}>
            <button className="tp-btn-preview"><Play size={15} fill="currentColor" style={{ position:"relative", zIndex:2 }}/><span style={{ position:"relative", zIndex:2 }}>Preview</span></button>
            <button className="tp-btn-assign" onClick={handleAssign} disabled={savedState==="saving"}>
              {savedState==="saving"
                ? <div style={{ width:15, height:15, border:"2.5px solid rgba(255,255,255,.25)", borderTopColor:"#fff", borderRadius:"50%", animation:"tpSpin .75s linear infinite" }}/>
                : <Send size={14} style={{ position:"relative", zIndex:2 }}/>}
              <span style={{ position:"relative", zIndex:2 }}>
                {savedState==="saving" ? "Assigning…" : `Assign to ${patient?.name.split(" ")[0]}`}
              </span>
            </button>
          </div>
          {savedState==="saved" && (
            <div className="tp-saved-badge" style={{ marginTop:12, width:"100%", justifyContent:"center" }}>
              <CheckCircle2 size={16} color="#15803d"/> Protocol assigned to {patient?.name.split(" ")[0]}!
            </div>
          )}
        </div>

        {/* Saved Templates */}
        <div className="tp-card" style={{ animation:"tpCardPop .50s cubic-bezier(.22,1,.36,1) .17s both" }}>
          <div className="tp-section-title"><span className="icon-wrap" style={{ background:"rgba(99,102,241,.10)", color:"#6366f1" }}><BookOpen size={15}/></span>Saved Protocol Templates</div>
          {savedTemplates.length===0 ? (
            <p style={{ fontSize:13, color:"#94a3b8", textAlign:"center", padding:"16px 0" }}>No templates yet — assign protocols to create templates.</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              {savedTemplates.map((proto, i) => (
                <div key={proto.name} className="tp-protocol-item" style={{ animationDelay:`${.22+i*.07}s` }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:isDark?"#f1f5f9":"#0B1E33" }}>{proto.name}</span>
                    <div style={{ width:22, height:22, borderRadius:"50%", background:"rgba(45,212,191,.10)", border:"1px solid rgba(45,212,191,.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
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
        <div style={{ position:"absolute", top:"-8%", right:"6%", width:650, height:650, background:"radial-gradient(circle,rgba(45,212,191,.05),transparent 65%)", borderRadius:"50%" }}/>
        <div style={{ position:"absolute", bottom:"-10%", left:"4%", width:550, height:550, background:"radial-gradient(circle,rgba(99,102,241,.04),transparent 65%)", borderRadius:"50%" }}/>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(11,30,51,.020) 1px,transparent 1px),linear-gradient(90deg,rgba(11,30,51,.020) 1px,transparent 1px)", backgroundSize:"52px 52px" }}/>
      </div>

      <div className="tp-outer" style={{ maxWidth:1340, margin:"0 auto", padding:"28px 24px", position:"relative", zIndex:1 }}>
        {/* Header */}
        <div style={{ marginBottom:24, animation:"tpFadeUp .50s ease both", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
          <div>
            <p className="mono" style={{ fontSize:9, color:"rgba(45,212,191,.72)", textTransform:"uppercase", letterSpacing:".22em", marginBottom:5, fontWeight:600 }}>Neuro-Rehabilitation</p>
            <h1 style={{ fontSize:"clamp(1.5rem,2.8vw,2rem)", fontWeight:800, color:isDark?"#f1f5f9":"#0B1E33", margin:0, lineHeight:1.15 }}>
              Therapy Protocols &amp; <span style={{ color:"#2DD4BF" }}>Game Config</span>
            </h1>
            <p style={{ fontSize:13.5, color:isDark?"#94a3b8":"#64748b", marginTop:5, fontWeight:500 }}>
              {patient ? <>Configuring protocol for <span style={{ color:"#6366f1", fontWeight:800 }}>{patient.name}</span> · {patient.condition}</> : "Select a patient from the sidebar to configure their protocol"}
            </p>
          </div>
          <Link href="/doctor/patients" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"9px 18px", borderRadius:12, background:isDark?"#1e293b":"#fff", border:isDark?"1.5px solid #334155":"1.5px solid rgba(226,232,240,.9)", fontSize:13, fontWeight:700, color:isDark?"#94a3b8":"#64748b", textDecoration:"none" }}>
            <ArrowLeft size={14}/> Back to Patients
          </Link>
        </div>

        <div className="tp-outer-layout">
          {/* Sidebar */}
          <div className="tp-sidebar-wrap" style={{ width:275, flexShrink:0, background:isDark?"#1e293b":"#fff", borderRadius:20, border:isDark?"1px solid #334155":"1px solid rgba(226,232,240,.9)", boxShadow:isDark?"0 2px 20px rgba(0,0,0,.25)":"0 2px 20px rgba(11,30,51,.06)", overflow:"hidden", display:"flex", flexDirection:"column", position:"sticky", top:20, maxHeight:"calc(100vh - 60px)" }}>
            <div style={{ padding:"16px 15px 12px", borderBottom:isDark?"1px solid #334155":"1px solid rgba(226,232,240,.8)", background:isDark?"linear-gradient(135deg,#1e293b,#1a1f35)":"linear-gradient(135deg,#f8f7ff,#f0effe)", flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:12 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:"rgba(99,102,241,.10)", display:"flex", alignItems:"center", justifyContent:"center", color:"#6366f1" }}><Users size={15}/></div>
                <div>
                  <div style={{ fontSize:13.5, fontWeight:800, color:isDark?"#f1f5f9":"#0B1E33" }}>All Patients</div>
                  <div className="mono" style={{ fontSize:8.5, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".12em" }}>
                    {patientsLoading ? "Loading…" : `${protocolSet.size}/${patients.length} protocols set`}
                  </div>
                </div>
              </div>
              <div style={{ height:4, background:"rgba(99,102,241,.10)", borderRadius:99, overflow:"hidden", marginBottom:12 }}>
                <div style={{ height:"100%", borderRadius:99, width:patients.length?`${(protocolSet.size/patients.length)*100}%`:"0%", background:"linear-gradient(90deg,#6366f1,#8b5cf6)", transition:"width .8s cubic-bezier(.22,1,.36,1)" }}/>
              </div>
              <div style={{ position:"relative" }}>
                <Search size={13} color="#94a3b8" style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                <input value={sidebarSearch} onChange={e => setSidebarSearch(e.target.value)} placeholder="Search patients…"
                  style={{ width:"100%", padding:"8px 10px 8px 30px", background:isDark?"#334155":"rgba(240,244,248,.9)", border:isDark?"1px solid #475569":"1px solid rgba(226,232,240,.9)", borderRadius:10, fontSize:12, color:isDark?"#f1f5f9":"#0B1E33", outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif" }}/>
              </div>
            </div>
            <div className="tp-sidebar-scroll" style={{ flex:1, overflowY:"auto", padding:"8px" }}>
              {patientsLoading ? (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 0", gap:8 }}>
                  <div style={{ width:16, height:16, border:"2px solid rgba(45,212,191,.3)", borderTopColor:"#2DD4BF", borderRadius:"50%", animation:"tpSpin 1s linear infinite" }}/>
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
                      <div style={{ position:"absolute", bottom:-2, right:-2, width:12, height:12, borderRadius:"50%", background:hasP?"#22c55e":isDark?"#1e293b":"#fff", border:hasP?"none":`2.5px solid ${sc}`, boxShadow:hasP?"0 0 4px rgba(34,197,94,.6)":"none" }}/>
                    </div>
                    <div style={{ flex:1, minWidth:0, textAlign:"left" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:4 }}>
                        <span style={{ fontSize:12.5, fontWeight:700, color:isDark?"#f1f5f9":"#0B1E33", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:108 }}>{p.name}</span>
                        <MiniBar value={p.adherence} color={ac}/>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:2 }}>
                        <span className="mono" style={{ fontSize:8.5, color:"#6366f1", background:"rgba(99,102,241,.08)", padding:"1px 5px", borderRadius:5 }}>{p.pid}</span>
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
          <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", animation:"tpFadeUp .50s ease .06s both" }}>
            {patient && (
              <div style={{ marginBottom:18, background:"#0B1E33", borderRadius:18, padding:"16px 22px", display:"flex", alignItems:"center", gap:16, boxShadow:"0 8px 32px rgba(11,30,51,.18)", position:"relative", overflow:"hidden", flexWrap:"wrap" }}>
                <div style={{ position:"absolute", inset:0, pointerEvents:"none", backgroundImage:"linear-gradient(rgba(45,212,191,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(45,212,191,.04) 1px,transparent 1px)", backgroundSize:"28px 28px" }}/>
                <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
                  <div style={{ position:"absolute", left:0, right:0, height:"18%", background:"linear-gradient(to bottom,transparent,rgba(45,212,191,.05),transparent)", animation:"tpScanLine 5s linear infinite" }}/>
                </div>
                <div style={{ position:"relative", zIndex:2, flexShrink:0 }}>
                  <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${adherenceColor(patient.adherence)},${adherenceColor(patient.adherence)}aa)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#fff", boxShadow:`0 0 0 2.5px ${adherenceColor(patient.adherence)}40,0 4px 18px ${adherenceColor(patient.adherence)}30`, animation:"tpGlow 3s ease-in-out infinite" }}>
                    {initials(patient.name)}
                  </div>
                </div>
                <div style={{ position:"relative", zIndex:2, flex:1 }}>
                  <p className="mono" style={{ fontSize:8, color:"rgba(45,212,191,.60)", textTransform:"uppercase", letterSpacing:".22em", marginBottom:3 }}>Configuring Protocol For</p>
                  <div style={{ fontSize:16, fontWeight:800, color:"#fff" }}>{patient.name}</div>
                  <div style={{ display:"flex", gap:10, marginTop:5, flexWrap:"wrap" }}>
                    <span className="mono" style={{ fontSize:10, color:"#2DD4BF", background:"rgba(45,212,191,.12)", border:"1px solid rgba(45,212,191,.20)", padding:"1px 8px", borderRadius:6 }}>{patient.pid}</span>
                    <span style={{ fontSize:11.5, color:"rgba(255,255,255,.40)" }}>{patient.condition}</span>
                    <span style={{ fontSize:11.5, color:statusColor(patient.status), fontWeight:700 }}>{patient.status} Adherence · {patient.adherence}%</span>
                  </div>
                </div>
                <div style={{ position:"relative", zIndex:2, display:"flex", gap:9, flexWrap:"wrap" }}>
                  {patient.sub==="AI Companion"
                    ? <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(45,212,191,.10)", border:"1px solid rgba(45,212,191,.22)", borderRadius:11, padding:"7px 12px" }}><Bot size={12} color="#2DD4BF"/><span style={{ fontSize:11, fontWeight:700, color:"#2DD4BF" }}>AI Companion</span></div>
                    : <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.09)", borderRadius:11, padding:"7px 12px" }}><Shield size={12} color="rgba(255,255,255,.35)"/><span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.40)" }}>Standard</span></div>}
                  {protocolSet.has(patient.id) && (
                    <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(34,197,94,.10)", border:"1px solid rgba(34,197,94,.25)", borderRadius:11, padding:"7px 12px" }}>
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