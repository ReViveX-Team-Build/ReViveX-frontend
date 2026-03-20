"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  Calendar, Clock, Plus, Trash2, XCircle, CheckCircle2,
  AlertCircle, RefreshCw, Gamepad2, User, Timer, ChevronDown,
} from "lucide-react";
import { auth } from "../../../lib/firebase";
import { getPatientsByDoctor } from "../../../lib/db/users";
import {
  checkUpcomingRemindersForDoctor, createScheduledSession,
  deleteScheduledSession, getDoctorSchedule,
  markMissedSessionsForDoctor, updateSessionStatus,
} from "../../../lib/db/schedule";
import { GameId, PatientData, ScheduledSession } from "../../../lib/db/types";

/* ─── Types ── */
type NewSessionForm = {
  patientId: string; gameId: GameId; level: number;
  scheduledDate: string; scheduledTime: string; durationMinutes: number;
};
const initialForm: NewSessionForm = {
  patientId: "", gameId: "synapse_racer", level: 1,
  scheduledDate: "", scheduledTime: "10:30", durationMinutes: 30,
};
const gameLabels: Record<GameId, string> = {
  synapse_racer:"Synapse Racer", rhythm_reef:"Rhythm Reef", grip_surge:"Grip Surge",
  precision_hold:"Precision Hold", stability_core:"Stability Core",
};
const gameEmoji: Record<GameId, string> = {
  synapse_racer:"🚀", rhythm_reef:"🎵", grip_surge:"💪",
  precision_hold:"🎯", stability_core:"⚖️",
};

