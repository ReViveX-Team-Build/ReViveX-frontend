"use client";

import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Patient {
  id: string;
  name: string;
  code: string;
  adherence: number;
  urgency: "critical" | "warning" | "mild";
  trend: "down" | "stable" | "up";
  lastSession: string;
}

interface SessionSnapshot {
  label: string;
  sub: string;
  count: number;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
const doctor = { name: "Dr. Suresh", initials: "DS" };

const kpis = [
  {
    label: "Total Active Patients",
    value: 8,
    sub: "currently enrolled",
    icon: Users,
    accent: "#2DD4BF",
    accentBg: "rgba(45,212,191,0.10)",
    trend: "+1 this week",
    trendUp: true,
  },
  {
    label: "Average Adherence Rate",
    value: 74,
    suffix: "%",
    sub: "up 3% from last week",
    icon: TrendingUp,
    accent: "#6366f1",
    accentBg: "rgba(99,102,241,0.10)",
    trend: "+3%",
    trendUp: true,
  },
  {
    label: "Missed Sessions",
    value: 2,
    sub: "required attention",
    icon: AlertTriangle,
    accent: "#f87171",
    accentBg: "rgba(248,113,113,0.10)",
    trend: "–1 vs last week",
    trendUp: true,
    alert: true,
  },
  {
    label: "Devices Deployed",
    value: 8,
    sub: "currently enrolled",
    icon: Cpu,
    accent: "#34d399",
    accentBg: "rgba(52,211,153,0.10)",
    trend: "All online",
    trendUp: true,
  },
];

const triagePatients: Patient[] = [
  { id: "1", name: "P.B. Silva",          code: "P002", adherence: 45, urgency: "critical", trend: "down",   lastSession: "3 days ago" },
  { id: "2", name: "Anura Dissanayake",   code: "P005", adherence: 65, urgency: "warning",  trend: "stable", lastSession: "Yesterday"  },
  { id: "3", name: "Malini Perera",       code: "P009", adherence: 65, urgency: "warning",  trend: "down",   lastSession: "2 days ago" },
];

const sessionData: SessionSnapshot[] = [
  {
    label: "Completed Sessions",
    sub: "Successfully finished",
    count: 12,
    color: "#10b981",
    bg: "rgba(16,185,129,0.07)",
    border: "rgba(16,185,129,0.20)",
    icon: <CheckCircle2 size={18} />,
  },
  {
    label: "Missed Sessions",
    sub: "Requires follow-up",
    count: 3,
    color: "#f87171",
    bg: "rgba(248,113,113,0.07)",
    border: "rgba(248,113,113,0.20)",
    icon: <XCircle size={18} />,
  },
  {
    label: "Upcoming Sessions",
    sub: "Scheduled for today",
    count: 5,
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.07)",
    border: "rgba(96,165,250,0.20)",
    icon: <CalendarClock size={18} />,
  },
];

const aiInsight = `Grip strength improved by an average of 5% across your patient cohort this week. Patients using AI Companion showed 12% higher adherence rates compared to standard therapy. Three patients require attention due to declining adherence patterns — early intervention is recommended.`;

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ target, suffix = "", delay = 0 }: { target: number; suffix?: string; delay?: number }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      started.current = true;
      let start: number | null = null;
      const dur = 1200;
      const raf = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(eased * target));
        if (p < 1) requestAnimationFrame(raf);
        else setVal(target);
      };
      requestAnimationFrame(raf);
    }, delay);
    return () => clearTimeout(timer);
  }, [target, delay]);

  return <>{val}{suffix}</>;
}

// ─── Urgency Dot ─────────────────────────────────────────────────────────────
const urgencyConfig = {
  critical: { color: "#f87171", label: "Critical",  shadow: "0 0 10px rgba(248,113,113,0.6)" },
  warning:  { color: "#fbbf24", label: "Warning",   shadow: "0 0 10px rgba(251,191,36,0.6)"  },
  mild:     { color: "#34d399", label: "Mild",      shadow: "0 0 10px rgba(52,211,153,0.6)"  },
};

