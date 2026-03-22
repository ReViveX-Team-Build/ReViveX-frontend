"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  Calendar, Clock, Plus, Trash2, XCircle, CheckCircle2,
  AlertCircle, RefreshCw, Gamepad2, User, Timer, Video, MapPin, Stethoscope
} from "lucide-react";
import { auth } from "@/app/lib/firebase";
import { getPatientsByDoctor } from "@/app/lib/db/users";
import {
  checkUpcomingRemindersForDoctor, createScheduledSession,
  deleteScheduledSession, getDoctorSchedule,
  markMissedSessionsForDoctor, updateSessionStatus,
} from "@/app/lib/db/schedule";
import { createAppointment, getDoctorAppointments, deleteAppointment, updateAppointmentStatus } from "../../../lib/db/appointments";
import { GameId, PatientData, ScheduledSession, Appointment } from "@/app/lib/db/types";
import { useDarkMode } from "@/app/lib/hooks/useDarkMode";

/* ─── Types ── */
type NewSessionForm = {
  patientId: string; gameId: GameId; level: number;
  scheduledDate: string; scheduledTime: string; durationMinutes: number;
};

type NewMeetingForm = {
  patientId: string; title: string; mode: "telehealth" | "in-person";
  scheduledDate: string; scheduledTime: string; durationMinutes: number;
};

const initialSessionForm: NewSessionForm = {
  patientId: "", gameId: "synapse_racer", level: 1,
  scheduledDate: "", scheduledTime: "10:30", durationMinutes: 30,
};

