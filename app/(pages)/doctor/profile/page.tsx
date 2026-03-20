"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User as UserIcon, Mail, Phone, PenLine, Building, 
  Stethoscope, Loader2, CheckCircle2, Camera, X, Shield, 
  Award, Users, LogOut, ArrowLeft
} from "lucide-react";
import { auth, db, storage } from "@/app/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile, type User } from "firebase/auth";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useDarkMode } from "@/app/lib/hooks/useDarkMode";

interface DoctorProfile {
  name: string; email: string; phone: string;
  specialization: string; clinic: string; bio: string;
  profilePictureUrl: string; joinedAt: string;
  totalPatients: number; protocolsSet: number;
}

const EMPTY: DoctorProfile = {
  name:"", email:"", phone:"", specialization:"Neuro Rehabilitation", 
  clinic:"ReViveX Medical Center", bio:"", profilePictureUrl:"", 
  joinedAt:"", totalPatients: 0, protocolsSet: 0,
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

  .dpf * { font-family:'Plus Jakarta Sans',system-ui,sans-serif; box-sizing:border-box; }
  .dpf .mono { font-family:'JetBrains Mono',monospace; }

  @keyframes cardPop {
    from { opacity:0; transform:translateY(16px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(22px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes headerShine {
    0%   { transform:translateX(-200%) skewX(-15deg); }
    100% { transform:translateX(400%)  skewX(-15deg); }
  }
  @keyframes glow {
    0%,100% { box-shadow:0 0 0 0 rgba(45,212,191,0.35); }
    50%     { box-shadow:0 0 0 8px rgba(45,212,191,0); }
  }
  @keyframes spin { to { transform:rotate(360deg); } }

  .dpf-card {
    border-radius:22px;
    transition:transform 0.28s cubic-bezier(0.22,1,0.36,1), box-shadow 0.28s ease;
  }

  .dpf-input {
    width:100%; padding:12px 14px; font-size:14px;
    border-radius:12px; outline:none;
    transition:border-color .25s, background .25s, box-shadow .25s;
    font-family:'Plus Jakarta Sans',system-ui,sans-serif;
    resize:none; font-weight:500;
  }

  .dpf-save-btn {
    position:relative; overflow:hidden; cursor:pointer;
    display:flex; align-items:center; justify-content:center; gap:8px;
    width:100%; padding:15px; border-radius:14px;
    font-family:'JetBrains Mono',monospace;
    font-size:13px; letter-spacing:.10em; font-weight:700; text-transform:uppercase;
    background:#2DD4BF; color:#0B1E33;
    border:none; box-shadow:0 4px 20px rgba(45,212,191,0.3);
    transition:all .3s ease; outline:none;
  }
  .dpf-save-btn::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);
    animation:headerShine 2.8s ease-in-out infinite;
  }
  .dpf-save-btn:hover:not(:disabled) {
    transform:translateY(-2px); box-shadow:0 8px 28px rgba(45,212,191,0.4);
  }
  .dpf-save-btn:disabled { opacity:.5; cursor:not-allowed; background:#94a3b8; box-shadow:none; color:#fff; }
  .dpf-save-btn:disabled::after { display:none; }

  .fl { font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:700;
    text-transform:uppercase; letter-spacing:.18em; margin-bottom:8px;
    display:flex; align-items:center; justify-content:space-between; }
  .fl-edit { color:#2DD4BF; font-size:9px; display:flex; align-items:center; gap:4px; }

  .sep { height:1px; margin:24px 0; }

  .toast {
    position:fixed; bottom:28px; right:28px; z-index:9999;
    background:#0B1E33; border:1px solid rgba(45,212,191,0.3);
    border-radius:14px; padding:13px 20px;
    display:flex; align-items:center; gap:10px;
    box-shadow:0 8px 32px rgba(11,30,51,0.22);
    animation:fadeUp .35s cubic-bezier(.22,1,.36,1);
  }

  .stat-chip {
    display:flex; align-items:center; gap:8px; padding:8px 14px;
    border-radius:12px; 
  }
  .avatar-ring { animation:glow 3s ease-in-out infinite; }

  /* Dark vs Light mode specifics handled via inline styles for perfect contrast */
`;

export default function DoctorProfilePage() {
  const router = useRouter();
  const [user, setUser]           = useState<User | null>(null);
  const [data, setData]           = useState<DoctorProfile>(EMPTY);
  const [draft, setDraft]         = useState<DoctorProfile>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast]         = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const isDark = useDarkMode();

  const dm = isDark ? {
    bg: "#0f172a",
    cardBg: "#1e293b",
    cardBorder: "rgba(51,65,85,0.8)",
    text: "#f1f5f9",
    textMuted: "#94a3b8",
    inputBg: "#0f172a",
    inputBorder: "#334155",
    chipBg: "rgba(255,255,255,0.05)",
    sep: "#334155"
  } : {
    bg: "#F0F4F8",
    cardBg: "#fff",
    cardBorder: "rgba(226,232,240,0.9)",
    text: "#0B1E33",
    textMuted: "#64748b",
    inputBg: "#f8fafc",
    inputBorder: "rgba(226,232,240,0.8)",
    chipBg: "#f8fafc",
    sep: "rgba(226,232,240,0.8)"
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u: User | null) => {
      if (!u) { router.replace("/auth/doctor/signin"); return; }
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
        const profile: DoctorProfile = {
          name:              raw.name              || user.displayName || "Dr. Unknown",
          email:             raw.email             || user.email       || "",
          phone:             raw.phone             || "",
          specialization:    raw.specialization    || "Neuro Rehabilitation",
          clinic:            raw.clinic            || "ReViveX Medical Center",
          bio:               raw.bio               || "",
          profilePictureUrl: raw.profilePictureUrl || user.photoURL    || "", 
          joinedAt:          raw.createdAt?.toDate?.()?.toISOString?.() || "",
          totalPatients:     raw.totalPatients     || 0, // In prod, fetch real counts
          protocolsSet:      raw.protocolsSet      || 0,
        };
        setData(profile); setDraft(profile);
        if (profile.profilePictureUrl) setAvatarPreview(profile.profilePictureUrl);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    })();
  }, [user]);

  const set = useCallback((k: keyof DoctorProfile) =>
    (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) =>
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
        name: draft.name, phone: draft.phone, bio: draft.bio,
      });
      if (draft.name !== data.name) await updateProfile(user, { displayName: draft.name });
      setData(draft); showToast("Changes saved successfully!");
    } catch (err) { console.error(err); showToast("Save failed — try again."); }
    finally { setIsSaving(false); }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const hasChanges = draft.name !== data.name || draft.phone !== data.phone || draft.bio !== data.bio;

  if (isLoading) return (
    <div className="dpf" style={{minHeight:"100vh",background:dm.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{CSS}</style>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
        <div style={{width:40,height:40,borderRadius:"50%",border:"3px solid rgba(45,212,191,0.2)",borderTopColor:"#2DD4BF",animation:"spin 1s linear infinite"}}/>
        <div className="mono" style={{fontSize:9,color:"rgba(45,212,191,0.6)",letterSpacing:".38em",textTransform:"uppercase"}}>Loading Profile</div>
      </div>
    </div>
  );

  return (
    <div className="dpf" style={{minHeight:"100vh",background:dm.bg,paddingBottom:52}}>
      <style>{CSS}</style>

      {/* Ambient */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-8%",right:"8%",width:700,height:700,background:"radial-gradient(circle,rgba(45,212,191,0.055) 0%,transparent 65%)",borderRadius:"50%"}}/>
        <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(${dm.cardBorder} 1px,transparent 1px),linear-gradient(90deg,${dm.cardBorder} 1px,transparent 1px)`,backgroundSize:"52px 52px",opacity:0.3}}/>
      </div>

      <main style={{maxWidth:1100,margin:"0 auto",padding:"28px 24px",position:"relative",zIndex:1}}>

        {/* ── PAGE HEADER ── */}
        <div style={{animation:"fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both",background:dm.cardBg,borderRadius:22,padding:"20px 28px",marginBottom:24,border:`1.5px solid ${dm.cardBorder}`,boxShadow:"0 4px 32px rgba(0,0,0,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-30,left:-30,width:180,height:180,background:"radial-gradient(circle,rgba(45,212,191,0.08),transparent 70%)"}}/>
          <div style={{position:"relative",zIndex:2}}>
            <p className="mono" style={{fontSize:9.5,color:"rgba(45,212,191,0.7)",textTransform:"uppercase",letterSpacing:"0.20em",marginBottom:4,fontWeight:600}}>Doctor Settings</p>
            <h1 style={{fontSize:"clamp(1.5rem,2.6vw,2rem)",fontWeight:800,color:dm.text,margin:0,lineHeight:1.15}}>
              My <span style={{color:"#2DD4BF"}}>Profile</span>
            </h1>
          </div>
          <div style={{display:"flex",gap:12,zIndex:2}}>
            <button onClick={() => router.back()} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",borderRadius:12,background:dm.chipBg,border:`1px solid ${dm.cardBorder}`,color:dm.textMuted,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600,transition:"all .2s"}}>
              <ArrowLeft size={13}/> Back
            </button>
            <button onClick={() => auth.signOut().then(() => router.replace("/"))} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",borderRadius:12,background:dm.chipBg,border:`1px solid ${dm.cardBorder}`,color:"#ef4444",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600,transition:"all .2s"}}>
              <LogOut size={13}/> Sign Out
            </button>
          </div>
        </div>

        {/* ── AVATAR HERO STRIP ── */}
        <div className="dpf-card" style={{background:dm.cardBg,border:`1px solid ${dm.cardBorder}`,boxShadow:"0 4px 20px rgba(0,0,0,0.05)",padding:"24px 28px",marginBottom:22,display:"flex",alignItems:"center",gap:24,flexWrap:"wrap",animation:"cardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.05s both",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:"#2DD4BF",boxShadow:"0 0 12px rgba(45,212,191,0.5)"}}/>
          
          <div style={{position:"relative",flexShrink:0}}>
            <div className="avatar-ring" style={{width:104,height:104,borderRadius:22,border:"2px solid #2DD4BF",background:"rgba(45,212,191,0.08)",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                : <UserIcon size={40} color="rgba(45,212,191,0.55)"/>}
              {isUploading && (
                <div style={{position:"absolute",inset:0,background:"rgba(11,30,51,0.8)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Loader2 size={24} color="#2DD4BF" style={{animation:"spin 1s linear infinite"}}/>
                </div>
              )}
            </div>
            <button onClick={() => fileRef.current?.click()}
              style={{position:"absolute",bottom:-8,right:-8,width:34,height:34,borderRadius:"50%",background:"#2DD4BF",border:`2px solid ${dm.cardBg}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 2px 10px rgba(45,212,191,0.4)"}}>
              <Camera size={14} color="#0B1E33"/>
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleAvatarChange}/>
          </div>

          <div style={{flex:1,minWidth:220}}>
            <h2 style={{fontSize:"clamp(1.5rem,2.8vw,2.2rem)",fontWeight:800,color:dm.text,margin:"0 0 4px",letterSpacing:"-0.01em"}}>{draft.name||"Doctor"}</h2>
            <div className="mono" style={{fontSize:10,color:dm.textMuted,letterSpacing:".16em",textTransform:"uppercase",marginBottom:14}}>
              {draft.specialization} · {draft.email}
            </div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              {[
                {icon:<Shield size={14}/>, val:"Verified", label:"Status", c:"#2DD4BF"},
                {icon:<Building size={14}/>, val:draft.clinic, label:"Clinic", c:"#6366f1"},
              ].map(s => (
                <div key={s.label} className="stat-chip" style={{background:dm.chipBg, border:`1px solid ${dm.cardBorder}`}}>
                  <span style={{color:s.c}}>{s.icon}</span>
                  <span style={{fontSize:13,fontWeight:700,color:dm.text}}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:22,alignItems:"start"}}>

          {/* LEFT: Editable Forms */}
          <div style={{display:"flex",flexDirection:"column",gap:18}}>
            
            <div className="dpf-card" style={{background:dm.cardBg, border:`1px solid ${dm.cardBorder}`, padding:28,animation:"cardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.10s both"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
                <div style={{width:38,height:38,borderRadius:12,background:"rgba(45,212,191,0.12)",display:"flex",alignItems:"center",justifyContent:"center",color:"#2DD4BF"}}><Stethoscope size={18}/></div>
                <div>
                  <div style={{fontSize:16,fontWeight:800,color:dm.text}}>Professional Info</div>
                  <div className="mono" style={{fontSize:9,color:dm.textMuted,textTransform:"uppercase",letterSpacing:"0.14em",marginTop:2}}>Update your directory details</div>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                <div style={{gridColumn:"1/-1"}}>
                  <div className="fl" style={{color:dm.textMuted}}>Full Name & Title <span className="fl-edit"><PenLine size={10}/>editable</span></div>
                  <input className="dpf-input" value={draft.name} onChange={set("name")} placeholder="Dr. John Doe" style={{background:dm.inputBg, border:`1.5px solid ${dm.inputBorder}`, color:dm.text}}/>
                </div>
                
                <div style={{gridColumn:"1/-1"}}>
                  <div className="fl" style={{color:dm.textMuted}}>Email Address <span style={{color:dm.textMuted,fontSize:9}}>system</span></div>
                  <div style={{position:"relative"}}>
                    <input className="dpf-input" value={draft.email} disabled style={{paddingLeft:38, background:dm.inputBg, border:`1.5px solid ${dm.inputBorder}`, color:dm.text, opacity:0.6}}/>
                    <Mail size={15} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:dm.textMuted}}/>
                  </div>
                </div>

                <div>
                  <div className="fl" style={{color:dm.textMuted}}>Phone Contact <span className="fl-edit"><PenLine size={10}/>editable</span></div>
                  <div style={{position:"relative"}}>
                    <input className="dpf-input" value={draft.phone} onChange={set("phone")} placeholder="+94 77 000 0000" style={{paddingLeft:38, background:dm.inputBg, border:`1.5px solid ${dm.inputBorder}`, color:dm.text}}/>
                    <Phone size={15} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:dm.textMuted}}/>
                  </div>
                </div>

                <div>
                  <div className="fl" style={{color:dm.textMuted}}>Specialization <span style={{color:dm.textMuted,fontSize:9}}>system</span></div>
                  <input className="dpf-input" value={draft.specialization} disabled style={{background:dm.inputBg, border:`1.5px solid ${dm.inputBorder}`, color:dm.text, opacity:0.6}}/>
                </div>
              </div>

              <div className="sep" style={{background:dm.sep}}/>

              <div>
                <div className="fl" style={{color:dm.textMuted}}>Clinical Bio / Experience <span className="fl-edit"><PenLine size={10}/>editable</span></div>
                <textarea className="dpf-input" rows={4} value={draft.bio} onChange={set("bio")} placeholder="Tell patients about your background and expertise..." style={{background:dm.inputBg, border:`1.5px solid ${dm.inputBorder}`, color:dm.text}}/>
              </div>

              <div style={{marginTop:24}}>
                <button className="dpf-save-btn" onClick={handleSave} disabled={!hasChanges||isSaving}>
                  {isSaving ? <><Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/> Saving...</> : <><CheckCircle2 size={16}/> Save Profile</>}
                </button>
                {!hasChanges && <div className="mono" style={{textAlign:"center",marginTop:10,fontSize:9,color:dm.textMuted,letterSpacing:".18em"}}>UP TO DATE</div>}
              </div>
            </div>
          </div>

          {/* RIGHT: Read-Only System Stats */}
          <div style={{display:"flex",flexDirection:"column",gap:18}}>
            
            <div className="dpf-card" style={{background:dm.cardBg, border:`1px solid ${dm.cardBorder}`, padding:28,animation:"cardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.13s both"}}>
              <div style={{fontSize:15,fontWeight:800,color:dm.text,marginBottom:20}}>System Overview</div>
              
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                {[
                  {icon:<Building size={16}/>, label:"Primary Clinic", val:draft.clinic, c:"#8b5cf6"},
                  {icon:<Users size={16}/>, label:"Assigned Patients", val:"Manage in Dashboard", c:"#2DD4BF"},
                  {icon:<Award size={16}/>, label:"Active Protocols", val:"Manage in Dashboard", c:"#f59e0b"},
                ].map(item => (
                  <div key={item.label} style={{display:"flex",alignItems:"center",gap:14}}>
                    <div style={{width:38,height:38,borderRadius:12,background:`${item.c}12`,border:`1px solid ${item.c}25`,display:"flex",alignItems:"center",justifyContent:"center",color:item.c}}>{item.icon}</div>
                    <div>
                      <div className="mono" style={{fontSize:9,color:dm.textMuted,textTransform:"uppercase",letterSpacing:".14em",marginBottom:3}}>{item.label}</div>
                      <div style={{color:dm.text,fontSize:13.5,fontWeight:700}}>{item.val}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {draft.joinedAt && (
                <div className="mono" style={{marginTop:24,paddingTop:20,borderTop:`1px solid ${dm.sep}`,fontSize:9,color:dm.textMuted,letterSpacing:".12em",textAlign:"center"}}>
                  NETWORK MEMBER SINCE · {new Date(draft.joinedAt).toLocaleDateString("en-US",{month:"long",year:"numeric"})}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="toast">
          <CheckCircle2 size={16} color="#2DD4BF"/>
          <span style={{color:"rgba(255,255,255,0.9)",fontSize:13,fontWeight:600}}>{toast}</span>
          <button onClick={() => setToast("")} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",marginLeft:6}}><X size={13}/></button>
        </div>
      )}
    </div>
  );
}