/* ─── CSS ── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  .sc * { font-family:'Plus Jakarta Sans',system-ui,sans-serif; box-sizing:border-box; }
  .sc .mono { font-family:'JetBrains Mono',monospace; }

  @keyframes scFadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scCardPop { 0%{opacity:0;transform:translateY(12px) scale(.97)} 100%{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes scShimmer { 0%{transform:translateX(-200%) skewX(-15deg)} 100%{transform:translateX(400%) skewX(-15deg)} }
  @keyframes scSpin { to{transform:rotate(360deg)} }
  @keyframes scDot { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes scRowIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }

  .sc-card {
    border-radius:20px; border:1px solid rgba(226,232,240,0.9);
    box-shadow:0 2px 18px rgba(11,30,51,0.055); padding:28px;
    transition:box-shadow .28s ease;
  }
  .sc-card:hover { box-shadow:0 8px 36px rgba(11,30,51,0.09); }
  .dark .sc-card { background:#1e293b; border-color:#334155; box-shadow:0 2px 18px rgba(0,0,0,0.20); }
  .dark .sc-section-title { color:#f1f5f9; }
  .dark .sc-label { color:#94a3b8; }
  .dark .sc-input { background:#334155; border-color:#475569; color:#f1f5f9; }
  .dark .sc-input:focus { background:#1e293b; border-color:#2DD4BF; }
  .dark .sc-select { background-color:#334155 !important; border-color:#475569; color:#f1f5f9; }
  .dark .sc-btn-ghost { background:#1e293b; border-color:#334155; color:#94a3b8; }
  .dark .sc-session-row { border-color:#334155; }
  .dark .sc-session-row:hover { background:rgba(15,78,72,0.15); border-color:rgba(45,212,191,.30); }

  .sc-input {
    width:100%; padding:10px 14px;
    background:#f8fafc; border:1.5px solid rgba(226,232,240,0.9);
    border-radius:12px; font-size:13.5px; font-weight:500; color:#0B1E33;
    outline:none; transition:all .2s; font-family:'Plus Jakarta Sans',sans-serif;
  }
  .sc-input:focus { border-color:#2DD4BF; background:#f0fdfb; box-shadow:0 0 0 3px rgba(45,212,191,.10); }

  .sc-select {
    width:100%; padding:10px 36px 10px 14px; background:#f8fafc url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 13px center;
    border:1.5px solid rgba(226,232,240,0.9); border-radius:12px;
    font-size:13.5px; font-weight:500; color:#0B1E33;
    outline:none; cursor:pointer; appearance:none;
    transition:all .2s; font-family:'Plus Jakarta Sans',sans-serif;
  }
  .sc-select:focus { border-color:#2DD4BF; background-color:#f0fdfb; box-shadow:0 0 0 3px rgba(45,212,191,.10); }

  .sc-btn-primary {
    display:flex; align-items:center; justify-content:center; gap:8px;
    padding:12px 24px; border-radius:13px; border:none; cursor:pointer;
    background:linear-gradient(135deg,#2DD4BF,#0891b2); color:#0B1E33;
    font-size:13.5px; font-weight:800; transition:all .22s;
    position:relative; overflow:hidden; font-family:'Plus Jakarta Sans',sans-serif;
    box-shadow:0 4px 18px rgba(45,212,191,.32);
  }
  .sc-btn-primary::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent); animation:scShimmer 2.8s ease-in-out infinite; }
  .sc-btn-primary:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(45,212,191,.42); }
  .sc-btn-primary:disabled { opacity:.5; cursor:not-allowed; }

  .sc-btn-ghost {
    display:inline-flex; align-items:center; gap:6px;
    padding:8px 16px; border-radius:10px; cursor:pointer;
    background:#fff; border:1.5px solid rgba(226,232,240,.9);
    font-size:12px; font-weight:700; color:#64748b; transition:all .2s;
    font-family:'Plus Jakarta Sans',sans-serif;
  }
  .sc-btn-ghost:hover { border-color:#2DD4BF; color:#0f766e; background:rgba(45,212,191,.05); }

  .sc-btn-cancel {
    display:inline-flex; align-items:center; gap:4px;
    padding:6px 12px; border-radius:9px; cursor:pointer;
    background:rgba(245,158,11,.07); border:1.5px solid rgba(245,158,11,.30);
    font-size:11.5px; font-weight:700; color:#b45309; transition:all .2s;
    font-family:'Plus Jakarta Sans',sans-serif;
  }
  .sc-btn-cancel:hover { background:rgba(245,158,11,.14); border-color:rgba(245,158,11,.55); }
  .sc-btn-cancel:disabled { opacity:.5; cursor:not-allowed; }

  .sc-btn-delete {
    display:inline-flex; align-items:center; gap:4px;
    padding:6px 12px; border-radius:9px; cursor:pointer;
    background:rgba(239,68,68,.07); border:1.5px solid rgba(239,68,68,.28);
    font-size:11.5px; font-weight:700; color:#dc2626; transition:all .2s;
    font-family:'Plus Jakarta Sans',sans-serif;
  }
  .sc-btn-delete:hover { background:rgba(239,68,68,.14); border-color:rgba(239,68,68,.50); }
  .sc-btn-delete:disabled { opacity:.5; cursor:not-allowed; }

  .sc-session-row {
    display:flex; align-items:center; justify-content:space-between; gap:12px;
    padding:14px 18px; border-radius:14px; flex-wrap:wrap;
    border:1.5px solid rgba(226,232,240,.9);
    transition:all .22s; animation:scRowIn .35s cubic-bezier(.22,1,.36,1) both;
  }
  .sc-session-row:hover { border-color:rgba(45,212,191,.30); background:rgba(240,253,250,.6); transform:translateX(2px); }

  .sc-status-scheduled { background:rgba(45,212,191,.10); color:#0f766e; border:1px solid rgba(45,212,191,.28); }
  .sc-status-completed { background:rgba(34,197,94,.10); color:#15803d; border:1px solid rgba(34,197,94,.28); }
  .sc-status-missed    { background:rgba(239,68,68,.08); color:#dc2626; border:1px solid rgba(239,68,68,.22); }
  .sc-status-cancelled { background:rgba(148,163,184,.10); color:#475569; border:1px solid rgba(148,163,184,.22); }

  .sc-day-btn {
    flex:1; min-width:52px; padding:8px 6px; border-radius:11px;
    border:1.5px solid rgba(226,232,240,.9); cursor:pointer;
    transition:all .2s; background:#fff; font-family:'Plus Jakarta Sans',sans-serif;
    text-align:center;
  }
  .sc-day-btn.selected { background:rgba(45,212,191,.10); border-color:#2DD4BF; }
  .sc-day-btn.has-session { border-color:rgba(99,102,241,.35); }
  .sc-day-btn:hover { border-color:#2DD4BF; }

  .sc-label { font-size:12px; font-weight:700; color:#64748b; margin-bottom:7px; }
  .sc-section-title { display:flex; align-items:center; gap:10px; font-size:15px; font-weight:800; color:#0B1E33; margin-bottom:20px; }
  .sc-section-title .iw { width:30px; height:30px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
`;

/* ─── Status badge ── */
function StatusBadge({ status }: { status: ScheduledSession["status"] }) {
  const cls = `sc-status-${status}`;
  const icons = {
    scheduled: <Clock size={10}/>, completed: <CheckCircle2 size={10}/>,
    missed: <AlertCircle size={10}/>, cancelled: <XCircle size={10}/>,
  };
  return (
    <span className={`mono ${cls}`} style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:99, fontSize:10, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase" }}>
      {icons[status]} {status}
    </span>
  );
}

