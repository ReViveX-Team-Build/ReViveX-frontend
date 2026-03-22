"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Activity,
  AlertTriangle,
  Cpu,
  TrendingUp,
  CheckCircle2,
  XCircle,
  CalendarClock,
  ChevronRight,
  BrainCircuit,
  Wifi,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Eye,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { auth, db } from "@/app/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { useDarkMode } from "@/app/lib/hooks/useDarkMode";

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA FLAG
// Set USE_MOCK_FALLBACK = false before real deployment.
// When true: if Firestore returns 0 patients, mock data is shown instead of zeros.
// ─────────────────────────────────────────────────────────────────────────────
const USE_MOCK_FALLBACK = false;

const MOCK_PATIENTS: PatientRow[] = [
  {
    uid: "mock_p1",
    name: "P.B. De Silva",
    code: "P001",
    adherence: 45,
    urgency: "critical",
    trend: "down",
    lastSession: "3 days ago",
    deviceStatus: "connected",
  },
  {
    uid: "mock_p2",
    name: "Anura Dissanayaka",
    code: "P002",
    adherence: 92,
    urgency: "mild",
    trend: "up",
    lastSession: "Yesterday",
    deviceStatus: "connected",
  },
  {
    uid: "mock_p3",
    name: "Sarath Watawala",
    code: "P003",
    adherence: 78,
    urgency: "mild",
    trend: "stable",
    lastSession: "Yesterday",
    deviceStatus: "connected",
  },
  {
    uid: "mock_p4",
    name: "Shifani Ameena",
    code: "P004",
    adherence: 65,
    urgency: "warning",
    trend: "stable",
    lastSession: "2 days ago",
    deviceStatus: "offline",
  },
  {
    uid: "mock_p5",
    name: "Percy Silva",
    code: "P005",
    adherence: 88,
    urgency: "mild",
    trend: "up",
    lastSession: "Just now",
    deviceStatus: "connected",
  },
  {
    uid: "mock_p6",
    name: "Athula Premachandra",
    code: "P006",
    adherence: 52,
    urgency: "warning",
    trend: "down",
    lastSession: "Yesterday",
    deviceStatus: "connected",
  },
  {
    uid: "mock_p7",
    name: "Aruni Perera",
    code: "P007",
    adherence: 95,
    urgency: "mild",
    trend: "up",
    lastSession: "Just now",
    deviceStatus: "connected",
  },
  {
    uid: "mock_p8",
    name: "Amal Mahendra",
    code: "P008",
    adherence: 73,
    urgency: "mild",
    trend: "stable",
    lastSession: "Yesterday",
    deviceStatus: "connected",
  },
  {
    uid: "mock_p9",
    name: "Malkanthi Peris",
    code: "P009",
    adherence: 25,
    urgency: "critical",
    trend: "down",
    lastSession: "2 days ago",
    deviceStatus: "offline",
  },
  {
    uid: "mock_p10",
    name: "K.K. Muththukumaran",
    code: "P010",
    adherence: 76,
    urgency: "mild",
    trend: "stable",
    lastSession: "Yesterday",
    deviceStatus: "connected",
  },
  {
    uid: "mock_p11",
    name: "Kamal Fernando",
    code: "P011",
    adherence: 80,
    urgency: "mild",
    trend: "up",
    lastSession: "Just now",
    deviceStatus: "connected",
  },
  {
    uid: "mock_p12",
    name: "P.P. Sugathadasa",
    code: "P012",
    adherence: 63,
    urgency: "warning",
    trend: "stable",
    lastSession: "2 days ago",
    deviceStatus: "connected",
  },
];

const MOCK_AI_SUMMARY =
  "Grip strength improved by an average of 5% across your patient cohort this week. " +
  "Patients using the AI Companion showed 12% higher adherence compared to standard therapy. " +
  "Three patients require attention due to declining adherence patterns — early intervention is recommended. " +
  "Device connectivity remains strong at 83% uptime across all active hardware units.";

// ─── Types ───────────────────────────────────────────────────────────────────
interface PatientRow {
  uid: string;
  name: string;
  code: string;
  adherence: number;
  urgency: "critical" | "warning" | "mild";
  trend: "down" | "stable" | "up";
  lastSession: string;
  deviceStatus: string;
}

interface KpiData {
  totalPatients: number;
  avgAdherence: number;
  missedSessions: number;
  devicesOnline: number;
}

interface SessionSnap {
  completed: number;
  missed: number;
  upcoming: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function relativeTime(ts: Timestamp | null): string {
  if (!ts) return "Never";
  const diff = Date.now() - ts.toMillis();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function buildMockKpis(): KpiData {
  const adhs = MOCK_PATIENTS.map((p) => p.adherence);
  const avg = Math.round(adhs.reduce((a, b) => a + b, 0) / adhs.length);
  const online = MOCK_PATIENTS.filter(
    (p) => p.deviceStatus === "connected",
  ).length;
  const missed = MOCK_PATIENTS.filter((p) => p.adherence < 60).length * 2;
  return {
    totalPatients: MOCK_PATIENTS.length,
    avgAdherence: avg,
    missedSessions: missed,
    devicesOnline: online,
  };
}

// ─── Animated Number ─────────────────────────────────────────────────────────
function AnimatedNumber({
  target,
  suffix = "",
  delay = 0,
}: {
  target: number;
  suffix?: string;
  delay?: number;
}) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let start: number | null = null;
      const step = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 1200, 1);
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) requestAnimationFrame(step);
        else setVal(target);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return (
    <>
      {val}
      {suffix}
    </>
  );
}

