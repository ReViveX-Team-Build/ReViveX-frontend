"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/lib/firebase";
import { getDoctorReportMetrics, DoctorReportMetrics } from "@/app/lib/db/schedule";
import { 
  Activity, 
  Brain, 
  Clock, 
  Gauge, 
  Target, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Zap,
  Loader2,
  BarChart3,
  Users,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';

// Custom Chart Tooltip
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ 
      background: '#0B1E33', 
      border: '1px solid rgba(45,212,191,0.25)', 
      borderRadius: 12, 
      padding: '10px 16px', 
      boxShadow: '0 8px 28px rgba(11,30,51,0.35)' 
    }}>
      <p style={{ 
        fontFamily: "'JetBrains Mono',monospace", 
        fontSize: 9, 
        color: 'rgba(45,212,191,0.60)', 
        textTransform: 'uppercase', 
        letterSpacing: '0.18em', 
        marginBottom: 7 
      }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          marginBottom: 4 
        }}>
          <div style={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            background: p.color 
          }} />
          <span style={{ 
            fontFamily: "'Plus Jakarta Sans',sans-serif", 
            fontSize: 12, 
            fontWeight: 700, 
            color: '#fff' 
          }}>
            {p.name}
          </span>
          <span style={{ 
            fontFamily: "'JetBrains Mono',monospace", 
            fontSize: 13, 
            fontWeight: 700, 
            color: p.color, 
            marginLeft: 'auto' 
          }}>
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Animated counter hook
function useCounter(target: number, duration = 1400, delay = 0, decimals = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t0 = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setVal(parseFloat((ease * target).toFixed(decimals)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t0);
  }, [target, duration, delay, decimals]);
  return val;
}

// Circular Progress Ring
function RingProgress({ pct, size = 88, stroke = 7, color = '#2DD4BF', delay = 0 }: {
  pct: number; size?: number; stroke?: number; color?: string; delay?: number;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  const offset = circ - (animated ? (pct / 100) * circ : circ);

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(226,232,240,0.8)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{
          strokeDashoffset: offset,
          transition: animated ? `stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1) ${delay * 0.001}s` : 'none',
          filter: `drop-shadow(0 0 5px ${color}66)`,
        }}
      />
      {animated && (
        <circle
          cx={size / 2 + r * Math.cos((2 * Math.PI * pct / 100) - Math.PI / 2)}
          cy={size / 2 + r * Math.sin((2 * Math.PI * pct / 100) - Math.PI / 2)}
          r={stroke / 2 + 1}
          fill={color}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      )}
    </svg>
  );
}

