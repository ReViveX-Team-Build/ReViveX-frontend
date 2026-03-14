"use client";

import React, {

  useState, useEffect, useRef, useCallback, useMemo,

} from "react";

import { useRouter } from "next/navigation";

import {

  motion, AnimatePresence,

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
  .aml { position:absolute; border-radius:50%; pointer-events:none; filter:blur(70px); animation: opacityPulse 8s ease-in-out infinite; }
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

  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {

    const h = (e: MouseEvent) => setPos({

      x: e.clientX / window.innerWidth - 0.5,

      y: e.clientY / window.innerHeight - 0.5,

    });

    window.addEventListener("mousemove", h);

    return () => window.removeEventListener("mousemove", h);

  }, []);

  return pos;

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
function FloatingParticles({ count = 35 }: { count?: number }) {
  const P = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,
    dur: Math.random() * 12 + 8,
    delay: Math.random() * 15,
    opacity: Math.random() * 0.3 + 0.05,
    drift: (Math.random() - 0.5) * 60, // Horizontal sway distance
  })), [count]);

  const vh = typeof window !== "undefined" ? window.innerHeight : 900;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {P.map(p => (
        <motion.div key={p.id}
          style={{
            position: "absolute", left: `${p.x}%`, bottom: -20,
            width: p.size, height: p.size, borderRadius: "50%",
            background: "#2DD4BF",
            boxShadow: `0 0 ${p.size * 3}px rgba(45,212,191,0.8)`
          }}
          animate={{
            y: [0, -(vh * 1.2)],
            x: [0, p.drift, -p.drift, 0],
            opacity: [0, p.opacity, p.opacity, 0]
          }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

function DeviceHoloCanvas({ mouse }: { mouse: { x: number; y: number } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef  = useRef(mouse);
  useEffect(() => { mouseRef.current = mouse; }, [mouse]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let cachedDpr = window.devicePixelRatio || 1;
    const dpr = () => cachedDpr;

    const resize = () => {
      cachedDpr = window.devicePixelRatio || 1;
      const d = cachedDpr;
      canvas.width  = canvas.offsetWidth  * d;
      canvas.height = canvas.offsetHeight * d;
    };
    resize();
    window.addEventListener("resize", resize);

    // ── COLOR PALETTE SYSTEM ───────────────────────────────────
    const PALETTES = [
      { r:45,  g:212, b:191 },  // teal
      { r:168, g:85,  b:247 },  // purple
      { r:6,   g:182, b:212 },  // cyan
      { r:251, g:146, b:60  },  // amber
    ];
    let frame = 0;

    const getThemeColor = (opacity = 1, shift = 0) => {
      const t = (frame * 0.004 + shift) % PALETTES.length;
      const ai = Math.floor(t), bi = (ai + 1) % PALETTES.length;
      const f = t % 1;
      const ease = f * f * (3 - 2 * f);
      const r = PALETTES[ai].r * (1-ease) + PALETTES[bi].r * ease;
      const g = PALETTES[ai].g * (1-ease) + PALETTES[bi].g * ease;
      const b = PALETTES[ai].b * (1-ease) + PALETTES[bi].b * ease;
      return `rgba(${r|0},${g|0},${b|0},${opacity})`;
    };
    const getRGB = (shift = 0) => {
      const t = (frame * 0.004 + shift) % PALETTES.length;
      const ai = Math.floor(t), bi = (ai + 1) % PALETTES.length;
      const f = (t % 1); const ease = f*f*(3-2*f);
      return {
        r: PALETTES[ai].r*(1-ease)+PALETTES[bi].r*ease,
        g: PALETTES[ai].g*(1-ease)+PALETTES[bi].g*ease,
        b: PALETTES[ai].b*(1-ease)+PALETTES[bi].b*ease,
      };
    };

    // ── ISO PROJECTION ─────────────────────────────────────────
    // Device sits in world space; mouse tilts the whole scene
    let tiltX = 0, tiltY = 0, tiltVX = 0, tiltVY = 0;

    const project = (wx: number, wy: number, wz: number, cx: number, cy: number) => {
      // Apply mouse tilt
      const cosX = Math.cos(tiltX), sinX = Math.sin(tiltX);
      const cosY = Math.cos(tiltY), sinY = Math.sin(tiltY);
      // Rotate around Y
      const x1 = wx * cosY + wz * sinY;
      const z1 = -wx * sinY + wz * cosY;
      // Rotate around X
      const y2 = wy * cosX - z1 * sinX;
      const z2 = wy * sinX + z1 * cosX;
      // Iso-ish perspective
      const SCALE = 0.85, FOV = 480;
      const s = FOV / (z2 + FOV);
      return { px: cx + x1 * s * SCALE, py: cy - y2 * s * SCALE, depth: z2 };
    };

    // ── DEVICE GEOMETRY ────────────────────────────────────────
    // Base unit: box w=120, h=35, d=90 centered at (0,0,0) bottom
    const BASE = { w:120, h:36, d:88 };
    const SCREEN = { w:88, h:68, d:5 };

    // 8 corners of base box (y goes up)
    const baseVerts = (): [number,number,number][] => {
      const [hw,hh,hd] = [BASE.w/2, BASE.h/2, BASE.d/2];
      return [
        [-hw, hh,-hd],[ hw, hh,-hd],[ hw, hh, hd],[-hw, hh, hd],  // top face
        [-hw,-hh,-hd],[ hw,-hh,-hd],[ hw,-hh, hd],[-hw,-hh, hd],  // bottom face
      ];
    };

    // Screen slab sitting on top, angled back 25°
    const screenVerts = (): [number,number,number][] => {
      const [hw,hh,hd] = [SCREEN.w/2, SCREEN.h/2, SCREEN.d/2];
      const tilt = 0.40; // radians backward tilt
      const baseY = BASE.h/2;
      const verts: [number,number,number][] = [
        [-hw,-hh,-hd],[ hw,-hh,-hd],[ hw, hh,-hd],[-hw, hh,-hd],
        [-hw,-hh, hd],[ hw,-hh, hd],[ hw, hh, hd],[-hw, hh, hd],
      ];
      // Apply Y-axis tilt and position on top of base
      return verts.map(([x,y,z]) => {
        const newY = y * Math.cos(tilt) - z * Math.sin(tilt);
        const newZ = y * Math.sin(tilt) + z * Math.cos(tilt);
        return [x, newY + baseY + hh * Math.cos(tilt) + 4, newZ - hd * Math.sin(tilt) - 8];
      });
    };

    const BOX_FACES = [
      [0,1,2,3],  // top
      [4,5,6,7],  // bottom
      [0,1,5,4],  // front
      [2,3,7,6],  // back
      [0,3,7,4],  // left
      [1,2,6,5],  // right
    ];

    // ── ORBITAL RINGS ──────────────────────────────────────────
    type Ring = { tiltX:number; tiltZ:number; radius:number; speed:number; nodes:number; phase:number; colorShift:number };
    const RINGS: Ring[] = [
      { tiltX:0.35, tiltZ:0.0, radius:200, speed:0.012, nodes:6, phase:0,         colorShift:0   },
      { tiltX:0.9,  tiltZ:0.5, radius:230, speed:-0.008, nodes:5, phase:1.2,      colorShift:1   },
      { tiltX:0.15, tiltZ:1.1, radius:175, speed:0.018,  nodes:4, phase:2.4,      colorShift:2   },
    ];

    // ── DATA PACKETS on rings ─────────────────────────────────
    type Packet = { ring:number; angle:number; speed:number; colorShift:number; trail:[number,number][] };
    const packets: Packet[] = [];
    RINGS.forEach((r, ri) => {
      for(let i=0;i<3;i++) packets.push({
        ring:ri, angle:Math.random()*Math.PI*2,
        speed: r.speed * (0.8+Math.random()*0.4),
        colorShift: ri * 0.66 + i * 0.2,
        trail:[],
      });
    });

    // ── CIRCUIT TRACES ────────────────────────────────────────
    type Trace = { pts:[number,number][]; pulseT:number; pulseSpd:number };
    const traces: Trace[] = [];
    for(let i=0;i<12;i++) {
      const ang = (i/12)*Math.PI*2;
      const r = 100+Math.random()*60;
      const x = Math.cos(ang)*r, y = Math.sin(ang)*r;
      const mid = [ x*0.4 + (Math.random()-.5)*40, y*0.4 + (Math.random()-.5)*40 ];
      traces.push({
        pts: [[0,0], mid as [number,number], [x,y]],
        pulseT: Math.random(), pulseSpd: 0.004+Math.random()*0.006,
      });
    }

    // ── DATA NODES ────────────────────────────────────────────
    type Node = { x:number; y:number; vx:number; vy:number; life:number; maxLife:number; size:number; text?:string };
    const nodes: Node[] = [];
    const DATA_LABELS = ["84kPa","±0.02g","87%","ECG","IMU","BLE","SPI","ADC","GPIO","PWM","NTP","OTA"];
    let labelIdx = 0;

    // ── SCREEN DATA (ECG-like graph) ───────────────────────────
    const screenData: number[] = Array.from({length:40}, (_,i) => {
      // ECG-like: mostly flat with spikes
      const x = (i/40)*Math.PI*4;
      return Math.sin(x)*0.2 + (Math.sin(x*6)>0.85 ? Math.sin(x*6)*2 : 0);
    });
    let screenOffset = 0;

    // ── BULB PULSE ────────────────────────────────────────────
    let bulbPulse = 0;

    // ── FLOATING HUD LABELS ───────────────────────────────────
    type HUD = { label:string; val:string; x:number; y:number; alpha:number; drift:number; colorShift:number };
    const HUDS: HUD[] = [
      { label:"GRIP",     val:"84 kPa",  x:-195, y:-90,  alpha:0, drift:0,   colorShift:0   },
      { label:"TREMOR",   val:"±0.02g",  x: 195, y:-70,  alpha:0, drift:0.6, colorShift:0.9 },
      { label:"ADHERENCE",val:"87%",     x:-185, y: 95,  alpha:0, drift:1.1, colorShift:1.6 },
      { label:"XP PTS",   val:"+280",    x: 185, y:100,  alpha:0, drift:1.9, colorShift:2.3 },
    ];

    // ── SHOCKWAVE SYSTEM ──────────────────────────────────────
    type Wave = { x:number; y:number; r:number; maxR:number; alpha:number; colorShift:number };
    const waves: Wave[] = [];
    let nextWave = 60;

    // ── MAIN DRAW ─────────────────────────────────────────────
    let raf = 0;

    const drawBox = (
      verts: [number,number,number][],
      cx: number, cy: number,
      fillAlpha: number,
      strokeAlpha: number,
      blur: number,
      colorShift = 0,
    ) => {
      const pv = verts.map(v => project(v[0], v[1], v[2], cx, cy));
      const col = getRGB(colorShift);
      const csStr = `${col.r|0},${col.g|0},${col.b|0}`;

      // Draw visible faces (simple depth sort: just draw back then front)
      const faceOrder = [1,3,5,2,0,4]; // roughly back to front
      faceOrder.forEach(fi => {
        const face = BOX_FACES[fi];
        ctx.beginPath();
        face.forEach((vi, i) => {
          const p = pv[vi];
          i === 0 ? ctx.moveTo(p.px, p.py) : ctx.lineTo(p.px, p.py);
        });
        ctx.closePath();
        ctx.fillStyle = `rgba(${csStr},${fillAlpha * (fi===0 ? 1 : fi===2 ? 0.7 : 0.4)})`;
        ctx.strokeStyle = `rgba(${csStr},${strokeAlpha})`;
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = blur;
        ctx.shadowColor = `rgba(${csStr},0.8)`;
        ctx.fill();
        ctx.stroke();
      });
    };

    const drawScreenContent = (sv: ReturnType<typeof project>[], cx: number, cy: number) => {
      // Screen face is face index 0 (front face of screen box) = verts 0,1,2,3
      const [p0,p1,p2,p3] = [sv[4],sv[5],sv[6],sv[7]]; // front face of screen
      if (!p0 || !p1 || !p2 || !p3) return;

      ctx.save();
      // Clip to screen quad
      ctx.beginPath();
      ctx.moveTo(p0.px,p0.py); ctx.lineTo(p1.px,p1.py);
      ctx.lineTo(p2.px,p2.py); ctx.lineTo(p3.px,p3.py);
      ctx.closePath();
      ctx.clip();

      // Screen background
      ctx.fillStyle = "rgba(2,12,24,0.95)";
      ctx.fill();

      // Estimate screen center and axes for drawing content inside
      const scx = (p0.px+p1.px+p2.px+p3.px)/4;
      const scy = (p0.py+p1.py+p2.py+p3.py)/4;
      const sw  = Math.hypot(p1.px-p0.px, p1.py-p0.py) * 0.8;
      const sh  = Math.hypot(p3.py-p0.py, p3.px-p0.px) * 0.75;

      const col = getRGB(0.5);
      const cStr = `${col.r|0},${col.g|0},${col.b|0}`;

      // Draw ECG-like waveform
      const waveY = scy + sh*0.12;
      const waveH = sh*0.32;
      const waveX0 = scx - sw/2;
      const waveXW = sw;
      ctx.beginPath();
      screenData.forEach((v, i) => {
        const x = waveX0 + (i/screenData.length)*waveXW;
        const y = waveY - v*waveH;
        i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
      });
      ctx.strokeStyle = `rgba(${cStr},0.9)`;
      ctx.lineWidth = 1.4;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(${cStr},1)`;
      ctx.stroke();

      // Bar graph at bottom
      for(let i=0;i<8;i++) {
        const bx = scx - sw/2 + (i/8)*sw + sw/16;
        const bh = (0.3+Math.sin(frame*0.05+i)*0.2)*sh*0.3;
        const by = scy + sh*0.35;
        const alpha = 0.3 + 0.4*(i/8);
        const g = ctx.createLinearGradient(bx, by-bh, bx, by);
        g.addColorStop(0, `rgba(${cStr},${alpha})`);
        g.addColorStop(1, `rgba(${cStr},0.05)`);
        ctx.fillStyle = g;
        ctx.fillRect(bx, by-bh, sw/8-2, bh);
      }

      // Top label
      ctx.font = "bold 7px monospace";
      ctx.fillStyle = `rgba(${cStr},0.7)`;
      ctx.textAlign = "center";
      ctx.shadowBlur = 4;
      ctx.fillText("REVIVEX · LIVE", scx, scy - sh*0.42);

      // Scan line
      const scanY = scy - sh/2 + ((frame*1.5) % (sh+4));
      ctx.fillStyle = `rgba(${cStr},0.08)`;
      ctx.fillRect(scx-sw/2, scanY, sw, 2);

      ctx.restore();
    };

    // Ring point in 3D
    const ringPt = (ring: Ring, angle: number): [number,number,number] => {
      const x = Math.cos(angle) * ring.radius;
      const y = Math.sin(angle) * ring.radius * Math.cos(ring.tiltX) - Math.sin(angle)*ring.radius*0.2;
      const z = Math.sin(angle) * ring.radius * Math.sin(ring.tiltX) + Math.cos(angle)*ring.radius*Math.sin(ring.tiltZ)*0.5;
      return [x, y, z];
    };

    const draw = () => {
      frame++;
      const d = dpr();
      const W = canvas.width/d, H = canvas.height/d;
      const CX = W * 0.50, CY = H * 0.50;

      ctx.setTransform(d,0,0,d,0,0);
      ctx.clearRect(0,0,W,H);

      // ── Mouse tilt physics ─────────────────────────────────
      const mx = mouseRef.current;
      const targetTY = mx.x * 0.3;
      const targetTX = mx.y * -0.18;
      tiltVX = (tiltVX + (targetTX - tiltX) * 0.04) * 0.88;
      tiltVY = (tiltVY + (targetTY - tiltY) * 0.04) * 0.88;
      tiltX += tiltVX; tiltY += tiltVY;

      // ── Hex grid background dots — redrawn every 3 frames (imperceptible, big perf gain) ──
      if (frame % 3 === 0) {
      ctx.save();
      const hexR = 28;
      for(let row=0; row<Math.ceil(H/hexR/2)+1; row++) {
        for(let col=0; col<Math.ceil(W/hexR)+2; col++) {
          const x = col*hexR*1.73 + (row%2)*hexR*0.87 - hexR;
          const y = row*hexR*1.5 - hexR;
          const dist = Math.hypot(x-CX, y-CY);
          const fade = Math.max(0, 1 - dist/380);
          if(fade<0.01) continue;
          const pulse = Math.sin(frame*0.02 + dist*0.02)*0.5+0.5;
          ctx.fillStyle = getThemeColor(fade * 0.045 * pulse);
          ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI*2); ctx.fill();
        }
      }
      ctx.restore();
      }

      // ── Circuit traces (radiating from device) ─────────────
      ctx.save();
      ctx.shadowBlur = 0;
      traces.forEach(tr => {
        tr.pulseT += tr.pulseSpd;
        if(tr.pulseT > 1) tr.pulseT = 0;

        const [p0, p1, p2] = tr.pts;
        const screenP0 = { px: CX + p0[0], py: CY + p0[1] };
        const screenP1 = { px: CX + p1[0], py: CY + p1[1] };
        const screenP2 = { px: CX + p2[0], py: CY + p2[1] };

        // Draw trace line (faint)
        ctx.beginPath();
        ctx.moveTo(screenP0.px, screenP0.py);
        ctx.quadraticCurveTo(screenP1.px, screenP1.py, screenP2.px, screenP2.py);
        ctx.strokeStyle = getThemeColor(0.06);
        ctx.lineWidth = 0.8;
        ctx.shadowBlur = 0;
        ctx.stroke();

        // Draw moving pulse dot
        const t = tr.pulseT;
        const bx = (1-t)*(1-t)*screenP0.px + 2*(1-t)*t*screenP1.px + t*t*screenP2.px;
        const by = (1-t)*(1-t)*screenP0.py + 2*(1-t)*t*screenP1.py + t*t*screenP2.py;
        ctx.shadowBlur = 12;
        ctx.shadowColor = getThemeColor(1);
        ctx.fillStyle = getThemeColor(0.9);
        ctx.beginPath(); ctx.arc(bx, by, 2.5, 0, Math.PI*2); ctx.fill();

        // End node glow
        const endFade = Math.sin(frame*0.03 + tr.pulseSpd*200)*0.3+0.7;
        ctx.shadowBlur = 18;
        ctx.fillStyle = getThemeColor(0.35*endFade);
        ctx.beginPath(); ctx.arc(screenP2.px, screenP2.py, 5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = getThemeColor(0.9*endFade);
        ctx.beginPath(); ctx.arc(screenP2.px, screenP2.py, 1.5, 0, Math.PI*2); ctx.fill();
      });
      ctx.restore();

      // ── Orbital rings ──────────────────────────────────────
      RINGS.forEach((ring, ri) => {
        const STEPS = 72;
        ctx.save();
        ctx.lineWidth = 1;

        // Draw ring path (dashed neon)
        for(let i=0; i<STEPS; i++) {
          const a0 = (i/STEPS)*Math.PI*2;
          const a1 = ((i+1)/STEPS)*Math.PI*2;
          if(i%4 < 2) continue; // dashed effect
          const p0 = ringPt(ring, a0), p1 = ringPt(ring, a1);
          const s0 = project(p0[0],p0[1],p0[2], CX,CY);
          const s1 = project(p1[0],p1[1],p1[2], CX,CY);
          const depth = (s0.depth+s1.depth)*0.5;
          const alpha = 0.06 + Math.max(0, -depth/400)*0.12;
          ctx.beginPath();
          ctx.moveTo(s0.px,s0.py); ctx.lineTo(s1.px,s1.py);
          ctx.strokeStyle = getThemeColor(alpha, ri*0.66);
          ctx.shadowBlur = 8;
          ctx.shadowColor = getThemeColor(0.4, ri*0.66);
          ctx.stroke();
        }

        // Ring nodes (glowing dots at even positions)
        for(let n=0; n<ring.nodes; n++) {
          const a = (n/ring.nodes)*Math.PI*2 + frame*0.003*Math.sign(ring.speed);
          const p = ringPt(ring, a);
          const sp = project(p[0],p[1],p[2], CX,CY);
          const pulse = Math.sin(frame*0.06 + n)*0.3+0.7;
          const depth = sp.depth;
          const sz = 3.5 * (1 + Math.max(0,-depth/500)*0.5) * pulse;
          ctx.shadowBlur = 20;
          ctx.shadowColor = getThemeColor(0.9, ri*0.66);
          ctx.fillStyle = getThemeColor(0.8*pulse, ri*0.66);
          ctx.beginPath(); ctx.arc(sp.px,sp.py,sz,0,Math.PI*2); ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.beginPath(); ctx.arc(sp.px,sp.py,1.2,0,Math.PI*2); ctx.fill();
        }
        ctx.restore();
      });

      // ── Data packets traveling along rings ─────────────────
      packets.forEach(pkt => {
        pkt.angle += pkt.speed * 1.8;
        const ring = RINGS[pkt.ring];
        const p3d = ringPt(ring, pkt.angle);
        const sp = project(p3d[0],p3d[1],p3d[2], CX,CY);

        // Trail
        pkt.trail.push([sp.px, sp.py]);
        if(pkt.trail.length > 18) pkt.trail.shift();
        for(let ti=1; ti<pkt.trail.length; ti++) {
          const a = (ti/pkt.trail.length) * 0.6;
          ctx.beginPath();
          ctx.moveTo(pkt.trail[ti-1][0], pkt.trail[ti-1][1]);
          ctx.lineTo(pkt.trail[ti][0],   pkt.trail[ti][1]);
          ctx.strokeStyle = getThemeColor(a, pkt.colorShift);
          ctx.lineWidth = (ti/pkt.trail.length)*3;
          ctx.shadowBlur = 10; ctx.shadowColor = getThemeColor(0.7,pkt.colorShift);
          ctx.stroke();
        }
        // Head
        ctx.save();
        ctx.shadowBlur = 22; ctx.shadowColor = getThemeColor(1,pkt.colorShift);
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.beginPath(); ctx.arc(sp.px,sp.py,3.2,0,Math.PI*2); ctx.fill();
        ctx.restore();
      });

      // ── Shockwaves ────────────────────────────────────────
      nextWave--;
      if(nextWave<=0) {
        waves.push({ x:CX, y:CY, r:0, maxR:260, alpha:0.6, colorShift:Math.random()*3 });
        nextWave = 80+Math.floor(Math.random()*60);
      }
      for(let i=waves.length-1; i>=0; i--) {
        const w=waves[i];
        w.r += 2.8; w.alpha *= 0.965;
        if(w.r >= w.maxR || w.alpha < 0.01) { waves.splice(i,1); continue; }
        const prog = w.r/w.maxR;
        ctx.beginPath();
        ctx.ellipse(w.x, w.y, w.r, w.r*0.38, 0, 0, Math.PI*2);
        ctx.strokeStyle = getThemeColor(w.alpha*(1-prog), w.colorShift);
        ctx.lineWidth = 1.5*(1-prog*0.6);
        ctx.shadowBlur = 16; ctx.shadowColor = getThemeColor(0.6, w.colorShift);
        ctx.stroke();
      }

      // ── Floating HUD labels ───────────────────────────────
      HUDS.forEach((hud, hi) => {
        hud.alpha += 0.008;
        const a = (Math.sin(frame*0.012 + hud.drift) * 0.25 + 0.75) * Math.min(1, hud.alpha);
        const dy = Math.sin(frame*0.016 + hud.drift*2) * 6;
        const sx = CX + hud.x, sy = CY + hud.y + dy;
        const col = getRGB(hud.colorShift);
        const cStr = `${col.r|0},${col.g|0},${col.b|0}`;

        // Box
        ctx.save();
        ctx.shadowBlur = 20; ctx.shadowColor = `rgba(${cStr},0.4)`;
        ctx.fillStyle = `rgba(2,12,24,${0.75*a})`;
        ctx.strokeStyle = `rgba(${cStr},${0.4*a})`;
        ctx.lineWidth = 1;
        const bw=72, bh=32, br=6;
        ctx.beginPath();
        ctx.roundRect(sx-bw/2, sy-bh/2, bw, bh, br);
        ctx.fill(); ctx.stroke();

        // Label + value
        ctx.shadowBlur = 6;
        ctx.font = `500 7px "Space Mono",monospace`;
        ctx.fillStyle = `rgba(${cStr},${0.55*a})`;
        ctx.textAlign = "center";
        ctx.fillText(hud.label, sx, sy-4);
        ctx.font = `bold 11px "Space Mono",monospace`;
        ctx.fillStyle = `rgba(255,255,255,${0.9*a})`;
        ctx.fillText(hud.val, sx, sy+8);

        // Connector dot
        ctx.fillStyle = `rgba(${cStr},${0.7*a})`;
        ctx.beginPath(); ctx.arc(sx, sy+bh/2, 2.5, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      });

      // ── 3D Device ─────────────────────────────────────────
      ctx.save();
      // Draw base box
      const bvRaw = baseVerts();
      const bvProj = bvRaw.map(v => project(v[0],v[1],v[2],CX,CY));

      // Face rendering (back to front)
      const baseFaceAlphas = [0.18, 0.04, 0.12, 0.04, 0.08, 0.14];
      [1,3,5,2,4,0].forEach((fi, di) => {
        const face = BOX_FACES[fi];
        ctx.beginPath();
        face.forEach((vi,i) => {
          i===0 ? ctx.moveTo(bvProj[vi].px, bvProj[vi].py) : ctx.lineTo(bvProj[vi].px, bvProj[vi].py);
        });
        ctx.closePath();
        const col = getRGB(0);
        const cStr = `${col.r|0},${col.g|0},${col.b|0}`;
        ctx.fillStyle = `rgba(4,14,30,0.88)`;
        ctx.shadowBlur = 0; ctx.fill();
        ctx.strokeStyle = `rgba(${cStr},${0.35+di*0.03})`;
        ctx.lineWidth = 1.4; ctx.shadowBlur = 12;
        ctx.shadowColor = `rgba(${cStr},0.7)`;
        ctx.stroke();
      });

      // Logo "R" on front face
      const frontFace = BOX_FACES[2].map(vi => bvProj[vi]);
      const lx = frontFace.reduce((s,p)=>s+p.px,0)/4;
      const ly = frontFace.reduce((s,p)=>s+p.py,0)/4;
      ctx.font = "bold 9px 'Bebas Neue',sans-serif";
      ctx.fillStyle = getThemeColor(0.9);
      ctx.shadowBlur = 14; ctx.shadowColor = getThemeColor(1);
      ctx.textAlign = "center"; ctx.textBaseline="middle";
      ctx.fillText("R", lx, ly);
      ctx.textBaseline = "alphabetic";

      // LED strip on top edge of front face
      const tf0 = bvProj[0], tf1 = bvProj[1];
      for(let li=0; li<12; li++) {
        const t2 = li/11;
        const lx2 = tf0.px+(tf1.px-tf0.px)*t2;
        const ly2 = tf0.py+(tf1.py-tf0.py)*t2;
        const on = Math.sin(frame*0.08+li*0.7)>0.2;
        ctx.fillStyle = on ? getThemeColor(0.85) : getThemeColor(0.15);
        ctx.shadowBlur = on ? 10 : 0;
        ctx.shadowColor = getThemeColor(1);
        ctx.beginPath(); ctx.arc(lx2, ly2, 1.8, 0, Math.PI*2); ctx.fill();
      }

      // ── Screen slab ────────────────────────────────────────
      const svRaw = screenVerts();
      const svProj = svRaw.map(v => project(v[0],v[1],v[2],CX,CY));

      // Draw screen frame (all faces)
      [1,3,5,2,4,0].forEach(fi => {
        const face = BOX_FACES[fi];
        ctx.beginPath();
        face.forEach((vi,i) => {
          i===0 ? ctx.moveTo(svProj[vi].px, svProj[vi].py) : ctx.lineTo(svProj[vi].px, svProj[vi].py);
        });
        ctx.closePath();
        ctx.fillStyle = "rgba(8,20,40,0.9)";
        ctx.fill();
        const col = getRGB(0.2);
        ctx.strokeStyle = `rgba(${col.r|0},${col.g|0},${col.b|0},0.5)`;
        ctx.lineWidth=1.2; ctx.shadowBlur=8; ctx.shadowColor=getThemeColor(0.5);
        ctx.stroke();
      });

      // Screen content on front face
      drawScreenContent(svProj, CX, CY);

      // ── Cable + Bulb ───────────────────────────────────────
      // Cable starts from left side of base
      const cableStart = project(-BASE.w/2, 0, BASE.d*0.3, CX, CY);
      const bulbAngle = frame * 0.011;
      const bulbX = -BASE.w/2 - 110 + Math.sin(bulbAngle)*20;
      const bulbY = 15 + Math.cos(bulbAngle*0.7)*12;
      const bulbZ = BASE.d*0.2 + Math.sin(bulbAngle*0.5)*15;
      const cableMid = project(-BASE.w/2-60, 30, BASE.d*0.3, CX, CY);
      const bulbPos = project(bulbX, bulbY, bulbZ, CX, CY);

      // Draw cable as bezier
      ctx.beginPath();
      ctx.moveTo(cableStart.px, cableStart.py);
      ctx.quadraticCurveTo(cableMid.px, cableMid.py, bulbPos.px, bulbPos.py);
      ctx.strokeStyle = "rgba(60,80,100,0.7)";
      ctx.lineWidth = 3; ctx.shadowBlur = 0; ctx.stroke();
      ctx.strokeStyle = getThemeColor(0.25);
      ctx.lineWidth = 1; ctx.shadowBlur = 6; ctx.shadowColor = getThemeColor(0.8);
      ctx.stroke();

      // Bulb body
      bulbPulse = Math.sin(frame*0.05)*0.25+0.75;
      const bulbR = 18 * bulbPulse;
      const col3 = getRGB(1.5);
      const cStr3 = `${col3.r|0},${col3.g|0},${col3.b|0}`;

      // Outer glow
      const bulbGrad = ctx.createRadialGradient(bulbPos.px,bulbPos.py,0, bulbPos.px,bulbPos.py,bulbR*2.2);
      bulbGrad.addColorStop(0,   `rgba(${cStr3},0.25)`);
      bulbGrad.addColorStop(0.5, `rgba(${cStr3},0.10)`);
      bulbGrad.addColorStop(1,   "transparent");
      ctx.fillStyle = bulbGrad; ctx.shadowBlur=0;
      ctx.beginPath(); ctx.arc(bulbPos.px,bulbPos.py,bulbR*2.2,0,Math.PI*2); ctx.fill();

      // Bulb shell
      ctx.beginPath(); ctx.ellipse(bulbPos.px,bulbPos.py,bulbR,bulbR*0.82,0,0,Math.PI*2);
      ctx.fillStyle = `rgba(4,14,28,0.88)`;
      ctx.strokeStyle = `rgba(${cStr3},${0.6+bulbPulse*0.3})`;
      ctx.lineWidth=1.5; ctx.shadowBlur=18; ctx.shadowColor=`rgba(${cStr3},0.7)`;
      ctx.fill(); ctx.stroke();

      // Sensor lines inside bulb
      for(let si=0;si<4;si++) {
        const a = (si/4)*Math.PI + frame*0.022;
        const sr = bulbR*0.55;
        ctx.beginPath();
        ctx.moveTo(bulbPos.px+Math.cos(a)*sr*0.3, bulbPos.py+Math.sin(a)*sr*0.3*0.82);
        ctx.lineTo(bulbPos.px+Math.cos(a)*sr,     bulbPos.py+Math.sin(a)*sr*0.82);
        ctx.strokeStyle = `rgba(${cStr3},${0.5*bulbPulse})`;
        ctx.lineWidth=1; ctx.shadowBlur=6; ctx.stroke();
      }
      // Core
      ctx.fillStyle = `rgba(255,255,255,${0.85*bulbPulse})`;
      ctx.shadowBlur=10; ctx.shadowColor="white";
      ctx.beginPath(); ctx.arc(bulbPos.px,bulbPos.py,3.5,0,Math.PI*2); ctx.fill();

      // Pressure wave rings from bulb
      for(let pw=0;pw<3;pw++) {
        const pr = ((frame*0.8 + pw*25) % 55);
        const pa = Math.max(0, 1 - pr/55) * 0.5;
        ctx.beginPath();
        ctx.ellipse(bulbPos.px,bulbPos.py, pr, pr*0.82, 0, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(${cStr3},${pa})`;
        ctx.lineWidth=1; ctx.shadowBlur=8; ctx.stroke();
      }

      ctx.restore();

      // ── Spawn data nodes from device ─────────────────────
      if(frame % 40 === 0) {
        nodes.push({
          x: CX + (Math.random()-.5)*50,
          y: CY - 60 + (Math.random()-.5)*30,
          vx: (Math.random()-.5)*1.8,
          vy: -(1+Math.random()*1.5),
          life:0, maxLife:80+Math.floor(Math.random()*40),
          size:1.5+Math.random()*2,
          text: DATA_LABELS[(labelIdx++)%DATA_LABELS.length],
        });
      }
      for(let i=nodes.length-1;i>=0;i--) {
        const n=nodes[i]; n.x+=n.vx; n.y+=n.vy; n.vx*=0.99; n.life++;
        const a2 = Math.sin((n.life/n.maxLife)*Math.PI)*0.85;
        ctx.save();
        ctx.shadowBlur=10; ctx.shadowColor=getThemeColor(0.8);
        ctx.fillStyle=getThemeColor(a2);
        ctx.beginPath(); ctx.arc(n.x,n.y,n.size,0,Math.PI*2); ctx.fill();
        if(n.text && n.life<50) {
          ctx.font="6px 'Space Mono',monospace";
          ctx.fillStyle=getThemeColor(a2*0.8);
          ctx.textAlign="center"; ctx.shadowBlur=4;
          ctx.fillText(n.text, n.x, n.y-8);
        }
        ctx.restore();
        if(n.life>=n.maxLife) nodes.splice(i,1);
      }

      // ── Master device glow ─────────────────────────────
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const masterGlow = ctx.createRadialGradient(CX,CY,0, CX,CY,220);
      masterGlow.addColorStop(0, getThemeColor(0.04));
      masterGlow.addColorStop(1, "transparent");
      ctx.fillStyle = masterGlow;
      ctx.beginPath(); ctx.arc(CX,CY,220,0,Math.PI*2); ctx.fill();
      ctx.restore();

      screenOffset = (screenOffset + 0.4) % 100;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:"absolute", inset:0,
        width:"100%", height:"100%",
        display:"block",
        pointerEvents:"auto",
        zIndex:20,
        willChange:"transform",
      }}
    />
  );
}

function MedicalCursor() {

  const crossRef = useRef<HTMLDivElement>(null);

  const ringRef = useRef<HTMLDivElement>(null);

  const trailRef = useRef<Array<HTMLDivElement | null>>([]);

  const histRef = useRef<Array<{ x: number; y: number }>>([]);

  const TRAIL = 8;



  const [mode, setMode] = useState<"default" | "hover" | "click">("default");

  const [light, setLight] = useState(false);



  useEffect(() => {

    let mx = -400, my = -400, rx = -400, ry = -400, raf = 0;



    const onMove = (e: MouseEvent) => {

      mx = e.clientX; my = e.clientY;

      let el = document.elementFromPoint(mx, my) as HTMLElement | null;

      while (el) {

        if (el.dataset?.theme === "light") { setLight(true); break; }

        if (el.dataset?.theme === "dark") { setLight(false); break; }

        el = el.parentElement;

      }

    };

    const onDown = () => setMode("click");

    const onUp = () => setMode(m => m === "click" ? "default" : m);

    const onIn = () => setMode("hover");

    const onOut = () => setMode("default");



    document.addEventListener("mousemove", onMove);

    document.addEventListener("mousedown", onDown);

    document.addEventListener("mouseup", onUp);

    document.querySelectorAll("button,a,[data-mag]").forEach(el => {

      el.addEventListener("mouseenter", onIn);

      el.addEventListener("mouseleave", onOut);

    });



    const tick = () => {

      if (crossRef.current) {

        crossRef.current.style.left = `${mx}px`;

        crossRef.current.style.top = `${my}px`;

      }

      rx += (mx - rx) * 0.1; ry += (my - ry) * 0.1;

      if (ringRef.current) {

        ringRef.current.style.left = `${rx}px`;

        ringRef.current.style.top = `${ry}px`;

      }

      histRef.current.unshift({ x: mx, y: my });

      if (histRef.current.length > TRAIL) histRef.current.pop();

      trailRef.current.forEach((dot, i) => {

        const p = histRef.current[i + 1];

        if (!dot || !p) return;

        dot.style.left = `${p.x}px`;

        dot.style.top = `${p.y}px`;

        dot.style.opacity = `${(1 - i / TRAIL) * 0.32}`;

        const s = `${3.5 - i * 0.38}px`;

        dot.style.width = s; dot.style.height = s;

      });

      raf = requestAnimationFrame(tick);

    };

    raf = requestAnimationFrame(tick);



    return () => {

      document.removeEventListener("mousemove", onMove);

      document.removeEventListener("mousedown", onDown);

      document.removeEventListener("mouseup", onUp);

      cancelAnimationFrame(raf);

    };

  }, []);



  const C = light ? "#0B1E33" : "#2DD4BF";

  const sz = mode === "hover" ? 54 : mode === "click" ? 22 : 32;



  return (

    <>

      {Array.from({ length: TRAIL - 1 }).map((_, i) => (

        <div key={i} ref={el => { trailRef.current[i] = el; }}

          style={{
            position: "fixed", zIndex: 99990, pointerEvents: "none",

            width: 4, height: 4, borderRadius: "50%", background: C, transform: "translate(-50%,-50%)"
          }} />

      ))}

      <div ref={ringRef} style={{

        position: "fixed", zIndex: 99997, pointerEvents: "none",

        width: mode === "hover" ? 64 : mode === "click" ? 14 : 42,

        height: mode === "hover" ? 64 : mode === "click" ? 14 : 42,

        borderRadius: mode === "hover" ? 12 : "50%",

        border: `1px solid ${C}`,

        opacity: mode === "hover" ? .6 : .25,

        background: mode === "hover" ? `${C}0b` : "transparent",

        boxShadow: mode === "hover" ? `0 0 32px ${C}35` : "none",

        transform: "translate(-50%,-50%)",

        transition: "width .28s, height .28s, border-radius .3s, opacity .3s",

      }} />

      <div ref={crossRef} style={{ position: "fixed", zIndex: 99999, pointerEvents: "none", transform: "translate(-50%,-50%)" }}>

        <svg width={sz} height={sz} viewBox="-20 -20 40 40"

          style={{ display: "block", transition: "width .22s, height .22s" }}>

          <line x1="-17" y1="0" x2="-7" y2="0" stroke={C} strokeWidth={mode === "click" ? 1 : 1.5} strokeLinecap="round" />

          <line x1="7" y1="0" x2="17" y2="0" stroke={C} strokeWidth={mode === "click" ? 1 : 1.5} strokeLinecap="round" />

          <line x1="0" y1="-17" x2="0" y2="-7" stroke={C} strokeWidth={mode === "click" ? 1 : 1.5} strokeLinecap="round" />

          <line x1="0" y1="7" x2="0" y2="17" stroke={C} strokeWidth={mode === "click" ? 1 : 1.5} strokeLinecap="round" />

          <circle cx="0" cy="0" r={mode === "click" ? 1.2 : 1.9} fill={C} />

          <g className="arc-cw">

            <path d="M-14,0 A14,14 0 0,1 0,-14" stroke={C} strokeWidth="1.5" fill="none"

              style={{ filter: `drop-shadow(0 0 4px ${C})` }} />

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

      </div>

    </>

  );

}

const ECG_PATH = `
  M-100 80 L0 80 
  L20 76 L38 85 L56 18 L72 148 L84 6 L100 80 L250 80 
  L270 76 L288 85 L306 18 L322 148 L334 6 L350 80 L500 80 
  L520 76 L538 85 L556 18 L572 148 L584 6 L600 80 L750 80 
  L770 76 L788 85 L806 18 L822 148 L834 6 L850 80 L1000 80 
  L1020 76 L1038 85 L1056 18 L1072 148 L1084 6 L1100 80 L1250 80 
  L1270 76 L1288 85 L1306 18 L1322 148 L1334 6 L1350 80 L1500 80 
  L1520 76 L1538 85 L1556 18 L1572 148 L1584 6 L1600 80 L1750 80 
  L1770 76 L1788 85 L1806 18 L1822 148 L1834 6 L1850 80 L2000 80 
  L2020 76 L2038 85 L2056 18 L2072 148 L2084 6 L2100 80 L2250 80 
  L2270 76 L2288 85 L2306 18 L2322 148 L2334 6 L2350 80 L2500 80 
  L2520 76 L2538 85 L2556 18 L2572 148 L2584 6 L2600 80 L2750 80 
  L2770 76 L2788 85 L2806 18 L2822 148 L2834 6 L2850 80 L3000 80
`;

//  PRELOADER (Procedural Neural Signal Generator)

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

      <FloatingParticles count={16} />

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

        {/* CTA pill - Patient & Doctor Access */}
        <Reveal dir="up" delay={1.5}>
          <div style={{
            display: "flex", flexDirection: "row", alignItems: "center", gap: 8, padding: 8,
            borderRadius: 32, background: "rgba(255,255,255,.03)",
            border: "1px solid rgba(255,255,255,.07)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 24px 64px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.04)",
            width: "fit-content",
          }}>
            <MagButton onClick={() => router.push("/auth/patient/signin")}
              className="btn-shim fB"
              style={{
                position: "relative", overflow: "hidden",
                display: "flex", alignItems: "center", gap: 12,
                padding: "18px 44px", borderRadius: 24, fontSize: 15, letterSpacing: ".12em",
                background: "#2DD4BF", color: "#080f1a", border: "none",
                boxShadow: "0 0 55px rgba(45,212,191,.42)"
              }}>
              <Play size={16} style={{ fill: "#080f1a", position: "relative", zIndex: 1 }} />
              <span style={{ position: "relative", zIndex: 1 }}>Patient Sign In</span>
            </MagButton>
            <div style={{ width: 1, height: 46, background: "rgba(255,255,255,.06)" }} />
            <MagButton onClick={() => router.push("/auth/doctor/signin")}
              className="fB"
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "18px 44px", borderRadius: 24, fontSize: 15, letterSpacing: ".12em",
                background: "transparent", color: "rgba(255,255,255,.78)", border: "none"
              }}>
              <Stethoscope size={16} />
              Doctor Sign In
              <ArrowRight size={13} style={{ opacity: .4 }} />
            </MagButton>
          </div>
        </Reveal>

        {/* Signup links */}
        <Reveal dir="up" delay={1.8}>
          <div style={{
            display: "flex", alignItems: "center", gap: 18,
            marginTop: 24, justifyContent: "center"
          }}>
            <span className="fM" style={{
              fontSize: 9, color: "rgba(255,255,255,.28)",
              textTransform: "uppercase", letterSpacing: ".22em"
            }}>
              New user?
            </span>
            <a
              href="/auth/patient/signup"
              data-mag
              className="fM"
              style={{
                fontSize: 9, textTransform: "uppercase", letterSpacing: ".20em",
                color: "#2DD4BF", textDecoration: "none",
                padding: "6px 14px", borderRadius: 99,
                border: "1px solid rgba(45,212,191,.2)", transition: "all .3s"
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(45,212,191,.08)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              Patient Signup
            </a>
            <span style={{ color: "rgba(255,255,255,.15)" }}>·</span>
            <a
              href="/auth/doctor/signup"
              data-mag
              className="fM"
              style={{
                fontSize: 9, textTransform: "uppercase", letterSpacing: ".20em",
                color: "rgba(255,255,255,.45)", textDecoration: "none",
                padding: "6px 14px", borderRadius: 99,
                border: "1px solid rgba(255,255,255,.1)", transition: "all .3s"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = "rgba(255,255,255,.85)";
                e.currentTarget.style.background = "rgba(255,255,255,.05)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = "rgba(255,255,255,.45)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              Doctor Signup
            </a>
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