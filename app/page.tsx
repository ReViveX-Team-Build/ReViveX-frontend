"use client";

import React, {

  useState, useEffect, useRef, useCallback, useMemo,

} from "react";

import { useRouter } from "next/navigation";

import {

  motion, AnimatePresence, useMotionValue,

  useScroll, useTransform, useSpring,

  useInView, useVelocity, Variants,

} from "framer-motion";

import {

  Play, Stethoscope, ArrowRight, ChevronDown,

  Cpu, Heart, Brain, Zap, BarChart3, Waves,

  Mail, Phone, Globe, Linkedin, Instagram,

  CheckCircle2, Sparkles, Activity, Shield, TrendingUp, Star,

} from "lucide-react";


const CSS = `

  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=Space+Mono:wght@400;700&display=swap');



  :root {

    --dk:  #080f1a;

    --dk2: #0B1E33;

    --dk3: #0d1f38;

    --tl:  #2DD4BF;

    --tl2: #0d9488;

    --wh:  #F8F9FA;

    --bd:  #374151;

    --mu:  #94a3b8;

  }



  *, *::before, *::after { cursor: none !important; box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: auto; }

  body { overflow-x: hidden; background: var(--dk); }

  ::selection { background: rgba(45,212,191,.35); color: #080f1a; }



  .fB { font-family: 'Bebas Neue','Arial Black',sans-serif; }

  .fS { font-family: 'DM Sans',system-ui,sans-serif; }

  .fM { font-family: 'Space Mono',monospace; }



  @keyframes ecgDraw {

    0%   { stroke-dashoffset: 2800; opacity: 1; }

    72%  { stroke-dashoffset: 0;    opacity: 1; }

    92%  { stroke-dashoffset: 0;    opacity: 1; }

    100% { stroke-dashoffset: 0;    opacity: 0; }

  }

  .ecg-line {

    stroke-dasharray: 2800;

    stroke-dashoffset: 2800;

    animation: ecgDraw 3.4s cubic-bezier(.4,0,.2,1) forwards;

  }



  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

  .blink { animation: blink .85s step-end infinite; }



  @keyframes gridDrift { to { background-position: 44px 44px; } }

  .grid-dk {

    background-image:

      linear-gradient(rgba(45,212,191,.028) 1px, transparent 1px),

      linear-gradient(90deg, rgba(45,212,191,.028) 1px, transparent 1px);

    background-size: 44px 44px;

    animation: gridDrift 6s linear infinite;

  }

  .grid-lt {

    background-image:

      linear-gradient(rgba(11,30,51,.042) 1px, transparent 1px),

      linear-gradient(90deg, rgba(11,30,51,.042) 1px, transparent 1px);

    background-size: 44px 44px;

  }



  @keyframes scanDown { 0%{top:-14%;opacity:0} 8%{opacity:.7} 92%{opacity:.7} 100%{top:116%;opacity:0} }

  .scanline {

    position: absolute; left: 0; right: 0; height: 13%;

    background: linear-gradient(to bottom, transparent, rgba(45,212,191,.045), transparent);

    animation: scanDown 7s linear infinite;

    pointer-events: none;

  }



  @keyframes shimSweep {

    0%   { transform: translateX(-180%) skewX(-12deg); }

    100% { transform: translateX(180%)  skewX(-12deg); }

  }

  .btn-shim::after {

    content: ''; position: absolute; inset: 0;

    background: linear-gradient(90deg,transparent,rgba(255,255,255,.3),transparent);

    animation: shimSweep 2.4s ease-in-out infinite;

  }



  @keyframes mLeft  { to { transform: translateX(-50%); } }

  @keyframes mRight { to { transform: translateX(0); } }

  .mqL { animation: mLeft  30s linear infinite; }

  .mqR { animation: mRight 30s linear infinite; transform: translateX(-50%); }



  @keyframes glowBreath { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:.62;transform:scale(1.08)} }

  .glow-breath { animation: glowBreath 5s ease-in-out infinite; }



  @keyframes floatUpDown {

    0%,100% { transform: translateY(0) rotate(-.35deg); }

    50%     { transform: translateY(-20px) rotate(.35deg); }

  }

  .float-card { animation: floatUpDown 7s ease-in-out infinite; }



  @keyframes ringPop {

    0%   { transform: translate(-50%,-50%) scale(.8); opacity: .8; }

    100% { transform: translate(-50%,-50%) scale(2.5); opacity: 0; }

  }

  .ring-pop {

    animation: ringPop 2.8s ease-out infinite;

    position: absolute; top: 50%; left: 50%;

  }



  .grain::after {

    content: ''; position: fixed; inset: 0; z-index: 9980; pointer-events: none;

    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E");

    opacity: .4;

  }



  @keyframes arcCW  { to { transform: rotate(360deg);  } }

  @keyframes arcCCW { to { transform: rotate(-360deg); } }

  .arc-cw  { animation: arcCW  3.5s linear infinite; transform-origin: center; }

  .arc-ccw { animation: arcCCW 2.2s linear infinite; transform-origin: center; }



  @keyframes heartPulse {

    0%,100% { transform: scale(1); }

    14%     { transform: scale(1.4); }

    28%     { transform: scale(1); }

    42%     { transform: scale(1.2); }

    56%     { transform: scale(1); }

  }

  .heartbeat { animation: heartPulse 1.4s ease-in-out infinite; }



  .tilt3d { transform-style: preserve-3d; will-change: transform; }



  @keyframes nodePulse { 0%,100%{opacity:.45} 50%{opacity:1} }

  input:focus, textarea:focus { outline: none; border-color: rgba(45,212,191,.5) !important; }

  .stat-card:hover { transform: translateY(-4px); box-shadow: 0 24px 60px rgba(45,212,191,.10); }

  .stat-card { transition: transform .35s, box-shadow .35s; }

  @keyframes deepGlow { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
  .deep-glow { animation: deepGlow 8s ease-in-out infinite; }

  @keyframes borderBreath {
    0%,100%{border-color:rgba(45,212,191,.08);box-shadow:0 0 0 rgba(45,212,191,0)}
    50%{border-color:rgba(45,212,191,.28);box-shadow:0 0 40px rgba(45,212,191,.07),inset 0 1px 0 rgba(45,212,191,.06)}
  }
  .border-breathe { animation:borderBreath 6s ease-in-out infinite; }

  .glass-dk { background:rgba(255,255,255,.028) !important; backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); }
  .glass-dk:hover { background:rgba(45,212,191,.045) !important; border-color:rgba(45,212,191,.24) !important; box-shadow:0 28px 80px rgba(45,212,191,.09),inset 0 1px 0 rgba(45,212,191,.07) !important; }
  .glass-dk { transition: background .4s, border-color .4s, box-shadow .4s; }

  /* ── DEPTH UTILITIES ───────────────────────────────────── */
  .depth-top { position:absolute;top:0;left:0;right:0;height:300px;pointer-events:none;background:linear-gradient(to bottom,rgba(45,212,191,.07),transparent); }
  .depth-bottom { position:absolute;bottom:0;left:0;right:0;height:300px;pointer-events:none;background:linear-gradient(to top,rgba(14,165,233,.06),transparent); }
  .depth-radial-tl { position:absolute;top:0;left:0;width:700px;height:600px;pointer-events:none;background:radial-gradient(ellipse at top left,rgba(45,212,191,.09),transparent 65%); }
  .depth-radial-br { position:absolute;bottom:0;right:0;width:700px;height:600px;pointer-events:none;background:radial-gradient(ellipse at bottom right,rgba(139,92,246,.07),transparent 65%); }

  /* ── SECTION ATMOSPHERIC ORBS ───────────────────────────── */
  /* Problem section — Red-tinted deep navy */
  .prob-orb-1 { position:absolute;top:-120px;right:-100px;width:700px;height:700px;pointer-events:none;background:radial-gradient(circle,rgba(239,68,68,.09) 0%,rgba(239,68,68,.04) 35%,transparent 70%);border-radius:50%; }
  .prob-orb-2 { position:absolute;bottom:-80px;left:-80px;width:500px;height:500px;pointer-events:none;background:radial-gradient(circle,rgba(251,113,133,.06) 0%,transparent 65%);border-radius:50%; }

  /* Solution section — Rich teal atmosphere */
  .sol-orb-1 { position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:900px;height:600px;pointer-events:none;background:radial-gradient(ellipse,rgba(45,212,191,.12) 0%,rgba(14,165,233,.06) 40%,transparent 70%); }
  .sol-orb-2 { position:absolute;bottom:-80px;right:-60px;width:480px;height:480px;pointer-events:none;background:radial-gradient(circle,rgba(139,92,246,.07),transparent 65%);border-radius:50%; }

  /* Offer section — Purple-tinted deep navy */
  .offer-orb-1 { position:absolute;top:-80px;right:0;width:650px;height:650px;pointer-events:none;background:radial-gradient(circle,rgba(139,92,246,.10) 0%,rgba(99,102,241,.05) 40%,transparent 70%);border-radius:50%; }
  .offer-orb-2 { position:absolute;bottom:-60px;left:-60px;width:500px;height:500px;pointer-events:none;background:radial-gradient(circle,rgba(45,212,191,.07),transparent 65%);border-radius:50%; }

  /* Why section — Gold-tinted atmosphere */
  .why-orb-1 { position:absolute;top:0;right:0;width:700px;height:700px;pointer-events:none;background:radial-gradient(circle at top right,rgba(251,191,36,.08) 0%,rgba(251,191,36,.03) 40%,transparent 65%); }
  .why-orb-2 { position:absolute;bottom:0;left:0;width:600px;height:600px;pointer-events:none;background:radial-gradient(circle at bottom left,rgba(52,211,153,.07),transparent 60%); }

  /* ── SECTION DIVIDERS ────────────────────────────────────── */
  .section-divider-teal { height:1px;background:linear-gradient(90deg,transparent,rgba(45,212,191,.35),transparent);position:relative; }
  .section-divider-red  { height:1px;background:linear-gradient(90deg,transparent,rgba(239,68,68,.3),transparent);position:relative; }

  /* ── STAT CARD — PROBLEM SECTION ───────────────────────── */
  .stat-problem { background:rgba(239,68,68,.06) !important; border:1px solid rgba(239,68,68,.15) !important; transition:background .35s,border-color .35s,box-shadow .35s,transform .35s; }
  .stat-problem:hover { background:rgba(239,68,68,.10) !important; border-color:rgba(239,68,68,.3) !important; box-shadow:0 20px 60px rgba(239,68,68,.12),inset 0 1px 0 rgba(239,68,68,.08) !important; transform:translateY(-4px); }

  /* ── OFFER CARD TINTS ───────────────────────────────────── */
  .offer-card-purple { background:rgba(139,92,246,.08) !important; border:1px solid rgba(139,92,246,.20) !important; }
  .offer-card-green  { background:rgba(52,211,153,.07) !important; border:1px solid rgba(52,211,153,.18) !important; }
  .offer-card-gold   { background:rgba(251,191,36,.06) !important; border:1px solid rgba(251,191,36,.18) !important; }

  /* ── HERO CHIP GLOW ─────────────────────────────────────── */
  @keyframes chipFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }

  /* ══ AMBIENT DRIFTING LIGHT SYSTEM ══════════════════════════ */
  /* Each light drifts along a slow Lissajous-like path         */
  @keyframes drift-a {
    0%   { transform: translate(0px,    0px)    scale(1);    }
    25%  { transform: translate(60px,  -40px)   scale(1.08); }
    50%  { transform: translate(20px,  -80px)   scale(0.95); }
    75%  { transform: translate(-40px, -30px)   scale(1.05); }
    100% { transform: translate(0px,    0px)    scale(1);    }
  }
  @keyframes drift-b {
    0%   { transform: translate(0px,   0px)   scale(1);    }
    20%  { transform: translate(-50px, 35px)  scale(1.06); }
    50%  { transform: translate(-80px,-20px)  scale(0.92); }
    80%  { transform: translate(30px,  50px)  scale(1.08); }
    100% { transform: translate(0px,   0px)   scale(1);    }
  }
  @keyframes drift-c {
    0%   { transform: translate(0px,  0px)    scale(1);    }
    33%  { transform: translate(70px, 60px)   scale(1.1);  }
    66%  { transform: translate(-30px,80px)   scale(0.93); }
    100% { transform: translate(0px,  0px)    scale(1);    }
  }
  @keyframes drift-d {
    0%   { transform: translate(0px,   0px)   scale(1);    }
    40%  { transform: translate(-60px,-70px)  scale(1.07); }
    70%  { transform: translate(50px, -50px)  scale(0.96); }
    100% { transform: translate(0px,   0px)   scale(1);    }
  }
  @keyframes opacityPulse {
    0%,100%{opacity:1} 50%{opacity:.55}
  }
  .aml { position:absolute; border-radius:50%; pointer-events:none; animation: opacityPulse 8s ease-in-out infinite; }
  .aml-a { animation: drift-a 22s ease-in-out infinite, opacityPulse 9s ease-in-out infinite; }
  .aml-b { animation: drift-b 28s ease-in-out infinite, opacityPulse 11s ease-in-out infinite; }
  .aml-c { animation: drift-c 18s ease-in-out infinite, opacityPulse 7s  ease-in-out infinite; }
  .aml-d { animation: drift-d 32s ease-in-out infinite, opacityPulse 13s ease-in-out infinite; }

  /* ── PROBLEM CARD HOVER GLOW ────────────────────────────── */
  .prob-insight-card { transition:background .4s,box-shadow .4s,transform .35s; }
  .prob-insight-card:hover { box-shadow:0 16px 60px rgba(239,68,68,.14),inset 0 1px 0 rgba(239,68,68,.08) !important; transform:translateY(-3px); }

  /* ── WHY CARD HOVER ─────────────────────────────────────── */
  .why-card { transition:background .4s,box-shadow .4s,transform .35s; }
  .why-card:hover { box-shadow:0 16px 70px rgba(45,212,191,.10),inset 0 1px 0 rgba(45,212,191,.06) !important; transform:translateY(-2px); }

  /* ══ HERO TITLE — REFINED CINEMATIC REVEAL ══════════════ */
  /* Word-level reveal: each line blurs + lifts in as a unit */
  @keyframes titleBeam {
    0%   { transform:scaleX(0); opacity:0; }
    20%  { opacity:1; }
    100% { transform:scaleX(1); opacity:1; }
  }
  @keyframes tealGlow {
    0%,100% { text-shadow:0 0 40px rgba(45,212,191,.22),0 0 80px rgba(45,212,191,.08); }
    50%     { text-shadow:0 0 60px rgba(45,212,191,.38),0 0 120px rgba(45,212,191,.15),0 2px 0 rgba(45,212,191,.12); }
  }
  @keyframes beamSweep {
    0%   { left:-100%; opacity:0; }
    5%   { opacity:1; }
    95%  { opacity:.7; }
    100% { left:110%; opacity:0; }
  }
  .hero-title-wrap  { position:relative; }
  .hero-beam-line   {
    position:absolute; bottom:-6px; left:0; right:0; height:2px;
    background:linear-gradient(90deg,transparent 0%,rgba(45,212,191,.9) 50%,transparent 100%);
    transform-origin:left; box-shadow:0 0 16px rgba(45,212,191,.7);
  }
  .hero-beam-sweep {
    position:absolute; top:0; bottom:0; width:60%; pointer-events:none;
    background:linear-gradient(90deg,transparent,rgba(45,212,191,.06),transparent);
    animation:beamSweep 5s linear infinite; animation-delay:3s;
  }
  .title-line-1 { color:#ffffff; display:block; }
  .title-line-2 {
    color:#2DD4BF; display:block;
    animation:tealGlow 4s ease-in-out infinite;
    animation-delay:1.8s;
  }

`;


