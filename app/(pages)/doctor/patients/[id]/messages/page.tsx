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