// ─── Adherence Bar ────────────────────────────────────────────────────────────
function AdherenceBar({ value, color }: { value: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 300);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div style={{ height: 4, background: "rgba(0,0,0,0.06)", borderRadius: 99, overflow: "hidden", flex: 1 }}>
      <div style={{
        height: "100%", borderRadius: 99,
        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
        width: `${width}%`,
        transition: "width 1.2s cubic-bezier(0.22,1,0.36,1)",
        boxShadow: `0 0 8px ${color}80`,
      }} />
    </div>
  );
}

// ─── Typewriter ────────────────────────────────────────────────────────────────
function Typewriter({ text, delay = 600 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const iv = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(iv);
    }, 18);
    return () => clearInterval(iv);
  }, [started, text]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span style={{ display: "inline-block", width: 2, height: "1em", background: "#2DD4BF",
          verticalAlign: "text-bottom", marginLeft: 2, animation: "cursorBlink 0.8s step-end infinite" }} />
      )}
    </span>
  );
}

// ─── Session Bar ──────────────────────────────────────────────────────────────
function SessionBar({ count, max, color, delay }: { count: number; max: number; color: string; delay: number }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW((count / max) * 100), delay);
    return () => clearTimeout(t);
  }, [count, max, delay]);
  return (
    <div style={{ height: 6, background: "rgba(0,0,0,0.06)", borderRadius: 99, overflow: "hidden", marginTop: 12 }}>
      <div style={{
        height: "100%", borderRadius: 99, width: `${w}%`,
        background: `linear-gradient(90deg, ${color}, ${color}88)`,
        transition: `width 1.1s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        boxShadow: `0 0 8px ${color}60`,
      }} />
    </div>
  );
}

// ─── CSS ───────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  .doc-dash * { font-family: 'Bricolage Grotesque', system-ui, sans-serif; box-sizing: border-box; }
  .doc-dash .mono { font-family: 'JetBrains Mono', monospace; }

  @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }

  @keyframes docFadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes docFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes kpiPop {
    0%   { opacity: 0; transform: translateY(20px) scale(0.96); }
    100% { opacity: 1; transform: translateY(0)    scale(1); }
  }
  @keyframes shimmerSlide {
    0%   { transform: translateX(-200%) skewX(-15deg); }
    100% { transform: translateX(400%)  skewX(-15deg); }
  }
  @keyframes pulseDot {
    0%,100% { box-shadow: var(--dot-shadow); transform: scale(1); }
    50%     { box-shadow: var(--dot-shadow), 0 0 0 5px var(--dot-color-faint); transform: scale(1.1); }
  }
  @keyframes scanLine {
    0%   { top: -2%; opacity: 0; }
    5%   { opacity: 1; }
    95%  { opacity: 0.6; }
    100% { top: 105%; opacity: 0; }
  }
  @keyframes aiGlow {
    0%,100% { opacity: 0.5; transform: scale(1); }
    50%     { opacity: 1;   transform: scale(1.06); }
  }
  @keyframes float {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-6px); }
  }
  @keyframes borderTrace {
    0%   { background-position: 0% 0%; }
    100% { background-position: 200% 0%; }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .kpi-card { animation: kpiPop 0.6s cubic-bezier(0.22,1,0.36,1) both; }
  .kpi-card:hover { transform: translateY(-4px) !important; box-shadow: 0 20px 60px rgba(0,0,0,0.10) !important; }
  .kpi-card { transition: transform 0.35s ease, box-shadow 0.35s ease; }

  .triage-row { transition: all 0.25s ease; }
  .triage-row:hover { transform: translateX(4px); background: rgba(45,212,191,0.05) !important; }

  .session-card { transition: all 0.3s ease; }
  .session-card:hover { transform: scale(1.02); }

  .shimmer-btn::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
    animation: shimmerSlide 2.2s ease-in-out infinite;
  }

  .ai-card-glow { animation: aiGlow 4s ease-in-out infinite; }

  .doc-header { animation: docFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both; }
  .section-fade { animation: docFadeUp 0.65s cubic-bezier(0.22,1,0.36,1) both; }

  .view-btn { transition: all 0.22s ease; }
  .view-btn:hover { background: rgba(45,212,191,0.12) !important; color: #2DD4BF !important; }
`;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const maxSession = Math.max(...sessionData.map(s => s.count));

  return (
    <div className="doc-dash" style={{ minHeight: "100vh", background: "#F0F4F8", paddingBottom: 48 }}>
      <style>{STYLES}</style>

      {/* ── Background Ambience ────────────────────────────────────────── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-10%", left: "10%",
          width: 900, height: 900,
          background: "radial-gradient(circle, rgba(45,212,191,0.055) 0%, transparent 65%)",
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute", bottom: "-15%", right: "-5%",
          width: 700, height: 700,
          background: "radial-gradient(circle, rgba(99,102,241,0.045) 0%, transparent 65%)",
          borderRadius: "50%",
        }} />
        {/* Subtle grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(11,30,51,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(11,30,51,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />
      </div>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 28px", position: "relative", zIndex: 1 }}>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 1 · WELCOME HEADER
        ════════════════════════════════════════════════════════════════ */}
        <div className="doc-header" style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "linear-gradient(135deg, #0B1E33 0%, #0d2640 60%, #0f3352 100%)",
          borderRadius: 24, padding: "24px 32px", marginBottom: 28,
          boxShadow: "0 4px 40px rgba(11,30,51,0.18), inset 0 1px 0 rgba(255,255,255,0.06)",
          position: "relative", overflow: "hidden",
        }}>
          {/* Teal accent strip */}
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
            background: "linear-gradient(to bottom, #2DD4BF, #0891b2)",
            borderRadius: "24px 0 0 24px",
          }} />
          {/* Decorative bg element */}
          <div style={{
            position: "absolute", right: -60, top: -60,
            width: 260, height: 260,
            background: "radial-gradient(circle, rgba(45,212,191,0.07) 0%, transparent 70%)",
            borderRadius: "50%",
            animation: "aiGlow 5s ease-in-out infinite",
          }} />
          {/* Scanline */}
          <div style={{
            position: "absolute", left: 0, right: 0, height: "18%",
            background: "linear-gradient(to bottom, transparent, rgba(45,212,191,0.04), transparent)",
            animation: "scanLine 5s linear infinite",
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: 18, position: "relative", zIndex: 2 }}>
            {/* Avatar */}
            <div style={{
              width: 54, height: 54, borderRadius: 16,
              background: "linear-gradient(135deg, #2DD4BF 0%, #0891b2 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 0 3px rgba(45,212,191,0.25), 0 8px 24px rgba(45,212,191,0.30)",
              animation: "float 4s ease-in-out infinite",
            }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#0B1E33", letterSpacing: "-0.02em" }}>
                DS
              </span>
            </div>
            <div>
              <p className="mono" style={{ fontSize: 10, color: "rgba(45,212,191,0.6)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 4 }}>
                NEURO-REHABILITATION PLATFORM
              </p>
              <h1 style={{ fontSize: "clamp(1.4rem,2.5vw,1.85rem)", fontWeight: 800, color: "#fff", lineHeight: 1.1, margin: 0 }}>
                Welcome Back, <span style={{ color: "#2DD4BF" }}>{doctor.name}</span>
              </h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.40)", marginTop: 4 }}>
                Here's what's happening with your patients today
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 2 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(45,212,191,0.10)", border: "1px solid rgba(45,212,191,0.20)",
              borderRadius: 12, padding: "8px 14px",
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#2DD4BF", boxShadow: "0 0 8px #2DD4BF" }} />
              <span className="mono" style={{ fontSize: 11, color: "#2DD4BF", fontWeight: 600, letterSpacing: "0.06em" }}>
                SYSTEM ONLINE
              </span>
            </div>
            <div className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.06em" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 2 · KPI CARDS
        ════════════════════════════════════════════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 28 }}>
          {kpis.map((kpi, i) => (
            <div key={kpi.label} className="kpi-card" style={{
              animationDelay: `${i * 0.08 + 0.15}s`,
              background: "#fff",
              borderRadius: 20,
              padding: "22px 24px",
              border: "1px solid rgba(226,232,240,0.8)",
              boxShadow: "0 2px 16px rgba(11,30,51,0.06)",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Alert indicator */}
              {kpi.alert && (
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: "linear-gradient(90deg, #f87171, #fbbf24)",
                  borderRadius: "20px 20px 0 0",
                }} />
              )}
              {/* Accent stripe top right */}
              <div style={{
                position: "absolute", top: kpi.alert ? 3 : 0, right: 0,
                width: 80, height: 80,
                background: `radial-gradient(circle at top right, ${kpi.accent}18 0%, transparent 65%)`,
              }} />

              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 13,
                  background: kpi.accentBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: kpi.accent,
                }}>
                  <kpi.icon size={20} />
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 4,
                  background: kpi.trendUp ? "rgba(16,185,129,0.08)" : "rgba(248,113,113,0.08)",
                  color: kpi.trendUp ? "#10b981" : "#f87171",
                  borderRadius: 8, padding: "3px 8px",
                }}>
                  {kpi.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  <span className="mono" style={{ fontSize: 10, fontWeight: 600 }}>{kpi.trend}</span>
                </div>
              </div>

              <div style={{ fontSize: "clamp(2rem,3vw,2.6rem)", fontWeight: 800, color: "#0B1E33", lineHeight: 1, marginBottom: 4 }}>
                <AnimatedNumber target={kpi.value} suffix={kpi.suffix || ""} delay={i * 80 + 200} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0B1E33", marginBottom: 3 }}>{kpi.label}</div>
              <div className="mono" style={{ fontSize: 10, color: "#94a3b8", letterSpacing: "0.04em" }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 3 · TWO-COLUMN MAIN
        ════════════════════════════════════════════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, marginBottom: 28 }}>

          {/* ── LEFT: Patient Triage ──────────────────────────────────────── */}
          <div className="section-fade" style={{
            animationDelay: "0.38s",
            background: "#fff",
            borderRadius: 24, padding: "28px",
            border: "1px solid rgba(226,232,240,0.8)",
            boxShadow: "0 2px 20px rgba(11,30,51,0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: "rgba(248,113,113,0.10)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#f87171",
                  }}>
                    <AlertTriangle size={17} />
                  </div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0B1E33", margin: 0 }}>Patient Triage</h2>
                </div>
                <p className="mono" style={{ fontSize: 9.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.14em", marginTop: 6, marginLeft: 44 }}>
                  Patients Requiring Immediate Attention
                </p>
              </div>
              <Link href="/doctor/patients" style={{
                display: "flex", alignItems: "center", gap: 5,
                fontSize: 11, fontWeight: 700, color: "#2DD4BF",
                textDecoration: "none", transition: "gap 0.2s ease",
              }}>
                View All <ChevronRight size={14} />
              </Link>
            </div>

            {/* Column headers */}
            <div className="mono" style={{
              display: "grid", gridTemplateColumns: "1fr auto auto",
              fontSize: 9, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.14em",
              marginBottom: 12, padding: "0 14px",
            }}>
              <span>Patient</span>
              <span style={{ marginRight: 70 }}>Adherence</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {triagePatients.map((p, i) => {
                const uc = urgencyConfig[p.urgency];
                const barColor = p.urgency === "critical" ? "#f87171" : p.urgency === "warning" ? "#fbbf24" : "#34d399";
                return (
                  <div key={p.id} className="triage-row" style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: "rgba(248,250,252,0.8)",
                    border: "1px solid rgba(226,232,240,0.6)",
                    borderRadius: 16, padding: "14px 16px",
                    cursor: "default",
                    animationDelay: `${0.4 + i * 0.1}s`,
                    animation: "kpiPop 0.5s cubic-bezier(0.22,1,0.36,1) both",
                  }}>
                    {/* Urgency Dot */}
                    <div style={{
                      width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                      background: uc.color,
                      boxShadow: uc.shadow,
                      animation: p.urgency === "critical" ? "pulseDot 2s ease-in-out infinite" : undefined,
                      ["--dot-shadow" as string]: uc.shadow,
                      ["--dot-color-faint" as string]: `${uc.color}30`,
                    }} />

                    {/* Patient info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0B1E33", whiteSpace: "nowrap" }}>{p.name}</span>
                        <span className="mono" style={{ fontSize: 9, color: "#94a3b8", background: "#f1f5f9", padding: "1px 7px", borderRadius: 6, letterSpacing: "0.06em" }}>{p.code}</span>
                        {p.trend === "down" && (
                          <div style={{ display: "flex", alignItems: "center", gap: 2, color: "#f87171" }}>
                            <ArrowDownRight size={11} />
                            <span className="mono" style={{ fontSize: 9 }}>declining</span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <AdherenceBar value={p.adherence} color={barColor} />
                        <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: barColor, flexShrink: 0 }}>
                          {p.adherence}%
                        </span>
                      </div>
                      <div className="mono" style={{ fontSize: 9, color: "#94a3b8", marginTop: 4 }}>Last: {p.lastSession}</div>
                    </div>

                    {/* View Profile */}
                    <Link href={`/doctor/patients/${p.id}`} className="view-btn shimmer-btn" style={{
                      position: "relative", overflow: "hidden",
                      fontSize: 11, fontWeight: 700,
                      color: "#475569", background: "#f1f5f9",
                      border: "1px solid rgba(226,232,240,0.8)",
                      borderRadius: 10, padding: "7px 13px",
                      textDecoration: "none", whiteSpace: "nowrap",
                      display: "flex", alignItems: "center", gap: 5,
                    }}>
                      <Eye size={12} /> View
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT: Today's Sessions Snapshot ──────────────────────────── */}
          <div className="section-fade" style={{
            animationDelay: "0.46s",
            background: "#0B1E33",
            borderRadius: 24, padding: "28px",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 2px 30px rgba(11,30,51,0.18)",
            position: "relative", overflow: "hidden",
          }}>
            {/* Decorative background */}
            <div style={{
              position: "absolute", top: -80, right: -80,
              width: 260, height: 260,
              background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 70%)",
              borderRadius: "50%",
            }} />
            <div style={{
              position: "absolute", left: 0, right: 0, height: "14%",
              background: "linear-gradient(to bottom, transparent, rgba(45,212,191,0.025), transparent)",
              animation: "scanLine 4.5s linear infinite",
            }} />

            <div style={{ position: "relative", zIndex: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: "rgba(45,212,191,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#2DD4BF",
                }}>
                  <Activity size={17} />
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: 0 }}>
                  Today's Sessions
                </h2>
              </div>
              <p className="mono" style={{ fontSize: 9.5, color: "rgba(255,255,255,0.30)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 26, marginLeft: 44 }}>
                Overview of Therapy Sessions
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sessionData.map((s, i) => (
                  <div key={s.label} className="session-card" style={{
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    borderRadius: 18, padding: "18px 20px",
                    position: "relative", overflow: "hidden",
                    animationDelay: `${0.5 + i * 0.12}s`,
                    animation: "kpiPop 0.55s cubic-bezier(0.22,1,0.36,1) both",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ color: s.color, opacity: 0.85 }}>{s.icon}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{s.label}</div>
                          <div className="mono" style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.10em", marginTop: 3 }}>{s.sub}</div>
                        </div>
                      </div>
                      <div style={{
                        fontSize: "2rem", fontWeight: 800, color: s.color,
                        lineHeight: 1, letterSpacing: "-0.03em",
                        textShadow: `0 0 20px ${s.color}60`,
                      }}>
                        <AnimatedNumber target={s.count} delay={600 + i * 120} />
                      </div>
                    </div>
                    <SessionBar count={s.count} max={maxSession} color={s.color} delay={700 + i * 120} />
                  </div>
                ))}
              </div>

              {/* Total row */}
              <div style={{
                marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.07)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.30)", textTransform: "uppercase", letterSpacing: "0.14em" }}>Total Today</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#2DD4BF", letterSpacing: "-0.03em" }}>
                  <AnimatedNumber target={sessionData.reduce((a, s) => a + s.count, 0)} delay={900} />
                  <span className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", fontWeight: 400, marginLeft: 4 }}>sessions</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 4 · AI WEEKLY SUMMARY
        ════════════════════════════════════════════════════════════════ */}
        <div className="section-fade" style={{
          animationDelay: "0.58s",
          background: "linear-gradient(135deg, #0B1E33 0%, #0d2844 50%, #0a1e3a 100%)",
          borderRadius: 24, padding: "32px 36px",
          border: "1px solid rgba(45,212,191,0.12)",
          boxShadow: "0 4px 40px rgba(11,30,51,0.14)",
          position: "relative", overflow: "hidden",
        }}>
          {/* Glow blobs */}
          <div className="ai-card-glow" style={{
            position: "absolute", top: -80, left: "30%",
            width: 400, height: 300,
            background: "radial-gradient(ellipse, rgba(45,212,191,0.07) 0%, transparent 70%)",
            borderRadius: "50%",
          }} />
          <div style={{
            position: "absolute", bottom: -60, right: "10%",
            width: 280, height: 200,
            background: "radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)",
            borderRadius: "50%",
          }} />
          <div style={{
            position: "absolute", left: 0, right: 0, height: "12%",
            background: "linear-gradient(to bottom, transparent, rgba(45,212,191,0.03), transparent)",
            animation: "scanLine 6s linear infinite",
          }} />

          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 14,
                  background: "linear-gradient(135deg, rgba(45,212,191,0.20), rgba(45,212,191,0.08))",
                  border: "1px solid rgba(45,212,191,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#2DD4BF",
                  boxShadow: "0 0 20px rgba(45,212,191,0.15)",
                }}>
                  <BrainCircuit size={22} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: 0 }}>AI Weekly Summary</h2>
                    <div style={{
                      background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.22)",
                      borderRadius: 8, padding: "2px 9px",
                      display: "flex", alignItems: "center", gap: 5,
                    }}>
                      <Sparkles size={10} color="#2DD4BF" />
                      <span className="mono" style={{ fontSize: 9, color: "#2DD4BF", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em" }}>AI Generated</span>
                    </div>
                  </div>
                  <p className="mono" style={{ fontSize: 9.5, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.14em", marginTop: 4 }}>
                    Insights from Your Patient Cohort
                  </p>
                </div>
              </div>

              <button style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.20)",
                borderRadius: 12, padding: "8px 16px", cursor: "pointer",
                color: "#2DD4BF", fontSize: 12, fontWeight: 700,
                transition: "all 0.2s ease",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(45,212,191,0.16)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(45,212,191,0.08)"; }}
              >
                Full Analysis <ArrowUpRight size={13} />
              </button>
            </div>

            {/* Insight box */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 18, padding: "22px 26px",
              position: "relative",
            }}>
              {/* Left accent */}
              <div style={{
                position: "absolute", left: 0, top: 16, bottom: 16, width: 3,
                background: "linear-gradient(to bottom, #2DD4BF, #0891b2)",
                borderRadius: "0 3px 3px 0",
              }} />
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  <Wifi size={15} color="#2DD4BF" style={{ opacity: 0.7 }} />
                </div>
                <div>
                  <span className="mono" style={{ fontSize: 10, color: "#2DD4BF", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", marginRight: 10 }}>
                    Key Insights ·
                  </span>
                  <span style={{ fontSize: 13.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.75, fontWeight: 400 }}>
                    <Typewriter text={aiInsight} delay={900} />
                  </span>
                </div>
              </div>
            </div>

            {/* Metric pills row */}
            <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
              {[
                { label: "Avg Grip Improvement",  value: "+5%",    color: "#2DD4BF" },
                { label: "AI Companion Adherence", value: "+12%",   color: "#34d399" },
                { label: "Attention Required",      value: "3 pts",  color: "#fbbf24" },
                { label: "Data Points Analyzed",    value: "1,284",  color: "#6366f1" },
              ].map((m, i) => (
                <div key={m.label} style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12, padding: "10px 16px",
                  display: "flex", alignItems: "center", gap: 10,
                  animation: "kpiPop 0.5s cubic-bezier(0.22,1,0.36,1) both",
                  animationDelay: `${0.7 + i * 0.1}s`,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, boxShadow: `0 0 6px ${m.color}` }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", fontWeight: 500 }}>{m.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: m.color, letterSpacing: "-0.02em" }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}