function useLenis() {

  useEffect(() => {

    import("lenis").then(({ default: Lenis }) => {

      const l = new Lenis({ lerp: 0.075, smoothWheel: true });

      const raf = (t: number) => { l.raf(t); requestAnimationFrame(raf); };

      requestAnimationFrame(raf);

      return () => l.destroy();

    }).catch(() => { });

  }, []);

}

function useMouseParallax() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      x.set(e.clientX / window.innerWidth - 0.5);
      y.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", h, { passive: true });
    return () => window.removeEventListener("mousemove", h);
  }, [x, y]);

  return { x, y };
}



function useVelocitySkew() {

  const { scrollY } = useScroll();

  const vel = useVelocity(scrollY);

  const raw = useTransform(vel, [-2200, 2200], [-9, 9]);

  return useSpring(raw, { stiffness: 520, damping: 130 });

}


type RDir = "up" | "down" | "left" | "right" | "zoom" | "zoom-tilt" | "horizon" | "flip";

function Reveal({ children, dir = "up", delay = 0, className = "", style }:

  { children: React.ReactNode; dir?: RDir; delay?: number; className?: string; style?: React.CSSProperties }) {

  const ref = useRef(null);

  const seen = useInView(ref, { once: true, margin: "-65px" });

  const V: Record<RDir, Variants> = {

    up: { hidden: { y: 72, opacity: 0 }, visible: { y: 0, opacity: 1 } },

    down: { hidden: { y: -50, opacity: 0 }, visible: { y: 0, opacity: 1 } },

    left: { hidden: { x: -110, opacity: 0 }, visible: { x: 0, opacity: 1 } },

    right: { hidden: { x: 110, opacity: 0 }, visible: { x: 0, opacity: 1 } },

    zoom: { hidden: { scale: .7, opacity: 0 }, visible: { scale: 1, opacity: 1 } },

    "zoom-tilt": { hidden: { scale: .7, rotateY: -18, opacity: 0 }, visible: { scale: 1, rotateY: 0, opacity: 1 } },

    horizon: { hidden: { scaleX: .06, scaleY: .06, opacity: 0 }, visible: { scaleX: 1, scaleY: 1, opacity: 1 } },

    flip: { hidden: { rotateX: 90, opacity: 0 }, visible: { rotateX: 0, opacity: 1 } },

  };

  return (

    <motion.div ref={ref} className={className} style={style}

      variants={V[dir]} initial="hidden"

      animate={seen ? "visible" : "hidden"}

      transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}>

      {children}

    </motion.div>

  );

}

function SplitText({ text, style, className = "", delay = 0, stagger = 0.03 }:

  { text: string; style?: React.CSSProperties; className?: string; delay?: number; stagger?: number }) {

  const ref = useRef(null);

  const seen = useInView(ref, { once: true, margin: "-55px" });

  return (

    <span ref={ref} className={className} style={style} aria-label={text}>

      {text.split("").map((c, i) => (

        <motion.span key={i} style={{ display: "inline-block" }}

          initial={{ y: "120%", opacity: 0 }}

          animate={seen ? { y: "0%", opacity: 1 } : {}}

          transition={{ duration: .75, delay: delay + i * stagger, ease: [0.22, 1, 0.36, 1] }}>

          {c === " " ? "\u00A0" : c}

        </motion.span>

      ))}

    </span>

  );

}


function CountUp({ to, suffix = "", prefix = "", decimals = 0 }:

  { to: number; suffix?: string; prefix?: string; decimals?: number }) {

  const ref = useRef<HTMLSpanElement>(null);

  const inView = useInView(ref, { once: true, margin: "-50px" });

  const [val, setVal] = useState(0);

  useEffect(() => {

    if (!inView) return;

    let start: number | null = null;

    const dur = 1400;

    const raf = (ts: number) => {

      if (!start) start = ts;

      const p = Math.min((ts - start) / dur, 1);

      const eased = 1 - Math.pow(1 - p, 3);

      setVal(parseFloat((eased * to).toFixed(decimals)));

      if (p < 1) requestAnimationFrame(raf);

      else setVal(to);

    };

    requestAnimationFrame(raf);

  }, [inView, to, decimals]);

  return <span ref={ref}>{prefix}{decimals > 0 ? val.toFixed(decimals) : val}{suffix}</span>;

}


