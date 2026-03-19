"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/lib/firebase";
import {
  sendDirectMessage,
  subscribeToDirect,
  getInboxMessages,
  markAsRead,
} from "@/app/lib/db/communications";
import { getPatientData } from "@/app/lib/db/users";
import { Communication } from "@/app/lib/db/types";
import { Timestamp } from "firebase/firestore";
import {
  ArrowLeft,
  MessageCircle,
  CheckCircle2,
  Circle,
  Stethoscope,
  X,
  Send,
  Bot,
  Clock,
  AlertCircle,
  Sparkles,
  Activity,
  Shield,
  Bell,
  User,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════
   TYPES
   Mirrors lib/db/types.ts Communication interface.
   NOTE: Add `title: string` and `isImportant?: boolean`
         to your Communication interface in lib/db/types.ts
══════════════════════════════════════════════════════════ */
type MsgCategory = "all" | "feedback" | "instruction" | "direct_message";

interface PatientMessage {
  id: string;
  type: "feedback" | "instruction" | "direct_message" | "ai_insight";
  title: string;
  content: string;
  date: string;
  isRead: boolean;
  isImportant: boolean;
  sentByAI: boolean;
}

interface ChatBubble {
  id: string;
  sender: "doctor" | "patient";
  text: string;
  time: string;
}

function commToBubble(c: Communication, patientId: string): ChatBubble {
  const ts = c.timestamp as Timestamp;
  return {
    id: c.id ?? `${c.senderId}-${ts.seconds}`,
    sender: c.senderId === patientId ? "patient" : "doctor",
    text: c.content,
    time: ts
      .toDate()
      .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

function commToInboxMessage(c: Communication): PatientMessage {
  const ts = c.timestamp as Timestamp;
  return {
    id: c.id ?? `${c.senderId}-${ts.seconds}`,
    type: (c.type as PatientMessage["type"]) ?? "feedback",
    title: c.title || "Message",
    content: c.content,
    date: ts.toDate().toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    isRead: c.isRead,
    isImportant: c.isImportant ?? false,
    sentByAI: c.type === "ai_insight",
  };
}

/* ══════════════════════════════════════════════════════════
   MOCK DATA
   gotta replace with: import { getMessagesByReceiver, getDirectChat,
   markAsRead, sendCommunication } from '@/lib/db/communications'
   Patient ID comes from the auth context (e.g. useAuth hook)
══════════════════════════════════════════════════════════ */
const DOCTOR = {
  name: "Dr. Sarah Johnson",
  specialty: "Neuro-Rehabilitation Specialist",
  availability: "Mon – Fri, 9:00 AM – 5:00 PM",
  initials: "SJ",
  doctorId: "doctor_001",
};

const INITIAL_MESSAGES: PatientMessage[] = [
  {
    id: "1",
    type: "feedback",
    title: "Excellent Progress This Week",
    content:
      "John, I reviewed your session data from this week and I'm very impressed with your consistency. Your grip strength has improved significantly, and your adherence score is outstanding. Keep up the great work! Continue with the current protocol — Right hand, Medium difficulty.",
    date: "Nov 15, 2025",
    isRead: false,
    isImportant: false,
    sentByAI: false,
  },
  {
    id: "2",
    type: "instruction",
    title: "Protocol Adjustment",
    content:
      "Based on your progress, I'm adjusting your therapy protocol starting next week. We'll increase the difficulty level to \"High\" for your right hand exercises. This will help continue your improvement trajectory. If you experience any discomfort, please let me know immediately.",
    date: "Nov 14, 2025",
    isRead: false,
    isImportant: true,
    sentByAI: false,
  },
  {
    id: "3",
    type: "direct_message",
    title: "Reminder: Hydration",
    content:
      "Remember to stay well-hydrated before and after your therapy sessions. Proper hydration helps with muscle recovery and overall performance during rehabilitation exercises.",
    date: "Nov 12, 2025",
    isRead: true,
    isImportant: false,
    sentByAI: false,
  },
  {
    id: "4",
    type: "ai_insight",
    title: "Memory Game Performance",
    content:
      "Your cognitive exercise performance is excellent with an 85% success rate. The dual-task therapy approach is working well for you. The combination of motor and cognitive tasks is showing positive results in your recovery.",
    date: "Nov 10, 2025",
    isRead: true,
    isImportant: false,
    sentByAI: true,
  },
  {
    id: "5",
    type: "instruction",
    title: "Next Appointment Scheduled",
    content:
      "Your next in-person evaluation is scheduled for Nov 25, 2025 at 2:00 PM. We'll assess your overall progress and discuss any adjustments to your treatment plan. Please complete all scheduled sessions before this appointment.",
    date: "Nov 8, 2025",
    isRead: true,
    isImportant: true,
    sentByAI: false,
  },
];

const INITIAL_CHAT: ChatBubble[] = [
  {
    id: "c1",
    sender: "doctor",
    text: "Hello John! How are you feeling after yesterday's session?",
    time: "09:10",
  },
  {
    id: "c2",
    sender: "patient",
    text: "Feeling good, Doctor! Grip feels much stronger than last week.",
    time: "09:14",
  },
  {
    id: "c3",
    sender: "doctor",
    text: "That's wonderful to hear! Your metrics confirm it. Keep up the great work!",
    time: "09:16",
  },
];
/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function typeConfig(type: PatientMessage["type"]) {
  switch (type) {
    case "feedback":
      return {
        label: "Feedback",
        color: "#2DD4BF",
        bg: "rgba(45,212,191,0.08)",
        border: "rgba(45,212,191,0.30)",
        icon: <Activity size={11} />,
        leftBar: "#2DD4BF",
      };
    case "instruction":
      return {
        label: "Instruction",
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.08)",
        border: "rgba(245,158,11,0.30)",
        icon: <AlertCircle size={11} />,
        leftBar: "#f59e0b",
      };
    case "direct_message":
      return {
        label: "Message",
        color: "#8b5cf6",
        bg: "rgba(139,92,246,0.08)",
        border: "rgba(139,92,246,0.30)",
        icon: <MessageCircle size={11} />,
        leftBar: "#8b5cf6",
      };
    case "ai_insight":
      return {
        label: "AI Insight",
        color: "#6366f1",
        bg: "rgba(99,102,241,0.08)",
        border: "rgba(99,102,241,0.30)",
        icon: <Sparkles size={11} />,
        leftBar: "#6366f1",
      };
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

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function PatientMessagesPage() {
  const [user, loading] = useAuthState(auth);
  const patientId = user?.uid ?? "";
  const [inbox, setInbox] = useState<PatientMessage[]>([]);
  const [filter, setFilter] = useState<MsgCategory>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<ChatBubble[]>(INITIAL_CHAT);
  const [chatInput, setChatInput] = useState("");
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (chatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => chatInputRef.current?.focus(), 100);
    }
  }, [chatOpen, chatMsgs]);

  useEffect(() => {
    async function loadDoctor() {
      if (!patientId) return;
      const patient = await getPatientData(patientId);
      setDoctorId(patient?.assignedDoctorId ?? null);
    }

    loadDoctor().catch((err) => {
      console.error("Failed to load assigned doctor:", err);
      setDoctorId(null);
    });
  }, [patientId]);

  useEffect(() => {
    if (!patientId) return;

    async function loadInbox() {
      try {
        const msgs = await getInboxMessages(patientId);
        const mapped = msgs.map((m) => commToInboxMessage(m as Communication));
        setInbox(mapped);
        console.log("Inbox:", msgs);
      } catch (err) {
        console.error("Failed to load inbox:", err);
      }
    }

    loadInbox();
  }, [patientId]);

  useEffect(() => {
    if (!patientId || !doctorId) return;

    const unsubscribe = subscribeToDirect(patientId, doctorId, (msgs) => {
      console.log("Patient realtime:", msgs);
      setChatMsgs(msgs.map((m) => commToBubble(m, patientId)));
    });

    return () => unsubscribe();
  }, [patientId, doctorId]);

  /* ── Derived ──────────────────────────────────────────── */
  const unreadCount = inbox.filter((m) => !m.isRead).length;

  const filtered = inbox.filter((m) => {
    if (filter === "all") return true;
    if (filter === "direct_message") return m.type === "ai_insight";
    return m.type === filter;
  });

  /* ── Handlers ─────────────────────────────────────────── */
  const toggleRead = async (id: string) => {
    setInbox((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)),
    );
    try {
      await markAsRead(id);
    } catch (err) {
      console.error("Failed to mark inbox message as read:", err);
    }
  };

  const toggleExpand = async (id: string) => {
    const target = inbox.find((m) => m.id === id);
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

    // Auto-mark as read when opening a care update.
    if (target && !target.isRead) {
      await toggleRead(id);
    }
  };

  const sendChat = async () => {
    if (!patientId || !doctorId) return;
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput("");
    try {
      await sendDirectMessage(patientId, doctorId, text);
    } catch (error) {
      console.error("Patient send failed:", error);
    }
  };

  const handleChatKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  };

  if (!mounted) return null;
  if (loading) return <div>Loading...</div>;
  if (!patientId) return <div>Please sign in</div>;

  return (
    <div
      className="pm"
      style={{ minHeight: "100vh", background: "#F0F4F8", paddingBottom: 80 }}>
      <style>{CSS}</style>

      {/* ── Ambient BG ─────────────────────────────────────── */}
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
            right: "6%",
            width: 650,
            height: 650,
            background:
              "radial-gradient(circle,rgba(45,212,191,0.050) 0%,transparent 65%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-6%",
            left: "2%",
            width: 500,
            height: 500,
            background:
              "radial-gradient(circle,rgba(139,92,246,0.038) 0%,transparent 65%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(11,30,51,0.020) 1px,transparent 1px),linear-gradient(90deg,rgba(11,30,51,0.020) 1px,transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
      </div>

      <main
        style={{
          maxWidth: 780,
          margin: "0 auto",
          padding: "28px 24px",
          position: "relative",
          zIndex: 1,
        }}>
        {/* ── Back nav ─────────────────────────────────────── */}
        <div
          style={{ marginBottom: 22, animation: "pmFadeUp 0.45s ease both" }}>
          <Link href="/patients/home" className="pm-back-btn">
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>

        {!doctorId && (
          <div
            style={{
              marginBottom: 18,
              background: "#fff",
              border: "1.5px solid rgba(239,68,68,0.20)",
              borderRadius: 16,
              padding: 16,
              color: "#b91c1c",
              fontSize: 13,
              fontWeight: 600,
            }}>
            No assigned doctor found for this patient. Messaging is disabled
            until assignedDoctorId is set.
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            DOCTOR CARD  (dark hero card matching levels page)
        ════════════════════════════════════════════════════ */}
        <div
          style={{
            animation: "pmCardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.05s both",
            background: "#0B1E33",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow:
              "0 16px 60px rgba(11,30,51,0.22), 0 0 0 1px rgba(45,212,191,0.08)",
            marginBottom: 20,
            position: "relative",
          }}>
          {/* Grid overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage:
                "linear-gradient(rgba(45,212,191,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(45,212,191,0.035) 1px,transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />
          {/* Scan line */}
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
                height: "18%",
                background:
                  "linear-gradient(to bottom,transparent,rgba(45,212,191,0.055),transparent)",
                animation: "pmScanLine 5s linear infinite",
              }}
            />
          </div>

          <div
            className="pm-doctor-card-inner"
            style={{
              position: "relative",
              zIndex: 2,
              padding: "24px 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap",
            }}>
            {/* Left — doctor info */}
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: "linear-gradient(135deg,#2DD4BF,#0891b2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#0B1E33",
                    boxShadow:
                      "0 0 0 3px rgba(45,212,191,0.25), 0 6px 22px rgba(45,212,191,0.28)",
                    animation: "pmGlow 3s ease-in-out infinite",
                  }}>
                  {DOCTOR.initials}
                </div>
                {/* Online dot */}
                <div
                  style={{
                    position: "absolute",
                    bottom: -1,
                    right: -1,
                    width: 13,
                    height: 13,
                    borderRadius: "50%",
                    background: "#22c55e",
                    border: "2.5px solid #0B1E33",
                    animation: "pmDot 2.5s ease-in-out infinite",
                  }}
                />
              </div>

              {/* Text */}
              <div>
                <p
                  className="mono"
                  style={{
                    fontSize: 9,
                    color: "rgba(45,212,191,0.65)",
                    textTransform: "uppercase",
                    letterSpacing: "0.20em",
                    marginBottom: 3,
                    fontWeight: 600,
                  }}>
                  Your Assigned Doctor
                </p>
                <h1
                  style={{
                    fontSize: "clamp(1.1rem,2vw,1.45rem)",
                    fontWeight: 800,
                    color: "#fff",
                    margin: 0,
                    lineHeight: 1.2,
                  }}>
                  {DOCTOR.name}
                </h1>
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.45)",
                    marginTop: 3,
                    fontWeight: 500,
                  }}>
                  {DOCTOR.specialty}
                </p>
              </div>
            </div>

            {/* Right — badges */}
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}>
              {/* Availability */}
              <div
                className="pm-doc-avail"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 12,
                  padding: "9px 14px",
                }}>
                <Clock size={13} color="rgba(255,255,255,0.38)" />
                <span
                  style={{
                    fontSize: 11.5,
                    color: "rgba(255,255,255,0.50)",
                    fontWeight: 500,
                  }}>
                  {DOCTOR.availability}
                </span>
              </div>

              {/* Unread count */}
              {unreadCount > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    background: "rgba(45,212,191,0.14)",
                    border: "1px solid rgba(45,212,191,0.28)",
                    borderRadius: 12,
                    padding: "9px 14px",
                  }}>
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#2DD4BF",
                      boxShadow: "0 0 6px #2DD4BF",
                      animation: "pmDot 2s ease-in-out infinite",
                    }}
                  />
                  <span
                    className="mono"
                    style={{ fontSize: 11, fontWeight: 800, color: "#2DD4BF" }}>
                    {unreadCount} Unread
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            FILTER STRIP
        ════════════════════════════════════════════════════ */}
        <div
          style={{
            animation: "pmFadeUp 0.45s ease 0.12s both",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 18,
          }}>
          <div>
            <h2
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "#0B1E33",
                margin: 0,
              }}>
              Care Updates
            </h2>
            <p
              className="mono"
              style={{
                fontSize: 9,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                marginTop: 3,
                fontWeight: 700,
              }}>
              {filtered.length} message{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div
            className="pm-filter-strip"
            style={{
              display: "flex",
              gap: 4,
              background: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(226,232,240,0.8)",
              borderRadius: 16,
              padding: "4px",
              boxShadow: "0 2px 12px rgba(11,30,51,0.06)",
            }}>
            {(
              [
                { id: "all", label: "ALL" },
                { id: "feedback", label: "FEEDBACK" },
                { id: "instruction", label: "INSTRUCTIONS" },
                { id: "direct_message", label: "AI INSIGHTS" },
              ] as { id: MsgCategory; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                className="pm-filter-btn mono"
                onClick={() => setFilter(tab.id)}
                style={
                  filter === tab.id
                    ? {
                        background: "#0B1E33",
                        color: "#fff",
                        boxShadow: "0 2px 10px rgba(11,30,51,0.18)",
                      }
                    : { background: "transparent", color: "#94a3b8" }
                }>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            MESSAGE CARDS
        ════════════════════════════════════════════════════ */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            animation: "pmFadeUp 0.45s ease 0.18s both",
          }}>
          {filtered.length === 0 && (
            <div
              style={{
                background: "#fff",
                borderRadius: 18,
                padding: "48px",
                border: "1.5px dashed rgba(226,232,240,0.9)",
                textAlign: "center",
                color: "#94a3b8",
                fontSize: 14,
                fontWeight: 500,
              }}>
              {inbox.length === 0
                ? "No care updates yet"
                : "No care updates in this category."}
            </div>
          )}

          {filtered.map((msg, idx) => {
            const cfg = typeConfig(msg.type);
            const isExp = expanded.has(msg.id);
            const PREVIEW_LIMIT = 130;
            const needsTruncate = msg.content.length > PREVIEW_LIMIT;
            const displayContent =
              isExp || !needsTruncate
                ? msg.content
                : msg.content.slice(0, PREVIEW_LIMIT) + "…";

            return (
              <div
                key={msg.id}
                className={`pm-msg-card${!msg.isRead ? " unread" : ""}`}
                style={{
                  animation: `pmCardPop 0.50s cubic-bezier(0.22,1,0.36,1) ${0.18 + idx * 0.06}s both`,
                }}>
                {/* Colored left bar — type indicator */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    background: cfg.leftBar,
                    borderRadius: "18px 0 0 18px",
                    boxShadow: `2px 0 12px ${cfg.leftBar}40`,
                  }}
                />

                <div style={{ padding: "18px 20px 16px 24px" }}>
                  {/* ── Top row: type badge + date + IMPORTANT badge + checkbox ── */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      marginBottom: 12,
                      flexWrap: "wrap",
                    }}>
                    {/* Left cluster */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}>
                      {/* Type badge */}
                      <span
                        className="mono"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "4px 11px",
                          borderRadius: 99,
                          background: cfg.bg,
                          border: `1px solid ${cfg.border}`,
                          fontSize: 9.5,
                          fontWeight: 700,
                          color: cfg.color,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                        }}>
                        {cfg.icon}
                        {cfg.label}
                      </span>

                      {/* Important badge */}
                      {msg.isImportant && (
                        <span
                          className="mono"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 10px",
                            borderRadius: 99,
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.25)",
                            fontSize: 9,
                            fontWeight: 800,
                            color: "#ef4444",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                          }}>
                          <AlertCircle size={9} />
                          IMPORTANT
                        </span>
                      )}

                      {/* AI badge */}
                      {msg.sentByAI && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 10px",
                            borderRadius: 99,
                            background: "#0B1E33",
                            border: "1px solid rgba(45,212,191,0.20)",
                            fontSize: 9,
                            fontWeight: 700,
                            color: "#2DD4BF",
                            letterSpacing: "0.10em",
                          }}>
                          <Bot size={9} />
                          AI
                        </span>
                      )}

                      {/* Date */}
                      <span
                        className="mono"
                        style={{
                          fontSize: 10,
                          color: "#94a3b8",
                          fontWeight: 500,
                        }}>
                        {msg.date}
                      </span>
                    </div>

                    {/* Checkbox — mark as read */}
                    <button
                      className="pm-check-btn"
                      onClick={() => toggleRead(msg.id)}
                      title={msg.isRead ? "Mark as unread" : "Mark as read"}
                      style={{ color: msg.isRead ? cfg.color : "#cbd5e1" }}>
                      {msg.isRead ? (
                        <CheckCircle2 size={20} style={{ color: cfg.color }} />
                      ) : (
                        <Circle size={20} style={{ color: "#cbd5e1" }} />
                      )}
                    </button>
                  </div>

                  {/* ── Title ────────────────────────────────────────────── */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 10,
                    }}>
                    {!msg.isRead && (
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: cfg.color,
                          flexShrink: 0,
                          boxShadow: `0 0 6px ${cfg.color}80`,
                          animation: "pmDot 2.2s ease-in-out infinite",
                        }}
                      />
                    )}
                    <h3
                      style={{
                        fontSize: 14.5,
                        fontWeight: 800,
                        color: "#0B1E33",
                        margin: 0,
                        lineHeight: 1.3,
                      }}>
                      {msg.title}
                    </h3>
                  </div>

                  {/* ── Doctor attribution ───────────────────────────────── */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      marginBottom: 10,
                    }}>
                    <Stethoscope size={11} color={cfg.color} />
                    <span
                      style={{
                        fontSize: 11,
                        color: "#94a3b8",
                        fontWeight: 500,
                      }}>
                      {msg.sentByAI
                        ? `AI Insight · Reviewed by ${DOCTOR.name}`
                        : DOCTOR.name}
                    </span>
                  </div>

                  {/* ── Instruction/Feedback content divider ─────────────── */}
                  {(msg.type === "instruction" || msg.type === "feedback") && (
                    <div
                      style={{
                        height: 1,
                        background: "rgba(226,232,240,0.8)",
                        marginBottom: 12,
                      }}
                    />
                  )}

                  {/* ── Content ──────────────────────────────────────────── */}
                  <p
                    style={{
                      fontSize: 13,
                      color: "#475569",
                      lineHeight: 1.72,
                      margin: 0,
                      opacity: msg.isRead ? 0.8 : 1,
                    }}>
                    {displayContent}
                  </p>

                  {/* ── Expand / collapse ────────────────────────────────── */}
                  {needsTruncate && (
                    <button
                      className="pm-expand-btn"
                      onClick={() => toggleExpand(msg.id)}>
                      {isExp ? (
                        <>
                          <ChevronUp size={12} /> Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown size={12} /> Read more
                        </>
                      )}
                    </button>
                  )}

                  {/* ── Instruction CTA row ──────────────────────────────── */}
                  {msg.type === "instruction" && !msg.isRead && (
                    <div
                      style={{
                        marginTop: 14,
                        paddingTop: 12,
                        borderTop: "1px dashed rgba(245,158,11,0.22)",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          background: "rgba(245,158,11,0.06)",
                          border: "1px solid rgba(245,158,11,0.18)",
                          borderRadius: 10,
                          padding: "7px 12px",
                          fontSize: 11.5,
                          color: "#92400e",
                          fontWeight: 600,
                        }}>
                        <Bell size={12} color="#f59e0b" />
                        Please read and acknowledge this instruction
                      </div>
                      <button
                        onClick={() => toggleRead(msg.id)}
                        style={{
                          padding: "7px 14px",
                          borderRadius: 10,
                          background: "rgba(245,158,11,0.10)",
                          border: "1px solid rgba(245,158,11,0.28)",
                          color: "#b45309",
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: "pointer",
                          fontFamily: "'JetBrains Mono', monospace",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          transition: "all 0.2s ease",
                        }}>
                        ✓ Acknowledge
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── How-to hint ──────────────────────────────────────── */}
        <div
          style={{
            marginTop: 22,
            padding: "14px 18px",
            background: "rgba(255,255,255,0.70)",
            border: "1px dashed rgba(45,212,191,0.22)",
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "pmFadeUp 0.45s ease 0.30s both",
          }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 9,
              background: "rgba(45,212,191,0.09)",
              border: "1px solid rgba(45,212,191,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
            <Bell size={13} color="#2DD4BF" />
          </div>
          <p
            style={{
              fontSize: 12,
              color: "#64748b",
              margin: 0,
              lineHeight: 1.65,
            }}>
            <span style={{ fontWeight: 700, color: "#0B1E33" }}>
              How to use:
            </span>{" "}
            Tick the circle next to each message once you've read and noted it.
            Important instructions require your acknowledgment and may contain
            protocol changes or appointment details. Use the{" "}
            <span style={{ color: "#2DD4BF", fontWeight: 700 }}>
              chat button
            </span>{" "}
            below to send a direct message to Dr. Johnson.
          </p>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════
          FLOATING CHAT BUTTON (FAB)
      ══════════════════════════════════════════════════════ */}
      <button className="pm-fab" onClick={() => setChatOpen(true)}>
        <MessageCircle size={24} />
        {/* Unread chat indicator — show if last message is from doctor */}
        {chatMsgs[chatMsgs.length - 1]?.sender === "doctor" && !chatOpen && (
          <div
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#ef4444",
              border: "2.5px solid #F0F4F8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 800,
              color: "#fff",
            }}>
            !
          </div>
        )}
      </button>

      {/* ══════════════════════════════════════════════════════
          CHAT MODAL OVERLAY
      ══════════════════════════════════════════════════════ */}
      {chatOpen && (
        <div
          className="pm-chat-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setChatOpen(false);
          }}>
          <div className="pm-chat-panel">
            {/* Panel header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(226,232,240,0.8)",
                background: "linear-gradient(135deg,#f8fdfc,#f0fdfb)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Avatar */}
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 13,
                      background: "linear-gradient(135deg,#2DD4BF,#0891b2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#0B1E33",
                      boxShadow: "0 0 0 2px rgba(45,212,191,0.22)",
                      animation: "pmGlow 3s ease-in-out infinite",
                    }}>
                    {DOCTOR.initials}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: -1,
                      right: -1,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#22c55e",
                      border: "2px solid #fff",
                    }}
                  />
                </div>
                <div>
                  <div
                    style={{ fontSize: 14, fontWeight: 800, color: "#0B1E33" }}>
                    {DOCTOR.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 2,
                    }}>
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#22c55e",
                        boxShadow: "0 0 5px #22c55e80",
                        animation: "pmDot 2s ease-in-out infinite",
                      }}
                    />
                    <span
                      className="mono"
                      style={{
                        fontSize: 9.5,
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        fontWeight: 600,
                      }}>
                      Direct Channel
                    </span>
                  </div>
                </div>
              </div>

              {/* Close */}
              <button
                onClick={() => setChatOpen(false)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 11,
                  background: "rgba(11,30,51,0.06)",
                  border: "1px solid rgba(226,232,240,0.9)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  transition: "all 0.2s ease",
                  flexShrink: 0,
                }}>
                <X size={15} />
              </button>
            </div>

            {/* Messages area */}
            <div
              className="pm-chat-msgs"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}>
              {/* Date stamp */}
              <div style={{ textAlign: "center", marginBottom: 4 }}>
                <span
                  className="mono"
                  style={{
                    fontSize: 9,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    background: "rgba(240,244,248,0.9)",
                    padding: "3px 12px",
                    borderRadius: 99,
                  }}>
                  Today
                </span>
              </div>

              {chatMsgs.map((msg, i) => {
                const isDoc = msg.sender === "doctor";
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent: isDoc ? "flex-start" : "flex-end",
                      gap: 8,
                      alignItems: "flex-end",
                      animation: `pmMsgIn 0.28s cubic-bezier(0.22,1,0.36,1) ${i * 0.04}s both`,
                    }}>
                    {/* Doctor avatar */}
                    {isDoc && (
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 9,
                          background: "linear-gradient(135deg,#2DD4BF,#0891b2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 9,
                          fontWeight: 800,
                          color: "#0B1E33",
                          flexShrink: 0,
                        }}>
                        {DOCTOR.initials}
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      style={{
                        maxWidth: "72%",
                        padding: "10px 14px",
                        borderRadius: isDoc
                          ? "16px 16px 16px 4px"
                          : "16px 16px 4px 16px",
                        background: isDoc
                          ? "#fff"
                          : "linear-gradient(135deg,#2DD4BF,#0891b2)",
                        border: isDoc
                          ? "1.5px solid rgba(226,232,240,0.9)"
                          : "none",
                        color: isDoc ? "#0B1E33" : "#0B1E33",
                        boxShadow: isDoc
                          ? "0 2px 10px rgba(11,30,51,0.06)"
                          : "0 4px 16px rgba(45,212,191,0.28)",
                        position: "relative",
                        overflow: isDoc ? "visible" : "hidden",
                      }}>
                      {/* Shimmer on patient bubble */}
                      {!isDoc && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)",
                            animation: "pmShimmer 3.5s ease-in-out infinite",
                          }}
                        />
                      )}
                      <p
                        style={{
                          fontSize: 13,
                          lineHeight: 1.6,
                          margin: 0,
                          position: "relative",
                          zIndex: 1,
                        }}>
                        {msg.text}
                      </p>
                      <p
                        className="mono"
                        style={{
                          fontSize: 9,
                          marginTop: 5,
                          position: "relative",
                          zIndex: 1,
                          color: isDoc ? "#94a3b8" : "rgba(11,30,51,0.48)",
                          textAlign: "right",
                        }}>
                        {msg.time}
                      </p>
                    </div>

                    {/* Patient avatar */}
                    {!isDoc && (
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 9,
                          background: "rgba(11,30,51,0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}>
                        <User size={14} color="#64748b" />
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input bar */}
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid rgba(226,232,240,0.8)",
                background: "#fafbfd",
                display: "flex",
                alignItems: "center",
                gap: 9,
                flexShrink: 0,
              }}>
              <input
                ref={chatInputRef}
                className="pm-chat-input"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKey}
                placeholder={`Message ${DOCTOR.name.split(" ")[0]}...`}
                disabled={!doctorId}
              />
              <button
                onClick={sendChat}
                disabled={!chatInput.trim() || !doctorId}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: chatInput.trim()
                    ? "linear-gradient(135deg,#2DD4BF,#0891b2)"
                    : "rgba(226,232,240,0.9)",
                  border: "none",
                  cursor: chatInput.trim() ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: chatInput.trim() ? "#0B1E33" : "#94a3b8",
                  flexShrink: 0,
                  transition: "all 0.2s ease",
                  boxShadow: chatInput.trim()
                    ? "0 4px 14px rgba(45,212,191,0.32)"
                    : "none",
                }}>
                <Send size={16} />
              </button>
            </div>

            {/* Disclaimer */}
            <div
              style={{
                padding: "8px 16px 12px",
                background: "#fafbfd",
                borderTop: "1px solid rgba(226,232,240,0.5)",
                flexShrink: 0,
              }}>
              <p
                className="mono"
                style={{
                  fontSize: 8.5,
                  color: "#94a3b8",
                  textAlign: "center",
                  margin: 0,
                  textTransform: "uppercase",
                  letterSpacing: "0.10em",
                }}>
                Direct channel · Replies during clinic hours ·{" "}
                {DOCTOR.availability}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
