"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Search,
  Bot,
  User,
  MessageCircle,
  AlertCircle,
  Activity,
  Sparkles,
  Lock,
  CheckCircle2,
  ChevronRight,
  Zap,
  Shield,
  ToggleLeft,
  ToggleRight,
  Info,
  Crown,
  Loader2,
} from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../../../../lib/firebase";
import { getPatientsByDoctor } from "../../../../../lib/db/users";
import { getCohortSessionsThisWeek } from "../../../../../lib/db/sessions";
import {
  subscribeToDirect,
  sendDirectMessage,
  sendFromDoctor,
} from "../../../../../lib/db/communications";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { Communication, TherapyProtocol } from "../../../../../lib/db/types";
import { useDarkMode } from "@/app/lib/hooks/useDarkMode";

// ─── MOCK FLAG — set false to restore full Firebase + auth flow ────────────
const USE_MOCK = false;

interface SidebarPatient {
  uid: string;
  name: string;
  pid: string;
  condition: string;
  status: "High" | "Medium" | "Low";
  adherence: number;
  isAIPlan: boolean;
}

const MOCK_SIDEBAR: SidebarPatient[] = [
  {
    uid: "mock_p1",
    name: "P.B. De Silva",
    pid: "P001",
    condition: "Stroke",
    status: "Low",
    adherence: 45,
    isAIPlan: false,
  },
  {
    uid: "mock_p2",
    name: "Anura Dissanayaka",
    pid: "P002",
    condition: "TBI",
    status: "High",
    adherence: 92,
    isAIPlan: true,
  },
  {
    uid: "mock_p3",
    name: "Sarath Watawala",
    pid: "P003",
    condition: "Post-Surgery",
    status: "High",
    adherence: 78,
    isAIPlan: false,
  },
  {
    uid: "mock_p4",
    name: "Shifani Ameena",
    pid: "P004",
    condition: "Parkinson's",
    status: "Medium",
    adherence: 65,
    isAIPlan: true,
  },
  {
    uid: "mock_p5",
    name: "Percy Silva",
    pid: "P005",
    condition: "Stroke",
    status: "High",
    adherence: 88,
    isAIPlan: false,
  },
  {
    uid: "mock_p6",
    name: "Athula Premachandra",
    pid: "P006",
    condition: "TBI",
    status: "Low",
    adherence: 52,
    isAIPlan: false,
  },
  {
    uid: "mock_p7",
    name: "Aruni Perera",
    pid: "P007",
    condition: "Post-Surgery",
    status: "High",
    adherence: 95,
    isAIPlan: true,
  },
  {
    uid: "mock_p8",
    name: "Amal Mahendra",
    pid: "P008",
    condition: "Stroke",
    status: "Medium",
    adherence: 73,
    isAIPlan: false,
  },
  {
    uid: "mock_p9",
    name: "Malkanthi Peris",
    pid: "P009",
    condition: "Parkinson's",
    status: "Low",
    adherence: 25,
    isAIPlan: false,
  },
  {
    uid: "mock_p10",
    name: "K.K. Muththukumaran",
    pid: "P010",
    condition: "TBI",
    status: "Medium",
    adherence: 76,
    isAIPlan: false,
  },
  {
    uid: "mock_p11",
    name: "Kamal Fernando",
    pid: "P011",
    condition: "Stroke",
    status: "High",
    adherence: 80,
    isAIPlan: true,
  },
  {
    uid: "mock_p12",
    name: "P.P. Sugathadasa",
    pid: "P012",
    condition: "Post-Surgery",
    status: "Medium",
    adherence: 63,
    isAIPlan: false,
  },
];

const MOCK_CHATS: Record<
  string,
  { sender: "doctor" | "patient"; text: string; time: string }[]
> = {
  mock_p1: [
    {
      sender: "patient",
      text: "Doctor, I've been struggling with the grip exercises. My hand tires out quickly.",
      time: "09:14",
    },
    {
      sender: "doctor",
      text: "That's completely normal at this stage. Try resting 90 seconds between sets — we can also reduce target force by 10%.",
      time: "09:22",
    },
    {
      sender: "patient",
      text: "Should I still aim for all 5 sessions this week?",
      time: "09:25",
    },
    {
      sender: "doctor",
      text: "Yes — keep the frequency, reduce intensity. Consistency matters more than force right now.",
      time: "09:31",
    },
    {
      sender: "patient",
      text: "Thank you doctor. I'll try today.",
      time: "09:33",
    },
  ],
  mock_p2: [
    {
      sender: "patient",
      text: "I finished all 5 sessions this week! The Rhythm Reef game is really enjoyable.",
      time: "10:05",
    },
    {
      sender: "doctor",
      text: "Excellent work, Anura! Your reaction time improved 18% this month — exceptional for TBI recovery.",
      time: "10:18",
    },
    {
      sender: "patient",
      text: "The AI companion tips have been very helpful.",
      time: "10:20",
    },
    {
      sender: "doctor",
      text: "Wonderful. Advancing you to Level 3 starting Monday. Keep this momentum.",
      time: "10:24",
    },
  ],
  mock_p4: [
    {
      sender: "patient",
      text: "The tremors are worse in the mornings. Should I do sessions in the afternoon?",
      time: "14:02",
    },
    {
      sender: "doctor",
      text: "Yes, try afternoon sessions when tremors are more settled. Very common with Parkinson's — I'll note this.",
      time: "14:15",
    },
    { sender: "patient", text: "Thank you, that makes sense.", time: "14:18" },
  ],
  mock_p6: [
    {
      sender: "doctor",
      text: "Athula, I noticed you've missed a few sessions. Is everything okay?",
      time: "11:00",
    },
    {
      sender: "patient",
      text: "Very tired after work. Hard to find motivation in the evenings.",
      time: "11:14",
    },
    {
      sender: "doctor",
      text: "Let's try shorter 8-minute sessions for this week to keep the streak going. Small progress is still progress.",
      time: "11:19",
    },
    { sender: "patient", text: "I'll try that. Thank you.", time: "11:22" },
  ],
  mock_p7: [
    {
      sender: "patient",
      text: "Completed session 19 this morning! Feeling really strong.",
      time: "08:02",
    },
    {
      sender: "doctor",
      text: "Aruni, 95% adherence this month is remarkable. Level 4 evaluation is scheduled for Friday.",
      time: "08:15",
    },
    {
      sender: "patient",
      text: "I'm excited! The AI companion suggested I work on my pinch grip too.",
      time: "08:18",
    },
    {
      sender: "doctor",
      text: "Yes, great addition. I'll update your protocol at the next review.",
      time: "08:22",
    },
  ],
  mock_p9: [
    {
      sender: "doctor",
      text: "Malkanthi, only 5 sessions completed this month. Is everything okay?",
      time: "11:00",
    },
    {
      sender: "patient",
      text: "I've been having bad tremor days. Some mornings I can't hold the device.",
      time: "11:14",
    },
    {
      sender: "doctor",
      text: "Adjusting your protocol to shorter 8-minute sessions. Try one today when you feel ready.",
      time: "11:19",
    },
    {
      sender: "patient",
      text: "I will try. Thank you for understanding.",
      time: "11:22",
    },
  ],
};
function getMockChat(uid: string) {
  return (
    MOCK_CHATS[uid] ?? [
      {
        sender: "doctor" as const,
        text: `Hello ${MOCK_SIDEBAR.find((p) => p.uid === uid)?.name.split(" ")[0] ?? "there"}! How are your therapy sessions going this week?`,
        time: "09:00",
      },
      {
        sender: "patient" as const,
        text: "Things are going well, thank you doctor.",
        time: "09:05",
      },
    ]
  );
}
// ──────────────────────────────────────────────────────────────────────────────