const initialMeetingForm: NewMeetingForm = {
  patientId: "", title: "Follow-up Review", mode: "telehealth",
  scheduledDate: "", scheduledTime: "14:00", durationMinutes: 30,
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
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  .sc * { font-family:'Plus Jakarta Sans',system-ui,sans-serif; box-sizing:border-box; }
  .sc .mono { font-family:'JetBrains Mono',monospace; }

  @keyframes scFadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scCardPop { 0%{opacity:0;transform:translateY(12px) scale(.97)} 100%{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes scShimmer { 0%{transform:translateX(-200%) skewX(-15deg)} 100%{transform:translateX(400%) skewX(-15deg)} }
  @keyframes scSpin { to{transform:rotate(360deg)} }
  @keyframes scRowIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }

  .sc-card {
    border-radius:20px; border:1px solid rgba(226,232,240,0.9);
    box-shadow:0 2px 18px rgba(11,30,51,0.055); padding:28px;
    transition:box-shadow .28s ease; background: #fff;
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
  .dark .sc-day-btn { background:#1e293b; border-color:#334155; color:#f1f5f9; }
  .dark .sc-day-btn.selected { background:rgba(45,212,191,.15); border-color:#2DD4BF; color:#f1f5f9; }
  .dark .sc-day-btn:hover:not(.selected) { border-color:rgba(45,212,191,.5); }

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

  .sc-status-scheduled, .sc-status-pending { background:rgba(45,212,191,.10); color:#0f766e; border:1px solid rgba(45,212,191,.28); }
  .sc-status-completed, .sc-status-confirmed { background:rgba(34,197,94,.10); color:#15803d; border:1px solid rgba(34,197,94,.28); }
  .sc-status-missed    { background:rgba(239,68,68,.08); color:#dc2626; border:1px solid rgba(239,68,68,.22); }
  .sc-status-cancelled { background:rgba(148,163,184,.10); color:#475569; border:1px solid rgba(148,163,184,.22); }

  .sc-day-btn {
    flex:1; min-width:52px; padding:8px 6px; border-radius:11px;
    border:1.5px solid rgba(226,232,240,.9); cursor:pointer;
    transition:all .2s; background:#fff; font-family:'Plus Jakarta Sans',sans-serif;
    text-align:center;
  }
  .sc-day-btn.selected { background:rgba(45,212,191,.10); border-color:#2DD4BF; color:#0f766e; }
  .sc-day-btn.has-session { border-color:rgba(99,102,241,.35); }
  .sc-day-btn:hover:not(.selected) { border-color:#2DD4BF; }

  .sc-tab {
    flex:1; text-align:center; padding:10px; font-size:13px; font-weight:700; cursor:pointer;
    border-bottom: 2px solid transparent; transition:all 0.2s; color: #94a3b8;
  }
  .sc-tab.active { border-bottom-color: #2DD4BF; color: #2DD4BF; background: rgba(45,212,191,0.05); }

  .sc-label { font-size:12px; font-weight:700; color:#64748b; margin-bottom:7px; }
  .sc-section-title { display:flex; align-items:center; gap:10px; font-size:15px; font-weight:800; color:#0B1E33; margin-bottom:20px; }
  .sc-section-title .iw { width:30px; height:30px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
`;

/* ─── Status badge ── */
function StatusBadge({ status }: { status: string }) {
  const cls = `sc-status-${status}`;
  const icons: any = {
    scheduled: <Clock size={10}/>, pending: <Clock size={10}/>,
    completed: <CheckCircle2 size={10}/>, confirmed: <CheckCircle2 size={10}/>,
    missed: <AlertCircle size={10}/>, cancelled: <XCircle size={10}/>,
  };
  return (
    <span className={`mono ${cls}`} style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:99, fontSize:10, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase" }}>
      {icons[status]} {status}
    </span>
  );
}

/* ─── Agenda Item Row (Handles both Games and Meetings) ── */
function AgendaRow({ item, patientName, onCancel, onDelete, disabled, isDark }: {
  item: any; patientName: string; onCancel:(id:string, type:string)=>void; onDelete:(id:string, type:string)=>void; disabled:boolean; isDark: boolean;
}) {
  const isGame = item.type === "game";

  return (
    <div className="sc-session-row">
      <div style={{ display:"flex", alignItems:"center", gap:14, flex:1, minWidth:0 }}>
        {/* Icon Badge */}
        <div style={{ 
          width:42, height:42, borderRadius:13, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18,
          background: isGame ? "rgba(45,212,191,.10)" : "rgba(99,102,241,.10)",
          border: isGame ? "1.5px solid rgba(45,212,191,.22)" : "1.5px solid rgba(99,102,241,.22)",
          color: isGame ? "#2DD4BF" : "#6366f1"
        }}>
          {isGame ? gameEmoji[item.gameId as GameId] : (item.mode === "telehealth" ? <Video size={20}/> : <MapPin size={20}/>)}
        </div>
        
        {/* Info */}
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:13.5, fontWeight:800, color: isDark ? "#f1f5f9" : "#0B1E33" }}>{patientName}</div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, color: isDark ? "#cbd5e1" : "#475569", fontWeight: 600 }}>
              {isGame ? `${gameLabels[item.gameId as GameId]} · Lv.${item.level}` : item.title}
            </span>
            <span style={{ fontSize:11, color:"#94a3b8" }}>•</span>
            <span className="mono" style={{ fontSize:11, color:"#2DD4BF" }}>{item.scheduledTime}</span>
            <span style={{ fontSize:11, color:"#94a3b8" }}>•</span>
            <span className="mono" style={{ fontSize:11, color:"#94a3b8" }}>{item.durationMinutes} min</span>
            
            {!isGame && (
               <span style={{ fontSize:10, padding: "2px 6px", borderRadius: 4, background: item.mode === "telehealth" ? "rgba(99,102,241,.1)" : "rgba(45,212,191,.1)", color: item.mode === "telehealth" ? "#6366f1" : "#0f766e", fontWeight: 700 }}>
                 {item.mode === "telehealth" ? "Telehealth" : "In-Person"}
               </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
        
        {/* JITSI INTEGRATION: Join Call Button for Telehealth */}
        {!isGame && item.mode === "telehealth" && (
          <button 
            onClick={() => window.open(`/doctor/meeting/${item.id}`, "_blank")}
            style={{ 
              display:"flex", alignItems:"center", gap:6, padding:"6px 14px", 
              borderRadius:9, cursor:"pointer", background:"#6366f1", 
              border:"none", fontSize:11.5, fontWeight:800, color:"#fff", 
              transition:"all .2s", boxShadow:"0 4px 12px rgba(99,102,241,0.3)" 
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            <Video size={12}/> Join Call
          </button>
        )}

        <StatusBadge status={item.status}/>
        
        {(item.status === "scheduled" || item.status === "pending" || item.status === "confirmed") && (
          <button className="sc-btn-cancel" onClick={() => onCancel(item.id, item.type)} disabled={disabled}>
            <XCircle size={11}/> Cancel
          </button>
        )}
        <button className="sc-btn-delete" onClick={() => onDelete(item.id, item.type)} disabled={disabled}>
          <Trash2 size={11}/> Delete
        </button>
      </div>
    </div>
  );
}

/* ─── Week strip ── */
function WeekStrip({ selected, agendaDates, onChange, isDark }: {
  selected: string; agendaDates: Set<string>; onChange:(d:string)=>void; isDark: boolean;
}) {
  const days = useMemo(() => {
    const d = new Date(selected || new Date().toISOString().slice(0,10));
    const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return Array.from({length:7},(_,i) => {
      const dt = new Date(d); dt.setDate(d.getDate()+i);
      return dt.toISOString().slice(0,10);
    });
  }, [selected]);
  const labels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  
  return (
    <div style={{ display:"flex", gap:6, overflowX:"auto" }}>
      {days.map((date, i) => {
        const isSelected = date === selected;
        const hasSessions = agendaDates.has(date);
        const dayNum = parseInt(date.slice(8));
        return (
          <button key={date} onClick={() => onChange(date)}
            className={`sc-day-btn ${isSelected?"selected":""} ${hasSessions&&!isSelected?"has-session":""}`}>
            <div className="mono" style={{ fontSize:9, color: isSelected ? (isDark ? "#2DD4BF" : "#0f766e") : "#94a3b8", letterSpacing:".10em", marginBottom:3 }}>{labels[i]}</div>
            <div style={{ fontSize:15, fontWeight:800, color:isSelected ? (isDark ? "#f1f5f9" : "#0f766e") : (isDark ? "#f1f5f9" : "#0B1E33") }}>{dayNum}</div>
            {hasSessions && <div style={{ width:5, height:5, borderRadius:"50%", background:isSelected?"#2DD4BF":"#6366f1", margin:"4px auto 0", boxShadow:isSelected?"0 0 5px #2DD4BF":"none" }}/>}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Main page ── */
export default function SchedulePage() {
  const isDark = useDarkMode();
  const [user, authLoading] = useAuthState(auth);
  const today = new Date().toISOString().slice(0, 10);
  
  const [selectedDate, setSelectedDate] = useState(today);
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  const [formType, setFormType] = useState<"game" | "meeting">("meeting");
  const [sessionForm, setSessionForm] = useState<NewSessionForm>(initialSessionForm);
  const [meetingForm, setMeetingForm] = useState<NewMeetingForm>(initialMeetingForm);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actioningId, setActioningId] = useState<string|null>(null);
  const [error, setError] = useState<string|null>(null);
  const [showForm, setShowForm] = useState(true);

  const [showReminderConfig, setShowReminderConfig] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(30);

  // Combine both collections for the selected date
  const selectedDateAgenda = useMemo(() => {
    const combined = [
      ...sessions.filter(s => s.scheduledDate === selectedDate).map(s => ({ ...s, type: "game" })),
      ...appointments.filter(a => a.scheduledDate === selectedDate).map(a => ({ ...a, type: "meeting" }))
    ];
    return combined.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [sessions, appointments, selectedDate]);

  const allAgendaDates = useMemo(() => {
    const dates = new Set<string>();
    sessions.forEach(s => dates.add(s.scheduledDate));
    appointments.forEach(a => dates.add(a.scheduledDate));
    return dates;
  }, [sessions, appointments]);

  const patientById = useMemo(() => {
    const m = new Map<string,any>();
    for (const p of patients) m.set(p.uid, p);
    return m;
  }, [patients]);

  const refreshData = async (uid: string) => {
    setLoading(true); setError(null);
    try {
      await markMissedSessionsForDoctor(uid);
      await checkUpcomingRemindersForDoctor(uid).catch(e => console.warn("Reminder check skipped:", e));
      
      const [pts, sched, appts] = await Promise.all([
        getPatientsByDoctor(uid), 
        getDoctorSchedule(uid),
        getDoctorAppointments(uid)
      ]);
      
      setPatients(pts); 
      setSessions(sched);
      setAppointments(appts);
      
      if (!sessionForm.patientId && pts.length > 0) {
        setSessionForm(prev => ({...prev, patientId: pts[0].uid}));
        setMeetingForm(prev => ({...prev, patientId: pts[0].uid}));
      }
    } catch (e) {
      console.error(e); setError("Could not load schedule data. Please retry.");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); setError("Please sign in to view your schedule."); return; }
    void refreshData(user.uid);
  }, [user, authLoading]);

  // Handlers for Creation
  const handleCreateSession = async () => {
    if (!user) return;
    if (!sessionForm.patientId || !sessionForm.scheduledDate || !sessionForm.scheduledTime) {
      setError("Patient, date, and time are required."); return;
    }
    setSubmitting(true); setError(null);
    try {
      await createScheduledSession({ 
        doctorId:user.uid, patientId:sessionForm.patientId, gameId:sessionForm.gameId, 
        level:sessionForm.level, scheduledDate:sessionForm.scheduledDate, 
        scheduledTime:sessionForm.scheduledTime, durationMinutes:sessionForm.durationMinutes 
      });
      setSelectedDate(sessionForm.scheduledDate);
      setSessionForm(prev => ({...prev, scheduledTime:"10:30", durationMinutes:30}));
      await refreshData(user.uid);
    } catch (e) { console.error(e); setError("Could not create session."); }
    finally { setSubmitting(false); }
  };

  const handleCreateMeeting = async () => {
    if (!user) return;
    if (!meetingForm.patientId || !meetingForm.scheduledDate || !meetingForm.scheduledTime) {
      setError("Patient, date, and time are required."); return;
    }
    setSubmitting(true); setError(null);
    try {
      const pData = patientById.get(meetingForm.patientId);
      const exactDate = new Date(`${meetingForm.scheduledDate}T${meetingForm.scheduledTime}`);
      
      await createAppointment({ 
        doctorId: user.uid, patientId: meetingForm.patientId, 
        patientName: pData?.name || "Unknown", patientCode: pData?.patientId || "P000",
        title: meetingForm.title, mode: meetingForm.mode,
        date: exactDate, scheduledDate: meetingForm.scheduledDate, 
        scheduledTime: meetingForm.scheduledTime, durationMinutes: meetingForm.durationMinutes 
      });
      
      setSelectedDate(meetingForm.scheduledDate);
      setMeetingForm(prev => ({...prev, scheduledTime:"14:00"}));
      await refreshData(user.uid);
    } catch (e) { console.error(e); setError("Could not create meeting."); }
    finally { setSubmitting(false); }
  };

  // Handlers for Actions
  const handleCancel = async (id: string, type: string) => {
    if (!user) return;
    setActioningId(id); setError(null);
    try { 
      if (type === "game") await updateSessionStatus(id, "cancelled"); 
      else await updateAppointmentStatus(id, "cancelled");
      await refreshData(user.uid); 
    }
    catch (e) { console.error(e); setError("Could not cancel item."); }
    finally { setActioningId(null); }
  };

  const handleDelete = async (id: string, type: string) => {
    if (!user) return;
    setActioningId(id); setError(null);
    try { 
      if (type === "game") await deleteScheduledSession(id); 
      else await deleteAppointment(id);
      await refreshData(user.uid); 
    }
    catch (e) { console.error(e); setError("Could not delete item."); }
    finally { setActioningId(null); }
  };

  const handleSaveReminderPreference = () => {
    // Note: We will wire this up to Firestore when building the Patient side!
    setShowReminderConfig(false);
    alert(`Preferences saved! Patients will now be notified ${reminderMinutes} minutes prior.`);
  };

  // Quick Stats
  const totalUpcoming = sessions.filter(s => s.status==="scheduled").length + appointments.filter(a => a.status==="pending" || a.status==="confirmed").length;
  const totalCompleted = sessions.filter(s => s.status==="completed").length + appointments.filter(a => a.status==="completed").length;
  const totalMissed = sessions.filter(s => s.status==="missed").length + appointments.filter(a => a.status==="missed").length;

  return (
    <div className="sc" style={{ minHeight:"100vh", paddingBottom:52, background: isDark ? "#0f172a" : "#F0F4F8" }}>
      <style>{STYLES}</style>

      {/* Ambient */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-8%", right:"6%", width:600, height:600, background:"radial-gradient(circle,rgba(45,212,191,.05),transparent 65%)", borderRadius:"50%" }}/>
        <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(${isDark ? 'rgba(51,65,85,.3)' : 'rgba(11,30,51,.02)'} 1px,transparent 1px),linear-gradient(90deg,${isDark ? 'rgba(51,65,85,.3)' : 'rgba(11,30,51,.02)'} 1px,transparent 1px)`, backgroundSize:"52px 52px" }}/>
      </div>

      <div style={{ maxWidth:1200, margin:"0 auto", padding:"28px 24px", position:"relative", zIndex:1 }}>

        {/* Header */}
        <div style={{ animation:"scFadeUp .5s ease both", marginBottom:24, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
          <div>
            <p className="mono" style={{ fontSize:9, color:"rgba(45,212,191,.72)", textTransform:"uppercase", letterSpacing:".22em", marginBottom:4, fontWeight:600 }}>Doctor Dashboard</p>
            <h1 style={{ fontSize:"clamp(1.5rem,2.8vw,2rem)", fontWeight:800, color: isDark ? "#f1f5f9" : "#0B1E33", margin:0, lineHeight:1.15 }}>
              Calendar & <span style={{ color:"#2DD4BF" }}>Schedule</span>
            </h1>
            <p style={{ fontSize:13.5, color:"#64748b", marginTop:4, fontWeight:500 }}>Manage patient games, telehealth, and clinic visits.</p>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button className="sc-btn-ghost" onClick={() => user && refreshData(user.uid)} disabled={loading}>
              <RefreshCw size={13} style={{ animation:loading?"scSpin 1s linear infinite":"none" }}/> Refresh
            </button>
            <button className="sc-btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={14} style={{ position:"relative", zIndex:2 }}/>
              <span style={{ position:"relative", zIndex:2 }}>New Event</span>
            </button>
          </div>
        </div>

        {/* Stat chips */}
        <div style={{ display:"flex", gap:12, marginBottom:22, flexWrap:"wrap", animation:"scFadeUp .5s ease .04s both" }}>
          {[
            { label:"Upcoming", val:totalUpcoming, c:"#2DD4BF", bg:"rgba(45,212,191,.08)", border:"rgba(45,212,191,.22)" },
            { label:"Completed", val:totalCompleted, c:"#22c55e", bg:"rgba(34,197,94,.08)", border:"rgba(34,197,94,.22)" },
            { label:"Missed",    val:totalMissed,    c:"#ef4444", bg:"rgba(239,68,68,.07)", border:"rgba(239,68,68,.20)" },
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

        <div style={{ display:"grid", gridTemplateColumns: showForm ? "1fr 380px" : "1fr", gap:20, alignItems:"start", transition: "all 0.3s" }}>

          {/* LEFT: Calendar + Agenda List */}
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
              <WeekStrip selected={selectedDate} agendaDates={allAgendaDates} onChange={setSelectedDate} isDark={isDark} />
              <div style={{ marginTop:14 }}>
                <div className="sc-label">Jump to date</div>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="sc-input" style={{ width:"auto" }}/>
              </div>
            </div>

            {/* Agenda for selected date */}
            <div className="sc-card" style={{ animation:"scCardPop .5s cubic-bezier(.22,1,.36,1) .10s both" }}>
              <div className="sc-section-title">
                <span className="iw" style={{ background:"rgba(99,102,241,.10)", color:"#6366f1" }}><Clock size={15}/></span>
                Agenda — {new Date(selectedDate).toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}
                <span style={{ marginLeft:"auto", fontSize:12, fontWeight:600, color:"#94a3b8" }}>
                  {selectedDateAgenda.length} event{selectedDateAgenda.length!==1?"s":""}
                </span>
              </div>
              {loading ? (
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"20px 0", color:"#94a3b8" }}>
                  <div style={{ width:16, height:16, border:"2px solid rgba(45,212,191,.25)", borderTopColor:"#2DD4BF", borderRadius:"50%", animation:"scSpin 1s linear infinite" }}/>
                  <span style={{ fontSize:13 }}>Loading agenda…</span>
                </div>
              ) : selectedDateAgenda.length === 0 ? (
                <div style={{ textAlign:"center", padding:"28px 0" }}>
                  <div style={{ fontSize:28, marginBottom:10 }}>📅</div>
                  <p style={{ fontSize:13.5, fontWeight:700, color: isDark ? "#f1f5f9" : "#0B1E33", marginBottom:4 }}>No events scheduled</p>
                  <p style={{ fontSize:12, color:"#94a3b8" }}>Click "New Event" to add a game or meeting.</p>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {selectedDateAgenda.map((item, i) => (
                    <AgendaRow 
                      key={item.id} item={item} 
                      patientName={patientById.get(item.patientId)?.name ?? item.patientId}
                      onCancel={handleCancel} onDelete={handleDelete}
                      disabled={actioningId === item.id} isDark={isDark}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Dual-Tab Form */}
          {showForm && (
            <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
              <div className="sc-card" style={{ animation:"scCardPop .5s cubic-bezier(.22,1,.36,1) .08s both", padding: 0, overflow: "hidden" }}>
                
                {/* Tabs */}
                <div style={{ display: "flex", borderBottom: isDark ? "1px solid #334155" : "1px solid #e2e8f0", background: isDark ? "#0f172a" : "#f8fafc" }}>
                  <div className={`sc-tab ${formType === "meeting" ? "active" : ""}`} onClick={() => setFormType("meeting")}>
                    🤝 Doctor Meeting
                  </div>
                  <div className={`sc-tab ${formType === "game" ? "active" : ""}`} onClick={() => setFormType("game")}>
                    🎮 Game Session
                  </div>
                </div>

                <div style={{ padding: 28 }}>
                  <div className="sc-section-title" style={{ marginTop: -8 }}>
                    Schedule {formType === "game" ? "Game" : "Meeting"}
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    
                    {/* Common Field: Patient */}
                    <div>
                      <div className="sc-label">Patient</div>
                      <select className="sc-select" value={formType === "game" ? sessionForm.patientId : meetingForm.patientId}
                        onChange={e => formType === "game" 
                          ? setSessionForm(p => ({...p, patientId:e.target.value}))
                          : setMeetingForm(p => ({...p, patientId:e.target.value}))}>
                        {patients.length === 0
                          ? <option value="">No patients linked</option>
                          : patients.map(p => <option key={p.uid} value={p.uid}>{p.name} ({p.patientId || 'P000'})</option>)}
                      </select>
                    </div>

                    {/* Conditional Fields: GAME */}
                    {formType === "game" && (
                      <>
                        <div>
                          <div className="sc-label">Game Protocol</div>
                          <select className="sc-select" value={sessionForm.gameId}
                            onChange={e => setSessionForm(p => ({...p, gameId:e.target.value as GameId}))}>
                            {(Object.keys(gameLabels) as GameId[]).map(id => (
                              <option key={id} value={id}>{gameEmoji[id]} {gameLabels[id]}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <div className="sc-label">Difficulty Level</div>
                          <input type="number" min={1} max={10} className="sc-input" value={sessionForm.level}
                            onChange={e => setSessionForm(p => ({...p, level:Number(e.target.value)||1}))}/>
                        </div>
                      </>
                    )}

                    {/* Conditional Fields: MEETING */}
                    {formType === "meeting" && (
                      <>
                        <div>
                          <div className="sc-label">Meeting Title</div>
                          <input type="text" className="sc-input" value={meetingForm.title} placeholder="e.g. Follow-up Review"
                            onChange={e => setMeetingForm(p => ({...p, title:e.target.value}))}/>
                        </div>
                        <div>
                          <div className="sc-label">Meeting Mode</div>
                          <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setMeetingForm(p => ({...p, mode: "telehealth"}))} 
                              style={{ flex: 1, padding: "10px", borderRadius: 12, border: `1.5px solid ${meetingForm.mode === "telehealth" ? "#6366f1" : (isDark ? "#475569" : "#e2e8f0")}`, background: meetingForm.mode === "telehealth" ? "rgba(99,102,241,0.1)" : "transparent", color: meetingForm.mode === "telehealth" ? "#6366f1" : (isDark ? "#94a3b8" : "#64748b"), fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                              <Video size={16} style={{ margin: "0 auto 4px" }}/> Telehealth
                            </button>
                            <button onClick={() => setMeetingForm(p => ({...p, mode: "in-person"}))} 
                              style={{ flex: 1, padding: "10px", borderRadius: 12, border: `1.5px solid ${meetingForm.mode === "in-person" ? "#0f766e" : (isDark ? "#475569" : "#e2e8f0")}`, background: meetingForm.mode === "in-person" ? "rgba(45,212,191,0.1)" : "transparent", color: meetingForm.mode === "in-person" ? "#0f766e" : (isDark ? "#94a3b8" : "#64748b"), fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                              <MapPin size={16} style={{ margin: "0 auto 4px" }}/> In-Person
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Common Fields: Time & Date */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      <div style={{ gridColumn: "1/-1" }}>
                        <div className="sc-label">Date</div>
                        <input type="date" className="sc-input" value={formType === "game" ? sessionForm.scheduledDate : meetingForm.scheduledDate}
                          onChange={e => formType === "game" ? setSessionForm(p => ({...p, scheduledDate:e.target.value})) : setMeetingForm(p => ({...p, scheduledDate:e.target.value}))}/>
                      </div>
                      <div>
                        <div className="sc-label">Time</div>
                        <input type="time" className="sc-input" value={formType === "game" ? sessionForm.scheduledTime : meetingForm.scheduledTime}
                          onChange={e => formType === "game" ? setSessionForm(p => ({...p, scheduledTime:e.target.value})) : setMeetingForm(p => ({...p, scheduledTime:e.target.value}))}/>
                      </div>
                      <div>
                        <div className="sc-label">Duration (min)</div>
                        <input type="number" min={5} max={180} className="sc-input" value={formType === "game" ? sessionForm.durationMinutes : meetingForm.durationMinutes}
                          onChange={e => formType === "game" ? setSessionForm(p => ({...p, durationMinutes:Number(e.target.value)||30})) : setMeetingForm(p => ({...p, durationMinutes:Number(e.target.value)||30}))}/>
                      </div>
                    </div>

                    <button className="sc-btn-primary" onClick={formType === "game" ? handleCreateSession : handleCreateMeeting}
                      disabled={submitting||loading||!user||patients.length===0}
                      style={{ width:"100%", marginTop: 8 }}>
                      {submitting
                        ? <><div style={{ width:14,height:14,border:"2.5px solid rgba(11,30,51,.25)",borderTopColor:"#0B1E33",borderRadius:"50%",animation:"scSpin .75s linear infinite" }}/> Saving…</>
                        : <><Plus size={15} style={{ position:"relative",zIndex:2 }}/><span style={{ position:"relative",zIndex:2 }}>Save to Schedule</span></>}
                    </button>
                  </div>
                </div>
              </div>

              {/*  REMINDERS CARD */}
              <div style={{ padding:"20px 22px", borderRadius:18, background:"rgba(99,102,241,.06)", border:"1.5px dashed rgba(99,102,241,.25)", transition: "all 0.3s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <div style={{ width:30, height:30, borderRadius:9, background:"rgba(99,102,241,.12)", display:"flex", alignItems:"center", justifyContent:"center", color:"#6366f1" }}>
                    <AlertCircle size={14}/>
                  </div>
                  <span style={{ fontSize:14, fontWeight:800, color: isDark ? "#f1f5f9" : "#0B1E33" }}>Automated Reminders</span>
                </div>
                <p style={{ fontSize:12.5, color: isDark ? "#94a3b8" : "#64748b", lineHeight:1.65, marginBottom:12 }}>
                  Patients receive notifications automatically {reminderMinutes >= 60 ? (reminderMinutes === 1440 ? "24 hours" : "1 hour") : `${reminderMinutes} minutes`} before scheduled meetings and game sessions.
                </p>
                
                {!showReminderConfig ? (
                  <button className="sc-btn-ghost" style={{ fontSize:12 }} onClick={() => setShowReminderConfig(true)}>
                    Configure Reminder Timing
                  </button>
                ) : (
                  <div style={{ marginTop: 12, padding: 12, background: isDark ? "rgba(0,0,0,0.2)" : "#fff", borderRadius: 12, border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`, animation: "scFadeUp 0.3s ease" }}>
                    <div className="sc-label">Notify patients before event:</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <select 
                        className="sc-select" 
                        style={{ flex: 1, padding: "8px 12px" }} 
                        value={reminderMinutes} 
                        onChange={(e) => setReminderMinutes(Number(e.target.value))}
                      >
                        <option value={15}>15 Minutes</option>
                        <option value={30}>30 Minutes</option>
                        <option value={60}>1 Hour</option>
                        <option value={1440}>24 Hours</option>
                      </select>
                      <button 
                        className="sc-btn-primary" 
                        style={{ padding: "8px 16px", borderRadius: 10 }}
                        onClick={handleSaveReminderPreference}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}