/* ─── Session row ── */
function SessionRow({ session, patientName, onCancel, onDelete, disabled }: {
  session: ScheduledSession; patientName: string;
  onCancel:(id?:string)=>void; onDelete:(id?:string)=>void; disabled:boolean;
}) {
  return (
    <div className="sc-session-row">
      <div style={{ display:"flex", alignItems:"center", gap:14, flex:1, minWidth:0 }}>
        <div style={{ width:42, height:42, borderRadius:13, background:"rgba(45,212,191,.10)", border:"1.5px solid rgba(45,212,191,.22)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
          {gameEmoji[session.gameId]}
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:13.5, fontWeight:700, color:"#0B1E33" }}>{patientName}</div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:3, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, color:"#64748b" }}>{gameLabels[session.gameId]} · Lv.{session.level}</span>
            <span style={{ fontSize:11, color:"#94a3b8" }}>•</span>
            <span className="mono" style={{ fontSize:11, color:"#2DD4BF" }}>{session.scheduledTime}</span>
            <span style={{ fontSize:11, color:"#94a3b8" }}>•</span>
            <span className="mono" style={{ fontSize:11, color:"#94a3b8" }}>{session.durationMinutes} min</span>
          </div>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
        <StatusBadge status={session.status}/>
        {session.status === "scheduled" && (
          <button className="sc-btn-cancel" onClick={() => onCancel(session.id)} disabled={disabled}>
            <XCircle size={11}/> Cancel
          </button>
        )}
        <button className="sc-btn-delete" onClick={() => onDelete(session.id)} disabled={disabled}>
          <Trash2 size={11}/> Delete
        </button>
      </div>
    </div>
  );
}

