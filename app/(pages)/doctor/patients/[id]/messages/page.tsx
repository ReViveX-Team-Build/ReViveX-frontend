'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Send, Search, Bot, User, MessageCircle,
  AlertCircle, Activity, Sparkles, FileText, Lock,
  CheckCircle2, Clock, ChevronRight, Zap, Shield,
  ToggleLeft, ToggleRight, Info, Star, Crown,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
type ActivePanel = 'chat' | 'instruction' | 'feedback' | 'ai_generate';

interface ChatMessage {
  sender: 'doctor' | 'patient';
  text:   string;
  time:   string;
}

interface SentItem {
  id:          string;
  type:        'instruction' | 'feedback' | 'ai_insight';
  title:       string;
  content:     string;
  time:        string;
  isImportant: boolean;
  sentByAI:    boolean;
}

/* ══════════════════════════════════════════════════════════
   PATIENT DATA
   Production: replace with getPatientsByDoctor(doctorId)
   from lib/db/users.ts
══════════════════════════════════════════════════════════ */
const PATIENTS: Record<string, {
  name: string; pid: string; status: string;
  condition: string; isAIPlan: boolean; adherence: number;
}> = {
  '1':  { name: 'P.B. De Silva',        pid: 'P001', status: 'Low',    condition: 'Stroke',       isAIPlan: false, adherence: 45  },
  '2':  { name: 'Anura Dissanayaka',    pid: 'P002', status: 'High',   condition: 'TBI',          isAIPlan: true,  adherence: 92  },
  '3':  { name: 'Isuri Alwis',          pid: 'P003', status: 'Medium', condition: 'Stroke',        isAIPlan: true,  adherence: 78  },
  '4':  { name: 'Shifani Ameena',       pid: 'P004', status: 'Medium', condition: 'Post-Surgery',  isAIPlan: false, adherence: 65  },
  '5':  { name: 'Percy Silva',          pid: 'P005', status: 'High',   condition: 'TBI',          isAIPlan: true,  adherence: 88  },
  '6':  { name: 'Athula Premachandra',  pid: 'P006', status: 'Low',    condition: 'Stroke',        isAIPlan: false, adherence: 52  },
  '7':  { name: 'Aruni Perera',         pid: 'P007', status: 'High',   condition: 'Post-Surgery',  isAIPlan: true,  adherence: 95  },
  '8':  { name: 'Amal Mahendra',        pid: 'P008', status: 'Medium', condition: 'TBI',          isAIPlan: false, adherence: 73  },
  '9':  { name: 'Malkanthi Peris',      pid: 'P009', status: 'Low',    condition: 'Stroke',        isAIPlan: false, adherence: 25  },
  '10': { name: 'K.K. Muththukumaran',  pid: 'P010', status: 'High',   condition: 'TBI',          isAIPlan: true,  adherence: 76  },
  '11': { name: 'Kamal Fernando',       pid: 'P011', status: 'High',   condition: 'Post-Surgery',  isAIPlan: true,  adherence: 80  },
  '12': { name: 'P.P. Sugathadasa',     pid: 'P012', status: 'High',   condition: 'Stroke',        isAIPlan: true,  adherence: 63  },
};

/* ── Seed chat messages ────────────────────────────────── */
const SEED_CHAT: Record<string, ChatMessage[]> = {
  '1': [
    { sender: 'patient', text: 'Good morning doctor.', time: '09:10' },
    { sender: 'doctor',  text: 'Good morning. How is your grip feeling today?', time: '09:12' },
    { sender: 'patient', text: 'A bit weak but I did the exercises.', time: '09:14' },
    { sender: 'doctor',  text: "Good effort. Let's keep the pressure moderate for now.", time: '09:16' },
  ],
  '2': [
    { sender: 'patient', text: "Doctor, I completed today's session!", time: '08:45' },
    { sender: 'doctor',  text: "Excellent work Anura! Your consistency is outstanding.", time: '08:50' },
    { sender: 'patient', text: 'The AI Companion really helps me stay on track.', time: '08:52' },
    { sender: 'doctor',  text: "Keep up the momentum — you're nearly at Level 3.", time: '08:55' },
  ],
};

