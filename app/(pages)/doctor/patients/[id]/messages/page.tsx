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

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function DoctorMessagingHub() {
  const { id } = useParams();
  const initId  = Array.isArray(id) ? id[0] : (id ?? '1');

  /* ── State ──────────────────────────────────────────── */
  const [selectedId, setSelectedId]     = useState(initId);
  const [panel,      setPanel]          = useState<ActivePanel>('chat');
  const [search,     setSearch]         = useState('');
  const [mounted,    setMounted]        = useState(false);

  // Chat state
  const [chatMap, setChatMap] = useState<Record<string, ChatMessage[]>>(() => {
    const m: Record<string, ChatMessage[]> = {};
    Object.keys(PATIENTS).forEach(k => { m[k] = getSeedChat(k); });
    return m;
  });
  const [chatInput, setChatInput] = useState('');

  // Compose — instruction
  const [instrTitle,     setInstrTitle]     = useState('');
  const [instrContent,   setInstrContent]   = useState('');
  const [instrImportant, setInstrImportant] = useState(false);
  const [instrSent,      setInstrSent]      = useState<Record<string, SentItem[]>>({});

  // Compose — feedback
  const [fbTitle,     setFbTitle]     = useState('');
  const [fbContent,   setFbContent]   = useState('');
  const [fbImportant, setFbImportant] = useState(false);
  const [fbSent,      setFbSent]      = useState<Record<string, SentItem[]>>({});

  // AI generate
  const [aiMode,      setAiMode]      = useState<'feedback' | 'instruction'>('feedback');
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiDraft,     setAiDraft]     = useState('');
  const [aiTitle,     setAiTitle]     = useState('');
  const [aiSent,      setAiSent]      = useState<Record<string, SentItem[]>>({});

  const chatEndRef   = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMap, selectedId]);

  // Reset compose fields on patient switch
  useEffect(() => {
    setInstrTitle(''); setInstrContent(''); setInstrImportant(false);
    setFbTitle(''); setFbContent(''); setFbImportant(false);
    setAiDraft(''); setAiTitle('');
  }, [selectedId]);

  /* ── Derived ───────────────────────────────────────── */
  const patient     = PATIENTS[selectedId] ?? PATIENTS['1'];
  const sColor      = statusColor(patient.status);
  const aColor      = adherenceColor(patient.adherence);
  const chatMsgs    = chatMap[selectedId] ?? [];
  const canUseAI    = patient.isAIPlan;

  const filteredPats = Object.entries(PATIENTS).filter(([, p]) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.pid.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Handlers ──────────────────────────────────────── */
  const sendChat = () => {
    if (!chatInput.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMap(prev => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] ?? []), { sender: 'doctor', text: chatInput.trim(), time }],
    }));
    setChatInput('');
    setTimeout(() => chatInputRef.current?.focus(), 50);
    // Production: sendFromDoctor(doctorId, selectedId, 'direct_message', 'Direct Message', chatInput)
  };
  const handleChatKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
  };

  const sendInstruction = () => {
    if (!instrTitle.trim() || !instrContent.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const item: SentItem = { id: Date.now().toString(), type: 'instruction', title: instrTitle, content: instrContent, time, isImportant: instrImportant, sentByAI: false };
    setInstrSent(prev => ({ ...prev, [selectedId]: [item, ...(prev[selectedId] ?? [])] }));
    setInstrTitle(''); setInstrContent(''); setInstrImportant(false);
    // Production: sendFromDoctor(doctorId, selectedId, 'instruction', instrTitle, instrContent, instrImportant)
  };

  const sendFeedback = () => {
    if (!fbTitle.trim() || !fbContent.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const item: SentItem = { id: Date.now().toString(), type: 'feedback', title: fbTitle, content: fbContent, time, isImportant: fbImportant, sentByAI: false };
    setFbSent(prev => ({ ...prev, [selectedId]: [item, ...(prev[selectedId] ?? [])] }));
    setFbTitle(''); setFbContent(''); setFbImportant(false);
    // Production: sendFromDoctor(doctorId, selectedId, 'feedback', fbTitle, fbContent, fbImportant)
  };

  const generateAI = useCallback(() => {
    if (!canUseAI) return;
    setAiLoading(true);
    setAiDraft('');
    setAiTitle('');
    // Mock Gemini call — replace with: fetch('/api/llm', { method:'POST', body: JSON.stringify({ patientId: selectedId, type: aiMode }) })
    setTimeout(() => {
      const draft = aiMode === 'feedback'
        ? AI_FEEDBACK_DRAFTS[patient.status]
        : AI_INSTRUCTION_DRAFTS[patient.status];
      const title = aiMode === 'feedback'
        ? `AI Feedback — ${patient.name.split(' ')[0]} (${new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short' })})`
        : `AI Protocol Note — ${patient.name.split(' ')[0]}`;
      setAiDraft(draft);
      setAiTitle(title);
      setAiLoading(false);
    }, 2200);
  }, [canUseAI, aiMode, patient.status, patient.name]);

  const sendAiDraft = () => {
    if (!aiDraft.trim() || !aiTitle.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const item: SentItem = { id: Date.now().toString(), type: aiMode === 'feedback' ? 'feedback' : 'instruction', title: aiTitle, content: aiDraft, time, isImportant: false, sentByAI: true };
    setAiSent(prev => ({ ...prev, [selectedId]: [item, ...(prev[selectedId] ?? [])] }));
    setAiDraft(''); setAiTitle('');
    // Production: sendFromDoctor(doctorId, selectedId, aiMode === 'feedback' ? 'ai_insight' : 'instruction', aiTitle, aiDraft)
  };

  if (!mounted) return null;

  /* ══════════════════════════════════════════════════════
     PANEL RENDERS
  ══════════════════════════════════════════════════════ */

  /* ── CHAT PANEL ──────────────────────────────────────── */
  const ChatPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div className="dm-msgs" style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <span className="mono" style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.14em', background: 'rgba(240,244,248,0.9)', padding: '3px 12px', borderRadius: 99 }}>Today</span>
        </div>
        {chatMsgs.map((msg, i) => {
          const isDoc = msg.sender === 'doctor';
          return (
            <div key={i} style={{ display: 'flex', justifyContent: isDoc ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end', animationDelay: `${i * 0.03}s` }}>
              {!isDoc && (
                <div style={{ width: 28, height: 28, borderRadius: 9, background: `${aColor}22`, border: `1.5px solid ${aColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: aColor, flexShrink: 0 }}>
                  {initials(patient.name)}
                </div>
              )}
              <div className={isDoc ? 'dm-bubble-doc' : 'dm-bubble-pat'} style={{ animationDelay: `${i * 0.04}s` }}>
                <p style={{ fontSize: 13.5, lineHeight: 1.62, margin: 0, position: 'relative', zIndex: 1 }}>{msg.text}</p>
                <p className="mono" style={{ fontSize: 9, marginTop: 5, textAlign: 'right', position: 'relative', zIndex: 1, color: isDoc ? '#94a3b8' : 'rgba(11,30,51,0.45)' }}>{msg.time}</p>
              </div>
              {isDoc && (
                <div style={{ width: 28, height: 28, borderRadius: 9, background: 'linear-gradient(135deg,#2DD4BF,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#0B1E33', flexShrink: 0 }}>
                  SJ
                </div>
              )}
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Chat input */}
      <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(226,232,240,0.8)', background: '#fafbfd', display: 'flex', alignItems: 'center', gap: 9 }}>
        <input
          ref={chatInputRef}
          className="dm-input"
          type="text"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={handleChatKey}
          placeholder={`Direct message to ${patient.name.split(' ')[0]}...`}
        />
        <button className="dm-send-btn" onClick={sendChat} disabled={!chatInput.trim()}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );

  /* ── COMPOSE SHARED INNER ───────────────────────────── */
  const ComposeForm = ({
    typeLabel, typeColor, typeBg,
    title, setTitle, content, setContent,
    important, setImportant, onSend,
    sentItems, hint,
  }: {
    typeLabel: string; typeColor: string; typeBg: string;
    title: string; setTitle: (v: string) => void;
    content: string; setContent: (v: string) => void;
    important: boolean; setImportant: (v: boolean) => void;
    onSend: () => void; sentItems: SentItem[]; hint: string;
  }) => (
    <div className="dm-compose-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Hint */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '10px 14px', background: `${typeColor}08`, border: `1px solid ${typeColor}28`, borderRadius: 12 }}>
        <Info size={13} color={typeColor} style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.6 }}>{hint}</p>
      </div>

      {/* Title field */}
      <div>
        <label className="mono" style={{ display: 'block', fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 7 }}>
          Title
        </label>
        <input
          className="dm-title-input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={`e.g. ${typeLabel === 'Instruction' ? 'Protocol Adjustment — Week 4' : 'Weekly Progress Summary'}`}
        />
      </div>

      {/* Content field */}
      <div>
        <label className="mono" style={{ display: 'block', fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 7 }}>
          Content
        </label>
        <textarea
          className="dm-textarea"
          rows={6}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={`Write your ${typeLabel.toLowerCase()} for ${patient.name.split(' ')[0]}...`}
        />
      </div>

      {/* Options row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        {/* Important toggle */}
        <button className="dm-toggle" onClick={() => setImportant(!important)}>
          {important
            ? <ToggleRight size={22} color={typeColor} />
            : <ToggleLeft  size={22} color="#cbd5e1" />
          }
          <span style={{ fontSize: 12.5, fontWeight: 700, color: important ? typeColor : '#94a3b8' }}>
            Mark as Important
          </span>
          {important && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 99, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', fontSize: 9, fontWeight: 800, color: '#ef4444', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.10em' }}>
              <AlertCircle size={8} />IMPORTANT
            </span>
          )}
        </button>

        {/* Send button */}
        <button
          className="dm-compose-btn"
          onClick={onSend}
          disabled={!title.trim() || !content.trim()}
          style={{
            background: title.trim() && content.trim()
              ? `linear-gradient(135deg,${typeColor},${typeColor}cc)`
              : 'rgba(226,232,240,0.9)',
            color: title.trim() && content.trim() ? '#fff' : '#94a3b8',
            boxShadow: title.trim() && content.trim() ? `0 6px 22px ${typeColor}38` : 'none',
          }}
        >
          <Send size={14} style={{ position: 'relative', zIndex: 1 }} />
          <span style={{ position: 'relative', zIndex: 1 }}>Send {typeLabel}</span>
        </button>
      </div>

      {/* Sent history */}
      {sentItems.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div className="mono" style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10, fontWeight: 700 }}>
            Sent This Session
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sentItems.map(item => (
              <div key={item.id} className="dm-sent-item">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <CheckCircle2 size={13} color={typeColor} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0B1E33' }}>{item.title}</span>
                    {item.isImportant && (
                      <span style={{ padding: '1px 7px', borderRadius: 99, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.20)', fontSize: 8.5, fontWeight: 800, color: '#ef4444', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.10em' }}>
                        IMPORTANT
                      </span>
                    )}
                  </div>
                  <span className="mono" style={{ fontSize: 9, color: '#94a3b8' }}>{item.time}</span>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.62, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /* ── AI GENERATE PANEL ──────────────────────────────── */
  const AiPanel = () => (
    <div className="dm-compose-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>

      {/* Premium lock overlay for non-AI-plan patients */}
      {!canUseAI && (
        <div className="dm-premium-lock" style={{ borderRadius: 0 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 22px rgba(99,102,241,0.35)' }}>
            <Crown size={22} color="#fff" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#0B1E33', margin: '0 0 5px' }}>AI Companion Plan Required</p>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 14px', maxWidth: 260, lineHeight: 1.65 }}>
              {patient.name.split(' ')[0]} is on the Standard plan. Upgrade their subscription to unlock AI-generated feedback and protocol notes.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 12, background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))', border: '1.5px solid rgba(99,102,241,0.25)', fontSize: 12, fontWeight: 700, color: '#6366f1' }}>
              <Shield size={13} />
              Standard Plan — No AI Access
            </div>
          </div>
        </div>
      )}

      {/* AI companion header badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.05))', border: '1.5px solid rgba(99,102,241,0.18)', borderRadius: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(99,102,241,0.30)', flexShrink: 0, animation: 'dmAiPulse 3s ease-in-out infinite' }}>
          <Sparkles size={16} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0B1E33' }}>AI Clinical Generator</div>
          <div className="mono" style={{ fontSize: 8.5, color: 'rgba(99,102,241,0.75)', textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 2 }}>
            Powered by Gemini 1.5 Flash · AI Companion Plan
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: '#0B1E33', border: '1px solid rgba(45,212,191,0.20)' }}>
          <Zap size={10} color="#2DD4BF" />
          <span className="mono" style={{ fontSize: 8.5, color: '#2DD4BF', fontWeight: 700, letterSpacing: '0.10em' }}>PREMIUM</span>
        </div>
      </div>

      {/* Mode toggle — feedback or instruction */}
      <div>
        <label className="mono" style={{ display: 'block', fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 8 }}>
          Generate Type
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['feedback', 'instruction'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => { setAiMode(mode); setAiDraft(''); setAiTitle(''); }}
              style={{
                flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer',
                background: aiMode === mode ? (mode === 'feedback' ? 'rgba(45,212,191,0.10)' : 'rgba(245,158,11,0.10)') : 'rgba(240,244,248,0.8)',
                border: `1.5px solid ${aiMode === mode ? (mode === 'feedback' ? 'rgba(45,212,191,0.35)' : 'rgba(245,158,11,0.35)') : 'rgba(226,232,240,0.9)'}`,
                color: aiMode === mode ? (mode === 'feedback' ? '#0891b2' : '#92400e') : '#94a3b8',
                fontSize: 12.5, fontWeight: 800, transition: 'all 0.2s ease',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {mode === 'feedback' ? '📊 Feedback' : '📋 Instruction'}
            </button>
          ))}
        </div>
      </div>

      {/* Context note */}
      <div style={{ padding: '10px 14px', background: 'rgba(240,244,248,0.8)', border: '1px solid rgba(226,232,240,0.9)', borderRadius: 12 }}>
        <p className="mono" style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px', fontWeight: 700 }}>
          AI Context
        </p>
        <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.65 }}>
          Gemini will analyse <span style={{ fontWeight: 700, color: '#0B1E33' }}>{patient.name}</span>'s last 7 sessions — grip force trends, endurance drop %, cognitive accuracy, and adherence ({patient.adherence}%) — to generate a personalised{' '}
          <span style={{ color: aiMode === 'feedback' ? '#2DD4BF' : '#f59e0b', fontWeight: 700 }}>{aiMode}</span>.
        </p>
      </div>

      {/* Generate button */}
      <button
        className="dm-ai-btn"
        onClick={generateAI}
        disabled={aiLoading || !canUseAI}
        style={{ width: '100%', opacity: !canUseAI ? 0.45 : 1 }}
      >
        {aiLoading
          ? <div style={{ width: 14, height: 14, border: '2.5px solid rgba(99,102,241,0.25)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'dmSpin 0.75s linear infinite' }} />
          : <Sparkles size={14} />
        }
        {aiLoading ? 'Analysing session data…' : `Generate AI ${aiMode.charAt(0).toUpperCase() + aiMode.slice(1)}`}
      </button>

      {/* Draft output */}
      {aiDraft && (
        <div style={{ animation: 'dmCardPop 0.45s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 6px rgba(99,102,241,0.7)', animation: 'dmDot 2s ease-in-out infinite' }} />
            <span className="mono" style={{ fontSize: 9, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700 }}>
              AI Draft — Edit before sending
            </span>
          </div>

          {/* Editable title */}
          <input
            className="dm-title-input"
            value={aiTitle}
            onChange={e => setAiTitle(e.target.value)}
            placeholder="Draft title..."
            style={{ marginBottom: 10 }}
          />

          {/* Editable content */}
          <textarea
            className="dm-textarea"
            rows={5}
            value={aiDraft}
            onChange={e => setAiDraft(e.target.value)}
            style={{ border: '1.5px solid rgba(99,102,241,0.28)', background: 'rgba(99,102,241,0.04)' }}
          />

          {/* AI disclaimer + send */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8' }}>
              <Bot size={12} color="#6366f1" />
              AI-generated · Review before sending
            </div>
            <button
              className="dm-compose-btn"
              onClick={sendAiDraft}
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', boxShadow: '0 6px 22px rgba(99,102,241,0.32)', padding: '11px 20px' }}
            >
              <Send size={13} style={{ position: 'relative', zIndex: 1 }} />
              <span style={{ position: 'relative', zIndex: 1 }}>Send to Patient</span>
            </button>
          </div>
        </div>
      )}

      {/* AI sent history */}
      {(aiSent[selectedId] ?? []).length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div className="mono" style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10, fontWeight: 700 }}>
            AI Messages Sent
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(aiSent[selectedId] ?? []).map(item => (
              <div key={item.id} className="dm-sent-item" style={{ borderColor: 'rgba(99,102,241,0.20)', background: 'rgba(99,102,241,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  <Bot size={12} color="#6366f1" />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0B1E33' }}>{item.title}</span>
                  <span className="mono" style={{ fontSize: 8.5, color: '#6366f1', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', padding: '1px 6px', borderRadius: 6, marginLeft: 'auto' }}>AI</span>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.62, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <div className="dm" style={{ height: '100vh', background: '#F0F4F8', display: 'flex', flexDirection: 'column', padding: '20px', gap: 14, overflow: 'hidden' }}>
      <style>{CSS}</style>

      {/* ── Top nav ──────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, animation: 'dmFadeUp 0.45s ease both', flexShrink: 0 }}>
        <Link href="/doctor/patients" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '8px 14px', borderRadius: 12,
          background: '#fff', border: '1.5px solid rgba(226,232,240,0.9)',
          fontSize: 13, fontWeight: 700, color: '#64748b', textDecoration: 'none',
          transition: 'all 0.2s ease',
        }}>
          <ArrowLeft size={14} /> Back to Patients
        </Link>
        <span className="mono" style={{ fontSize: 9.5, color: '#94a3b8', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Patient Messaging Hub
        </span>
      </div>

      {/* ── Main layout ──────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 14, flex: 1, minHeight: 0, animation: 'dmFadeUp 0.50s ease 0.06s both' }}>

        {/* ════════════════════════════════════════════════
            SIDEBAR — patient list
        ════════════════════════════════════════════════ */}
        <div className="dm-sidebar-wrap" style={{
          width: 268, flexShrink: 0, background: '#fff',
          borderRadius: 20, border: '1px solid rgba(226,232,240,0.9)',
          boxShadow: '0 2px 18px rgba(11,30,51,0.055)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Sidebar header */}
          <div style={{
            padding: '16px 15px 12px',
            borderBottom: '1px solid rgba(226,232,240,0.8)',
            background: 'linear-gradient(135deg,#f8fdfc,#f0fdfb)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 11 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(45,212,191,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2DD4BF' }}>
                <User size={15} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0B1E33' }}>All Patients</div>
                <div className="mono" style={{ fontSize: 8.5, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  {Object.keys(PATIENTS).length} assigned
                </div>
              </div>
            </div>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                style={{
                  width: '100%', padding: '8px 10px 8px 30px',
                  background: 'rgba(240,244,248,0.9)', border: '1px solid rgba(226,232,240,0.9)',
                  borderRadius: 10, fontSize: 12, color: '#0B1E33', outline: 'none',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              />
            </div>
          </div>

          {/* Patient list */}
          <div className="dm-sidebar" style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {filteredPats.map(([pid, p]) => {
              const sc  = statusColor(p.status);
              const ac  = adherenceColor(p.adherence);
              const isA = pid === selectedId;
              const lastChat = (chatMap[pid] ?? []).slice(-1)[0];
              return (
                <button
                  key={pid}
                  className={`dm-patient-btn ${isA ? 'active' : ''}`}
                  onClick={() => { setSelectedId(pid); setPanel('chat'); }}
                >
                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 12,
                      background: isA ? 'linear-gradient(135deg,#2DD4BF,#0891b2)' : `${ac}18`,
                      border: `1.5px solid ${isA ? 'transparent' : ac + '38'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10.5, fontWeight: 800,
                      color: isA ? '#0B1E33' : ac,
                    }}>
                      {initials(p.name)}
                    </div>
                    <div style={{ position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderRadius: '50%', background: sc, border: '2px solid #fff', animation: 'dmDot 2.2s ease-in-out infinite' }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0B1E33', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 108 }}>{p.name}</span>
                      <MiniBar value={p.adherence} color={ac} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                      <span className="mono" style={{ fontSize: 8.5, color: '#2DD4BF', background: 'rgba(45,212,191,0.08)', padding: '1px 5px', borderRadius: 5 }}>{p.pid}</span>
                      {p.isAIPlan && <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#0B1E33', borderRadius: 6, padding: '1px 6px' }}><Bot size={8} color="#2DD4BF" /><span className="mono" style={{ fontSize: 7.5, color: '#2DD4BF', fontWeight: 700 }}>AI</span></div>}
                    </div>
                    {lastChat && (
                      <div style={{ fontSize: 10.5, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150, marginTop: 1 }}>
                        {lastChat.sender === 'doctor' ? 'You: ' : ''}{lastChat.text}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            MAIN COLUMN
        ════════════════════════════════════════════════ */}
        <div className="dm-main-col" style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          gap: 0, minWidth: 0,
          background: '#fff', borderRadius: 20,
          border: '1px solid rgba(226,232,240,0.9)',
          boxShadow: '0 2px 18px rgba(11,30,51,0.055)',
          overflow: 'hidden',
        }}>

          {/* ── Patient hero header (dark card) ───────────── */}
          <div style={{
            background: '#0B1E33', position: 'relative', overflow: 'hidden', flexShrink: 0,
          }}>
            {/* Grid overlay */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage: 'linear-gradient(rgba(45,212,191,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(45,212,191,0.04) 1px,transparent 1px)',
              backgroundSize: '32px 32px' }} />
            {/* Scan line */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, height: '22%', background: 'linear-gradient(to bottom,transparent,rgba(45,212,191,0.05),transparent)', animation: 'dmScanLine 5.5s linear infinite' }} />
            </div>

            <div style={{ position: 'relative', zIndex: 2, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              {/* Patient info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: `linear-gradient(135deg,${aColor},${aColor}aa)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, color: '#fff',
                    boxShadow: `0 0 0 2.5px ${aColor}40, 0 5px 18px ${aColor}35`,
                    animation: 'dmGlow 3s ease-in-out infinite', flexShrink: 0,
                  }}>
                    {initials(patient.name)}
                  </div>
                  <div style={{ position: 'absolute', bottom: -1, right: -1, width: 11, height: 11, borderRadius: '50%', background: sColor, border: '2.5px solid #0B1E33', boxShadow: `0 0 5px ${sColor}` }} />
                </div>
                <div>
                  <p className="mono" style={{ fontSize: 8.5, color: 'rgba(45,212,191,0.60)', textTransform: 'uppercase', letterSpacing: '0.20em', marginBottom: 2 }}>
                    Active Patient
                  </p>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{patient.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    <span className="mono" style={{ fontSize: 10, color: '#2DD4BF', background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.20)', padding: '1px 8px', borderRadius: 7 }}>{patient.pid}</span>
                    <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.40)' }}>{patient.condition}</span>
                    <span style={{ fontSize: 11, color: sColor, fontWeight: 700 }}>{patient.status} Adherence</span>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', alignItems: 'center' }}>
                {patient.isAIPlan ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(45,212,191,0.10)', border: '1px solid rgba(45,212,191,0.22)', borderRadius: 11, padding: '7px 13px' }}>
                    <Bot size={13} color="#2DD4BF" />
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#2DD4BF' }}>AI Companion</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 11, padding: '7px 13px' }}>
                    <Shield size={13} color="rgba(255,255,255,0.35)" />
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.40)' }}>Standard</span>
                  </div>
                )}
                <Link href={`/doctor/patients/${selectedId}`} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '7px 13px', borderRadius: 11,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)',
                  fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}>
                  View Profile <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* ── Action tabs ────────────────────────────────── */}
          <div style={{
            display: 'flex', gap: 6, padding: '10px 16px',
            borderBottom: '1px solid rgba(226,232,240,0.8)',
            background: 'rgba(248,250,252,0.95)', flexShrink: 0,
          }}>
            {/* Chat */}
            <button
              className={`dm-tab ${panel === 'chat' ? 'active' : ''}`}
              onClick={() => setPanel('chat')}
              style={{
                background: panel === 'chat' ? 'rgba(45,212,191,0.09)' : 'transparent',
                border: `1.5px solid ${panel === 'chat' ? 'rgba(45,212,191,0.28)' : 'transparent'}`,
                color: panel === 'chat' ? '#0891b2' : '#94a3b8',
              }}
            >
              <MessageCircle size={16} />
              <span className="dm-tab-label mono" style={{ fontSize: 8.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Chat</span>
            </button>

            {/* Instruction */}
            <button
              className={`dm-tab ${panel === 'instruction' ? 'active' : ''}`}
              onClick={() => setPanel('instruction')}
              style={{
                background: panel === 'instruction' ? 'rgba(245,158,11,0.08)' : 'transparent',
                border: `1.5px solid ${panel === 'instruction' ? 'rgba(245,158,11,0.28)' : 'transparent'}`,
                color: panel === 'instruction' ? '#b45309' : '#94a3b8',
              }}
            >
              <AlertCircle size={16} />
              <span className="dm-tab-label mono" style={{ fontSize: 8.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Instruction</span>
            </button>

            {/* Feedback */}
            <button
              className={`dm-tab ${panel === 'feedback' ? 'active' : ''}`}
              onClick={() => setPanel('feedback')}
              style={{
                background: panel === 'feedback' ? 'rgba(45,212,191,0.09)' : 'transparent',
                border: `1.5px solid ${panel === 'feedback' ? 'rgba(45,212,191,0.28)' : 'transparent'}`,
                color: panel === 'feedback' ? '#0891b2' : '#94a3b8',
              }}
            >
              <Activity size={16} />
              <span className="dm-tab-label mono" style={{ fontSize: 8.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Feedback</span>
            </button>

            {/* AI Generate */}
            <button
              className={`dm-tab ${panel === 'ai_generate' ? 'active' : ''}`}
              onClick={() => setPanel('ai_generate')}
              style={{
                background: panel === 'ai_generate' ? 'linear-gradient(135deg,rgba(99,102,241,0.10),rgba(139,92,246,0.07))' : 'transparent',
                border: `1.5px solid ${panel === 'ai_generate' ? 'rgba(99,102,241,0.28)' : 'transparent'}`,
                color: panel === 'ai_generate' ? '#6366f1' : '#94a3b8',
                position: 'relative',
              }}
            >
              <Sparkles size={16} />
              <span className="dm-tab-label mono" style={{ fontSize: 8.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>AI Generate</span>
              {/* Premium crown badge */}
              <div style={{
                position: 'absolute', top: 4, right: 4,
                width: 14, height: 14, borderRadius: '50%',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(99,102,241,0.45)',
              }}>
                <Crown size={7} color="#fff" />
              </div>
              {!canUseAI && (
                <div style={{ position: 'absolute', top: 4, left: 4, width: 12, height: 12, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={7} color="#fff" />
                </div>
              )}
            </button>
          </div>

          {/* ── Active panel ────────────────────────────────── */}
          {panel === 'chat' && <ChatPanel />}

          {panel === 'instruction' && (
            <ComposeForm
              typeLabel="Instruction" typeColor="#f59e0b" typeBg="rgba(245,158,11,0.08)"
              title={instrTitle} setTitle={setInstrTitle}
              content={instrContent} setContent={setInstrContent}
              important={instrImportant} setImportant={setInstrImportant}
              onSend={sendInstruction}
              sentItems={instrSent[selectedId] ?? []}
              hint={`Write a clinical instruction for ${patient.name.split(' ')[0]}. Instructions are highlighted to the patient and require their acknowledgment before dismissal. Use this for protocol changes, appointment notices, or mandatory actions.`}
            />
          )}

          {panel === 'feedback' && (
            <ComposeForm
              typeLabel="Feedback" typeColor="#2DD4BF" typeBg="rgba(45,212,191,0.08)"
              title={fbTitle} setTitle={setFbTitle}
              content={fbContent} setContent={setFbContent}
              important={fbImportant} setImportant={setFbImportant}
              onSend={sendFeedback}
              sentItems={fbSent[selectedId] ?? []}
              hint={`Send clinical feedback to ${patient.name.split(' ')[0]} based on their recent session performance. Feedback helps the patient understand their progress and reinforces positive behaviour.`}
            />
          )}

          {panel === 'ai_generate' && <AiPanel />}

        </div>
      </div>
    </div>
  );
}