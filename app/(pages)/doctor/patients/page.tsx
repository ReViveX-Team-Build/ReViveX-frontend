"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Bot,
  Shield,
  MessageCircle,
  ClipboardList,
  User,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../../lib/firebase";
import { getPatientsByDoctor } from "../../../lib/db/users";
import {
  getCohortSessionsThisWeek,
  getLastSessionPerPatient,
} from "../../../lib/db/sessions";
import { collection, query, where, getDocs } from "firebase/firestore";
import { PatientData, TherapyProtocol } from "../../../lib/db/types";
import { useDarkMode } from "@/app/lib/hooks/useDarkMode";

// ─── MOCK FLAG — set false to restore full Firebase + auth flow ────────────
const USE_MOCK = false;

const MOCK_PATIENTS: DisplayPatient[] = [
  {
    id: "mock_p1",
    name: "P.B. De Silva",
    pid: "P001",
    adherence: 45,
    lastSession: "2025-03-06",
    status: "Low",
    sub: "Standard",
    condition: "Stroke",
    hasProtocol: true,
  },
  {
    id: "mock_p2",
    name: "Anura Dissanayaka",
    pid: "P002",
    adherence: 92,
    lastSession: "2025-03-08",
    status: "High",
    sub: "AI Companion",
    condition: "TBI",
    hasProtocol: true,
  },
  {
    id: "mock_p3",
    name: "Sarath Watawala",
    pid: "P003",
    adherence: 78,
    lastSession: "2025-03-08",
    status: "High",
    sub: "Standard",
    condition: "Post-Surgery",
    hasProtocol: true,
  },
  {
    id: "mock_p4",
    name: "Shifani Ameena",
    pid: "P004",
    adherence: 65,
    lastSession: "2025-03-07",
    status: "Medium",
    sub: "AI Companion",
    condition: "Parkinson's",
    hasProtocol: false,
  },
  {
    id: "mock_p5",
    name: "Percy Silva",
    pid: "P005",
    adherence: 88,
    lastSession: "2025-03-09",
    status: "High",
    sub: "Standard",
    condition: "Stroke",
    hasProtocol: true,
  },
  {
    id: "mock_p6",
    name: "Athula Premachandra",
    pid: "P006",
    adherence: 52,
    lastSession: "2025-03-08",
    status: "Low",
    sub: "Standard",
    condition: "TBI",
    hasProtocol: true,
  },
  {
    id: "mock_p7",
    name: "Aruni Perera",
    pid: "P007",
    adherence: 95,
    lastSession: "2025-03-09",
    status: "High",
    sub: "AI Companion",
    condition: "Post-Surgery",
    hasProtocol: true,
  },
  {
    id: "mock_p8",
    name: "Amal Mahendra",
    pid: "P008",
    adherence: 73,
    lastSession: "2025-03-08",
    status: "Medium",
    sub: "Standard",
    condition: "Stroke",
    hasProtocol: true,
  },
  {
    id: "mock_p9",
    name: "Malkanthi Peris",
    pid: "P009",
    adherence: 25,
    lastSession: "2025-03-07",
    status: "Low",
    sub: "Standard",
    condition: "Parkinson's",
    hasProtocol: false,
  },
  {
    id: "mock_p10",
    name: "K.K. Muththukumaran",
    pid: "P010",
    adherence: 76,
    lastSession: "2025-03-08",
    status: "Medium",
    sub: "Standard",
    condition: "TBI",
    hasProtocol: true,
  },
  {
    id: "mock_p11",
    name: "Kamal Fernando",
    pid: "P011",
    adherence: 80,
    lastSession: "2025-03-09",
    status: "High",
    sub: "AI Companion",
    condition: "Stroke",
    hasProtocol: true,
  },
  {
    id: "mock_p12",
    name: "P.P. Sugathadasa",
    pid: "P012",
    adherence: 63,
    lastSession: "2025-03-08",
    status: "Medium",
    sub: "Standard",
    condition: "Post-Surgery",
    hasProtocol: true,
  },
];
// ──────────────────────────────────────────────────────────────────────────────