export default function DoctorReportsPage() {
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);
  const [metrics, setMetrics] = useState<DoctorReportMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<'strength' | 'accuracy'>('strength');

  useEffect(() => {
    const load = async () => {
      if (authLoading) return;
      
      if (!user) {
        setLoading(false);
        router.push("/auth/doctor/signin");
        return;
      }

      try {
        setError(null);
        const data = await getDoctorReportMetrics(user.uid);
        setMetrics(data);
      } catch (e) {
        console.error("Failed to load report metrics:", e);
        setError("Could not load report metrics. Please retry.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user, authLoading, router]);

  // Animated counters
  const adherence = useCounter(metrics?.adherenceRate || 0, 1600, 300);
  const gripStrength = useCounter(metrics?.averagePeakGripStrength || 0, 1400, 400, 1);
  const reactionTime = useCounter(metrics?.averageReactionTime || 0, 1200, 500, 0);
  const cognitiveAcc = useCounter(metrics?.averageCognitiveAccuracy || 0, 1400, 350, 1);

  // Mock chart data (replace with real data when available)
  const strengthData = [
    { day: 'Week 1', avg: 28 }, { day: 'Week 2', avg: 32 },
    { day: 'Week 3', avg: 36 }, { day: 'Week 4', avg: 42 },
  ];

  const accuracyData = [
    { day: 'Week 1', accuracy: 72 }, { day: 'Week 2', accuracy: 78 },
    { day: 'Week 3', accuracy: 82 }, { day: 'Week 4', accuracy: 85 },
  ];

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-teal-500 animate-spin" />
          <p className="text-slate-500">Loading report metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-800 font-semibold">Error Loading Reports</p>
          <p className="text-red-600 text-sm mt-2">{error || "No data available"}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4F8', paddingBottom: 72 }}>
      {/* Ambient Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '4%', width: 680, height: 680, background: 'radial-gradient(circle,rgba(45,212,191,0.052),transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-12%', left: '3%', width: 560, height: 560, background: 'radial-gradient(circle,rgba(99,102,241,0.042),transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(11,30,51,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(11,30,51,0.018) 1px,transparent 1px)', backgroundSize: '52px 52px' }} />
      </div>

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 24px', position: 'relative', zIndex: 1 }}>

        {/* Hero Header */}
        <div style={{
          background: '#0B1E33',
          borderRadius: 24,
          marginBottom: 24,
          overflow: 'hidden',
          position: 'relative',
          animation: 'fade-in 0.50s ease both',
        }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(45,212,191,0.038) 1px,transparent 1px),linear-gradient(90deg,rgba(45,212,191,0.038) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
          
          <div style={{ position: 'relative', zIndex: 2, padding: '28px 32px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <p style={{ 
                  fontFamily: "'JetBrains Mono',monospace", 
                  fontSize: 9, 
                  color: 'rgba(45,212,191,0.60)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.24em', 
                  marginBottom: 8, 
                  fontWeight: 600 
                }}>
                  ReViveX · Clinical Dashboard
                </p>
                <h1 style={{ 
                  fontSize: 'clamp(1.55rem,2.8vw,2.1rem)', 
                  fontWeight: 800, 
                  color: '#fff', 
                  margin: 0, 
                  lineHeight: 1.12 
                }}>
                  Reports & Analytics
                </h1>
                <p style={{ 
                  fontSize: 13.5, 
                  color: 'rgba(255,255,255,0.40)', 
                  marginTop: 6, 
                  fontWeight: 500 
                }}>
                  Comprehensive patient performance metrics and clinical outcomes
                </p>
              </div>

              <button
                onClick={() => window.print()}
                style={{
                  padding: '10px 18px',
                  borderRadius: 14,
                  background: 'linear-gradient(135deg,rgba(45,212,191,0.22),rgba(20,184,166,0.12))',
                  border: '1.5px solid rgba(45,212,191,0.30)',
                  color: '#2DD4BF',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <TrendingUp size={16} />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Hero Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: 14, 
          marginBottom: 22 
        }}>
          {/* Adherence Rate */}
          <div style={{
            padding: '24px 22px',
            borderRadius: 20,
            border: '1.5px solid rgba(226,232,240,0.85)',
            background: '#fff',
            position: 'relative',
            overflow: 'hidden',
            animation: 'fade-in 0.48s cubic-bezier(0.22,1,0.36,1) 0.08s both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <p style={{ 
                  fontFamily: "'JetBrains Mono',monospace", 
                  fontSize: 9, 
                  color: '#94a3b8', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.16em', 
                  marginBottom: 6, 
                  fontWeight: 700 
                }}>
                  Adherence Rate
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                  <span style={{ 
                    fontSize: 34, 
                    fontWeight: 900, 
                    color: '#0B1E33', 
                    lineHeight: 1, 
                    fontFamily: "'JetBrains Mono',monospace" 
                  }}>
                    {Math.round(adherence)}
                  </span>
                  <span style={{ 
                    fontFamily: "'JetBrains Mono',monospace", 
                    fontSize: 16, 
                    fontWeight: 700, 
                    color: '#2DD4BF' 
                  }}>
                    %
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 5, fontWeight: 500 }}>
                  Completed / Total
                </p>
              </div>
              <RingProgress pct={metrics.adherenceRate} size={72} stroke={6} color="#2DD4BF" delay={300} />
            </div>
          </div>

          {/* Completed Sessions */}
          <div style={{
            padding: '24px 22px',
            borderRadius: 20,
            border: '1.5px solid rgba(34,197,94,0.25)',
            background: '#fff',
            animation: 'fade-in 0.48s cubic-bezier(0.22,1,0.36,1) 0.14s both',
          }}>
            <p style={{ 
              fontFamily: "'JetBrains Mono',monospace", 
              fontSize: 9, 
              color: '#94a3b8', 
              textTransform: 'uppercase', 
              letterSpacing: '0.16em', 
              marginBottom: 10, 
              fontWeight: 700 
            }}>
              Completed Sessions
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                background: 'rgba(34,197,94,0.10)',
                border: '1.5px solid rgba(34,197,94,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <CheckCircle2 size={24} color="#22c55e" />
              </div>
              <div>
                <div style={{ fontSize: 34, fontWeight: 900, color: '#16a34a', lineHeight: 1, fontFamily: "'JetBrains Mono',monospace" }}>
                  {metrics.completedSessions}
                </div>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 3, fontWeight: 500 }}>
                  Successfully finished
                </p>
              </div>
            </div>
          </div>

          {/* Missed Sessions */}
          <div style={{
            padding: '24px 22px',
            borderRadius: 20,
            border: '1.5px solid rgba(245,158,11,0.25)',
            background: '#fff',
            animation: 'fade-in 0.48s cubic-bezier(0.22,1,0.36,1) 0.20s both',
          }}>
            <p style={{ 
              fontFamily: "'JetBrains Mono',monospace", 
              fontSize: 9, 
              color: '#94a3b8', 
              textTransform: 'uppercase', 
              letterSpacing: '0.16em', 
              marginBottom: 10, 
              fontWeight: 700 
            }}>
              Missed Sessions
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                background: 'rgba(245,158,11,0.10)',
                border: '1.5px solid rgba(245,158,11,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <AlertCircle size={24} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontSize: 34, fontWeight: 900, color: '#d97706', lineHeight: 1, fontFamily: "'JetBrains Mono',monospace" }}>
                  {metrics.missedSessions}
                </div>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 3, fontWeight: 500 }}>
                  Auto-marked
                </p>
              </div>
            </div>
          </div>

          {/* Sessions This Week */}
          <div style={{
            padding: '24px 22px',
            borderRadius: 20,
            border: '1.5px solid rgba(99,102,241,0.22)',
            background: '#fff',
            animation: 'fade-in 0.48s cubic-bezier(0.22,1,0.36,1) 0.26s both',
          }}>
            <p style={{ 
              fontFamily: "'JetBrains Mono',monospace", 
              fontSize: 9, 
              color: '#94a3b8', 
              textTransform: 'uppercase', 
              letterSpacing: '0.16em', 
              marginBottom: 10, 
              fontWeight: 700 
            }}>
              This Week
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                background: 'rgba(99,102,241,0.10)',
                border: '1.5px solid rgba(99,102,241,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Calendar size={24} color="#6366f1" />
              </div>
              <div>
                <div style={{ fontSize: 34, fontWeight: 900, color: '#6366f1', lineHeight: 1, fontFamily: "'JetBrains Mono',monospace" }}>
                  {metrics.sessionsThisWeek}
                </div>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 3, fontWeight: 500 }}>
                  Current week
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Performance Metrics */}
        <div style={{
          background: '#fff',
          borderRadius: 20,
          border: '1px solid rgba(226,232,240,0.9)',
          boxShadow: '0 2px 18px rgba(11,30,51,0.055)',
          overflow: 'hidden',
          marginBottom: 22,
          animation: 'fade-in 0.48s cubic-bezier(0.22,1,0.36,1) 0.28s both',
        }}>
          <div style={{ background: 'linear-gradient(135deg,#2DD4BF 0%,#0891b2 100%)', padding: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Activity size={24} color="#fff" />
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
                  Clinical Performance Metrics
                </div>
                <div style={{ 
                  fontFamily: "'JetBrains Mono',monospace", 
                  fontSize: 9, 
                  color: 'rgba(255,255,255,0.70)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.12em', 
                  marginTop: 1 
                }}>
                  Last 30 Days — Aggregated Patient Data
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '22px 24px' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: 18 
            }}>
              {/* Peak Grip Strength */}
              <div style={{
                background: 'linear-gradient(to bottom right,#fff,rgba(248,250,252,0.6))',
                border: '1px solid rgba(226,232,240,0.8)',
                borderRadius: 16,
                padding: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Gauge size={28} color="#ef4444" />
                  {metrics.gripStrengthTrend !== 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 99,
                      background: metrics.gripStrengthTrend > 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${metrics.gripStrengthTrend > 0 ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.22)'}`,
                    }}>
                      {metrics.gripStrengthTrend > 0 ? <TrendingUp size={12} color="#22c55e" /> : <TrendingDown size={12} color="#ef4444" />}
                      <span style={{ 
                        fontFamily: "'JetBrains Mono',monospace", 
                        fontSize: 10, 
                        fontWeight: 700, 
                        color: metrics.gripStrengthTrend > 0 ? '#16a34a' : '#dc2626' 
                      }}>
                        {Math.abs(metrics.gripStrengthTrend)}%
                      </span>
                    </div>
                  )}
                </div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>
                  Peak Grip Strength
                </h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: '#0B1E33', fontFamily: "'JetBrains Mono',monospace" }}>
                    {gripStrength.toFixed(1)}
                  </span>
                  <span style={{ fontSize: 16, color: '#94a3b8', fontWeight: 600 }}>N</span>
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  Maximum force during squeeze
                </p>
              </div>

              {/* Reaction Time */}
              <div style={{
                background: 'linear-gradient(to bottom right,#fff,rgba(248,250,252,0.6))',
                border: '1px solid rgba(226,232,240,0.8)',
                borderRadius: 16,
                padding: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Clock size={28} color="#3b82f6" />
                  {metrics.reactionTimeTrend !== 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 99,
                      background: metrics.reactionTimeTrend < 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${metrics.reactionTimeTrend < 0 ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.22)'}`,
                    }}>
                      {metrics.reactionTimeTrend < 0 ? <TrendingUp size={12} color="#22c55e" /> : <TrendingDown size={12} color="#ef4444" />}
                      <span style={{ 
                        fontFamily: "'JetBrains Mono',monospace", 
                        fontSize: 10, 
                        fontWeight: 700, 
                        color: metrics.reactionTimeTrend < 0 ? '#16a34a' : '#dc2626' 
                      }}>
                        {Math.abs(metrics.reactionTimeTrend)}%
                      </span>
                    </div>
                  )}
                </div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>
                  Reaction Time
                </h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: '#0B1E33', fontFamily: "'JetBrains Mono',monospace" }}>
                    {Math.round(reactionTime)}
                  </span>
                  <span style={{ fontSize: 16, color: '#94a3b8', fontWeight: 600 }}>ms</span>
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  Motor-cognitive response
                </p>
              </div>

              {/* Cognitive Accuracy */}
              <div style={{
                background: 'linear-gradient(to bottom right,#fff,rgba(248,250,252,0.6))',
                border: '1px solid rgba(226,232,240,0.8)',
                borderRadius: 16,
                padding: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Brain size={28} color="#8b5cf6" />
                  {metrics.cognitiveAccuracyTrend !== 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 99,
                      background: metrics.cognitiveAccuracyTrend > 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${metrics.cognitiveAccuracyTrend > 0 ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.22)'}`,
                    }}>
                      {metrics.cognitiveAccuracyTrend > 0 ? <TrendingUp size={12} color="#22c55e" /> : <TrendingDown size={12} color="#ef4444" />}
                      <span style={{ 
                        fontFamily: "'JetBrains Mono',monospace", 
                        fontSize: 10, 
                        fontWeight: 700, 
                        color: metrics.cognitiveAccuracyTrend > 0 ? '#16a34a' : '#dc2626' 
                      }}>
                        {Math.abs(metrics.cognitiveAccuracyTrend)}%
                      </span>
                    </div>
                  )}
                </div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>
                  Cognitive Accuracy
                </h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: '#0B1E33', fontFamily: "'JetBrains Mono',monospace" }}>
                    {cognitiveAcc.toFixed(1)}
                  </span>
                  <span style={{ fontSize: 16, color: '#94a3b8', fontWeight: 600 }}>%</span>
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  Correct decisions ratio
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div style={{
          background: '#fff',
          borderRadius: 20,
          border: '1px solid rgba(226,232,240,0.9)',
          overflow: 'hidden',
          marginBottom: 22,
          animation: 'fade-in 0.48s cubic-bezier(0.22,1,0.36,1) 0.32s both',
        }}>
          <div style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  width: 34, 
                  height: 34, 
                  borderRadius: 10, 
                  background: 'rgba(45,212,191,0.10)', 
                  border: '1px solid rgba(45,212,191,0.22)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <BarChart3 size={16} color="#2DD4BF" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0B1E33' }}>
                    {activeChart === 'strength' ? 'Average Grip Strength Trend' : 'Cognitive Accuracy Progress'}
                  </div>
                  <div style={{ 
                    fontFamily: "'JetBrains Mono',monospace", 
                    fontSize: 9, 
                    color: '#94a3b8', 
                    marginTop: 2, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.12em' 
                  }}>
                    {activeChart === 'strength' ? 'Weekly average force (N)' : 'Weekly accuracy percentage'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['strength', 'accuracy'] as const).map(tab => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveChart(tab)} 
                    style={{
                      padding: '7px 16px',
                      borderRadius: 10,
                      border: 'none',
                      cursor: 'pointer',
                      background: activeChart === tab ? '#0B1E33' : '#f1f5f9',
                      color: activeChart === tab ? '#fff' : '#64748b',
                      fontSize: 12.5,
                      fontWeight: 700,
                      transition: 'all 0.2s ease',
                      boxShadow: activeChart === tab ? '0 4px 14px rgba(11,30,51,0.22)' : 'none',
                    }}
                  >
                    {tab === 'strength' ? 'Strength' : 'Accuracy'}
                  </button>
                ))}
              </div>
            </div>

            {activeChart === 'strength' ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={strengthData} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                  <defs>
                    <linearGradient id="strengthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(226,232,240,0.6)" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fill: '#94a3b8' }} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fill: '#94a3b8' }} 
                    tickLine={false} 
                    axisLine={false} 
                    unit=" N" 
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="avg" 
                    stroke="#2DD4BF" 
                    strokeWidth={2.5} 
                    fill="url(#strengthGrad)" 
                    dot={false} 
                    activeDot={{ r: 5, fill: '#2DD4BF', strokeWidth: 0 }} 
                    name="Avg Strength"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={accuracyData} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(226,232,240,0.6)" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: '#94a3b8' }} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fill: '#94a3b8' }} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar 
                    dataKey="accuracy" 
                    fill="#8b5cf6" 
                    radius={[8, 8, 0, 0]} 
                    maxBarSize={52}
                    background={{ fill: 'rgba(226,232,240,0.3)' }}
                    name="Accuracy"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Session Analytics */}
        <div style={{
          background: '#fff',
          borderRadius: 20,
          border: '1px solid rgba(226,232,240,0.9)',
          overflow: 'hidden',
          animation: 'fade-in 0.48s cubic-bezier(0.22,1,0.36,1) 0.36s both',
        }}>
          <div style={{ background: 'linear-gradient(135deg,#64748b 0%,#475569 100%)', padding: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Clock size={24} color="#fff" />
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
                  Session Frequency & Duration
                </div>
                <div style={{ 
                  fontFamily: "'JetBrains Mono',monospace", 
                  fontSize: 9, 
                  color: 'rgba(255,255,255,0.70)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.12em', 
                  marginTop: 1 
                }}>
                  Activity Overview
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '22px 24px' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 16 
            }}>
              <div style={{ 
                padding: '16px', 
                background: 'rgba(240,244,248,0.7)', 
                borderRadius: 12, 
                border: '1px solid rgba(226,232,240,0.8)' 
              }}>
                <p style={{ 
                  fontFamily: "'JetBrains Mono',monospace", 
                  fontSize: 9, 
                  color: '#94a3b8', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.12em', 
                  marginBottom: 8 
                }}>
                  Last 30 Days
                </p>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0B1E33', fontFamily: "'JetBrains Mono',monospace" }}>
                  {metrics.sessionsLast30Days}
                </div>
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>sessions completed</p>
              </div>

              <div style={{ 
                padding: '16px', 
                background: 'rgba(240,244,248,0.7)', 
                borderRadius: 12, 
                border: '1px solid rgba(226,232,240,0.8)' 
              }}>
                <p style={{ 
                  fontFamily: "'JetBrains Mono',monospace", 
                  fontSize: 9, 
                  color: '#94a3b8', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.12em', 
                  marginBottom: 8 
                }}>
                  Last 7 Days
                </p>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0B1E33', fontFamily: "'JetBrains Mono',monospace" }}>
                  {metrics.sessionsLast7Days}
                </div>
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>sessions completed</p>
              </div>

              <div style={{ 
                padding: '16px', 
                background: 'rgba(240,244,248,0.7)', 
                borderRadius: 12, 
                border: '1px solid rgba(226,232,240,0.8)' 
              }}>
                <p style={{ 
                  fontFamily: "'JetBrains Mono',monospace", 
                  fontSize: 9, 
                  color: '#94a3b8', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.12em', 
                  marginBottom: 8 
                }}>
                  Total Duration
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: '#0B1E33', fontFamily: "'JetBrains Mono',monospace" }}>
                    {metrics.totalSessionDuration.toFixed(0)}
                  </span>
                  <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>min</span>
                </div>
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>last 30 days</p>
              </div>

              <div style={{ 
                padding: '16px', 
                background: 'rgba(240,244,248,0.7)', 
                borderRadius: 12, 
                border: '1px solid rgba(226,232,240,0.8)' 
              }}>
                <p style={{ 
                  fontFamily: "'JetBrains Mono',monospace", 
                  fontSize: 9, 
                  color: '#94a3b8', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.12em', 
                  marginBottom: 8 
                }}>
                  Avg Duration
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: '#0B1E33', fontFamily: "'JetBrains Mono',monospace" }}>
                    {metrics.averageSessionDuration.toFixed(1)}
                  </span>
                  <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>min</span>
                </div>
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>per session</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}