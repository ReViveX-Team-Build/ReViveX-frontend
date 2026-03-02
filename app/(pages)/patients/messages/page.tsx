'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, MessageCircle, CheckCircle2, Circle,
  Stethoscope, X, Send, Bot, Clock,
  AlertCircle, Sparkles, Activity, Shield,
  Bell, User, ChevronDown, ChevronUp, Zap,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   TYPES
   Mirrors lib/db/types.ts Communication interface.
   NOTE: Add `title: string` and `isImportant?: boolean`
         to your Communication interface in lib/db/types.ts
══════════════════════════════════════════════════════════ */
type MsgCategory = 'all' | 'feedback' | 'instruction' | 'direct_message';

interface PatientMessage {
  id:          string;
  type:        'feedback' | 'instruction' | 'direct_message' | 'ai_insight';
  title:       string;
  content:     string;
  date:        string;
  isRead:      boolean;
  isImportant: boolean;
  sentByAI:    boolean;
}

interface ChatBubble {
  id:     string;
  sender: 'doctor' | 'patient';
  text:   string;
  time:   string;
}

/* ══════════════════════════════════════════════════════════
   MOCK DATA
   gotta replace with: import { getMessagesByReceiver, getDirectChat,
   markAsRead, sendCommunication } from '@/lib/db/communications'
   Patient ID comes from the auth context (e.g. useAuth hook)
══════════════════════════════════════════════════════════ */
const DOCTOR = {
  name:         'Dr. Sarah Johnson',
  specialty:    'Neuro-Rehabilitation Specialist',
  availability: 'Mon – Fri, 9:00 AM – 5:00 PM',
  initials:     'SJ',
  doctorId:     'doctor_001',
};

const INITIAL_MESSAGES: PatientMessage[] = [
  {
    id: '1', type: 'feedback',
    title: 'Excellent Progress This Week',
    content: "John, I reviewed your session data from this week and I'm very impressed with your consistency. Your grip strength has improved significantly, and your adherence score is outstanding. Keep up the great work! Continue with the current protocol — Right hand, Medium difficulty.",
    date: 'Nov 15, 2025', isRead: false, isImportant: false, sentByAI: false,
  },
  {
    id: '2', type: 'instruction',
    title: 'Protocol Adjustment',
    content: "Based on your progress, I'm adjusting your therapy protocol starting next week. We'll increase the difficulty level to \"High\" for your right hand exercises. This will help continue your improvement trajectory. If you experience any discomfort, please let me know immediately.",
    date: 'Nov 14, 2025', isRead: false, isImportant: true, sentByAI: false,
  },
  {
    id: '3', type: 'direct_message',
    title: 'Reminder: Hydration',
    content: 'Remember to stay well-hydrated before and after your therapy sessions. Proper hydration helps with muscle recovery and overall performance during rehabilitation exercises.',
    date: 'Nov 12, 2025', isRead: true, isImportant: false, sentByAI: false,
  },
  {
    id: '4', type: 'ai_insight',
    title: 'Memory Game Performance',
    content: 'Your cognitive exercise performance is excellent with an 85% success rate. The dual-task therapy approach is working well for you. The combination of motor and cognitive tasks is showing positive results in your recovery.',
    date: 'Nov 10, 2025', isRead: true, isImportant: false, sentByAI: true,
  },
  {
    id: '5', type: 'instruction',
    title: 'Next Appointment Scheduled',
    content: "Your next in-person evaluation is scheduled for Nov 25, 2025 at 2:00 PM. We'll assess your overall progress and discuss any adjustments to your treatment plan. Please complete all scheduled sessions before this appointment.",
    date: 'Nov 8, 2025', isRead: true, isImportant: true, sentByAI: false,
  },
];