interface DisplayPatient {
  id: string;
  name: string;
  pid: string;
  adherence: number;
  lastSession: string;
  status: "High" | "Medium" | "Low";
  sub: string;
  condition: string;
  hasProtocol: boolean;
}

function adherenceColor(v: number) {
  return v >= 80 ? "#22c55e" : v >= 55 ? "#f97316" : "#ef4444";
}
function statusColor(s: string) {
  return s === "High" ? "#22c55e" : s === "Medium" ? "#f97316" : "#ef4444";
}
function getStatus(a: number): "High" | "Medium" | "Low" {
  return a >= 80 ? "High" : a >= 55 ? "Medium" : "Low";
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  .mpp * { font-family:'Plus Jakarta Sans',system-ui,sans-serif; box-sizing:border-box; }
  .mpp .mono { font-family:'JetBrains Mono',monospace; }
  @keyframes mppFadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes mppRowIn   { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
  @keyframes mppShimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }
  @keyframes mppPing    { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,.45)} 50%{box-shadow:0 0 0 6px rgba(99,102,241,0)} }
  @keyframes mppCountUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin        { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  .mpp-search { width:100%;padding:10px 14px 10px 40px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;font-size:13.5px;font-weight:500;color:#0B1E33;outline:none;transition:all .2s;font-family:'Plus Jakarta Sans',sans-serif; }
  .mpp-search::placeholder{color:#94a3b8}
  .mpp-search:focus{background:#fff;border-color:rgba(45,212,191,.65);box-shadow:0 0 0 3px rgba(45,212,191,.10)}
  .mpp-select{padding:10px 38px 10px 16px;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 13px center;border:1.5px solid #e2e8f0;border-radius:12px;font-size:13.5px;font-weight:600;color:#0B1E33;outline:none;cursor:pointer;-webkit-appearance:none;appearance:none;transition:all .2s;font-family:'Plus Jakarta Sans',sans-serif;min-width:155px}
  .mpp-select:focus{border-color:rgba(45,212,191,.65);box-shadow:0 0 0 3px rgba(45,212,191,.10)}
  .mpp-tr{animation:mppRowIn .35s cubic-bezier(.22,1,.36,1) both}
  .mpp-tr:hover td{background:rgba(45,212,191,.025)!important}
  .mpp-tr:last-child td{border-bottom:none!important}
  .mpp-msg-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:9px;font-size:12px;font-weight:700;border:1.5px solid rgba(45,212,191,.35);background:rgba(45,212,191,.07);color:#0891b2;cursor:pointer;transition:all .18s;text-decoration:none;white-space:nowrap}
  .mpp-msg-btn:hover{background:linear-gradient(135deg,#2DD4BF,#0891b2);color:#0B1E33;border-color:transparent;box-shadow:0 4px 14px rgba(45,212,191,.30);transform:translateY(-1px)}
  .mpp-proto-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:9px;font-size:12px;font-weight:700;border:1.5px solid rgba(99,102,241,.30);background:rgba(99,102,241,.07);color:#6366f1;cursor:pointer;transition:all .18s;text-decoration:none;white-space:nowrap;position:relative}
  .mpp-proto-btn:hover{background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border-color:transparent;box-shadow:0 4px 14px rgba(99,102,241,.30);transform:translateY(-1px)}
  .mpp-proto-btn.has-protocol{animation:mppPing 3s ease-in-out infinite}
  .mpp-proto-set{position:absolute;top:-5px;right:-5px;width:12px;height:12px;border-radius:50%;background:#22c55e;border:2px solid #fff;box-shadow:0 0 5px rgba(34,197,94,.6)}
  .mpp-view-btn{display:inline-flex;align-items:center;padding:7px 16px;border-radius:9px;font-size:12px;font-weight:700;border:1.5px solid #cbd5e1;background:#fff;color:#1e293b;cursor:pointer;transition:all .18s;text-decoration:none;white-space:nowrap}
  .mpp-view-btn:hover{background:#0B1E33;color:#fff;border-color:#0B1E33;box-shadow:0 4px 14px rgba(11,30,51,.20);transform:translateY(-1px)}
  .mpp-condition{display:inline-flex;align-items:center;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;background:rgba(11,30,51,.05);color:#475569;white-space:nowrap;border:1px solid rgba(11,30,51,.08)}
  .mpp-scroll::-webkit-scrollbar{height:4px}
  .mpp-scroll::-webkit-scrollbar-thumb{background:rgba(45,212,191,.28);border-radius:99px}
  .mpp-stat{flex:1;padding:16px 20px;background:#fff;border-radius:16px;border:1px solid rgba(226,232,240,.9);box-shadow:0 2px 14px rgba(11,30,51,.05);animation:mppCountUp .45s ease both}
  @media(max-width:1100px){.mpp-stats{flex-wrap:wrap!important}.mpp-stat{min-width:calc(50% - 8px)}}
  @media(max-width:860px){.mpp-filter-row{flex-wrap:wrap!important}.mpp-selects{flex-wrap:wrap}}
  @media(max-width:600px){.mpp .mpp-pad{padding:20px 14px!important}.mpp-title{font-size:22px!important}}
  /* ── Dark mode overrides ── */
  .dark .mpp-search { background: #334155; border-color: #475569; color: #f1f5f9; }
  .dark .mpp-search::placeholder { color: #64748b; }
  .dark .mpp-search:focus { background: #1e293b; border-color: rgba(45,212,191,.65); }
  .dark .mpp-select { background-color: #334155 !important; border-color: #475569; color: #f1f5f9; }
  .dark .mpp-select:focus { border-color: rgba(45,212,191,.65); }
  .dark .mpp-stat { background: #1e293b !important; border-color: #334155 !important; box-shadow: 0 2px 14px rgba(0,0,0,.18) !important; }
  .dark .mpp-view-btn { background: #1e293b; color: #f1f5f9; border-color: #475569; }
  .dark .mpp-view-btn:hover { background: #f1f5f9; color: #0B1E33; border-color: #f1f5f9; }
  .dark .mpp-condition { background: rgba(241,245,249,.07); color: #94a3b8; border-color: rgba(241,245,249,.10); }
  .dark .mpp-tr:hover td { background: rgba(45,212,191,.07) !important; }
  .dark .mpp-proto-set { border-color: #1e293b; }
`;

function AdherenceBar({ value, delay = 0 }: { value: number; delay?: number }) {
  const [w, setW] = useState(0);
  const isDark = useDarkMode();
  const color = adherenceColor(value);
  useEffect(() => {
    const t = setTimeout(() => setW(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 64,
          height: 5,
          background: isDark ? "#334155" : "#e2e8f0",
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
            transition: "width 1s cubic-bezier(.22,1,.36,1)",
            position: "relative",
          }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent)",
              animation: "mppShimmer 2.2s ease-in-out infinite",
            }}
          />
        </div>
      </div>
      <span
        className="mono"
        style={{ fontSize: 11.5, fontWeight: 700, color, minWidth: 30 }}>
        {value}%
      </span>
    </div>
  );
}

function SubBadge({ type }: { type: string }) {
  const isDark = useDarkMode();
  const isAI = type === "AI Companion";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 11px",
        borderRadius: 99,
        background: isAI ? "#0B1E33" : isDark ? "#334155" : "#f1f5f9",
        color: isAI ? "#2DD4BF" : isDark ? "#94a3b8" : "#475569",
        fontSize: 11,
        fontWeight: 700,
        border: isAI
          ? "1px solid rgba(45,212,191,.18)"
          : isDark
            ? "1px solid #475569"
            : "1px solid #e2e8f0",
        whiteSpace: "nowrap",
      }}>
      {isAI ? <Bot size={10} /> : <Shield size={10} />}
      {type}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const isDark = useDarkMode();
  const color = statusColor(status);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 5px ${color}80`,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          color: isDark ? "#94a3b8" : "#334155",
        }}>
        {status}
      </span>
    </div>
  );
}

function TH({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  const isDark = useDarkMode();
  return (
    <th
      style={{
        padding: "13px 16px",
        textAlign: "left",
        fontSize: 10,
        fontWeight: 700,
        color: accent ? "#6366f1" : isDark ? "#94a3b8" : "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.10em",
        fontFamily: "'JetBrains Mono',monospace",
        borderBottom: `1.5px solid ${accent ? "rgba(99,102,241,.18)" : isDark ? "#334155" : "#e2e8f0"}`,
        background: accent
          ? isDark
            ? "rgba(99,102,241,.06)"
            : "rgba(99,102,241,.025)"
          : isDark
            ? "#1e293b"
            : "#fff",
        whiteSpace: "nowrap",
      }}>
      {children}
    </th>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
  delay,
}: {
  label: string;
  value: number | string;
  color: string;
  icon: React.ReactNode;
  delay: number;
}) {
  const isDark = useDarkMode();
  return (
    <div className="mpp-stat" style={{ animationDelay: `${delay}s` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: `${color}14`,
            border: `1px solid ${color}28`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color,
            flexShrink: 0,
          }}>
          {icon}
        </div>
        <div>
          <div
            className="mono"
            style={{
              fontSize: 8.5,
              color: isDark ? "#64748b" : "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontWeight: 700,
            }}>
            {label}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: isDark ? "#f1f5f9" : "#0B1E33",
              lineHeight: 1.15,
            }}>
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DoctorPatientsPage() {
  const [user, authLoading] = useAuthState(auth);
  // TEMP DEV OVERRIDE: uses a fixed doctor UID in development when auth is not ready.
  // Remove this once login is fully functional by replacing this block with:
  // const doctorId = user?.uid ?? "";
  const doctorId =
    process.env.NODE_ENV === "development"
      ? "doctor_test_001"
      : (user?.uid ?? "");
  const [displayPatients, setDisplayPatients] = useState<DisplayPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [adherenceFilter, setAdherenceFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [mounted, setMounted] = useState(false);
  const isDark = useDarkMode();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (USE_MOCK) {
      // ── MOCK PATH: no auth, no Firebase, instant render ─────────────────
      setDisplayPatients(MOCK_PATIENTS);
      setLoading(false);
      return;
    }

    // ── REAL PATH: use dev override in development, auth uid in production ──
    if (authLoading && !doctorId) return;
    if (!doctorId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError("");
        const patients = await getPatientsByDoctor(doctorId);
        if (patients.length === 0) {
          setDisplayPatients([]);
          return;
        }

        const patientUids = patients.map((p) => p.uid);
        const [weekSessions, lastSessionMap] = await Promise.all([
          getCohortSessionsThisWeek(patientUids),
          getLastSessionPerPatient(patientUids),
        ]);
        const snap = await getDocs(
          query(collection(db, "protocols"), where("doctorId", "==", doctorId)),
        );
        const protocolMap = new Map<string, TherapyProtocol>();
        snap.docs.forEach((d) => {
          const d2 = d.data() as TherapyProtocol;
          protocolMap.set(d2.patientId, { ...d2, id: d.id });
        });

        setDisplayPatients(
          patients.map((p) => {
            const protocol = protocolMap.get(p.uid);
            const spw = protocol?.sessionsPerWeek ?? 5;
            const completed = weekSessions.filter(
              (s) => s.userId === p.uid && s.durationSeconds > 60,
            ).length;
            const adherence = Math.min(
              100,
              Math.round((completed / spw) * 100),
            );
            const lastDate = lastSessionMap.get(p.uid);
            return {
              id: p.uid,
              name: p.name,
              pid: (p as any).patientId ?? p.uid.slice(0, 7).toUpperCase(),
              adherence,
              lastSession: lastDate
                ? lastDate.toLocaleDateString("en-CA")
                : "No sessions",
              status: getStatus(adherence),
              sub:
                (p as any).subscriptionPlan === "ai_companion"
                  ? "AI Companion"
                  : "Standard",
              condition: p.condition,
              hasProtocol: protocolMap.has(p.uid),
            };
          }),
        );
      } catch (err) {
        console.error(err);
        setError("Failed to load patients. Please refresh.");
      } finally {
        setLoading(false);
      }
    })();
  }, [mounted, authLoading, doctorId]);

  const filtered = useMemo(
    () =>
      displayPatients.filter((p) => {
        const q = search.toLowerCase();
        const matchQ =
          p.name.toLowerCase().includes(q) || p.pid.toLowerCase().includes(q);
        const matchA =
          adherenceFilter === "all" ||
          p.status.toLowerCase() === adherenceFilter;
        const matchC =
          conditionFilter === "all" ||
          (p.condition || "").toLowerCase().replace(/[\s-]/g, "") ===
            (conditionFilter || "").toLowerCase().replace(/[\s-]/g, "");
        return matchQ && matchA && matchC;
      }),
    [displayPatients, search, adherenceFilter, conditionFilter],
  );

  const highCount = displayPatients.filter((p) => p.status === "High").length;
  const lowCount = displayPatients.filter((p) => p.status === "Low").length;
  const protoCount = displayPatients.filter((p) => p.hasProtocol).length;

  if (!mounted) return null;

  return (
    <div
      className="mpp"
      style={{
        minHeight: "100vh",
        background: isDark ? "#0f172a" : "#F0F4F8",
      }}>
      <style>{CSS}</style>
      <div
        className="mpp-pad"
        style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 28px" }}>
        <div
          style={{
            marginBottom: 24,
            animation: "mppFadeUp .45s ease both",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}>
          <div>
            <h1
              className="mpp-title"
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: isDark ? "#f1f5f9" : "#0B1E33",
                margin: 0,
              }}>
              My Patients
            </h1>
            <p
              style={{
                fontSize: 14,
                color: isDark ? "#94a3b8" : "#64748b",
                marginTop: 5,
                fontWeight: 500,
              }}>
              Manage, monitor, and assign therapy protocols to all your patients
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {USE_MOCK && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(251,191,36,.08)",
                  border: "1px solid rgba(251,191,36,.30)",
                  borderRadius: 10,
                  padding: "7px 13px",
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
                    fontSize: 9.5,
                    color: "#fbbf24",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}>
                  Demo Data
                </span>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 16px",
                borderRadius: 12,
                background: isDark ? "#1e293b" : "#fff",
                border: `1.5px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                fontSize: 13,
                fontWeight: 700,
                color: isDark ? "#94a3b8" : "#64748b",
                cursor: "pointer",
              }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 16px",
              background: "rgba(239,68,68,.06)",
              border: "1px solid rgba(239,68,68,.20)",
              borderRadius: 12,
              fontSize: 13,
              color: "#dc2626",
              fontWeight: 500,
            }}>
            {error}
          </div>
        )}

        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 320,
            }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}>
              <Loader2
                size={32}
                color="#2DD4BF"
                style={{ animation: "spin 1s linear infinite" }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: isDark ? "#94a3b8" : "#64748b",
                }}>
                Loading patient data…
              </span>
            </div>
          </div>
        ) : (
          <>
            <div
              className="mpp-stats"
              style={{ display: "flex", gap: 12, marginBottom: 22 }}>
              <StatCard
                label="Total Patients"
                value={displayPatients.length}
                color="#2DD4BF"
                delay={0.05}
                icon={<User size={15} />}
              />
              <StatCard
                label="High Adherence"
                value={highCount}
                color="#22c55e"
                delay={0.1}
                icon={<Shield size={15} />}
              />
              <StatCard
                label="Need Attention"
                value={lowCount}
                color="#ef4444"
                delay={0.15}
                icon={<MessageCircle size={15} />}
              />
              <StatCard
                label="Protocols Set"
                value={`${protoCount}/${displayPatients.length}`}
                color="#6366f1"
                delay={0.2}
                icon={<ClipboardList size={15} />}
              />
            </div>

            <div
              className="mpp-filter-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 18,
                animation: "mppFadeUp .45s ease .08s both",
              }}>
              <div style={{ position: "relative", width: 270, flexShrink: 0 }}>
                <Search
                  size={15}
                  color="#94a3b8"
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  className="mpp-search"
                  placeholder="Search by name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }} />
              <div className="mpp-selects" style={{ display: "flex", gap: 10 }}>
                <select
                  className="mpp-select"
                  value={adherenceFilter}
                  onChange={(e) => setAdherenceFilter(e.target.value)}>
                  <option value="all">All Adherence</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  className="mpp-select"
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value)}>
                  <option value="all">All Conditions</option>
                  <option value="stroke">Stroke</option>
                  <option value="tbi">TBI</option>
                  <option value="postsurgery">Post-Surgery</option>
                  <option value="parkinson's">Parkinson's</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {displayPatients.length === 0 ? (
              <div
                style={{
                  background: isDark ? "#1e293b" : "#fff",
                  border: "2px solid #2DD4BF",
                  borderRadius: 18,
                  padding: "52px",
                  textAlign: "center",
                  boxShadow: "0 4px 28px rgba(45,212,191,.10)",
                }}>
                <User size={36} color="#cbd5e1" style={{ marginBottom: 12 }} />
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: isDark ? "#f1f5f9" : "#0B1E33",
                    marginBottom: 6,
                  }}>
                  No patients yet
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: isDark ? "#64748b" : "#94a3b8",
                  }}>
                  Patients will appear here once they link to your account.
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    background: isDark ? "#1e293b" : "#fff",
                    border: "2px solid #2DD4BF",
                    borderRadius: 18,
                    overflow: "hidden",
                    boxShadow: "0 4px 28px rgba(45,212,191,.10)",
                    animation: "mppFadeUp .45s ease .14s both",
                  }}>
                  <div className="mpp-scroll" style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        minWidth: 980,
                      }}>
                      <thead>
                        <tr>
                          <TH>Patient</TH>
                          <TH>ID</TH>
                          <TH>Condition</TH>
                          <TH>Adherence</TH>
                          <TH>Last Session</TH>
                          <TH>Status</TH>
                          <TH>Plan</TH>
                          <TH accent>Protocol</TH>
                          <TH>Message</TH>
                          <TH>Profile</TH>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((p, i) => {
                          const ac = adherenceColor(p.adherence);
                          return (
                            <tr
                              key={p.id}
                              className="mpp-tr"
                              style={{
                                animationDelay: `${0.14 + i * 0.035}s`,
                              }}>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  borderBottom: `1.5px dashed rgba(45,212,191,.22)`,
                                  verticalAlign: "middle",
                                }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                  }}>
                                  <div
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: 10,
                                      flexShrink: 0,
                                      background: `linear-gradient(135deg,${ac}28,${ac}14)`,
                                      border: `1.5px solid ${ac}38`,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: 9.5,
                                      fontWeight: 800,
                                      color: ac,
                                    }}>
                                    {p.name
                                      .split(" ")
                                      .map((w) => w[0])
                                      .slice(0, 2)
                                      .join("")}
                                  </div>
                                  <span
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 700,
                                      color: isDark ? "#f1f5f9" : "#0B1E33",
                                    }}>
                                    {p.name}
                                  </span>
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  borderBottom:
                                    "1.5px dashed rgba(45,212,191,.22)",
                                  verticalAlign: "middle",
                                }}>
                                <span
                                  className="mono"
                                  style={{
                                    fontSize: 12,
                                    color: "#2DD4BF",
                                    fontWeight: 600,
                                    background: "rgba(45,212,191,.08)",
                                    border: "1px solid rgba(45,212,191,.18)",
                                    padding: "2px 8px",
                                    borderRadius: 7,
                                  }}>
                                  {p.pid}
                                </span>
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  borderBottom:
                                    "1.5px dashed rgba(45,212,191,.22)",
                                  verticalAlign: "middle",
                                }}>
                                <span className="mpp-condition">
                                  {p.condition}
                                </span>
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  borderBottom:
                                    "1.5px dashed rgba(45,212,191,.22)",
                                  verticalAlign: "middle",
                                }}>
                                <AdherenceBar
                                  value={p.adherence}
                                  delay={120 + i * 30}
                                />
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  borderBottom:
                                    "1.5px dashed rgba(45,212,191,.22)",
                                  verticalAlign: "middle",
                                }}>
                                <span
                                  className="mono"
                                  style={{
                                    fontSize: 12,
                                    color: isDark ? "#94a3b8" : "#475569",
                                    fontWeight: 500,
                                  }}>
                                  {p.lastSession}
                                </span>
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  borderBottom:
                                    "1.5px dashed rgba(45,212,191,.22)",
                                  verticalAlign: "middle",
                                }}>
                                <StatusDot status={p.status} />
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  borderBottom:
                                    "1.5px dashed rgba(45,212,191,.22)",
                                  verticalAlign: "middle",
                                }}>
                                <SubBadge type={p.sub} />
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  borderBottom:
                                    "1.5px dashed rgba(45,212,191,.22)",
                                  borderLeft: `1px solid rgba(99,102,241,.10)`,
                                  background: isDark
                                    ? "rgba(99,102,241,.06)"
                                    : "rgba(99,102,241,.012)",
                                  verticalAlign: "middle",
                                }}>
                                <Link
                                  href={`/doctor/protocols?patient=${p.id}`}
                                  className={`mpp-proto-btn${p.hasProtocol ? " has-protocol" : ""}`}>
                                  {p.hasProtocol && (
                                    <div className="mpp-proto-set" />
                                  )}
                                  <ClipboardList size={13} />
                                  {p.hasProtocol
                                    ? "Edit Protocol"
                                    : "Set Protocol"}
                                </Link>
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  borderBottom:
                                    "1.5px dashed rgba(45,212,191,.22)",
                                  verticalAlign: "middle",
                                }}>
                                <Link
                                  href={`/doctor/patients/${p.id}/messages`}
                                  className="mpp-msg-btn">
                                  <MessageCircle size={12} />
                                  Message
                                </Link>
                              </td>
                              <td
                                style={{
                                  padding: "14px 16px",
                                  borderBottom:
                                    "1.5px dashed rgba(45,212,191,.22)",
                                  verticalAlign: "middle",
                                }}>
                                <Link
                                  href={`/doctor/patients/${p.id}`}
                                  className="mpp-view-btn">
                                  View Profile
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                        {filtered.length === 0 && (
                          <tr>
                            <td
                              colSpan={10}
                              style={{
                                padding: "52px",
                                textAlign: "center",
                                color: isDark ? "#64748b" : "#94a3b8",
                                fontSize: 14,
                                fontWeight: 500,
                              }}>
                              No patients match your filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 8,
                  }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 12px",
                      borderRadius: 99,
                      background: "rgba(99,102,241,.08)",
                      border: "1px solid rgba(99,102,241,.18)",
                    }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#22c55e",
                      }}
                    />
                    <span
                      className="mono"
                      style={{
                        fontSize: 9.5,
                        color: "#6366f1",
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                      }}>
                      Green dot = protocol already set
                    </span>
                  </div>
                  <span
                    className="mono"
                    style={{
                      fontSize: 10.5,
                      color: isDark ? "#64748b" : "#94a3b8",
                      letterSpacing: "0.08em",
                    }}>
                    {filtered.length} of {displayPatients.length} patients
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
