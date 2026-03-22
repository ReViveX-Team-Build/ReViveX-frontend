"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  Calendar, Clock, CheckCircle2, AlertCircle, XCircle, 
  RefreshCw, Video, MapPin, Play, Gamepad2
} from "lucide-react";
import { auth, db } from "@/app/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"; // 🟢 Added updateDoc & doc
import { useDarkMode } from "@/app/lib/hooks/useDarkMode";

// ─── Constants & Types ───
const gameLabels: Record<string, string> = {
  synapse_racer: "Synapse Racer", rhythm_reef: "Rhythm Reef", grip_surge: "Grip Surge",
  precision_hold: "Precision Hold", stability_core: "Stability Core",
};
const gameEmoji: Record<string, string> = {
  synapse_racer: "🚀", rhythm_reef: "🎵", grip_surge: "💪",
  precision_hold: "🎯", stability_core: "⚖️",
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  .sc * { font-family:'Plus Jakarta Sans',system-ui,sans-serif; box-sizing:border-box; }
  .sc .mono { font-family:'JetBrains Mono',monospace; }

  @keyframes scFadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scCardPop { 0%{opacity:0;transform:translateY(12px) scale(.97)} 100%{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes scSpin { to{transform:rotate(360deg)} }
  @keyframes scRowIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }

  .sc-card {
    border-radius:20px; border:1px solid rgba(226,232,240,0.9);
    box-shadow:0 2px 18px rgba(11,30,51,0.055); padding:28px;
    transition:box-shadow .28s ease; background: #f8fafc;
  }
  .sc-card:hover { box-shadow:0 8px 36px rgba(11,30,51,0.09); }
  
  .dark .sc-card { background:#1e293b; border-color:#334155; box-shadow:0 2px 18px rgba(0,0,0,0.20); }
  .dark .sc-section-title { color:#f1f5f9; }
  .dark .sc-label { color:#94a3b8; }
  .dark .sc-btn-ghost { background:#1e293b; border-color:#334155; color:#94a3b8; }
  .dark .sc-session-row { border-color:#334155; }
  .dark .sc-session-row:hover { background:rgba(15,78,72,0.15); border-color:rgba(45,212,191,.30); }
  .dark .sc-day-btn { background:#1e293b; border-color:#334155; color:#f1f5f9; }
  .dark .sc-day-btn.selected { background:rgba(45,212,191,.15); border-color:#2DD4BF; color:#f1f5f9; }
  .dark .sc-day-btn:hover:not(.selected) { border-color:rgba(45,212,191,.5); }

  .sc-btn-ghost {
    display:inline-flex; align-items:center; gap:6px;
    padding:8px 16px; border-radius:10px; cursor:pointer;
    background:#f1f5f9; border:1.5px solid rgba(203, 213, 225, 0.9);
    font-size:12px; font-weight:700; color:#64748b; transition:all .2s;
  }
  .sc-btn-ghost:hover { border-color:#2DD4BF; color:#0f766e; background:rgba(45,212,191,.05); }

  .sc-btn-play {
    display:inline-flex; align-items:center; gap:6px;
    padding:8px 18px; border-radius:12px; cursor:pointer;
    background:linear-gradient(135deg,#2DD4BF,#0891b2); border:none;
    font-size:12px; font-weight:800; color:#0B1E33; transition:all .2s;
    box-shadow:0 4px 14px rgba(45,212,191,.3);
  }
  .sc-btn-play:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(45,212,191,.4); }

  .sc-btn-call {
    display:inline-flex; align-items:center; gap:6px;
    padding:8px 18px; border-radius:12px; cursor:pointer;
    background:linear-gradient(135deg,#6366f1,#4f46e5); border:none;
    font-size:12px; font-weight:800; color:#fff; transition:all .2s;
    box-shadow:0 4px 14px rgba(99,102,241,.3);
  }
  .sc-btn-call:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(99,102,241,.4); }

  .sc-session-row {
    display:flex; align-items:center; justify-content:space-between; gap:12px;
    padding:16px 20px; border-radius:16px; flex-wrap:wrap;
    border:1.5px solid rgba(226,232,240,.9);
    transition:all .22s; animation:scRowIn .35s cubic-bezier(.22,1,.36,1) both;
  }
  .sc-session-row:hover { border-color:rgba(45,212,191,.30); background:rgba(240,253,250,.6); transform:translateX(3px); }

  .sc-status-scheduled, .sc-status-pending { background:rgba(45,212,191,.10); color:#0f766e; border:1px solid rgba(45,212,191,.28); }
  .sc-status-completed, .sc-status-confirmed { background:rgba(34,197,94,.10); color:#15803d; border:1px solid rgba(34,197,94,.28); }
  .sc-status-missed    { background:rgba(239,68,68,.08); color:#dc2626; border:1px solid rgba(239,68,68,.22); }
  .sc-status-cancelled { background:rgba(148,163,184,.10); color:#475569; border:1px solid rgba(148,163,184,.22); }

  .sc-day-btn {
    flex:1; min-width:60px; padding:10px 8px; border-radius:14px;
    border:1.5px solid rgba(203, 213, 225, 0.9); cursor:pointer;
    transition:all .2s; background:#f8fafc; text-align:center;
  }
  .sc-day-btn.selected { background:rgba(45,212,191,.10); border-color:#2DD4BF; color:#0f766e; transform:translateY(-2px); box-shadow:0 4px 12px rgba(45,212,191,.15); }
  .sc-day-btn.has-session { border-color:rgba(99,102,241,.35); }
  .sc-day-btn:hover:not(.selected) { border-color:#2DD4BF; }

  .sc-input {
    background: #f1f5f9;
    border: 1.5px solid rgba(203, 213, 225, 0.9);
    border-radius: 10px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 600;
    color: #0B1E33;
    transition: all 0.2s;
  }
  .sc-input:focus {
    outline: none;
    border-color: #2DD4BF;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.1);
  }
  .dark .sc-input {
    background: #1e293b;
    border-color: #334155;
    color: #f1f5f9;
  }
  .dark .sc-input:focus {
    border-color: #2DD4BF;
    background: #0f172a;
  }

  .sc-section-title { display:flex; align-items:center; gap:10px; font-size:16px; font-weight:800; color:#0B1E33; margin-bottom:20px; }
  .sc-section-title .iw { width:32px; height:32px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
`;

// ─── Status Badge ───
function StatusBadge({ status }: { status: string }) {
  const cls = `sc-status-${status}`;
  const icons: any = {
    scheduled: <Clock size={10}/>, pending: <Clock size={10}/>,
    completed: <CheckCircle2 size={10}/>, confirmed: <CheckCircle2 size={10}/>,
    missed: <AlertCircle size={10}/>, cancelled: <XCircle size={10}/>,
  };
  return (
    <span className={`mono ${cls}`} style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 12px", borderRadius:99, fontSize:10, fontWeight:800, letterSpacing:".06em", textTransform:"uppercase" }}>
      {icons[status]} {status}
    </span>
  );
}

// ─── Patient Agenda Row ───
function PatientAgendaRow({ item, isDark, router }: { item: any; isDark: boolean; router: any }) {
  const isGame = item.type === "game";
  const isActionable = item.status === "scheduled" || item.status === "confirmed" || item.status === "pending";

  // 🟢 Ping DB when patient joins a meeting
  const handleJoinCall = async () => {
    try {
      await updateDoc(doc(db, "appointments", item.id), { patientJoined: true });
    } catch (e) { console.error("Failed to log join", e); }
    window.open(`/patients/meeting/${item.id}`, "_blank");
  };

  // 🟢 Ping DB when patient starts a game
  const handleStartGame = async () => {
    try {
      await updateDoc(doc(db, "scheduled_sessions", item.id), { patientJoined: true });
    } catch (e) { console.error("Failed to log start", e); }
    router.push(`/games/${item.gameId}?sessionId=${item.id}`);
  };

  return (
    <div className="sc-session-row">
      <div style={{ display:"flex", alignItems:"center", gap:16, flex:1, minWidth:0 }}>
        {/* Icon Badge */}
        <div style={{ 
          width:46, height:46, borderRadius:14, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20,
          background: isGame ? "rgba(45,212,191,.10)" : "rgba(99,102,241,.10)",
          border: isGame ? "1.5px solid rgba(45,212,191,.22)" : "1.5px solid rgba(99,102,241,.22)",
          color: isGame ? "#2DD4BF" : "#6366f1",
          boxShadow: isActionable ? `0 0 15px ${isGame ? 'rgba(45,212,191,.2)' : 'rgba(99,102,241,.2)'}` : 'none'
        }}>
          {isGame ? gameEmoji[item.gameId] || "🎮" : (item.mode === "telehealth" ? <Video size={22}/> : <MapPin size={22}/>)}
        </div>
        
        {/* Info */}
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:800, color: isDark ? "#f1f5f9" : "#0B1E33" }}>
            {isGame ? `${gameLabels[item.gameId] || "Therapy Game"}` : item.title}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:6, flexWrap:"wrap" }}>
            <span className="mono" style={{ fontSize:12, color:"#2DD4BF", fontWeight:700, background:"rgba(45,212,191,.1)", padding:"2px 8px", borderRadius:6 }}>
              {item.scheduledTime}
            </span>
            <span style={{ fontSize:12, color:"#94a3b8" }}>•</span>
            <span style={{ fontSize:12, color: isDark ? "#cbd5e1" : "#475569", fontWeight: 600 }}>
              {isGame ? `Level ${item.level} · ${item.durationMinutes} min` : `${item.durationMinutes} min with Dr.`}
            </span>
            
            {!isGame && (
               <span style={{ fontSize:10, padding: "2px 8px", borderRadius: 6, background: item.mode === "telehealth" ? "rgba(99,102,241,.1)" : "rgba(16,185,129,.1)", color: item.mode === "telehealth" ? "#6366f1" : "#10b981", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em" }}>
                 {item.mode === "telehealth" ? "Telehealth" : "In-Person"}
               </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
        <StatusBadge status={item.status}/>
        
        {/* Play Game Button */}
        {isGame && isActionable && (
          <button onClick={handleStartGame} className="sc-btn-play">
            <Play size={13} fill="#0B1E33" /> Start Game
          </button>
        )}

        {/* Join Call Button */}
        {!isGame && item.mode === "telehealth" && isActionable && (
          <button onClick={handleJoinCall} className="sc-btn-call">
            <Video size={13} /> Join Call
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Week Strip ───
function WeekStrip({ selected, agendaDates, onChange, isDark }: { selected: string; agendaDates: Set<string>; onChange:(d:string)=>void; isDark: boolean; }) {
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
    <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom: 4 }}>
      {days.map((date, i) => {
        const isSelected = date === selected;
        const hasSessions = agendaDates.has(date);
        const dayNum = parseInt(date.slice(8));
        return (
          <button key={date} onClick={() => onChange(date)} className={`sc-day-btn ${isSelected?"selected":""} ${hasSessions&&!isSelected?"has-session":""}`}>
            <div className="mono" style={{ fontSize:10, color: isSelected ? (isDark ? "#2DD4BF" : "#0f766e") : "#94a3b8", letterSpacing:".10em", marginBottom:4, fontWeight:700 }}>{labels[i]}</div>
            <div style={{ fontSize:18, fontWeight:800, color:isSelected ? (isDark ? "#f1f5f9" : "#0f766e") : (isDark ? "#f1f5f9" : "#0B1E33") }}>{dayNum}</div>
            {hasSessions && <div style={{ width:6, height:6, borderRadius:"50%", background:isSelected?"#2DD4BF":"#6366f1", margin:"6px auto 0", boxShadow:isSelected?"0 0 6px #2DD4BF":"none" }}/>}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Page ───
export default function PatientSchedulePage() {
  const isDark = useDarkMode();
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);
  
  const [selectedDate, setSelectedDate] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  }, []);

  const refreshData = async (uid: string) => {
    setLoading(true); setError(null);
    try {
      const sQuery = query(collection(db, "scheduled_sessions"), where("patientId", "==", uid));
      const sSnap = await getDocs(sQuery);
      const aQuery = query(collection(db, "appointments"), where("patientId", "==", uid));
      const aSnap = await getDocs(aQuery);

      const now = new Date();

      // 🟢 THE SMART AUTO-TRACKER: Checks the clock and updates past events
      const processEvents = async (snap: any, collectionName: string, type: string) => {
        const items = [];
        for (const d of snap.docs) {
          const data = d.data();
          let status = data.status;

          // Attempt to parse the event end time securely
          let eventTime = new Date(`${data.scheduledDate}T${data.scheduledTime}`);
          if (isNaN(eventTime.getTime())) {
            eventTime = new Date(`${data.scheduledDate} ${data.scheduledTime}`);
          }

          if (!isNaN(eventTime.getTime())) {
            const duration = data.durationMinutes || 30;
            const endTime = new Date(eventTime.getTime() + duration * 60000);

            // If the current time is past the end time, and it's still marked as pending/scheduled
            if (now > endTime && ["scheduled", "pending", "confirmed"].includes(status)) {
              // If they joined, it's completed. Otherwise, they missed it!
              if (data.patientJoined) {
                status = "completed";
              } else {
                status = "missed";
              }
              // Update the database permanently
              await updateDoc(doc(db, collectionName, d.id), { status });
            }
          }
          items.push({ id: d.id, ...data, status, type });
        }
        return items;
      };

      const games = await processEvents(sSnap, "scheduled_sessions", "game");
      const appts = await processEvents(aSnap, "appointments", "meeting");
      
      setEvents([...games, ...appts]);
    } catch (e) {
      console.error(e); setError("Could not load schedule data. Please retry.");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); setError("Please sign in to view your schedule."); return; }
    void refreshData(user.uid);
  }, [user, authLoading]);

  const selectedDateAgenda = useMemo(() => {
    return events
      .filter(e => e.scheduledDate === selectedDate)
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [events, selectedDate]);

  const allAgendaDates = useMemo(() => {
    const dates = new Set<string>();
    events.forEach(e => dates.add(e.scheduledDate));
    return dates;
  }, [events]);

  const totalUpcoming = events.filter(e => ["scheduled", "pending", "confirmed"].includes(e.status)).length;
  const totalCompleted = events.filter(e => e.status === "completed").length;
  const totalMissed = events.filter(e => e.status === "missed").length;

  return (
    <div className="sc" style={{ minHeight:"100vh", paddingBottom:52, background: isDark ? "#0f172a" : "#F0F4F8" }}>
      <style>{STYLES}</style>

      {/* Ambient */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-8%", right:"6%", width:600, height:600, background:"radial-gradient(circle,rgba(45,212,191,.05),transparent 65%)", borderRadius:"50%" }}/>
        <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(${isDark ? 'rgba(51,65,85,.3)' : 'rgba(11,30,51,.02)'} 1px,transparent 1px),linear-gradient(90deg,${isDark ? 'rgba(51,65,85,.3)' : 'rgba(11,30,51,.02)'} 1px,transparent 1px)`, backgroundSize:"52px 52px" }}/>
      </div>

      <div style={{ maxWidth:1000, margin:"0 auto", padding:"28px 24px", position:"relative", zIndex:1 }}>

        {/* Header */}
        <div style={{ animation:"scFadeUp .5s ease both", marginBottom:30, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
          <div>
            <p className="mono" style={{ fontSize:9, color:"rgba(45,212,191,.72)", textTransform:"uppercase", letterSpacing:".22em", marginBottom:6, fontWeight:700 }}>Patient Portal</p>
            <h1 style={{ fontSize:"clamp(1.8rem,3vw,2.4rem)", fontWeight:800, color: isDark ? "#f1f5f9" : "#0B1E33", margin:0, lineHeight:1.15 }}>
              My <span style={{ color:"#2DD4BF" }}>Schedule</span>
            </h1>
            <p style={{ fontSize:14, color:"#64748b", marginTop:6, fontWeight:500 }}>Join your telehealth meetings and start your prescribed games.</p>
          </div>
          <button className="sc-btn-ghost" onClick={() => user && refreshData(user.uid)} disabled={loading} style={{ padding: "10px 20px" }}>
            <RefreshCw size={14} style={{ animation:loading?"scSpin 1s linear infinite":"none" }}/> Refresh Sync
          </button>
        </div>

        {/* Stat chips */}
        <div style={{ display:"flex", gap:14, marginBottom:28, flexWrap:"wrap", animation:"scFadeUp .5s ease .04s both" }}>
          {[
            { label:"Upcoming", val:totalUpcoming, c:"#2DD4BF", bg:"rgba(45,212,191,.08)", border:"rgba(45,212,191,.22)" },
            { label:"Completed", val:totalCompleted, c:"#22c55e", bg:"rgba(34,197,94,.08)", border:"rgba(34,197,94,.22)" },
            { label:"Missed",    val:totalMissed,    c:"#ef4444", bg:"rgba(239,68,68,.07)", border:"rgba(239,68,68,.20)" },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, minWidth: 120, display:"flex", alignItems:"center", justifyContent: "center", gap:12, padding:"16px 20px", borderRadius:16, background:s.bg, border:`1.5px solid ${s.border}` }}>
              <div style={{ fontSize:28, fontWeight:800, color:s.c, lineHeight:1 }}>{s.val}</div>
              <div className="mono" style={{ fontSize:10, color:s.c, textTransform:"uppercase", letterSpacing:".14em", fontWeight:800 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ marginBottom:20, padding:"16px 20px", background:"rgba(239,68,68,.06)", border:"1px solid rgba(239,68,68,.20)", borderRadius:14, fontSize:14, color:"#dc2626", fontWeight:600, display:"flex", alignItems:"center", gap:10 }}>
            <AlertCircle size={18}/> {error}
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

          {/* Week view */}
          <div className="sc-card" style={{ animation:"scCardPop .5s cubic-bezier(.22,1,.36,1) .06s both", padding: "32px" }}>
            <div className="sc-section-title" style={{ marginBottom: 24 }}>
              <span className="iw" style={{ background:"rgba(45,212,191,.10)", color:"#2DD4BF", width: 38, height: 38, borderRadius: 12 }}><Calendar size={18}/></span>
              <span style={{ fontSize: 18 }}>Week View</span>
              {selectedDate && (
                <span className="mono" style={{ marginLeft:"auto", fontSize:11, color:"#94a3b8", letterSpacing:".14em", background: "rgba(226,232,240,0.4)", padding: "4px 12px", borderRadius: 8, fontWeight: 700 }}>
                  {new Date(selectedDate).toLocaleDateString("en-US",{month:"long",year:"numeric"})}
                </span>
              )}
            </div>
            {selectedDate && <WeekStrip selected={selectedDate} agendaDates={allAgendaDates} onChange={setSelectedDate} isDark={isDark} />}
            <div style={{ marginTop:24, display: "flex", alignItems: "center", gap: 12, background: isDark ? "rgba(0,0,0,0.2)" : "#f8fafc", padding: "12px 16px", borderRadius: 12, width: "fit-content" }}>
              <div className="sc-label" style={{ margin: 0, fontSize: 13 }}>Jump to date:</div>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="sc-input" style={{ width:"auto", padding: "6px 12px" }}/>
            </div>
          </div>

          {/* Agenda for selected date */}
          <div className="sc-card" style={{ animation:"scCardPop .5s cubic-bezier(.22,1,.36,1) .10s both", padding: "32px" }}>
            <div className="sc-section-title" style={{ marginBottom: 24 }}>
              <span className="iw" style={{ background:"rgba(99,102,241,.10)", color:"#6366f1", width: 38, height: 38, borderRadius: 12 }}><Clock size={18}/></span>
              <span style={{ fontSize: 18 }}>
                Agenda — {selectedDate ? new Date(selectedDate).toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"}) : "..."}
              </span>
              <span style={{ marginLeft:"auto", fontSize:13, fontWeight:700, background: "rgba(99,102,241,.08)", padding: "4px 12px", borderRadius: 8, color: "#6366f1" }}>
                {selectedDateAgenda.length} event{selectedDateAgenda.length!==1?"s":""}
              </span>
            </div>
            
            {loading ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent: "center", gap:12, padding:"60px 0", color:"#94a3b8" }}>
                <div style={{ width:24, height:24, border:"3px solid rgba(45,212,191,.25)", borderTopColor:"#2DD4BF", borderRadius:"50%", animation:"scSpin 1s linear infinite" }}/>
                <span style={{ fontSize:15, fontWeight: 600 }}>Syncing your schedule…</span>
              </div>
            ) : selectedDateAgenda.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 0", background: isDark ? "rgba(0,0,0,0.1)" : "#f8fafc", borderRadius: 16, border: isDark ? "1px dashed #334155" : "1px dashed #cbd5e1" }}>
                <div style={{ width: 64, height: 64, background: "rgba(45,212,191,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Calendar size={32} color="#2DD4BF" />
                </div>
                <p style={{ fontSize:16, fontWeight:800, color: isDark ? "#f1f5f9" : "#0B1E33", marginBottom:6 }}>You're free today!</p>
                <p style={{ fontSize:13, color:"#94a3b8", maxWidth: 300, margin: "0 auto", lineHeight: 1.5 }}>No games or meetings are scheduled for this date. Check back later or jump to another day.</p>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {selectedDateAgenda.map((item, i) => (
                  <PatientAgendaRow 
                    key={item.id} item={item} 
                    isDark={isDark} router={router}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}