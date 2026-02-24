'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MessageCircle, Calendar, Activity,
  TrendingUp, FileText, Clock, CheckCircle2,
  AlertCircle, Shield, Bot, Zap,
} from 'lucide-react';

/* ─── Mock patient data ──────────────────────────────────────────────────── */
const PATIENTS: Record<string, {
  name: string; pid: string; condition: string; adherence: number;
  status: string; sub: string; lastSession: string; joinDate: string;
  sessions: { completed: number; total: number; streak: number };
  notes: string[];
}> = {
  '1':  { name: 'P.B. De Silva',        pid: 'P001', condition: 'Stroke',       adherence: 45,  status: 'Low',    sub: 'Standard',     lastSession: '2025-11-10', joinDate: '2025-09-01', sessions: { completed: 9, total: 20, streak: 0 }, notes: ['Patient reports fatigue post-session.','Recommend reducing session duration.'] },
  '2':  { name: 'Anura Dissanayaka',    pid: 'P002', condition: 'TBI',           adherence: 92,  status: 'High',   sub: 'AI Companion', lastSession: '2025-11-14', joinDate: '2025-08-15', sessions: { completed: 18, total: 20, streak: 7 }, notes: ['Excellent progress this week.','Cleared for Level 3 protocol.'] },
  '3':  { name: 'Isuri Alwis',          pid: 'P003', condition: 'Stroke',        adherence: 78,  status: 'Medium', sub: 'AI Companion', lastSession: '2025-11-13', joinDate: '2025-09-10', sessions: { completed: 14, total: 20, streak: 4 }, notes: ['Grip strength improving steadily.'] },
  '4':  { name: 'Shifani Ameena',       pid: 'P004', condition: 'Post-Surgery',  adherence: 65,  status: 'Medium', sub: 'Standard',     lastSession: '2025-11-12', joinDate: '2025-10-01', sessions: { completed: 13, total: 20, streak: 3 }, notes: ['Follow up on wrist mobility.'] },
  '5':  { name: 'Percy Silva',          pid: 'P005', condition: 'TBI',           adherence: 88,  status: 'High',   sub: 'AI Companion', lastSession: '2025-11-14', joinDate: '2025-08-20', sessions: { completed: 17, total: 20, streak: 6 }, notes: ['Strong adherence. Consider advancing protocol.'] },
  '6':  { name: 'Athula Premachandra',  pid: 'P006', condition: 'Stroke',        adherence: 52,  status: 'Low',    sub: 'Standard',     lastSession: '2025-11-14', joinDate: '2025-09-05', sessions: { completed: 10, total: 20, streak: 1 }, notes: ['Missed 3 sessions this week. Call patient.'] },
  '7':  { name: 'Aruni Perera',         pid: 'P007', condition: 'Post-Surgery',  adherence: 95,  status: 'High',   sub: 'AI Companion', lastSession: '2025-11-11', joinDate: '2025-07-30', sessions: { completed: 19, total: 20, streak: 9 }, notes: ['Outstanding performance. Nearing program completion.'] },
  '8':  { name: 'Amal Mahendra',        pid: 'P008', condition: 'TBI',           adherence: 73,  status: 'Medium', sub: 'Standard',     lastSession: '2025-11-13', joinDate: '2025-09-18', sessions: { completed: 14, total: 20, streak: 2 }, notes: ['Memory task scores plateaued.','Consider cognitive difficulty increase.'] },
  '9':  { name: 'Malkanthi Peris',      pid: 'P009', condition: 'Stroke',        adherence: 25,  status: 'Low',    sub: 'Standard',     lastSession: '2025-11-12', joinDate: '2025-10-12', sessions: { completed: 5, total: 20, streak: 0 }, notes: ['Urgent: very low adherence. Needs intervention.'] },
  '10': { name: 'K.K. Muththukumaran',  pid: 'P010', condition: 'TBI',           adherence: 76,  status: 'High',   sub: 'AI Companion', lastSession: '2025-11-15', joinDate: '2025-08-25', sessions: { completed: 15, total: 20, streak: 5 }, notes: ['Consistent. AI Companion engagement high.'] },
  '11': { name: 'Kamal Fernando',       pid: 'P011', condition: 'Post-Surgery',  adherence: 80,  status: 'High',   sub: 'AI Companion', lastSession: '2025-11-10', joinDate: '2025-09-22', sessions: { completed: 16, total: 20, streak: 5 }, notes: ['Good progress post-op. Protocol on track.'] },
  '12': { name: 'P.P. Sugathadasa',     pid: 'P012', condition: 'Stroke',        adherence: 63,  status: 'High',   sub: 'AI Companion', lastSession: '2025-11-14', joinDate: '2025-10-05', sessions: { completed: 12, total: 20, streak: 3 }, notes: ['Motivated patient. Attendance improving.'] },
};