const INITIAL_CHAT: ChatBubble[] = [
  { id: 'c1', sender: 'doctor',  text: "Hello John! How are you feeling after yesterday's session?", time: '09:10' },
  { id: 'c2', sender: 'patient', text: "Feeling good, Doctor! Grip feels much stronger than last week.", time: '09:14' },
  { id: 'c3', sender: 'doctor',  text: "That's wonderful to hear! Your metrics confirm it. Keep up the great work!", time: '09:16' },
];
/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function typeConfig(type: PatientMessage['type']) {
  switch (type) {
    case 'feedback':
      return { label: 'Feedback',    color: '#2DD4BF', bg: 'rgba(45,212,191,0.08)',  border: 'rgba(45,212,191,0.30)',  icon: <Activity    size={11} />, leftBar: '#2DD4BF' };
    case 'instruction':
      return { label: 'Instruction', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.30)', icon: <AlertCircle size={11} />, leftBar: '#f59e0b' };
    case 'direct_message':
      return { label: 'Message',     color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.30)', icon: <MessageCircle size={11} />, leftBar: '#8b5cf6' };
    case 'ai_insight':
      return { label: 'AI Insight',  color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.30)', icon: <Sparkles    size={11} />, leftBar: '#6366f1' };
  }
}

/* ══════════════════════════════════════════════════════════
   CSS
══════════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  .pm * { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; box-sizing: border-box; }
  .pm .mono { font-family: 'JetBrains Mono', monospace; }

  @keyframes pmFadeUp {
    from { opacity:0; transform:translateY(18px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes pmCardPop {
    0%   { opacity:0; transform:translateY(14px) scale(0.97); }
    100% { opacity:1; transform:translateY(0)    scale(1); }
  }
  @keyframes pmShimmer {
    0%   { transform:translateX(-200%) skewX(-15deg); }
    100% { transform:translateX(400%)  skewX(-15deg); }
  }
  @keyframes pmDot {
    0%,100% { opacity:1; }
    50%     { opacity:0.28; }
  }
  @keyframes pmScanLine {
    0%   { top:-4%; opacity:0; }
    6%   { opacity:1; }
    92%  { opacity:0.55; }
    100% { top:108%; opacity:0; }
  }
  @keyframes pmGlow {
    0%,100% { box-shadow:0 0 0 0 rgba(45,212,191,0.35); }
    50%     { box-shadow:0 0 0 9px rgba(45,212,191,0); }
  }
  @keyframes pmMsgIn {
    from { opacity:0; transform:translateY(8px) scale(0.97); }
    to   { opacity:1; transform:translateY(0)   scale(1); }
  }
  @keyframes pmChatSlide {
    from { opacity:0; transform:translateY(28px) scale(0.95); }
    to   { opacity:1; transform:translateY(0)    scale(1); }
  }
  @keyframes pmFabPulse {
    0%,100% { box-shadow:0 0 0 0 rgba(45,212,191,0.45), 0 8px 28px rgba(45,212,191,0.35); }
    50%     { box-shadow:0 0 0 10px rgba(45,212,191,0),  0 8px 28px rgba(45,212,191,0.35); }
  }
  @keyframes pmOverlayIn {
    from { opacity:0; }
    to   { opacity:1; }
  }

  /* ── Message cards ──────────────────────────── */
  .pm-msg-card {
    background: #fff;
    border-radius: 18px;
    border: 1.5px solid rgba(226,232,240,0.9);
    box-shadow: 0 2px 16px rgba(11,30,51,0.055);
    transition: transform 0.26s cubic-bezier(0.22,1,0.36,1), box-shadow 0.26s ease;
    overflow: hidden;
    position: relative;
  }
  .pm-msg-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 44px rgba(11,30,51,0.10) !important;
  }
  .pm-msg-card.unread {
    border-color: rgba(45,212,191,0.25);
    box-shadow: 0 2px 16px rgba(45,212,191,0.08);
  }

  /* ── Filter tabs ────────────────────────────── */
  .pm-filter-btn {
    padding: 8px 16px; border-radius: 12px; border: none;
    cursor: pointer; font-size: 9.5px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.14em;
    transition: all 0.2s ease;
    font-family: 'JetBrains Mono', monospace;
  }

  /* ── FAB chat button ─────────────────────────── */
  .pm-fab {
    position: fixed; bottom: 32px; right: 32px;
    width: 58px; height: 58px; border-radius: 18px;
    background: linear-gradient(135deg,#2DD4BF,#0891b2);
    border: none; cursor: pointer; z-index: 50;
    display: flex; align-items: center; justify-content: center;
    color: #0B1E33;
    animation: pmFabPulse 3s ease-in-out infinite;
    transition: transform 0.22s ease;
  }
  .pm-fab:hover { transform: scale(1.08) translateY(-2px); }
  .pm-fab:active { transform: scale(0.95); }

  /* ── Chat panel (centered modal) ────────────── */
  .pm-chat-overlay {
    position: fixed; inset: 0; z-index: 100;
    background: rgba(11,30,51,0.45);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    animation: pmOverlayIn 0.22s ease both;
  }
  .pm-chat-panel {
    width: 100%; max-width: 480px;
    height: 580px; max-height: 90vh;
    background: #fff;
    border-radius: 24px;
    border: 1.5px solid rgba(45,212,191,0.22);
    box-shadow: 0 24px 80px rgba(11,30,51,0.22), 0 0 0 1px rgba(45,212,191,0.08);
    display: flex; flex-direction: column;
    overflow: hidden;
    animation: pmChatSlide 0.32s cubic-bezier(0.22,1,0.36,1) both;
    position: relative;
    margin: 16px;
  }

  /* ── Chat messages scroll ───────────────────── */
  .pm-chat-msgs::-webkit-scrollbar { width: 3px; }
  .pm-chat-msgs::-webkit-scrollbar-thumb { background: rgba(45,212,191,0.22); border-radius: 99px; }

  /* ── Checkbox ───────────────────────────────── */
  .pm-check-btn {
    width: 24px; height: 24px; border-radius: 8px; border: none;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.2s ease; flex-shrink: 0; background: none;
  }
  .pm-check-btn:hover { transform: scale(1.15); }

  /* ── Expand/collapse ────────────────────────── */
  .pm-expand-btn {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 700; color: #94a3b8;
    border: none; background: none; cursor: pointer;
    padding: 0; margin-top: 6px;
    transition: color 0.18s ease;
  }
  .pm-expand-btn:hover { color: #0B1E33; }

  /* ── Chat input ─────────────────────────────── */
  .pm-chat-input {
    flex: 1; padding: 11px 14px;
    background: rgba(240,244,248,0.85);
    border: 1.5px solid rgba(226,232,240,0.9);
    border-radius: 13px;
    font-size: 13px; font-weight: 500; color: #0B1E33;
    outline: none; transition: all 0.2s ease;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .pm-chat-input::placeholder { color: #94a3b8; }
  .pm-chat-input:focus {
    background: #fff;
    border-color: rgba(45,212,191,0.50);
    box-shadow: 0 0 0 3px rgba(45,212,191,0.10);
  }

  /* ── Back button ────────────────────────────── */
  .pm-back-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 9px 16px; border-radius: 12px;
    font-size: 13px; font-weight: 700; color: #64748b;
    background: #fff; border: 1.5px solid rgba(226,232,240,0.9);
    text-decoration: none; transition: all 0.2s ease;
  }
  .pm-back-btn:hover { background: #f8fafc; color: #0B1E33; border-color: rgba(11,30,51,0.14); }

  @media (max-width: 640px) {
    .pm main { padding: 16px 14px !important; }
    .pm-filter-strip { flex-wrap: wrap !important; }
    .pm-fab { bottom: 24px; right: 20px; }
    .pm-chat-panel { max-width: 100%; margin: 8px; height: 75vh; }
    .pm-doctor-card-inner { flex-direction: column !important; gap: 14px !important; }
    .pm-doc-avail { display: none !important; }
  }
`;