function TiltCard({ children, style = {}, className = "" }:

  { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {

  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {

    const el = ref.current; if (!el) return;

    const r = el.getBoundingClientRect();

    const x = ((e.clientX - r.left) / r.width - 0.5) * 2;

    const y = ((e.clientY - r.top) / r.height - 0.5) * 2;

    el.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.018)`;

    el.style.transition = "transform .07s";

  }, []);

  const onLeave = useCallback(() => {

    const el = ref.current; if (!el) return;

    el.style.transform = "perspective(900px) rotateY(0) rotateX(0) scale(1)";

    el.style.transition = "transform .55s cubic-bezier(.22,1,.36,1)";

  }, []);

  return (

    <div ref={ref} className={`tilt3d ${className}`} style={style}

      onMouseMove={onMove} onMouseLeave={onLeave}>

      {children}

    </div>

  );

}
function MagButton({ children, onClick, style = {}, className = "", type = "button" }:

  { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties; className?: string; type?: "button" | "submit" }) {

  const ref = useRef<HTMLButtonElement>(null);

  const RANGE = 90, PULL = 0.36;

  const onMove = useCallback((e: React.MouseEvent) => {

    const el = ref.current; if (!el) return;

    const r = el.getBoundingClientRect();

    const dx = e.clientX - (r.left + r.width / 2);

    const dy = e.clientY - (r.top + r.height / 2);

    if (Math.sqrt(dx * dx + dy * dy) < RANGE) {

      el.style.transform = `translate(${dx * PULL}px, ${dy * PULL}px)`;

      el.style.transition = "transform .15s";

    }

  }, []);

  const onLeave = useCallback(() => {

    const el = ref.current; if (!el) return;

    el.style.transform = "translate(0,0)";

    el.style.transition = "transform .55s cubic-bezier(.22,1,.36,1)";

  }, []);

  return (

    <button ref={ref} data-mag type={type} onClick={onClick}

      className={className} style={style}

      onMouseMove={onMove} onMouseLeave={onLeave}>

      {children}

    </button>

  );

}
function FloatingParticles({ count = 12 }: { count?: number }) {
  const P = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    dur: Math.random() * 14 + 10,
    delay: Math.random() * 16,
  })), [count]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <style>{`@keyframes floatUpFade{0%{transform:translateY(0);opacity:0}10%{opacity:.2}90%{opacity:.05}100%{transform:translateY(-110vh);opacity:0}}`}</style>
      {P.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: `${p.x}%`, bottom: -20,
          width: p.size, height: p.size, borderRadius: "50%", background: "#2DD4BF",
          animation: `floatUpFade ${p.dur}s ${p.delay}s ease-in infinite`,
        }} />
      ))}
    </div>
  );
}

const DeviceHoloCanvas = React.memo(function DeviceHoloCanvas({
  mouse,
}: {
  mouse: { x: any; y: any };
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el || typeof window === "undefined") return;

    let renderer: any = null;
    let frameId = 0;
    let model: any = null;
    let cleanup: (() => void) | undefined;

    // ── Drag state ────────────────────────────────────────
    let isDragging = false;
    let lastX = 0, lastY = 0;
    let rotX  = 0.2, rotY = 0.4;
    let velX  = 0,   velY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      velX = 0;
      velY = 0;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      (e.currentTarget as HTMLElement).style.cursor = "grabbing";
      e.preventDefault();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      rotY += dx * 0.008;
      rotX += dy * 0.008;
      velY = dx * 0.008;
      velX = dy * 0.008;
      lastX = e.clientX;
      lastY = e.clientY;
      if (model) {
        model.rotation.x = rotX;
        model.rotation.y = rotY;
      }
      e.preventDefault();
    };

    const onPointerUp = (e: PointerEvent) => {
      isDragging = false;
      (e.currentTarget as HTMLElement).style.cursor = "grab";
    };

    const init = async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import(
        "three/examples/jsm/loaders/GLTFLoader.js" as any
      );

      // ── Scene ─────────────────────────────────────────────
      const scene  = new THREE.Scene();
      const W = el.clientWidth, H = el.clientHeight;
      // Camera pulled back, positioned slightly higher so model
      // sits level with the "REWIRING" headline
      const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
      camera.position.set(0, 0.8, 5.0);
      camera.lookAt(0, 0.3, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      (renderer as any).outputColorSpace = "srgb";
      renderer.shadowMap.enabled = true;
      renderer.toneMapping = (THREE as any).ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.8;
      el.appendChild(renderer.domElement);

      // ── Attach drag events to the actual canvas element ───
      // The canvas sits on top and intercepts all pointer events.
      // We must listen on it directly — not the parent div.
      const cv = renderer.domElement;
      cv.style.cursor = "grab";
      cv.addEventListener("pointerdown", onPointerDown);
      cv.addEventListener("pointermove", onPointerMove);
      cv.addEventListener("pointerup",   onPointerUp);
      cv.addEventListener("pointerleave", onPointerUp);

      // ── Lighting — bright, cool, teal-accented ────────────
      // Strong ambient so model never looks dark
      scene.add(new THREE.AmbientLight(0xd4eeff, 2.4));

      // Main white key light from top-front
      const key = new THREE.DirectionalLight(0xffffff, 3.5);
      key.position.set(2, 6, 5);
      key.castShadow = true;
      scene.add(key);

      // Cool blue fill from opposite side
      const fill = new THREE.DirectionalLight(0xa8d8ff, 2.0);
      fill.position.set(-4, 2, 3);
      scene.add(fill);

      // Teal rim light from behind-below — signature glow
      const teal1 = new THREE.PointLight(0x2DD4BF, 6.0, 18);
      teal1.position.set(-2, -1, -3);
      scene.add(teal1);

      // Warm teal accent from front-left
      const teal2 = new THREE.PointLight(0x14b8a6, 4.0, 12);
      teal2.position.set(3, 3, 4);
      scene.add(teal2);

      // Ground bounce — soft warm white
      const bounce = new THREE.PointLight(0xffffff, 2.5, 10);
      bounce.position.set(0, -4, 2);
      scene.add(bounce);

      // ── Load GLB ──────────────────────────────────────────
      const loader = new (GLTFLoader as any)();
      loader.load(
        "/images/revivex_3d.glb",
        (gltf: any) => {
          model = gltf.scene;

          const box    = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size   = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale  = 2.8 / maxDim;

          model.scale.setScalar(scale);
          // Shift center down by scale then nudge up +0.4 to align
          // with the "REWIRING" headline on the left
          const offset = center.multiplyScalar(-scale);
          model.position.set(offset.x, offset.y + 0.4, offset.z);

          model.traverse((child: any) => {
            if (child.isMesh) {
              child.castShadow    = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.envMapIntensity = 2.0;
                child.material.needsUpdate    = true;
              }
            }
          });

          scene.add(model);
        },
        undefined,
        (err: any) => console.warn("GLB load error:", err)
      );

      // ── Resize ────────────────────────────────────────────
      const onResize = () => {
        const w = el.clientWidth, h = el.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      // ── Render loop ───────────────────────────────────────
      const draw = () => {
        frameId = requestAnimationFrame(draw);

        if (model && !isDragging) {
          // Inertia after release — smoothly coast to a stop
          velX *= 0.90;
          velY *= 0.90;
          rotX += velX;
          rotY += velY;
          model.rotation.x = rotX;
          model.rotation.y = rotY;
        }

        // Pulse teal lights gently
        const t = Date.now() * 0.001;
        teal1.intensity = 5.5 + Math.sin(t * 1.3) * 1.0;
        teal2.intensity = 3.5 + Math.sin(t * 0.9 + 1.0) * 0.8;

        renderer.render(scene, camera);
      };
      draw();

      return () => {
        window.removeEventListener("resize", onResize);
      };
    };

    init().then((c) => { cleanup = c; });

    return () => {
      cancelAnimationFrame(frameId);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup",   onPointerUp);
      el.removeEventListener("pointerleave",onPointerUp);
      if (cleanup) cleanup();
      if (renderer) {
        const cv = renderer.domElement;
        cv.removeEventListener("pointerdown", onPointerDown);
        cv.removeEventListener("pointermove", onPointerMove);
        cv.removeEventListener("pointerup",   onPointerUp);
        cv.removeEventListener("pointerleave",onPointerUp);
        renderer.dispose();
        if (el.contains(cv)) el.removeChild(cv);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position:   "absolute",
        inset:      0,
        width:      "100%",
        height:     "100%",
        zIndex:     20,
        willChange: "transform",
      }}
    />
  );
});
function MedicalCursor() {
  const TRAIL = 8;
  const [mode, setMode] = useState<"default" | "hover" | "click">("default");
  const [light, setLight] = useState(false);

  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);

  const smoothConfig = { damping: 25, stiffness: 600, mass: 0.5 };
  const rx = useSpring(mx, smoothConfig);
  const ry = useSpring(my, smoothConfig);

  const trailSprings = Array.from({ length: TRAIL - 1 }).map((_, i) => ({
    x: useSpring(mx, { damping: 20 + i * 2, stiffness: 400 - i * 40, mass: 0.8 }),
    y: useSpring(my, { damping: 20 + i * 2, stiffness: 400 - i * 40, mass: 0.8 }),
  }));

  useEffect(() => {
    let themeCheckFrame = 0;
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
      if (themeCheckFrame++ % 30 === 0) {
        let el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        while (el) {
          if (el.dataset?.theme === "light") { setLight(true); break; }
          if (el.dataset?.theme === "dark")  { setLight(false); break; }
          el = el.parentElement;
        }
      }
    };
    const onDown = () => setMode("click");
    const onUp   = () => setMode(m => m === "click" ? "default" : m);
    const onIn   = () => setMode("hover");
    const onOut  = () => setMode("default");

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);

    const els = document.querySelectorAll("button,a,[data-mag]");
    els.forEach(el => { el.addEventListener("mouseenter", onIn); el.addEventListener("mouseleave", onOut); });

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
      els.forEach(el => { el.removeEventListener("mouseenter", onIn); el.removeEventListener("mouseleave", onOut); });
    };
  }, [mx, my]);

  const C  = light ? "#0B1E33" : "#2DD4BF";
  const sz = mode === "hover" ? 54 : mode === "click" ? 22 : 32;

  return (
    <>
      {trailSprings.map(({ x, y }, i) => {
        const s = `${3.5 - i * 0.38}px`;
        return (
          <motion.div key={i}
            style={{ x, y, position: "fixed", top: 0, left: 0, zIndex: 99990, pointerEvents: "none", willChange: "transform" }}>
            <div style={{ width: s, height: s, borderRadius: "50%", background: C, transform: "translate(-50%,-50%)", opacity: (1 - i / TRAIL) * 0.32 }} />
          </motion.div>
        );
      })}

      <motion.div style={{ x: rx, y: ry, position: "fixed", top: 0, left: 0, zIndex: 99997, pointerEvents: "none", willChange: "transform" }}>
        <div style={{
          width: mode === "hover" ? 64 : mode === "click" ? 14 : 42,
          height: mode === "hover" ? 64 : mode === "click" ? 14 : 42,
          borderRadius: mode === "hover" ? 12 : "50%",
          border: `1px solid ${C}`,
          opacity: mode === "hover" ? .6 : .25,
          background: mode === "hover" ? `${C}0b` : "transparent",
          boxShadow: mode === "hover" ? `0 0 32px ${C}35` : "none",
          transform: "translate(-50%,-50%)",
          transition: "width .28s, height .28s, border-radius .3s, opacity .3s, background .3s, box-shadow .3s",
        }} />
      </motion.div>

      <motion.div style={{ x: mx, y: my, position: "fixed", top: 0, left: 0, zIndex: 99999, pointerEvents: "none", willChange: "transform" }}>
        <svg width={sz} height={sz} viewBox="-20 -20 40 40"
          style={{ display: "block", transition: "width .22s, height .22s", transform: "translate(-50%,-50%)" }}>
          <line x1="-17" y1="0" x2="-7" y2="0" stroke={C} strokeWidth={mode === "click" ? 1 : 1.5} strokeLinecap="round" />
          <line x1="7" y1="0" x2="17" y2="0" stroke={C} strokeWidth={mode === "click" ? 1 : 1.5} strokeLinecap="round" />
          <line x1="0" y1="-17" x2="0" y2="-7" stroke={C} strokeWidth={mode === "click" ? 1 : 1.5} strokeLinecap="round" />
          <line x1="0" y1="7" x2="0" y2="17" stroke={C} strokeWidth={mode === "click" ? 1 : 1.5} strokeLinecap="round" />
          <circle cx="0" cy="0" r={mode === "click" ? 1.2 : 1.9} fill={C} />
          <g className="arc-cw">
            <path d="M-14,0 A14,14 0 0,1 0,-14" stroke={C} strokeWidth="1.5" fill="none" style={{ filter: `drop-shadow(0 0 4px ${C})` }} />
          </g>
          <g className="arc-ccw">
            <path d="M14,0 A14,14 0 0,1 0,14" stroke={C} strokeWidth="1.5" fill="none" opacity=".5" />
          </g>
          <line x1="-13" y1="-13" x2="-10" y2="-10" stroke={C} strokeWidth=".7" opacity=".4" />
          <line x1="13" y1="-13" x2="10" y2="-10" stroke={C} strokeWidth=".7" opacity=".4" />
          <line x1="-13" y1="13" x2="-10" y2="10" stroke={C} strokeWidth=".7" opacity=".4" />
          <line x1="13" y1="13" x2="10" y2="10" stroke={C} strokeWidth=".7" opacity=".4" />
          {mode === "hover" && (
            <>
              <path d="M-17,-17 L-10,-17 M-17,-17 L-17,-10" stroke={C} strokeWidth="1.5" fill="none" />
              <path d="M17,-17 L10,-17 M17,-17 L17,-10" stroke={C} strokeWidth="1.5" fill="none" />
              <path d="M-17,17 L-10,17 M-17,17 L-17,10" stroke={C} strokeWidth="1.5" fill="none" />
              <path d="M17,17 L10,17 M17,17 L17,10" stroke={C} strokeWidth="1.5" fill="none" />
            </>
          )}
        </svg>
      </motion.div>
    </>
  );
}


function Preloader({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<"loading" | "ready" | "exit">("loading");
  const [msg, setMsg] = useState("DETECTING NEURAL SIGNAL...");

  // 1. Static initial state for Server-Side Rendering (Fixes Hydration Error)
  const [ecgPath, setEcgPath] = useState("M-50 80 L3000 80");

  const MSGS = [
    "DETECTING NEURAL SIGNAL...",
    "CALIBRATING GRIP SENSOR...",
    "LOADING THERAPY PROTOCOL...",
    "ESTABLISHING CLOUD LINK...",
    "ACTIVATING AI COMPANION...",
    "NEURAL LINK ESTABLISHED."
  ];

  // 2. Generate the random procedural path ONLY on the client after mount
  useEffect(() => {
    let path = "M-50 80";
    let x = -50;
    while (x < 3500) {
      const noiseLength = 80 + Math.random() * 200;
      const targetX = x + noiseLength;
      while (x < targetX) {
        x += 10 + Math.random() * 15;
        const y = 80 + (Math.random() - 0.5) * 6;
        path += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      x += 18; path += ` L${x.toFixed(1)} ${70 - Math.random() * 12}`;
      x += 12; path += ` L${x.toFixed(1)} ${80 + Math.random() * 4}`;
      x += 10; path += ` L${x.toFixed(1)} ${95 + Math.random() * 10}`;
      const isHuge = Math.random() > 0.8;
      x += 12; path += ` L${x.toFixed(1)} ${(isHuge ? -30 : 10).toFixed(1)}`;
      x += 14; path += ` L${x.toFixed(1)} ${(isHuge ? 190 : 150).toFixed(1)}`;
      if (Math.random() > 0.7) {
        x += 10; path += ` L${x.toFixed(1)} ${-5 - Math.random() * 20}`;
        x += 12; path += ` L${x.toFixed(1)} ${140 + Math.random() * 20}`;
      }
      x += 15; path += ` L${x.toFixed(1)} ${80 + (Math.random() - 0.5) * 8}`;
      x += 25; path += ` L${x.toFixed(1)} ${65 - Math.random() * 12}`;
      x += 20; path += ` L${x.toFixed(1)} 80`;
    }
    setEcgPath(path);
  }, []);

  // 3. Handle the loading sequence and phases
  useEffect(() => {
    const counter = setInterval(() => {
      setPct((p) => {
        if (p >= 100) { clearInterval(counter); return 100; }
        return p + 1;
      });
    }, 28);

    let mi = 0;
    const msgTimer = setInterval(() => {
      mi = Math.min(mi + 1, MSGS.length - 1);
      setMsg(MSGS[mi]);
    }, 600);

    const t1 = setTimeout(() => setPhase("ready"), 3200);
    const t2 = setTimeout(() => setPhase("exit"), 4200);
    const t3 = setTimeout(onDone, 5000);

    return () => { clearInterval(counter); clearInterval(msgTimer);[t1, t2, t3].forEach(clearTimeout); };
  }, [onDone]);

  return (
    <AnimatePresence>
      {phase !== "exit" && (
        <motion.div
          key="pl"
          exit={{ y: "-100%", opacity: 0, filter: "blur(10px)", transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] } }}
          style={{
            position: "fixed", inset: 0, zIndex: 9900,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            overflow: "hidden", background: "linear-gradient(160deg, #050c18 0%, #080f1a 50%, #060d1c 100%)",
          }}
        >
          <motion.div
            animate={{ opacity: phase === "ready" ? 0.8 : 0.4, scale: phase === "ready" ? 1.5 : 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "radial-gradient(circle at center, rgba(45,212,191,0.18) 0%, transparent 60%)"
            }}
          />

          <div className="grid-dk" style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: phase === "ready" ? 0.8 : 0.3, transition: "opacity 0.8s" }} />

          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", overflow: "hidden", pointerEvents: "none" }}>
            <svg width="100%" height="160" viewBox="0 0 3000 160" preserveAspectRatio="none">
              <motion.path d={ecgPath} fill="none" stroke="#2DD4BF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="bevel"
                style={{ filter: "blur(10px)" }}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: phase === "ready" ? 0 : 0.7 }}
                transition={{ duration: 2.8, ease: "linear" }}
              />
              <motion.path d={ecgPath} fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="bevel"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: phase === "ready" ? 0 : 1 }}
                transition={{ duration: 2.8, ease: "linear" }}
              />
            </svg>
          </div>

          <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
            <motion.div
              animate={phase === "ready" ? { scale: [1, 1.5, 1], filter: ["blur(0px)", "blur(6px)", "blur(0px)"] } : {}}
              transition={{ repeat: phase === "ready" ? Infinity : 0, duration: 0.4 }}
              style={{ marginBottom: 18, color: "#2DD4BF", display: "flex", justifyContent: "center" }}
              className={phase !== "ready" ? "heartbeat" : ""}
            >
              <Heart size={36} style={{ fill: "#2DD4BF", filter: phase === "ready" ? "drop-shadow(0 0 25px #2DD4BF)" : "none", transition: "filter 0.5s" }} />
            </motion.div>

            <div className="fM" style={{ fontSize: 9, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".42em", marginBottom: 24 }}>
              NEURO-REHABILITATION SYSTEM
            </div>

            <motion.div
              initial={{ opacity: 0, scale: .8 }}
              animate={{ opacity: 1, scale: phase === "ready" ? 1.05 : 1, textShadow: phase === "ready" ? "0 0 60px rgba(45,212,191,0.8)" : "none" }}
              transition={{ delay: .4, duration: .7 }}
              className="fB" style={{ fontSize: "clamp(4rem,14vw,11rem)", color: "#fff", letterSpacing: ".08em", lineHeight: 1 }}
            >
              REVIVE<motion.span animate={{ color: phase === "ready" ? "#fff" : "#2DD4BF" }} transition={{ duration: 0.5 }}>X</motion.span>
            </motion.div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 4, marginTop: 28, marginBottom: 14 }}>
              <motion.span
                animate={{ color: phase === "ready" ? "#2DD4BF" : "rgba(255,255,255,.85)" }}
                className="fM" style={{ fontSize: "3.2rem", lineHeight: 1 }}
              >
                {String(pct).padStart(3, "0")}
              </motion.span>
              <span className="fM blink" style={{ fontSize: "1.6rem", color: "#2DD4BF", marginBottom: 4 }}>%</span>
            </div>

            <div style={{ width: 240, height: 2, background: "rgba(255,255,255,.1)", margin: "0 auto 14px", overflow: "hidden", borderRadius: 2 }}>
              <motion.div
                animate={{ width: `${pct}%`, background: phase === "ready" ? "#fff" : "#2DD4BF" }}
                transition={{ duration: .05 }}
                style={{ height: "100%", boxShadow: "0 0 14px rgba(45,212,191,.8)" }}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={phase === "ready" ? "SYSTEM ONLINE." : msg}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: .3 }}
                className="fM"
                style={{
                  fontSize: phase === "ready" ? 11 : 9,
                  color: phase === "ready" ? "#2DD4BF" : "rgba(255,255,255,.3)",
                  textTransform: "uppercase",
                  letterSpacing: ".24em",
                  fontWeight: phase === "ready" ? "bold" : "normal"
                }}
              >
                {phase === "ready" ? "SYSTEM ONLINE. INITIALIZING UI..." : msg}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Navbar() {

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {

    const h = () => setScrolled(window.scrollY > 60);

    window.addEventListener("scroll", h, { passive: true });

    return () => window.removeEventListener("scroll", h);

  }, []);

  return (

    <motion.nav initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}

      transition={{ delay: .3, duration: .9, ease: [0.22, 1, 0.36, 1] }}

      style={{

        position: "fixed", top: 0, left: 0, right: 0, zIndex: 500,

        display: "flex", alignItems: "center", justifyContent: "space-between",

        padding: "18px 40px",

        background: scrolled ? "rgba(8,15,26,.9)" : "transparent",

        backdropFilter: scrolled ? "blur(22px)" : "none",

        borderBottom: scrolled ? "1px solid rgba(45,212,191,.16)" : "none",

        transition: "background .4s, backdrop-filter .4s, border .4s",

      }}>

      <div className="fB" style={{ fontSize: 22, letterSpacing: ".1em", color: "#fff" }}>

        REVIVE<span style={{ color: "#2DD4BF" }}>X</span>

      </div>

      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>

        {[["Problem", "#problem"], ["Solution", "#solution"], ["Offer", "#offer"], ["Why Us", "#why"], ["Contact", "#contact"]].map(([l, h]) => (

          <a key={l} href={h} data-mag className="fM"

            style={{
              fontSize: 9, textTransform: "uppercase", letterSpacing: ".22em",

              color: "rgba(255,255,255,.52)", textDecoration: "none", transition: "color .3s"
            }}

            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,.85)")}

            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.38)")}>

            {l}

          </a>

        ))}

      </div>

      <a href="#contact" data-mag className="fM"

        style={{
          fontSize: 9, textTransform: "uppercase", letterSpacing: ".2em",

          color: "#2DD4BF", padding: "8px 18px", borderRadius: 99,

          border: "1px solid rgba(45,212,191,.3)", textDecoration: "none", transition: "background .3s"
        }}

        onMouseEnter={e => (e.currentTarget.style.background = "rgba(45,212,191,.1)")}

        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

        ● Get Started

      </a>

    </motion.nav>

  );

}



// ── NEON TITLE — Cinematic word-blur reveal ─────────────────────────────────
function NeonTitle({ line1 = "REWIRING", line2 = "RECOVERY." }: { line1?: string; line2?: string }) {
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, margin: "-40px" });

  // Shared easing for both lines
  const ease: [number,number,number,number] = [0.16, 1, 0.3, 1];

  return (
    <div ref={ref} className="hero-title-wrap" style={{ marginBottom: 32, lineHeight: 0.9 }}>

      {/* Beam sweep — scans once across the title block after reveal */}
      <div className="hero-beam-sweep" />

      {/* LINE 1 — white, lifts + unblurs */}
      <div style={{ overflow: "hidden", display: "block" }}>
        <motion.div
          className="fB title-line-1"
          style={{ fontSize: "clamp(3.8rem,9.5vw,9rem)", letterSpacing: ".03em" }}
          initial={{ y: "100%", filter: "blur(18px)", opacity: 0 }}
          animate={seen ? { y: "0%", filter: "blur(0px)", opacity: 1 } : {}}
          transition={{ duration: 1.1, delay: 0.3, ease }}
        >
          {line1}
        </motion.div>
      </div>

      {/* LINE 2 — teal, slight delay, same reveal */}
      <div style={{ overflow: "hidden", display: "block" }}>
        <motion.div
          className="fB title-line-2"
          style={{ fontSize: "clamp(3.8rem,9.5vw,9rem)", letterSpacing: ".03em" }}
          initial={{ y: "100%", filter: "blur(18px)", opacity: 0 }}
          animate={seen ? { y: "0%", filter: "blur(0px)", opacity: 1 } : {}}
          transition={{ duration: 1.1, delay: 0.55, ease }}
        >
          {line2}
        </motion.div>
      </div>

      {/* Thin beam line — draws in from left after text lands */}
      <motion.div
        className="hero-beam-line"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={seen ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: 1.0, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: "left" }}
      />
    </div>
  );
}

function HeroSection() {

  const router = useRouter();

  const skewY = useVelocitySkew();

  const mouse = useMouseParallax();

  const smoothX = useSpring(mouse.x, { stiffness: 90, damping: 22 });

  const smoothY = useSpring(mouse.y, { stiffness: 90, damping: 22 });



  const gX = useTransform(smoothX, v => v * 2);

  const gY = useTransform(smoothY, v => v * 2);

  const nX = useTransform(smoothX, v => v * 6);

  const nY = useTransform(smoothY, v => v * 6);

  const dX = useTransform(smoothX, v => v * 10);

  const dY = useTransform(smoothY, v => v * 10);



  return (

    <section data-theme="dark" style={{

      position: "relative", minHeight: "100vh",

      display: "flex", flexDirection: "column",

      alignItems: "center", justifyContent: "center",

      overflow: "hidden", background: "#080f1a",

    }}>

      {/* Breathing glow */}

      <motion.div style={{ x: gX, y: gY, position: "absolute", inset: 0, pointerEvents: "none" }}>

        <div className="glow-breath" style={{
          width: "100%", height: "100%",

          background: "radial-gradient(ellipse 70% 65% at 50% 58%, rgba(45,212,191,.18), transparent 68%)"
        }} />

      </motion.div>



      <div className="grid-dk" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

      {/* Ambient drifting lights */}
      <div className="aml aml-a" style={{ width:500, height:500, top:"10%",  left:"5%",   background:"radial-gradient(circle,rgba(45,212,191,.055),transparent 70%)" }} />
      <div className="aml aml-b" style={{ width:600, height:600, top:"30%",  right:"-5%", background:"radial-gradient(circle,rgba(14,165,233,.045),transparent 70%)" }} />
      <div className="aml aml-c" style={{ width:400, height:400, bottom:"5%",left:"20%",  background:"radial-gradient(circle,rgba(139,92,246,.035),transparent 70%)" }} />

      {/* Decorative diagonal lines */}

      {[7, 22, 48, 74, 90].map((p, i) => (

        <div key={i} style={{
          position: "absolute", top: "-30%", left: `${p}%`,

          width: 1, height: "180%", pointerEvents: "none",

          background: `linear-gradient(to bottom,transparent,rgba(45,212,191,${.042 - i * .006}),transparent)`,

          transform: `rotate(${-13 + i * 5}deg)`
        }} />

      ))}

      <div className="scanline" />

      <FloatingParticles count={12} />

      {/* Neural network layer */}

      {/* Neural network layer — 3D brain, right side */}

      {/* ── TWO-COLUMN LAYOUT ────────────────────────────────── */}
      <motion.div style={{
        skewY, width: "100%", maxWidth: 1400,
        padding: "0 40px", display: "flex",
        flexDirection: "row", alignItems: "center",
        position: "relative", zIndex: 10,
        minHeight: "100vh",
      }}>

        {/* LEFT COLUMN — Text content */}
        <div style={{
          flex: "0 0 52%", display: "flex", flexDirection: "column",
          justifyContent: "center", padding: "120px 60px 100px 20px",
        }}>

        {/* Badge */}

        <Reveal dir="down" delay={.2}>

          <div className="fM" style={{
            fontSize: 9, textTransform: "uppercase", letterSpacing: ".28em",

            color: "rgba(255,255,255,.52)", marginBottom: 38,

            display: "flex", alignItems: "center", gap: 10,

            padding: "8px 20px", borderRadius: 99, width: "fit-content",

            background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)"
          }}>

            <Heart size={11} style={{ color: "#2DD4BF" }} className="heartbeat" />

            Democratizing Neuro-Rehabilitation · SDGP CS-09

          </div>

        </Reveal>



        {/* Headline — NeonTitle replaces old SplitText */}
        <NeonTitle line1="REWIRING" line2="RECOVERY." />



        {/* Tagline */}

        <Reveal dir="up" delay={1.1}>
          <p className="fS" style={{
            color: "rgba(255,255,255,.70)", fontSize: 16,
            maxWidth: 440, lineHeight: 1.72,
            fontWeight: 300, marginBottom: 48,
          }}>
            A revolutionary IoT device that turns repetitive physiotherapy into
            <span style={{ color: "rgba(255,255,255,.92)", fontWeight: 500 }}> immersive games</span>
            {" "}— so patients <span style={{ color: "#2DD4BF", fontWeight: 600 }}>actually want</span> to recover.
          </p>
        </Reveal>

        {/* CTA pill */}
        <Reveal dir="up" delay={1.5}>
          <div style={{
            display: "flex", flexDirection: "row", alignItems: "center", gap: 8, padding: 8,
            borderRadius: 32, background: "rgba(255,255,255,.03)",
            border: "1px solid rgba(255,255,255,.09)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 24px 64px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.04)",
            width: "fit-content",
          }}>
            <MagButton onClick={() => router.push("/auth/patient/signin")}
              className="btn-shim fB"
              style={{
                position: "relative", overflow: "hidden",
                display: "flex", alignItems: "center", gap: 12,
                padding: "16px 36px", borderRadius: 24, fontSize: 14, letterSpacing: ".12em",
                background: "#2DD4BF", color: "#080f1a", border: "none",
                boxShadow: "0 0 55px rgba(45,212,191,.42)"
              }}>
              <Play size={15} style={{ fill: "#080f1a", position: "relative", zIndex: 1 }} />
              <span style={{ position: "relative", zIndex: 1 }}>Patient Sign In</span>
            </MagButton>
            <div style={{ width: 1, height: 42, background: "rgba(255,255,255,.07)" }} />
            <MagButton onClick={() => router.push("/auth/doctor/signin")}
              className="fB"
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "16px 32px", borderRadius: 24, fontSize: 14, letterSpacing: ".12em",
                background: "transparent", color: "rgba(255,255,255,.82)", border: "none"
              }}>
              <Stethoscope size={15} />
              Clinician Access
              <ArrowRight size={12} style={{ opacity: .45 }} />
            </MagButton>
          </div>
        </Reveal>

        {/* Scroll hint — stays inside left col at bottom */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 2.9, duration: 1 }}
          style={{
            display: "flex", flexDirection: "column", alignItems: "flex-start",
            gap: 8, color: "rgba(255,255,255,.25)", marginTop: 52,
          }}>
          <span className="fM" style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: ".3em" }}>Scroll</span>
          <motion.div animate={{ y: [0, 7, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
            <ChevronDown size={13} />
          </motion.div>
        </motion.div>

        </div>{/* end LEFT COLUMN */}

        {/* RIGHT COLUMN — Device Canvas */}
        <div style={{
          flex: "0 0 48%",
          position: "relative",
          height: "100vh",
          minHeight: 600,
        }}>
          <DeviceHoloCanvas mouse={mouse} />

          {/* chips rendered inside canvas — no JSX duplication */}

          {/* no column separator — seamless blend */}
        </div>

      </motion.div>{/* end TWO-COLUMN wrapper */}

    </section>

  );

}

//  ROAD BRIDGE  
const RoadBridge = React.memo(function RoadBridge() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const bgColor = useTransform(p, [0, .6, .85, 1], ["#080f1a", "#080f1a", "#0B1E33", "#F8F9FA"]);
  const sweepX = useTransform(p, [0, .10], ["-100%", "100%"]);
  const sweepOp = useTransform(p, [3, .01, .10, .15], [2, 0, 0, 5]);

  const iw = typeof window !== "undefined" ? window.innerWidth : 1440;

  // ─── THE PATTERN ──────────────────────────────────────────────
 
  const t1 = 0.20; // THE ends
  const t2 = 0.40; // PROBLEM ends
  const t3 = 0.60; // IS REAL ends
  const t4 = 0.80; // 28% ends

  const yC = useTransform(p, [0, 1], [0, -800]);

  // 1. THE
  const theScale = useTransform(p, [0, t1], [1, 15]);
  const theOp = useTransform(p, [0, t1], [1, 0]);

  // 2. PROBLEM (Moves UP during t1, Zooms out during t2)
  const probY = useTransform(p, [0, t1], [1000, 0]);
  const probScale = useTransform(p, [t1, t2], [1, 10]);
  const probOp = useTransform(p, [0, t1, t2], [0, 1, 0]);

  // 3. IS REAL (Moves HORIZONTALLY during t2, Zooms out during t3)
  const realX = useTransform(p, [t1, t2], [1000, 0]);
  const realScale = useTransform(p, [t2, t3], [1, 10]);
  const realOp = useTransform(p, [t1, t2, t3], [0, 1, 0]);

  // 4. 28% & STATS (Moves UP during t3, Zooms out during t4)
  const statY = useTransform(p, [t2, t3], [1000, 0]);
  const statScale = useTransform(p, [t3, t4], [1, 10]);
  const statOp = useTransform(p, [t2, t3, t4], [0, 1, 0]);

  const statsY = useTransform(p, [t2, t3], [1000, 0]);
  const statsScale = useTransform(p, [t3, t4], [1, 10]);
  const statsOp = useTransform(p, [t2, t3, t4], [0, 1, 0]);

  

  // ──────────────────────────────────────────────────────────────

  const textCol = useTransform(p, [.72, .85], ["#FFFFFF", "#0B1E33"]);
  const subCol = useTransform(p, [.72, .85], ["rgba(255,255,255,.5)", "rgba(11,30,51,.6)"]);

  const centerWrap: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    pointerEvents: "none",
  };

  return (
    <div ref={ref} style={{ height: "250vh", position: "relative" }}>

      <div className="grid-dk" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      <div className="scanline" />

      <motion.div style={{
        position: "sticky", top: 0, height: "100vh", overflow: "hidden", backgroundColor: bgColor, perspective: 1000
      }}>

        <motion.div style={{ x: sweepX, opacity: sweepOp, position: "absolute", top: "50%", left: 0, width: "100%", height: 3, background: "linear-gradient(90deg,transparent,#2DD4BF,transparent)", boxShadow: "0 0 30px rgba(45,212,191,1)", pointerEvents: "none" }} />

        {/* 1. THE */}
        <div style={{ ...centerWrap, zIndex: 2 }}>
          <motion.div style={{ scale: theScale, opacity: theOp, display: "flex", flexDirection: "column", alignItems: "center", willChange: "transform, opacity" }}>
            <motion.span className="fB" style={{ fontSize: "clamp(5rem,14vw,13rem)", letterSpacing: ".05em", color: textCol, lineHeight: .9 }}>
              THE
            </motion.span>
          </motion.div>
        </div>

        {/* 2. PROBLEM */}
        <div style={{ ...centerWrap, zIndex: 10 }}>
          <motion.div style={{ scale: probScale, opacity: probOp, y: probY, willChange: "transform, opacity" }}>
            <motion.span className="fB" style={{ fontSize: "clamp(8rem,20vw,20rem)", letterSpacing: ".06em", color: textCol, lineHeight: 1 }}>PROBLEM</motion.span>
          </motion.div>
        </div>

        {/* 3. IS REAL */}
        <div style={{ ...centerWrap, zIndex: 4 }}>
          
          <motion.div style={{ x: realX, scale: realScale, opacity: realOp, willChange: "transform, opacity" }}>
            <span className="fB" style={{ fontSize: "clamp(5rem,14vw,13rem)", letterSpacing: ".05em", color: "#ef4444", lineHeight: .9 }}>IS REAL.</span>
          </motion.div>
        </div>

        {/* 4. 28% BACKGROUND */}
        <div style={centerWrap}>
        
          <motion.div style={{ opacity: statOp, scale: statScale, y: statY, height: "50px", willChange: "transform, opacity" }}>
            <span className="fB" style={{ fontSize: "clamp(10rem,30vw,30rem)", color: "#ef4444", letterSpacing: ".02em", lineHeight: 1, filter: "blur(1px)" }}>28%</span>
          </motion.div>
          
          <motion.div className="fM" style={{ opacity: statOp, fontSize: 10, textTransform: "uppercase", letterSpacing: ".3em", color: "rgba(45,212,191,.55)", marginTop: 14 }}>
            Of patients quit physiotherapy at home
          </motion.div>
        </div>

        {/* 4. STATS FLOATING DATA */}
       
        <motion.div style={{ position: "absolute", inset: 0, scale: statsScale, opacity: statsOp, y: statsY, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, willChange: "transform, opacity" }}>
          {[
            { v: "80%", l: "Drop-out rate", x: -38, y: -25 },
            { v: "$50K+", l: "Robotic cost", x: 38, y: -22 },
            { v: "6–12m", l: "Recovery time", x: -38, y: 30 },
            { v: "3 wks", l: "Before they quit", x: 38, y: 28 },
          ].map(s => (
            <motion.div key={s.v} style={{ position: "absolute", left: `${50 + s.x}vw`, top: `${50 + s.y}vh`, transform: "translate(-50%,-50%)" }}>
              <div style={{ textAlign: "center", padding: "10px 18px", borderRadius: 16, background: "rgba(8,15,26,.85)", border: "1px solid rgba(255,255,255,.06)", backdropFilter: "blur(12px)" }}>
                <div className="fB" style={{ fontSize: "2.2rem", color: "#ef4444", lineHeight: 1 }}>{s.v}</div>
                <div className="fM" style={{ fontSize: 8, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".18em" }}>{s.l}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </motion.div>
    </div>
  );
});
//  PROBLEM SECTION  

const ProblemSection = React.memo(function ProblemSection() {

  return (

    <section id="problem" data-theme="dark" style={{

      background: "linear-gradient(160deg, #0e0b16 0%, #091221 50%, #0a0e1a 100%)", padding: "120px 40px", position: "relative", overflow: "hidden",

    }}>

      <div className="prob-orb-1" />
      <div className="prob-orb-2" />
      <div className="depth-top" />
      <div className="grid-dk" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      <div className="scanline" />
      <div className="aml aml-b" style={{ width:450, height:450, top:"15%",  right:"8%",  background:"radial-gradient(circle,rgba(239,68,68,.055),transparent 70%)" }} />
      <div className="aml aml-d" style={{ width:350, height:350, bottom:"20%",left:"5%", background:"radial-gradient(circle,rgba(251,113,133,.04),transparent 70%)" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        <Reveal dir="left">

          <div className="fM" style={{
            fontSize: 9, color: "rgba(45,212,191,.65)", textTransform: "uppercase",

            letterSpacing: ".32em", marginBottom: 20, display: "flex", alignItems: "center", gap: 12
          }}>

            <span style={{ width: 32, height: 1, background: "rgba(45,212,191,.38)", display: "inline-block" }} />

            The Problem

          </div>

        </Reveal>

        <Reveal dir="zoom" style={{ marginBottom: 48 }}>

          <h2 className="fB" style={{ fontSize: "clamp(3.5rem,8vw,7.5rem)", color: "#fff", letterSpacing: ".03em", lineHeight: .9 }}>

            RECOVERY IS<br /><span style={{ color: "#ef4444", textShadow: "0 0 40px rgba(239,68,68,.5)" }}>BROKEN.</span>

          </h2>

        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginBottom: 52 }}>

          <Reveal dir="left" delay={.1}>

            <p className="fS" style={{ fontSize: 17, color: "rgba(255,255,255,.68)", lineHeight: 1.75, fontWeight: 300, maxWidth: 460, marginBottom: 24 }}>

              Traditional physiotherapy is repetitive, demoralising, and completely disconnected

              from daily life. No feedback. No motivation. No way to see invisible progress.

              Patients don't fail because they're lazy —{" "}

              <strong style={{ color: "#2DD4BF" }}>they quit because the system fails them.</strong>

            </p>

            <p className="fS" style={{ fontSize: 15, color: "rgba(255,255,255,.5)", lineHeight: 1.75, fontWeight: 300, maxWidth: 460 }}>

              High-end robotic rehabilitation systems cost over{" "}

              <strong style={{ color: "#2DD4BF" }}>LKR 5 million</strong>. Even if affordable,

              they only treat motor symptoms — ignoring the cognitive rewiring that neuroscience says is essential for real neuroplasticity.

            </p>


          </Reveal>

          <Reveal dir="right" delay={.15}>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              {[

                { n: 28, suf: "%", pref: "", l: "Home adherence", sub: "quit within 3 weeks", c: "#ef4444" },

                { n: 50, suf: "K+", pref: "$", l: "Robotic cost", sub: "vs our $200 solution", c: "#f97316" },

                { n: 80, suf: "%", pref: "", l: "Drop-out rate", sub: "before recovery target", c: "#ef4444" },

                { n: 9, suf: "m+", pref: "", l: "Recovery time", sub: "without proper adherence", c: "#f97316" },

              ].map((s, i) => (

                <Reveal key={s.l} dir="zoom" delay={i * .1}>

                  <TiltCard className="stat-card stat-problem" style={{
                    padding: "20px 18px", borderRadius: 22,

                    boxShadow: "0 8px 40px rgba(0,0,0,.35)"
                  }}>

                    <div className="fB" style={{ fontSize: "2.6rem", color: s.c, lineHeight: 1, marginBottom: 4 }}>

                      <CountUp to={s.n} suffix={s.suf} prefix={s.pref} />

                    </div>

                    <div className="fM" style={{ fontSize: 8, color: "rgba(255,255,255,.72)", textTransform: "uppercase", letterSpacing: ".18em", marginBottom: 4 }}>{s.l}</div>

                    <div className="fS" style={{ fontSize: 11, color: "rgba(255,255,255,.52)", lineHeight: 1.5 }}>{s.sub}</div>

                  </TiltCard>

                </Reveal>

              ))}

            </div>

          </Reveal>

        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>

          {[

            { t: "No Motivation", c: "#ef4444", b: "Squeezing a rubber ball 100 times with zero feedback isn't therapy — it's punishment. The brain doesn't rewire under boredom." },

            { t: "No Access", c: "#f97316", b: "Robotic exoskeletons cost more than a car. Hospital visits 3× a week for 6 months is unsustainable for almost any family." },

            { t: "Cognitive Gap", c: "#ef4444", b: "Every existing device only trains the hand. None address the cognitive recovery neuroscience says is essential for real neuroplasticity." },

          ].map((card, i) => (

            <Reveal key={card.t} dir="up" delay={i * .12}>

              <TiltCard className="prob-insight-card" style={{
                padding: "28px 24px", borderRadius: 26, height: "100%",

                background: "rgba(255,255,255,.04)", borderLeft: `3px solid ${card.c}`, boxShadow: "0 8px 40px rgba(0,0,0,.4)", border: "1px solid rgba(255,255,255,.07)"
              }}>

                <div className="fB" style={{ fontSize: 22, color: "#fff", letterSpacing: ".04em", marginBottom: 12 }}>{card.t}</div>

                <p className="fS" style={{ fontSize: 14, color: "rgba(255,255,255,.80)", lineHeight: 1.75, fontWeight: 300 }}>{card.b}</p>

              </TiltCard>

            </Reveal>

          ))}

        </div>

      </div>

    </section>

  );

});


//  DARK BRIDGE 

function DarkBridge() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Background transition
  const bg = useTransform(p, [0, 0.3], ["#F8F9FA", "#080f1a"]);

  const rawWordY = useTransform(p, [0, 0.18], [280, 0]);
  // No spring on scale — spring physics caused the lag. Direct transform only.
  const wordScale = useTransform(p, [0.28, 0.52], [1, 22]);
  const wordOp = useTransform(p, [0, 0.06, 0.38, 0.52], [0, 1, 1, 0]);

  const statsOp = useTransform(p, [0.22, 0.28, 0.42, 0.52], [0, 1, 1, 0]);

  // Light spring only on Y (fine for vertical glide, not scale)
  const wordY = useSpring(rawWordY, { stiffness: 180, damping: 28, restDelta: 0.001 });

  const absCenter: React.CSSProperties = {
    position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    pointerEvents: "none", width: "100%"
  };

  return (
    <div ref={ref} style={{ height: "170vh", position: "relative" }}>
      <motion.div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", backgroundColor: bg }}>
        <div className="grid-dk" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
        <div className="scanline" />

        {/* Floating Data Points */}
        <div style={absCenter}>
          <motion.div style={{
            position: "absolute", opacity: statsOp,
            width: "100vw", height: "100vh",
            z: 0
          }}>
            {[
              { label: "MOTOR", x: -36, y: -18, ang: -12, c: "#2DD4BF" },
              { label: "COGNITIVE", x: 34, y: -22, ang: 10, c: "#a78bfa" },
              { label: "CLINICAL", x: -32, y: 20, ang: -8, c: "#fbbf24" },
              { label: "REMOTE", x: 32, y: 22, ang: 6, c: "#34d399" },
            ].map(d => (
              <div key={d.label} style={{ position: "absolute", left: `calc(50% + ${d.x}vw)`, top: `calc(50% + ${d.y}vh)`, transform: `translate(-50%,-50%) rotate(${d.ang}deg)` }}>
                <div className="fM" style={{ fontSize: 10, color: d.c, textTransform: "uppercase", letterSpacing: ".24em", opacity: .8, whiteSpace: "nowrap" }}>
                  ·{d.label}·
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* THE SOLUTION */}
        <div style={absCenter}>
          {/* translateZ(0) forces hardware acceleration on the GPU */}
          <motion.div style={{
            y: wordY,
            scale: wordScale,
            opacity: wordOp,
            textAlign: "center",
            transformOrigin: "center center",
            z: 0
          }}>
            <div className="fB" style={{ fontSize: "clamp(5rem,15vw,16rem)", letterSpacing: "0.04em", lineHeight: .88, color: "#FFFFFF" }}>
              THE<br /><span style={{ color: "#2DD4BF" }}>SOLUTION</span>
            </div>
            <div className="fM" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".3em", marginTop: 26, color: "rgba(45,212,191,.8)" }}>
              ↓ A new paradigm in rehabilitation
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}


//  SOLUTION SECTION

const SolutionSection = React.memo(function SolutionSection() {
  return (
    <section id="solution" data-theme="dark" style={{ background: "linear-gradient(180deg, #04101a 0%, #061421 60%, #060e1a 100%)", padding: "120px 40px", position: "relative", overflow: "hidden" }}>
      <div className="sol-orb-1" />
      <div className="sol-orb-2" />
      <div className="aml aml-a" style={{ width:550, height:550, top:"20%",  left:"-5%",  background:"radial-gradient(circle,rgba(45,212,191,.06),transparent 70%)" }} />
      <div className="aml aml-c" style={{ width:400, height:400, bottom:"15%",right:"10%",background:"radial-gradient(circle,rgba(6,182,212,.05),transparent 70%)" }} />
      <div className="grid-dk" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      <div className="scanline" />
      <div className="glow-breath" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(45,212,191,.15), transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: 400, height: 400, pointerEvents: "none", background: "radial-gradient(circle at top right, rgba(139,92,246,.06), transparent 70%)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, width: 400, height: 400, pointerEvents: "none", background: "radial-gradient(circle at bottom left, rgba(45,212,191,.04), transparent 70%)" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <Reveal dir="up" style={{ textAlign: "center", marginBottom: 72 }}>
          <div className="fM" style={{ fontSize: 9, color: "rgba(45,212,191,.55)", textTransform: "uppercase", letterSpacing: ".32em", marginBottom: 16 }}>The Innovation</div>
          <h2 className="fB" style={{ fontSize: "clamp(3rem,8vw,7.5rem)", letterSpacing: ".03em", lineHeight: .88, color: "#fff" }}>
            YOU DON'T DO<br /><span style={{ color: "#2DD4BF" }}>EXERCISES.</span><br />YOU <span style={{ color: "#2DD4BF" }}>PLAY GAMES.</span>
          </h2>
        </Reveal>
{/* EXPANDED TABLET/GAMEPLAY CONTAINER */}
        <Reveal dir="zoom" style={{ marginBottom: 60, display: "flex", justifyContent: "center" }}>
          <div style={{ 
            borderRadius: 36, 
            overflow: "hidden", 
            border: "1px solid rgba(45,212,191,.14)", 
            boxShadow: "0 40px 100px rgba(0,0,0,.5)", 
            width: "90vw", 
            maxWidth: 1000 
          }}>
            <img 
              src="/image/fishgame.jpeg" 
              alt="ReViveX Gameplay" 
              style={{ 
                width: "100%", 
                height: "460px", 
                objectFit: "cover", 
                display: "block" 
              }} 
            />
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
          {[
            { n: "01", c: "#2DD4BF", icon: <Cpu size={26} strokeWidth={1.1} />, tag: "Hardware", t: "$200 IoT Controller", b: "BP bulb + ESP32 + MPX10DP pressure sensor + MPU6050 gyroscope. Medical-grade data capture at the cost of a restaurant dinner." },
            { n: "02", c: "#a78bfa", icon: <Zap size={26} strokeWidth={1.1} />, tag: "Therapy", t: "Dual-Task Gamification", b: "Squeeze to fly the character. Recall colour sequences to pass cognitive gates. Motor + cognitive rehab simultaneously — proven to drive neuroplasticity." },
            { n: "03", c: "#fbbf24", icon: <BarChart3 size={26} strokeWidth={1.1} />, tag: "Cloud", t: "Remote Clinical Dashboard", b: "Every squeeze streams live to Firebase. Grip force, tremor amplitude, reaction time — your doctor adjusts therapy remotely without clinic visits." },
          ].map((card, i) => (
            <Reveal key={card.n} dir="zoom" delay={i * .14}>
              <TiltCard style={{ padding: "38px 32px", borderRadius: 34, position: "relative", overflow: "hidden", height: "100%", background: `${card.c}0a`, border: `1px solid ${card.c}35`, boxShadow: `0 8px 40px rgba(0,0,0,.3), inset 0 1px 0 ${card.c}18` }}>
                <div className="scanline" />
                <div className="fB" style={{ position: "absolute", top: -18, right: -8, fontSize: "9rem", color: `${card.c}07`, lineHeight: 1, pointerEvents: "none" }}>{card.n}</div>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ width: 54, height: 54, borderRadius: 18, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", background: `${card.c}13`, border: `1px solid ${card.c}25`, color: card.c }}>{card.icon}</div>
                  <div className="fM" style={{ fontSize: 8, color: `${card.c}90`, textTransform: "uppercase", letterSpacing: ".22em", marginBottom: 10 }}>{card.tag}</div>
                  <h3 className="fB" style={{ fontSize: 26, color: "#fff", letterSpacing: ".04em", marginBottom: 14, lineHeight: 1.05 }}>{card.t}</h3>
                  <p className="fS" style={{ fontSize: 14, color: "rgba(255,255,255,.48)", lineHeight: 1.78, fontWeight: 300 }}>{card.b}</p>
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 24, right: 24, height: 1, background: `linear-gradient(90deg,transparent,${card.c}32,transparent)` }} />
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
});



//  OFFER SECTION  — white bento grid


const OfferSection = React.memo(function OfferSection() {

  return (

    <section id="offer" data-theme="dark" style={{ background: "linear-gradient(150deg, #0c0820 0%, #080b1c 50%, #060e20 100%)", padding: "120px 40px", position: "relative", overflow: "hidden" }}>

      <div className="offer-orb-1" />
      <div className="offer-orb-2" />
      <div className="aml aml-b" style={{ width:500, height:500, top:"10%",  left:"10%",  background:"radial-gradient(circle,rgba(139,92,246,.055),transparent 70%)" }} />
      <div className="aml aml-d" style={{ width:380, height:380, bottom:"10%",right:"5%", background:"radial-gradient(circle,rgba(99,102,241,.04),transparent 70%)" }} />
      <div className="grid-dk" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      <div className="scanline" />

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        <Reveal dir="left" style={{ marginBottom: 60 }}>

          <div className="fM" style={{ fontSize: 9, color: "rgba(167,139,250,.8)", textTransform: "uppercase", letterSpacing: ".3em", marginBottom: 12 }}>What We Offer</div>

          <h2 className="fB" style={{ fontSize: "clamp(3rem,7vw,6.5rem)", letterSpacing: ".03em", lineHeight: .9, color: "#fff" }}>

            EVERYTHING YOUR<br /><span style={{ color: "#a78bfa" }}>RECOVERY NEEDS.</span>

          </h2>

        </Reveal>



        {/* Row 1 */}

        <div style={{ display: "grid", gridTemplateColumns: "7fr 5fr", gap: 16, marginBottom: 16 }}>

          <Reveal dir="zoom">

            <TiltCard style={{ padding: "42px 38px", borderRadius: 34, background: "linear-gradient(145deg,#0e1d36,#0a1428)", minHeight: 300, position: "relative", overflow: "hidden", border: "1px solid rgba(45,212,191,.16)", boxShadow: "0 20px 80px rgba(45,212,191,.07), inset 0 1px 0 rgba(45,212,191,.08)" }}>

              <div className="scanline" />

              <div style={{
                position: "absolute", bottom: -40, right: -40, width: 200, height: 200, borderRadius: "50%", pointerEvents: "none",

                background: "radial-gradient(circle,rgba(45,212,191,.14),transparent 70%)"
              }} />

              <div style={{ position: "relative", zIndex: 1 }}>

                <div style={{
                  width: 54, height: 54, borderRadius: 18, marginBottom: 20,

                  display: "flex", alignItems: "center", justifyContent: "center",

                  background: "rgba(45,212,191,.12)", border: "1px solid rgba(45,212,191,.24)", color: "#2DD4BF"
                }}>

                  <Sparkles size={22} />

                </div>

                <div className="fM" style={{ fontSize: 8, color: "rgba(45,212,191,.55)", textTransform: "uppercase", letterSpacing: ".22em", marginBottom: 10 }}>AI-Powered</div>

                <h3 className="fB" style={{ fontSize: 30, color: "#fff", letterSpacing: ".04em", marginBottom: 14, lineHeight: 1.05 }}>

                  Therapy that grows with the patient.

                </h3>

                <p className="fS" style={{ fontSize: 14, color: "rgba(255,255,255,.52)", lineHeight: 1.78, fontWeight: 300, maxWidth: 400 }}>

                  Reinforcement learning monitors every squeeze and adjusts difficulty live.

                  An AI companion provides vocal encouragement. Always meeting you exactly where you are.

                </p>

              </div>

            </TiltCard>

          </Reveal>

          <Reveal dir="right" delay={.1}>

            <TiltCard className="offer-card-purple" style={{ padding: "36px 32px", borderRadius: 34, minHeight: 300, transition: "transform .35s, box-shadow .35s" }}>

              <div style={{
                width: 54, height: 54, borderRadius: 18, marginBottom: 20,

                display: "flex", alignItems: "center", justifyContent: "center",

                background: "rgba(139,92,246,.12)", border: "1px solid rgba(139,92,246,.2)", color: "#8b5cf6"
              }}>

                <Brain size={22} />

              </div>

              <div className="fM" style={{ fontSize: 8, color: "rgba(139,92,246,.65)", textTransform: "uppercase", letterSpacing: ".22em", marginBottom: 10 }}>Dual-Task</div>

              <h3 className="fB" style={{ fontSize: 24, color: "#fff", letterSpacing: ".04em", marginBottom: 14, lineHeight: 1.05 }}>

                Motor + Cognitive. Simultaneously.

              </h3>

              <p className="fS" style={{ fontSize: 14, color: "rgba(255,255,255,.78)", lineHeight: 1.75, fontWeight: 300 }}>

                The only therapy system training both physical grip and working memory at once. Because neuroplasticity requires both.

              </p>

              <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8, color: "#8b5cf6" }}>

                <CheckCircle2 size={13} />

                <span className="fM" style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: ".18em" }}>Clinically validated</span>

              </div>

            </TiltCard>

          </Reveal>

        </div>



        {/* Row 2 */}

        <div style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: 16 }}>

          <Reveal dir="left" delay={.15}>

            <TiltCard className="offer-card-green" style={{ padding: "36px 32px", borderRadius: 34, minHeight: 260, transition: "transform .35s, box-shadow .35s" }}>

              <div style={{
                width: 54, height: 54, borderRadius: 18, marginBottom: 20,

                display: "flex", alignItems: "center", justifyContent: "center",

                background: "rgba(52,211,153,.12)", border: "1px solid rgba(52,211,153,.22)", color: "#34d399"
              }}>

                <Waves size={22} />

              </div>

              <div className="fM" style={{ fontSize: 8, color: "rgba(52,211,153,.68)", textTransform: "uppercase", letterSpacing: ".22em", marginBottom: 10 }}>Tremor Intelligence</div>

              <h3 className="fB" style={{ fontSize: 22, color: "#fff", letterSpacing: ".04em", marginBottom: 12, lineHeight: 1.05 }}>

                Filters involuntary tremors in real-time.

              </h3>

              <p className="fS" style={{ fontSize: 14, color: "rgba(255,255,255,.78)", lineHeight: 1.75, fontWeight: 300 }}>

                6-axis IMU continuously separates Parkinson's tremors from intentional grip for clinical accuracy even in severe cases.

              </p>

            </TiltCard>

          </Reveal>

          <Reveal dir="right" delay={.2}>

            <TiltCard className="offer-card-gold" style={{ padding: "36px 32px", borderRadius: 34, minHeight: 260, transition: "transform .35s, box-shadow .35s" }}>


              <div style={{
                width: 54, height: 54, borderRadius: 18, marginBottom: 20,

                display: "flex", alignItems: "center", justifyContent: "center",

                background: "rgba(251,191,36,.10)", border: "1px solid rgba(251,191,36,.24)", color: "#fbbf24"
              }}>

                <BarChart3 size={22} />

              </div>

              <div className="fM" style={{ fontSize: 8, color: "rgba(251,191,36,.72)", textTransform: "uppercase", letterSpacing: ".22em", marginBottom: 10 }}>Tele-Rehab</div>

              <h3 className="fB" style={{ fontSize: 22, color: "#fff", letterSpacing: ".04em", marginBottom: 12, lineHeight: 1.05 }}>

                Your doctor sees every session, from anywhere.

              </h3>

              <p className="fS" style={{ fontSize: 14, color: "rgba(255,255,255,.78)", lineHeight: 1.75, fontWeight: 300 }}>

                Firebase streams grip force, tremor amplitude, and reaction data live. Therapy adjustments happen remotely — no clinic visits needed.

              </p>

            </TiltCard>

          </Reveal>

        </div>

      </div>

    </section>

  );

});


//  WHY SECTION



const WhySection = React.memo(function WhySection() {

  const POINTS = [

    {
      n: "01", c: "#2DD4BF", dir: "left" as const, t: "Dual-task is the only way.",

      b: "Every other device trains motor OR cognitive. Science requires both simultaneously. ReViveX is the only system built around this clinical truth."
    },

    {
      n: "02", c: "#a78bfa", dir: "right" as const, t: "Patients play. They don't quit.",

      b: "Gamification is a proven adherence mechanism. When therapy feels like a game, patients return daily instead of abandoning after week two."
    },

    {
      n: "03", c: "#fbbf24", dir: "left" as const, t: "A doctor is always in the loop.",

      b: "Unlike every home rehab app that sends data nowhere, every session streams live to a verified clinical dashboard. Real oversight drives real outcomes."
    },

    {
      n: "04", c: "#34d399", dir: "right" as const, t: "Priced for the world.",

      b: "The entire device costs less than a single hospital physio session. Built to be reproducible, repairable, and accessible to every patient who needs it."
    },

  ];

  return (

    <section id="why" data-theme="dark" style={{ background: "linear-gradient(170deg, #060f20 0%, #08141f 60%, #071122 100%)", padding: "120px 40px", position: "relative", overflow: "hidden" }}>

      <div className="grid-dk" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

      <div className="why-orb-1" />
      <div className="why-orb-2" />
      <div className="aml aml-c" style={{ width:480, height:480, top:"15%",  left:"5%",  background:"radial-gradient(circle,rgba(251,191,36,.05),transparent 70%)" }} />
      <div className="aml aml-a" style={{ width:420, height:420, bottom:"10%",right:"8%",background:"radial-gradient(circle,rgba(52,211,153,.045),transparent 70%)" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        <Reveal dir="zoom" style={{ textAlign: "center", marginBottom: 72 }}>

          <div className="fM" style={{ fontSize: 9, color: "rgba(251,191,36,.75)", textTransform: "uppercase", letterSpacing: ".32em", marginBottom: 16 }}>Why ReViveX</div>

          <h2 className="fB" style={{ fontSize: "clamp(3rem,8vw,7rem)", letterSpacing: ".03em", lineHeight: .9, color: "#fff" }}>

            NOT ANOTHER<br /><span style={{ color: "#fbbf24" }}>REHAB GADGET.</span>

          </h2>

        </Reveal>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {POINTS.map((pt, i) => (

            <Reveal key={pt.n} dir={pt.dir} delay={i * .1}>

              <TiltCard style={{
                padding: "36px 40px", borderRadius: 28,

                display: "grid", gridTemplateColumns: "80px 1fr", gap: 32, alignItems: "center",

                background: "rgba(255,255,255,.038)", borderLeft: `3px solid ${pt.c}`, position: "relative", overflow: "hidden", boxShadow: "0 10px 50px rgba(0,0,0,.35)"
              }}>

                <div className="fB" style={{ fontSize: "5rem", color: `${pt.c}18`, lineHeight: 1, pointerEvents: "none" }}>{pt.n}</div>

                <div>

                  <h3 className="fB" style={{ fontSize: "clamp(1.4rem,3vw,2.2rem)", color: "#fff", letterSpacing: ".04em", marginBottom: 10 }}>{pt.t}</h3>

                  <p className="fS" style={{ fontSize: 15, color: "rgba(255,255,255,.48)", lineHeight: 1.78, fontWeight: 300, maxWidth: 640 }}>{pt.b}</p>

                </div>

              </TiltCard>

            </Reveal>

          ))}

        </div>

      </div>

    </section>

  );

});


//  MARQUEE STRIP



const MarqueeStrip = React.memo(function MarqueeStrip() {

  const A = ["MOTOR RECOVERY", "COGNITIVE TRAINING", "GRIP STRENGTH", "TREMOR DETECTION", "DUAL-TASK PROTOCOL", "AI ADAPTATION", "TELE-REHABILITATION", "NEUROPLASTICITY"];

  const B = ["STROKE RECOVERY", "PARKINSON'S CARE", "BRAIN INJURY REHAB", "ADAPTIVE DIFFICULTY", "REAL-TIME FEEDBACK", "GAMIFIED THERAPY", "HOME-BASED CARE", "CLINICAL DASHBOARD"];

  const dot = <span style={{ margin: "0 18px", color: "rgba(45,212,191,.52)" }}>·</span>;

  const makeRow = (items: string[], cls: string) => (

    <div style={{ overflow: "hidden", marginBottom: 8 }}>

      <div className={cls} style={{ display: "flex", whiteSpace: "nowrap", width: "200%" }}>

        {[0, 1].map(r => (

          <span key={r} style={{ width: "50%", display: "inline-block" }}>

            {items.map((t, i) => (

              <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>

                <span className="fB" style={{ fontSize: 13, color: "rgba(255,255,255,.72)", letterSpacing: ".14em" }}>{t}</span>

                {dot}

              </span>

            ))}

          </span>

        ))}

      </div>

    </div>

  );

  return (

    <div style={{
      background: "linear-gradient(90deg, #04111e, #040f1c, #04111e)", padding: "20px 0",

      borderTop: "1px solid rgba(45,212,191,.12)", borderBottom: "1px solid rgba(45,212,191,.12)", overflow: "hidden"
    }}>

      {makeRow(A, "mqL")}

      {makeRow(B, "mqR")}

    </div>

  );

});

//  FOOTER + CONTACT



function Footer() {

  const [form, setForm] = useState({ name: "", email: "", msg: "" });

  const [sent, setSent] = useState(false);



  const onSubmit = (e: React.FormEvent) => {

    e.preventDefault();

    console.log("Form:", form);

    setSent(true);

  };

  return (

    <footer id="contact" data-theme="dark" style={{

      background: "linear-gradient(170deg, #030c18 0%, #050e1c 100%)", padding: "120px 40px 60px",

      position: "relative", overflow: "hidden",

      borderTop: "1px solid rgba(45,212,191,.14)",

    }}>

      <div className="glow-breath" style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 55% 42% at 50% 92%, rgba(45,212,191,.10), transparent 58%)"
      }} />
      <div className="aml aml-a" style={{ width:500, height:500, top:"10%",  left:"5%",  background:"radial-gradient(circle,rgba(45,212,191,.05),transparent 70%)" }} />
      <div className="aml aml-b" style={{ width:400, height:400, top:"20%",  right:"10%",background:"radial-gradient(circle,rgba(14,165,233,.04),transparent 70%)" }} />

      <div className="fB" style={{
        position: "absolute", bottom: 0, left: "50%",

        transform: "translateX(-50%)", fontSize: "clamp(5rem,18vw,17rem)",

        color: "rgba(255,255,255,.012)", letterSpacing: "-0.04em",

        whiteSpace: "nowrap", lineHeight: 1, pointerEvents: "none", userSelect: "none"
      }}>

        REVIVEX

      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 2 }}>

        <div style={{ textAlign: "center", marginBottom: 80, lineHeight: .9, overflow: "hidden" }}>

          <div className="fB" style={{ fontSize: "clamp(3rem,10vw,9rem)", letterSpacing: ".03em", overflow: "hidden" }}>

            <SplitText text="LET'S REWIRE" style={{ color: "#fff" }} delay={0} stagger={.042} />

          </div>

          <div className="fB" style={{ fontSize: "clamp(3rem,10vw,9rem)", letterSpacing: ".03em", overflow: "hidden" }}>

            <SplitText text="THE FUTURE." style={{ color: "#2DD4BF" }} delay={.34} stagger={.042} />

          </div>

        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60 }}>

          {/* Form */}

          <Reveal dir="left">

            <div style={{
              padding: "42px 38px", borderRadius: 34,

              background: "rgba(255,255,255,.025)", border: "1px solid rgba(45,212,191,.10)"
            }}>

              <div className="fM" style={{
                fontSize: 9, color: "rgba(45,212,191,.5)",

                textTransform: "uppercase", letterSpacing: ".22em", marginBottom: 28
              }}>Get In Touch</div>

              {sent ? (

                <motion.div initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }}

                  style={{ textAlign: "center", padding: "44px 0" }}>

                  <CheckCircle2 size={52} style={{ color: "#2DD4BF", display: "block", margin: "0 auto 18px" }} />

                  <div className="fB" style={{ fontSize: 26, color: "#fff", letterSpacing: ".06em" }}>MESSAGE RECEIVED.</div>

                  <div className="fM" style={{
                    fontSize: 9, color: "rgba(255,255,255,.25)",

                    textTransform: "uppercase", letterSpacing: ".2em", marginTop: 10
                  }}>We'll be in touch.</div>

                </motion.div>

              ) : (

                <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                  {[

                    { k: "name", l: "Name", t: "text", ph: "Dr. Sarah Johnson" },

                    { k: "email", l: "Email", t: "email", ph: "hello@hospital.lk" },

                  ].map(f => (

                    <div key={f.k}>

                      <div className="fM" style={{
                        fontSize: 8, color: "rgba(255,255,255,.72)",

                        textTransform: "uppercase", letterSpacing: ".18em", marginBottom: 9
                      }}>{f.l}</div>

                      <input type={f.t} placeholder={f.ph} required

                        value={(form as any)[f.k]}

                        onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}

                        className="fS"

                        style={{
                          width: "100%", padding: "14px 16px", borderRadius: 14, fontSize: 14,

                          color: "rgba(255,255,255,.8)",

                          background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)"
                        }} />

                    </div>

                  ))}

                  <div>

                    <div className="fM" style={{
                      fontSize: 8, color: "rgba(255,255,255,.72)",

                      textTransform: "uppercase", letterSpacing: ".18em", marginBottom: 9
                    }}>Message</div>

                    <textarea rows={4} required placeholder="I'd like to learn more about ReViveX..."

                      value={form.msg}

                      onChange={e => setForm(p => ({ ...p, msg: e.target.value }))}

                      className="fS"

                      style={{
                        width: "100%", padding: "14px 16px", borderRadius: 14, fontSize: 14,

                        color: "rgba(255,255,255,.8)", resize: "none",

                        background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)"
                      }} />

                  </div>

                  <MagButton type="submit"

                    className="btn-shim fB"

                    style={{
                      position: "relative", overflow: "hidden", width: "100%", padding: "18px",

                      borderRadius: 16, fontSize: 15, letterSpacing: ".12em",

                      background: "#2DD4BF", color: "#080f1a", border: "none",

                      boxShadow: "0 0 44px rgba(45,212,191,.3)"
                    }}>

                    <span style={{ position: "relative", zIndex: 1 }}>SEND MESSAGE</span>

                  </MagButton>

                </form>

              )}

            </div>

          </Reveal>



          {/* Info */}

          <Reveal dir="right" delay={.15} style={{ paddingTop: 8 }}>

            <h3 className="fB" style={{
              fontSize: "clamp(1.8rem,3vw,2.8rem)", color: "#fff",

              letterSpacing: ".04em", lineHeight: 1.1, marginBottom: 22
            }}>

              DESIGNED FOR PATIENTS.<br /><span style={{ color: "#2DD4BF" }}>BUILT FOR IMPACT.</span>

            </h3>

            <p className="fS" style={{
              fontSize: 15, color: "rgba(255,255,255,.78)",

              lineHeight: 1.75, fontWeight: 300, marginBottom: 42
            }}>

              Whether you're a clinician, a hospital administrator, or a patient wanting

              to take control of your recovery — we'd love to connect.

            </p>

            {[

              { icon: <Mail size={15} />, l: "Email", v: "revivex13@gmail.com", href: "mailto:revivex13@gmail.com" },

              { icon: <Phone size={15} />, l: "Phone", v: "+94 77 3847510", href: "#" },

              { icon: <Globe size={15} />, l: "Website", v: "revivex1.com", href: "#" },

            ].map(c => (

              <a key={c.l} href={c.href} data-mag

                style={{
                  display: "flex", alignItems: "center", gap: 16,

                  textDecoration: "none", marginBottom: 18, color: "inherit"
                }}>

                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,

                  display: "flex", alignItems: "center", justifyContent: "center",

                  background: "rgba(45,212,191,.08)", border: "1px solid rgba(45,212,191,.18)", color: "#2DD4BF"
                }}>

                  {c.icon}

                </div>

                <div>

                  <div className="fM" style={{
                    fontSize: 8, color: "rgba(255,255,255,.65)",

                    textTransform: "uppercase", letterSpacing: ".18em"
                  }}>{c.l}</div>

                  <div className="fS" style={{ fontSize: 14, color: "rgba(255,255,255,.78)" }}>{c.v}</div>

                </div>

              </a>

            ))}

            <div style={{ display: "flex", gap: 12, marginTop: 22 }}>

              {[

                { icon: <Linkedin size={17} />, href: "#", label: "LinkedIn" },

                { icon: <Instagram size={17} />, href: "#", label: "Instagram" },

              ].map(s => (

                <motion.a key={s.label} href={s.href} data-mag aria-label={s.label}

                  whileHover={{ y: -5, scale: 1.12 }}

                  style={{
                    width: 50, height: 50, borderRadius: 16, textDecoration: "none",

                    display: "flex", alignItems: "center", justifyContent: "center",

                    background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)",

                    color: "rgba(255,255,255,.70)"
                  }}>

                  {s.icon}

                </motion.a>

              ))}

            </div>

          </Reveal>

        </div>



        <div style={{
          marginTop: 80, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,.05)",

          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>

          <div className="fB" style={{ fontSize: 20, letterSpacing: ".10em", color: "#fff" }}>

            REVIVE<span style={{ color: "#2DD4BF" }}>X</span>

          </div>

          <div className="fM" style={{
            fontSize: 8, color: "rgba(255,255,255,.38)",

            textTransform: "uppercase", letterSpacing: ".22em"
          }}>

            © 2025 ReViveX · SDGP CS-09 Group 22 · Neuro-Rehabilitation Technology

          </div>

        </div>

      </div>

    </footer>

  );

}


//  ROOT PAGE

export default function LandingPage() {

  const [booted, setBooted] = useState(false);

  useLenis();
  return (

    <div className="grain" style={{ background: "#080f1a" }}>

      <style>{CSS}</style>

      <MedicalCursor />
      {!booted && <Preloader onDone={() => setBooted(true)} />}

      <AnimatePresence>

        {booted && (

          <motion.div key="site"

            initial={{ opacity: 0, scale: .95 }}

            animate={{ opacity: 1, scale: 1 }}

            transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}>



            <Navbar />

            <HeroSection />

            <RoadBridge />

            <ProblemSection />

            <DarkBridge />

            <SolutionSection />

            <OfferSection />

            <WhySection />

            <MarqueeStrip />

            <Footer />



          </motion.div>

        )}

      </AnimatePresence>

    </div>

  );

}