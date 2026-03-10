'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, Calendar, Activity, TrendingUp, FileText, CheckCircle2, AlertCircle, Shield, Bot, Zap, Loader2, RefreshCw } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../../lib/firebase';
import { getPatientById } from '../../../../lib/db/patients';
import { getActiveProtocol } from '../../../../lib/db/users';
import { getLast30DaySessions } from '../../../../lib/db/sessions';
import { sendFromDoctor } from '../../../../lib/db/communications';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { PatientData, GameSession, TherapyProtocol } from '../../../../lib/db/types';

// ─── MOCK FLAG — set false to restore full Firebase + auth flow ────────────
const USE_MOCK = true;

interface MockP {
  uid:string; name:string; pid:string; adherence:number; condition:string;
  status:'High'|'Medium'|'Low'; isAIPlan:boolean; lastSession:string;
  streak:number; completedSessions:number; monthlyTarget:number;
  gameId:string; level:number; sessionsPerWeek:number; difficulty:string;
  joinDate:string; notes:string[];
}
const MOCK_DB: MockP[] = [
  { uid:"mock_p1",  name:"P.B. De Silva",       pid:"P001", adherence:45, condition:"Stroke",       status:"Low",    isAIPlan:false, lastSession:"2025-03-06", streak:2,  completedSessions:9,  monthlyTarget:20, gameId:"synapse_racer",  level:2, sessionsPerWeek:5, difficulty:"medium", joinDate:"2024-11-12", notes:["Grip strength baseline 28 kg. Target 32 kg by end of month.","Fatigue after >15 min sessions — reducing to 10 min with rest intervals."] },
  { uid:"mock_p2",  name:"Anura Dissanayaka",   pid:"P002", adherence:92, condition:"TBI",          status:"High",   isAIPlan:true,  lastSession:"2025-03-08", streak:14, completedSessions:18, monthlyTarget:20, gameId:"rhythm_reef",    level:3, sessionsPerWeek:5, difficulty:"hard",   joinDate:"2024-10-05", notes:["Reaction time improved 480ms → 394ms. Cognitive accuracy 91%. Advancing to Level 3."] },
  { uid:"mock_p3",  name:"Sarath Watawala",     pid:"P003", adherence:78, condition:"Post-Surgery", status:"High",   isAIPlan:false, lastSession:"2025-03-08", streak:7,  completedSessions:16, monthlyTarget:20, gameId:"grip_surge",     level:2, sessionsPerWeek:5, difficulty:"medium", joinDate:"2025-01-18", notes:["Post-op grip recovery progressing. No pain reported during Level 2."] },
  { uid:"mock_p4",  name:"Shifani Ameena",      pid:"P004", adherence:65, condition:"Parkinson's",  status:"Medium", isAIPlan:true,  lastSession:"2025-03-07", streak:4,  completedSessions:13, monthlyTarget:20, gameId:"precision_hold", level:1, sessionsPerWeek:4, difficulty:"easy",   joinDate:"2024-12-03", notes:["AI Companion daily check-ins showing strong engagement."] },
  { uid:"mock_p5",  name:"Percy Silva",         pid:"P005", adherence:88, condition:"Stroke",       status:"High",   isAIPlan:false, lastSession:"2025-03-09", streak:11, completedSessions:17, monthlyTarget:20, gameId:"synapse_racer",  level:3, sessionsPerWeek:5, difficulty:"hard",   joinDate:"2024-09-22", notes:["Motor reaction time down 22ms this month. Exceeding expectations."] },
  { uid:"mock_p6",  name:"Athula Premachandra", pid:"P006", adherence:52, condition:"TBI",          status:"Low",    isAIPlan:false, lastSession:"2025-03-08", streak:3,  completedSessions:10, monthlyTarget:20, gameId:"grip_surge",     level:1, sessionsPerWeek:5, difficulty:"easy",   joinDate:"2025-02-01", notes:["Adherence declining — 2 consecutive missed sessions.","Prefers morning sessions. Schedule updated."] },
  { uid:"mock_p7",  name:"Aruni Perera",        pid:"P007", adherence:95, condition:"Post-Surgery", status:"High",   isAIPlan:true,  lastSession:"2025-03-09", streak:21, completedSessions:19, monthlyTarget:20, gameId:"rhythm_reef",    level:4, sessionsPerWeek:5, difficulty:"hard",   joinDate:"2024-10-30", notes:["Best performer. Level 4 evaluation Friday.","AI Companion interaction rate 87%."] },
  { uid:"mock_p8",  name:"Amal Mahendra",       pid:"P008", adherence:73, condition:"Stroke",       status:"Medium", isAIPlan:false, lastSession:"2025-03-08", streak:6,  completedSessions:15, monthlyTarget:20, gameId:"synapse_racer",  level:2, sessionsPerWeek:5, difficulty:"medium", joinDate:"2025-01-07", notes:["Steady performance. Motivational check-in recommended."] },
  { uid:"mock_p9",  name:"Malkanthi Peris",     pid:"P009", adherence:25, condition:"Parkinson's",  status:"Low",    isAIPlan:false, lastSession:"2025-03-07", streak:1,  completedSessions:5,  monthlyTarget:20, gameId:"precision_hold", level:1, sessionsPerWeek:5, difficulty:"easy",   joinDate:"2024-11-28", notes:["Parkinson's tremor flare. Reducing to 8-min sessions.","Family carer contacted to assist with device."] },
  { uid:"mock_p10", name:"K.K. Muththukumaran", pid:"P010", adherence:76, condition:"TBI",          status:"Medium", isAIPlan:false, lastSession:"2025-03-08", streak:8,  completedSessions:15, monthlyTarget:20, gameId:"grip_surge",     level:2, sessionsPerWeek:5, difficulty:"medium", joinDate:"2024-12-15", notes:["Cognitive accuracy trending up. Mild endurance drop in final 10 min."] },
  { uid:"mock_p11", name:"Kamal Fernando",      pid:"P011", adherence:80, condition:"Stroke",       status:"High",   isAIPlan:true,  lastSession:"2025-03-09", streak:10, completedSessions:16, monthlyTarget:20, gameId:"synapse_racer",  level:3, sessionsPerWeek:5, difficulty:"hard",   joinDate:"2024-10-18", notes:["80%+ adherence for 6 consecutive weeks."] },
  { uid:"mock_p12", name:"P.P. Sugathadasa",    pid:"P012", adherence:63, condition:"Post-Surgery", status:"Medium", isAIPlan:false, lastSession:"2025-03-08", streak:5,  completedSessions:13, monthlyTarget:20, gameId:"precision_hold", level:2, sessionsPerWeek:5, difficulty:"medium", joinDate:"2025-01-25", notes:["Post-surgery pain resolved. Grip endurance improving weekly."] },
];
// ──────────────────────────────────────────────────────────────────────────────

