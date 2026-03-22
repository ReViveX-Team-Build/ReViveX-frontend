"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/app/lib/firebase";
import {
  collection, query, where, getDocs, Timestamp, orderBy,
} from "firebase/firestore";
import {
  ChevronRight, FileText, Loader2, Users, TrendingUp,
  CheckCircle2, AlertTriangle, CalendarDays, Activity,
  ArrowUpRight, Download, RefreshCw,
} from "lucide-react";

import ReportKPICard from "@/components/DoctorPortal/ReportKPICard";
import PatientOutcomesChart from "@/components/DoctorPortal/PatientOutcomesChart";
import AdherenceRateChart from "@/components/DoctorPortal/AdherenceRateChart";
import DeviceStatusChart from "@/components/DoctorPortal/DeviceStatusChart";

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

  :root {
    --ink:   #03080f;
    --deep:  #060d1a;
    --navy:  #0B1E33;
    --mid:   #0d2640;
    --teal:  #2DD4BF;
    --teal2: #0891b2;
    --dim:   rgba(45,212,191,.12);
    --mu:    rgba(255,255,255,.28);
  }

  .rp * { box-sizing: border-box; }
  .rp { font-family: 'Bricolage Grotesque', system-ui, sans-serif; }
  .rp-display { font-family: 'Bricolage Grotesque', system-ui, sans-serif; }
  .rp-mono    { font-family: 'JetBrains Mono', monospace; }

  @keyframes rp-fade-up    { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
  @keyframes rp-fade-in    { from { opacity:0; } to { opacity:1; } }
  @keyframes rp-slide-r    { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
  @keyframes rp-pop        { 0%{opacity:0;transform:scale(.88) translateY(14px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes rp-scan       { 0%{top:-3%;opacity:0} 6%{opacity:.7} 93%{opacity:.4} 100%{top:108%;opacity:0} }
  @keyframes rp-scan2      { 0%{top:-3%;opacity:0} 6%{opacity:.4} 93%{opacity:.2} 100%{top:108%;opacity:0} }
  @keyframes rp-pulse      { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(1.2)} }
  @keyframes rp-pulse-ring { 0%{transform:scale(.85);opacity:.7} 100%{transform:scale(2.4);opacity:0} }
  @keyframes rp-shimmer    { 0%{transform:translateX(-200%) skewX(-15deg)} 100%{transform:translateX(400%) skewX(-15deg)} }
  @keyframes rp-glow-beat  { 0%,100%{box-shadow:0 0 20px rgba(45,212,191,.2);} 50%{box-shadow:0 0 50px rgba(45,212,191,.5), 0 0 100px rgba(45,212,191,.12);} }
  @keyframes rp-arc        { from{stroke-dashoffset:var(--arc-total)} to{stroke-dashoffset:var(--arc-offset)} }
  @keyframes rp-count      { from{opacity:0;transform:scale(.6) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes rp-blink      { 0%,100%{opacity:1} 49%{opacity:1} 50%{opacity:0} 99%{opacity:0} }
  @keyframes rp-float      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes rp-spin       { to{transform:rotate(360deg)} }
  @keyframes rp-ticker     { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  @keyframes rp-row-enter  { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
  @keyframes rp-chart-in   { from{opacity:0;transform:translateY(20px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }

  .rp-kpi-card {
    transition: transform .3s ease, box-shadow .3s ease;
    animation: rp-pop .6s cubic-bezier(.22,1,.36,1) both;
  }
  .rp-kpi-card:hover { transform: translateY(-6px) !important; }

  .rp-chart-wrap {
    animation: rp-chart-in .65s cubic-bezier(.22,1,.36,1) both;
    transition: transform .3s ease, box-shadow .3s ease;
  }
  .rp-chart-wrap:hover { transform: translateY(-4px); }

  .rp-patient-row {
    transition: all .22s cubic-bezier(.22,1,.36,1);
    cursor: pointer;
    position: relative;
    animation: rp-row-enter .4s cubic-bezier(.22,1,.36,1) both;
  }
  .rp-patient-row::after {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0; width: 3px;
    background: linear-gradient(to bottom, var(--teal), var(--teal2));
    border-radius: 0 3px 3px 0;
    transform: scaleY(0);
    transition: transform .22s ease;
  }
  .rp-patient-row:hover::after { transform: scaleY(1); }
  .rp-patient-row:hover { background: rgba(45,212,191,.05) !important; padding-left: 28px !important; }

  .rp-export-btn {
    position: relative; overflow: hidden;
    transition: all .25s ease;
  }
  .rp-export-btn::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.22), transparent);
    animation: rp-shimmer 2.8s ease-in-out infinite;
  }
  .rp-export-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 40px rgba(45,212,191,.45) !important; }

  .rp-ticker-wrap { overflow: hidden; white-space: nowrap; }
  .rp-ticker-inner { display: inline-flex; gap: 48px; animation: rp-ticker 28s linear infinite; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysAgo(n: number): Date {
  const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0,0,0,0); return d;
}

// ─── Animated Number ──────────────────────────────────────────────────────────
function Counter({ to, suffix="", delay=0, size="inherit" }: { to:number; suffix?:string; delay?:number; size?:string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let s: number|null = null;
      const f = (ts: number) => {
        if (!s) s = ts;
        const p = Math.min((ts-s)/1100, 1);
        setV(Math.round((1-Math.pow(1-p,3))*to));
        if (p<1) requestAnimationFrame(f); else setV(to);
      };
      requestAnimationFrame(f);
    }, delay);
    return () => clearTimeout(t);
  }, [to, delay]);
  return <span style={{ fontSize: size }}>{v}{suffix}</span>;
}

// ─── Arc Ring ─────────────────────────────────────────────────────────────────
function ArcRing({ value, size=220, stroke=14, color="#2DD4BF" }: { value:number; size?:number; stroke?:number; color?:string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
      <defs>
        <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity=".3" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
        <filter id="arcGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Track */}
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(45,212,191,.08)" strokeWidth={stroke} />
      {/* Secondary glow ring */}
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke+6}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ filter:`blur(8px)`, opacity:.25, transition:"stroke-dashoffset 1.4s cubic-bezier(.22,1,.36,1)" }} />
      {/* Main arc */}
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#arcGrad)" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        filter="url(#arcGlow)"
        style={{ transition:"stroke-dashoffset 1.4s cubic-bezier(.22,1,.36,1)" }} />
    </svg>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiProps {
  label: string; value: number; suffix?: string;
  icon: React.ReactNode; accent: string; accentFaint: string;
  sub: string; badge?: string; alert?: boolean; delay?: number; loading?: boolean;
}
function KpiCard({ label, value, suffix="", icon, accent, accentFaint, sub, badge, alert=false, delay=0, loading=false }: KpiProps) {
  return (
    <div className="rp-kpi-card" style={{
      animationDelay: `${delay}s`,
      background: "linear-gradient(145deg, #0d1f38 0%, #09172c 100%)",
      border: `1px solid ${alert ? "rgba(248,113,113,.30)" : "rgba(45,212,191,.12)"}`,
      borderRadius: 22, padding: "24px 22px",
      boxShadow: alert
        ? "0 4px 28px rgba(248,113,113,.10), inset 0 1px 0 rgba(255,255,255,.04)"
        : "0 4px 24px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.04)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Top alert bar */}
      {alert && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,#f87171,#fbbf24)", borderRadius:"22px 22px 0 0" }} />}
      {/* Ambient glow */}
      <div style={{ position:"absolute", top:-40, right:-40, width:140, height:140, borderRadius:"50%", background:`radial-gradient(circle, ${accent}20 0%, transparent 70%)`, pointerEvents:"none" }} />
      {/* Scan line */}
      <div style={{ position:"absolute", left:0, right:0, height:"18%", background:`linear-gradient(to bottom, transparent, ${accent}07, transparent)`, animation:`rp-scan ${4+delay}s linear infinite`, pointerEvents:"none" }} />

      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:18, position:"relative", zIndex:2 }}>
        <div style={{ width:42, height:42, borderRadius:13, background:accentFaint, display:"flex", alignItems:"center", justifyContent:"center", color:accent }}>
          {icon}
        </div>
        {badge && (
          <div className="rp-mono" style={{ fontSize:9, fontWeight:700, color:alert?"#f87171":accent, background:alert?"rgba(248,113,113,.12)":accentFaint, borderRadius:7, padding:"3px 9px", letterSpacing:".08em", textTransform:"uppercase" }}>
            {badge}
          </div>
        )}
      </div>

      <div style={{ position:"relative", zIndex:2 }}>
        <div className="rp-display" style={{ fontSize:"clamp(1.9rem,2.8vw,2.4rem)", fontWeight:800, color:"#fff", lineHeight:1, marginBottom:6, letterSpacing:"-0.03em", animation:`rp-count .5s cubic-bezier(.22,1,.36,1) ${delay+.15}s both` }}>
          {loading
            ? <Loader2 size={30} color={accent} style={{ animation:"rp-spin 1s linear infinite" }} />
            : <Counter to={value} suffix={suffix} delay={(delay+.2)*1000} />}
        </div>
        <div style={{ fontSize:13.5, fontWeight:600, color:"rgba(255,255,255,.8)", marginBottom:5 }}>{label}</div>
        <div className="rp-mono" style={{ fontSize:9.5, color:"rgba(255,255,255,.28)", letterSpacing:".06em" }}>{sub}</div>
      </div>

      {/* Bottom bar */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${accent}44, transparent)` }} />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DoctorReportsPage() {
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const [adherenceRate,     setAdherenceRate]     = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [missedSessions,    setMissedSessions]    = useState(0);
  const [sessionsThisWeek,  setSessionsThisWeek]  = useState(0);
  const [patients,          setPatients]          = useState<any[]>([]);
  const [lastUpdated,       setLastUpdated]       = useState<Date|null>(null);

  const load = async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const pSnap = await getDocs(query(collection(db,"users"), where("role","==","patient"), where("assignedDoctorId","==",user.uid), where("connectionStatus","==","accepted")));
      const patientDocs = pSnap.docs.map(d => ({ id:d.id, ...d.data() }));
      setPatients(patientDocs);
      const pIds = patientDocs.map((p:any) => p.id);

      if (pIds.length === 0) { setLoading(false); setRefreshing(false); return; }

      // Adherence — same formula as home/AI companion
      const protoMap: Record<string,number> = {};
      const protoSnap = await getDocs(query(collection(db,"protocols"), where("patientId","in",pIds)));
      protoSnap.docs.forEach(d => { const x=d.data(); protoMap[x.patientId]=x.sessionsPerWeek??5; });

      const sevenAgo = Timestamp.fromDate(daysAgo(7));
      const gsSnap = await getDocs(query(collection(db,"game_sessions"), where("userId","in",pIds), where("timestamp",">=",sevenAgo), orderBy("timestamp","desc")));
      const spp: Record<string,number> = {};
      gsSnap.docs.forEach(d => { const s=d.data() as any; spp[s.userId]=(spp[s.userId]||0)+1; });

      let totalAdh=0;
      patientDocs.forEach((p:any) => { totalAdh += Math.min(100, Math.round(((spp[p.id]||0)/(protoMap[p.id]||5))*100)); });
      setAdherenceRate(Math.round(totalAdh/patientDocs.length));
      setCompletedSessions(Object.values(spp).reduce((a,b)=>a+b,0));

      const now = new Date();
      const sow = new Date(now); sow.setDate(now.getDate()-now.getDay()); sow.setHours(0,0,0,0);
      const eow = new Date(sow); eow.setDate(sow.getDate()+6); eow.setHours(23,59,59,999);

      const [schedSnap, apptSnap] = await Promise.all([
        getDocs(query(collection(db,"scheduled_sessions"), where("doctorId","==",user.uid))),
        getDocs(query(collection(db,"appointments"),       where("doctorId","==",user.uid))),
      ]);
      const raw = [...schedSnap.docs.map(d=>d.data()), ...apptSnap.docs.map(d=>d.data())];
      let rMissed=0, rWeek=0;
      raw.forEach((e:any) => {
        if (e.status==="cancelled") return;
        const t = new Date(`${e.scheduledDate}T${e.scheduledTime||"00:00"}:00`);
        if (t<now && e.status!=="completed") rMissed++;
        if (t>=sow && t<=eow) rWeek++;
      });
      setMissedSessions(rMissed);
      setSessionsThisWeek(rWeek);
      setLastUpdated(new Date());
    } catch(e) {
      console.error(e); setError("Could not load metrics.");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => { if (!authLoading && user) load(); else if (!authLoading && !user) router.push("/auth/doctor/signin"); }, [user, authLoading]);

  const adColor = adherenceRate >= 75 ? "#2DD4BF" : adherenceRate >= 50 ? "#fbbf24" : "#f87171";
  const tickerItems = ["CLINICAL ANALYTICS", "SESSION DATA", "PATIENT OUTCOMES", "DEVICE STATUS", "WEEKLY COHORT", "ADHERENCE METRICS"];

  return (
    <div className="rp" style={{ minHeight:"100vh", background:"#060d1a", paddingBottom:80 }}>
      <style>{CSS}</style>

      {/* ── Fixed ambient orbs ─────────────────────────────────────────── */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-12%", left:"10%", width:900, height:900, borderRadius:"50%", background:"radial-gradient(circle, rgba(45,212,191,.04) 0%, transparent 60%)" }} />
        <div style={{ position:"absolute", bottom:"-10%", right:"5%", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle, rgba(8,145,178,.05) 0%, transparent 60%)" }} />
        {/* Grid */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(45,212,191,.028) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,.028) 1px, transparent 1px)", backgroundSize:"56px 56px" }} />
      </div>

      <div style={{ maxWidth:1360, margin:"0 auto", padding:"40px 32px", position:"relative", zIndex:1 }}>

        {/* ══ HERO ════════════════════════════════════════════════════════ */}
        <div style={{
          background:"linear-gradient(135deg, #0B1E33 0%, #0d2a44 50%, #061525 100%)",
          borderRadius:30, padding:"0",
          marginBottom:28,
          boxShadow:"0 12px 60px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.05)",
          position:"relative", overflow:"hidden",
          animation:"rp-fade-up .7s cubic-bezier(.22,1,.36,1) both",
        }}>
          {/* Left accent stripe */}
          <div style={{ position:"absolute", left:0, top:0, bottom:0, width:4, background:"linear-gradient(to bottom, #2DD4BF, #0891b2, transparent)", borderRadius:"30px 0 0 30px" }} />
          {/* Scan lines */}
          <div style={{ position:"absolute", left:0, right:0, height:"12%", background:"linear-gradient(to bottom, transparent, rgba(45,212,191,.04), transparent)", animation:"rp-scan 5s linear infinite", pointerEvents:"none" }} />
          <div style={{ position:"absolute", left:0, right:0, height:"8%", background:"linear-gradient(to bottom, transparent, rgba(45,212,191,.02), transparent)", animation:"rp-scan2 7s linear infinite 2.5s", pointerEvents:"none" }} />
          {/* Corner glows */}
          <div style={{ position:"absolute", top:-80, right:-80, width:360, height:360, borderRadius:"50%", background:"radial-gradient(circle, rgba(45,212,191,.07) 0%, transparent 70%)", animation:"rp-glow-beat 5s ease-in-out infinite" }} />
          <div style={{ position:"absolute", bottom:-60, left:"35%", width:300, height:200, borderRadius:"50%", background:"radial-gradient(circle, rgba(8,145,178,.05) 0%, transparent 70%)" }} />

          <div style={{ display:"flex", alignItems:"stretch", position:"relative", zIndex:2 }}>
            {/* Left text */}
            <div style={{ flex:1, padding:"36px 44px" }}>
              <div className="rp-mono" style={{ fontSize:9, color:"rgba(45,212,191,.55)", textTransform:"uppercase", letterSpacing:".28em", marginBottom:10 }}>
                ReViveX · Clinical Intelligence
              </div>
              <h1 className="rp-display" style={{ fontSize:"clamp(1.6rem,2.6vw,2.2rem)", fontWeight:800, color:"#fff", margin:0, lineHeight:1.1, letterSpacing:"-0.02em" }}>
                Reports &<br /><span style={{ color:"#2DD4BF", textShadow:"0 0 40px rgba(45,212,191,.45)" }}>Analytics</span>
              </h1>
              <p style={{ fontSize:14, color:"rgba(255,255,255,.38)", marginTop:12, lineHeight:1.6, maxWidth:360 }}>
                Comprehensive clinical performance metrics, patient outcomes, and real-time therapy intelligence.
              </p>

              <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:28 }}>
                <button className="rp-export-btn" style={{ display:"flex", alignItems:"center", gap:9, background:"linear-gradient(135deg, #2DD4BF 0%, #0891b2 100%)", color:"#061525", border:"none", borderRadius:14, padding:"13px 24px", fontSize:13, fontWeight:800, cursor:"pointer", letterSpacing:".02em", boxShadow:"0 6px 28px rgba(45,212,191,.35)" }}>
                  <Download size={15} /> Export Report
                </button>
                <button
                  onClick={() => load(true)}
                  disabled={refreshing}
                  style={{ display:"flex", alignItems:"center", gap:7, background:"rgba(45,212,191,.08)", border:"1px solid rgba(45,212,191,.20)", borderRadius:14, padding:"13px 20px", color:"#2DD4BF", fontSize:13, fontWeight:700, cursor:"pointer", transition:"all .2s" }}>
                  <RefreshCw size={14} style={{ animation: refreshing?"rp-spin 1s linear infinite":"none" }} />
                  Refresh
                </button>
              </div>

              {lastUpdated && (
                <div className="rp-mono" style={{ fontSize:9, color:"rgba(255,255,255,.18)", marginTop:14, letterSpacing:".10em" }}>
                  LAST UPDATED · {lastUpdated.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", second:"2-digit" })}
                </div>
              )}
            </div>

            {/* Right arc ring */}
            <div style={{ width:300, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"36px 40px", borderLeft:"1px solid rgba(45,212,191,.08)", position:"relative" }}>
              <div className="rp-mono" style={{ fontSize:9, color:"rgba(45,212,191,.5)", textTransform:"uppercase", letterSpacing:".20em", marginBottom:16 }}>Cohort Adherence</div>
              <div style={{ position:"relative", width:200, height:200 }}>
                <ArcRing value={loading ? 0 : adherenceRate} color={adColor} />
                {/* Pulse ring */}
                {!loading && (
                  <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`2px solid ${adColor}`, opacity:.3, animation:"rp-pulse-ring 2.4s ease-out infinite" }} />
                )}
                {/* Center text */}
                <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                  <div className="rp-display" style={{ fontSize:"2.4rem", fontWeight:800, color:"#fff", lineHeight:1, letterSpacing:"-0.04em", textShadow:`0 0 30px ${adColor}60`, animation:"rp-count .8s cubic-bezier(.22,1,.36,1) .4s both" }}>
                    {loading ? "--" : <Counter to={adherenceRate} suffix="%" delay={600} />}
                  </div>
                  <div className="rp-mono" style={{ fontSize:9, color:"rgba(255,255,255,.30)", textTransform:"uppercase", letterSpacing:".14em", marginTop:4 }}>Weekly avg</div>
                </div>
              </div>
              {/* Live indicator */}
              <div style={{ display:"flex", alignItems:"center", gap:7, marginTop:14 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:"#2DD4BF", boxShadow:"0 0 10px #2DD4BF", animation:"rp-pulse 2s ease-in-out infinite" }} />
                <span className="rp-mono" style={{ fontSize:9, color:"rgba(45,212,191,.6)", letterSpacing:".16em", textTransform:"uppercase" }}>Live Signal</span>
              </div>
            </div>
          </div>

          {/* Bottom ticker */}
          <div style={{ borderTop:"1px solid rgba(45,212,191,.07)", padding:"10px 44px", display:"flex", alignItems:"center", gap:14, position:"relative", zIndex:2 }}>
            <div className="rp-mono" style={{ fontSize:8.5, color:"rgba(45,212,191,.5)", letterSpacing:".22em", textTransform:"uppercase", flexShrink:0 }}>LIVE ▶</div>
            <div className="rp-ticker-wrap" style={{ flex:1 }}>
              <div className="rp-ticker-inner">
                {[...tickerItems, ...tickerItems].map((t, i) => (
                  <span key={i} className="rp-mono" style={{ fontSize:8.5, color:"rgba(255,255,255,.18)", letterSpacing:".18em", textTransform:"uppercase" }}>
                    {t} <span style={{ color:"rgba(45,212,191,.35)", margin:"0 16px" }}>·</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ KPI GRID ════════════════════════════════════════════════════ */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:16, marginBottom:26 }}>
          <KpiCard label="Adherence Rate"      value={adherenceRate}    suffix="%" icon={<TrendingUp size={20}/>}   accent="#2DD4BF" accentFaint="rgba(45,212,191,.12)"  sub="Plays vs. prescribed / week"  badge={adherenceRate>=70?"On Track":"Review"} delay={0.10} loading={loading} />
          <KpiCard label="Completed Sessions"  value={completedSessions}           icon={<CheckCircle2 size={20}/>} accent="#10b981" accentFaint="rgba(16,185,129,.12)"  sub="Game sessions this week"      badge={`${completedSessions} plays`}          delay={0.18} loading={loading} />
          <KpiCard label="Missed Sessions"     value={missedSessions}              icon={<AlertTriangle size={20}/>}accent="#f87171" accentFaint="rgba(248,113,113,.12)" sub="Past-due, not completed"       badge={missedSessions===0?"None ✓":"Follow-up"} alert={missedSessions>0} delay={0.26} loading={loading} />
          <KpiCard label="Sessions This Week"  value={sessionsThisWeek}            icon={<CalendarDays size={20}/>} accent="#a78bfa" accentFaint="rgba(167,139,250,.12)"  sub="Current calendar week"        delay={0.34} loading={loading} />
        </div>

        {/* ══ CHARTS ══════════════════════════════════════════════════════ */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:26 }}>
          {[
            { label:"Patient Outcomes", sub:"Therapy performance over time", accent:"#2DD4BF", accentFaint:"rgba(45,212,191,.10)", Chart:PatientOutcomesChart, delay:.40 },
            { label:"Adherence Trend",  sub:"Weekly completion rates",       accent:"#a78bfa", accentFaint:"rgba(167,139,250,.10)", Chart:AdherenceRateChart,   delay:.48 },
          ].map(({ label, sub, accent, accentFaint, Chart, delay }) => (
            <div key={label} className="rp-chart-wrap" style={{
              animationDelay:`${delay}s`,
              background:"linear-gradient(145deg, #0d1f38 0%, #09172c 100%)",
              border:"1px solid rgba(45,212,191,.10)",
              borderRadius:24, overflow:"hidden",
              boxShadow:"0 4px 32px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.04)",
            }}>
              {/* Chart header */}
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"20px 24px 16px", borderBottom:"1px solid rgba(45,212,191,.07)", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", left:0, right:0, height:"100%", background:`linear-gradient(to bottom, transparent, ${accent}04, transparent)`, animation:`rp-scan2 6s linear infinite`, pointerEvents:"none" }} />
                <div style={{ width:34, height:34, borderRadius:10, background:accentFaint, display:"flex", alignItems:"center", justifyContent:"center", color:accent, flexShrink:0 }}>
                  <Activity size={16} />
                </div>
                <div>
                  <div className="rp-display" style={{ fontSize:15, fontWeight:700, color:"#fff" }}>{label}</div>
                  <div className="rp-mono" style={{ fontSize:9, color:"rgba(255,255,255,.28)", letterSpacing:".08em" }}>{sub}</div>
                </div>
                <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:accent, animation:"rp-pulse 2s ease-in-out infinite" }} />
                  <span className="rp-mono" style={{ fontSize:8.5, color:accent, letterSpacing:".12em", textTransform:"uppercase" }}>Live</span>
                </div>
              </div>
              <div style={{ padding:"20px 24px 24px" }}><Chart /></div>
            </div>
          ))}

          {/* Device status — full width */}
          <div className="rp-chart-wrap" style={{
            animationDelay:".56s",
            gridColumn:"1 / -1",
            background:"linear-gradient(145deg, #0d1f38 0%, #09172c 100%)",
            border:"1px solid rgba(45,212,191,.10)",
            borderRadius:24, overflow:"hidden",
            boxShadow:"0 4px 32px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.04)",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"20px 24px 16px", borderBottom:"1px solid rgba(45,212,191,.07)", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", left:0, right:0, height:"100%", background:"linear-gradient(to bottom, transparent, rgba(16,185,129,.03), transparent)", animation:"rp-scan2 6s linear infinite 1s", pointerEvents:"none" }} />
              <div style={{ width:34, height:34, borderRadius:10, background:"rgba(16,185,129,.12)", display:"flex", alignItems:"center", justifyContent:"center", color:"#10b981", flexShrink:0 }}>
                <Activity size={16} />
              </div>
              <div>
                <div className="rp-display" style={{ fontSize:15, fontWeight:700, color:"#fff" }}>Device Status Overview</div>
                <div className="rp-mono" style={{ fontSize:9, color:"rgba(255,255,255,.28)", letterSpacing:".08em" }}>Hardware connectivity across all patients</div>
              </div>
              <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:"#10b981", animation:"rp-pulse 2s ease-in-out infinite" }} />
                <span className="rp-mono" style={{ fontSize:8.5, color:"#10b981", letterSpacing:".12em", textTransform:"uppercase" }}>Monitoring</span>
              </div>
            </div>
            <div style={{ padding:"20px 24px 24px" }}><DeviceStatusChart /></div>
          </div>
        </div>

        {/* ══ PATIENT DIRECTORY ═══════════════════════════════════════════ */}
        <div style={{
          background:"linear-gradient(145deg, #0d1f38 0%, #09172c 100%)",
          border:"1px solid rgba(45,212,191,.10)",
          borderRadius:26, overflow:"hidden",
          boxShadow:"0 4px 40px rgba(0,0,0,.40), inset 0 1px 0 rgba(255,255,255,.04)",
          animation:"rp-fade-up .7s cubic-bezier(.22,1,.36,1) .62s both",
        }}>
          {/* Directory header */}
          <div style={{ padding:"24px 32px", borderBottom:"1px solid rgba(45,212,191,.07)", display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", left:0, right:0, height:"100%", background:"linear-gradient(to bottom, transparent, rgba(45,212,191,.025), transparent)", animation:"rp-scan 5s linear infinite", pointerEvents:"none" }} />
            <div style={{ display:"flex", alignItems:"center", gap:14, position:"relative", zIndex:2 }}>
              <div style={{ width:42, height:42, borderRadius:13, background:"rgba(45,212,191,.10)", border:"1px solid rgba(45,212,191,.18)", display:"flex", alignItems:"center", justifyContent:"center", color:"#2DD4BF", animation:"rp-float 4s ease-in-out infinite" }}>
                <Users size={19} />
              </div>
              <div>
                <div className="rp-display" style={{ fontSize:17, fontWeight:700, color:"#fff", lineHeight:1.2 }}>Patient Reports Directory</div>
                <div className="rp-mono" style={{ fontSize:9, color:"rgba(255,255,255,.28)", textTransform:"uppercase", letterSpacing:".14em", marginTop:3 }}>Select a patient for detailed analytics &amp; clinical notes</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, position:"relative", zIndex:2 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:"#2DD4BF", boxShadow:"0 0 10px #2DD4BF", animation:"rp-pulse 2s ease-in-out infinite" }} />
              <span className="rp-mono" style={{ fontSize:9, color:"rgba(45,212,191,.65)", letterSpacing:".14em", textTransform:"uppercase" }}>
                {loading ? "Loading…" : `${patients.length} Active Patients`}
              </span>
            </div>
          </div>

          {/* Column labels */}
          {!loading && patients.length > 0 && (
            <div className="rp-mono" style={{ display:"grid", gridTemplateColumns:"1fr auto", fontSize:9, color:"rgba(255,255,255,.22)", textTransform:"uppercase", letterSpacing:".16em", padding:"10px 32px", borderBottom:"1px solid rgba(45,212,191,.05)", background:"rgba(0,0,0,.12)" }}>
              <span>Patient / Condition</span>
              <span style={{ marginRight:36 }}>ID</span>
            </div>
          )}

          {/* Body */}
          {loading ? (
            <div style={{ padding:"56px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
              <Loader2 size={32} color="#2DD4BF" style={{ animation:"rp-spin 1s linear infinite" }} />
              <span className="rp-mono" style={{ fontSize:10, color:"rgba(45,212,191,.45)", letterSpacing:".14em" }}>LOADING PATIENT DATA…</span>
            </div>
          ) : patients.length === 0 ? (
            <div style={{ padding:"56px 0", textAlign:"center" }}>
              <div style={{ width:60, height:60, borderRadius:"50%", background:"rgba(45,212,191,.07)", border:"1px solid rgba(45,212,191,.12)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", color:"#2DD4BF" }}>
                <Users size={26} />
              </div>
              <p className="rp-display" style={{ fontSize:15, fontWeight:700, color:"rgba(255,255,255,.7)", marginBottom:5 }}>No active patients found</p>
              <p className="rp-mono" style={{ fontSize:10, color:"rgba(255,255,255,.25)", letterSpacing:".08em" }}>Patients will appear once connected to your profile.</p>
            </div>
          ) : (
            patients.map((p, i) => (
              <div
                key={p.id}
                className="rp-patient-row"
                onClick={() => router.push(`/doctor/reports/${p.id}`)}
                style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"16px 32px",
                  borderBottom: i < patients.length-1 ? "1px solid rgba(45,212,191,.05)" : "none",
                  animationDelay:`${.68 + i*.06}s`,
                }}>
                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                  {/* Avatar */}
                  <div style={{ width:44, height:44, borderRadius:14, background:`linear-gradient(135deg, rgba(45,212,191,.18) 0%, rgba(8,145,178,.10) 100%)`, border:"1px solid rgba(45,212,191,.18)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, fontWeight:800, color:"#2DD4BF", flexShrink:0 }}>
                    {p.name ? p.name.charAt(0).toUpperCase() : "P"}
                  </div>
                  <div>
                    <div className="rp-display" style={{ fontSize:14.5, fontWeight:700, color:"rgba(255,255,255,.88)", marginBottom:3 }}>{p.name || "Unknown Patient"}</div>
                    <div className="rp-mono" style={{ fontSize:9.5, color:"rgba(255,255,255,.28)", letterSpacing:".06em" }}>{p.condition || "Neurological Rehabilitation"}</div>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div className="rp-mono" style={{ fontSize:10, color:"rgba(45,212,191,.55)", background:"rgba(45,212,191,.07)", border:"1px solid rgba(45,212,191,.12)", borderRadius:8, padding:"4px 11px", letterSpacing:".10em" }}>
                    {(p.patientId || p.id.slice(0,8)).toUpperCase()}
                  </div>
                  <div style={{ width:30, height:30, borderRadius:"50%", background:"rgba(45,212,191,.08)", border:"1px solid rgba(45,212,191,.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(45,212,191,.7)", transition:"all .2s ease" }}>
                    <ChevronRight size={15} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginTop:16, background:"rgba(248,113,113,.07)", border:"1px solid rgba(248,113,113,.20)", borderRadius:14, padding:"13px 18px", color:"#f87171", fontSize:13, display:"flex", alignItems:"center", gap:8 }}>
            <AlertTriangle size={15} /> {error}
          </div>
        )}
      </div>
    </div>
  );
}