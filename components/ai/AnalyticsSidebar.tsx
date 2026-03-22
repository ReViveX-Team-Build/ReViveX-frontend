"use client";
// components/ai/AnalyticsSidebar.tsx

import { useState } from "react";
import {
    TrendingUp, TrendingDown, Minus,
    Activity, Brain, Zap, Target,
    RefreshCw, ChevronDown, ChevronUp,
    Loader2, AlertCircle,
} from "lucide-react";
import { useAnalytics } from "@/app/lib/hooks/useAnalytics";
import { useDarkMode } from "@/app/lib/hooks/useDarkMode";

interface Props {
    uid: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({
                      label, value, unit, trend, trendPct, icon: Icon, color, isDark,
                  }: {
    label: string;
    value: number | string;
    unit?: string;
    trend?: "up" | "down" | "neutral";
    trendPct?: number | null; // ← week-over-week % shown as badge
    icon: React.ElementType;
    color: string;
    isDark: boolean;
}) {
    const TrendIcon  = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
    const trendColor = trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-400" : "text-gray-400";

    return (
        <div className={`rounded-xl p-3 flex items-center gap-3 border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-xs truncate ${isDark ? "text-slate-400" : "text-gray-400"}`}>{label}</p>
                <p className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-[#0A2E4C]"}`}>
                    {value}
                    <span className={`text-xs font-normal ml-0.5 ${isDark ? "text-slate-500" : "text-gray-400"}`}>{unit}</span>
                </p>
                {/* ── Week-over-week badge ── */}
                {trendPct !== null && trendPct !== undefined && (
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold mt-0.5 px-1.5 py-0.5 rounded-full ${
                        trendPct > 0
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : trendPct < 0
                                ? "bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-slate-400"
                    }`}>
            {trendPct > 0 ? "↑" : trendPct < 0 ? "↓" : "→"}
                        {Math.abs(trendPct)}% vs last week
          </span>
                )}
            </div>
            {trend && !trendPct && <TrendIcon className={`h-3.5 w-3.5 flex-shrink-0 ${trendColor}`} />}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// GRIP CHART
// ─────────────────────────────────────────────────────────────────────────────
function GripChart({ data, isDark }: { data: { date: string; grip: number }[]; isDark: boolean }) {
    if (!data.length) return null;

    const max    = Math.max(...data.map((d) => d.grip), 1);
    const width  = 260;
    const height = 70;
    const pad    = 4;

    const points = data.map((d, i) => {
        const x = pad + (i / Math.max(data.length - 1, 1)) * (width - pad * 2);
        const y = height - pad - ((d.grip / max) * (height - pad * 2));
        return `${x},${y}`;
    });

    const polyline = points.join(" ");
    const first    = points[0];
    const last     = points[points.length - 1];
    const area     = `${first} ${polyline} ${last.split(",")[0]},${height - pad} ${pad},${height - pad}`;

    return (
        <div className={`rounded-xl p-3 border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}>
            <div className="flex items-center justify-between mb-2">
                <p className={`text-xs font-semibold ${isDark ? "text-slate-100" : "text-[#0A2E4C]"}`}>30-Day Grip Trend</p>
                <p className={`text-xs ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                    {data.length} {data.length === 1 ? "session" : "sessions"}
                </p>
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 70 }}>
                <polygon points={area} fill="rgba(45,212,191,0.08)" />
                <polyline points={polyline} fill="none" stroke="#2DD4BF" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {points.length > 0 && (() => {
                    const [lx, ly] = points[points.length - 1].split(",").map(Number);
                    return <circle cx={lx} cy={ly} r="3" fill="#2DD4BF" />;
                })()}
            </svg>
            <div className="flex justify-between mt-1">
                <p className={`text-xs ${isDark ? "text-slate-600" : "text-gray-300"}`}>{data[0]?.date}</p>
                <p className={`text-xs ${isDark ? "text-slate-600" : "text-gray-300"}`}>{data[data.length - 1]?.date}</p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// BILATERAL BAR
// ─────────────────────────────────────────────────────────────────────────────
function BilateralBar({ right, left, symmetry, isDark }: {
    right: number; left: number; symmetry: number; isDark: boolean;
}) {
    const max      = Math.max(right, left, 1);
    const rightPct = Math.round((right / max) * 100);
    const leftPct  = Math.round((left  / max) * 100);

    return (
        <div className={`rounded-xl p-3 border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}>
            <p className={`text-xs font-semibold mb-2 ${isDark ? "text-slate-100" : "text-[#0A2E4C]"}`}>Bilateral Balance</p>
            <div className="space-y-2">
                <div>
                    <div className={`flex justify-between text-xs mb-1 ${isDark ? "text-slate-400" : "text-gray-400"}`}>
                        <span>Right (affected)</span><span>{right} kPa</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-gray-100"}`}>
                        <div className="h-full bg-[#2DD4BF] rounded-full transition-all" style={{ width: `${rightPct}%` }} />
                    </div>
                </div>
                <div>
                    <div className={`flex justify-between text-xs mb-1 ${isDark ? "text-slate-400" : "text-gray-400"}`}>
                        <span>Left (healthy)</span><span>{left} kPa</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-gray-100"}`}>
                        <div className="h-full bg-teal-200 rounded-full transition-all" style={{ width: `${leftPct}%` }} />
                    </div>
                </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-400"}`}>Symmetry ratio</p>
                <span className={`text-xs font-bold ${symmetry >= 80 ? "text-emerald-500" : symmetry >= 60 ? "text-amber-500" : "text-red-400"}`}>
          {symmetry}%
        </span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI REPORT CARD
// ─────────────────────────────────────────────────────────────────────────────
function AIReportCard({ uid, type, title, icon: Icon, isDark }: {
    uid: string;
    type: "weekly_report" | "recovery_prediction";
    title: string;
    icon: React.ElementType;
    isDark: boolean;
}) {
    const [text, setText]         = useState<string | null>(null);
    const [loading, setLoading]   = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [error, setError]       = useState<string | null>(null);

    const generate = async () => {
        setLoading(true);
        setError(null);
        try {
            const res  = await fetch("/api/llm/patient/analytics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid, type }),
            });
            const data = await res.json();
            if (data.text) {
                setText(data.text);
                setExpanded(true);
            } else {
                setError("Failed to generate report");
            }
        } catch {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`rounded-xl p-3 border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-[#2DD4BF]" />
                    <p className={`text-xs font-semibold ${isDark ? "text-slate-100" : "text-[#0A2E4C]"}`}>{title}</p>
                </div>
                <div className="flex items-center gap-1">
                    {text && (
                        <button onClick={() => setExpanded((e) => !e)} className={`p-1 rounded transition ${isDark ? "hover:bg-slate-700" : "hover:bg-gray-50"}`}>
                            {expanded
                                ? <ChevronUp className={`h-3 w-3 ${isDark ? "text-slate-400" : "text-gray-400"}`} />
                                : <ChevronDown className={`h-3 w-3 ${isDark ? "text-slate-400" : "text-gray-400"}`} />}
                        </button>
                    )}
                    <button onClick={generate} disabled={loading} className={`p-1 rounded transition disabled:opacity-50 ${isDark ? "hover:bg-slate-700" : "hover:bg-gray-50"}`}>
                        {loading
                            ? <Loader2 className="h-3 w-3 text-[#2DD4BF] animate-spin" />
                            : <RefreshCw className={`h-3 w-3 ${isDark ? "text-slate-400" : "text-gray-400"}`} />}
                    </button>
                </div>
            </div>

            {!text && !loading && !error && (
                <button onClick={generate} className={`w-full py-2 rounded-lg border border-dashed border-[#2DD4BF]/40 text-[#2DD4BF] text-xs transition ${isDark ? "hover:bg-teal-950/30" : "hover:bg-teal-50"}`}>
                    Generate {title}
                </button>
            )}

            {loading && (
                <div className="flex items-center gap-2 py-2">
                    <Loader2 className="h-3.5 w-3.5 text-[#2DD4BF] animate-spin" />
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-400"}`}>Analysing your data…</p>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 py-2">
                    <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                    <p className="text-xs text-red-400">{error}</p>
                </div>
            )}

            {text && expanded && (
                <p className={`text-xs leading-relaxed mt-1 whitespace-pre-line ${isDark ? "text-slate-300" : "text-gray-600"}`}>
                    {text}
                </p>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function AnalyticsSidebar({ uid }: Props) {
    const { data, loading, error } = useAnalytics(uid);
    const isDark = useDarkMode();

    if (loading) {
        return (
            <div className={`border shadow-sm rounded-2xl p-5 flex items-center justify-center gap-2 min-h-[200px] ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-gray-100"}`}>
                <Loader2 className="h-5 w-5 text-[#2DD4BF] animate-spin" />
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-400"}`}>Loading analytics…</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className={`border shadow-sm rounded-2xl p-5 ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-gray-100"}`}>
                <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-xs">Failed to load analytics data</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`border shadow-sm rounded-2xl p-4 space-y-3 ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-gray-100"}`}>

            {/* Header */}
            <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#2DD4BF]" />
                <h3 className={`font-semibold text-sm ${isDark ? "text-slate-100" : "text-[#0A2E4C]"}`}>Advanced Analytics</h3>
            </div>

            {/* Stat cards — 2 column grid */}
            <div className="grid grid-cols-2 gap-2">
                {/* Avg Grip — shows week-over-week trend badge */}
                <StatCard
                    label="Avg Grip"
                    value={data.avgGrip}
                    unit=" kPa"
                    trend={data.gripImprovementPct > 0 ? "up" : data.gripImprovementPct < 0 ? "down" : "neutral"}
                    trendPct={data.weekOverWeekGripPct}
                    icon={Activity}
                    color="bg-[#2DD4BF]"
                    isDark={isDark}
                />
                <StatCard
                    label="Peak Grip"
                    value={data.peakGrip}
                    unit=" kPa"
                    icon={Zap}
                    color="bg-teal-400"
                    isDark={isDark}
                />
                <StatCard
                    label="Adherence"
                    value={data.adherencePct}
                    unit="%"
                    trend={data.adherencePct >= 80 ? "up" : data.adherencePct >= 50 ? "neutral" : "down"}
                    icon={Target}
                    color={data.adherencePct >= 80 ? "bg-emerald-400" : data.adherencePct >= 50 ? "bg-amber-400" : "bg-red-400"}
                    isDark={isDark}
                />
                <StatCard
                    label="Cognitive"
                    value={data.avgCognitiveAccuracy}
                    unit="%"
                    trend={data.avgCognitiveAccuracy >= 75 ? "up" : "neutral"}
                    icon={Brain}
                    color="bg-violet-400"
                    isDark={isDark}
                />
            </div>

            {/* 30-day grip chart */}
            <GripChart data={data.gripTrend} isDark={isDark} />

            {/* Bilateral balance */}
            <BilateralBar right={data.rightHandAvg} left={data.leftHandAvg} symmetry={data.symmetryRatio} isDark={isDark} />

            {/* AI Reports */}
            <AIReportCard uid={uid} type="weekly_report"       title="Weekly AI Report"    icon={TrendingUp} isDark={isDark} />
            <AIReportCard uid={uid} type="recovery_prediction" title="Recovery Prediction" icon={Target}     isDark={isDark} />

            {/* 30-day improvement badge */}
            {data.gripImprovementPct !== 0 && (
                <div className={`rounded-xl p-3 flex items-center gap-2 ${
                    data.gripImprovementPct > 0
                        ? isDark ? "bg-emerald-950/30 border border-emerald-800/40" : "bg-emerald-50 border border-emerald-100"
                        : isDark ? "bg-red-950/30 border border-red-800/40"         : "bg-red-50 border border-red-100"
                }`}>
                    {data.gripImprovementPct > 0
                        ? <TrendingUp className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        : <TrendingDown className="h-4 w-4 text-red-400 flex-shrink-0" />}
                    <p className={`text-xs ${isDark ? "text-slate-300" : "text-gray-600"}`}>
            <span className={`font-bold ${data.gripImprovementPct > 0 ? "text-emerald-500" : "text-red-500"}`}>
              {data.gripImprovementPct > 0 ? "+" : ""}{data.gripImprovementPct}%
            </span>{" "}
                        grip improvement over 30 days
                    </p>
                </div>
            )}
        </div>
    );
}