function getSeedChat(id: string): ChatMessage[] {
  return SEED_CHAT[id] ?? [
    { sender: 'patient', text: "Hello doctor, checking in for today.", time: '10:00' },
    { sender: 'doctor',  text: "Hello! How are you feeling after yesterday's session?", time: '10:03' },
  ];
}

/* ── AI draft templates (mock — replace with /api/llm call) */
const AI_FEEDBACK_DRAFTS: Record<string, string> = {
  High:   "Outstanding progress this week. Your grip consistency metrics show a 14% improvement over baseline. Reaction time has dropped from 520ms to 420ms — a strong indicator of improving motor-neural coordination. Continue with the current protocol. You're on track to unlock Level 3 ahead of schedule.",
  Medium: "Steady progress noted across your recent sessions. Grip endurance is improving, though consistency during the latter half of sessions still shows a moderate drop (~18%). Focus on maintaining even pressure throughout. Consider hydrating well before each session.",
  Low:    "We've noticed a significant adherence drop this week. Your last three sessions show incomplete data, which makes it difficult to track recovery. Please prioritise completing your daily sessions — even partial sessions are valuable. I'd like to discuss this at our next check-in.",
};

const AI_INSTRUCTION_DRAFTS: Record<string, string> = {
  High:   "Effective immediately: increase protocol difficulty to High for right-hand exercises. Maintain the current session frequency of 5x per week. Target grip force should now reach 45–50N during peak phases. Report any wrist fatigue or pain above a 3/10 immediately.",
  Medium: "Adjusting your protocol for next week. Continue Level 2 sessions but increase duration from 15 to 20 minutes. Focus on the sustained-grip phase. Audio hints remain enabled. Visual guides may be turned off if you feel confident — this is optional.",
  Low:    "Urgent protocol review required. Reducing session intensity to Calibration level temporarily to re-establish baseline. Please complete at least 3 sessions this week at the reduced setting. Your next scheduled in-person evaluation is mandatory — confirm your attendance.",
};

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function statusColor(s: string) {
  if (s === 'High')   return '#22c55e';
  if (s === 'Medium') return '#f59e0b';
  return '#ef4444';
}
function adherenceColor(v: number) {
  if (v >= 80) return '#22c55e';
  if (v >= 55) return '#f97316';
  return '#ef4444';
}
function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('');
}

