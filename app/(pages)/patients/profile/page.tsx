"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User as UserIcon, Mail, Phone, PenLine, ClipboardList,
  Calendar, Loader2, CheckCircle2, Camera, X, Zap, Flame,
  Brain, Activity, Shield, ChevronRight, LogOut, Heart, Lock,
} from "lucide-react";
import { auth, db, storage } from "../../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile, type User } from "firebase/auth";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

interface PatientProfile {
  name: string; email: string; phone: string;
  goals: string; bio: string; condition: string;
  affectedSide: string; streak: number; totalXp: number;
  assignedProtocol: string; nextAppointment: string;
  profilePictureUrl: string; unlockedLevels: number[];
  completedSessions: number; joinedAt: string;
}

const EMPTY: PatientProfile = {
  name:"", email:"", phone:"", goals:"", bio:"", condition:"",
  affectedSide:"", streak:0, totalXp:0, assignedProtocol:"Not Assigned",
  nextAppointment:"—", profilePictureUrl:"", unlockedLevels:[],
  completedSessions:0, joinedAt:"",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

  .pf * { font-family:'Plus Jakarta Sans',system-ui,sans-serif; box-sizing:border-box; }
  .pf .mono { font-family:'JetBrains Mono',monospace; }

  @keyframes cardPop {
    from { opacity:0; transform:translateY(16px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(22px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes barShimmer {
    0%   { transform:translateX(-100%); }
    100% { transform:translateX(250%); }
  }
  @keyframes headerShine {
    0%   { transform:translateX(-200%) skewX(-15deg); }
    100% { transform:translateX(400%)  skewX(-15deg); }
  }
  @keyframes dotBlink {
    0%,100% { opacity:1; } 50% { opacity:0.25; }
  }
  @keyframes xpFill { from { width:0; } }
  @keyframes glow {
    0%,100% { box-shadow:0 0 0 0 rgba(45,212,191,0.35); }
    50%     { box-shadow:0 0 0 8px rgba(45,212,191,0); }
  }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes shimmerSlide {
    0%   { transform:translateX(-200%); }
    100% { transform:translateX(300%);  }
  }

  .pf-card {
    background:#fff; border-radius:22px;
    border:1px solid rgba(226,232,240,0.9);
    box-shadow:0 2px 18px rgba(11,30,51,0.055);
    transition:transform 0.28s cubic-bezier(0.22,1,0.36,1), box-shadow 0.28s ease;
  }

  .pf-input {
    width:100%; background:#f8fafc;
    border:1.5px solid rgba(226,232,240,0.8);
    color:#0B1E33; padding:10px 12px; font-size:14px;
    border-radius:10px; outline:none;
    transition:border-color .25s, background .25s;
    font-family:'Plus Jakarta Sans',system-ui,sans-serif;
    resize:none; font-weight:500;
  }
  .pf-input:focus { border-color:#2DD4BF; background:#f0fdfb; }
  .pf-input:disabled { opacity:.5; cursor:not-allowed; background:#f1f5f9; }
  .pf-input::placeholder { color:#94a3b8; font-weight:400; }

  .pf-select {
    width:100%; background:#f8fafc;
    border:1.5px solid rgba(226,232,240,0.8);
    color:#0B1E33; padding:10px 36px 10px 12px; font-size:14px;
    border-radius:10px; outline:none; appearance:none; cursor:pointer;
    font-family:'Plus Jakarta Sans',system-ui,sans-serif; font-weight:500;
    transition:border-color .25s;
  }
  .pf-select:focus { border-color:#2DD4BF; background:#f0fdfb; }

  .pf-save-btn {
    position:relative; overflow:hidden; cursor:pointer;
    display:flex; align-items:center; justify-content:center; gap:8px;
    width:100%; padding:15px; border-radius:14px;
    font-family:'JetBrains Mono',monospace;
    font-size:13px; letter-spacing:.10em; font-weight:700; text-transform:uppercase;
    background:#0B1E33; color:#2DD4BF;
    border:1.5px solid rgba(45,212,191,0.35);
    transition:all .3s ease; outline:none;
  }
  .pf-save-btn::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(90deg,transparent,rgba(45,212,191,0.12),transparent);
    animation:headerShine 2.8s ease-in-out infinite;
  }
  .pf-save-btn:hover:not(:disabled) {
    background:#112840; box-shadow:0 8px 28px rgba(45,212,191,0.22);
    transform:translateY(-2px);
  }
  .pf-save-btn:disabled { opacity:.45; cursor:not-allowed; }

  .fl { font-family:'JetBrains Mono',monospace; font-size:9px; font-weight:700;
    text-transform:uppercase; letter-spacing:.18em; margin-bottom:6px;
    display:flex; align-items:center; justify-content:space-between; color:#64748b; }
  .fl-edit { color:#2DD4BF; font-size:8px; display:flex; align-items:center; gap:3px; }

  .sep { height:1px; background:rgba(226,232,240,0.8); margin:20px 0; }

  .toast {
    position:fixed; bottom:28px; right:28px; z-index:9999;
    background:#0B1E33; border:1px solid rgba(45,212,191,0.3);
    border-radius:14px; padding:13px 20px;
    display:flex; align-items:center; gap:10px;
    box-shadow:0 8px 32px rgba(11,30,51,0.22);
    animation:fadeUp .35s cubic-bezier(.22,1,.36,1);
  }

  .stat-chip {
    display:flex; align-items:center; gap:6px; padding:6px 12px;
    border-radius:10px; background:#f8fafc;
    border:1px solid rgba(226,232,240,0.9);
  }

  .xp-bar-track {
    height:7px; background:rgba(11,30,51,0.07); border-radius:99px; overflow:hidden;
  }
  .xp-bar-fill {
    height:100%; border-radius:99px;
    background:linear-gradient(90deg,#14b8a6,#2DD4BF);
    box-shadow:0 0 10px rgba(45,212,191,0.45);
    animation:xpFill 1.4s cubic-bezier(.22,1,.36,1) .3s both;
    position:relative;
  }
  .xp-bar-fill::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent);
    animation:barShimmer 2.2s ease-in-out infinite;
  }

  .avatar-ring { animation:glow 3s ease-in-out infinite; }
`;

export default function PatientProfilePage() {
  const router = useRouter();
  const [user, setUser]                   = useState<User | null>(null);
  const [data, setData]                   = useState<PatientProfile>(EMPTY);
  const [draft, setDraft]                 = useState<PatientProfile>(EMPTY);
  const [isLoading, setIsLoading]         = useState(true);
  const [isSaving, setIsSaving]           = useState(false);
  const [isUploading, setIsUploading]     = useState(false);
  const [toast, setToast]                 = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u: User | null) => {
      if (!u) { router.replace("/auth/patient/signin"); return; }
      setUser(u);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setIsLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const raw  = snap.exists() ? snap.data() : {};
        const g    = raw.gamification || {};
        const profile: PatientProfile = {
          name:              raw.name                || user.displayName || "",
          email:             raw.email               || user.email       || "",
          phone:             raw.phone               || "",
          goals:             raw.goals               || "",
          bio:               raw.bio                 || "",
          condition:         raw.condition           || "",
          affectedSide:      raw.affectedSide        || "",
          streak:            g.currentStreak         || 0,
          totalXp:           g.totalXp               || 0,
          assignedProtocol:  raw.assignedProtocol    || "Not Assigned",
          nextAppointment:   raw.nextAppointment     || "—",
          profilePictureUrl: raw.profilePictureUrl   || user.photoURL    || "", 
          unlockedLevels:    g.unlockedLevels        || [],
          completedSessions: raw.completedSessions   || 0,
          joinedAt:          raw.createdAt?.toDate?.()?.toISOString?.() || "",
        };
        setData(profile); setDraft(profile);
        if (profile.profilePictureUrl) setAvatarPreview(profile.profilePictureUrl);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    })();
  }, [user]);

  const set = useCallback((k: keyof PatientProfile) =>
    (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
      setDraft(p => ({...p, [k]: e.target.value})), []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !user) return;
    setIsUploading(true);
    try {
      setAvatarPreview(URL.createObjectURL(file));
      const ref = storageRef(storage, `avatars/${user.uid}`);
      await uploadBytes(ref, file);
      const url = await getDownloadURL(ref);
      await Promise.all([
        updateDoc(doc(db, "users", user.uid), { profilePictureUrl: url }),
        updateProfile(user, { photoURL: url }),
      ]);
      setDraft(p => ({...p, profilePictureUrl: url}));
      showToast("Profile picture updated!");
    } catch (err) { console.error(err); showToast("Upload failed — check Storage rules."); }
    finally { setIsUploading(false); }
  };

  const handleSave = async () => {
    if (!user) return; setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: draft.name, phone: draft.phone,
        goals: draft.goals, bio: draft.bio,
        affectedSide: draft.affectedSide,
      });
      if (draft.name !== data.name) await updateProfile(user, { displayName: draft.name });
      setData(draft); showToast("Changes saved!");
    } catch (err) { console.error(err); showToast("Save failed — try again."); }
    finally { setIsSaving(false); }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const hasChanges =
    draft.name          !== data.name        || draft.phone       !== data.phone ||
    draft.goals         !== data.goals       || draft.bio         !== data.bio   ||
    draft.affectedSide  !== data.affectedSide;

  const XP_CAP = 5000;
  const xpPct  = Math.min(100, (draft.totalXp / XP_CAP) * 100);

  if (isLoading) return (
    <div className="pf" style={{minHeight:"100vh",background:"#F0F4F8",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{CSS}</style>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
        <div style={{width:40,height:40,borderRadius:"50%",border:"3px solid rgba(45,212,191,0.2)",borderTopColor:"#2DD4BF",animation:"spin 1s linear infinite"}}/>
        <div className="mono" style={{fontSize:9,color:"rgba(45,212,191,0.6)",letterSpacing:".38em",textTransform:"uppercase"}}>Loading Profile</div>
      </div>
    </div>
  );

  return (
    <div className="pf" style={{minHeight:"100vh",background:"#F0F4F8",paddingBottom:52}}>
      <style>{CSS}</style>

      {/* Ambient */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-8%",right:"8%",width:700,height:700,background:"radial-gradient(circle,rgba(45,212,191,0.055) 0%,transparent 65%)",borderRadius:"50%"}}/>
        <div style={{position:"absolute",bottom:"-5%",left:"4%",width:500,height:500,background:"radial-gradient(circle,rgba(139,92,246,0.04) 0%,transparent 65%)",borderRadius:"50%"}}/>
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(11,30,51,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(11,30,51,0.022) 1px,transparent 1px)",backgroundSize:"52px 52px"}}/>
      </div>

      <main style={{maxWidth:1200,margin:"0 auto",padding:"28px 24px",position:"relative",zIndex:1}}>

        {/* ── PAGE HEADER ── */}
        <div style={{animation:"fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both",background:"#fff",borderRadius:22,padding:"20px 28px",marginBottom:24,border:"1.5px solid rgba(45,212,191,0.22)",boxShadow:"0 4px 32px rgba(11,30,51,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-30,left:-30,width:180,height:180,background:"radial-gradient(circle,rgba(45,212,191,0.08),transparent 70%)"}}/>
          <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
            <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,transparent,rgba(45,212,191,0.06),transparent)",animation:"headerShine 4s ease-in-out infinite"}}/>
          </div>
          <div style={{position:"relative",zIndex:2}}>
            <p className="mono" style={{fontSize:9.5,color:"rgba(45,212,191,0.7)",textTransform:"uppercase",letterSpacing:"0.20em",marginBottom:4,fontWeight:600}}>Patient Dashboard</p>
            <h1 style={{fontSize:"clamp(1.5rem,2.6vw,2rem)",fontWeight:800,color:"#0B1E33",margin:0,lineHeight:1.15}}>
              My <span style={{color:"#2DD4BF"}}>Profile</span>
            </h1>
            <p style={{fontSize:13,color:"#94a3b8",marginTop:5,fontWeight:500}}>
              <span style={{color:"#2DD4BF",fontWeight:700}}>{draft.unlockedLevels.length} levels</span> unlocked ·{" "}
              <span style={{color:"#8b5cf6",fontWeight:700}}>{draft.totalXp} XP</span> earned
            </p>
          </div>
          <button onClick={() => auth.signOut().then(() => router.replace("/"))}
            style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",borderRadius:12,background:"rgba(11,30,51,0.06)",border:"1px solid rgba(11,30,51,0.12)",color:"#64748b",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600,transition:"all .2s",zIndex:2}}
            onMouseEnter={e=>(e.currentTarget.style.borderColor="rgba(239,68,68,0.35)")}
            onMouseLeave={e=>(e.currentTarget.style.borderColor="rgba(11,30,51,0.12)")}>
            <LogOut size={13}/> Sign Out
          </button>
        </div>

        {/* ── AVATAR HERO STRIP ── */}
        <div className="pf-card" style={{padding:"24px 28px",marginBottom:22,display:"flex",alignItems:"center",gap:24,flexWrap:"wrap",animation:"cardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.05s both",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:"#2DD4BF",boxShadow:"0 0 12px rgba(45,212,191,0.5)"}}/>
          {/* Avatar */}
          <div style={{position:"relative",flexShrink:0}}>
            <div className="avatar-ring" style={{width:96,height:96,borderRadius:20,border:"2px solid #2DD4BF",background:"rgba(45,212,191,0.08)",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                : <UserIcon size={36} color="rgba(45,212,191,0.55)"/>}
              {isUploading && (
                <div style={{position:"absolute",inset:0,background:"rgba(255,255,255,0.8)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Loader2 size={20} color="#2DD4BF" style={{animation:"spin 1s linear infinite"}}/>
                </div>
              )}
            </div>
            <button onClick={() => fileRef.current?.click()}
              style={{position:"absolute",bottom:-8,right:-8,width:30,height:30,borderRadius:"50%",background:"#0B1E33",border:"2px solid #2DD4BF",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"background .2s"}}
              onMouseEnter={e=>(e.currentTarget.style.background="#2DD4BF")}
              onMouseLeave={e=>(e.currentTarget.style.background="#0B1E33")}>
              <Camera size={12} color="#2DD4BF"/>
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleAvatarChange}/>
          </div>
          {/* Name + stats */}
          <div style={{flex:1,minWidth:220}}>
            <h2 style={{fontSize:"clamp(1.3rem,2.8vw,1.9rem)",fontWeight:800,color:"#0B1E33",margin:"0 0 3px",letterSpacing:"-0.01em"}}>{draft.name||"Patient"}</h2>
            <div className="mono" style={{fontSize:9,color:"#94a3b8",letterSpacing:".16em",textTransform:"uppercase",marginBottom:12}}>
              {draft.condition||"Condition not set"} · {draft.email}
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {[
                {icon:<Flame size={12}/>,  val:draft.streak,                 label:"Streak",   c:"#f59e0b"},
                {icon:<Zap size={12}/>,    val:draft.totalXp,                 label:"Total XP", c:"#2DD4BF"},
                {icon:<Brain size={12}/>,  val:draft.unlockedLevels.length,   label:"Levels",   c:"#8b5cf6"},
                {icon:<Activity size={12}/>,val:draft.completedSessions,      label:"Sessions", c:"#22c55e"},
              ].map(s => (
                <div key={s.label} className="stat-chip">
                  <span style={{color:s.c}}>{s.icon}</span>
                  <span style={{fontSize:13,fontWeight:800,color:"#0B1E33"}}>{s.val}</span>
                  <span className="mono" style={{fontSize:8,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".10em"}}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 420px",gap:22,alignItems:"start"}}>

          {/* LEFT: forms */}
          <div style={{display:"flex",flexDirection:"column",gap:18}}>

            {/* Personal Info */}
            <div className="pf-card" style={{padding:28,animation:"cardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.10s both"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}>
                <div style={{width:34,height:34,borderRadius:10,background:"rgba(45,212,191,0.12)",display:"flex",alignItems:"center",justifyContent:"center",color:"#2DD4BF"}}><UserIcon size={16}/></div>
                <div>
                  <div style={{fontSize:15,fontWeight:800,color:"#0B1E33"}}>Personal Info</div>
                  <div className="mono" style={{fontSize:9,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.14em",marginTop:1}}>Edit your details below</div>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div style={{gridColumn:"1/-1"}}>
                  <div className="fl">Full Name <span className="fl-edit"><PenLine size={8}/>editable</span></div>
                  <input className="pf-input" value={draft.name} onChange={set("name")} placeholder="Your full name"/>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <div className="fl">Email Address <span style={{color:"#94a3b8",fontSize:8}}>read-only</span></div>
                  <div style={{position:"relative"}}>
                    <input className="pf-input" value={draft.email} disabled style={{paddingLeft:36}}/>
                    <Mail size={13} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}/>
                  </div>
                </div>
                <div>
                  <div className="fl">Phone <span className="fl-edit"><PenLine size={8}/>editable</span></div>
                  <div style={{position:"relative"}}>
                    <input className="pf-input" value={draft.phone} onChange={set("phone")} placeholder="+94 77 000 0000" style={{paddingLeft:36}}/>
                    <Phone size={13} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}/>
                  </div>
                </div>
                <div>
                  <div className="fl">Condition <span style={{color:"#94a3b8",fontSize:8,display:"flex",alignItems:"center",gap:3}}><Lock size={8}/>doctor sets this</span></div>
                  <input className="pf-input" value={draft.condition||"Not set"} disabled/>
                </div>
              </div>

              <div className="sep"/>

              <div>
                <div className="fl">Affected Side <span className="fl-edit"><PenLine size={8}/>editable</span></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                  {["Left","Right","Both"].map(s => (
                    <button key={s} onClick={() => setDraft(p=>({...p,affectedSide:s}))}
                      style={{padding:"11px 0",borderRadius:11,fontSize:12,cursor:"pointer",fontWeight:700,
                        border:`1.5px solid ${draft.affectedSide===s?"#2DD4BF":"rgba(226,232,240,0.9)"}`,
                        background:draft.affectedSide===s?"rgba(45,212,191,0.08)":"#f8fafc",
                        color:draft.affectedSide===s?"#2DD4BF":"#64748b",
                        transition:"all .2s",fontFamily:"'JetBrains Mono',monospace",letterSpacing:".06em",
                        boxShadow:draft.affectedSide===s?"0 0 10px rgba(45,212,191,0.2)":"none"}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Goals */}
            <div className="pf-card" style={{padding:28,animation:"cardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.13s both"}}>
              <div className="fl" style={{marginBottom:10}}>Recovery Goals <span className="fl-edit"><PenLine size={8}/>editable</span></div>
              <textarea className="pf-input" rows={3} value={draft.goals} onChange={set("goals")} placeholder="What do you want to achieve with ReViveX?"/>
            </div>

            {/* Bio */}
            <div className="pf-card" style={{padding:28,animation:"cardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.16s both"}}>
              <div className="fl" style={{marginBottom:10}}>About Me <span className="fl-edit"><PenLine size={8}/>editable</span></div>
              <textarea className="pf-input" rows={4} value={draft.bio} onChange={set("bio")} placeholder="Tell your care team a little about yourself…"/>
            </div>

            {/* Save */}
            <div style={{animation:"cardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.20s both"}}>
              <button className="pf-save-btn" onClick={handleSave} disabled={!hasChanges||isSaving}>
                {isSaving
                  ? <><Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/> Saving…</>
                  : <><CheckCircle2 size={16}/> Save Changes</>}
              </button>
              {!hasChanges && <div className="mono" style={{textAlign:"center",marginTop:8,fontSize:8,color:"#94a3b8",letterSpacing:".18em"}}>NO UNSAVED CHANGES</div>}
            </div>
          </div>

          {/* RIGHT: stats sidebar */}
          <div style={{display:"flex",flexDirection:"column",gap:18}}>

            {/* XP + Streak dark card */}
            <div style={{animation:"cardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.11s both",background:"#0B1E33",borderRadius:22,border:"1px solid rgba(45,212,191,0.10)",boxShadow:"0 8px 36px rgba(11,30,51,0.18)",padding:"24px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(45,212,191,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(45,212,191,0.04) 1px,transparent 1px)",backgroundSize:"32px 32px"}}/>
              <div style={{position:"relative",zIndex:2}}>
                <div className="mono" style={{fontSize:9,color:"rgba(45,212,191,0.55)",letterSpacing:".28em",textTransform:"uppercase",marginBottom:16}}>Progress</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
                  {[
                    {emoji:"🔥",label:"Streak",val:draft.streak,unit:"DAYS",   c:"#f59e0b"},
                    {emoji:"⚡",label:"XP",     val:draft.totalXp,unit:"POINTS",c:"#2DD4BF"},
                  ].map(s => (
                    <div key={s.label} style={{padding:"16px",borderRadius:16,background:`${s.c}12`,border:`1px solid ${s.c}20`}}>
                      <div className="mono" style={{fontSize:8,color:`${s.c}bb`,textTransform:"uppercase",letterSpacing:".16em",marginBottom:6}}>{s.emoji} {s.label}</div>
                      <div style={{fontSize:"2.4rem",fontWeight:800,color:s.c,lineHeight:1,textShadow:`0 0 20px ${s.c}50`}}>{s.val}</div>
                      <div className="mono" style={{fontSize:7,color:"rgba(255,255,255,0.25)",marginTop:3}}>{s.unit}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                  <span className="mono" style={{fontSize:8,color:"rgba(255,255,255,0.28)",textTransform:"uppercase",letterSpacing:".14em"}}>XP Progress</span>
                  <span className="mono" style={{fontSize:8,color:"#2DD4BF",fontWeight:700}}>{draft.totalXp} / {XP_CAP}</span>
                </div>
                <div className="xp-bar-track">
                  <div className="xp-bar-fill" style={{width:`${xpPct}%`}}/>
                </div>
                <div style={{marginTop:12,display:"flex",justifyContent:"space-between"}}>
                  <span className="mono" style={{fontSize:8,color:"rgba(139,92,246,0.7)",letterSpacing:".10em"}}>{draft.unlockedLevels.length}/5 LEVELS</span>
                  <span className="mono" style={{fontSize:8,color:"rgba(34,197,94,0.7)",letterSpacing:".10em"}}>{draft.completedSessions} SESSIONS</span>
                </div>
              </div>
            </div>

            {/* Clinical */}
            <div className="pf-card" style={{padding:24,animation:"cardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.13s both"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
                <div style={{width:34,height:34,borderRadius:10,background:"rgba(45,212,191,0.12)",display:"flex",alignItems:"center",justifyContent:"center",color:"#2DD4BF"}}><ClipboardList size={16}/></div>
                <div style={{fontSize:15,fontWeight:800,color:"#0B1E33"}}>Clinical Info</div>
              </div>
              {[
                {icon:<ClipboardList size={15}/>, label:"Assigned Protocol", val:draft.assignedProtocol, c:"#2DD4BF"},
                {icon:<Calendar size={15}/>,       label:"Next Appointment",  val:draft.nextAppointment,   c:"#8b5cf6"},
                {icon:<Heart size={15}/>,         label:"Condition",         val:draft.condition||"Not set", c:"#ef4444"},
              ].map(item => (
                <div key={item.label} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid rgba(226,232,240,0.7)"}}>
                  <div style={{width:34,height:34,borderRadius:10,flexShrink:0,background:`${item.c}12`,border:`1px solid ${item.c}20`,display:"flex",alignItems:"center",justifyContent:"center",color:item.c}}>{item.icon}</div>
                  <div>
                    <div className="mono" style={{fontSize:8,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".14em",marginBottom:2}}>{item.label}</div>
                    <div style={{color:"#0B1E33",fontSize:13,fontWeight:600}}>{item.val}</div>
                  </div>
                </div>
              ))}
              {draft.joinedAt && (
                <div className="mono" style={{marginTop:12,fontSize:8,color:"#cbd5e1",letterSpacing:".12em"}}>
                  MEMBER SINCE · {new Date(draft.joinedAt).toLocaleDateString("en-US",{month:"long",year:"numeric"})}
                </div>
              )}
            </div>

            {/* Level map */}
            <div className="pf-card" style={{padding:24,animation:"cardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.16s both"}}>
              <div style={{fontSize:14,fontWeight:800,color:"#0B1E33",marginBottom:14}}>Level Map</div>
              <div style={{display:"flex",gap:8}}>
                {[1,2,3,4,5].map(lvl => {
                  const done = draft.unlockedLevels.includes(lvl);
                  return (
                    <div key={lvl} style={{flex:1,height:54,borderRadius:12,
                      background:done?"rgba(45,212,191,0.08)":"#f8fafc",
                      border:`1.5px solid ${done?"rgba(45,212,191,0.35)":"rgba(226,232,240,0.9)"}`,
                      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:5,
                      boxShadow:done?"0 0 12px rgba(45,212,191,0.15)":"none",transition:"all .3s"}}>
                      <div style={{fontSize:"1rem",fontWeight:800,lineHeight:1,color:done?"#2DD4BF":"#cbd5e1"}}>{lvl}</div>
                      <div style={{width:6,height:6,borderRadius:"50%",background:done?"#2DD4BF":"#e2e8f0",boxShadow:done?"0 0 7px #2DD4BF":"none"}}/>
                    </div>
                  );
                })}
              </div>
              <div className="mono" style={{marginTop:12,fontSize:9,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".14em",textAlign:"center"}}>
                {draft.unlockedLevels.length} of 5 levels unlocked
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="toast">
          <CheckCircle2 size={16} color="#2DD4BF"/>
          <span style={{color:"rgba(255,255,255,0.85)",fontSize:13,fontWeight:500}}>{toast}</span>
          <button onClick={() => setToast("")} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.3)",marginLeft:6}}><X size={13}/></button>
        </div>
      )}
    </div>
  );
}