function adherenceColor(v: number) { return v >= 80 ? '#10b981' : v >= 60 ? '#f59e0b' : '#ef4444'; }
function statusColor(s: string)    { return s === 'High' ? '#10b981' : s === 'Medium' ? '#f59e0b' : '#ef4444'; }
function getStatus(a: number)      { return a >= 80 ? 'High' : a >= 55 ? 'Medium' : 'Low'; }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  .pp * { font-family:'Plus Jakarta Sans',system-ui,sans-serif; box-sizing:border-box; }
  .pp .mono { font-family:'JetBrains Mono',monospace; }
  @keyframes ppFadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ppCardPop { 0%{opacity:0;transform:translateY(14px) scale(.98)} 100%{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes ppShimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }
  @keyframes ppGlow    { 0%,100%{box-shadow:0 0 0 0 rgba(45,212,191,.35)} 50%{box-shadow:0 0 0 9px rgba(45,212,191,0)} }
  @keyframes ppDot     { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  .pp-card{background:#fff;border-radius:20px;border:1px solid rgba(226,232,240,.9);box-shadow:0 2px 18px rgba(11,30,51,.055);transition:transform .28s ease,box-shadow .28s ease}
  .pp-card:hover{transform:translateY(-4px);box-shadow:0 18px 52px rgba(11,30,51,.10)!important}
  .pp-back-btn{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:12px;font-size:13px;font-weight:700;color:#64748b;background:#fff;border:1.5px solid rgba(226,232,240,.9);text-decoration:none;transition:all .2s}
  .pp-back-btn:hover{background:#f8fafc;color:#0B1E33;border-color:rgba(11,30,51,.15)}
  .pp-msg-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;border-radius:14px;font-size:13px;font-weight:800;background:linear-gradient(135deg,#2DD4BF,#0891b2);color:#0B1E33;border:none;cursor:pointer;text-decoration:none;transition:all .25s;position:relative;overflow:hidden}
  .pp-msg-btn::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent);animation:ppShimmer 3s ease-in-out infinite}
  .pp-msg-btn:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(45,212,191,.38)}
  .pp-note{padding:12px 14px;border-radius:12px;background:rgba(45,212,191,.05);border:1px solid rgba(45,212,191,.14);font-size:13px;color:#475569;line-height:1.65;position:relative;padding-left:26px}
  .pp-note::before{content:'';position:absolute;left:12px;top:18px;width:6px;height:6px;border-radius:50%;background:#2DD4BF;box-shadow:0 0 6px rgba(45,212,191,.6)}
  @media(max-width:900px){.pp-main-grid{grid-template-columns:1fr!important}}
  @media(max-width:640px){.pp .mp{padding:16px 14px!important}.pp-stat-grid{grid-template-columns:1fr 1fr!important}.pp-header-row{flex-direction:column!important;align-items:flex-start!important}}
`;

function AnimBar({ value, color, delay=0 }: { value:number; color:string; delay?:number }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(()=>setW(value),delay); return ()=>clearTimeout(t); }, [value,delay]);
  return (
    <div style={{ height:8, background:'rgba(11,30,51,.07)', borderRadius:99, overflow:'hidden' }}>
      <div style={{ height:'100%', borderRadius:99, width:`${w}%`, background:color, boxShadow:`0 0 8px ${color}70`, transition:'width 1.2s cubic-bezier(.22,1,.36,1)', position:'relative' }}>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(255,255,255,.3),transparent)', animation:'ppShimmer 2.2s ease-in-out infinite' }}/>
      </div>
    </div>
  );
}

function AnimNum({ to, suffix='', delay=0 }: { to:number; suffix?:string; delay?:number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let start: number|null = null;
      const raf = (ts:number) => {
        if (!start) start=ts;
        const p = Math.min((ts-start)/1000,1);
        setVal(Math.round((1-Math.pow(1-p,3))*to));
        if (p<1) requestAnimationFrame(raf); else setVal(to);
      };
      requestAnimationFrame(raf);
    }, delay);
    return ()=>clearTimeout(t);
  }, [to,delay]);
  return <>{val}{suffix}</>;
}

export default function PatientProfilePage() {
  const { id } = useParams();
  const [user, authLoading] = useAuthState(auth);
  const [mounted, setMounted] = useState(false);

  // Displayed values — populated from mock or Firebase
  const [name,     setName]     = useState('');
  const [pid,      setPid]      = useState('');
  const [condition,setCondition]= useState('');
  const [joinDate, setJoinDate] = useState('—');
  const [adherence,setAdherence]= useState(0);
  const [status,   setStatus]   = useState('');
  const [streak,   setStreak]   = useState(0);
  const [completed,setCompleted]= useState(0);
  const [target,   setTarget]   = useState(20);
  const [lastSess, setLastSess] = useState('—');
  const [isAI,     setIsAI]     = useState(false);
  const [protocol, setProtocol] = useState<{gameId:string;level:number;sessionsPerWeek:number;difficulty:string}|null>(null);
  const [notes,    setNotes]    = useState<string[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const [noteInput,  setNoteInput]  = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved,  setNoteSaved]  = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const patientId = Array.isArray(id) ? id[0] : (id ?? '');

  useEffect(() => {
    if (!mounted || !patientId) return;

    if (USE_MOCK) {
      // ── MOCK PATH: look up patientId in local array, no Firebase ────────
      const m = MOCK_DB.find(p => p.uid === patientId) ?? MOCK_DB[0];
      setName(m.name); setPid(m.pid); setCondition(m.condition); setJoinDate(m.joinDate);
      setAdherence(m.adherence); setStatus(m.status); setStreak(m.streak);
      setCompleted(m.completedSessions); setTarget(m.monthlyTarget);
      setLastSess(m.lastSession); setIsAI(m.isAIPlan);
      setProtocol({ gameId:m.gameId, level:m.level, sessionsPerWeek:m.sessionsPerWeek, difficulty:m.difficulty });
      setNotes(m.notes);
      setLoading(false);
      return;
    }

    // ── REAL PATH: wait for auth, then load Firebase ─────────────────────
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    (async () => {
      try {
        setLoading(true); setError('');
        const [patientData, sessionData, protocolData] = await Promise.all([
          getPatientById(patientId),
          getLast30DaySessions(patientId),
          getActiveProtocol(patientId),
        ]);
        if (!patientData) { setError('Patient not found.'); return; }

        const spw = protocolData?.sessionsPerWeek ?? 5;
        const monthlyTarget = spw * 4;
        const completedSessions = sessionData.filter(s => s.durationSeconds > 60).length;
        const adh = Math.min(100, Math.round((completedSessions / monthlyTarget) * 100));

        setName(patientData.name);
        setPid((patientData as any).patientId ?? patientData.uid.slice(0,7).toUpperCase());
        setCondition(patientData.condition);
        setJoinDate(patientData.createdAt ? (patientData.createdAt as Timestamp).toDate().toLocaleDateString('en-CA') : '—');
        setAdherence(adh); setStatus(getStatus(adh));
        setStreak(patientData.gamification?.currentStreak ?? 0);
        setCompleted(completedSessions); setTarget(monthlyTarget);
        setLastSess(sessionData.length > 0 ? (sessionData[0].timestamp as Timestamp).toDate().toLocaleDateString('en-CA') : 'No sessions');
        setIsAI((patientData as any).subscriptionPlan === 'ai_companion');
        if (protocolData) setProtocol({ gameId:protocolData.gameId??'', level:protocolData.level??1, sessionsPerWeek:protocolData.sessionsPerWeek??5, difficulty:protocolData.settings?.difficulty??'' });

        const notesSnap = await getDocs(query(
          collection(db,'communications'),
          where('senderId','==',user.uid), where('receiverId','==',patientId),
          where('type','==','feedback'), orderBy('timestamp','desc'), limit(5)
        ));
        setNotes(notesSnap.docs.map(d => d.data().content as string));
      } catch (err) {
        console.error(err); setError('Failed to load patient data.');
      } finally { setLoading(false); }
    })();
  }, [mounted, patientId, user, authLoading]);

  const handleSaveNote = async () => {
    if (!noteInput.trim()) return;
    try {
      setNoteSaving(true);
      if (!USE_MOCK && user) {
        await sendFromDoctor(user.uid, patientId, 'feedback', 'Clinical Note', noteInput.trim());
      }
      setNotes(prev => [noteInput.trim(), ...prev]);
      setNoteInput(''); setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2500);
    } catch (err) { console.error(err); }
    finally { setNoteSaving(false); }
  };

  if (!mounted) return null;

  const aColor = adherenceColor(adherence);
  const sColor = statusColor(status);

  if (loading) {
    return (
      <div className="pp" style={{ minHeight:'100vh', background:'#F0F4F8', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <style>{CSS}</style>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
          <Loader2 size={32} color="#2DD4BF" style={{ animation:'spin 1s linear infinite' }}/>
          <span style={{ fontSize:13, fontWeight:600, color:'#64748b' }}>Loading patient profile…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pp" style={{ minHeight:'100vh', background:'#F0F4F8', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <style>{CSS}</style>
        <div style={{ textAlign:'center' }}>
          <AlertCircle size={32} color="#ef4444" style={{ marginBottom:12 }}/>
          <p style={{ fontSize:14, color:'#dc2626', fontWeight:600 }}>{error}</p>
          <Link href="/doctor/patients" className="pp-back-btn" style={{ marginTop:16, display:'inline-flex' }}>
            <ArrowLeft size={15}/> Back to Patients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pp" style={{ minHeight:'100vh', background:'#F0F4F8', paddingBottom:52 }}>
      <style>{CSS}</style>

      {/* Ambient BG */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-10%', right:'8%', width:700, height:700, background:'radial-gradient(circle,rgba(45,212,191,.055),transparent 65%)', borderRadius:'50%' }}/>
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(11,30,51,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(11,30,51,.022) 1px,transparent 1px)', backgroundSize:'52px 52px' }}/>
      </div>

      <main style={{ maxWidth:1100, margin:'0 auto', padding:'28px 24px', position:'relative', zIndex:1 }}>

        {/* Back nav */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22, animation:'ppFadeUp .5s ease both', flexWrap:'wrap', gap:12 }}>
          <Link href="/doctor/patients" className="pp-back-btn"><ArrowLeft size={15}/> Back to Patients</Link>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            {USE_MOCK && (
              <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(251,191,36,.08)', border:'1px solid rgba(251,191,36,.30)', borderRadius:10, padding:'6px 12px' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#fbbf24', boxShadow:'0 0 6px #fbbf24' }}/>
                <span className="mono" style={{ fontSize:9.5, color:'#fbbf24', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em' }}>Demo Data</span>
              </div>
            )}
            <Link href={`/doctor/patients/${patientId}/messages`} className="pp-msg-btn">
              <MessageCircle size={15} style={{ position:'relative', zIndex:2 }}/>
              <span style={{ position:'relative', zIndex:2 }}>Message Patient</span>
            </Link>
          </div>
        </div>

        {/* Profile Hero */}
        <div style={{ animation:'ppCardPop .55s cubic-bezier(.22,1,.36,1) .05s both', background:'#fff', borderRadius:22, border:'1.5px solid rgba(45,212,191,.22)', boxShadow:'0 4px 28px rgba(11,30,51,.07)', padding:'26px 28px', marginBottom:20, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-30, left:-30, width:180, height:180, background:'radial-gradient(circle,rgba(45,212,191,.07),transparent 70%)' }}/>
          <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(45,212,191,.04),transparent)', animation:'ppShimmer 5s ease-in-out infinite' }}/>
          </div>
          <div className="pp-header-row" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:20, position:'relative', zIndex:2 }}>
            <div style={{ display:'flex', alignItems:'center', gap:18 }}>
              <div style={{ width:64, height:64, borderRadius:18, background:`linear-gradient(135deg,${aColor},${aColor}aa)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, color:'#fff', boxShadow:`0 0 0 3px ${aColor}30,0 6px 24px ${aColor}40`, animation:'ppGlow 3s ease-in-out infinite', flexShrink:0 }}>
                {name.split(' ').map(w=>w[0]).slice(0,2).join('')}
              </div>
              <div>
                <p className="mono" style={{ fontSize:9.5, color:'rgba(45,212,191,.75)', textTransform:'uppercase', letterSpacing:'0.20em', marginBottom:3, fontWeight:600 }}>Patient Profile</p>
                <h1 style={{ fontSize:'clamp(1.3rem,2.2vw,1.75rem)', fontWeight:800, color:'#0B1E33', margin:0, lineHeight:1.2 }}>{name}</h1>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:6, flexWrap:'wrap' }}>
                  <span className="mono" style={{ fontSize:11.5, fontWeight:600, color:'#2DD4BF', background:'rgba(45,212,191,.08)', border:'1px solid rgba(45,212,191,.18)', padding:'2px 10px', borderRadius:8 }}>{pid}</span>
                  <span style={{ fontSize:12, color:'#64748b', fontWeight:500 }}>{condition}</span>
                  <span style={{ fontSize:11, color:'#94a3b8' }}>Joined {joinDate}</span>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, background:`${sColor}0f`, border:`1px solid ${sColor}30`, borderRadius:12, padding:'8px 14px' }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:sColor, boxShadow:`0 0 6px ${sColor}`, animation:'ppDot 2s ease-in-out infinite' }}/>
                <span style={{ fontSize:12, fontWeight:700, color:sColor }}>{status} Adherence</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:7, background:isAI?'#0B1E33':'rgba(11,30,51,.06)', border:isAI?'1px solid rgba(45,212,191,.20)':'1px solid rgba(226,232,240,.9)', borderRadius:12, padding:'8px 14px' }}>
                {isAI ? <Bot size={13} color="#2DD4BF"/> : <Shield size={13} color="#64748b"/>}
                <span style={{ fontSize:12, fontWeight:700, color:isAI?'#2DD4BF':'#64748b' }}>{isAI?'AI Companion':'Standard'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="pp-stat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20, animation:'ppCardPop .55s cubic-bezier(.22,1,.36,1) .12s both' }}>
          {[
            { label:'Adherence',    val:adherence, suffix:'%',             color:aColor,    icon:<Activity size={16}/> },
            { label:'Sessions',     val:completed, suffix:`/${target}`,    color:'#2DD4BF', icon:<CheckCircle2 size={16}/> },
            { label:'Streak',       val:streak,    suffix:' days',         color:'#f59e0b', icon:<Zap size={16}/> },
            { label:'Last Session', val:0, suffix:'', dateVal:lastSess,    color:'#6366f1', icon:<Calendar size={16}/> },
          ].map(s => (
            <div key={s.label} className="pp-card" style={{ padding:'18px 20px', display:'flex', alignItems:'center', gap:12, background:`${s.color}08`, border:`1.5px solid ${s.color}20` }}>
              <div style={{ width:38, height:38, borderRadius:12, background:`${s.color}14`, border:`1px solid ${s.color}28`, display:'flex', alignItems:'center', justifyContent:'center', color:s.color, flexShrink:0 }}>{s.icon}</div>
              <div style={{ minWidth:0 }}>
                <div className="mono" style={{ fontSize:9, color:s.color, textTransform:'uppercase', letterSpacing:'0.14em', fontWeight:700, marginBottom:2 }}>{s.label}</div>
                <div style={{ fontWeight:800, color:'#0B1E33', lineHeight:1.1 }}>
                  {'dateVal' in s && s.dateVal
                    ? <span className="mono" style={{ fontSize:12 }}>{s.dateVal}</span>
                    : <span style={{ fontSize:20 }}><AnimNum to={s.val} suffix={s.suffix} delay={300}/></span>
                  }
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Two-column */}
        <div className="pp-main-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>

          {/* Session & Adherence */}
          <div className="pp-card" style={{ padding:'22px', animation:'ppCardPop .55s cubic-bezier(.22,1,.36,1) .20s both' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:'rgba(45,212,191,.10)', display:'flex', alignItems:'center', justifyContent:'center', color:'#2DD4BF' }}><TrendingUp size={16}/></div>
              <div>
                <h3 style={{ fontSize:15, fontWeight:800, color:'#0B1E33', margin:0 }}>Session & Adherence</h3>
                <p className="mono" style={{ fontSize:9, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.12em', marginTop:2 }}>30-day performance</p>
              </div>
            </div>
            <div style={{ background:'rgba(240,244,248,.7)', borderRadius:16, padding:'18px', marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:10 }}>
                <div>
                  <div className="mono" style={{ fontSize:9, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.14em' }}>Adherence Score</div>
                  <div style={{ fontSize:32, fontWeight:800, color:aColor, lineHeight:1, textShadow:`0 0 20px ${aColor}40` }}><AnimNum to={adherence} suffix="%" delay={400}/></div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div className="mono" style={{ fontSize:9, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.12em' }}>Sessions</div>
                  <div style={{ fontSize:18, fontWeight:800, color:'#0B1E33' }}>{completed}/{target}</div>
                </div>
              </div>
              <AnimBar value={adherence} color={aColor} delay={500}/>
            </div>
            <div>
              <div className="mono" style={{ fontSize:9, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>Session dots (this period)</div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {Array.from({length:target}).map((_,i) => (
                  <div key={i} style={{ width:18, height:6, borderRadius:99, background:i<completed?`linear-gradient(90deg,${aColor}cc,${aColor})`:'rgba(45,212,191,.10)', boxShadow:i<completed?`0 0 5px ${aColor}60`:'none', transition:'all .3s' }}/>
                ))}
              </div>
            </div>
            {protocol && (
              <div style={{ marginTop:16, padding:'10px 14px', background:'rgba(99,102,241,.05)', border:'1px solid rgba(99,102,241,.14)', borderRadius:12 }}>
                <div className="mono" style={{ fontSize:9, color:'#6366f1', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:4, fontWeight:700 }}>Active Protocol</div>
                <div style={{ fontSize:12, color:'#475569' }}>
                  {protocol.gameId.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())} · Level {protocol.level} · {protocol.sessionsPerWeek}x/week · <span style={{ fontWeight:700, textTransform:'capitalize' }}>{protocol.difficulty}</span>
                </div>
              </div>
            )}
          </div>

          {/* Clinical Notes */}
          <div className="pp-card" style={{ padding:'22px', animation:'ppCardPop .55s cubic-bezier(.22,1,.36,1) .28s both' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:'rgba(99,102,241,.10)', display:'flex', alignItems:'center', justifyContent:'center', color:'#6366f1' }}><FileText size={16}/></div>
              <div>
                <h3 style={{ fontSize:15, fontWeight:800, color:'#0B1E33', margin:0 }}>Clinical Notes</h3>
                <p className="mono" style={{ fontSize:9, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.12em', marginTop:2 }}>{USE_MOCK ? 'Sample notes' : 'Saved as feedback messages'}</p>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
              {notes.length === 0
                ? <div style={{ textAlign:'center', padding:'20px 0', color:'#94a3b8', fontSize:13 }}>No notes yet.</div>
                : notes.map((note,i) => <div key={i} className="pp-note" style={{ animation:'ppCardPop .4s ease both', animationDelay:`${.3+i*.08}s` }}>{note}</div>)
              }
            </div>
            <div style={{ padding:14, background:'rgba(240,244,248,.7)', borderRadius:14, border:'1px dashed rgba(45,212,191,.20)' }}>
              <textarea
                placeholder={USE_MOCK ? 'Add a note… (demo — not saved to database)' : 'Add a clinical note… (saved as feedback to patient)'}
                rows={3} value={noteInput} onChange={e=>setNoteInput(e.target.value)}
                style={{ width:'100%', background:'none', border:'none', resize:'none', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12.5, color:'#475569', outline:'none', lineHeight:1.6 }}
              />
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
                {noteSaved && <span style={{ fontSize:11.5, color:'#22c55e', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}><CheckCircle2 size={13}/> Saved{USE_MOCK?' (demo)':' & sent'}</span>}
                <div style={{ flex:1 }}/>
                <button onClick={handleSaveNote} disabled={noteSaving||!noteInput.trim()} style={{ padding:'8px 16px', borderRadius:10, background:noteInput.trim()?'rgba(45,212,191,.10)':'rgba(226,232,240,.6)', border:noteInput.trim()?'1px solid rgba(45,212,191,.22)':'1px solid transparent', color:noteInput.trim()?'#0891b2':'#94a3b8', fontSize:12, fontWeight:700, cursor:noteInput.trim()?'pointer':'default', fontFamily:"'Plus Jakarta Sans',sans-serif", display:'flex', alignItems:'center', gap:6 }}>
                  {noteSaving ? <><Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/> Saving…</> : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}