function adherenceColor(v: number) {
  if (v >= 80) return '#10b981';
  if (v >= 60) return '#f59e0b';
  return '#ef4444';
}
function statusColor(s: string) {
  if (s === 'High')   return '#10b981';
  if (s === 'Medium') return '#f59e0b';
  return '#ef4444';
}

/* ─── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  .pp * { font-family:'Plus Jakarta Sans',system-ui,sans-serif; box-sizing:border-box; }
  .pp .mono { font-family:'JetBrains Mono',monospace; }

  @keyframes ppFadeUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes ppCardPop {
    0%   { opacity:0; transform:translateY(14px) scale(0.98); }
    100% { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes ppBarFill {
    from { width:0%; }
    to   { width:var(--w); }
  }
  @keyframes ppShimmer {
    0%   { transform:translateX(-100%); }
    100% { transform:translateX(300%); }
  }
  @keyframes ppGlow {
    0%,100% { box-shadow:0 0 0 0 rgba(45,212,191,0.35); }
    50%     { box-shadow:0 0 0 9px rgba(45,212,191,0); }
  }
  @keyframes ppDot {
    0%,100% { opacity:1; }
    50%     { opacity:0.3; }
  }

  .pp-card {
    background:#fff; border-radius:20px;
    border:1px solid rgba(226,232,240,0.9);
    box-shadow:0 2px 18px rgba(11,30,51,0.055);
    transition:transform 0.28s ease, box-shadow 0.28s ease;
  }
  .pp-card:hover { transform:translateY(-4px); box-shadow:0 18px 52px rgba(11,30,51,0.10) !important; }

  .pp-back-btn {
    display:inline-flex; align-items:center; gap:8px;
    padding:9px 16px; border-radius:12px;
    font-size:13px; font-weight:700; color:#64748b;
    background:#fff; border:1.5px solid rgba(226,232,240,0.9);
    text-decoration:none; transition:all 0.2s ease;
  }
  .pp-back-btn:hover { background:#f8fafc; color:#0B1E33; border-color:rgba(11,30,51,0.15); }

  .pp-msg-btn {
    display:inline-flex; align-items:center; gap:8px;
    padding:11px 22px; border-radius:14px;
    font-size:13px; font-weight:800;
    background:linear-gradient(135deg,#2DD4BF,#0891b2);
    color:#0B1E33; border:none; cursor:pointer;
    text-decoration:none; transition:all 0.25s ease;
    position:relative; overflow:hidden;
  }
  .pp-msg-btn::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);
    animation:ppShimmer 3s ease-in-out infinite;
  }
  .pp-msg-btn:hover { transform:translateY(-2px); box-shadow:0 10px 32px rgba(45,212,191,0.38); }

  .pp-note {
    padding:12px 14px; border-radius:12px;
    background:rgba(45,212,191,0.05);
    border:1px solid rgba(45,212,191,0.14);
    font-size:13px; color:#475569; line-height:1.65;
    position:relative; padding-left:26px;
  }
  .pp-note::before {
    content:''; position:absolute; left:12px; top:18px;
    width:6px; height:6px; border-radius:50%;
    background:#2DD4BF;
    box-shadow:0 0 6px rgba(45,212,191,0.6);
  }

  @media (max-width:900px) {
    .pp-main-grid { grid-template-columns:1fr !important; }
  }
  @media (max-width:640px) {
    .pp .mp { padding:16px 14px !important; }
    .pp-stat-grid { grid-template-columns:1fr 1fr !important; }
    .pp-header-row { flex-direction:column !important; align-items:flex-start !important; }
  }
`;

function AnimBar({ value, color, delay = 0 }: { value: number; color: string; delay?: number }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return (
    <div style={{ height: 8, background: 'rgba(11,30,51,0.07)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 99, width: `${w}%`,
        background: color, boxShadow: `0 0 8px ${color}70`,
        transition: 'width 1.2s cubic-bezier(0.22,1,0.36,1)',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)', animation: 'ppShimmer 2.2s ease-in-out infinite' }} />
      </div>
    </div>
  );
}

/* ─── Animated Number ────────────────────────────────────────────────────── */
function AnimNum({ to, suffix = '', delay = 0 }: { to: number; suffix?: string; delay?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let start: number | null = null;
      const raf = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 1000, 1);
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
        if (p < 1) requestAnimationFrame(raf); else setVal(to);
      };
      requestAnimationFrame(raf);
    }, delay);
    return () => clearTimeout(t);
  }, [to, delay]);
  return <>{val}{suffix}</>;
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
export default function PatientProfilePage() {
  const { id } = useParams();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const idStr = Array.isArray(id) ? id[0] : (id ?? '1');
  const p = PATIENTS[idStr] ?? PATIENTS['1'];
  const aColor = adherenceColor(p.adherence);
  const sColor = statusColor(p.status);
  const isAI = p.sub === 'AI Companion';

  if (!mounted) return null;

  return (
    <div className="pp" style={{ minHeight: '100vh', background: '#F0F4F8', paddingBottom: 52 }}>
      <style>{CSS}</style>

      {/* Ambient BG */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '8%', width: 700, height: 700, background: 'radial-gradient(circle,rgba(45,212,191,0.055),transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(11,30,51,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(11,30,51,0.022) 1px,transparent 1px)', backgroundSize: '52px 52px' }} />
      </div>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px', position: 'relative', zIndex: 1 }}>

        {/* Back nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, animation: 'ppFadeUp 0.5s ease both', flexWrap: 'wrap', gap: 12 }}>
          <Link href="/doctor/patients" className="pp-back-btn">
            <ArrowLeft size={15} /> Back to Patients
          </Link>
          <Link href={`/doctor/patients/${idStr}/messages`} className="pp-msg-btn">
            <MessageCircle size={15} style={{ position: 'relative', zIndex: 2 }} />
            <span style={{ position: 'relative', zIndex: 2 }}>Message Patient</span>
          </Link>
        </div>

        {/* ── Profile Hero ─────────────────────────────────────────────── */}
        <div style={{
          animation: 'ppCardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.05s both',
          background: '#fff', borderRadius: 22,
          border: '1.5px solid rgba(45,212,191,0.22)',
          boxShadow: '0 4px 28px rgba(11,30,51,0.07)',
          padding: '26px 28px', marginBottom: 20,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -30, left: -30, width: 180, height: 180, background: 'radial-gradient(circle,rgba(45,212,191,0.07),transparent 70%)' }} />
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(45,212,191,0.04),transparent)', animation: 'ppShimmer 5s ease-in-out infinite' }} />
          </div>

          <div className="pp-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, position: 'relative', zIndex: 2 }}>
            {/* Avatar + info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18,
                background: `linear-gradient(135deg,${aColor},${aColor}aa)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 800, color: '#fff',
                boxShadow: `0 0 0 3px ${aColor}30, 0 6px 24px ${aColor}40`,
                animation: 'ppGlow 3s ease-in-out infinite', flexShrink: 0,
              }}>
                {p.name.split(' ').map(w => w[0]).slice(0,2).join('')}
              </div>
              <div>
                <p className="mono" style={{ fontSize: 9.5, color: 'rgba(45,212,191,0.75)', textTransform: 'uppercase', letterSpacing: '0.20em', marginBottom: 3, fontWeight: 600 }}>Patient Profile</p>
                <h1 style={{ fontSize: 'clamp(1.3rem,2.2vw,1.75rem)', fontWeight: 800, color: '#0B1E33', margin: 0, lineHeight: 1.2 }}>{p.name}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                  <span className="mono" style={{ fontSize: 11.5, fontWeight: 600, color: '#2DD4BF', background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.18)', padding: '2px 10px', borderRadius: 8 }}>{p.pid}</span>
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{p.condition}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Joined {p.joinDate}</span>
                </div>
              </div>
            </div>

            {/* Status + subscription */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: `${sColor}0f`, border: `1px solid ${sColor}30`, borderRadius: 12, padding: '8px 14px' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: sColor, boxShadow: `0 0 6px ${sColor}`, animation: 'ppDot 2s ease-in-out infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: sColor }}>{p.status} Adherence</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: isAI ? '#0B1E33' : 'rgba(11,30,51,0.06)', border: isAI ? '1px solid rgba(45,212,191,0.20)' : '1px solid rgba(226,232,240,0.9)', borderRadius: 12, padding: '8px 14px' }}>
                {isAI ? <Bot size={13} color="#2DD4BF" /> : <Shield size={13} color="#64748b" />}
                <span style={{ fontSize: 12, fontWeight: 700, color: isAI ? '#2DD4BF' : '#64748b' }}>{p.sub}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats Grid ───────────────────────────────────────────────── */}
        <div className="pp-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20, animation: 'ppCardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.12s both' }}>
          {[
            { label: 'Adherence',  val: p.adherence,           suffix: '%', color: aColor,    icon: <Activity size={16} /> },
            { label: 'Sessions',   val: p.sessions.completed,  suffix: `/${p.sessions.total}`, color: '#2DD4BF', icon: <CheckCircle2 size={16} /> },
            { label: 'Streak',     val: p.sessions.streak,     suffix: ' days', color: '#f59e0b', icon: <Zap size={16} /> },
            { label: 'Last Session', val: 0, suffix: '', color: '#6366f1', icon: <Calendar size={16} />, dateVal: p.lastSession },
          ].map((s) => (
            <div key={s.label} className="pp-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 12, background: `${s.color}08`, border: `1.5px solid ${s.color}20` }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: `${s.color}14`, border: `1px solid ${s.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                {s.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="mono" style={{ fontSize: 9, color: s.color, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 'dateVal' in s && s.dateVal ? 12 : 20, fontWeight: 800, color: '#0B1E33', lineHeight: 1.1 }}>
                  {'dateVal' in s && s.dateVal ? <span className="mono" style={{ fontSize: 12 }}>{s.dateVal}</span> : <AnimNum to={s.val} suffix={s.suffix} delay={300} />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Two-column detail ────────────────────────────────────────── */}
        <div className="pp-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

          {/* Session & Adherence */}
          <div className="pp-card" style={{ padding: '22px', animation: 'ppCardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.20s both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(45,212,191,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2DD4BF' }}>
                <TrendingUp size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0B1E33', margin: 0 }}>Session & Adherence</h3>
                <p className="mono" style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>Weekly performance</p>
              </div>
            </div>

            {/* Big adherence */}
            <div style={{ background: 'rgba(240,244,248,0.7)', borderRadius: 16, padding: '18px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
                <div>
                  <div className="mono" style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Adherence Score</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: aColor, lineHeight: 1, textShadow: `0 0 20px ${aColor}40` }}>
                    <AnimNum to={p.adherence} suffix="%" delay={400} />
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Sessions</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0B1E33' }}>{p.sessions.completed}/{p.sessions.total}</div>
                </div>
              </div>
              <AnimBar value={p.adherence} color={aColor} delay={500} />
            </div>

            {/* Session dots */}
            <div style={{ marginBottom: 8 }}>
              <div className="mono" style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Session dots (this period)</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {Array.from({ length: p.sessions.total }).map((_, i) => (
                  <div key={i} style={{
                    width: 18, height: 6, borderRadius: 99,
                    background: i < p.sessions.completed ? `linear-gradient(90deg,${aColor}cc,${aColor})` : 'rgba(45,212,191,0.10)',
                    boxShadow: i < p.sessions.completed ? `0 0 5px ${aColor}60` : 'none',
                    transition: 'all 0.3s ease',
                  }} />
                ))}
              </div>
            </div>
          </div>

          {/* Clinical Notes */}
          <div className="pp-card" style={{ padding: '22px', animation: 'ppCardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.28s both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(99,102,241,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                <FileText size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0B1E33', margin: 0 }}>Clinical Notes</h3>
                <p className="mono" style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>Doctor observations</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {p.notes.map((note, i) => (
                <div key={i} className="pp-note" style={{ animationDelay: `${0.3 + i * 0.08}s`, animation: 'ppCardPop 0.4s ease both' }}>
                  {note}
                </div>
              ))}
            </div>

            {/* Add note textarea */}
            <div style={{ marginTop: 16, padding: 14, background: 'rgba(240,244,248,0.7)', borderRadius: 14, border: '1px dashed rgba(45,212,191,0.20)' }}>
              <textarea
                placeholder="Add a clinical note..."
                rows={3}
                style={{
                  width: '100%', background: 'none', border: 'none', resize: 'none',
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12.5, color: '#475569',
                  outline: 'none', lineHeight: 1.6,
                }}
              />
              <button style={{
                marginTop: 8, padding: '8px 16px', borderRadius: 10,
                background: 'rgba(45,212,191,0.10)', border: '1px solid rgba(45,212,191,0.22)',
                color: '#0891b2', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
                Save Note
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}