/* ══════════════════════════════════════════════════════════
   CSS
══════════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  .dm * { font-family:'Plus Jakarta Sans',system-ui,sans-serif; box-sizing:border-box; }
  .dm .mono { font-family:'JetBrains Mono',monospace; }

  @keyframes dmFadeUp {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes dmCardPop {
    0%   { opacity:0; transform:translateY(14px) scale(0.97); }
    100% { opacity:1; transform:translateY(0)    scale(1); }
  }
  @keyframes dmMsgIn {
    from { opacity:0; transform:translateY(10px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes dmShimmer {
    0%   { transform:translateX(-200%) skewX(-15deg); }
    100% { transform:translateX(400%)  skewX(-15deg); }
  }
  @keyframes dmDot {
    0%,100% { opacity:1; }
    50%     { opacity:0.28; }
  }
  @keyframes dmGlow {
    0%,100% { box-shadow:0 0 0 0 rgba(45,212,191,0.35); }
    50%     { box-shadow:0 0 0 9px rgba(45,212,191,0); }
  }
  @keyframes dmScanLine {
    0%   { top:-4%;  opacity:0; }
    6%   { opacity:1; }
    92%  { opacity:0.55; }
    100% { top:108%; opacity:0; }
  }
  @keyframes dmSpin {
    from { transform:rotate(0deg); }
    to   { transform:rotate(360deg); }
  }
  @keyframes dmBarFill {
    from { width:0%; }
    to   { width:var(--bw,0%); }
  }
  @keyframes dmAiPulse {
    0%,100% { box-shadow:0 0 0 0 rgba(99,102,241,0.40); }
    50%     { box-shadow:0 0 0 10px rgba(99,102,241,0); }
  }
  @keyframes dmSentPop {
    0%   { opacity:0; transform:scale(0.82) translateY(14px); }
    70%  { transform:scale(1.04); }
    100% { opacity:1; transform:scale(1) translateY(0); }
  }

  /* ── Sidebar patient button ─────────────────────────── */
  .dm-patient-btn {
    width:100%; text-align:left; background:none; border:none;
    padding:10px 12px; border-radius:14px; cursor:pointer;
    transition:all 0.2s ease; display:flex; align-items:center; gap:10px;
  }
  .dm-patient-btn:hover { background:rgba(45,212,191,0.07); }
  .dm-patient-btn.active {
    background:linear-gradient(135deg,rgba(45,212,191,0.14),rgba(8,145,178,0.08));
    border:1px solid rgba(45,212,191,0.24);
  }

  /* ── Panel action tabs ──────────────────────────────── */
  .dm-tab {
    flex:1; display:flex; flex-direction:column; align-items:center;
    gap:5px; padding:11px 8px; border-radius:14px; border:none;
    cursor:pointer; transition:all 0.22s ease;
    font-family:'Plus Jakarta Sans',sans-serif;
    position:relative; overflow:hidden;
  }
  .dm-tab:hover { transform:translateY(-2px); }
  .dm-tab.active::after {
    content:''; position:absolute; bottom:0; left:20%; right:20%;
    height:2.5px; border-radius:99px;
    background:currentColor; opacity:0.55;
  }

  /* ── Chat bubbles ───────────────────────────────────── */
  .dm-bubble-doc {
    background:#fff; color:#0B1E33;
    border:1.5px solid rgba(226,232,240,0.9);
    border-radius:18px 18px 18px 4px;
    padding:11px 15px; max-width:74%;
    box-shadow:0 2px 10px rgba(11,30,51,0.055);
    animation:dmMsgIn 0.28s cubic-bezier(0.22,1,0.36,1) both;
  }
  .dm-bubble-pat {
    background:linear-gradient(135deg,#2DD4BF,#0891b2);
    color:#0B1E33; border-radius:18px 18px 4px 18px;
    padding:11px 15px; max-width:74%;
    box-shadow:0 4px 16px rgba(45,212,191,0.28);
    animation:dmMsgIn 0.28s cubic-bezier(0.22,1,0.36,1) both;
    position:relative; overflow:hidden;
  }
  .dm-bubble-pat::before {
    content:''; position:absolute; inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent);
    animation:dmShimmer 4s ease-in-out infinite;
  }

  /* ── Send button ────────────────────────────────────── */
  .dm-send-btn {
    width:42px; height:42px; border-radius:13px; border:none; cursor:pointer;
    background:linear-gradient(135deg,#2DD4BF,#0891b2);
    color:#0B1E33; display:flex; align-items:center; justify-content:center;
    box-shadow:0 4px 14px rgba(45,212,191,0.32);
    transition:all 0.22s ease; flex-shrink:0;
    animation:dmGlow 3s ease-in-out infinite;
  }
  .dm-send-btn:hover { transform:scale(1.08) translateY(-2px); }
  .dm-send-btn:active { transform:scale(0.95); }
  .dm-send-btn:disabled { background:rgba(226,232,240,0.9); box-shadow:none; cursor:default; animation:none; }

  /* ── Text inputs ────────────────────────────────────── */
  .dm-input {
    flex:1; padding:11px 14px;
    background:rgba(240,244,248,0.85);
    border:1.5px solid rgba(226,232,240,0.9);
    border-radius:13px; font-size:13px; font-weight:500; color:#0B1E33;
    outline:none; transition:all 0.2s ease;
    font-family:'Plus Jakarta Sans',sans-serif;
  }
  .dm-input::placeholder { color:#94a3b8; }
  .dm-input:focus {
    background:#fff;
    border-color:rgba(45,212,191,0.50);
    box-shadow:0 0 0 3px rgba(45,212,191,0.10);
  }
  .dm-textarea {
    width:100%; padding:13px 14px;
    background:rgba(240,244,248,0.75);
    border:1.5px solid rgba(226,232,240,0.9);
    border-radius:14px; font-size:13px; line-height:1.68;
    font-weight:500; color:#0B1E33; outline:none;
    resize:none; transition:all 0.2s ease;
    font-family:'Plus Jakarta Sans',sans-serif;
  }
  .dm-textarea::placeholder { color:#94a3b8; }
  .dm-textarea:focus {
    background:#fff;
    border-color:rgba(45,212,191,0.50);
    box-shadow:0 0 0 3px rgba(45,212,191,0.10);
  }
  .dm-title-input {
    width:100%; padding:11px 14px;
    background:rgba(240,244,248,0.75);
    border:1.5px solid rgba(226,232,240,0.9);
    border-radius:13px; font-size:13.5px; font-weight:700; color:#0B1E33;
    outline:none; transition:all 0.2s ease;
    font-family:'Plus Jakarta Sans',sans-serif;
  }
  .dm-title-input::placeholder { color:#94a3b8; font-weight:500; }
  .dm-title-input:focus {
    background:#fff;
    border-color:rgba(45,212,191,0.50);
    box-shadow:0 0 0 3px rgba(45,212,191,0.10);
  }

  /* ── Compose send button ────────────────────────────── */
  .dm-compose-btn {
    display:flex; align-items:center; justify-content:center; gap:8px;
    padding:13px 22px; border-radius:14px; border:none; cursor:pointer;
    font-size:13px; font-weight:800; letter-spacing:0.04em;
    transition:all 0.24s ease; position:relative; overflow:hidden;
    font-family:'Plus Jakarta Sans',sans-serif;
  }
  .dm-compose-btn::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent);
    animation:dmShimmer 3s ease-in-out infinite;
  }
  .dm-compose-btn:hover { transform:translateY(-2px); }
  .dm-compose-btn:active { transform:scale(0.97); }

  /* ── AI generate button ─────────────────────────────── */
  .dm-ai-btn {
    display:flex; align-items:center; justify-content:center; gap:8px;
    padding:11px 18px; border-radius:13px; cursor:pointer;
    font-size:12px; font-weight:800; letter-spacing:0.04em;
    border:1.5px solid rgba(99,102,241,0.30);
    background:rgba(99,102,241,0.07); color:#6366f1;
    transition:all 0.22s ease;
    font-family:'Plus Jakarta Sans',sans-serif;
  }
  .dm-ai-btn:hover {
    background:rgba(99,102,241,0.14);
    border-color:rgba(99,102,241,0.50);
    transform:translateY(-1px);
  }

  /* ── Toggle switch ──────────────────────────────────── */
  .dm-toggle {
    display:flex; align-items:center; gap:8px; cursor:pointer;
    background:none; border:none; padding:0;
    font-family:'Plus Jakarta Sans',sans-serif;
  }

  /* ── Sent item badge ────────────────────────────────── */
  .dm-sent-item {
    padding:12px 16px; border-radius:14px;
    border:1.5px solid rgba(226,232,240,0.9);
    background:#fafbfd;
    animation:dmSentPop 0.4s cubic-bezier(0.22,1,0.36,1) both;
    position:relative; overflow:hidden;
  }

  /* ── Scrollbars ─────────────────────────────────────── */
  .dm-msgs::-webkit-scrollbar { width:3px; }
  .dm-msgs::-webkit-scrollbar-thumb { background:rgba(45,212,191,0.22); border-radius:99px; }
  .dm-sidebar::-webkit-scrollbar { width:3px; }
  .dm-sidebar::-webkit-scrollbar-thumb { background:rgba(45,212,191,0.18); border-radius:99px; }
  .dm-compose-scroll::-webkit-scrollbar { width:3px; }
  .dm-compose-scroll::-webkit-scrollbar-thumb { background:rgba(45,212,191,0.18); border-radius:99px; }

  /* ── AI locked overlay ──────────────────────────────── */
  .dm-premium-lock {
    position:absolute; inset:0; border-radius:inherit;
    background:rgba(248,247,255,0.92);
    backdrop-filter:blur(3px);
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    gap:10px; z-index:10;
  }

  @media (max-width:820px) {
    .dm-sidebar-wrap { display:none !important; }
    .dm-main-col { border-radius:20px !important; }
  }
  @media (max-width:600px) {
    .dm { padding:14px !important; gap:12px !important; }
    .dm-tab span.dm-tab-label { display:none !important; }
  }
`;

/* ══════════════════════════════════════════════════════════
   ANIMATED ADHERENCE BAR
══════════════════════════════════════════════════════════ */
function MiniBar({ value, color }: { value: number; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 200); return () => clearTimeout(t); }, [value]);
  return (
    <div style={{ width: 46, height: 4, background: 'rgba(11,30,51,0.08)', borderRadius: 99, overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ height: '100%', borderRadius: 99, width: `${w}%`, background: color, transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)' }} />
    </div>
  );
}