/* ─── Week strip ── */
function WeekStrip({ selected, sessions, onChange }: {
  selected: string; sessions: ScheduledSession[]; onChange:(d:string)=>void;
}) {
  const days = useMemo(() => {
    const d = new Date(selected || new Date().toISOString().slice(0,10));
    // go to Monday of selected week
    const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return Array.from({length:7},(_,i) => {
      const dt = new Date(d); dt.setDate(d.getDate()+i);
      return dt.toISOString().slice(0,10);
    });
  }, [selected]);
  const sessionDates = new Set(sessions.map(s => s.scheduledDate));
  const labels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  return (
    <div style={{ display:"flex", gap:6, overflowX:"auto" }}>
      {days.map((date, i) => {
        const isSelected = date === selected;
        const hasSessions = sessionDates.has(date);
        const dayNum = parseInt(date.slice(8));
        return (
          <button key={date} onClick={() => onChange(date)}
            className={`sc-day-btn ${isSelected?"selected":""} ${hasSessions&&!isSelected?"has-session":""}`}>
            <div className="mono" style={{ fontSize:9, color:"#94a3b8", letterSpacing:".10em", marginBottom:3 }}>{labels[i]}</div>
            <div style={{ fontSize:15, fontWeight:800, color:isSelected?"#0f766e":"#0B1E33" }}>{dayNum}</div>
            {hasSessions && <div style={{ width:5, height:5, borderRadius:"50%", background:isSelected?"#2DD4BF":"#6366f1", margin:"4px auto 0", boxShadow:isSelected?"0 0 5px #2DD4BF":"none" }}/>}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Main page ── */
export default function SchedulePage() {
  const [user, authLoading] = useAuthState(auth);
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [form, setForm] = useState<NewSessionForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actioningId, setActioningId] = useState<string|null>(null);
  const [error, setError] = useState<string|null>(null);
  const [showForm, setShowForm] = useState(false);

  const selectedDateSessions = useMemo(
    () => sessions.filter(s => s.scheduledDate === selectedDate),
    [sessions, selectedDate]
  );
  const patientById = useMemo(() => {
    const m = new Map<string,string>();
    for (const p of patients) m.set(p.uid, p.name);
    return m;
  }, [patients]);

  const refreshData = async (uid: string) => {
    setLoading(true); setError(null);
    try {
      await markMissedSessionsForDoctor(uid);
      await checkUpcomingRemindersForDoctor(uid).catch(e => console.warn("Reminder check skipped:", e));
      const [pts, sched] = await Promise.all([getPatientsByDoctor(uid), getDoctorSchedule(uid)]);
      setPatients(pts); setSessions(sched);
      if (!form.patientId && pts.length > 0) setForm(prev => ({...prev, patientId: pts[0].uid}));
    } catch (e) {
      console.error(e); setError("Could not load schedule data. Please retry.");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); setError("Please sign in to view your schedule."); return; }
    void refreshData(user.uid);
  }, [user, authLoading]);

  const handleCreate = async () => {
    if (!user) return;
    if (!form.patientId || !form.scheduledDate || !form.scheduledTime) {
      setError("Patient, date, and time are required."); return;
    }
    setSubmitting(true); setError(null);
    try {
      await createScheduledSession({ doctorId:user.uid, patientId:form.patientId, gameId:form.gameId, level:form.level, scheduledDate:form.scheduledDate, scheduledTime:form.scheduledTime, durationMinutes:form.durationMinutes });
      setSelectedDate(form.scheduledDate);
      setForm(prev => ({...prev, scheduledTime:"10:30", durationMinutes:30}));
      setShowForm(false);
      await refreshData(user.uid);
    } catch (e) { console.error(e); setError("Could not create session. Please try again."); }
    finally { setSubmitting(false); }
  };

  const handleCancel = async (id?: string) => {
    if (!user || !id) return;
    setActioningId(id); setError(null);
    try { await updateSessionStatus(id, "cancelled"); await refreshData(user.uid); }
    catch (e) { console.error(e); setError("Could not cancel session."); }
    finally { setActioningId(null); }
  };

  const handleDelete = async (id?: string) => {
    if (!user || !id) return;
    setActioningId(id); setError(null);
    try { await deleteScheduledSession(id); await refreshData(user.uid); }
    catch (e) { console.error(e); setError("Could not delete session."); }
    finally { setActioningId(null); }
  };

  // Stats
  const scheduled = sessions.filter(s => s.status==="scheduled").length;
  const completed = sessions.filter(s => s.status==="completed").length;
  const missed    = sessions.filter(s => s.status==="missed").length;

  return (
    <div className="sc" style={{ minHeight:"100vh", paddingBottom:52 }}>
      <style>{CSS}</style>

      {/* Ambient */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-8%", right:"6%", width:600, height:600, background:"radial-gradient(circle,rgba(45,212,191,.05),transparent 65%)", borderRadius:"50%" }}/>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(11,30,51,.020) 1px,transparent 1px),linear-gradient(90deg,rgba(11,30,51,.020) 1px,transparent 1px)", backgroundSize:"52px 52px" }}/>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"28px 24px", position:"relative", zIndex:1 }}>

        {/* Header */}
        <div style={{ animation:"scFadeUp .5s ease both", marginBottom:24, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
          <div>
            <p className="mono" style={{ fontSize:9, color:"rgba(45,212,191,.72)", textTransform:"uppercase", letterSpacing:".22em", marginBottom:4, fontWeight:600 }}>Doctor Dashboard</p>
            <h1 style={{ fontSize:"clamp(1.5rem,2.8vw,2rem)", fontWeight:800, color:"#0B1E33", margin:0, lineHeight:1.15 }}>
              Session <span style={{ color:"#2DD4BF" }}>Schedule</span>
            </h1>
            <p style={{ fontSize:13.5, color:"#64748b", marginTop:4, fontWeight:500 }}>Manage patient sessions and reminders</p>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button className="sc-btn-ghost" onClick={() => user && refreshData(user.uid)} disabled={loading}>
              <RefreshCw size={13} style={{ animation:loading?"scSpin 1s linear infinite":"none" }}/> Refresh
            </button>
            <button className="sc-btn-primary" onClick={() => setShowForm(v => !v)}>
              <Plus size={14} style={{ position:"relative", zIndex:2 }}/>
              <span style={{ position:"relative", zIndex:2 }}>New Session</span>
            </button>
          </div>
        </div>

        {/* Stat chips */}
        <div style={{ display:"flex", gap:12, marginBottom:22, flexWrap:"wrap", animation:"scFadeUp .5s ease .04s both" }}>
          {[
            { label:"Upcoming", val:scheduled, c:"#2DD4BF", bg:"rgba(45,212,191,.08)", border:"rgba(45,212,191,.22)" },
            { label:"Completed", val:completed, c:"#22c55e", bg:"rgba(34,197,94,.08)", border:"rgba(34,197,94,.22)" },
            { label:"Missed",    val:missed,    c:"#ef4444", bg:"rgba(239,68,68,.07)", border:"rgba(239,68,68,.20)" },
            { label:"Patients",  val:patients.length, c:"#6366f1", bg:"rgba(99,102,241,.08)", border:"rgba(99,102,241,.22)" },
          ].map(s => (
            <div key={s.label} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 18px", borderRadius:14, background:s.bg, border:`1.5px solid ${s.border}` }}>
              <div style={{ fontSize:22, fontWeight:800, color:s.c, lineHeight:1 }}>{s.val}</div>
              <div className="mono" style={{ fontSize:9, color:s.c, textTransform:"uppercase", letterSpacing:".14em", fontWeight:700 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ marginBottom:16, padding:"12px 16px", background:"rgba(239,68,68,.06)", border:"1px solid rgba(239,68,68,.20)", borderRadius:12, fontSize:13, color:"#dc2626", fontWeight:500, display:"flex", alignItems:"center", gap:8 }}>
            <AlertCircle size={14}/> {error}
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:20, alignItems:"start" }}>

          {/* LEFT: calendar + sessions */}
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

            {/* Week view */}
            <div className="sc-card" style={{ animation:"scCardPop .5s cubic-bezier(.22,1,.36,1) .06s both" }}>
              <div className="sc-section-title">
                <span className="iw" style={{ background:"rgba(45,212,191,.10)", color:"#2DD4BF" }}><Calendar size={15}/></span>
                Week View
                <span className="mono" style={{ marginLeft:"auto", fontSize:9, color:"#94a3b8", letterSpacing:".14em" }}>
                  {new Date(selectedDate).toLocaleDateString("en-US",{month:"long",year:"numeric"})}
                </span>
              </div>
              <WeekStrip selected={selectedDate} sessions={sessions} onChange={setSelectedDate}/>
              <div style={{ marginTop:14 }}>
                <div className="sc-label">Jump to date</div>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="sc-input" style={{ width:"auto" }}/>
              </div>
            </div>

            {/* Sessions for selected date */}
            <div className="sc-card" style={{ animation:"scCardPop .5s cubic-bezier(.22,1,.36,1) .10s both" }}>
              <div className="sc-section-title">
                <span className="iw" style={{ background:"rgba(99,102,241,.10)", color:"#6366f1" }}><Clock size={15}/></span>
                Sessions — {new Date(selectedDate).toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}
                <span style={{ marginLeft:"auto", fontSize:12, fontWeight:600, color:"#94a3b8" }}>
                  {selectedDateSessions.length} session{selectedDateSessions.length!==1?"s":""}
                </span>
              </div>
              {loading ? (
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"20px 0", color:"#94a3b8" }}>
                  <div style={{ width:16, height:16, border:"2px solid rgba(45,212,191,.25)", borderTopColor:"#2DD4BF", borderRadius:"50%", animation:"scSpin 1s linear infinite" }}/>
                  <span style={{ fontSize:13 }}>Loading sessions…</span>
                </div>
              ) : selectedDateSessions.length === 0 ? (
                <div style={{ textAlign:"center", padding:"28px 0" }}>
                  <div style={{ fontSize:28, marginBottom:10 }}>📅</div>
                  <p style={{ fontSize:13.5, fontWeight:700, color:"#0B1E33", marginBottom:4 }}>No sessions scheduled</p>
                  <p style={{ fontSize:12, color:"#94a3b8" }}>Click "New Session" to add one for this date.</p>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {selectedDateSessions
                    .sort((a,b) => a.scheduledTime.localeCompare(b.scheduledTime))
                    .map((s,i) => (
                      <SessionRow key={s.id} session={s}
                        patientName={patientById.get(s.patientId) ?? s.patientId}
                        onCancel={handleCancel} onDelete={handleDelete}
                        disabled={actioningId === s.id}/>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: new session form + reminders */}
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

            {/* New session form */}
            <div className="sc-card" style={{ animation:"scCardPop .5s cubic-bezier(.22,1,.36,1) .08s both" }}>
              <div className="sc-section-title">
                <span className="iw" style={{ background:"rgba(45,212,191,.10)", color:"#2DD4BF" }}><Plus size={15}/></span>
                New Session
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div>
                  <div className="sc-label">Patient</div>
                  <select className="sc-select" value={form.patientId}
                    onChange={e => setForm(p => ({...p, patientId:e.target.value}))}>
                    {patients.length === 0
                      ? <option value="">No patients linked</option>
                      : patients.map(p => <option key={p.uid} value={p.uid}>{p.name}</option>)}
                  </select>
                </div>

                <div>
                  <div className="sc-label">Game</div>
                  <select className="sc-select" value={form.gameId}
                    onChange={e => setForm(p => ({...p, gameId:e.target.value as GameId}))}>
                    {(Object.keys(gameLabels) as GameId[]).map(id => (
                      <option key={id} value={id}>{gameEmoji[id]} {gameLabels[id]}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div>
                    <div className="sc-label">Date</div>
                    <input type="date" className="sc-input" value={form.scheduledDate}
                      onChange={e => setForm(p => ({...p, scheduledDate:e.target.value}))}/>
                  </div>
                  <div>
                    <div className="sc-label">Time</div>
                    <input type="time" className="sc-input" value={form.scheduledTime}
                      onChange={e => setForm(p => ({...p, scheduledTime:e.target.value}))}/>
                  </div>
                  <div>
                    <div className="sc-label">Level</div>
                    <input type="number" min={1} max={10} className="sc-input" value={form.level}
                      onChange={e => setForm(p => ({...p, level:Number(e.target.value)||1}))}/>
                  </div>
                  <div>
                    <div className="sc-label">Duration (min)</div>
                    <input type="number" min={5} max={180} className="sc-input" value={form.durationMinutes}
                      onChange={e => setForm(p => ({...p, durationMinutes:Number(e.target.value)||30}))}/>
                  </div>
                </div>

                <button className="sc-btn-primary" onClick={handleCreate}
                  disabled={submitting||loading||!user||patients.length===0}
                  style={{ width:"100%" }}>
                  {submitting
                    ? <><div style={{ width:14,height:14,border:"2.5px solid rgba(11,30,51,.25)",borderTopColor:"#0B1E33",borderRadius:"50%",animation:"scSpin .75s linear infinite" }}/> Creating…</>
                    : <><Plus size={15} style={{ position:"relative",zIndex:2 }}/><span style={{ position:"relative",zIndex:2 }}>Schedule Session</span></>}
                </button>
              </div>
            </div>

            {/* All upcoming */}
            <div className="sc-card" style={{ animation:"scCardPop .5s cubic-bezier(.22,1,.36,1) .14s both" }}>
              <div className="sc-section-title">
                <span className="iw" style={{ background:"rgba(251,191,36,.12)", color:"#f59e0b" }}><Timer size={15}/></span>
                Upcoming This Week
              </div>
              {loading ? (
                <p style={{ fontSize:13, color:"#94a3b8" }}>Loading…</p>
              ) : sessions.filter(s => s.status==="scheduled").length === 0 ? (
                <p style={{ fontSize:13, color:"#94a3b8" }}>No upcoming sessions scheduled.</p>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {sessions.filter(s => s.status==="scheduled")
                    .sort((a,b) => `${a.scheduledDate}T${a.scheduledTime}`.localeCompare(`${b.scheduledDate}T${b.scheduledTime}`))
                    .slice(0,6)
                    .map(s => (
                      <div key={s.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:12, border:"1px solid rgba(226,232,240,.9)" }}>
                        <span style={{ fontSize:16 }}>{gameEmoji[s.gameId]}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12.5, fontWeight:700, color:"#0B1E33", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {patientById.get(s.patientId) ?? s.patientId}
                          </div>
                          <div className="mono" style={{ fontSize:9.5, color:"#94a3b8", marginTop:1 }}>
                            {s.scheduledDate} · {s.scheduledTime}
                          </div>
                        </div>
                        <StatusBadge status={s.status}/>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Reminders */}
            <div style={{ padding:"20px 22px", borderRadius:18, background:"rgba(99,102,241,.06)", border:"1.5px dashed rgba(99,102,241,.25)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{ width:30, height:30, borderRadius:9, background:"rgba(99,102,241,.12)", display:"flex", alignItems:"center", justifyContent:"center", color:"#6366f1" }}>
                  <AlertCircle size={14}/>
                </div>
                <span style={{ fontSize:14, fontWeight:800, color:"#0B1E33" }}>Automated Reminders</span>
              </div>
              <p style={{ fontSize:12.5, color:"#64748b", lineHeight:1.65, marginBottom:12 }}>
                Patients receive notifications 30 minutes before scheduled sessions automatically.
              </p>
              <button className="sc-btn-ghost" style={{ fontSize:12 }}>Configure Reminder Timing</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}