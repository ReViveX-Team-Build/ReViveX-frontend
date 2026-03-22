"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Bell, ChevronDown, X, Activity, Stethoscope, 
  Clock, TrendingUp, CheckCircle2, XCircle, Settings, LogOut, User as UserIcon, Video, Gamepad2, Calendar
} from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/app/lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

// ─── CSS ──────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

  .dtb * { font-family:'Plus Jakarta Sans',system-ui,sans-serif; box-sizing:border-box; }
  .dtb .mono { font-family:'JetBrains Mono',monospace; }

  @keyframes tbSlideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes tbFadeIn { from { opacity:0; transform:translateY(4px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes notifDrop { from { opacity:0; transform:translateY(-12px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes pulseDot { 0%,100% { box-shadow:0 0 0 0 rgba(45,212,191,0.6); } 50% { box-shadow:0 0 0 5px rgba(45,212,191,0); } }
  @keyframes glowPulse { 0%,100% { box-shadow:0 0 0 0 rgba(45,212,191,0.35); } 50% { box-shadow:0 0 0 8px rgba(45,212,191,0); } }
  @keyframes notifItemIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
  @keyframes suggItemIn { from { opacity:0; transform:translateX(-6px); } to { opacity:1; transform:translateX(0); } }

  .dtb-search-input { width:100%; padding:10px 14px 10px 42px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.10); border-radius:14px; color:#fff; font-size:13.5px; font-weight:500; transition:all 0.25s ease; outline:none; }
  .dtb-search-input::placeholder { color:rgba(255,255,255,0.28); }
  .dtb-search-input:focus { background:rgba(255,255,255,0.09); border-color:rgba(45,212,191,0.45); box-shadow:0 0 0 3px rgba(45,212,191,0.10); }

  .dtb-icon-btn { position:relative; width:40px; height:40px; border-radius:12px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.55); transition:all 0.22s ease; }
  .dtb-icon-btn:hover { background:rgba(255,255,255,0.10); color:#fff; box-shadow:0 4px 16px rgba(0,0,0,0.2); }

  .dtb-profile-btn { display:flex; align-items:center; gap:10px; padding:6px 10px 6px 6px; border-radius:16px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04); cursor:pointer; transition:all 0.22s ease; }
  .dtb-profile-btn:hover { background:rgba(255,255,255,0.08); border-color:rgba(45,212,191,0.25); box-shadow:0 4px 20px rgba(0,0,0,0.2); }

  .dtb-dropdown { position:absolute; top:calc(100% + 10px); right:0; width:360px; z-index:600; background:linear-gradient(160deg,#0d2442,#0B1E33); border:1px solid rgba(255,255,255,0.09); border-radius:20px; box-shadow:0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(45,212,191,0.06); animation:notifDrop 0.22s cubic-bezier(0.22,1,0.36,1) both; overflow:hidden; }
  .dtb-notif-item { display:flex; flex-direction:column; gap:8px; padding:16px; border-bottom:1px solid rgba(255,255,255,0.06); transition:background 0.18s ease; animation:notifItemIn 0.3s cubic-bezier(0.22,1,0.36,1) both; }
  .dtb-notif-item:last-child { border-bottom:none; }
  .dtb-notif-item:hover { background:rgba(255,255,255,0.03); }

  .dtb-suggestion { display:flex; align-items:center; gap:12px; padding:10px 14px; border-radius:12px; cursor:pointer; transition:all 0.18s ease; animation:suggItemIn 0.3s cubic-bezier(0.22,1,0.36,1) both; }
  .dtb-suggestion:hover { background:rgba(45,212,191,0.08); }

  .dtb-profile-dropdown { position:absolute; top:calc(100% + 10px); right:0; width:240px; z-index:600; background:linear-gradient(160deg,#0d2442,#0B1E33); border:1px solid rgba(255,255,255,0.09); border-radius:20px; box-shadow:0 20px 60px rgba(0,0,0,0.45); animation:notifDrop 0.22s cubic-bezier(0.22,1,0.36,1) both; overflow:hidden; padding:8px; }
  .dtb-menu-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:12px; font-size:13px; font-weight:500; color:rgba(255,255,255,0.65); cursor:pointer; transition:all 0.18s ease; text-decoration:none; border:none; background:transparent; width:100%; text-align:left; }
  .dtb-menu-item:hover { background:rgba(255,255,255,0.07); color:#fff; }

  .action-btn { flex:1; display:flex; align-items:center; justify-content:center; gap:6px; padding:8px; border-radius:10px; font-size:12px; font-weight:700; cursor:pointer; transition:all 0.2s; border:none; }
  .btn-accept { background:rgba(45,212,191,0.15); color:#2DD4BF; border:1px solid rgba(45,212,191,0.3); }
  .btn-accept:hover { background:#2DD4BF; color:#0B1E33; box-shadow:0 4px 15px rgba(45,212,191,0.3); }
  .btn-reject { background:rgba(248,113,113,0.1); color:#f87171; border:1px solid rgba(248,113,113,0.2); }
  .btn-reject:hover { background:#f87171; color:#fff; box-shadow:0 4px 15px rgba(248,113,113,0.3); }
  .btn-primary { background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; border:none; }
  .btn-primary:hover { box-shadow:0 4px 15px rgba(99,102,241,0.4); transform:translateY(-1px); }

  .dtb-mobile-search { position:absolute; top:100%; left:0; right:0; background:linear-gradient(to bottom,#0d2442,#0B1E33); border-bottom:1px solid rgba(45,212,191,0.12); padding:12px 16px; animation:tbSlideDown 0.25s ease both; z-index:500; }
`;

export default function DoctorTopbar() {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Live Data State
  const [doctorProfile, setDoctorProfile] = useState({ name: "Dr. Suresh", role: "Neurologist", initials: "DS" });
  const [reminderSettings, setReminderSettings] = useState({ enabled: true, minutes: 30 });
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [myPatients, setMyPatients] = useState<any[]>([]); 
  const [rawSchedule, setRawSchedule] = useState<any[]>([]);
  const [upcomingAlerts, setUpcomingAlerts] = useState<any[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Doctor Profile & Reminder Settings
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const d = await getDoc(doc(db, "users", user.uid));
      if (d.exists()) {
        const data = d.data();
        const name = data.name || "Doctor";
        const parts = name.trim().split(" ");
        const initials = parts.length >= 2 ? `${parts[0][0]}${parts[parts.length-1][0]}`.toUpperCase() : name.slice(0,2).toUpperCase();
        setDoctorProfile({ name: name, role: data.specialization || "Neurologist", initials });
        
        // Load the settings we configured in the previous step
        if (data.settings) {
          setReminderSettings({
            enabled: data.settings.sessionReminders ?? true,
            minutes: data.settings.reminderMinutes ?? 30
          });
        }
      }
    };
    fetchProfile();
  }, [user]);

  // 2. Real-time Listeners for Patients, Appointments, and Games
  useEffect(() => {
    if (!user) return;
    const unsubs: any[] = [];
    const todayStr = new Date().toISOString().slice(0, 10);
    
    // Pending Patient Requests
    const qPending = query(collection(db, "users"), where("role", "==", "patient"), where("assignedDoctorId", "==", user.uid), where("connectionStatus", "==", "pending"));
    unsubs.push(onSnapshot(qPending, (snapshot) => {
      setPendingRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }));

    // Active Patients
    const qPatients = query(collection(db, "users"), where("role", "==", "patient"), where("assignedDoctorId", "==", user.uid), where("connectionStatus", "==", "accepted"));
    unsubs.push(onSnapshot(qPatients, (snapshot) => {
      setMyPatients(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name || "Unknown", 
        pid: doc.data().patientId || `P${doc.id.slice(-4).toUpperCase()}` 
      })));
    }));

    // Today's Appointments
    const qAppt = query(collection(db, "appointments"), where("doctorId", "==", user.uid), where("scheduledDate", "==", todayStr));
    unsubs.push(onSnapshot(qAppt, snap => {
      const appts = snap.docs.map(d => ({ id: d.id, ...d.data(), eventType: 'meeting' }));
      setRawSchedule(prev => [...prev.filter(p => p.eventType !== 'meeting'), ...appts]);
    }));

    // Today's Game Sessions
    const qGame = query(collection(db, "scheduled_sessions"), where("doctorId", "==", user.uid), where("scheduledDate", "==", todayStr));
    unsubs.push(onSnapshot(qGame, snap => {
      const games = snap.docs.map(d => ({ id: d.id, ...d.data(), eventType: 'game' }));
      setRawSchedule(prev => [...prev.filter(p => p.eventType !== 'game'), ...games]);
    }));

    return () => unsubs.forEach(u => u());
  }, [user]);

  // 3. The "Time Engine" - Checks every 60 seconds if an event is coming up soon
  useEffect(() => {
    if (!reminderSettings.enabled) {
      setUpcomingAlerts([]);
      return;
    }
    
    const checkTimes = () => {
      const now = new Date();
      const alerts = rawSchedule.filter(item => {
         // Ignore cancelled or completed events
         if (item.status === 'completed' || item.status === 'cancelled') return false;
         
         const itemDate = new Date(`${item.scheduledDate}T${item.scheduledTime}`);
         const diffMins = (itemDate.getTime() - now.getTime()) / 60000;
         
         // If it starts in the future, but within the alert window (e.g. 30 mins)
         return diffMins > 0 && diffMins <= reminderSettings.minutes;
      });
      setUpcomingAlerts(alerts);
    };
    
    checkTimes(); // Run immediately
    const iv = setInterval(checkTimes, 60000); // Check every minute
    return () => clearInterval(iv);
  }, [rawSchedule, reminderSettings]);

  // Handlers
  const handleRequestAction = async (patientId: string, action: "accepted" | "rejected") => {
    try {
      await updateDoc(doc(db, "users", patientId), { connectionStatus: action });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  
  const showSuggestions = searchFocused && searchVal.length === 0;
  
  // Create quick access items from real data (FIXED THE 404 PATH)
  const quickAccessList = [
    ...myPatients.slice(0, 2).map(p => ({
      label: p.name,
      sub: `Patient · ${p.pid}`,
      icon: Stethoscope,
      path: `/doctor/patients/${p.id}/profile`
    })),
    { label: "Reports & Analytics", sub: "Page", icon: TrendingUp, path: "/doctor/reports" }, 
    { label: "Today's Schedule", sub: "Dashboard", icon: Clock, path: "/doctor/home" },
  ];

  // Filter real patients based on typing
  const filteredPatients = searchVal.length > 0
    ? myPatients.filter(p => p.name.toLowerCase().includes(searchVal.toLowerCase()) || p.pid.toLowerCase().includes(searchVal.toLowerCase())).map(p => ({
        label: p.name,
        sub: `Patient · ${p.pid}`,
        icon: Stethoscope,
        path: `/doctor/patients/${p.id}/profile`
      }))
    : [];

  const totalNotifications = pendingRequests.length + upcomingAlerts.length;

  return (
    <div className="dtb" style={{ width: "100%", height: 64 }}>
      <style>{STYLES}</style>

      <header className="doc-main-offset" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 400,
        background: scrolled ? "linear-gradient(to right,rgba(11,30,51,0.97),rgba(13,36,66,0.97))" : "linear-gradient(to right,#0B1E33,#0d2442)",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.30)" : "none",
        transition: "background 0.3s ease, box-shadow 0.3s ease",
        padding: "0 24px", height: 64, display: "flex", alignItems: "center", gap: 16,
        animation: "tbSlideDown 0.5s cubic-bezier(0.22,1,0.36,1) both",
      }}>

        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "linear-gradient(to bottom,#2DD4BF,transparent)", opacity: 0.6 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.20)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={16} color="#2DD4BF" className="mx-auto" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1 }}>Dashboard</div>
            <div className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", letterSpacing: "0.12em", marginTop: 2 }}>DOCTOR PORTAL</div>
          </div>
        </div>

        <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

        {/* Desktop Search Area */}
        <div style={{ flex: 1, maxWidth: 420, position: "relative", display: "flex" }} className="dtb-search-desktop">
          <div style={{ position: "relative", width: "100%" }}>
            <Search size={16} color="rgba(255,255,255,0.35)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input className="dtb-search-input" value={searchVal} onChange={e => setSearchVal(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setTimeout(() => setSearchFocused(false), 150)} placeholder="Search patients, sessions…" />
            {searchVal && (
              <button onClick={() => setSearchVal("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>
          {(showSuggestions || filteredPatients.length > 0) && (
            <div style={{ position: "absolute", top: "calc(100% + 10px)", left: 0, right: 0, background: "linear-gradient(160deg,#0d2442,#0B1E33)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 16, padding: "8px", boxShadow: "0 16px 48px rgba(0,0,0,0.4)", animation: "tbFadeIn 0.2s ease both", zIndex: 600 }}>
              {showSuggestions && <div className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.16em", padding: "4px 14px 8px" }}>Quick Access</div>}
              {(showSuggestions ? quickAccessList : filteredPatients).map((s, i) => (
                <div 
                  key={s.label} 
                  className="dtb-suggestion" 
                  style={{ animationDelay: `${i * 0.05}s` }}
                  onClick={() => router.push(s.path)}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(45,212,191,0.10)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2DD4BF", flexShrink: 0 }}><s.icon size={15} /></div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button className="dtb-icon-btn" onClick={() => setMobileSearchOpen(p => !p)} style={{ display: "none" }} aria-label="Search"><Search size={18} /></button>

          {/* Notifications & Reminders */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button className="dtb-icon-btn" onClick={() => { setNotifOpen(p => !p); setProfileOpen(false); }}>
              <Bell size={18} color={totalNotifications > 0 ? "#2DD4BF" : "rgba(255,255,255,0.55)"} />
              {totalNotifications > 0 && (
                <span style={{ position: "absolute", top: 7, right: 7, width: 8, height: 8, borderRadius: "50%", background: "#2DD4BF", border: "2px solid #0B1E33", animation: "pulseDot 2s ease-in-out infinite" }} />
              )}
            </button>

            {notifOpen && (
              <div className="dtb-dropdown">
                <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Action Required & Alerts</div>
                    <div className="mono" style={{ fontSize: 9, color: "#2DD4BF", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 3 }}>
                      {totalNotifications} new items
                    </div>
                  </div>
                </div>
                <div style={{ maxHeight: 360, overflowY: "auto" }}>
                  {totalNotifications === 0 ? (
                    <div style={{ padding: "30px 16px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                      <CheckCircle2 size={24} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">All caught up!</p>
                      <p className="text-xs mt-1">No upcoming sessions or requests.</p>
                    </div>
                  ) : (
                    <>
                      {/* Section: Upcoming Alerts */}
                      {upcomingAlerts.map((alert, i) => {
                        const now = new Date();
                        const itemDate = new Date(`${alert.scheduledDate}T${alert.scheduledTime}`);
                        const minsLeft = Math.round((itemDate.getTime() - now.getTime()) / 60000);
                        
                        return (
                          <div key={alert.id} className="dtb-notif-item" style={{ animationDelay: `${i * 0.06}s`, background: "rgba(99,102,241,0.04)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1" }}>
                                {alert.eventType === 'meeting' ? <Video size={16} /> : <Gamepad2 size={16} />}
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{alert.title || "Game Session"}</div>
                                <div className="mono" style={{ fontSize: 10, color: "#cbd5e1" }}>Patient: {alert.patientName || "Scheduled Patient"}</div>
                                <div className="mono" style={{ fontSize: 10, color: "#f87171", fontWeight: 600, marginTop: 2 }}>Starting in {minsLeft} min</div>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              {alert.eventType === 'meeting' && alert.mode === 'telehealth' ? (
                                <button onClick={() => window.open(`/doctor/meeting/${alert.id}`, "_blank")} className="action-btn btn-primary"><Video size={14}/> Join Call</button>
                              ) : (
                                <button onClick={() => router.push("/doctor/schedule")} className="action-btn btn-accept"><Calendar size={14}/> View Schedule</button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Section: Pending Requests */}
                      {pendingRequests.map((req, i) => (
                        <div key={req.id} className="dtb-notif-item" style={{ animationDelay: `${(upcomingAlerts.length + i) * 0.06}s` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(45,212,191,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2DD4BF", fontWeight: "bold", fontSize: 14 }}>
                              {req.name ? req.name.charAt(0).toUpperCase() : "P"}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{req.name}</div>
                              <div className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Condition: {req.condition || "Unknown"}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => handleRequestAction(req.id, "accepted")} className="action-btn btn-accept"><CheckCircle2 size={14}/> Accept</button>
                            <button onClick={() => handleRequestAction(req.id, "rejected")} className="action-btn btn-reject"><XCircle size={14}/> Decline</button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.08)" }} />

          {/* Profile */}
          <div ref={profileRef} style={{ position: "relative" }}>
            <button className="dtb-profile-btn" onClick={() => { setProfileOpen(p => !p); setNotifOpen(false); }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(135deg,#2DD4BF,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#0B1E33", boxShadow: "0 0 0 2px rgba(45,212,191,0.25)", animation: "glowPulse 3s ease-in-out infinite", flexShrink: 0 }}>
                {doctorProfile.initials}
              </div>
              <div style={{ textAlign: "left" }} className="dtb-profile-text">
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{doctorProfile.name}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", display: "inline-block", boxShadow: "0 0 5px #10b981" }} />
                  {doctorProfile.role}
                </div>
              </div>
              <ChevronDown size={14} color="rgba(255,255,255,0.35)" style={{ transition: "transform 0.22s ease", transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
            </button>

            {profileOpen && (
              <div className="dtb-profile-dropdown">
                <div style={{ padding: "12px 12px 10px", marginBottom: 6, background: "rgba(45,212,191,0.06)", borderRadius: 14, border: "1px solid rgba(45,212,191,0.12)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#2DD4BF,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#0B1E33" }}>{doctorProfile.initials}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{doctorProfile.name}</div>
                      <div className="mono" style={{ fontSize: 9, color: "#2DD4BF", textTransform: "uppercase", letterSpacing: "0.12em" }}>{doctorProfile.role}</div>
                    </div>
                  </div>
                </div>
                
                <button onClick={() => { setProfileOpen(false); router.push("/doctor/profile"); }} className="dtb-menu-item">
                  <UserIcon size={14}/> View Profile
                </button>
                
                <button onClick={() => { setProfileOpen(false); router.push("/doctor/settings"); }} className="dtb-menu-item">
                  <Settings size={14}/> Account Settings
                </button>
                
                <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "6px 0" }} />
                
                <button onClick={() => signOut(auth).then(() => router.replace("/"))} className="dtb-menu-item" style={{ color: "#f87171" }}>
                  <LogOut size={14}/> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="dtb-mobile-search">
            <div style={{ position: "relative" }}>
              <Search size={16} color="rgba(255,255,255,0.35)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <input className="dtb-search-input" placeholder="Search patients, sessions…" autoFocus />
            </div>
          </div>
        )}
      </header>

      <style>{`
        @media (max-width:768px) { .dtb-search-desktop { display:none !important; } .dtb-profile-text { display:none !important; } .dtb-icon-btn[aria-label="Search"] { display:flex !important; } }
        @media (max-width:480px) { header { padding:0 12px !important; } }
      `}</style>
    </div>
  );
}