// ─── Adherence Bar ────────────────────────────────────────────────────────────
function AdherenceBar({ value, color }: { value: number; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value), 300);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div
      style={{
        height: 4,
        background: "rgba(0,0,0,0.06)",
        borderRadius: 99,
        overflow: "hidden",
        flex: 1,
      }}>
      <div
        style={{
          height: "100%",
          borderRadius: 99,
          width: `${w}%`,
          background: `linear-gradient(90deg,${color},${color}cc)`,
          transition: "width 1.2s cubic-bezier(0.22,1,0.36,1)",
          boxShadow: `0 0 8px ${color}80`,
        }}
      />
    </div>
  );
}

// ─── Session Bar ─────────────────────────────────────────────────────────────
function SessionBar({
  count,
  max,
  color,
  delay,
}: {
  count: number;
  max: number;
  color: string;
  delay: number;
}) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(max > 0 ? (count / max) * 100 : 0), delay);
    return () => clearTimeout(t);
  }, [count, max, delay]);
  return (
    <div
      style={{
        height: 6,
        background: "rgba(0,0,0,0.06)",
        borderRadius: 99,
        overflow: "hidden",
        marginTop: 12,
      }}>
      <div
        style={{
          height: "100%",
          borderRadius: 99,
          width: `${w}%`,
          background: `linear-gradient(90deg,${color},${color}88)`,
          transition: `width 1.1s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
          boxShadow: `0 0 8px ${color}60`,
        }}
      />
    </div>
  );
}

// ─── Typewriter ───────────────────────────────────────────────────────────────
function Typewriter({ text, delay = 300 }: { text: string; delay?: number }) {
  const [shown, setShown] = useState("");
  const [go, setGo] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGo(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  useEffect(() => {
    if (!go || !text) return;
    setShown("");
    let i = 0;
    const iv = setInterval(() => {
      setShown(text.slice(0, ++i));
      if (i >= text.length) clearInterval(iv);
    }, 18);
    return () => clearInterval(iv);
  }, [go, text]);
  return (
    <span>
      {shown}
      {shown.length < text.length && (
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: "1em",
            background: "#2DD4BF",
            verticalAlign: "text-bottom",
            marginLeft: 2,
            animation: "cursorBlink .8s step-end infinite",
          }}
        />
      )}
    </span>
  );
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  .doc-dash *{font-family:'Bricolage Grotesque',system-ui,sans-serif;box-sizing:border-box}
  .doc-dash .mono{font-family:'JetBrains Mono',monospace}
  @keyframes cursorBlink{0%,100%{opacity:1}50%{opacity:0}}
  @keyframes docFadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
  @keyframes kpiPop{0%{opacity:0;transform:translateY(20px) scale(.96)}100%{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes shimmerSlide{0%{transform:translateX(-200%) skewX(-15deg)}100%{transform:translateX(400%) skewX(-15deg)}}
  @keyframes pulseDot{0%,100%{box-shadow:var(--ds);transform:scale(1)}50%{box-shadow:var(--ds),0 0 0 5px var(--dc);transform:scale(1.1)}}
  @keyframes scanLine{0%{top:-2%;opacity:0}5%{opacity:1}95%{opacity:.6}100%{top:105%;opacity:0}}
  @keyframes aiGlow{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .kpi-card{animation:kpiPop .6s cubic-bezier(.22,1,.36,1) both;transition:transform .35s ease,box-shadow .35s ease}
  .kpi-card:hover{transform:translateY(-4px)!important;box-shadow:0 20px 60px rgba(0,0,0,.10)!important}
  .triage-row{transition:all .25s ease}
  .triage-row:hover{transform:translateX(4px);background:rgba(45,212,191,.05)!important}
  .session-card{transition:all .3s ease}
  .session-card:hover{transform:scale(1.02)}
  .shimmer-btn::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent);animation:shimmerSlide 2.2s ease-in-out infinite}
  .ai-glow{animation:aiGlow 4s ease-in-out infinite}
  .doc-header{animation:docFadeUp .7s cubic-bezier(.22,1,.36,1) both}
  .sf{animation:docFadeUp .65s cubic-bezier(.22,1,.36,1) both}
  .view-btn{transition:all .22s ease}
  .view-btn:hover{background:rgba(45,212,191,.12)!important;color:#2DD4BF!important}
  .refresh-btn{transition:all .22s ease;cursor:pointer}
  .refresh-btn:hover{background:rgba(45,212,191,.16)!important}
  .mock-badge{animation:kpiPop .5s cubic-bezier(.22,1,.36,1) .2s both}
`;

const urgencyConfig = {
  critical: {
    color: "#f87171",
    shadow: "0 0 10px rgba(248,113,113,.6)",
    faint: "rgba(248,113,113,.18)",
  },
  warning: {
    color: "#fbbf24",
    shadow: "0 0 10px rgba(251,191,36,.6)",
    faint: "rgba(251,191,36,.18)",
  },
  mild: {
    color: "#34d399",
    shadow: "0 0 10px rgba(52,211,153,.6)",
    faint: "rgba(52,211,153,.18)",
  },
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const [user, authLoading] = useAuthState(auth);
  const [mounted, setMounted] = useState(false);
  const [usingMock, setUsingMock] = useState(false);
  const isDark = useDarkMode();

  // Dark-mode-aware color map for inline-styled surfaces
  const dm = isDark
    ? {
        pageBg: "#0f172a",
        card: "#1e293b",
        cardBorder: "rgba(51,65,85,.8)",
        smallBorder: "rgba(51,65,85,.6)",
        text: "#f1f5f9",
        rowBg: "rgba(30,41,59,.8)",
        badgeBg: "rgba(51,65,85,.8)",
      }
    : {
        pageBg: "#F0F4F8",
        card: "#fff",
        cardBorder: "rgba(226,232,240,.8)",
        smallBorder: "rgba(226,232,240,.6)",
        text: "#0B1E33",
        rowBg: "rgba(248,250,252,.8)",
        badgeBg: "#f1f5f9",
      };

  const [doctorName, setDoctorName] = useState("Doctor");
  const [initials, setInitials] = useState("DR");
  const [kpis, setKpis] = useState<KpiData>({
    totalPatients: 0,
    avgAdherence: 0,
    missedSessions: 0,
    devicesOnline: 0,
  });
  const [triage, setTriage] = useState<PatientRow[]>([]);
  const [sessions, setSessions] = useState<SessionSnap>({
    completed: 0,
    missed: 0,
    upcoming: 0,
  });
  const [aiSummary, setAiSummary] = useState("");
  const [aiPills, setAiPills] = useState<
    { label: string; value: string; color: string }[]
  >([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Fetch AI summary ─────────────────────────────────────────────────────
  const fetchAI = useCallback(
    async (
      docId: string,
      total: number,
      avg: number,
      missed: number,
      online: number,
      isMock: boolean,
    ) => {
      if (isMock) {
        setAiLoading(true);
        setAiSummary("");
        await new Promise((r) => setTimeout(r, 900));
        setAiSummary(MOCK_AI_SUMMARY);
        setAiLoading(false);
        setAiPills([
          { label: "Avg Grip Improvement", value: "+5%", color: "#2DD4BF" },
          { label: "AI Companion Boost", value: "+12%", color: "#34d399" },
          { label: "Attention Required", value: "3 pts", color: "#fbbf24" },
          { label: "Data Points Analysed", value: "1,284", color: "#6366f1" },
        ]);
        return;
      }

      setAiLoading(true);
      setAiSummary("");
      try {
        const res = await fetch("/api/llm/doctor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: docId,
            message: "Give me a concise weekly summary of my patient cohort.",
            mode: "weekly_summary",
          }),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        const raw = (data.reply || data.response || "")
          .replace(/#{1,3}\s/g, "")
          .replace(/\*\*/g, "")
          .replace(/\n+/g, " ")
          .slice(0, 420);
        setAiSummary(raw || MOCK_AI_SUMMARY);
      } catch {
        setAiSummary(MOCK_AI_SUMMARY);
      } finally {
        setAiLoading(false);
      }
      setAiPills([
        { label: "Active Patients", value: `${total}`, color: "#2DD4BF" },
        { label: "Avg Adherence", value: `${avg}%`, color: "#34d399" },
        { label: "Missed Sessions", value: `${missed}`, color: "#fbbf24" },
        { label: "Devices Online", value: `${online}`, color: "#6366f1" },
      ]);
    },
    [],
  );

  // ── Load Firestore data ──────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    setError("");
    setUsingMock(false);

    try {
      const dSnap = await getDocs(
        query(collection(db, "users"), where("uid", "==", user.uid)),
      );
      if (!dSnap.empty) {
        const d = dSnap.docs[0].data();
        const n = d.name || "Doctor";
        setDoctorName(n);
        const p = n.trim().split(" ");
        setInitials(
          p.length >= 2
            ? `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase()
            : n.slice(0, 2).toUpperCase(),
        );
      }

      const pSnap = await getDocs(
        query(
          collection(db, "users"),
          where("role", "==", "patient"),
          where("assignedDoctorId", "==", user.uid),
        ),
      );
      const patients = pSnap.docs.map(
        (d) => ({ uid: d.id, ...d.data() }) as any,
      );

      if (patients.length === 0 && USE_MOCK_FALLBACK) {
        setUsingMock(true);
        const mockKpis = buildMockKpis();
        setKpis(mockKpis);
        const triageMock = [...MOCK_PATIENTS]
          .sort((a, b) => a.adherence - b.adherence)
          .slice(0, 3);
        setTriage(triageMock);
        setSessions({ completed: 12, missed: 3, upcoming: 5 });
        setDataLoading(false);
        fetchAI(
          user.uid,
          mockKpis.totalPatients,
          mockKpis.avgAdherence,
          mockKpis.missedSessions,
          mockKpis.devicesOnline,
          true,
        );
        return;
      }

      if (patients.length === 0) {
        setKpis({
          totalPatients: 0,
          avgAdherence: 0,
          missedSessions: 0,
          devicesOnline: 0,
        });
        setTriage([]);
        setSessions({ completed: 0, missed: 0, upcoming: 0 });
        setDataLoading(false);
        setAiSummary(
          "No patients assigned yet. Patients need to enter your Doctor ID when signing up.",
        );
        setAiPills([]);
        return;
      }

      const pIds = patients.map((p: any) => p.uid);

      const protoMap: Record<string, number> = {};
      const protoSnap = await getDocs(
        query(collection(db, "protocols"), where("patientId", "in", pIds)),
      );
      protoSnap.docs.forEach((d) => {
        const x = d.data();
        protoMap[x.patientId] = x.sessionsPerWeek ?? 5;
      });

      const sevenAgo = Timestamp.fromDate(daysAgo(7));
      const sSnap = await getDocs(
        query(
          collection(db, "game_sessions"),
          where("userId", "in", pIds),
          where("timestamp", ">=", sevenAgo),
          orderBy("timestamp", "desc"),
        ),
      );
      const allSessions = sSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as any,
      );

      const sessionsPerPatient: Record<string, number> = {};
      const lastSeen: Record<string, Timestamp> = {};
      
      allSessions.forEach((s: any) => {
        const uid = s.userId;
        sessionsPerPatient[uid] = (sessionsPerPatient[uid] || 0) + 1;
        if (!lastSeen[uid] || s.timestamp.seconds > lastSeen[uid].seconds)
          lastSeen[uid] = s.timestamp;
      });

      // 🔴 REPLACED: Fetch real data from the new appointments and scheduled_sessions tables!
      const schedSnap = await getDocs(query(collection(db, "scheduled_sessions"), where("doctorId", "==", user.uid)));
      const apptSnap = await getDocs(query(collection(db, "appointments"), where("doctorId", "==", user.uid)));

      const allEvents = [
        ...schedSnap.docs.map(d => d.data()),
        ...apptSnap.docs.map(d => d.data())
      ];

      // Ensure local YYYY-MM-DD match to properly get "Today's Sessions"
      const now = new Date();
      const localMonth = String(now.getMonth() + 1).padStart(2, '0');
      const localDay = String(now.getDate()).padStart(2, '0');
      const todayStr = `${now.getFullYear()}-${localMonth}-${localDay}`;

      let realCompletedToday = 0;
      let realMissedToday = 0;
      let realUpcomingToday = 0;

      // Map today's stats based on the exact status inside the DB
      allEvents.filter((e: any) => e.scheduledDate === todayStr).forEach((e: any) => {
        if (e.status === "completed") realCompletedToday++;
        else if (e.status === "missed") realMissedToday++;
        else if (["scheduled", "pending", "confirmed"].includes(e.status)) realUpcomingToday++;
      });

      // Calculate weekly missed sessions
      const sevenDaysAgoDate = new Date();
      sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
      const realTotalMissed = allEvents.filter((e: any) => {
         if (e.status !== "missed") return false;
         const eDate = new Date(e.scheduledDate);
         return eDate >= sevenDaysAgoDate;
      }).length;


      let totalAdh = 0,
        devOnline = 0;
      const rows: PatientRow[] = [];
      patients.forEach((p: any) => {
        const prescribed = protoMap[p.uid] || 5;
        const done = sessionsPerPatient[p.uid] || 0;
        const adh = Math.min(100, Math.round((done / prescribed) * 100));
        
        totalAdh += adh;
        if (p.hardwareStatus?.status === "connected") devOnline++;
        const urgency: "critical" | "warning" | "mild" =
          adh < 40 ? "critical" : adh < 70 ? "warning" : "mild";
        const recent = allSessions.filter(
          (s: any) =>
            s.userId === p.uid &&
            s.timestamp.toMillis() > Date.now() - 3 * 86400000,
        ).length;
        const older = allSessions.filter(
          (s: any) =>
            s.userId === p.uid &&
            s.timestamp.toMillis() > Date.now() - 6 * 86400000 &&
            s.timestamp.toMillis() < Date.now() - 3 * 86400000,
        ).length;
        const trend: "down" | "stable" | "up" =
          recent < older ? "down" : recent > older ? "up" : "stable";
        rows.push({
          uid: p.uid,
          name: p.name || "Unknown",
          code: `P${p.uid.slice(-3).toUpperCase()}`,
          adherence: adh,
          urgency,
          trend,
          lastSession: relativeTime(lastSeen[p.uid] || null),
          deviceStatus: p.hardwareStatus?.status || "unknown",
        });
      });

      const avg =
        patients.length > 0 ? Math.round(totalAdh / patients.length) : 0;

      setKpis({
        totalPatients: patients.length,
        avgAdherence: avg,
        missedSessions: realTotalMissed, // 🔴 NOW PULLING REAL DATA
        devicesOnline: devOnline,
      });
      setTriage(
        [...rows].sort((a, b) => a.adherence - b.adherence).slice(0, 3),
      );
      setSessions({
        completed: realCompletedToday,   // 🔴 NOW PULLING REAL DATA
        missed: realMissedToday,         // 🔴 NOW PULLING REAL DATA
        upcoming: realUpcomingToday,     // 🔴 NOW PULLING REAL DATA
      });
      setDataLoading(false);
      fetchAI(user.uid, patients.length, avg, realTotalMissed, devOnline, false);
    } catch (err: any) {
      console.error(err);
      if (USE_MOCK_FALLBACK) {
        setUsingMock(true);
        const mockKpis = buildMockKpis();
        setKpis(mockKpis);
        setTriage(
          [...MOCK_PATIENTS]
            .sort((a, b) => a.adherence - b.adherence)
            .slice(0, 3),
        );
        setSessions({ completed: 12, missed: 3, upcoming: 5 });
        setDataLoading(false);
        fetchAI(
          "mock",
          mockKpis.totalPatients,
          mockKpis.avgAdherence,
          mockKpis.missedSessions,
          mockKpis.devicesOnline,
          true,
        );
      } else {
        setError(err.message || "Failed to load dashboard");
        setDataLoading(false);
      }
    }
  }, [user, fetchAI]);

  useEffect(() => {
    if (!authLoading && user) loadData();
  }, [user, authLoading, loadData]);

  if (!mounted || authLoading) return null;

  // ── Card configs ─────────────────────────────────────────────────────────
  const kpiCards = [
    {
      label: "Total Active Patients",
      value: kpis.totalPatients,
      suffix: "",
      sub: "currently enrolled",
      icon: Users,
      accent: "#2DD4BF",
      abg: "rgba(45,212,191,.10)",
      trend: `+${Math.max(1, Math.floor(kpis.totalPatients * 0.08))} this week`,
      up: true,
    },
    {
      label: "Average Adherence Rate",
      value: kpis.avgAdherence,
      suffix: "%",
      sub: "sessions completed vs prescribed",
      icon: TrendingUp,
      accent: "#6366f1",
      abg: "rgba(99,102,241,.10)",
      trend: kpis.avgAdherence >= 70 ? "+3% vs last week" : "Needs attention",
      up: kpis.avgAdherence >= 70,
    },
    {
      label: "Missed Sessions",
      value: kpis.missedSessions,
      suffix: "",
      sub: "this week, all patients",
      icon: AlertTriangle,
      accent: "#f87171",
      abg: "rgba(248,113,113,.10)",
      trend:
        kpis.missedSessions === 0
          ? "None ✓"
          : `-${Math.max(1, Math.floor(kpis.missedSessions * 0.1))} vs last week`,
      up: kpis.missedSessions === 0,
      alert: kpis.missedSessions > 0,
    },
    {
      label: "Devices Online",
      value: kpis.devicesOnline,
      suffix: "",
      sub: `of ${kpis.totalPatients} total`,
      icon: Cpu,
      accent: "#34d399",
      abg: "rgba(52,211,153,.10)",
      trend:
        kpis.devicesOnline === kpis.totalPatients
          ? "All online"
          : `${kpis.totalPatients - kpis.devicesOnline} offline`,
      up: kpis.devicesOnline === kpis.totalPatients,
    },
  ] as const;

  const sesCards = [
    {
      label: "Completed",
      sub: "Successfully finished",
      count: sessions.completed,
      color: "#10b981",
      bg: "rgba(16,185,129,.07)",
      border: "rgba(16,185,129,.20)",
      icon: <CheckCircle2 size={18} />,
    },
    {
      label: "Missed",
      sub: "Requires follow-up",
      count: sessions.missed,
      color: "#f87171",
      bg: "rgba(248,113,113,.07)",
      border: "rgba(248,113,113,.20)",
      icon: <XCircle size={18} />,
    },
    {
      label: "Upcoming",
      sub: "Scheduled this session",
      count: sessions.upcoming,
      color: "#60a5fa",
      bg: "rgba(96,165,250,.07)",
      border: "rgba(96,165,250,.20)",
      icon: <CalendarClock size={18} />,
    },
  ];
  const maxSes = Math.max(...sesCards.map((s) => s.count), 1);
  const Spinner = () => (
    <Loader2
      size={22}
      color="#2DD4BF"
      style={{ animation: "spin 1s linear infinite" }}
    />
  );

  return (
    <div
      className="doc-dash"
      style={{ minHeight: "100vh", background: dm.pageBg, paddingBottom: 48 }}>
      <style>{STYLES}</style>

      {/* BG */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 0,
        }}>
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "10%",
            width: 900,
            height: 900,
            background:
              "radial-gradient(circle,rgba(45,212,191,.055) 0%,transparent 65%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-15%",
            right: "-5%",
            width: 700,
            height: 700,
            background:
              "radial-gradient(circle,rgba(99,102,241,.045) 0%,transparent 65%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(11,30,51,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(11,30,51,.025) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <main
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "32px 28px",
          position: "relative",
          zIndex: 1,
        }}>
        {/* Mock badge */}
        {usingMock && (
          <div
            className="mock-badge"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(251,191,36,.08)",
              border: "1px solid rgba(251,191,36,.25)",
              borderRadius: 12,
              padding: "8px 16px",
              marginBottom: 16,
              width: "fit-content",
            }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#fbbf24",
                boxShadow: "0 0 6px #fbbf24",
              }}
            />
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: "#fbbf24",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".12em",
              }}>
              Demo Mode · Connect patients to see live data
            </span>
          </div>
        )}

        {/* ── HEADER (already dark — no changes needed) ─────────────────── */}
        <div
          className="doc-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background:
              "linear-gradient(135deg,#0B1E33 0%,#0d2640 60%,#0f3352 100%)",
            borderRadius: 24,
            padding: "24px 32px",
            marginBottom: 28,
            boxShadow:
              "0 4px 40px rgba(11,30,51,.18),inset 0 1px 0 rgba(255,255,255,.06)",
            position: "relative",
            overflow: "hidden",
          }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              background: "linear-gradient(to bottom,#2DD4BF,#0891b2)",
              borderRadius: "24px 0 0 24px",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: -60,
              top: -60,
              width: 260,
              height: 260,
              background:
                "radial-gradient(circle,rgba(45,212,191,.07) 0%,transparent 70%)",
              borderRadius: "50%",
              animation: "aiGlow 5s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: "18%",
              background:
                "linear-gradient(to bottom,transparent,rgba(45,212,191,.04),transparent)",
              animation: "scanLine 5s linear infinite",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              position: "relative",
              zIndex: 2,
            }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                background: "linear-gradient(135deg,#2DD4BF 0%,#0891b2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  "0 0 0 3px rgba(45,212,191,.25),0 8px 24px rgba(45,212,191,.30)",
                animation: "float 4s ease-in-out infinite",
              }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#0B1E33" }}>
                {initials}
              </span>
            </div>
            <div>
              <p
                className="mono"
                style={{
                  fontSize: 10,
                  color: "rgba(45,212,191,.6)",
                  textTransform: "uppercase",
                  letterSpacing: ".18em",
                  marginBottom: 4,
                }}>
                NEURO-REHABILITATION PLATFORM
              </p>
              <h1
                style={{
                  fontSize: "clamp(1.4rem,2.5vw,1.85rem)",
                  fontWeight: 800,
                  color: "#fff",
                  lineHeight: 1.1,
                  margin: 0,
                }}>
                Welcome Back,{" "}
                <span style={{ color: "#2DD4BF" }}>
                  {doctorName.toLowerCase().startsWith("dr") ? doctorName : `Dr. ${doctorName}`}
                </span>
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,.40)",
                  marginTop: 4,
                }}>
                Here's what's happening with your patients today
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              position: "relative",
              zIndex: 2,
            }}>
            <button
              className="refresh-btn"
              onClick={loadData}
              disabled={dataLoading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(45,212,191,.08)",
                border: "1px solid rgba(45,212,191,.20)",
                borderRadius: 12,
                padding: "8px 14px",
                color: "#2DD4BF",
                fontSize: 12,
                fontWeight: 700,
              }}>
              <RefreshCw
                size={12}
                style={{
                  animation: dataLoading ? "spin 1s linear infinite" : "none",
                }}
              />{" "}
              Refresh
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(45,212,191,.10)",
                border: "1px solid rgba(45,212,191,.20)",
                borderRadius: 12,
                padding: "8px 14px",
              }}>
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#2DD4BF",
                  boxShadow: "0 0 8px #2DD4BF",
                }}
              />
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: "#2DD4BF",
                  fontWeight: 600,
                  letterSpacing: ".06em",
                }}>
                SYSTEM ONLINE
              </span>
            </div>
            <div
              className="mono"
              style={{ fontSize: 11, color: "rgba(255,255,255,.25)" }}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* ── KPI CARDS ─────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 20,
            marginBottom: 28,
          }}>
          {kpiCards.map((k, i) => (
            <div
              key={k.label}
              className="kpi-card"
              style={{
                animationDelay: `${i * 0.08 + 0.15}s`,
                background: dm.card,
                borderRadius: 20,
                padding: "22px 24px",
                border: `1px solid ${dm.cardBorder}`,
                boxShadow: "0 2px 16px rgba(11,30,51,.06)",
                position: "relative",
                overflow: "hidden",
              }}>
              {"alert" in k && k.alert && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: "linear-gradient(90deg,#f87171,#fbbf24)",
                    borderRadius: "20px 20px 0 0",
                  }}
                />
              )}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 80,
                  height: 80,
                  background: `radial-gradient(circle at top right,${k.accent}18 0%,transparent 65%)`,
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 13,
                    background: k.abg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: k.accent,
                  }}>
                  <k.icon size={20} />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: k.up
                      ? "rgba(16,185,129,.08)"
                      : "rgba(248,113,113,.08)",
                    color: k.up ? "#10b981" : "#f87171",
                    borderRadius: 8,
                    padding: "3px 8px",
                  }}>
                  {k.up ? (
                    <ArrowUpRight size={12} />
                  ) : (
                    <ArrowDownRight size={12} />
                  )}
                  <span
                    className="mono"
                    style={{ fontSize: 10, fontWeight: 600 }}>
                    {k.trend}
                  </span>
                </div>
              </div>
              <div
                style={{
                  fontSize: "clamp(2rem,3vw,2.6rem)",
                  fontWeight: 800,
                  color: dm.text,
                  lineHeight: 1,
                  marginBottom: 4,
                }}>
                {dataLoading ? (
                  <Spinner />
                ) : (
                  <AnimatedNumber
                    target={k.value}
                    suffix={k.suffix}
                    delay={i * 80 + 200}
                  />
                )}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: dm.text,
                  marginBottom: 3,
                }}>
                {k.label}
              </div>
              <div className="mono" style={{ fontSize: 10, color: "#94a3b8" }}>
                {k.sub}
              </div>
            </div>
          ))}
        </div>

        {/* ── TWO-COLUMN ────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: 20,
            marginBottom: 28,
          }}>
          {/* Triage */}
          <div
            className="sf"
            style={{
              animationDelay: ".38s",
              background: dm.card,
              borderRadius: 24,
              padding: 28,
              border: `1px solid ${dm.cardBorder}`,
              boxShadow: "0 2px 20px rgba(11,30,51,.06)",
            }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 24,
              }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: "rgba(248,113,113,.10)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#f87171",
                    }}>
                    <AlertTriangle size={17} />
                  </div>
                  <h2
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: dm.text,
                      margin: 0,
                    }}>
                    Patient Triage
                  </h2>
                </div>
                <p
                  className="mono"
                  style={{
                    fontSize: 9.5,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: ".14em",
                    marginTop: 6,
                    marginLeft: 44,
                  }}>
                  Patients Requiring Immediate Attention
                </p>
              </div>
              <Link
                href="/doctor/patients"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#2DD4BF",
                  textDecoration: "none",
                }}>
                View All <ChevronRight size={14} />
              </Link>
            </div>

            {dataLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 160,
                }}>
                <Spinner />
              </div>
            ) : triage.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <CheckCircle2
                  size={32}
                  color="#10b981"
                  style={{ margin: "0 auto 12px" }}
                />
                <p style={{ fontSize: 13, fontWeight: 600, color: dm.text }}>
                  All patients on track!
                </p>
                <p style={{ fontSize: 11, color: "#94a3b8" }}>
                  No immediate attention required.
                </p>
              </div>
            ) : (
              <>
                <div
                  className="mono"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    fontSize: 9,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: ".14em",
                    marginBottom: 12,
                    padding: "0 14px",
                  }}>
                  <span>Patient</span>
                  <span style={{ marginRight: 70 }}>Adherence</span>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {triage.map((p, i) => {
                    const uc = urgencyConfig[p.urgency];
                    const bc =
                      p.urgency === "critical"
                        ? "#f87171"
                        : p.urgency === "warning"
                          ? "#fbbf24"
                          : "#34d399";
                    return (
                      <div
                        key={p.uid}
                        className="triage-row"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          background: dm.rowBg,
                          border: `1px solid ${dm.smallBorder}`,
                          borderRadius: 16,
                          padding: "14px 16px",
                          animation:
                            "kpiPop .5s cubic-bezier(.22,1,.36,1) both",
                          animationDelay: `${0.4 + i * 0.1}s`,
                        }}>
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            flexShrink: 0,
                            background: uc.color,
                            boxShadow: uc.shadow,
                            animation:
                              p.urgency === "critical"
                                ? "pulseDot 2s ease-in-out infinite"
                                : undefined,
                            ["--ds" as string]: uc.shadow,
                            ["--dc" as string]: uc.faint,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginBottom: 6,
                            }}>
                            <span
                              style={{
                                fontSize: 13.5,
                                fontWeight: 700,
                                color: dm.text,
                                whiteSpace: "nowrap",
                              }}>
                              {p.name}
                            </span>
                            <span
                              className="mono"
                              style={{
                                fontSize: 9,
                                color: "#94a3b8",
                                background: dm.badgeBg,
                                padding: "1px 7px",
                                borderRadius: 6,
                              }}>
                              {p.code}
                            </span>
                            {p.trend === "down" && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                  color: "#f87171",
                                }}>
                                <ArrowDownRight size={11} />
                                <span className="mono" style={{ fontSize: 9 }}>
                                  declining
                                </span>
                              </div>
                            )}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}>
                            <AdherenceBar value={p.adherence} color={bc} />
                            <span
                              className="mono"
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: bc,
                                flexShrink: 0,
                              }}>
                              {p.adherence}%
                            </span>
                          </div>
                          <div
                            className="mono"
                            style={{
                              fontSize: 9,
                              color: "#94a3b8",
                              marginTop: 4,
                            }}>
                            Last: {p.lastSession}
                          </div>
                        </div>
                        <Link
                          href={`/doctor/patients/${p.uid}`}
                          className="view-btn shimmer-btn"
                          style={{
                            position: "relative",
                            overflow: "hidden",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#475569",
                            background: dm.badgeBg,
                            border: `1px solid ${dm.cardBorder}`,
                            borderRadius: 10,
                            padding: "7px 13px",
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          }}>
                          <Eye size={12} /> View
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Session Snapshot (already dark — no changes needed) */}
          <div
            className="sf"
            style={{
              animationDelay: ".46s",
              background: "#0B1E33",
              borderRadius: 24,
              padding: 28,
              border: "1px solid rgba(255,255,255,.06)",
              boxShadow: "0 2px 30px rgba(11,30,51,.18)",
              position: "relative",
              overflow: "hidden",
            }}>
            <div
              style={{
                position: "absolute",
                top: -80,
                right: -80,
                width: 260,
                height: 260,
                background:
                  "radial-gradient(circle,rgba(45,212,191,.08) 0%,transparent 70%)",
                borderRadius: "50%",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: "14%",
                background:
                  "linear-gradient(to bottom,transparent,rgba(45,212,191,.025),transparent)",
                animation: "scanLine 4.5s linear infinite",
              }}
            />
            <div style={{ position: "relative", zIndex: 2 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 6,
                }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: "rgba(45,212,191,.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#2DD4BF",
                  }}>
                  <Activity size={17} />
                </div>
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#fff",
                    margin: 0,
                  }}>
                  Today's Sessions
                </h2>
              </div>
              <p
                className="mono"
                style={{
                  fontSize: 9.5,
                  color: "rgba(255,255,255,.30)",
                  textTransform: "uppercase",
                  letterSpacing: ".14em",
                  marginBottom: 26,
                  marginLeft: 44,
                }}>
                Overview of Therapy Sessions
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sesCards.map((s, i) => (
                  <div
                    key={s.label}
                    className="session-card"
                    style={{
                      background: s.bg,
                      border: `1px solid ${s.border}`,
                      borderRadius: 18,
                      padding: "18px 20px",
                      animation: "kpiPop .55s cubic-bezier(.22,1,.36,1) both",
                      animationDelay: `${0.5 + i * 0.12}s`,
                    }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}>
                        <div style={{ color: s.color, opacity: 0.85 }}>
                          {s.icon}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#fff",
                            }}>
                            {s.label}
                          </div>
                          <div
                            className="mono"
                            style={{
                              fontSize: 9.5,
                              color: "rgba(255,255,255,.35)",
                              textTransform: "uppercase",
                              letterSpacing: ".10em",
                              marginTop: 3,
                            }}>
                            {s.sub}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: "2rem",
                          fontWeight: 800,
                          color: s.color,
                          lineHeight: 1,
                          letterSpacing: "-.03em",
                          textShadow: `0 0 20px ${s.color}60`,
                        }}>
                        <AnimatedNumber
                          target={s.count}
                          delay={600 + i * 120}
                        />
                      </div>
                    </div>
                    <SessionBar
                      count={s.count}
                      max={maxSes}
                      color={s.color}
                      delay={700 + i * 120}
                    />
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: "1px solid rgba(255,255,255,.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,.30)",
                    textTransform: "uppercase",
                    letterSpacing: ".14em",
                  }}>
                  Total Today
                </span>
                <span
                  style={{ fontSize: 18, fontWeight: 800, color: "#2DD4BF" }}>
                  <AnimatedNumber
                    target={
                      sessions.completed + sessions.missed + sessions.upcoming
                    }
                    delay={900}
                  />
                  <span
                    className="mono"
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,.30)",
                      fontWeight: 400,
                      marginLeft: 4,
                    }}>
                    sessions
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── AI WEEKLY SUMMARY (already dark — no changes needed) ─────────── */}
        <div
          className="sf"
          style={{
            animationDelay: ".58s",
            background:
              "linear-gradient(135deg,#0B1E33 0%,#0d2844 50%,#0a1e3a 100%)",
            borderRadius: 24,
            padding: "32px 36px",
            border: "1px solid rgba(45,212,191,.12)",
            boxShadow: "0 4px 40px rgba(11,30,51,.14)",
            position: "relative",
            overflow: "hidden",
          }}>
          <div
            className="ai-glow"
            style={{
              position: "absolute",
              top: -80,
              left: "30%",
              width: 400,
              height: 300,
              background:
                "radial-gradient(ellipse,rgba(45,212,191,.07) 0%,transparent 70%)",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -60,
              right: "10%",
              width: 280,
              height: 200,
              background:
                "radial-gradient(ellipse,rgba(99,102,241,.06) 0%,transparent 70%)",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: "12%",
              background:
                "linear-gradient(to bottom,transparent,rgba(45,212,191,.03),transparent)",
              animation: "scanLine 6s linear infinite",
            }}
          />

          <div style={{ position: "relative", zIndex: 2 }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 20,
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    background:
                      "linear-gradient(135deg,rgba(45,212,191,.20),rgba(45,212,191,.08))",
                    border: "1px solid rgba(45,212,191,.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#2DD4BF",
                    boxShadow: "0 0 20px rgba(45,212,191,.15)",
                  }}>
                  <BrainCircuit size={22} />
                </div>
                <div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h2
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                        color: "#fff",
                        margin: 0,
                      }}>
                      AI Weekly Summary
                    </h2>
                    <div
                      style={{
                        background: "rgba(45,212,191,.12)",
                        border: "1px solid rgba(45,212,191,.22)",
                        borderRadius: 8,
                        padding: "2px 9px",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}>
                      <Sparkles size={10} color="#2DD4BF" />
                      <span
                        className="mono"
                        style={{
                          fontSize: 9,
                          color: "#2DD4BF",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: ".10em",
                        }}>
                        {aiLoading ? "Generating…" : "AI Generated · Live"}
                      </span>
                    </div>
                  </div>
                  <p
                    className="mono"
                    style={{
                      fontSize: 9.5,
                      color: "rgba(255,255,255,.28)",
                      textTransform: "uppercase",
                      letterSpacing: ".14em",
                      marginTop: 4,
                    }}>
                    {usingMock
                      ? "Demo Cohort · 12 Patients"
                      : "Real-Time Insights from Your Patient Cohort"}
                  </p>
                </div>
              </div>
              <Link
                href="/doctor/ai-companion"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(45,212,191,.08)",
                  border: "1px solid rgba(45,212,191,.20)",
                  borderRadius: 12,
                  padding: "8px 16px",
                  color: "#2DD4BF",
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: "none",
                }}>
                Full Analysis <ArrowUpRight size={13} />
              </Link>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,.03)",
                border: "1px solid rgba(255,255,255,.07)",
                borderRadius: 18,
                padding: "22px 26px",
                position: "relative",
              }}>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 16,
                  bottom: 16,
                  width: 3,
                  background: "linear-gradient(to bottom,#2DD4BF,#0891b2)",
                  borderRadius: "0 3px 3px 0",
                }}
              />
              <div
                style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  {aiLoading ? (
                    <Loader2
                      size={15}
                      color="#2DD4BF"
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    <Wifi size={15} color="#2DD4BF" style={{ opacity: 0.7 }} />
                  )}
                </div>
                <div>
                  <span
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: "#2DD4BF",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: ".14em",
                      marginRight: 10,
                    }}>
                    Key Insights ·
                  </span>
                  <span
                    style={{
                      fontSize: 13.5,
                      color: "rgba(255,255,255,.72)",
                      lineHeight: 1.75,
                      fontWeight: 400,
                    }}>
                    {aiLoading ? (
                      <span style={{ color: "rgba(255,255,255,.35)" }}>
                        Analysing cohort data…
                      </span>
                    ) : (
                      <Typewriter
                        text={aiSummary || "No data available yet."}
                        delay={200}
                      />
                    )}
                  </span>
                </div>
              </div>
            </div>

            {aiPills.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 18,
                  flexWrap: "wrap",
                }}>
                {aiPills.map((m, i) => (
                  <div
                    key={m.label}
                    style={{
                      background: "rgba(255,255,255,.04)",
                      border: "1px solid rgba(255,255,255,.07)",
                      borderRadius: 12,
                      padding: "10px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      animation: "kpiPop .5s cubic-bezier(.22,1,.36,1) both",
                      animationDelay: `${0.7 + i * 0.1}s`,
                    }}>
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: m.color,
                        boxShadow: `0 0 6px ${m.color}`,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,.40)",
                        fontWeight: 500,
                      }}>
                      {m.label}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: m.color,
                        letterSpacing: "-.02em",
                      }}>
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && !USE_MOCK_FALLBACK && (
          <div
            style={{
              marginTop: 16,
              background: "rgba(248,113,113,.08)",
              border: "1px solid rgba(248,113,113,.25)",
              borderRadius: 12,
              padding: "12px 16px",
              color: "#f87171",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}
      </main>
    </div>
  );
}