type ActivePanel = "chat" | "instruction" | "feedback";
interface ChatMessage {
  sender: "doctor" | "patient";
  text: string;
  time: string;
}
interface SentItem {
  id: string;
  type: "instruction" | "feedback" | "ai_insight";
  title: string;
  content: string;
  time: string;
  isImportant: boolean;
  sentByAI: boolean;
}

function statusColor(s: string) {
  return s === "High" ? "#22c55e" : s === "Medium" ? "#f59e0b" : "#ef4444";
}
function adherenceColor(v: number) {
  return v >= 80 ? "#22c55e" : v >= 55 ? "#f97316" : "#ef4444";
}
function getStatus(a: number): "High" | "Medium" | "Low" {
  return a >= 80 ? "High" : a >= 55 ? "Medium" : "Low";
}
function initials(n: string) {
  return n
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}
function commToChat(c: Communication, docId: string): ChatMessage {
  return {
    sender: c.senderId === docId ? "doctor" : "patient",
    text: c.content,
    time: (c.timestamp as Timestamp)
      .toDate()
      .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  .dm * { font-family:'Plus Jakarta Sans',system-ui,sans-serif; box-sizing:border-box; }
  .dm .mono { font-family:'JetBrains Mono',monospace; }
  @keyframes dmFadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes dmCardPop { 0%{opacity:0;transform:translateY(14px) scale(.97)} 100%{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes dmMsgIn   { from{opacity:0;transform:translateY(10px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes dmShimmer { 0%{transform:translateX(-200%) skewX(-15deg)} 100%{transform:translateX(400%) skewX(-15deg)} }
  @keyframes dmDot     { 0%,100%{opacity:1} 50%{opacity:.28} }
  @keyframes dmGlow    { 0%,100%{box-shadow:0 0 0 0 rgba(45,212,191,.35)} 50%{box-shadow:0 0 0 9px rgba(45,212,191,0)} }
  @keyframes dmScanLine{ 0%{top:-4%;opacity:0} 6%{opacity:1} 92%{opacity:.55} 100%{top:108%;opacity:0} }
  @keyframes dmSpin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes dmAiPulse { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,.40)} 50%{box-shadow:0 0 0 10px rgba(99,102,241,0)} }
  @keyframes dmSentPop { 0%{opacity:0;transform:scale(.82) translateY(14px)} 70%{transform:scale(1.04)} 100%{opacity:1;transform:scale(1) translateY(0)} }
  .dm-patient-btn{width:100%;text-align:left;background:none;border:none;padding:10px 12px;border-radius:14px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:10px}
  .dm-patient-btn:hover{background:rgba(45,212,191,.07)}
  .dm-patient-btn.active{background:linear-gradient(135deg,rgba(45,212,191,.14),rgba(8,145,178,.08));border:1px solid rgba(45,212,191,.24)}
  .dm-tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;padding:11px 8px;border-radius:14px;border:none;cursor:pointer;transition:all .22s;font-family:'Plus Jakarta Sans',sans-serif;position:relative;overflow:hidden}
  .dm-tab:hover{transform:translateY(-2px)}
  .dm-tab.active::after{content:'';position:absolute;bottom:0;left:20%;right:20%;height:2.5px;border-radius:99px;background:currentColor;opacity:.55}
  .dm-bubble-doc{background:#fff;color:#0B1E33;border:1.5px solid rgba(226,232,240,.9);border-radius:18px 18px 18px 4px;padding:11px 15px;max-width:74%;box-shadow:0 2px 10px rgba(11,30,51,.055);animation:dmMsgIn .28s cubic-bezier(.22,1,.36,1) both}
  .dm-bubble-pat{background:linear-gradient(135deg,#2DD4BF,#0891b2);color:#0B1E33;border-radius:18px 18px 4px 18px;padding:11px 15px;max-width:74%;box-shadow:0 4px 16px rgba(45,212,191,.28);animation:dmMsgIn .28s cubic-bezier(.22,1,.36,1) both;position:relative;overflow:hidden}
  .dm-bubble-pat::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.16),transparent);animation:dmShimmer 4s ease-in-out infinite}
  .dm-send-btn{width:42px;height:42px;border-radius:13px;border:none;cursor:pointer;background:linear-gradient(135deg,#2DD4BF,#0891b2);color:#0B1E33;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(45,212,191,.32);transition:all .22s;flex-shrink:0;animation:dmGlow 3s ease-in-out infinite}
  .dm-send-btn:hover{transform:scale(1.08) translateY(-2px)}
  .dm-send-btn:disabled{background:rgba(226,232,240,.9);box-shadow:none;cursor:default;animation:none}
  .dm-input{flex:1;padding:11px 14px;background:rgba(240,244,248,.85);border:1.5px solid rgba(226,232,240,.9);border-radius:13px;font-size:13px;font-weight:500;color:#0B1E33;outline:none;transition:all .2s;font-family:'Plus Jakarta Sans',sans-serif}
  .dm-input::placeholder{color:#94a3b8}
  .dm-input:focus{background:#fff;border-color:rgba(45,212,191,.50);box-shadow:0 0 0 3px rgba(45,212,191,.10)}
  .dm-textarea{width:100%;padding:13px 14px;background:rgba(240,244,248,.75);border:1.5px solid rgba(226,232,240,.9);border-radius:14px;font-size:13px;line-height:1.68;font-weight:500;color:#0B1E33;outline:none;resize:none;transition:all .2s;font-family:'Plus Jakarta Sans',sans-serif}
  .dm-textarea::placeholder{color:#94a3b8}
  .dm-textarea:focus{background:#fff;border-color:rgba(45,212,191,.50);box-shadow:0 0 0 3px rgba(45,212,191,.10)}
  .dm-title-input{width:100%;padding:11px 14px;background:rgba(240,244,248,.75);border:1.5px solid rgba(226,232,240,.9);border-radius:13px;font-size:13.5px;font-weight:700;color:#0B1E33;outline:none;transition:all .2s;font-family:'Plus Jakarta Sans',sans-serif}
  .dm-title-input::placeholder{color:#94a3b8;font-weight:500}
  .dm-title-input:focus{background:#fff;border-color:rgba(45,212,191,.50);box-shadow:0 0 0 3px rgba(45,212,191,.10)}
  .dm-compose-btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:13px 22px;border-radius:14px;border:none;cursor:pointer;font-size:13px;font-weight:800;letter-spacing:.04em;transition:all .24s;position:relative;overflow:hidden;font-family:'Plus Jakarta Sans',sans-serif}
  .dm-compose-btn::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);animation:dmShimmer 3s ease-in-out infinite}
  .dm-compose-btn:hover{transform:translateY(-2px)}
  .dm-ai-btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:11px 18px;border-radius:13px;cursor:pointer;font-size:12px;font-weight:800;letter-spacing:.04em;border:1.5px solid rgba(99,102,241,.30);background:rgba(99,102,241,.07);color:#6366f1;transition:all .22s;font-family:'Plus Jakarta Sans',sans-serif}
  .dm-ai-btn:hover{background:rgba(99,102,241,.14);border-color:rgba(99,102,241,.50);transform:translateY(-1px)}
  .dm-toggle{display:flex;align-items:center;gap:8px;cursor:pointer;background:none;border:none;padding:0;font-family:'Plus Jakarta Sans',sans-serif}
  .dm-sent-item{padding:12px 16px;border-radius:14px;border:1.5px solid rgba(226,232,240,.9);background:#fafbfd;animation:dmSentPop .4s cubic-bezier(.22,1,.36,1) both;position:relative;overflow:hidden}
  .dm-msgs::-webkit-scrollbar{width:3px}
  .dm-msgs::-webkit-scrollbar-thumb{background:rgba(45,212,191,.22);border-radius:99px}
  .dm-sidebar::-webkit-scrollbar{width:3px}
  .dm-sidebar::-webkit-scrollbar-thumb{background:rgba(45,212,191,.18);border-radius:99px}
  .dm-scroll::-webkit-scrollbar{width:3px}
  .dm-scroll::-webkit-scrollbar-thumb{background:rgba(45,212,191,.18);border-radius:99px}
  .dm-lock{position:absolute;inset:0;background:rgba(248,247,255,.92);backdrop-filter:blur(3px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:10}
  @media(max-width:820px){.dm-sidebar-wrap{display:none!important}.dm-main-col{border-radius:20px!important}}
  @media(max-width:600px){.dm{padding:14px!important;gap:12px!important}.dm-tab span.dm-tab-label{display:none!important}}
  /* ── Dark mode overrides ── */
  .dark .dm-patient-btn:hover { background: rgba(45,212,191,.12); }
  .dark .dm-patient-btn.active { background: linear-gradient(135deg,rgba(45,212,191,.18),rgba(8,145,178,.12)); border-color: rgba(45,212,191,.30); }
  .dark .dm-bubble-doc { background: #1e293b; color: #f1f5f9; border-color: #334155; }
  .dark .dm-send-btn:disabled { background: #334155; color: #64748b; box-shadow: none; animation: none; }
  .dark .dm-input { background: #334155; border-color: #475569; color: #f1f5f9; }
  .dark .dm-input::placeholder { color: #64748b; }
  .dark .dm-input:focus { background: #1e293b; border-color: rgba(45,212,191,.50); }
  .dark .dm-textarea { background: #334155; border-color: #475569; color: #f1f5f9; }
  .dark .dm-textarea::placeholder { color: #64748b; }
  .dark .dm-textarea:focus { background: #1e293b; border-color: rgba(45,212,191,.50); }
  .dark .dm-title-input { background: #334155; border-color: #475569; color: #f1f5f9; }
  .dark .dm-title-input::placeholder { color: #64748b; font-weight: 500; }
  .dark .dm-title-input:focus { background: #1e293b; border-color: rgba(45,212,191,.50); }
  .dark .dm-sent-item { background: #1e293b; border-color: #334155; }
  .dark .dm-lock { background: rgba(15,23,42,.97); }
`;

function MiniBar({ value, color }: { value: number; color: string }) {
  const [w, setW] = useState(0);
  const isDark = useDarkMode();
  useEffect(() => {
    const t = setTimeout(() => setW(value), 200);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div
      style={{
        width: 46,
        height: 4,
        background: isDark ? "rgba(241,245,249,.10)" : "rgba(11,30,51,.08)",
        borderRadius: 99,
        overflow: "hidden",
        flexShrink: 0,
      }}>
      <div
        style={{
          height: "100%",
          borderRadius: 99,
          width: `${w}%`,
          background: color,
          transition: "width .9s cubic-bezier(.22,1,.36,1)",
        }}
      />
    </div>
  );
}

export default function DoctorMessagingHub() {
  const { id } = useParams();
  const initId = Array.isArray(id) ? id[0] : (id ?? "");
  const [user, authLoading] = useAuthState(auth);
  const doctorId = user?.uid ?? "";
  const [mounted, setMounted] = useState(false);
  const isDark = useDarkMode();

  const [selectedId, setSelectedId] = useState(initId);
  const [panel, setPanel] = useState<ActivePanel>("chat");
  const [search, setSearch] = useState("");
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [sidebarPatients, setSidebarPatients] = useState<SidebarPatient[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);

  const [instrTitle, setInstrTitle] = useState("");
  const [instrContent, setInstrContent] = useState("");
  const [instrImportant, setInstrImportant] = useState(false);
  const [instrSent, setInstrSent] = useState<Record<string, SentItem[]>>({});
  const [fbTitle, setFbTitle] = useState("");
  const [fbContent, setFbContent] = useState("");
  const [fbImportant, setFbImportant] = useState(false);
  const [fbSent, setFbSent] = useState<Record<string, SentItem[]>>({});
  const [aiMode, setAiMode] = useState<"feedback" | "instruction">("feedback");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState("");
  const [aiTitle, setAiTitle] = useState("");
  const [aiSent, setAiSent] = useState<Record<string, SentItem[]>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Load sidebar ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;

    if (USE_MOCK) {
      // Mock: instant, no auth
      setSidebarPatients(MOCK_SIDEBAR);
      if (!initId) setSelectedId(MOCK_SIDEBAR[0].uid);
      setPatientsLoading(false);
      return;
    }

    // Real path
    if (authLoading && !doctorId) return;
    if (!doctorId) {
      setPatientsLoading(false);
      return;
    }

    (async () => {
      try {
        const patients = await getPatientsByDoctor(doctorId);
        if (!patients.length) {
          setSidebarPatients([]);
          return;
        }
        const uids = patients.map((p) => p.uid);
        const weekSessions = await getCohortSessionsThisWeek(uids);
        const snap = await getDocs(
          query(collection(db, "protocols"), where("doctorId", "==", doctorId)),
        );
        const protocolMap = new Map<string, number>();
        snap.docs.forEach((d) => {
          const d2 = d.data();
          protocolMap.set(d2.patientId, d2.sessionsPerWeek ?? 5);
        });
        setSidebarPatients(
          patients.map((p) => {
            const spw = protocolMap.get(p.uid) ?? 5;
            const completed = weekSessions.filter(
              (s) => s.userId === p.uid && s.durationSeconds > 60,
            ).length;
            const adherence = Math.min(
              100,
              Math.round((completed / spw) * 100),
            );
            return {
              uid: p.uid,
              name: p.name,
              pid: (p as any).patientId ?? p.uid.slice(0, 7).toUpperCase(),
              condition: p.condition,
              status: getStatus(adherence),
              adherence,
              isAIPlan: (p as any).subscriptionPlan === "ai_companion",
            };
          }),
        );
        if (!initId) setSelectedId(patients[0]?.uid ?? "");
      } catch (e) {
        console.error(e);
      } finally {
        setPatientsLoading(false);
      }
    })();
  }, [mounted, authLoading, doctorId, initId]);

  // ── Load chat ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedId) return;
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    setChatLoading(true);
    setChatMessages([]);

    if (USE_MOCK) {
      // Mock: fake 380ms delay then load seeded messages
      const t = setTimeout(() => {
        setChatMessages(getMockChat(selectedId));
        setChatLoading(false);
      }, 380);
      return () => clearTimeout(t);
    }

    // Real path
    if (!doctorId) return;
    const unsub = subscribeToDirect(selectedId, doctorId, (comms) => {
      console.log("Realtime messages:", comms);
      setChatMessages(comms.map((c) => commToChat(c, doctorId)));
      setChatLoading(false);
    });
    unsubRef.current = unsub;
    return () => {
      unsub();
    };
  }, [selectedId, doctorId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    setInstrTitle("");
    setInstrContent("");
    setInstrImportant(false);
    setFbTitle("");
    setFbContent("");
    setFbImportant(false);
    setAiDraft("");
    setAiTitle("");
    setPanel("chat");
  }, [selectedId]);

  const patient = sidebarPatients.find((p) => p.uid === selectedId);
  const sColor = patient ? statusColor(patient.status) : "#94a3b8";
  const aColor = patient ? adherenceColor(patient.adherence) : "#94a3b8";
  const canUseAI = patient?.isAIPlan ?? false;
  const filtered = sidebarPatients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.pid.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const sendChat = async () => {
    if (!chatInput.trim() || sending) return;
    const text = chatInput.trim();
    const patientId = selectedId;
    if (!USE_MOCK && (!doctorId || !patientId)) return;
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setChatInput("");
    setSending(true);
    if (USE_MOCK) {
      setChatMessages((prev) => [...prev, { sender: "doctor", text, time }]);
      setSending(false);
      setTimeout(() => chatInputRef.current?.focus(), 50);
      return;
    }
    try {
      await sendDirectMessage(doctorId, patientId, text);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
      setTimeout(() => chatInputRef.current?.focus(), 50);
    }
  };

  const handleChatKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  };

  const sendInstruction = async () => {
    if (!instrTitle.trim() || !instrContent.trim()) return;
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const item: SentItem = {
      id: Date.now().toString(),
      type: "instruction",
      title: instrTitle,
      content: instrContent,
      time,
      isImportant: instrImportant,
      sentByAI: false,
    };
    setInstrSent((prev) => ({
      ...prev,
      [selectedId]: [item, ...(prev[selectedId] ?? [])],
    }));
    setInstrTitle("");
    setInstrContent("");
    setInstrImportant(false);
    if (!USE_MOCK && doctorId) {
      try {
        await sendFromDoctor(
          doctorId,
          selectedId,
          "instruction",
          item.title,
          item.content,
          item.isImportant,
        );
      } catch (e) {
        console.error(e);
      }
    }
  };

  const sendFeedback = async () => {
    if (!fbTitle.trim() || !fbContent.trim()) return;
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const item: SentItem = {
      id: Date.now().toString(),
      type: "feedback",
      title: fbTitle,
      content: fbContent,
      time,
      isImportant: fbImportant,
      sentByAI: false,
    };
    setFbSent((prev) => ({
      ...prev,
      [selectedId]: [item, ...(prev[selectedId] ?? [])],
    }));
    setFbTitle("");
    setFbContent("");
    setFbImportant(false);
    if (!USE_MOCK && doctorId) {
      try {
        await sendFromDoctor(
          doctorId,
          selectedId,
          "feedback",
          item.title,
          item.content,
          item.isImportant,
        );
      } catch (e) {
        console.error(e);
      }
    }
  };

  // FIXED: real patients → {patientUid, type}; mock → inline prompt
  const generateAI = useCallback(
    async (modeOverride?: "feedback" | "instruction") => {
      if (!canUseAI || !patient) return;
      const mode = modeOverride ?? aiMode;
      setAiLoading(true);
      setAiDraft("");
      setAiTitle("");
      try {
        let text = "";
        if (USE_MOCK) {
          const firstName = patient.name.split(" ")[0] ?? "Patient";
          text =
            mode === "feedback"
              ? `${firstName}, your current adherence is ${patient.adherence}% with ${patient.status.toLowerCase()} engagement risk this week. You are maintaining meaningful effort. Keep your session frequency stable and focus on controlled movement quality for stronger carryover into daily hand function.`
              : `${firstName}, continue your scheduled sessions this week with emphasis on consistent pacing and controlled grip release. Reduce intensity by 10% if fatigue rises early, but complete all planned sets. This adjustment is based on your current adherence and condition profile.`;
        } else {
          // Real: route fetches Firestore data internally
          const res = await fetch("/api/llm/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ patientUid: selectedId, type: mode }),
          });
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data?.error ?? "Failed to generate AI message.");
          }

          text =
            data?.generated ??
            data?.response ??
            data?.reply ??
            data?.content?.[0]?.text ??
            "";
        }

        if (!text.trim()) {
          throw new Error("No content generated. Please try again.");
        }

        const today = new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        });

        const generatedTitle =
          mode === "feedback"
            ? `Progress Feedback — ${patient.name.split(" ")[0]} (${today})`
            : `Protocol Instruction — ${patient.name.split(" ")[0]} (${today})`;

        setAiDraft(text);
        setAiTitle(generatedTitle);

        if (mode === "instruction") {
          setInstrTitle(generatedTitle);
          setInstrContent(text);
          setInstrImportant(true);
          setPanel("instruction");
        } else {
          setFbTitle(generatedTitle);
          setFbContent(text);
          setFbImportant(false);
          setPanel("feedback");
        }
      } catch (e: any) {
        console.error(e);
        setAiDraft(e?.message || "Failed to generate. Please try again.");
      } finally {
        setAiLoading(false);
      }
    },
    [canUseAI, patient, aiMode, selectedId],
  );

  const sendAiDraft = async () => {
    if (!aiDraft.trim() || !aiTitle.trim()) return;
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const item: SentItem = {
      id: Date.now().toString(),
      type: aiMode === "feedback" ? "ai_insight" : "instruction",
      title: aiTitle,
      content: aiDraft,
      time,
      isImportant: false,
      sentByAI: true,
    };
    setAiSent((prev) => ({
      ...prev,
      [selectedId]: [item, ...(prev[selectedId] ?? [])],
    }));
    setAiDraft("");
    setAiTitle("");
    if (!USE_MOCK && doctorId) {
      try {
        const t =
          aiMode === "feedback"
            ? ("ai_insight" as const)
            : ("instruction" as const);
        await sendFromDoctor(doctorId, selectedId, t, item.title, item.content);
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (!mounted) return null;

  // ── Sub-panels ────────────────────────────────────────────────────────────
  const ChatPanel = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
      }}>
      <div
        className="dm-msgs"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
        {chatLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              gap: 10,
            }}>
            <Loader2
              size={20}
              color="#2DD4BF"
              style={{ animation: "dmSpin 1s linear infinite" }}
            />
            <span
              style={{ fontSize: 13, color: isDark ? "#64748b" : "#94a3b8" }}>
              Loading messages…
            </span>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <span
                className="mono"
                style={{
                  fontSize: 9,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  background: isDark
                    ? "rgba(30,41,59,.8)"
                    : "rgba(240,244,248,.9)",
                  padding: "3px 12px",
                  borderRadius: 99,
                }}>
                {chatMessages.length === 0
                  ? "Start the conversation"
                  : USE_MOCK
                    ? "Sample conversation"
                    : "Messages"}
              </span>
            </div>
            {chatMessages.map((msg, i) => {
              const isDoc = msg.sender === "doctor";
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: isDoc ? "flex-end" : "flex-start",
                    gap: 8,
                    alignItems: "flex-end",
                  }}>
                  {!isDoc && (
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 9,
                        background: `${aColor}22`,
                        border: `1.5px solid ${aColor}44`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        fontWeight: 800,
                        color: aColor,
                        flexShrink: 0,
                      }}>
                      {patient ? initials(patient.name) : "?"}
                    </div>
                  )}
                  <div className={isDoc ? "dm-bubble-doc" : "dm-bubble-pat"}>
                    <p
                      style={{
                        fontSize: 13.5,
                        lineHeight: 1.62,
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
                        textAlign: "right",
                        position: "relative",
                        zIndex: 1,
                        color: isDoc
                          ? isDark
                            ? "#64748b"
                            : "#94a3b8"
                          : "rgba(11,30,51,.45)",
                      }}>
                      {msg.time}
                    </p>
                  </div>
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
                      Dr
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </>
        )}
      </div>
      <div
        style={{
          padding: "12px 18px",
          borderTop: `1px solid ${isDark ? "#334155" : "rgba(226,232,240,.8)"}`,
          background: isDark ? "#0f172a" : "#fafbfd",
          display: "flex",
          alignItems: "center",
          gap: 9,
        }}>
        <input
          ref={chatInputRef}
          className="dm-input"
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={handleChatKey}
          placeholder={
            patient
              ? `Message ${patient.name.split(" ")[0]}${USE_MOCK ? " (demo)" : ""}…`
              : "Select a patient…"
          }
          disabled={!patient || sending}
        />
        <button
          className="dm-send-btn"
          onClick={sendChat}
          disabled={!chatInput.trim() || !patient || sending}>
          {sending ? (
            <Loader2
              size={16}
              style={{ animation: "dmSpin 1s linear infinite" }}
            />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>
    </div>
  );

  const ComposeForm = ({
    typeLabel,
    typeColor,
    title,
    setTitle,
    content,
    setContent,
    important,
    setImportant,
    onSend,
    onGenerate,
    isGenerating,
    generateLabel,
    sentItems,
    hint,
  }: {
    typeLabel: string;
    typeColor: string;
    title: string;
    setTitle: (v: string) => void;
    content: string;
    setContent: (v: string) => void;
    important: boolean;
    setImportant: (v: boolean) => void;
    onSend: () => void;
    onGenerate: () => void;
    isGenerating: boolean;
    generateLabel: string;
    sentItems: SentItem[];
    hint: string;
  }) => (
    <div
      className="dm-scroll"
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 9,
          padding: "10px 14px",
          background: `${typeColor}08`,
          border: `1px solid ${typeColor}28`,
          borderRadius: 12,
        }}>
        <Info
          size={13}
          color={typeColor}
          style={{ flexShrink: 0, marginTop: 1 }}
        />
        <p
          style={{
            fontSize: 12,
            color: isDark ? "#94a3b8" : "#475569",
            margin: 0,
            lineHeight: 1.6,
          }}>
          {hint}
        </p>
      </div>
      <div>
        <label
          className="mono"
          style={{
            display: "block",
            fontSize: 9,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            fontWeight: 700,
            marginBottom: 7,
          }}>
          Title
        </label>
        <input
          className="dm-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            typeLabel === "Instruction"
              ? "e.g. Protocol Adjustment — Week 4"
              : "e.g. Weekly Progress Summary"
          }
        />
      </div>
      <div>
        <label
          className="mono"
          style={{
            display: "block",
            fontSize: 9,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            fontWeight: 700,
            marginBottom: 7,
          }}>
          Content
        </label>
        <textarea
          className="dm-textarea"
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Write your ${typeLabel.toLowerCase()} for ${patient?.name.split(" ")[0] ?? "patient"}…`}
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}>
        <button className="dm-toggle" onClick={() => setImportant(!important)}>
          {important ? (
            <ToggleRight size={22} color={typeColor} />
          ) : (
            <ToggleLeft size={22} color="#cbd5e1" />
          )}
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: important ? typeColor : isDark ? "#64748b" : "#94a3b8",
            }}>
            Mark as Important
          </span>
          {important && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 9px",
                borderRadius: 99,
                background: "rgba(239,68,68,.08)",
                border: "1px solid rgba(239,68,68,.22)",
                fontSize: 9,
                fontWeight: 800,
                color: "#ef4444",
                fontFamily: "'JetBrains Mono',monospace",
                letterSpacing: "0.10em",
              }}>
              <AlertCircle size={8} />
              IMPORTANT
            </span>
          )}
        </button>
        <button
          className="dm-ai-btn"
          onClick={onGenerate}
          disabled={isGenerating || !canUseAI}
          style={{
            opacity: canUseAI ? 1 : 0.45,
            padding: "11px 14px",
          }}>
          {isGenerating ? (
            <Loader2
              size={14}
              style={{ animation: "dmSpin 1s linear infinite" }}
            />
          ) : (
            <Sparkles size={14} />
          )}
          {isGenerating ? "Generating..." : generateLabel}
        </button>
        <button
          className="dm-compose-btn"
          onClick={onSend}
          disabled={!title.trim() || !content.trim()}
          style={{
            background:
              title.trim() && content.trim()
                ? `linear-gradient(135deg,${typeColor},${typeColor}cc)`
                : "rgba(226,232,240,.9)",
            color:
              title.trim() && content.trim()
                ? "#fff"
                : isDark
                  ? "#64748b"
                  : "#94a3b8",
            boxShadow:
              title.trim() && content.trim()
                ? `0 6px 22px ${typeColor}38`
                : "none",
          }}>
          <Send size={14} style={{ position: "relative", zIndex: 1 }} />
          <span style={{ position: "relative", zIndex: 1 }}>
            Send {typeLabel}
            {USE_MOCK ? " (Demo)" : ""}
          </span>
        </button>
      </div>
      {sentItems.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div
            className="mono"
            style={{
              fontSize: 9,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              marginBottom: 10,
              fontWeight: 700,
            }}>
            Sent This Session
          </div>
          {sentItems.map((item) => (
            <div
              key={item.id}
              className="dm-sent-item"
              style={{ marginBottom: 8 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 5,
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <CheckCircle2 size={13} color={typeColor} />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: isDark ? "#f1f5f9" : "#0B1E33",
                    }}>
                    {item.title}
                  </span>
                  {item.isImportant && (
                    <span
                      style={{
                        padding: "1px 7px",
                        borderRadius: 99,
                        background: "rgba(239,68,68,.07)",
                        border: "1px solid rgba(239,68,68,.20)",
                        fontSize: 8.5,
                        fontWeight: 800,
                        color: "#ef4444",
                        fontFamily: "'JetBrains Mono',monospace",
                        letterSpacing: "0.10em",
                      }}>
                      IMPORTANT
                    </span>
                  )}
                </div>
                <span
                  className="mono"
                  style={{ fontSize: 9, color: "#94a3b8" }}>
                  {item.time}
                </span>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: isDark ? "#94a3b8" : "#64748b",
                  margin: 0,
                  lineHeight: 1.62,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>
                {item.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const AiPanel = () => (
    <div
      className="dm-scroll"
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        position: "relative",
      }}>
      {!canUseAI && (
        <div className="dm-lock">
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 22px rgba(99,102,241,.35)",
            }}>
            <Crown size={22} color="#fff" />
          </div>
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: isDark ? "#f1f5f9" : "#0B1E33",
                margin: "0 0 5px",
              }}>
              AI Companion Plan Required
            </p>
            <p
              style={{
                fontSize: 12,
                color: isDark ? "#94a3b8" : "#64748b",
                margin: "0 0 14px",
                maxWidth: 260,
                lineHeight: 1.65,
              }}>
              {patient?.name.split(" ")[0] ?? "This patient"} is on the Standard
              plan. Upgrade to unlock AI-generated clinical messages.
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 18px",
                borderRadius: 12,
                background:
                  "linear-gradient(135deg,rgba(99,102,241,.12),rgba(139,92,246,.08))",
                border: "1.5px solid rgba(99,102,241,.25)",
                fontSize: 12,
                fontWeight: 700,
                color: "#6366f1",
              }}>
              <Shield size={13} />
              Standard Plan — No AI Access
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          background:
            "linear-gradient(135deg,rgba(99,102,241,.08),rgba(139,92,246,.05))",
          border: "1.5px solid rgba(99,102,241,.18)",
          borderRadius: 14,
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
            boxShadow: "0 4px 14px rgba(99,102,241,.30)",
            flexShrink: 0,
            animation: "dmAiPulse 3s ease-in-out infinite",
          }}>
          <Sparkles size={16} color="#fff" />
        </div>
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: isDark ? "#f1f5f9" : "#0B1E33",
            }}>
            AI Clinical Generator
          </div>
          <div
            className="mono"
            style={{
              fontSize: 8.5,
              color: "rgba(99,102,191,.75)",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              marginTop: 2,
            }}>
            Powered by Gemini · AI Companion Plan
          </div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 10px",
            borderRadius: 99,
            background: "#0B1E33",
            border: "1px solid rgba(45,212,191,.20)",
          }}>
          <Zap size={10} color="#2DD4BF" />
          <span
            className="mono"
            style={{
              fontSize: 8.5,
              color: "#2DD4BF",
              fontWeight: 700,
              letterSpacing: "0.10em",
            }}>
            PREMIUM
          </span>
        </div>
      </div>
      <div>
        <label
          className="mono"
          style={{
            display: "block",
            fontSize: 9,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            fontWeight: 700,
            marginBottom: 8,
          }}>
          Generate Type
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          {(["feedback", "instruction"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setAiMode(mode);
                setAiDraft("");
                setAiTitle("");
              }}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 12,
                cursor: "pointer",
                background:
                  aiMode === mode
                    ? mode === "feedback"
                      ? "rgba(45,212,191,.10)"
                      : "rgba(245,158,11,.10)"
                    : isDark
                      ? "rgba(30,41,59,.8)"
                      : "rgba(240,244,248,.8)",
                border: `1.5px solid ${aiMode === mode ? (mode === "feedback" ? "rgba(45,212,191,.35)" : "rgba(245,158,11,.35)") : isDark ? "#334155" : "rgba(226,232,240,.9)"}`,
                color:
                  aiMode === mode
                    ? mode === "feedback"
                      ? "#0891b2"
                      : "#92400e"
                    : isDark
                      ? "#64748b"
                      : "#94a3b8",
                fontSize: 12.5,
                fontWeight: 800,
                transition: "all .2s",
                fontFamily: "'Plus Jakarta Sans',sans-serif",
              }}>
              {mode === "feedback" ? "📊 Feedback" : "📋 Instruction"}
            </button>
          ))}
        </div>
      </div>
      <div
        style={{
          padding: "10px 14px",
          background: isDark ? "rgba(30,41,59,.5)" : "rgba(240,244,248,.8)",
          border: `1px solid ${isDark ? "#334155" : "rgba(226,232,240,.9)"}`,
          borderRadius: 12,
        }}>
        <p
          className="mono"
          style={{
            fontSize: 9,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            margin: "0 0 4px",
            fontWeight: 700,
          }}>
          AI Context
        </p>
        <p
          style={{
            fontSize: 12,
            color: isDark ? "#94a3b8" : "#475569",
            margin: 0,
            lineHeight: 1.65,
          }}>
          Gemini will generate a personalised{" "}
          <span
            style={{
              color: aiMode === "feedback" ? "#2DD4BF" : "#f59e0b",
              fontWeight: 700,
            }}>
            {aiMode}
          </span>{" "}
          for{" "}
          <span
            style={{ fontWeight: 700, color: isDark ? "#f1f5f9" : "#0B1E33" }}>
            {patient?.name ?? "patient"}
          </span>{" "}
          — condition: {patient?.condition}, adherence:{" "}
          {patient?.adherence ?? 0}%.
        </p>
      </div>
      <button
        className="dm-ai-btn"
        onClick={() => generateAI(aiMode)}
        disabled={aiLoading || !canUseAI}
        style={{ width: "100%", opacity: !canUseAI ? 0.45 : 1 }}>
        {aiLoading ? (
          <div
            style={{
              width: 14,
              height: 14,
              border: "2.5px solid rgba(99,102,241,.25)",
              borderTopColor: "#6366f1",
              borderRadius: "50%",
              animation: "dmSpin .75s linear infinite",
            }}
          />
        ) : (
          <Sparkles size={14} />
        )}
        {aiLoading
          ? "Generating with Gemini…"
          : `Generate AI ${aiMode.charAt(0).toUpperCase() + aiMode.slice(1)}`}
      </button>
      {aiDraft && (
        <div
          style={{
            animation: "dmCardPop .45s cubic-bezier(.22,1,.36,1) both",
          }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#6366f1",
                boxShadow: "0 0 6px rgba(99,102,241,.7)",
                animation: "dmDot 2s ease-in-out infinite",
              }}
            />
            <span
              className="mono"
              style={{
                fontSize: 9,
                color: "#6366f1",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                fontWeight: 700,
              }}>
              AI Draft — Edit before sending
            </span>
          </div>
          <input
            className="dm-title-input"
            value={aiTitle}
            onChange={(e) => setAiTitle(e.target.value)}
            placeholder="Draft title…"
            style={{ marginBottom: 10 }}
          />
          <textarea
            className="dm-textarea"
            rows={5}
            value={aiDraft}
            onChange={(e) => setAiDraft(e.target.value)}
            style={{
              border: "1.5px solid rgba(99,102,241,.28)",
              background: isDark
                ? "rgba(99,102,191,.08)"
                : "rgba(99,102,191,.04)",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 10,
              flexWrap: "wrap",
              gap: 8,
            }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                color: "#94a3b8",
              }}>
              <Bot size={12} color="#6366f1" />
              AI-generated · Review before sending
            </div>
            <button
              className="dm-compose-btn"
              onClick={sendAiDraft}
              style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: "#fff",
                boxShadow: "0 6px 22px rgba(99,102,241,.32)",
                padding: "11px 20px",
              }}>
              <Send size={13} style={{ position: "relative", zIndex: 1 }} />
              <span style={{ position: "relative", zIndex: 1 }}>
                Send to Patient{USE_MOCK ? " (Demo)" : ""}
              </span>
            </button>
          </div>
        </div>
      )}
      {(aiSent[selectedId] ?? []).length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div
            className="mono"
            style={{
              fontSize: 9,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              marginBottom: 10,
              fontWeight: 700,
            }}>
            AI Messages Sent
          </div>
          {(aiSent[selectedId] ?? []).map((item) => (
            <div
              key={item.id}
              className="dm-sent-item"
              style={{
                borderColor: "rgba(99,102,241,.20)",
                background: isDark
                  ? "rgba(99,102,191,.08)"
                  : "rgba(99,102,191,.03)",
                marginBottom: 8,
              }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  marginBottom: 4,
                }}>
                <Bot size={12} color="#6366f1" />
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: isDark ? "#f1f5f9" : "#0B1E33",
                  }}>
                  {item.title}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: 8.5,
                    color: "#6366f1",
                    background: "rgba(99,102,241,.08)",
                    border: "1px solid rgba(99,102,241,.18)",
                    padding: "1px 6px",
                    borderRadius: 6,
                    marginLeft: "auto",
                  }}>
                  AI
                </span>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: isDark ? "#94a3b8" : "#64748b",
                  margin: 0,
                  lineHeight: 1.62,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>
                {item.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div
      className="dm"
      style={{
        height: "100vh",
        background: isDark ? "#0f172a" : "#F0F4F8",
        display: "flex",
        flexDirection: "column",
        padding: "20px",
        gap: 14,
        overflow: "hidden",
      }}>
      <style>{CSS}</style>

      {/* Top nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          animation: "dmFadeUp .45s ease both",
          flexShrink: 0,
        }}>
        <Link
          href="/doctor/patients"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "8px 14px",
            borderRadius: 12,
            background: isDark ? "#1e293b" : "#fff",
            border: `1.5px solid ${isDark ? "#334155" : "rgba(226,232,240,.9)"}`,
            fontSize: 13,
            fontWeight: 700,
            color: isDark ? "#94a3b8" : "#64748b",
            textDecoration: "none",
          }}>
          <ArrowLeft size={14} /> Back to Patients
        </Link>
        <span
          className="mono"
          style={{
            fontSize: 9.5,
            color: "#94a3b8",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}>
          Patient Messaging Hub
        </span>
        {USE_MOCK && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(251,191,36,.08)",
              border: "1px solid rgba(251,191,36,.25)",
              borderRadius: 10,
              padding: "5px 12px",
            }}>
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#fbbf24",
                boxShadow: "0 0 5px #fbbf24",
              }}
            />
            <span
              className="mono"
              style={{
                fontSize: 9,
                color: "#fbbf24",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.10em",
              }}>
              Demo Data
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 14,
          flex: 1,
          minHeight: 0,
          animation: "dmFadeUp .50s ease .06s both",
        }}>
        {/* Sidebar */}
        <div
          className="dm-sidebar-wrap"
          style={{
            width: 268,
            flexShrink: 0,
            background: isDark ? "#1e293b" : "#fff",
            borderRadius: 20,
            border: `1px solid ${isDark ? "#334155" : "rgba(226,232,240,.9)"}`,
            boxShadow: isDark
              ? "0 2px 18px rgba(0,0,0,.22)"
              : "0 2px 18px rgba(11,30,51,.055)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}>
          <div
            style={{
              padding: "16px 15px 12px",
              borderBottom: `1px solid ${isDark ? "#334155" : "rgba(226,232,240,.8)"}`,
              background: isDark
                ? "linear-gradient(135deg,#1e293b,#162032)"
                : "linear-gradient(135deg,#f8fdfc,#f0fdfb)",
            }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                marginBottom: 11,
              }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "rgba(45,212,191,.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2DD4BF",
                }}>
                <User size={15} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 800,
                    color: isDark ? "#f1f5f9" : "#0B1E33",
                  }}>
                  All Patients
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 8.5,
                    color: USE_MOCK ? "#fbbf24" : "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}>
                  {patientsLoading
                    ? "…"
                    : `${sidebarPatients.length} ${USE_MOCK ? "demo " : ""}patients`}
                </div>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <Search
                size={13}
                color="#94a3b8"
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                style={{
                  width: "100%",
                  padding: "8px 10px 8px 30px",
                  background: isDark ? "#334155" : "rgba(240,244,248,.9)",
                  border: `1px solid ${isDark ? "#475569" : "rgba(226,232,240,.9)"}`,
                  borderRadius: 10,
                  fontSize: 12,
                  color: isDark ? "#f1f5f9" : "#0B1E33",
                  outline: "none",
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                }}
              />
            </div>
          </div>
          <div
            className="dm-sidebar"
            style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {patientsLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "32px 0",
                  gap: 8,
                }}>
                <Loader2
                  size={18}
                  color="#2DD4BF"
                  style={{ animation: "dmSpin 1s linear infinite" }}
                />
                <span style={{ fontSize: 12, color: "#94a3b8" }}>Loading…</span>
              </div>
            ) : (
              filtered.map((p) => {
                const sc = statusColor(p.status),
                  ac = adherenceColor(p.adherence),
                  isA = p.uid === selectedId;
                return (
                  <button
                    key={p.uid}
                    className={`dm-patient-btn${isA ? " active" : ""}`}
                    onClick={() => setSelectedId(p.uid)}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          background: isA
                            ? "linear-gradient(135deg,#2DD4BF,#0891b2)"
                            : `${ac}18`,
                          border: `1.5px solid ${isA ? "transparent" : ac + "38"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10.5,
                          fontWeight: 800,
                          color: isA ? "#0B1E33" : ac,
                        }}>
                        {initials(p.name)}
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          bottom: -1,
                          right: -1,
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          background: sc,
                          border: `2px solid ${isDark ? "#1e293b" : "#fff"}`,
                          animation: "dmDot 2.2s ease-in-out infinite",
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 4,
                        }}>
                        <span
                          style={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: isDark ? "#f1f5f9" : "#0B1E33",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 108,
                          }}>
                          {p.name}
                        </span>
                        <MiniBar value={p.adherence} color={ac} />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          marginTop: 2,
                        }}>
                        <span
                          className="mono"
                          style={{
                            fontSize: 8.5,
                            color: "#2DD4BF",
                            background: "rgba(45,212,191,.08)",
                            padding: "1px 5px",
                            borderRadius: 5,
                          }}>
                          {p.pid}
                        </span>
                        {p.isAIPlan && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              background: "#0B1E33",
                              borderRadius: 6,
                              padding: "1px 6px",
                            }}>
                            <Bot size={8} color="#2DD4BF" />
                            <span
                              className="mono"
                              style={{
                                fontSize: 7.5,
                                color: "#2DD4BF",
                                fontWeight: 700,
                              }}>
                              AI
                            </span>
                          </div>
                        )}
                        <span
                          style={{
                            fontSize: 10,
                            color: isDark ? "#64748b" : "#94a3b8",
                          }}>
                          {p.condition}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
            {!patientsLoading && filtered.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px 12px",
                  color: isDark ? "#64748b" : "#94a3b8",
                  fontSize: 12,
                }}>
                No patients found
              </div>
            )}
          </div>
        </div>

        {/* Main column */}
        <div
          className="dm-main-col"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            background: isDark ? "#1e293b" : "#fff",
            borderRadius: 20,
            border: `1px solid ${isDark ? "#334155" : "rgba(226,232,240,.9)"}`,
            boxShadow: isDark
              ? "0 2px 18px rgba(0,0,0,.22)"
              : "0 2px 18px rgba(11,30,51,.055)",
            overflow: "hidden",
          }}>
          {patient ? (
            <>
              {/* Hero header */}
              <div
                style={{
                  background: "#0B1E33",
                  position: "relative",
                  overflow: "hidden",
                  flexShrink: 0,
                }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    backgroundImage:
                      "linear-gradient(rgba(45,212,191,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(45,212,191,.04) 1px,transparent 1px)",
                    backgroundSize: "32px 32px",
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
                      left: 0,
                      right: 0,
                      height: "22%",
                      background:
                        "linear-gradient(to bottom,transparent,rgba(45,212,191,.05),transparent)",
                      animation: "dmScanLine 5.5s linear infinite",
                    }}
                  />
                </div>
                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    padding: "18px 22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                  }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ position: "relative" }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 14,
                          background: `linear-gradient(135deg,${aColor},${aColor}aa)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 800,
                          color: "#fff",
                          boxShadow: `0 0 0 2.5px ${aColor}40,0 5px 18px ${aColor}35`,
                          animation: "dmGlow 3s ease-in-out infinite",
                          flexShrink: 0,
                        }}>
                        {initials(patient.name)}
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          bottom: -1,
                          right: -1,
                          width: 11,
                          height: 11,
                          borderRadius: "50%",
                          background: sColor,
                          border: "2.5px solid #0B1E33",
                          boxShadow: `0 0 5px ${sColor}`,
                        }}
                      />
                    </div>
                    <div>
                      <p
                        className="mono"
                        style={{
                          fontSize: 8.5,
                          color: "rgba(45,212,191,.60)",
                          textTransform: "uppercase",
                          letterSpacing: "0.20em",
                          marginBottom: 2,
                        }}>
                        Active Patient
                      </p>
                      <div
                        style={{
                          fontSize: 17,
                          fontWeight: 800,
                          color: "#fff",
                          lineHeight: 1.2,
                        }}>
                        {patient.name}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginTop: 4,
                          flexWrap: "wrap",
                        }}>
                        <span
                          className="mono"
                          style={{
                            fontSize: 10,
                            color: "#2DD4BF",
                            background: "rgba(45,212,191,.12)",
                            border: "1px solid rgba(45,212,191,.20)",
                            padding: "1px 8px",
                            borderRadius: 7,
                          }}>
                          {patient.pid}
                        </span>
                        <span
                          style={{
                            fontSize: 11.5,
                            color: "rgba(255,255,255,.40)",
                          }}>
                          {patient.condition}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: sColor,
                            fontWeight: 700,
                          }}>
                          {patient.status} Adherence
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 9,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}>
                    {patient.isAIPlan ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          background: "rgba(45,212,191,.10)",
                          border: "1px solid rgba(45,212,191,.22)",
                          borderRadius: 11,
                          padding: "7px 13px",
                        }}>
                        <Bot size={13} color="#2DD4BF" />
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: "#2DD4BF",
                          }}>
                          AI Companion
                        </span>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          background: "rgba(255,255,255,.06)",
                          border: "1px solid rgba(255,255,255,.09)",
                          borderRadius: 11,
                          padding: "7px 13px",
                        }}>
                        <Shield size={13} color="rgba(255,255,255,.35)" />
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: "rgba(255,255,255,.40)",
                          }}>
                          Standard
                        </span>
                      </div>
                    )}
                    <Link
                      href={`/doctor/patients/${selectedId}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "7px 13px",
                        borderRadius: 11,
                        background: "rgba(255,255,255,.06)",
                        border: "1px solid rgba(255,255,255,.09)",
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: "rgba(255,255,255,.55)",
                        textDecoration: "none",
                      }}>
                      View Profile <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  padding: "10px 16px",
                  borderBottom: `1px solid ${isDark ? "#334155" : "rgba(226,232,240,.8)"}`,
                  background: isDark
                    ? "rgba(15,23,42,.95)"
                    : "rgba(248,250,252,.95)",
                  flexShrink: 0,
                }}>
                {[
                  {
                    id: "chat" as ActivePanel,
                    icon: <MessageCircle size={16} />,
                    label: "Chat",
                    color: {
                      active: "rgba(45,212,191,.09)",
                      border: "rgba(45,212,191,.28)",
                      text: "#0891b2",
                    },
                  },
                  {
                    id: "instruction" as ActivePanel,
                    icon: <AlertCircle size={16} />,
                    label: "Instruction",
                    color: {
                      active: "rgba(245,158,11,.08)",
                      border: "rgba(245,158,11,.28)",
                      text: "#b45309",
                    },
                  },
                  {
                    id: "feedback" as ActivePanel,
                    icon: <Activity size={16} />,
                    label: "Feedback",
                    color: {
                      active: "rgba(45,212,191,.09)",
                      border: "rgba(45,212,191,.28)",
                      text: "#0891b2",
                    },
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={`dm-tab${panel === tab.id ? " active" : ""}`}
                    onClick={() => setPanel(tab.id)}
                    style={{
                      background:
                        panel === tab.id ? tab.color.active : "transparent",
                      border: `1.5px solid ${panel === tab.id ? tab.color.border : "transparent"}`,
                      color: panel === tab.id ? tab.color.text : "#94a3b8",
                      position: "relative",
                    }}>
                    {tab.icon}
                    <span
                      className="dm-tab-label mono"
                      style={{
                        fontSize: 8.5,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                      }}>
                      {tab.label}
                    </span>
                  </button>
                ))}
              </div>

              {panel === "chat" && ChatPanel()}
              {panel === "instruction" &&
                ComposeForm({
                  typeLabel: "Instruction",
                  typeColor: "#f59e0b",
                  title: instrTitle,
                  setTitle: setInstrTitle,
                  content: instrContent,
                  setContent: setInstrContent,
                  important: instrImportant,
                  setImportant: setInstrImportant,
                  onSend: sendInstruction,
                  onGenerate: () => generateAI("instruction"),
                  isGenerating: aiLoading,
                  generateLabel: "Generate Instruction",
                  sentItems: instrSent[selectedId] ?? [],
                  hint: `Write a clinical instruction for ${patient.name.split(" ")[0]}. Instructions are highlighted and require acknowledgment.`,
                })}
              {panel === "feedback" &&
                ComposeForm({
                  typeLabel: "Feedback",
                  typeColor: "#2DD4BF",
                  title: fbTitle,
                  setTitle: setFbTitle,
                  content: fbContent,
                  setContent: setFbContent,
                  important: fbImportant,
                  setImportant: setFbImportant,
                  onSend: sendFeedback,
                  onGenerate: () => generateAI("feedback"),
                  isGenerating: aiLoading,
                  generateLabel: "Generate Insight",
                  sentItems: fbSent[selectedId] ?? [],
                  hint: `Send clinical feedback to ${patient.name.split(" ")[0]} based on their recent session performance.`,
                })}
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 14,
              }}>
              {patientsLoading ? (
                <>
                  <Loader2
                    size={28}
                    color="#2DD4BF"
                    style={{ animation: "dmSpin 1s linear infinite" }}
                  />
                  <span style={{ fontSize: 13, color: "#94a3b8" }}>
                    Loading…
                  </span>
                </>
              ) : (
                <>
                  <MessageCircle size={36} color="#cbd5e1" />
                  <p
                    style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8" }}>
                    Select a patient to start messaging
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
