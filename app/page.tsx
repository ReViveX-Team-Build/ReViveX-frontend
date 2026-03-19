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

  Mail, Phone, Globe, Linkedin, Instagram, Github, Facebook, Cloud,

  CheckCircle2, Sparkles, Activity, Shield, TrendingUp, Star, X

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

  /* ── SWEEP BUTTON — cinematic border+sweep hover ───────────────────── */
  .sweep-btn {
    position: relative; overflow: hidden; cursor: none;
    display: inline-flex; align-items: center; gap: 8px;
    border-radius: 12px; font-weight: 700; outline: none;
    letter-spacing: .06em; font-size: 13px;
    transition: filter .3s cubic-bezier(.22,1,.36,1), border-color .3s,
                border-top-width .15s, border-bottom-width .15s, opacity .15s;
  }
  .sweep-btn:active { opacity: .75; }
  .sweep-btn .sweep-bar {
    position: absolute; left: 0; top: -150%;
    width: 100%; height: 5px; border-radius: 4px; opacity: .55;
    transition: top .5s cubic-bezier(.22,1,.36,1);
  }
  .sweep-btn:hover .sweep-bar { top: 150%; }
  .sweep-btn:hover { filter: brightness(1.5); border-top-width: 4px; }
  /* Teal — Patient */
  .sweep-teal {
    background-color: rgba(13,42,40,.5); color: #2DD4BF;
    border: 1px solid rgba(45,212,191,.5); border-bottom-width: 4px;
    padding: 13px 26px;
  }
  .sweep-teal:hover { border-bottom-width: 1px; }
  /* Slate — Doctor */
  .sweep-slate {
    background-color: rgba(30,30,46,.5); color: rgba(255,255,255,.80);
    border: 1px solid rgba(255,255,255,.22); border-bottom-width: 4px;
    padding: 13px 26px;
  }
  .sweep-slate:hover { border-bottom-width: 1px; border-color: rgba(255,255,255,.40); }

`;


// Shared Lenis instance — components subscribe directly, no window event spam
let _lenisInstance: any = null;
const _lenisCallbacks: Set<(scroll: number) => void> = new Set();

function useLenis() {
  useEffect(() => {
    import("lenis").then(({ default: Lenis }) => {
      const l = new Lenis({ lerp: 0.08, smoothWheel: true });
      _lenisInstance = l;
      l.on("scroll", ({ scroll }: { scroll: number }) => {
        _lenisCallbacks.forEach(cb => { try { cb(scroll); } catch(_){} });
      });
      let rafId = 0;
      const raf = (t: number) => { l.raf(t); rafId = requestAnimationFrame(raf); };
      rafId = requestAnimationFrame(raf);
      return () => { cancelAnimationFrame(rafId); _lenisInstance = null; l.destroy(); };
    }).catch(() => {});
  }, []);
}

// Subscribe to Lenis scroll without flooding window events
function useLenisScroll(cb: (scroll: number) => void) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    const h = (s: number) => ref.current(s);
    _lenisCallbacks.add(h);
    return () => { _lenisCallbacks.delete(h); };
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
  // Replaced with AtmosphericLayer — this component no longer renders dots
  return null;
}

// Premium atmospheric depth layer — replaces cheap floating dots
function AtmosphericLayer() {
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
      {/* Deep space gradient base */}
      <div style={{ position:"absolute", inset:0,
        background:"radial-gradient(ellipse 80% 60% at 50% 40%, rgba(8,20,40,0.0) 0%, rgba(4,8,18,0.95) 100%)" }} />
      {/* Left atmospheric glow — cool blue */}
      <div style={{ position:"absolute", left:"-15%", top:"20%", width:"55%", height:"70%",
        background:"radial-gradient(ellipse, rgba(14,40,80,0.55) 0%, transparent 70%)",
        filter:"blur(60px)" }} />
      {/* Right atmospheric glow — teal */}
      <div style={{ position:"absolute", right:"-10%", top:"10%", width:"45%", height:"65%",
        background:"radial-gradient(ellipse, rgba(10,60,65,0.40) 0%, transparent 70%)",
        filter:"blur(70px)" }} />
      {/* Bottom warm glow — subtle depth */}
      <div style={{ position:"absolute", bottom:"-10%", left:"20%", right:"20%", height:"50%",
        background:"radial-gradient(ellipse, rgba(25,10,55,0.35) 0%, transparent 65%)",
        filter:"blur(80px)" }} />
      {/* Top rim light */}
      <div style={{ position:"absolute", top:0, left:"30%", right:"30%", height:"1px",
        background:"linear-gradient(90deg,transparent,rgba(45,212,191,0.12),transparent)" }} />
      {/* Vignette */}
      <div style={{ position:"absolute", inset:0,
        background:"radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(2,5,12,0.75) 100%)" }} />
      {/* Fine star field — CSS only, no JS */}
      <style>{`
        @keyframes atm-twinkle { 0%,100%{opacity:.18} 50%{opacity:.85} }
        @keyframes atm-drift { 0%{transform:translateY(0)} 100%{transform:translateY(-6px)} }
        .atm-star { position:absolute; border-radius:50%; animation:atm-twinkle var(--dur,4s) var(--del,0s) ease-in-out infinite, atm-drift calc(var(--dur,4s)*1.8) var(--del,0s) ease-in-out infinite alternate; }
      `}</style>
      {/* 60 CSS stars — varied sizes, colors, positions, no JS animation loop */}
      {[
        [12,18,1.5,3.2,0.0],[28,42,1.0,5.1,0.8],[45,15,1.8,3.8,1.4],[67,33,1.2,4.5,0.3],
        [83,22,1.0,6.0,1.9],[92,55,1.5,3.5,0.7],[5,70,1.2,4.8,1.2],[18,85,0.8,5.5,0.4],
        [38,62,1.6,3.9,1.7],[55,78,1.0,4.2,0.9],[72,48,1.4,5.8,1.5],[88,72,0.9,3.6,0.2],
        [23,30,2.0,4.0,0.6],[50,50,1.5,6.2,1.1],[77,25,1.1,3.3,1.8],[8,40,1.3,5.0,0.5],
        [35,90,1.0,4.7,1.3],[62,12,1.8,3.7,0.1],[90,38,1.2,5.3,1.6],[15,60,0.9,4.4,0.8],
        [42,80,1.6,3.1,1.0],[68,58,1.1,5.6,0.3],[85,85,1.4,4.9,1.9],[30,10,0.8,3.4,0.6],
        [57,35,1.7,5.2,1.4],[75,70,1.0,4.1,0.2],[95,20,1.3,6.1,1.7],[20,50,1.5,3.8,0.9],
        [48,25,0.9,4.6,1.2],[73,88,1.2,5.4,0.4],[10,75,1.6,3.0,1.5],[37,45,1.1,4.3,0.7],
        [63,68,1.4,5.7,1.1],[87,32,0.8,4.0,1.8],[25,92,1.3,3.6,0.3],[52,18,1.7,5.9,0.6],
        [78,55,1.0,4.8,1.3],[3,30,1.5,3.3,0.0],[40,72,1.2,5.1,1.6],[65,40,0.9,4.5,0.8],
        [82,78,1.6,6.0,1.4],[17,20,1.1,3.9,0.2],[44,58,1.4,4.7,1.9],[70,28,0.8,5.3,0.5],
        [93,65,1.3,4.2,1.1],[28,82,1.7,3.5,0.7],[55,95,1.0,5.8,1.2],[80,15,1.5,4.4,1.7],
        [6,52,1.2,3.7,0.4],[33,38,0.9,5.0,1.5],[60,75,1.6,4.6,0.1],[86,48,1.1,3.2,1.0],
        [22,65,1.4,5.5,1.6],[49,88,0.8,4.9,0.3],[76,42,1.3,3.8,1.9],[98,75,1.0,5.2,0.6],
      ].map(([x,y,sz,dur,del],i) => (
        <div key={i} className="atm-star" style={{
          left:`${x}%`, top:`${y}%`,
          width:sz, height:sz,
          background: i%5===0?"rgba(45,212,191,0.9)": i%5===1?"rgba(167,139,250,0.8)": i%5===2?"rgba(186,230,253,0.9)":"rgba(255,255,255,0.85)",
          boxShadow: i%7===0?`0 0 ${sz*3}px rgba(45,212,191,0.6)`: i%7===1?`0 0 ${sz*2}px rgba(167,139,250,0.5)`:"none",
          "--dur":`${dur}s`, "--del":`${del}s`,
        } as any} />
      ))}
    </div>
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

function Preloader({ onDone }: { onDone: () => void }) {
  const [pct,   setPct]   = useState(0);
  const [phase, setPhase] = useState<"loading"|"ready"|"exit">("loading");
  const [msg,   setMsg]   = useState("DETECTING NEURAL SIGNAL...");

  const MSGS = [
    "DETECTING NEURAL SIGNAL...",
    "CALIBRATING GRIP SENSOR...",
    "LOADING THERAPY PROTOCOL...",
    "ESTABLISHING CLOUD LINK...",
    "ACTIVATING AI COMPANION...",
    "NEURAL LINK ESTABLISHED."
  ];

  useEffect(() => {
    const counter  = setInterval(() => setPct(p => { if (p >= 100) { clearInterval(counter); return 100; } return p + 1; }), 28);
    let mi = 0;
    const msgTimer = setInterval(() => { mi = Math.min(mi+1, MSGS.length-1); setMsg(MSGS[mi]); }, 600);
    const t1 = setTimeout(() => setPhase("ready"), 3200);
    const t2 = setTimeout(() => setPhase("exit"),  4200);
    const t3 = setTimeout(onDone, 5000);
    return () => { clearInterval(counter); clearInterval(msgTimer); [t1,t2,t3].forEach(clearTimeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onDone]);

  // Premium ECG SVG points — the heartbeat polyline
  const PTS = "0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24";

  return (
    <AnimatePresence>
      {phase !== "exit" && (
        <motion.div
          key="pl"
          exit={{ y: "-100%", opacity: 0, filter: "blur(10px)", transition: { duration: 0.9, ease: [0.76,0,0.24,1] } }}
          style={{
            position: "fixed", inset: 0, zIndex: 9900,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
            background: "linear-gradient(160deg, #030810 0%, #060e1a 50%, #040c16 100%)",
          }}
        >
          {/* Radial glow behind everything */}
          <motion.div
            animate={{ opacity: phase === "ready" ? 0.9 : 0.5, scale: phase === "ready" ? 1.6 : 1 }}
            transition={{ duration: 1.0, ease: "easeOut" }}
            style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(45,212,191,0.15) 0%, transparent 70%)"
            }}
          />

          {/* Grid */}
          <div className="grid-dk" style={{ position:"absolute",inset:0,pointerEvents:"none",opacity: phase==="ready"?0.7:0.25,transition:"opacity 0.8s" }} />

          {/* ── PREMIUM ECG SVG ── */}
          <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",overflow:"hidden",pointerEvents:"none" }}>
            <svg
              viewBox="0 0 64 48"
              style={{ width:"100%", height:160, overflow:"visible" }}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Glistening gradient — teal → white → teal sweep */}
                <linearGradient id="ecg-glisten" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#2DD4BF" stopOpacity="0.9" />
                  <stop offset="38%"  stopColor="#7ffff4" stopOpacity="1"   />
                  <stop offset="50%"  stopColor="#ffffff" stopOpacity="1"   />
                  <stop offset="62%"  stopColor="#7ffff4" stopOpacity="1"   />
                  <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.9" />
                  <animateTransform
                    attributeName="gradientTransform" type="translate"
                    from="-1 0" to="1 0"
                    dur="1.8s" repeatCount="indefinite"
                  />
                </linearGradient>
                {/* Outer glow filter */}
                <filter id="ecg-glow" x="-20%" y="-200%" width="140%" height="500%">
                  <feGaussianBlur stdDeviation="1.8" result="blur1" />
                  <feGaussianBlur stdDeviation="4"   result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {/* Sharp inner glow */}
                <filter id="ecg-glow2" x="-20%" y="-200%" width="140%" height="500%">
                  <feGaussianBlur stdDeviation="0.6" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Layer 1: fat teal soft glow */}
              <polyline
                points={PTS}
                fill="none"
                stroke="#2DD4BF"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter:"blur(6px)", opacity:0.45 }}
              />
              {/* Layer 2: medium teal glow */}
              <polyline
                points={PTS}
                fill="none"
                stroke="#2DD4BF"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#ecg-glow)"
                opacity={0.55}
              />
              {/* Layer 3: dim ghost track */}
              <polyline
                points={PTS}
                fill="none"
                stroke="rgba(45,212,191,0.18)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Layer 4: main animated dash — glistening gradient stroke */}
              <polyline
                points={PTS}
                fill="none"
                stroke="url(#ecg-glisten)"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="48 144"
                strokeDashoffset="192"
                filter="url(#ecg-glow2)"
                style={{
                  animation: "ecg-dash 1.4s linear infinite",
                }}
              />
              {/* Layer 5: ultra-bright hair-thin centre line */}
              <polyline
                points={PTS}
                fill="none"
                stroke="rgba(255,255,255,0.92)"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="48 144"
                strokeDashoffset="192"
                style={{
                  animation: "ecg-dash 1.4s linear infinite",
                }}
              />
            </svg>
          </div>

          {/* Inject keyframe for ecg-dash */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes ecg-dash {
              72.5% { opacity: 0; }
              to    { stroke-dashoffset: 0; }
            }
          ` }} />

          {/* ── Centre content ── */}
          <div style={{ position:"relative", zIndex:2, textAlign:"center" }}>
            <motion.div
              animate={phase==="ready" ? { scale:[1,1.5,1], filter:["blur(0px)","blur(6px)","blur(0px)"] } : {}}
              transition={{ repeat: phase==="ready" ? Infinity : 0, duration: 0.4 }}
              style={{ marginBottom:18, color:"#2DD4BF", display:"flex", justifyContent:"center" }}
              className={phase!=="ready" ? "heartbeat" : ""}
            >
              <Heart size={36} style={{ fill:"#2DD4BF", filter: phase==="ready" ? "drop-shadow(0 0 25px #2DD4BF)" : "none", transition:"filter 0.5s" }} />
            </motion.div>

            <div className="fM" style={{ fontSize:9, color:"rgba(255,255,255,.28)", textTransform:"uppercase", letterSpacing:".42em", marginBottom:24 }}>
              NEURO-REHABILITATION SYSTEM
            </div>

            <motion.div
              initial={{ opacity:0, scale:.8 }}
              animate={{ opacity:1, scale: phase==="ready"?1.05:1, textShadow: phase==="ready"?"0 0 60px rgba(45,212,191,0.8)":"none" }}
              transition={{ delay:.4, duration:.7 }}
              className="fB" style={{ fontSize:"clamp(3.5rem,11vw,9rem)", color:"#fff", letterSpacing:".08em", lineHeight:1 }}
            >
              REVIVE<motion.span animate={{ color: phase==="ready"?"#fff":"#2DD4BF" }} transition={{ duration:0.5 }}>X</motion.span>
            </motion.div>

            {/* Progress number */}
            <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"center", gap:4, marginTop:32, marginBottom:16 }}>
              <motion.span
                animate={{ color: phase==="ready"?"#2DD4BF":"rgba(255,255,255,.85)" }}
                className="fM" style={{ fontSize:"3.2rem", lineHeight:1 }}
              >
                {String(pct).padStart(3,"0")}
              </motion.span>
              <span className="fM blink" style={{ fontSize:"1.6rem", color:"#2DD4BF", marginBottom:4 }}>%</span>
            </div>

            {/* Progress bar — glistening */}
            <div style={{ width:240, height:2, background:"rgba(255,255,255,.08)", margin:"0 auto 16px", overflow:"hidden", borderRadius:2, position:"relative" }}>
              <motion.div
                animate={{ width:`${pct}%` }}
                transition={{ duration:.05 }}
                style={{
                  height:"100%",
                  background: phase==="ready"
                    ? "linear-gradient(90deg,#2DD4BF,#fff,#2DD4BF)"
                    : "linear-gradient(90deg,#14b8a6,#2DD4BF,#7ffff4)",
                  boxShadow:"0 0 18px rgba(45,212,191,.9), 0 0 6px #fff",
                  transition:"background 0.5s",
                }}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={phase==="ready"?"SYSTEM ONLINE.":msg}
                initial={{ opacity:0, y:6 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-4 }}
                transition={{ duration:.3 }}
                className="fM"
                style={{
                  fontSize: phase==="ready"?11:9,
                  color: phase==="ready"?"#2DD4BF":"rgba(255,255,255,.3)",
                  textTransform:"uppercase",
                  letterSpacing:".24em",
                  fontWeight: phase==="ready"?"bold":"normal",
                }}
              >
                {phase==="ready" ? "SYSTEM ONLINE. INITIALIZING UI..." : msg}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SectionSep({ color = "#2DD4BF", dim = false }: { color?: string; dim?: boolean }) {
  return (
    <div style={{ position: "relative", height: 1, overflow: "visible", zIndex: 10, pointerEvents: "none" }}>
      <div style={{
        position: "absolute", left: "10%", right: "10%", height: 1,
        background: `linear-gradient(90deg, transparent 0%, ${color}${dim ? "30" : "55"} 30%, ${color}${dim ? "45" : "70"} 50%, ${color}${dim ? "30" : "55"} 70%, transparent 100%)`,
      }} />
      <div style={{ position: "absolute", left: "30%", right: "30%", height: 8, top: -3, filter: "blur(4px)", background: `linear-gradient(90deg, transparent, ${color}${dim ? "18" : "30"}, transparent)` }} />
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// AnimatedGradient — WebGL canvas gradient, subtle dark deep-sea data pulse
// Memory-safe: renderer + RAF cleaned up on unmount via returned cleanup fn
// ══════════════════════════════════════════════════════════════════════════════
interface AGProps {
  color1?: string; color2?: string; color3?: string;
  speed?: number; className?: string; style?: React.CSSProperties;
}
function AnimatedGradient({ color1="#040a12", color2="#0a1c2c", color3="#062b2b", speed=0.18, className="", style }: AGProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl") as WebGLRenderingContext | null;
    if (!gl) return;

    const vert = `attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos,0.,1.); }`;
    const frag = `
      precision mediump float;
      uniform float u_time;
      uniform vec2  u_res;
      uniform vec3  u_c1, u_c2, u_c3;
      void main(){
        vec2 uv = gl_FragCoord.xy / u_res;
        float n1 = sin(uv.x*3.1+u_time*0.7)*0.5+0.5;
        float n2 = sin(uv.y*2.8+u_time*0.5)*0.5+0.5;
        float n3 = sin((uv.x+uv.y)*2.2+u_time*0.4)*0.5+0.5;
        float t1 = smoothstep(0.,1.,n1*n2);
        float t2 = smoothstep(0.,1.,n2*n3);
        vec3 col = mix(u_c1, u_c2, t1);
        col = mix(col, u_c3, t2*0.6);
        gl_FragColor = vec4(col, 1.0);
      }`;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src); gl.compileShader(s); return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog); gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes  = gl.getUniformLocation(prog, "u_res");
    const uC1   = gl.getUniformLocation(prog, "u_c1");
    const uC2   = gl.getUniformLocation(prog, "u_c2");
    const uC3   = gl.getUniformLocation(prog, "u_c3");

    const hex2rgb = (h: string) => {
      const r = parseInt(h.slice(1,3),16)/255;
      const g = parseInt(h.slice(3,5),16)/255;
      const b = parseInt(h.slice(5,7),16)/255;
      return [r,g,b];
    };
    const [r1,g1,b1] = hex2rgb(color1);
    const [r2,g2,b2] = hex2rgb(color2);
    const [r3,g3,b3] = hex2rgb(color3);

    let rafId = 0, start = performance.now();
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      rafId = requestAnimationFrame(draw);
      if (document.hidden) return;
      const t = (performance.now() - start) * 0.001 * speed;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform3f(uC1, r1, g1, b1);
      gl.uniform3f(uC2, r2, g2, b2);
      gl.uniform3f(uC3, r3, g3, b3);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display:"block", width:"100%", height:"100%", ...style }}
    />
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VaporizeTextCycle — canvas particle vaporize effect cycling through texts
// Memory-safe: single RAF, particles array cleared on each cycle + on unmount
// ══════════════════════════════════════════════════════════════════════════════
interface VTCProps {
  texts: string[];
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  style?: React.CSSProperties;
  className?: string;
}
function VaporizeTextCycle({ texts, fontSize=120, color="#ef4444", fontFamily="'Syne',sans-serif", style, className="" }: VTCProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: false, margin: "0px" });

  useEffect(() => {
    if (!inView) return;
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    let rafId = 0;
    let textIdx = 0;
    let phase: "show" | "vaporize" | "wait" = "show";
    let phaseTimer = 0;
    let particles: { x:number; y:number; ox:number; oy:number; r:number; vx:number; vy:number; a:number; col:string }[] = [];

    const SHOW_DURATION   = 2400; // ms text stays solid
    const VAP_DURATION    = 1200; // ms vaporize anim
    const WAIT_DURATION   = 400;  // ms blank between

    const W = () => canvas.width;
    const H = () => canvas.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const el = containerRef.current;
      if (!el) return;
      canvas.width  = el.offsetWidth  * dpr;
      canvas.height = el.offsetHeight * dpr;
      canvas.style.width  = el.offsetWidth  + "px";
      canvas.style.height = el.offsetHeight + "px";
    };
    resize();
    window.addEventListener("resize", resize);

    // Sample pixels of the text rendered off-screen
    const sampleText = (text: string) => {
      const off = document.createElement("canvas");
      off.width  = W(); off.height = H();
      const ctx = off.getContext("2d")!;
      ctx.font = `900 ${fontSize * dpr}px ${fontFamily}`;
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, W()/2, H()/2);
      const data = ctx.getImageData(0, 0, W(), H()).data;
      const pts: {x:number;y:number}[] = [];
      const step = 4; // sample every 4px for density
      for (let y = 0; y < H(); y += step) {
        for (let x = 0; x < W(); x += step) {
          const idx = (y * W() + x) * 4;
          if (data[idx+3] > 60) pts.push({ x, y });
        }
      }
      return pts;
    };

    const spawnParticles = (text: string) => {
      const pts = sampleText(text);
      particles = pts.map(p => ({
        x: p.x, y: p.y, ox: p.x, oy: p.y,
        r: Math.random() * 1.5 + 0.5,
        vx: 0, vy: 0, a: 1,
        col: color,
      }));
    };

    spawnParticles(texts[0]);
    let lastTime = performance.now();

    const draw = () => {
      rafId = requestAnimationFrame(draw);
      const now = performance.now();
      const dt  = now - lastTime;
      lastTime  = now;
      phaseTimer += dt;

      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, W(), H());

      if (phase === "show") {
        // Draw particles in place (solid text)
        particles.forEach(p => {
          ctx.globalAlpha = 1;
          ctx.fillStyle = p.col;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
          ctx.fill();
        });
        if (phaseTimer >= SHOW_DURATION) {
          // Kick off vaporize velocities
          particles.forEach(p => {
            p.vx = (Math.random() - 0.3) * 3.5;
            p.vy = -(Math.random() * 4 + 1.5);
          });
          phase = "vaporize";
          phaseTimer = 0;
        }
      } else if (phase === "vaporize") {
        const progress = Math.min(phaseTimer / VAP_DURATION, 1);
        particles.forEach(p => {
          p.x  += p.vx;
          p.y  += p.vy;
          p.vy += 0.06; // gentle gravity
          p.a   = 1 - progress * progress;
          ctx.globalAlpha = Math.max(0, p.a);
          ctx.fillStyle = p.col;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
          ctx.fill();
        });
        if (phaseTimer >= VAP_DURATION) {
          ctx.globalAlpha = 1;
          particles = [];
          phase = "wait";
          phaseTimer = 0;
        }
      } else if (phase === "wait") {
        if (phaseTimer >= WAIT_DURATION) {
          textIdx = (textIdx + 1) % texts.length;
          spawnParticles(texts[textIdx]);
          phase = "show";
          phaseTimer = 0;
        }
      }
      ctx.globalAlpha = 1;
    };
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      particles = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <div ref={containerRef} className={className} style={{ position:"relative", width:"100%", minHeight: fontSize * 1.6 + "px", ...style }}>
      <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ParticleTextEffect — interactive canvas: hover shatters text into particles
// Memory-safe: RAF cancelled on unmount, particles cleared between renders
// Font: Bebas Neue (cinematic) matching ReViveX theme
// ══════════════════════════════════════════════════════════════════════════════
interface PTEProps {
  text?: string;
  colors?: string[];
  className?: string;
  animationForce?: number;
  particleDensity?: number;
}
function ParticleTextEffect({
  text = "BROKEN.",
  colors = ["ef4444","dc2626","b91c1c","7f1d1d","450a0a"],
  className = "",
  animationForce = 90,
  particleDensity = 3,
}: PTEProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const ctxRef     = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef     = useRef<number | null>(null);
  const ptsRef     = useRef<any[]>([]);
  const ptrRef     = useRef<{ x?: number; y?: number }>({});
  const hasPtrRef  = useRef(false);
  const iRadRef    = useRef(120);
  const textBoxRef = useRef<{ str:string; x?:number; y?:number; w?:number; h?:number }>({ str: text });

  const rand = (max=1, min=0) => min + Math.random() * (max - min);

  const draw = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ptsRef.current.forEach(p => {
      // Move toward pointer if close
      if (hasPtrRef.current && ptrRef.current.x !== undefined) {
        const dx = p.cx - ptrRef.current.x!;
        const dy = p.cy - ptrRef.current.y!;
        const dist = Math.hypot(dx, dy);
        if (dist < iRadRef.current && dist > 0) {
          const force = Math.min(p.f, (iRadRef.current - dist) / dist * 2);
          p.cx += (dx / dist) * force;
          p.cy += (dy / dist) * force;
        }
      }
      // Restore to origin
      const odx = p.ox - p.cx, ody = p.oy - p.cy, od = Math.hypot(odx, ody);
      if (od > 1) { p.cx += (odx / od) * Math.min(od * 0.1, 3); p.cy += (ody / od) * Math.min(od * 0.1, 3); }
      // Draw
      ctx.fillStyle = `rgb(${p.rgb.join(",")})`;
      ctx.beginPath();
      ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    rafRef.current = requestAnimationFrame(draw);
  };

  const buildParticles = () => {
    const canvas = canvasRef.current;
    const ctx    = ctxRef.current;
    if (!canvas || !ctx) return;

    // Set canvas to fill its container
    const parent = canvas.parentElement;
    canvas.width  = parent ? parent.offsetWidth  : window.innerWidth;
    canvas.height = parent ? parent.offsetHeight : 200;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ── Measure + draw text to canvas ──────────────────────────────────
    const tb    = textBoxRef.current;
    tb.str      = text;
    tb.h        = Math.min(canvas.height * 0.85, canvas.width / (text.length * 0.62));
    iRadRef.current = Math.max(60, tb.h * 1.4);
    ctx.font        = `900 ${tb.h}px 'Bebas Neue', 'Syne', sans-serif`;
    ctx.textAlign   = "center";
    ctx.textBaseline = "middle";
    tb.w = Math.round(ctx.measureText(tb.str).width);
    tb.x = Math.max(0, Math.round((canvas.width  - tb.w) / 2));
    tb.y = Math.max(0, Math.round((canvas.height - tb.h) / 2));

    // Build gradient across colors
    const grad = ctx.createLinearGradient(tb.x, tb.y, tb.x + tb.w, tb.y + tb.h!);
    const N = Math.max(colors.length - 1, 1);
    colors.forEach((hex, i) => grad.addColorStop(i / N, `#${hex}`));
    ctx.fillStyle = grad;
    ctx.fillText(tb.str, canvas.width / 2, canvas.height / 2);

    // ── Sample pixels → particles ─────────────────────────────────────
    const imgData = ctx.getImageData(tb.x, tb.y, tb.w!, tb.h!).data;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ptsRef.current = [];
    const step = Math.max(1, particleDensity);
    for (let row = 0; row < tb.h!; row += step) {
      for (let col = 0; col < tb.w!; col += step) {
        const idx = (row * tb.w! + col) * 4;
        if (imgData[idx + 3] > 60) {
          const ox  = tb.x + col;
          const oy  = tb.y + row;
          const rgb = [
            Math.max(0, imgData[idx]   + rand(13, -13)),
            Math.max(0, imgData[idx+1] + rand(13, -13)),
            Math.max(0, imgData[idx+2] + rand(13, -13)),
          ].map(Math.round);
          ptsRef.current.push({
            ox, oy, cx: ox, cy: oy,
            r: rand(2.2, 0.7),
            f: rand(animationForce + 15, animationForce - 15),
            rgb,
          });
        }
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;
    buildParticles();
    draw();

    const onResize = () => { buildParticles(); };
    window.addEventListener("resize", onResize);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      ptsRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, colors.join(","), animationForce, particleDensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`block w-full h-full ${className}`}
      style={{ cursor: "none", touchAction: "none" }}
      onPointerMove={e => {
        const r = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
        const sx = (e.currentTarget as HTMLCanvasElement).width  / r.width;
        const sy = (e.currentTarget as HTMLCanvasElement).height / r.height;
        ptrRef.current = { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
        hasPtrRef.current = true;
      }}
      onPointerLeave={() => { hasPtrRef.current = false; ptrRef.current = {}; }}
    />
  );
}

function NavShinyButton({ children, href, onClick }: { children: React.ReactNode; href?: string; onClick?: () => void }) {
  const CSS = `
    @property --nb-ga { syntax:"<angle>"; initial-value:0deg; inherits:false }
    @property --nb-go { syntax:"<angle>"; initial-value:0deg; inherits:false }
    @property --nb-gp { syntax:"<percentage>"; initial-value:5%; inherits:false }
    @property --nb-gs { syntax:"<color>"; initial-value:white; inherits:false }
    .nav-shiny {
      --bg:#080f1a; --hl:#2DD4BF; --hl2:#a78bfa;
      --anim:nb-ga-spin linear infinite; --dur:3s;
      --t:700ms cubic-bezier(.25,1,.5,1);
      isolation:isolate; position:relative; overflow:hidden; cursor:pointer;
      padding:.55rem 1.2rem; font-family:'Syne',sans-serif; font-size:.72rem;
      font-weight:700; text-transform:uppercase; letter-spacing:.08em;
      border:1px solid transparent; border-radius:360px; color:#fff;
      background:linear-gradient(var(--bg),var(--bg)) padding-box,
        conic-gradient(from calc(var(--nb-ga) - var(--nb-go)),transparent,
          var(--hl) var(--nb-gp),var(--nb-gs) calc(var(--nb-gp)*2),
          var(--hl) calc(var(--nb-gp)*3),transparent calc(var(--nb-gp)*4)) border-box;
      box-shadow:inset 0 0 0 1px #0B1E33;
      transition:var(--t); transition-property:--nb-go,--nb-gp,--nb-gs;
      text-decoration:none; display:inline-flex; align-items:center;
    }
    .nav-shiny::before,.nav-shiny::after,.nav-shiny span::before {
      content:""; pointer-events:none; position:absolute;
      inset-inline-start:50%; inset-block-start:50%; translate:-50% -50%; z-index:-1;
    }
    .nav-shiny::before {
      --s:calc(100% - 6px); --p:2px; width:var(--s); height:var(--s);
      background:radial-gradient(circle at var(--p) var(--p),white calc(var(--p)/4),transparent 0) padding-box;
      background-size:calc(var(--p)*2) calc(var(--p)*2); background-repeat:space;
      mask-image:conic-gradient(from calc(var(--nb-ga) + 45deg),black,transparent 10% 90%,black);
      border-radius:inherit; opacity:.35; z-index:-1;
    }
    .nav-shiny::after {
      width:100%; aspect-ratio:1;
      background:linear-gradient(-50deg,transparent,var(--hl),transparent);
      mask-image:radial-gradient(circle at bottom,transparent 40%,black); opacity:.55;
      animation:nb-shimmer linear var(--dur) infinite;
    }
    .nav-shiny span{z-index:1;}
    .nav-shiny span::before {
      --s:calc(100% + 1rem); width:var(--s); height:var(--s);
      box-shadow:inset 0 -1ex 2rem 4px var(--hl); opacity:0;
      transition:opacity var(--t); animation:calc(var(--dur)*1.5) nb-breathe linear infinite;
    }
    .nav-shiny,.nav-shiny::before,.nav-shiny::after {
      animation:var(--anim) var(--dur),var(--anim) calc(var(--dur)/.4) reverse paused;
      animation-composition:add;
    }
    .nav-shiny:is(:hover,:focus-visible){--nb-gp:20%;--nb-go:95deg;--nb-gs:var(--hl2);}
    .nav-shiny:is(:hover,:focus-visible),.nav-shiny:is(:hover,:focus-visible)::before,.nav-shiny:is(:hover,:focus-visible)::after{animation-play-state:running;}
    .nav-shiny:is(:hover,:focus-visible) span::before{opacity:1;}
    @keyframes nb-ga-spin{to{--nb-ga:360deg}}
    @keyframes nb-shimmer{to{rotate:360deg}}
    @keyframes nb-breathe{from,to{scale:1}50%{scale:1.2}}
  `;
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {href
        ? <a href={href} className="nav-shiny"><span>{children}</span></a>
        : <button className="nav-shiny" onClick={onClick}><span>{children}</span></button>
      }
    </>
  );
}

function Navbar({ onGetStarted }: { onGetStarted: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    _lenisCallbacks.add(h);
    window.addEventListener("scroll", h, { passive: true });
    return () => { _lenisCallbacks.delete(h); window.removeEventListener("scroll", h); };
  }, []);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: .4, duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 500,
        display: "flex", justifyContent: "center",
        padding: "14px 24px",
        pointerEvents: "none",
      }}
    >
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", maxWidth: 1020,
        padding: "10px 16px 10px 22px",
        borderRadius: 999,
        pointerEvents: "auto",
        position: "relative",
        overflow: "hidden",
        backgroundColor: scrolled ? "rgba(8,15,26,0.82)" : "rgba(8,15,26,0.30)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        boxShadow: scrolled
          ? "0 8px 48px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.06)"
          : "0 4px 24px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.04)",
        transition: "background-color .5s, box-shadow .5s",
      }}>
        <div style={{
          position: "absolute", bottom: 0, left: "8%", right: "8%", height: 1,
          background: "linear-gradient(90deg, transparent, rgba(45,212,191,.22), transparent)",
          opacity: scrolled ? 1 : 0.45,
          transition: "opacity .5s",
          pointerEvents: "none",
        }} />

        <div className="fB" style={{ fontSize: 20, letterSpacing: ".1em", color: "#fff", flexShrink: 0 }}>
          REVIVE<span style={{ color: "#2DD4BF" }}>X</span>
        </div>

        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {[["Problem","#problem"],["Solution","#solution"],["Offer","#offer"],["Why Us","#why"],["Contact","#contact"]].map(([l, h]) => (
            <a key={l} href={h} data-mag className="fM" style={{
              fontSize: 8, textTransform: "uppercase", letterSpacing: ".22em",
              color: "rgba(255,255,255,.42)", textDecoration: "none",
              padding: "6px 11px", borderRadius: 99,
              transition: "color .3s, text-shadow .3s, background-color .3s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.textShadow = "0 0 18px rgba(45,212,191,.65)";
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,.05)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = "rgba(255,255,255,.42)";
              e.currentTarget.style.textShadow = "none";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            >{l}</a>
          ))}
        </div>

        <NavShinyButton onClick={onGetStarted}>Get Started</NavShinyButton>
      </nav>
    </motion.header>
  );
}


function AnimatedHeroTitle() {
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, margin: "-40px" });
  const ease: [number,number,number,number] = [0.16, 1, 0.3, 1];
  const text1Ref = useRef<HTMLSpanElement>(null);
  const text2Ref = useRef<HTMLSpanElement>(null);
  const words = ["RECOVERY.", "COGNITION.", "THE BRAIN.", "REHABILITATION.", "NEUROPLASTICITY."];
  const MORPH_TIME = 1.0, COOLDOWN_TIME = 2.2;

  useEffect(() => {
    if (!seen) return;
    const startDelay = setTimeout(() => {
      let textIndex = 0, morph = 0, cooldown = COOLDOWN_TIME, lastTime = Date.now(), rafId = 0;
      if (text1Ref.current) text1Ref.current.textContent = words[0];
      if (text2Ref.current) text2Ref.current.textContent = words[1];
      const setMorph = (f: number) => {
        const t1 = text1Ref.current, t2 = text2Ref.current; if (!t1||!t2) return;
        t2.style.filter = `blur(${Math.min(8/f-8,100)}px)`; t2.style.opacity = `${Math.pow(f,.4)*100}%`;
        const inv = 1-f; t1.style.filter = `blur(${Math.min(8/inv-8,100)}px)`; t1.style.opacity = `${Math.pow(inv,.4)*100}%`;
      };
      const tick = () => {
        rafId = requestAnimationFrame(tick);
        const now = Date.now(), dt = (now-lastTime)/1000; lastTime = now; cooldown -= dt;
        if (cooldown <= 0) {
          if (cooldown+dt > 0) { textIndex=(textIndex+1)%words.length; if(text1Ref.current)text1Ref.current.textContent=words[textIndex]; if(text2Ref.current)text2Ref.current.textContent=words[(textIndex+1)%words.length]; }
          morph -= cooldown; cooldown = 0;
          const fraction = Math.min(morph/MORPH_TIME,1);
          if (fraction >= 1) { cooldown=COOLDOWN_TIME; morph=0; if(text1Ref.current){text1Ref.current.style.filter="";text1Ref.current.style.opacity="0%";} if(text2Ref.current){text2Ref.current.style.filter="";text2Ref.current.style.opacity="100%";} }
          else setMorph(fraction);
        } else { if(text1Ref.current){text1Ref.current.style.filter="";text1Ref.current.style.opacity="0%";} if(text2Ref.current){text2Ref.current.style.filter="";text2Ref.current.style.opacity="100%";} }
      };
      rafId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafId);
    }, 1200);
    return () => clearTimeout(startDelay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen]);

  return (
    <div ref={ref} style={{ marginBottom: 32, lineHeight: 0.9, position: "relative" }}>
      <div style={{ overflow: "hidden", display: "block" }}>
        <motion.div className="fB title-line-1" style={{ fontSize: "clamp(2.8rem,6.5vw,7rem)", letterSpacing: ".03em" }}
          initial={{ y: "100%", filter: "blur(18px)", opacity: 0 }}
          animate={seen ? { y: "0%", filter: "blur(0px)", opacity: 1 } : {}}
          transition={{ duration: 1.1, delay: 0.3, ease }}>REWIRING</motion.div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={seen ? { opacity: 1 } : {}} transition={{ duration: 0.5, delay: 0.7 }}
        style={{ position: "relative", height: "clamp(2.8rem,6.5vw,7rem)", display: "flex", alignItems: "flex-end" }}>
        <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden>
          <defs><filter id="hero-gooey"><feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 255 -120" /></filter></defs>
        </svg>
        <div style={{ position: "relative", filter: "url(#hero-gooey)", width: "100%", height: "100%" }}>
          <span ref={text1Ref} className="fB title-line-2" style={{ position: "absolute", left: 0, bottom: 0, fontSize: "clamp(2.8rem,6.5vw,7rem)", letterSpacing: ".03em", lineHeight: 1, whiteSpace: "nowrap", opacity: "0%" }} />
          <span ref={text2Ref} className="fB title-line-2" style={{ position: "absolute", left: 0, bottom: 0, fontSize: "clamp(2.8rem,6.5vw,7rem)", letterSpacing: ".03em", lineHeight: 1, whiteSpace: "nowrap", opacity: "100%" }} />
        </div>
      </motion.div>
    </div>
  );
}

// ══ BlurTextAnimation — cinematic per-word blur-in reveal ═══════════════════
interface BlurWordData {
  text: string;
  duration: number;
  delay: number;
  blur: number;
  scale: number;
}

function BlurTextAnimation({ text = "REDEFINING RECOVERY.", animationDelay = 4200 }: { text?: string; animationDelay?: number }) {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const words = React.useMemo<BlurWordData[]>(() => {
    const split = text.split(" ");
    return split.map((w, i) => {
      const progress = i / split.length;
      return {
        text: w,
        duration: 2.2 + Math.cos(i * 0.3) * 0.3,
        delay: i * 0.06 + Math.pow(progress, 0.8) * 0.5 + (Math.random() - 0.5) * 0.04,
        blur: 12 + Math.floor(Math.random() * 8),
        scale: 0.9 + Math.sin(i * 0.2) * 0.05,
      };
    });
  }, [text]);

  useEffect(() => {
    const start = () => {
      setTimeout(() => setIsAnimating(true), 200);
      const maxT = words.reduce((m, w) => Math.max(m, w.delay + w.duration), 0);
      animRef.current = setTimeout(() => {
        setIsAnimating(false);
        resetRef.current = setTimeout(start, animationDelay);
      }, (maxT + 1) * 1000);
    };
    start();
    return () => {
      if (animRef.current) clearTimeout(animRef.current);
      if (resetRef.current) clearTimeout(resetRef.current);
    };
  }, [words, animationDelay]);

  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
      <p className="fB" style={{ fontSize:"clamp(3rem,8vw,7rem)", letterSpacing:".06em", lineHeight:1.0, textAlign:"center", color:"#fff", margin:0 }}>
        {words.map((word, i) => (
          <span
            key={i}
            style={{
              display:"inline-block",
              marginRight:"0.25em",
              opacity: isAnimating ? 1 : 0,
              filter: isAnimating ? "blur(0px) brightness(1)" : `blur(${word.blur}px) brightness(0.6)`,
              transform: isAnimating ? "translateY(0) scale(1) rotateX(0deg)" : `translateY(20px) scale(${word.scale}) rotateX(-15deg)`,
              transition: `opacity ${word.duration}s cubic-bezier(.25,.46,.45,.94) ${word.delay}s, filter ${word.duration}s cubic-bezier(.25,.46,.45,.94) ${word.delay}s, transform ${word.duration}s cubic-bezier(.25,.46,.45,.94) ${word.delay}s`,
              willChange:"filter,transform,opacity",
              transformStyle:"preserve-3d",
              backfaceVisibility:"hidden",
              textShadow: isAnimating ? "0 0 40px rgba(45,212,191,.4)" : "0 0 40px rgba(255,255,255,.2)",
            }}
          >
            {word.text}
          </span>
        ))}
      </p>
    </div>
  );
}

// ══ CINEMATIC HERO ════════════════════════════════════════════════════════════
function CinematicHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const progRef    = useRef(0);
  const progMV     = useMotionValue(0);          // drives DOM overlays — no React re-render
  const router     = useRouter();
  const [webglOk, setWebglOk] = useState<boolean | null>(null);

  // ── DOM overlay transforms — derived from MotionValue, zero re-renders ──
  const voidOp   = useTransform(progMV, [0, 0.15],         [1, 0]);
  const labelOp  = useTransform(progMV, [0.32, 0.42, 0.50, 0.57], [0, 1, 1, 0]);
  const ifaceOp  = useTransform(progMV, [0.55, 0.69],      [0, 1]);
  const ifaceY   = useTransform(progMV, [0.55, 0.69],      [20, 0]);
  const plungeOp = useTransform(progMV, [0.88, 1.0],       [0, 1]);
  const ifacePE  = useTransform(ifaceOp, v => v > 0.3 ? "auto" : "none");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    let rafId = 0, renderer: any = null, model: any = null;
    let modelBaseScale = 1, scene: any = null, camera: any = null;
    let tealL: any = null, purpL: any = null;
    let particleMat: any = null, dustMat: any = null;
    let isDragging = false, lockedFace = false;
    let rotY = 0, rotX = 0, velY = 0, modelPosX = 0;
    let lastDragX = 0, lastDragY = 0;
    let isVisible = true;

    const cl  = (v: number, a: number, b: number) => Math.max(0, Math.min(1, (v-a)/(b-a)));
    const eo  = (t: number) => 1 - Math.pow(1-t, 3);
    const eio = (t: number) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
    const lp  = (a: number, b: number, t: number) => a + (b-a)*t;

    const init = async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js" as any);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x03060f);
      scene.fog = new THREE.FogExp2(0x050a18, 0.004);
      const W = window.innerWidth, H = window.innerHeight;
      camera = new THREE.PerspectiveCamera(40, W/H, 0.1, 500);
      camera.position.set(0, 0, 100);

      const _ce = console.error; console.error = () => {};
      try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance", failIfMajorPerformanceCaveat: false }); }
      catch(e) { console.error = _ce; setWebglOk(false); return; }
      console.error = _ce;
      if (!renderer) { setWebglOk(false); return; }
      renderer.setSize(W, H); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
      (renderer as any).outputColorSpace = "srgb";
      renderer.toneMapping = (THREE as any).ACESFilmicToneMapping; renderer.toneMappingExposure = 1.4;

      // Premium star field — two layers: deep background + mid-ground dust
      // Layer 1: distant stars — tiny, dense, spread wide
      const N1 = 600;
      const p1Pos = new Float32Array(N1*3), p1Col = new Float32Array(N1*3), p1Sz = new Float32Array(N1);
      for (let i = 0; i < N1; i++) {
        const th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
        const r = 40 + Math.random()*80;
        p1Pos[i*3]=r*Math.sin(ph)*Math.cos(th); p1Pos[i*3+1]=r*Math.sin(ph)*Math.sin(th)*.5; p1Pos[i*3+2]=-10-Math.random()*60;
        const t=Math.random();
        if(t<.6){p1Col[i*3]=0.82;p1Col[i*3+1]=0.90;p1Col[i*3+2]=1.0;}       // cool white-blue
        else if(t<.8){p1Col[i*3]=0.62;p1Col[i*3+1]=0.95;p1Col[i*3+2]=0.95;} // teal hint
        else{p1Col[i*3]=0.75;p1Col[i*3+1]=0.72;p1Col[i*3+2]=0.98;}           // lavender
        p1Sz[i] = Math.random()*0.5+0.15;
      }
      const g1 = new THREE.BufferGeometry();
      g1.setAttribute("position",new THREE.BufferAttribute(p1Pos,3));
      g1.setAttribute("aColor",new THREE.BufferAttribute(p1Col,3));
      g1.setAttribute("aSize",new THREE.BufferAttribute(p1Sz,1));
      particleMat = new THREE.ShaderMaterial({ uniforms:{time:{value:0}},
        vertexShader:`attribute float aSize;attribute vec3 aColor;varying vec3 vCol;varying float vBright;uniform float time;void main(){vCol=aColor;float twinkle=0.72+0.28*sin(time*0.8+position.x*0.3+position.z*0.2);vBright=twinkle;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=aSize*(220./-mv.z)*twinkle;gl_Position=projectionMatrix*mv;}`,
        fragmentShader:`varying vec3 vCol;varying float vBright;void main(){vec2 uv=gl_PointCoord-0.5;float d=length(uv);if(d>0.5)discard;float core=1.-smoothstep(0.,0.18,d);float glow=1.-smoothstep(0.18,0.5,d);float a=(core*0.9+glow*0.3)*vBright;gl_FragColor=vec4(vCol*mix(0.8,1.2,core),a);}`,
        transparent:true, blending:THREE.AdditiveBlending, depthWrite:false });
      scene.add(new THREE.Points(g1, particleMat));

      // Layer 2: mid-ground nebula dust — soft, large, few, atmospheric
      const N2 = 80;
      const p2Pos = new Float32Array(N2*3), p2Col = new Float32Array(N2*3), p2Sz = new Float32Array(N2);
      for(let i=0;i<N2;i++){
        const angle=Math.random()*Math.PI*2, r=15+Math.random()*30, d=-5-Math.random()*25;
        p2Pos[i*3]=Math.cos(angle)*r; p2Pos[i*3+1]=(Math.random()-.5)*r*.4; p2Pos[i*3+2]=d;
        const t=Math.random();
        if(t<.45){p2Col[i*3]=0.17;p2Col[i*3+1]=0.83;p2Col[i*3+2]=0.75;}  // teal
        else if(t<.75){p2Col[i*3]=0.65;p2Col[i*3+1]=0.54;p2Col[i*3+2]=0.98;} // purple
        else{p2Col[i*3]=0.4;p2Col[i*3+1]=0.7;p2Col[i*3+2]=1.0;}  // blue
        p2Sz[i]=1.5+Math.random()*2.5;
      }
      const g2=new THREE.BufferGeometry();
      g2.setAttribute("position",new THREE.BufferAttribute(p2Pos,3));
      g2.setAttribute("aColor",new THREE.BufferAttribute(p2Col,3));
      g2.setAttribute("aSize",new THREE.BufferAttribute(p2Sz,1));
      dustMat=new THREE.ShaderMaterial({ uniforms:{time:{value:0}},
        vertexShader:`attribute float aSize;attribute vec3 aColor;varying vec3 vCol;uniform float time;void main(){vCol=aColor;vec3 p=position;p.x+=sin(time*0.15+position.z*0.05)*0.8;p.y+=cos(time*0.12+position.x*0.04)*0.5;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=aSize*(340./-mv.z);gl_Position=projectionMatrix*mv;}`,
        fragmentShader:`varying vec3 vCol;void main(){float d=length(gl_PointCoord-.5);if(d>0.5)discard;float a=(1.-smoothstep(0.0,0.5,d))*0.22;gl_FragColor=vec4(vCol,a);}`,
        transparent:true, blending:THREE.AdditiveBlending, depthWrite:false });
      scene.add(new THREE.Points(g2, dustMat));

      // Lights
      scene.add(new THREE.AmbientLight(0xd4eeff, 3.5));
      const key = new THREE.DirectionalLight(0xffffff, 6.0); key.position.set(3,7,7); scene.add(key);
      const fill = new THREE.DirectionalLight(0xa8d8ff, 3.0); fill.position.set(-5,2,5); scene.add(fill);
      tealL = new THREE.PointLight(0x2DD4BF, 5.0, 28); tealL.position.set(-3,1,-2); scene.add(tealL);
      purpL = new THREE.PointLight(0xa78bfa, 3.2, 22); purpL.position.set(4,-1,-2); scene.add(purpL);

      // GLB
      const cv = canvas as HTMLElement;
      const loader = new (GLTFLoader as any)(); loader.setPath("/images/");
      loader.load("revivex_3d.glb", (gltf: any) => {
        model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model), center = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
        const s = 2.8/Math.max(size.x,size.y,size.z); modelBaseScale = s;
        const off = center.multiplyScalar(-s); model.position.set(off.x, off.y+.2, off.z); model.scale.setScalar(modelBaseScale);
        model.traverse((child: any)=>{ if(child.isMesh&&child.material){child.material.envMapIntensity=2.5;child.material.needsUpdate=true;} });
        rotY=-0.65; rotX=0.12; model.rotation.set(rotX,rotY,0); scene.add(model); cv.style.cursor="grab";
      }, undefined, (e: any)=>console.warn("GLB:",e));

      // Drag
      const onPD = (e: PointerEvent) => { isDragging=true; lastDragX=e.clientX; lastDragY=e.clientY; velY=0; cv.setPointerCapture(e.pointerId); cv.style.cursor="grabbing"; e.stopPropagation(); };
      const onPM = (e: PointerEvent) => { if(!isDragging)return; const dx=e.clientX-lastDragX,dy=e.clientY-lastDragY; const dr=dx*.009,dp=dy*.007; rotY-=dr; velY=velY*.6-dr*.4; rotX=Math.max(-0.55,Math.min(0.55,rotX+dp)); lastDragX=e.clientX; lastDragY=e.clientY; if(model){model.rotation.y=rotY;model.rotation.x=rotX;} };
      const onPU = () => { isDragging=false; cv.style.cursor="grab"; };
      cv.addEventListener("pointerdown",onPD); cv.addEventListener("pointermove",onPM); cv.addEventListener("pointerup",onPU); cv.addEventListener("pointerleave",onPU);

      // Scroll — updates progRef AND MotionValue. progRef drives Three.js camera (sync).
      // progMV drives DOM overlays via useTransform (no re-renders).
      const section = sectionRef.current!;
      const updateProg = () => {
        const rect = section.getBoundingClientRect();
        const next = Math.min(1, Math.max(0, -rect.top / Math.max(1, section.offsetHeight - window.innerHeight)));
        if (Math.abs(next - progRef.current) > 0.0003) {
          progRef.current = next;
          progMV.set(next);  // ← updates Framer Motion transforms, NOT React state
        }
      };
      // Subscribe to Lenis directly (no window event flood)
      const lenisUnsub = () => { _lenisCallbacks.delete(lenisHandler); };
      const lenisHandler = () => updateProg();
      _lenisCallbacks.add(lenisHandler);
      // Fallback for native scroll (before Lenis loads)
      window.addEventListener("scroll", updateProg, { passive: true });
      updateProg();

      const onResize = () => { const w=window.innerWidth,h=window.innerHeight; camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h); };
      window.addEventListener("resize",onResize);

      // Visibility — pause RAF when section is not in viewport
      const visObs = new IntersectionObserver(e => { isVisible = e[0].isIntersecting; }, { rootMargin: "50px" });
      visObs.observe(section);

      // RAF — zero React state updates here
      let firstFrame = true;
      const draw = () => {
        rafId = requestAnimationFrame(draw);
        if (!isVisible || document.hidden) return;   // ← pauses GPU when off-screen
        const t = Date.now()*.001, p = progRef.current;
        if(particleMat?.uniforms) particleMat.uniforms.time.value = t;
        if(dustMat?.uniforms) dustMat.uniforms.time.value = t;
        const zoomP=eo(cl(p,0,.55)), cameraZ=lp(100,4.0,zoomP), slideP=eio(cl(p,.52,.74));
        const exitSlide=eo(cl(p,.82,1.0));  // 0→1 as device exits
        const cameraX=lp(0,-2.6,slideP), cameraY=lp(0,.2,zoomP);
        // No plunge dive — camera holds position, model slides right off screen
        camera.position.set(cameraX, cameraY, cameraZ);
        camera.lookAt(cameraX*.3,.2,0);
        if(tealL) tealL.intensity=5.0+Math.sin(t*1.3)*.9;
        if(purpL) purpL.intensity=3.2+Math.sin(t*.9+1)*.6;
        if(model){
          // ── X position: slide right during reveal, then SHOOT RIGHT on exit ──
          const revealX  = lp(0, 0.9, slideP);          // gentle right offset during reveal
          const lerpRate = revealX < modelPosX ? 0.028 : 0.032;
          modelPosX += (revealX - modelPosX) * lerpRate;
          model.position.x = modelPosX;
          // Fade out smoothly instead of shooting off screen
          model.traverse((ch: any)=>{ if(ch.isMesh&&ch.material){ ch.material.opacity = Math.max(0, 1 - exitSlide * 3.5); ch.material.transparent = true; } });

          const faceP   = cl(p, .48, .66);
          const exitP   = exitSlide;             // alias for rotation damping

          if (!isDragging) {
            // Auto-spin only before face-lock, scales to zero before plunge
            const autoSpin = 0.002 * Math.max(0, 1 - faceP * 2) * (1 - exitP);
            rotY += autoSpin;

            // Gentle face-forward pull
            if (faceP > 0) {
              rotY += (0 - rotY) * Math.min(faceP * 0.008, 0.04);
              rotX += (0 - rotX) * Math.min(faceP * 0.006, 0.03);
            }

            // Hard-clamp velocity — prevents crazy spin
            velY = Math.max(-0.04, Math.min(0.04, velY));

            // During exit: kill inertia so no wild spinning on the way out
            const inertiaDamp = 1 - exitP * 0.95;
            velY *= 0.94 * inertiaDamp;
            rotY += velY;

            // Hard-clamp total rotation so it can never go crazy
            rotY = Math.max(-Math.PI * 0.9, Math.min(Math.PI * 0.9, rotY));

            // Exit: snap rotation forward quickly
            if (exitP > 0) {
              rotY += (0 - rotY) * exitP * 0.10;
              rotX += (0 - rotX) * exitP * 0.10;
            }
          }

          if(faceP >= .97 && !lockedFace){ lockedFace=true; cv.style.cursor="grab"; }
          model.rotation.y = rotY;
          model.rotation.x = rotX;
        }
        try { renderer.render(scene,camera); if(firstFrame){firstFrame=false;setWebglOk(true);} }
        catch(e) { setWebglOk(false); cancelAnimationFrame(rafId); }
      };
      draw();

      return () => {
        visObs.disconnect();
        lenisUnsub();
        window.removeEventListener("scroll",updateProg);
        window.removeEventListener("resize",onResize);
        cv.removeEventListener("pointerdown",onPD); cv.removeEventListener("pointermove",onPM);
        cv.removeEventListener("pointerup",onPU); cv.removeEventListener("pointerleave",onPU);
      };
    };

    let cleanupFn: (() => void) | undefined;
    init().then(fn=>{cleanupFn=fn;});
    return () => { cancelAnimationFrame(rafId); cleanupFn?.(); if(renderer) renderer.dispose(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const absC: React.CSSProperties = { position:"absolute",inset:0,pointerEvents:"none",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" };

  if (webglOk === false) {
    return (
      <section style={{ minHeight:"100vh", background:"#080f1a", position:"relative", overflow:"hidden", display:"flex", alignItems:"center" }}>
        <div className="grid-dk" style={{ position:"absolute",inset:0,opacity:0.4,pointerEvents:"none" }} />
        <div style={{ position:"absolute",top:"20%",right:"10%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(45,212,191,.10),transparent 65%)",pointerEvents:"none" }} />
        <div style={{ maxWidth:1280,margin:"0 auto",padding:"100px 40px",display:"grid",gridTemplateColumns:"55% 45%",gap:40,alignItems:"center",width:"100%",position:"relative",zIndex:2 }}>
          <div style={{ display:"flex",flexDirection:"column" }}>
            <div className="fM" style={{ fontSize:8,color:"rgba(45,212,191,.55)",textTransform:"uppercase",letterSpacing:".22em",marginBottom:24,display:"flex",alignItems:"center",gap:10 }}>
              <Heart size={10} style={{ color:"#2DD4BF" }} className="heartbeat" /> Democratizing Neuro-Rehabilitation · SDGP CS-09
            </div>
            <div style={{ overflow:"hidden",maxWidth:"100%" }}><AnimatedHeroTitle /></div>
            <p className="fS" style={{ fontSize:15,color:"rgba(255,255,255,.62)",maxWidth:400,lineHeight:1.76,fontWeight:300,marginBottom:36 }}>
              Clinical rehabilitation powered by immersive computing. We transform static routines into <span style={{ color:"rgba(255,255,255,.90)",fontWeight:500 }}>engaging digital experiences</span>.
            </p>
            <div style={{ display:"flex",gap:12 }}>
              <button onClick={()=>router.push("/auth/patient/signin")} className="fB sweep-btn sweep-teal">
                <span className="sweep-bar" style={{ background:"rgba(45,212,191,.6)", boxShadow:"0 0 10px 10px rgba(45,212,191,.25)" }} />
                <Play size={13} style={{ fill:"#2DD4BF", flexShrink:0, position:"relative", zIndex:1 }} />
                <span style={{ position:"relative", zIndex:1 }}>Patient Sign In</span>
              </button>
              <button onClick={()=>router.push("/auth/doctor/signin")} className="fB sweep-btn sweep-slate">
                <span className="sweep-bar" style={{ background:"rgba(255,255,255,.35)", boxShadow:"0 0 10px 10px rgba(255,255,255,.10)" }} />
                <Stethoscope size={13} style={{ flexShrink:0, position:"relative", zIndex:1 }} />
                <span style={{ position:"relative", zIndex:1 }}>Doctor Sign In</span>
              </button>
            </div>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
            {[{label:"ESP32 Microcontroller",sub:"BLE 5.0 · Real-time",c:"#2DD4BF"},{label:"MPX5010DP Pressure",sub:"Medical-grade grip",c:"#a78bfa"},{label:"MPU-6050 Gyroscope",sub:"6-axis tremor detect",c:"#34d399"}].map(s=>(
              <div key={s.label} style={{ padding:"16px 20px",borderRadius:12,background:`linear-gradient(135deg,${s.c}08,rgba(8,14,26,.96))`,border:`1px solid ${s.c}22` }}>
                <div className="fM" style={{ fontSize:8,color:s.c,textTransform:"uppercase",letterSpacing:".14em",marginBottom:3 }}>{s.label}</div>
                <div className="fS" style={{ fontSize:12,color:"rgba(255,255,255,.42)",fontWeight:300 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div ref={sectionRef} style={{ height:"260vh",position:"relative" }}>
      <div style={{ position:"sticky",top:0,height:"100vh",overflow:"hidden" }}>
        <canvas ref={canvasRef} style={{ position:"absolute",inset:0,width:"100%",height:"100%",display:"block",zIndex:0 }} />
        <AtmosphericLayer />
        <div style={{ position:"absolute",inset:0,zIndex:1,pointerEvents:"none",background:"linear-gradient(90deg,rgba(4,6,15,.94) 0%,rgba(4,6,15,.82) 36%,rgba(4,6,15,.18) 50%,transparent 58%)" }} />

        {/* VOID — opacity driven by MotionValue, no React re-render */}
        <motion.div style={{ ...absC, zIndex:10, opacity:voidOp }}>
          {([{top:28,left:28,borderTop:"1px solid rgba(45,212,191,.28)",borderLeft:"1px solid rgba(45,212,191,.28)"},{top:28,right:28,borderTop:"1px solid rgba(45,212,191,.28)",borderRight:"1px solid rgba(45,212,191,.28)"},{bottom:28,left:28,borderBottom:"1px solid rgba(45,212,191,.28)",borderLeft:"1px solid rgba(45,212,191,.28)"},{bottom:28,right:28,borderBottom:"1px solid rgba(45,212,191,.28)",borderRight:"1px solid rgba(45,212,191,.28)"}] as React.CSSProperties[]).map((s,i)=>(
            <div key={i} style={{ position:"absolute",width:24,height:24,pointerEvents:"none",...s }} />
          ))}
          <div className="fM" style={{ fontSize:"clamp(.44rem,.82vw,.70rem)",color:"rgba(45,212,191,.45)",textTransform:"uppercase",letterSpacing:".55em",marginBottom:28,textAlign:"center",display:"flex",alignItems:"center",gap:12,justifyContent:"center" }}>
            <span style={{ width:22,height:1,background:"rgba(45,212,191,.35)",display:"inline-block" }} /> REVIVEX PLATFORM v1.2 <span style={{ width:22,height:1,background:"rgba(45,212,191,.35)",display:"inline-block" }} />
          </div>
          <BlurTextAnimation text="REDEFINING RECOVERY." />
          <div style={{ width:"clamp(120px,18vw,200px)",height:1,background:"linear-gradient(90deg,transparent,rgba(45,212,191,.45),transparent)",margin:"22px auto" }} />
          <div className="fM" style={{ fontSize:"clamp(.38rem,.72vw,.60rem)",color:"rgba(45,212,191,.40)",textTransform:"uppercase",letterSpacing:".52em",textAlign:"center" }}>Scroll to explore</div>
          <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none" }}>
            <div className="ring-pop" style={{ width:260,height:260,borderRadius:"50%",border:"1px solid rgba(45,212,191,.14)" }} />
            <div className="ring-pop" style={{ width:260,height:260,borderRadius:"50%",border:"1px solid rgba(167,139,250,.09)",animationDelay:"1.4s" }} />
          </div>
          <motion.div animate={{ y:[0,8,0] }} transition={{ repeat:Infinity,duration:2.2,ease:"easeInOut" }} style={{ position:"absolute",bottom:32,color:"rgba(255,255,255,.13)" }}>
            <ChevronDown size={18} />
          </motion.div>
        </motion.div>

        {/* HARDWARE LABEL */}
        <motion.div style={{ ...absC, justifyContent:"flex-end", paddingBottom:44, zIndex:10, opacity:labelOp }}>
          <div className="fS" style={{ fontSize:9,fontWeight:600,color:"rgba(45,212,191,.55)",textTransform:"uppercase",letterSpacing:".20em",textAlign:"center" }}>ESP32 · MPX5010DP · MPU6050 · BLE 5.0</div>
          <div className="fM" style={{ fontSize:8,color:"rgba(255,255,255,.18)",letterSpacing:".10em",marginTop:4,textAlign:"center" }}>ReViveX Hardware Rev 1.2</div>
        </motion.div>

        {/* INTERFACE — motion.div so opacity/transform are GPU-composited */}
        <motion.div style={{ position:"absolute",inset:0,zIndex:20,display:"grid",gridTemplateColumns:"50% 50%",alignItems:"center",opacity:ifaceOp,y:ifaceY,pointerEvents:"none" }}>
          <motion.div style={{ padding:"0 4% 0 6%",display:"flex",flexDirection:"column",pointerEvents:ifacePE }}>
            <div className="fM" style={{ fontSize:8,textTransform:"uppercase",letterSpacing:".24em",color:"rgba(255,255,255,.45)",marginBottom:24,display:"flex",alignItems:"center",gap:10,padding:"6px 16px",borderRadius:99,width:"fit-content",background:"linear-gradient(135deg,rgba(45,212,191,.06),rgba(8,15,26,.8))",border:"1px solid rgba(45,212,191,.16)" }}>
              <Heart size={10} style={{ color:"#2DD4BF" }} className="heartbeat" /> Democratizing Neuro-Rehabilitation · SDGP CS-09
            </div>
            <div style={{ overflow:"hidden",maxWidth:"100%" }}><AnimatedHeroTitle /></div>
            <p className="fS" style={{ fontSize:15,color:"rgba(255,255,255,.62)",maxWidth:400,marginBottom:40,lineHeight:1.76,fontWeight:300 }}>
              Clinical rehabilitation powered by immersive computing. We transform static routines into{" "}
              <span style={{ color:"rgba(255,255,255,.85)",fontWeight:500 }}>engaging digital experiences</span>.
            </p>
            <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
              <button onClick={()=>router.push("/auth/patient/signin")} className="fB sweep-btn sweep-teal">
                <span className="sweep-bar" style={{ background:"rgba(45,212,191,.6)", boxShadow:"0 0 10px 10px rgba(45,212,191,.25)" }} />
                <Play size={14} style={{ fill:"#2DD4BF", flexShrink:0, position:"relative", zIndex:1 }} />
                <span style={{ position:"relative", zIndex:1 }}>Patient Sign In</span>
              </button>
              <button onClick={()=>router.push("/auth/doctor/signin")} className="fB sweep-btn sweep-slate">
                <span className="sweep-bar" style={{ background:"rgba(255,255,255,.35)", boxShadow:"0 0 10px 10px rgba(255,255,255,.10)" }} />
                <Stethoscope size={14} style={{ flexShrink:0, position:"relative", zIndex:1 }} />
                <span style={{ position:"relative", zIndex:1 }}>Doctor Sign In</span>
                <ArrowRight size={11} style={{ opacity:.4, position:"relative", zIndex:1 }} />
              </button>
            </div>
            <div style={{ marginTop:16 }}>
              <a href="/auth/patient/signup" data-mag className="fS" style={{ fontSize:11,color:"rgba(45,212,191,.55)",textDecoration:"none",letterSpacing:".04em",transition:"color .25s" }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color="#2DD4BF"}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color="rgba(45,212,191,.55)"}>New? Sign up →</a>
            </div>
          </motion.div>
          <div style={{ position:"relative",height:"100%",pointerEvents:"none" }}>
            {[{t:"GRIP SENSOR",s:"MPX5010DP",x:"5%",y:"16%",c:"#2DD4BF"},{t:"GYROSCOPE",s:"MPU-6050",x:"6%",y:"74%",c:"#a78bfa"},{t:"MICROCONTROLLER",s:"ESP32",x:"65%",y:"22%",c:"#34d399"}].map(tag=>(
              <div key={tag.t} style={{ position:"absolute",left:tag.x,top:tag.y,padding:"6px 14px",borderRadius:10,background:"linear-gradient(135deg,rgba(6,12,24,.95),rgba(4,8,18,.98))",border:`1px solid ${tag.c}30`,backdropFilter:"blur(20px)" }}>
                <div className="fM" style={{ fontSize:7,color:tag.c,textTransform:"uppercase",letterSpacing:".18em" }}>{tag.t}</div>
                <div className="fM" style={{ fontSize:7,color:"rgba(255,255,255,.28)",letterSpacing:".08em",marginTop:1 }}>{tag.s}</div>
              </div>
            ))}
            <div style={{ position:"absolute",bottom:"10%",left:"50%",transform:"translateX(-50%)",fontFamily:"Plus Jakarta Sans,sans-serif",fontSize:9,color:"rgba(45,212,191,.30)",letterSpacing:".12em",whiteSpace:"nowrap" }}>← drag to inspect →</div>
          </div>
        </motion.div>

        {/* Plunge fade */}
        <motion.div style={{ position:"absolute",inset:0,zIndex:40,background:"#080f1a",opacity:plungeOp,pointerEvents:"none" }} />
      </div>
    </div>
  );
}

// ══ STAT PARTICLE SCATTER — 28% explodes all at once ════════════════════════
function StatParticleScatter({ scatterP }: { scatterP: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const rafRef = useRef(0);
  const lastP = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const parent = canvas.parentElement!;
    const W = parent.offsetWidth || window.innerWidth;
    const H = parent.offsetHeight || window.innerHeight;
    canvas.width = W; canvas.height = H;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";

    const off = document.createElement("canvas");
    off.width = W; off.height = H;
    const ctx2 = off.getContext("2d")!;
    const fs = Math.min(H * 0.75, W * 0.35);
    ctx2.font = `900 ${fs}px 'Bebas Neue','Arial Black',sans-serif`;
    ctx2.fillStyle = "#ef4444";
    ctx2.textAlign = "center";
    ctx2.textBaseline = "middle";
    ctx2.fillText("28%", W / 2, H / 2);
    const img = ctx2.getImageData(0, 0, W, H).data;
    const pts: {x:number;y:number}[] = [];
    const step = 4;
    for (let y = 0; y < H; y += step)
      for (let x = 0; x < W; x += step)
        if (img[(y * W + x) * 4 + 3] > 60) pts.push({ x, y });

    particlesRef.current = pts.map(p => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 280 + 120;
      return { ox: p.x, oy: p.y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed - Math.random()*60, decay: Math.random()*0.4+0.6, r: Math.random()*2+1 };
    });

    const ctx = canvas.getContext("2d")!;
    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const sp = lastP.current;
      ctx.clearRect(0, 0, W, H);
      if (sp <= 0) return;
      const t = sp;
      // Extra global fade after t>0.65 so no residue bleeds into next section
      const globalFade = t > 0.65 ? Math.max(0, 1 - (t - 0.65) / 0.35) : 1;
      if (globalFade <= 0.01) { ctx.clearRect(0,0,W,H); return; }
      particlesRef.current.forEach(p => {
        const x = p.ox + p.vx * t * 0.45;
        const y = p.oy + p.vy * t * 0.45 + 300 * t * t; // more gravity = fall faster
        const alpha = Math.max(0, 1 - t * p.decay * 1.4) * globalFade;
        if (alpha <= 0) return;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `hsl(${4 + t*20},92%,58%)`;
        ctx.beginPath();
        ctx.arc(x, y, p.r * (1 + t * 1.2), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    return scatterP.on("change", (v: number) => { lastP.current = v; });
  }, [scatterP]);

  return (
    <canvas ref={canvasRef} style={{
      position:"absolute", inset:0, width:"100%", height:"100%",
      pointerEvents:"none", zIndex:5,
    }} />
  );
}


// ══ PULSING SUBTITLE — rhythmic dim animation ═════════════════════════════
function PulsingSubtitle() {
  const [bright, setBright] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setBright(b => !b), 900);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="fB" style={{
      color: bright ? "rgba(255,255,255,.95)" : "rgba(239,68,68,.55)",
      fontSize: "clamp(1.8rem,3.2vw,3rem)",
      textTransform: "uppercase", letterSpacing: ".14em", lineHeight: 1.2,
      textShadow: bright
        ? "0 0 60px rgba(255,255,255,.35), 0 0 120px rgba(239,68,68,.25)"
        : "0 0 40px rgba(239,68,68,.60)",
      transition: "color 0.7s ease, text-shadow 0.7s ease",
    }}>
      Of patients quit<br />physiotherapy at home
    </div>
  );
}

const RoadBridge = React.memo(function RoadBridge() {
  const ref = useRef<HTMLDivElement>(null);
  const p = useMotionValue(0);

  useEffect(() => {
    const el = ref.current; if(!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect(), total = el.offsetHeight-window.innerHeight;
      p.set(Math.min(1,Math.max(0,-rect.top/Math.max(1,total))));
    };
    _lenisCallbacks.add(onScroll);
    window.addEventListener("scroll",onScroll,{passive:true});
    onScroll();
    return () => { window.removeEventListener("scroll",onScroll); _lenisCallbacks.delete(onScroll); };
  }, [p]);

  const t1=0.18, t2=0.40, t3=0.60, t4=0.88;
  const theScale  = useTransform(p,[0,t1],[1,16]);
  const theOp     = useTransform(p,[0,t1],[1,0]);
  const probY     = useTransform(p,[0,t1],[800,0]);
  const probScale = useTransform(p,[t1,t2],[1,11]);
  const probOp    = useTransform(p,[0,t1,t2],[0,1,0]);
  // IS REAL: zooms in from normal → scale up → vanishes (same as THE)
  const realX     = useTransform(p,[t1,t2],[0,0]); // no horizontal movement
  const realScale = useTransform(p,[t1,t2,t3],[0.8,1,11]);
  const realOp    = useTransform(p,[t1,t1+0.04,t2+0.10,t3],[0,1,1,0]);
  // 28%: rises → zoom peak → scatter/fade out at t3+0.06
  const statY     = useTransform(p,[t2,    t3,    t3+0.04],[800,  0,     0   ]);
  const statScale = useTransform(p,[t2,    t3,    t3+0.04, t3+0.10],[0.8, 0.8, 1.10, 2.2]);
  const statOp    = useTransform(p,[t2,    t2+0.04, t3+0.04, t3+0.12],[0,  1,   1,    0   ]);
  // particle scatter progress 0→1
  const scatterP  = useTransform(p,[t3+0.04, t3+0.14],[0, 1]);
  // subtitle fades in after scatter
  const subOp     = useTransform(p,[t3+.12, t3+.22, t4],[0,1,1]);
  const glowOp    = useTransform(p,[t1,t3],[0,0.55]);
  const cardsOp   = useTransform(p,[t3+.05,t3+.14],[0,1]);
  const C: React.CSSProperties = { position:"absolute",inset:0,display:"grid",placeItems:"center",pointerEvents:"none" };

  return (
    <div ref={ref} style={{ height:"340vh",position:"relative",background:"linear-gradient(180deg,#060e1c 0%,#080f1a 15%,#080f1a 85%,#060e1c 100%)" }}>
      <div className="grid-dk" style={{ position:"absolute",inset:0,pointerEvents:"none",opacity:0.40 }} />
      <div style={{ position:"absolute",inset:0,pointerEvents:"none",background:"radial-gradient(ellipse 70% 55% at 50% 50%,rgba(239,68,68,.10) 0%,rgba(120,10,10,.05) 50%,transparent 80%)" }} />
      {([{top:"8vh",left:"4vw",borderTop:"1px solid rgba(239,68,68,.18)",borderLeft:"1px solid rgba(239,68,68,.18)"},{top:"8vh",right:"4vw",borderTop:"1px solid rgba(239,68,68,.18)",borderRight:"1px solid rgba(239,68,68,.18)"},{bottom:"8vh",left:"4vw",borderBottom:"1px solid rgba(239,68,68,.10)",borderLeft:"1px solid rgba(239,68,68,.10)"},{bottom:"8vh",right:"4vw",borderBottom:"1px solid rgba(239,68,68,.10)",borderRight:"1px solid rgba(239,68,68,.10)"}] as React.CSSProperties[]).map((s,i)=>(
        <div key={i} style={{ position:"absolute",width:24,height:24,pointerEvents:"none",...s }} />
      ))}
      <motion.div style={{ position:"absolute",inset:0,zIndex:0,pointerEvents:"none",background:"radial-gradient(ellipse 60% 50% at 50% 50%,rgba(239,68,68,.14),transparent 70%)",opacity:glowOp }} />

      <motion.div style={{ position:"sticky",top:0,height:"100vh",overflow:"hidden" }}>
        <div style={{ ...C,zIndex:2 }}>
          <motion.div style={{ scale:theScale,opacity:theOp,willChange:"transform,opacity" }}>
            <span className="fB" style={{ fontSize:"clamp(4rem,10vw,10rem)",color:"#fff",letterSpacing:"-.02em",display:"block" }}>THE</span>
          </motion.div>
        </div>
        <div style={{ ...C,zIndex:10 }}>
          <motion.div style={{ scale:probScale,opacity:probOp,y:probY,willChange:"transform,opacity" }}>
            <span className="fB" style={{ fontSize:"clamp(5rem,12vw,12rem)",color:"#fff",letterSpacing:"-.03em",display:"block" }}>PROBLEM</span>
          </motion.div>
        </div>
        <div style={{ ...C,zIndex:4 }}>
          <motion.div style={{ scale:realScale,opacity:realOp,willChange:"transform,opacity" }}>
            <span className="fB" style={{ fontSize:"clamp(4rem,10vw,10rem)",color:"#ef4444",letterSpacing:"-.02em",display:"block",textShadow:"0 0 80px rgba(239,68,68,.45)" }}>IS REAL.</span>
          </motion.div>
        </div>
        {/* 28% solid text */}
        <div style={{ ...C,zIndex:3 }}>
          <motion.div style={{ opacity:statOp,scale:statScale,y:statY,willChange:"transform,opacity",textAlign:"center" }}>
            <span className="fB" style={{ fontSize:"clamp(6rem,16vw,16rem)",color:"#ef4444",letterSpacing:"-.03em",display:"block",textShadow:"0 0 120px rgba(239,68,68,.55)" }}>28%</span>
          </motion.div>
        </div>
        {/* Particle scatter canvas */}
        <StatParticleScatter scatterP={scatterP} />
        {/* Subtitle — pulses in and out rhythmically */}
        <motion.div style={{ position:"absolute",inset:0,zIndex:6,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",opacity:subOp,pointerEvents:"none" }}>
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:16 }}>
            <div style={{ width:80,height:1,background:"linear-gradient(90deg,transparent,rgba(239,68,68,.65),transparent)" }} />
            <PulsingSubtitle />
            <div style={{ width:80,height:1,background:"linear-gradient(90deg,transparent,rgba(239,68,68,.65),transparent)" }} />
          </div>
        </motion.div>
        <motion.div style={{ position:"absolute",inset:0,opacity:cardsOp,pointerEvents:"none",zIndex:4 }}>
          {[{v:"80%",l:"Drop-out rate",x:-38,y:-24},{v:"$50K+",l:"Robotic cost",x:38,y:-22},{v:"6–12m",l:"Recovery time",x:-38,y:30},{v:"3 wks",l:"Before they quit",x:38,y:28}].map(s=>(
            <div key={s.v} style={{ position:"absolute",left:`calc(50% + ${s.x}vw)`,top:`calc(50% + ${s.y}vh)`,transform:"translate(-50%,-50%)" }}>
              <div style={{ textAlign:"center",padding:"14px 22px",borderRadius:16,background:"linear-gradient(145deg,rgba(18,4,4,.96),rgba(12,2,2,.98))",border:"1px solid rgba(239,68,68,.22)" }}>
                <div className="fB" style={{ fontSize:"2.2rem",color:"#ef4444" }}>{s.v}</div>
                <div className="fS" style={{ fontSize:11,color:"rgba(255,255,255,.45)",textTransform:"uppercase",letterSpacing:".12em",marginTop:5 }}>{s.l}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
});


function ProblemSection() {

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
          <VaporizeTextCycle
            texts={["RECOVERY IS BROKEN.", "THE SYSTEM FAILS.", "WE REWIRE IT."]}
            fontSize={96}
            color="#ef4444"
            fontFamily="'Syne',sans-serif"
            style={{ minHeight: "180px" }}
          />
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

            { t: "No Motivation", c: "#ef4444", b: "Repetitive motions without feedback limit progress. We replace passive routines with active cognitive engagement." },

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

}


//  DARK BRIDGE 

// ══ NEURAL BRIDGE — GLSLHills Pure Shader ══════════════════════════════════
function NeuralBridge() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const progRef      = useRef(0);
  const [prog, setProg] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const container = containerRef.current;
    const canvas    = canvasRef.current;
    if (!container || !canvas || typeof window === "undefined") return;

    let rafId = 0, renderer: any = null;
    const stInstances: any[] = [];
    const smoothPos = { x: 0, y: 8, z: 60 };

    const init = async () => {
      const THREE = await import("three");
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (!isMounted || !canvasRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const scene: any = new THREE.Scene();
      scene.background = new THREE.Color(0x080f1a);
      scene.fog = new THREE.FogExp2(0x080f1a, 0.0095);

      const W = window.innerWidth, H = window.innerHeight;
      const camera: any = new THREE.PerspectiveCamera(65, W / H, 0.1, 800);
      camera.position.set(0, 8, 60);
      camera.lookAt(0, 2, 0);

      const _ce = console.error; console.error = () => {};
      try {
        renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current as HTMLCanvasElement,
          antialias: true, alpha: false,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
        });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
        renderer.setClearColor(0x080f1a, 1);
        renderer.toneMapping = (THREE as any).ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.70;
      } catch (e) { console.error = _ce; return; }
      console.error = _ce;
      if (!renderer || !isMounted) return;

      // ── GLSL HILLS — Perlin-displaced wireframe terrain ──────────────────
      // Single PlaneGeometry + RawShaderMaterial with noise vertex displacement.
      // Teal (#2DD4BF) lines on deep navy — glowing wireframe ocean of data.
      const hillsVS = `
        precision mediump float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 projectionMatrix;
        uniform mat4 modelViewMatrix;
        uniform float uTime;
        uniform float uAmp;
        varying float vElev;
        varying vec2  vUv;

        // Classic 2D Perlin noise
        vec2 fade(vec2 t){ return t*t*t*(t*(t*6.0-15.0)+10.0); }
        vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
        float cnoise(vec2 P){
          vec4 Pi = floor(P.xyxy)+vec4(0.0,0.0,1.0,1.0);
          vec4 Pf = fract(P.xyxy)-vec4(0.0,0.0,1.0,1.0);
          Pi = mod(Pi,289.0);
          vec4 ix=Pi.xzxz, iy=Pi.yyww;
          vec4 fx=Pf.xzxz, fy=Pf.yyww;
          vec4 i=permute(permute(ix)+iy);
          vec4 gx=2.0*fract(i*0.0243902439)-1.0;
          vec4 gy=abs(gx)-0.5;
          vec4 tx=floor(gx+0.5);
          gx=gx-tx;
          vec2 g00=vec2(gx.x,gy.x), g10=vec2(gx.y,gy.y);
          vec2 g01=vec2(gx.z,gy.z), g11=vec2(gx.w,gy.w);
          vec4 norm=1.79284291400159-0.85373472095314*
            vec4(dot(g00,g00),dot(g01,g01),dot(g10,g10),dot(g11,g11));
          g00*=norm.x; g01*=norm.y; g10*=norm.z; g11*=norm.w;
          float n00=dot(g00,vec2(fx.x,fy.x));
          float n10=dot(g10,vec2(fx.y,fy.y));
          float n01=dot(g01,vec2(fx.z,fy.z));
          float n11=dot(g11,vec2(fx.w,fy.w));
          vec2 fade_xy=fade(Pf.xy);
          vec2 n_x=mix(vec2(n00,n01),vec2(n10,n11),fade_xy.x);
          return 2.3*mix(n_x.x,n_x.y,fade_xy.y);
        }

        void main(){
          vUv = uv;
          vec3 p = position;
          float n  = cnoise(p.xz * 0.18 + uTime * 0.12);
          float n2 = cnoise(p.xz * 0.38 + uTime * 0.08 + 3.7);
          float elev = n * uAmp + n2 * uAmp * 0.40;
          p.y += elev;
          vElev = elev;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`;

      const hillsFS = `
        precision mediump float;
        uniform float uTime;
        uniform float uAmp;
        varying float vElev;
        varying vec2  vUv;
        void main(){
          // Normalise elevation to 0–1
          float t = clamp((vElev / uAmp) * 0.5 + 0.5, 0.0, 1.0);
          // Teal core → brighter ice-teal at peaks
          vec3 low  = vec3(0.01, 0.07, 0.10);   // near-black shadow
          vec3 mid  = vec3(0.05, 0.28, 0.28);   // dark teal
          vec3 high = vec3(0.12, 0.55, 0.52);   // muted teal peak
          vec3 col  = t < 0.5 ? mix(low, mid, t*2.0) : mix(mid, high, (t-0.5)*2.0);
          // Fog via vUv distance from centre (perspective fog approximation)
          float dist = length(vUv - 0.5) * 2.0;
          float fog  = clamp(1.0 - dist * dist * 0.9, 0.0, 1.0);
          float a    = (0.08 + t * 0.14) * fog;
          gl_FragColor = vec4(col, a);
        }`;

      const hillsMat: any = new THREE.RawShaderMaterial({
        uniforms: { uTime:{value:0}, uAmp:{value:4.2} },
        vertexShader:   hillsVS,
        fragmentShader: hillsFS,
        wireframe: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      // 256×256 plane — enough resolution for smooth hills without being heavy
      const hillsGeo: any = new THREE.PlaneGeometry(220, 220, 160, 160);
      hillsGeo.rotateX(-Math.PI / 2);
      const hills: any = new THREE.Mesh(hillsGeo, hillsMat);
      hills.position.set(0, -4, -20);
      scene.add(hills);

      // Second, slightly larger plane further back for infinite-horizon illusion
      const hillsGeo2: any = new THREE.PlaneGeometry(380, 380, 100, 100);
      hillsGeo2.rotateX(-Math.PI / 2);
      const hills2: any = new THREE.Mesh(hillsGeo2, hillsMat);
      hills2.position.set(0, -6, -130);
      scene.add(hills2);

      // ── DATA DUST — sparse teal floating points above terrain ─────────────
      const dustN = 600;
      const dustPos = new Float32Array(dustN * 3);
      for (let i = 0; i < dustN; i++) {
        dustPos[i*3]   = (Math.random() - 0.5) * 180;
        dustPos[i*3+1] = Math.random() * 18 + 1;
        dustPos[i*3+2] = (Math.random() - 0.5) * 180 - 20;
      }
      const dustGeo: any = new THREE.BufferGeometry();
      dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
      const dustMat: any = new THREE.PointsMaterial({
        color: 0x2dd4bf, size: 0.40, transparent: true, opacity: 0.22,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
      });
      scene.add(new THREE.Points(dustGeo, dustMat));

      // ── CAMERA KEYFRAMES ──────────────────────────────────────────────────
      // Phase 0 (p=0):     horizon-level, looking out over hills
      // Phase 1 (p=0.5):   flying forward + slight rise, skimming peaks
      // Phase 2 (p=1.0):   final resting — slightly elevated, looking down
      //                     at infinite grid — frames the right HUD perfectly
      const camKeys = [
        { x:  0, y:  8, z: 60,  lx:  0, ly: 2, lz: -60 },
        { x: -6, y: 14, z: 10,  lx:  2, ly: 5, lz: -80 },
        { x:  4, y: 20, z:-40,  lx:  0, ly: 4, lz:-160 },
      ];
      let tgtX=0, tgtY=8, tgtZ=60, tgtLX=0, tgtLY=2, tgtLZ=-60;
      const lookSmooth = { x:0, y:2, z:-60 };
      let scrollVel = 0;

      // ── SCROLL TRIGGER ────────────────────────────────────────────────────
      const st = ScrollTrigger.create({
        trigger: container, start:"top top", end:"bottom bottom", scrub:0,
        onUpdate:(self: any) => {
          if (!isMounted) return;
          const p = self.progress;
          progRef.current = p;
          scrollVel = self.getVelocity() * 0.0015;
          // Blend across 3 keyframes
          const seg = Math.min(Math.floor(p * 2), 1);
          const sp  = (p * 2) % 1;
          const kA = camKeys[seg], kB = camKeys[Math.min(seg+1,2)];
          const bl = (a: number, b: number) => a + (b-a)*sp;
          tgtX=bl(kA.x,kB.x); tgtY=bl(kA.y,kB.y); tgtZ=bl(kA.z,kB.z);
          tgtLX=bl(kA.lx,kB.lx); tgtLY=bl(kA.ly,kB.ly); tgtLZ=bl(kA.lz,kB.lz);
          if (isMounted) setProg(Math.round(p*100)/100);
        },
      });
      stInstances.push(st);

      const onResize = () => {
        if (!renderer) return;
        const w=window.innerWidth,h=window.innerHeight;
        camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h);
      };
      window.addEventListener("resize", onResize);

      // Pause GPU when section is off-screen
      let nbVisible = true;
      const visObs = new IntersectionObserver(([e]) => { nbVisible = e.isIntersecting; },{ rootMargin:"120px" });
      visObs.observe(container);

      const lp = (a: number, b: number, t: number) => a + (b-a)*t;
      const SMOOTH = 0.052;

      // ── RAF ───────────────────────────────────────────────────────────────
      const draw = () => {
        if (!isMounted) return;
        rafId = requestAnimationFrame(draw);
        if (document.hidden || !nbVisible) return;

        const t = Date.now() * 0.001;
        hillsMat.uniforms.uTime.value = t;

        // Smooth camera
        smoothPos.x = lp(smoothPos.x, tgtX, SMOOTH);
        smoothPos.y = lp(smoothPos.y, tgtY, SMOOTH);
        smoothPos.z = lp(smoothPos.z, tgtZ, SMOOTH);
        lookSmooth.x = lp(lookSmooth.x, tgtLX, SMOOTH);
        lookSmooth.y = lp(lookSmooth.y, tgtLY, SMOOTH);
        lookSmooth.z = lp(lookSmooth.z, tgtLZ, SMOOTH);

        camera.position.set(
          smoothPos.x + Math.sin(t*0.09)*1.2,
          smoothPos.y + Math.cos(t*0.12)*0.5,
          smoothPos.z
        );
        camera.lookAt(lookSmooth.x, lookSmooth.y, lookSmooth.z);

        // Dust drift
        dustGeo.attributes.position.array.forEach((_: any, i: number) => {
          if (i % 3 === 1) {
            const base = (dustGeo.attributes.position.array as Float32Array);
            base[i] += Math.sin(t * 0.4 + i) * 0.003;
          }
        });
        dustGeo.attributes.position.needsUpdate = true;

        scrollVel *= 0.84;
        renderer.render(scene, camera);
      };
      draw();

      return () => {
        window.removeEventListener("resize", onResize);
        stInstances.forEach((s: any) => s.kill());
        cancelAnimationFrame(rafId);
        visObs.disconnect();
        hillsGeo.dispose(); hillsGeo2.dispose(); hillsMat.dispose();
        dustGeo.dispose(); dustMat.dispose();
        if (renderer) { renderer.forceContextLoss?.(); renderer.dispose(); (renderer as any).domElement = null; }
      };
    };

    let cleanupFn: (() => void) | undefined;
    init().then((fn: any) => { cleanupFn = fn; });
    return () => {
      isMounted = false;
      cancelAnimationFrame(rafId);
      cleanupFn?.();
      if (renderer) {
        try { renderer.forceContextLoss(); } catch (_) {}
        renderer.dispose();
        (renderer as any).domElement = null;
        renderer = null;
      }
    };
  }, []);

  // ── HUD ───────────────────────────────────────────────────────────────────
  const p = prog;
  const s0Op = Math.max(0, 1 - p / 0.18);
  const s1Op = Math.max(0, Math.min(1,(p-0.10)/0.12)) * Math.max(0,1-(p-0.52)/0.12);
  const s2Op = Math.max(0, Math.min(1,(p-0.50)/0.12)) * Math.max(0,1-(p-0.88)/0.10);
  const w0Op = Math.max(0, 1 - Math.max(0,(p-0.20)/0.10));
  const w1Op = Math.max(0, Math.min(1,(p-0.28)/0.10)) * Math.max(0,1-Math.max(0,(p-0.52)/0.10));
  const w2Op = Math.max(0, Math.min(1,(p-0.60)/0.10)) * Math.max(0,1-Math.max(0,(p-0.86)/0.08));
  const c1X = s1Op > 0.01 ? 0 : -52;
  const c2X = s2Op > 0.01 ? 0 :  52;

  return (
    <div ref={containerRef} style={{ height:"300vh", position:"relative" }}>
      <div style={{ position:"sticky", top:0, height:"100vh", overflow:"hidden" }}>
        <canvas ref={canvasRef} style={{ position:"absolute",inset:0,width:"100%",height:"100%",display:"block",zIndex:0 }} />

        {/* Consistent dark border on all 4 edges */}
        <div style={{ position:"absolute",inset:0,zIndex:1,pointerEvents:"none",
          background:"radial-gradient(ellipse 100% 90% at 50% 50%, transparent 32%, rgba(8,15,26,.82) 100%)" }} />
        <div style={{ position:"absolute",top:0,left:0,right:0,height:"16%",zIndex:2,pointerEvents:"none",
          background:"linear-gradient(to bottom,rgba(8,15,26,.92),transparent)" }} />
        <div style={{ position:"absolute",bottom:0,left:0,right:0,height:"18%",zIndex:2,pointerEvents:"none",
          background:"linear-gradient(to top,rgba(8,15,26,.95),transparent)" }} />
        <div style={{ position:"absolute",top:0,bottom:0,left:0,width:"9%",zIndex:2,pointerEvents:"none",
          background:"linear-gradient(to right,rgba(8,15,26,.88),transparent)" }} />
        <div style={{ position:"absolute",top:0,bottom:0,right:0,width:"9%",zIndex:2,pointerEvents:"none",
          background:"linear-gradient(to left,rgba(8,15,26,.88),transparent)" }} />
        <div className="scanline" />

        {/* ── CENTER WORDS ─────────────────────────────────────────────────── */}
        <div style={{ position:"absolute",inset:0,zIndex:10,pointerEvents:"none",
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
          <div style={{ position:"relative",height:"clamp(3.2rem,9.5vw,9rem)",display:"flex",
            alignItems:"center",justifyContent:"center",minWidth:"clamp(300px,60vw,900px)" }}>
            {[
              { word:"THE SOLUTION", op:w0Op, color:"#2DD4BF", glow:"0 0 40px rgba(45,212,191,.25)" },
              { word:"IMMERSIVE",    op:w1Op, color:"#7ef8f0", glow:"0 0 40px rgba(126,248,240,.22)" },
              { word:"INTELLIGENT",  op:w2Op, color:"#38bdf8", glow:"0 0 40px rgba(56,189,248,.22)" },
            ].map(({ word, op, color, glow }) => (
              <div key={word} className="fB" style={{
                position:"absolute", fontSize:"clamp(3.2rem,9.5vw,9rem)",
                color, letterSpacing:".05em", lineHeight:1, textAlign:"center",
                textShadow:glow, opacity:op,
                transform:`translateY(${(1-op)*16}px)`,
                transition:"opacity .70s cubic-bezier(.22,1,.36,1), transform .70s cubic-bezier(.22,1,.36,1)",
                pointerEvents:"none", whiteSpace:"nowrap",
              }}>{word}</div>
            ))}
          </div>

          <div style={{ opacity:s0Op, transition:"opacity .5s ease", pointerEvents:"none", textAlign:"center" }}>
            <div style={{ width:1,height:36,background:"linear-gradient(to bottom,rgba(45,212,191,.40),transparent)",margin:"18px auto 0" }} />
            <div className="fM" style={{ fontSize:8,color:"rgba(45,212,191,.32)",letterSpacing:".48em",marginTop:12,textTransform:"uppercase" }}>
              Neural Corridor · Active
            </div>
          </div>

          {s0Op > 0.05 && (
            <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none" }}>
              <div className="ring-pop" style={{ width:270,height:270,borderRadius:"50%",border:"1px solid rgba(45,212,191,.10)" }} />
              <div className="ring-pop" style={{ width:270,height:270,borderRadius:"50%",border:"1px solid rgba(45,212,191,.05)",animationDelay:"1.6s" }} />
            </div>
          )}
          {s1Op > 0.05 && p > 0.22 && p < 0.60 && (
            <div className="fM" style={{ marginTop:18,fontSize:8,color:"rgba(45,212,191,.48)",letterSpacing:".32em",textTransform:"uppercase" }}>
              PROTOCOL 01 · GAMIFIED THERAPY
            </div>
          )}
          {s2Op > 0.05 && p > 0.60 && (
            <div className="fM" style={{ marginTop:18,fontSize:8,color:"rgba(56,189,248,.48)",letterSpacing:".32em",textTransform:"uppercase" }}>
              PROTOCOL 02 · ADAPTIVE AI
            </div>
          )}
        </div>

        {/* ── HUD LEFT ─────────────────────────────────────────────────────── */}
        <div style={{
          position:"absolute",top:"50%",left:"6%",zIndex:12,pointerEvents:"none",
          transform:`translate(${c1X}px,-50%)`,
          opacity:s1Op, transition:"transform .70s cubic-bezier(.22,1,.36,1),opacity .55s ease",
          background:"rgba(8,15,26,.78)", backdropFilter:"blur(16px)",
          border:"1px solid rgba(45,212,191,.22)", borderRadius:20,
          padding:"28px 26px", maxWidth:278,
          boxShadow:"0 0 48px rgba(45,212,191,.07),inset 0 1px 0 rgba(45,212,191,.07)",
        }}>
          <div style={{ position:"absolute",top:0,left:0,width:44,height:2,background:"rgba(45,212,191,.55)",borderRadius:"0 0 2px 0" }} />
          <div className="fM" style={{ fontSize:7,color:"rgba(45,212,191,.55)",letterSpacing:".28em",marginBottom:10,textTransform:"uppercase" }}>Protocol · 01</div>
          <h3 className="fB" style={{ fontSize:"clamp(1.35rem,2.2vw,1.75rem)",color:"#fff",letterSpacing:".04em",lineHeight:1.1,marginBottom:10 }}>
            IMMERSIVE<br/><span style={{ color:"#2DD4BF" }}>ENVIRONMENT</span>
          </h3>
          <div style={{ width:30,height:1,background:"rgba(45,212,191,.30)",marginBottom:10 }} />
          <p className="fS" style={{ fontSize:12,color:"rgba(255,255,255,.52)",lineHeight:1.7 }}>
            Gamified therapy that commands attention and builds real neural pathways.
          </p>
          <div style={{ marginTop:16,display:"flex",flexDirection:"column",gap:7 }}>
            {[["SQUEEZE TO PLAY","Motor engagement"],["COGNITIVE GATES","Dual-task training"],["ADAPTIVE LEVELS","AI progression"]].map(([k,v])=>(
              <div key={k} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid rgba(45,212,191,.06)",paddingBottom:5 }}>
                <div className="fM" style={{ fontSize:7,color:"rgba(45,212,191,.62)",textTransform:"uppercase",letterSpacing:".12em" }}>{k}</div>
                <div className="fS" style={{ fontSize:10,color:"rgba(255,255,255,.28)" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── HUD RIGHT ────────────────────────────────────────────────────── */}
        <div style={{
          position:"absolute",top:"50%",right:"6%",zIndex:12,pointerEvents:"none",
          transform:`translate(${c2X}px,-50%)`,
          opacity:s2Op, transition:"transform .70s cubic-bezier(.22,1,.36,1),opacity .55s ease",
          background:"rgba(8,15,26,.78)", backdropFilter:"blur(16px)",
          border:"1px solid rgba(56,189,248,.22)", borderRadius:20,
          padding:"28px 26px", maxWidth:278,
          boxShadow:"0 0 48px rgba(56,189,248,.07),inset 0 1px 0 rgba(56,189,248,.07)",
        }}>
          <div style={{ position:"absolute",top:0,right:0,width:44,height:2,background:"rgba(56,189,248,.55)",borderRadius:"0 0 0 2px" }} />
          <div className="fM" style={{ fontSize:7,color:"rgba(56,189,248,.55)",letterSpacing:".28em",marginBottom:10,textTransform:"uppercase",textAlign:"right" }}>Protocol · 02</div>
          <h3 className="fB" style={{ fontSize:"clamp(1.35rem,2.2vw,1.75rem)",color:"#fff",letterSpacing:".04em",lineHeight:1.1,marginBottom:10,textAlign:"right" }}>
            REAL-TIME<br/><span style={{ color:"#38bdf8" }}>ADAPTATION</span>
          </h3>
          <div style={{ width:30,height:1,background:"rgba(56,189,248,.30)",marginBottom:10,marginLeft:"auto" }} />
          <p className="fS" style={{ fontSize:12,color:"rgba(255,255,255,.52)",lineHeight:1.7,textAlign:"right" }}>
            AI adapts to every micro-movement, filtering tremors for clinical accuracy.
          </p>
          <div style={{ marginTop:16,display:"flex",flexDirection:"column",gap:7 }}>
            {[["GRIP ANALYTICS","Force measurement"],["TREMOR FILTER","6-axis IMU"],["AI COMPANION","Live adjustment"]].map(([k,v])=>(
              <div key={k} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid rgba(56,189,248,.06)",paddingBottom:5 }}>
                <div className="fS" style={{ fontSize:10,color:"rgba(255,255,255,.28)" }}>{v}</div>
                <div className="fM" style={{ fontSize:7,color:"rgba(56,189,248,.62)",textTransform:"uppercase",letterSpacing:".12em" }}>{k}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll progress */}
        <div style={{ position:"absolute",bottom:28,left:"50%",transform:"translateX(-50%)",zIndex:12,
          display:"flex",flexDirection:"column",alignItems:"center",gap:8,pointerEvents:"none",
          opacity:Math.min(1,p*8) }}>
          <div className="fM" style={{ fontSize:7,color:"rgba(45,212,191,.35)",letterSpacing:".45em",textTransform:"uppercase" }}>SCROLL</div>
          <div style={{ width:80,height:1,background:"rgba(45,212,191,.12)",position:"relative",overflow:"hidden" }}>
            <div style={{ position:"absolute",left:0,top:0,height:"100%",background:"rgba(45,212,191,.55)",width:`${p*100}%`,transition:"width .1s" }} />
          </div>
          <div className="fM" style={{ fontSize:7,color:"rgba(45,212,191,.25)",letterSpacing:".20em" }}>
            {String(Math.min(Math.floor(p*3)+1,3)).padStart(2,"0")} / 03
          </div>
        </div>
      </div>
    </div>
  );
}




// ══ INTERACTIVE TABLET ══════════════════════════════════════════════════════
function InteractiveTablet() {
  const TABLET_CSS = `
    .tablet-wrapper{display:flex;justify-content:center;align-items:center;padding:40px 40px 160px;}
    .tablet-card{position:relative;width:100%;max-width:900px;aspect-ratio:16/10;background:#040914;border-radius:24px;padding:16px;box-shadow:0 30px 60px rgba(0,0,0,.6),inset 0 1px 1px rgba(255,255,255,.10),0 0 0 1px rgba(45,212,191,.2);transition:all 0.8s cubic-bezier(.22,1,.36,1);z-index:10;}
    .tablet-screen{width:100%;height:100%;border-radius:12px;overflow:hidden;position:relative;background:#000;}
    .tablet-screen img{width:100%;height:100%;object-fit:cover;transition:transform 1s ease;display:block;}
    .tablet-screen::after{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.10) 0%,rgba(255,255,255,0) 40%);pointer-events:none;}
    .tech-layer{position:absolute;padding:16px;background:rgba(8,15,26,.95);border-radius:24px;box-shadow:-10px 10px 30px rgba(0,0,0,.5);transform-origin:bottom left;transition:all 0.8s cubic-bezier(.22,1,.36,1);display:flex;align-items:flex-start;justify-content:flex-end;opacity:0;z-index:-1;}
    .tech-layer::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:2px;-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:.8;}
    .layer-1{width:70%;height:70%;bottom:0;left:0;}
    .layer-1::before{background:linear-gradient(135deg,#2DD4BF,transparent);}
    .layer-1 .tlicon{color:#2DD4BF;}
    .layer-2{width:50%;height:50%;bottom:0;left:0;transition-delay:.05s;}
    .layer-2::before{background:linear-gradient(135deg,#a78bfa,transparent);}
    .layer-2 .tlicon{color:#a78bfa;}
    .layer-3{width:30%;height:30%;bottom:0;left:0;transition-delay:.10s;}
    .layer-3::before{background:linear-gradient(135deg,#fbbf24,transparent);}
    .layer-3 .tlicon{color:#fbbf24;}
    .tablet-wrapper:hover .tablet-card{transform:translateY(-20px) scale(1.02);box-shadow:0 50px 80px rgba(0,0,0,.8),0 0 60px rgba(45,212,191,.15);}
    .tablet-wrapper:hover .tablet-screen img{transform:scale(1.05);}
    .tablet-wrapper:hover .layer-1{bottom:-40px;left:-40px;opacity:1;}
    .tablet-wrapper:hover .layer-2{bottom:-80px;left:-80px;opacity:1;}
    .tablet-wrapper:hover .layer-3{bottom:-120px;left:-120px;opacity:1;}
  `;
  return (
    <div className="tablet-wrapper">
      <style>{TABLET_CSS}</style>
      <div className="tablet-card">
        <div className="tech-layer layer-1"><div className="tlicon"><Cpu size={32}/></div></div>
        <div className="tech-layer layer-2"><div className="tlicon"><Brain size={32}/></div></div>
        <div className="tech-layer layer-3"><div className="tlicon"><Cloud size={32}/></div></div>
        <div className="tablet-screen">
          <img src="/images/fishgame.jpg" alt="ReViveX Gameplay" />
        </div>
      </div>
    </div>
  );
}

function SolutionSection() {
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
        <Reveal dir="up" style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="fM" style={{ fontSize: 9, color: "rgba(45,212,191,.55)", textTransform: "uppercase", letterSpacing: ".32em", marginBottom: 16 }}>The Innovation</div>
        </Reveal>
        <Reveal dir="zoom" style={{ marginBottom: 48 }}>
          <VaporizeTextCycle
            texts={["PLAY GAMES.", "HEAL FASTER.", "REWIRE IT."]}
            fontSize={96}
            color="#2DD4BF"
            fontFamily="'Syne',sans-serif"
            style={{ minHeight: "180px" }}
          />
        </Reveal>
{/* EXPANDED TABLET/GAMEPLAY CONTAINER */}
        <Reveal dir="up" style={{ marginBottom: 60, display:"flex", justifyContent:"center" }}>
          <div style={{
            position:"relative", width:"90vw", maxWidth:1000, borderRadius:32,
            overflow:"hidden", border:"1px solid rgba(45,212,191,.22)",
            boxShadow:"0 0 0 1px rgba(45,212,191,.08), 0 40px 100px rgba(0,0,0,.6), 0 0 60px rgba(45,212,191,.08)",
            background:"#040914",
          }}>
            {/* Screen glare */}
            <div style={{ position:"absolute",inset:0,zIndex:2,pointerEvents:"none",
              background:"linear-gradient(135deg,rgba(255,255,255,.06) 0%,transparent 40%)" }} />
            {/* Teal scan line */}
            <div className="scanline" style={{ zIndex:3 }} />
            <img
              src="/images/fishgame.jpg"
              alt="ReViveX Gameplay — Fish Game"
              style={{ width:"100%", height:480, objectFit:"cover", display:"block" }}
            />
            {/* Bottom HUD strip */}
            <div style={{
              position:"absolute", bottom:0, left:0, right:0, zIndex:4,
              padding:"14px 24px", display:"flex", justifyContent:"space-between", alignItems:"center",
              background:"linear-gradient(to top,rgba(4,9,20,.92),transparent)",
            }}>
              <div className="fM" style={{ fontSize:8, color:"rgba(45,212,191,.7)", letterSpacing:".28em", textTransform:"uppercase" }}>
                ReViveX · Grip Therapy Game
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"#2DD4BF", boxShadow:"0 0 8px #2DD4BF", animation:"blink .85s step-end infinite" }} />
                <div className="fM" style={{ fontSize:8, color:"rgba(45,212,191,.55)", letterSpacing:".18em" }}>LIVE SESSION</div>
              </div>
            </div>
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
}



//  OFFER SECTION  — white bento grid


function OfferSection() {

  return (

    <section id="offer" data-theme="dark" style={{ background: "linear-gradient(150deg, #0c0820 0%, #080b1c 50%, #060e20 100%)", padding: "120px 40px", position: "relative", overflow: "hidden" }}>

      <div className="offer-orb-1" />
      <div className="offer-orb-2" />
      <div className="aml aml-b" style={{ width:500, height:500, top:"10%",  left:"10%",  background:"radial-gradient(circle,rgba(139,92,246,.055),transparent 70%)" }} />
      <div className="aml aml-d" style={{ width:380, height:380, bottom:"10%",right:"5%", background:"radial-gradient(circle,rgba(99,102,241,.04),transparent 70%)" }} />
      <div className="grid-dk" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      <div className="scanline" />

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        <Reveal dir="left" style={{ marginBottom: 16 }}>
          <div className="fM" style={{ fontSize: 9, color: "rgba(167,139,250,.8)", textTransform: "uppercase", letterSpacing: ".3em", marginBottom: 12 }}>What We Offer</div>
        </Reveal>
        <Reveal dir="zoom" style={{ marginBottom: 48 }}>
          <VaporizeTextCycle
            texts={["ALL YOU NEED.", "ONE DEVICE.", "NOTHING LIKE IT."]}
            fontSize={96}
            color="#a78bfa"
            fontFamily="'Syne',sans-serif"
            style={{ minHeight: "180px" }}
          />
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

}


//  WHY SECTION



function WhySection() {

  const POINTS = [

    {
      n: "01", c: "#2DD4BF", dir: "left" as const, t: "Dual-task is the only way.",

      b: "Neuroplasticity requires simultaneous motor and cognitive training. Our dual-task protocol delivers both in real-time."
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

        <Reveal dir="zoom" style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="fM" style={{ fontSize: 9, color: "rgba(251,191,36,.75)", textTransform: "uppercase", letterSpacing: ".32em", marginBottom: 16 }}>Why ReViveX</div>
        </Reveal>
        <Reveal dir="zoom" style={{ marginBottom: 48, textAlign: "center" }}>
          <VaporizeTextCycle
            texts={["NOT A GADGET.", "A REVOLUTION.", "BUILT FOR YOU."]}
            fontSize={96}
            color="#fbbf24"
            fontFamily="'Syne',sans-serif"
            style={{ minHeight: "180px" }}
          />
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

}


//  MARQUEE STRIP



function MarqueeStrip() {

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

}

//  FOOTER + CONTACT



// ══ ISOMETRIC SOCIALS ════════════════════════════════════════════════════════
function IsometricSocials() {
  const ISO_CSS = `
    .iso-card{display:flex;gap:1.5rem;list-style:none;padding:0;margin:0;flex-wrap:wrap;}
    .iso-pro{position:relative;cursor:pointer;transition:0.5s;width:55px;height:55px;}
    .iso-pro .iso-icon{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:50%;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);backdrop-filter:blur(10px);transition:all 0.3s ease-out;z-index:4;color:rgba(255,255,255,0.6);box-shadow:inset 0 0 10px rgba(255,255,255,0.05),0 5px 10px rgba(0,0,0,0.3);}
    .iso-pro:hover .iso-icon{transform:translate(12px,-12px);color:var(--clr);border-color:var(--clr);background:rgba(8,15,26,0.9);box-shadow:inset 0 0 20px rgba(255,255,255,0.1),0 10px 20px rgba(0,0,0,0.5);}
    .iso-pro .iso-text{position:absolute;opacity:0;z-index:5;transition:all 0.3s ease-out;color:var(--clr);background:rgba(8,15,26,0.95);border:1px solid var(--clr);padding:4px 10px;border-radius:6px;font-size:10px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;top:-10px;left:100%;pointer-events:none;box-shadow:0 5px 15px rgba(0,0,0,0.5);white-space:nowrap;}
    .iso-pro:hover .iso-text{opacity:1;transform:translate(5px,-5px) skew(-5deg);}
    .iso-pro span{position:absolute;inset:0;border-radius:50%;transition:all 0.3s ease-out;opacity:0;border:1px solid var(--clr);background:rgba(8,15,26,0.5);}
    .iso-pro:hover span{opacity:1;}
    .iso-pro:hover span:nth-child(1){opacity:0.2;transform:translate(0,0);}
    .iso-pro:hover span:nth-child(2){opacity:0.4;transform:translate(4px,-4px);}
    .iso-pro:hover span:nth-child(3){opacity:0.6;transform:translate(8px,-8px);}
  `;
  const socials = [
    { name:"LinkedIn",  icon:<Linkedin  size={22}/>, color:"#0077b5", href:"#" },
    { name:"Instagram", icon:<Instagram size={22}/>, color:"#E1306C", href:"#" },
    { name:"GitHub",    icon:<Github    size={22}/>, color:"#2DD4BF", href:"#" },
    { name:"Facebook",  icon:<Facebook  size={22}/>, color:"#1877f2", href:"#" },
  ];
  return (
    <>
      <style>{ISO_CSS}</style>
      <ul className="iso-card">
        {socials.map((s,i) => (
          <li key={i} className="iso-pro" style={{"--clr":s.color} as any}>
            <span/><span/><span/>
            <a href={s.href} className="iso-icon" aria-label={s.name}>{s.icon}</a>
            <div className="iso-text fM">{s.name}</div>
          </li>
        ))}
      </ul>
    </>
  );
}

// ══ MAGNETIC TEXT — morphing cursor hover reveal ════════════════════════════
function MagneticText({
  text = "CREATIVE",
  hoverText = "EXPLORE",
  className = "",
  style = {},
}: {
  text: string;
  hoverText?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const circleRef    = useRef<HTMLDivElement>(null);
  const innerTextRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [containerSize, setContainerSize] = useState({ width:0, height:0 });
  const mousePos   = useRef({ x:0, y:0 });
  const currentPos = useRef({ x:0, y:0 });
  const rafRef     = useRef<number>(0);

  useEffect(() => {
    const update = () => {
      if (containerRef.current)
        setContainerSize({ width:containerRef.current.offsetWidth, height:containerRef.current.offsetHeight });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const lerp = (a:number, b:number, t:number) => a+(b-a)*t;
    const tick = () => {
      currentPos.current.x = lerp(currentPos.current.x, mousePos.current.x, 0.15);
      currentPos.current.y = lerp(currentPos.current.y, mousePos.current.y, 0.15);
      if (circleRef.current)
        circleRef.current.style.transform = `translate(${currentPos.current.x}px,${currentPos.current.y}px) translate(-50%,-50%)`;
      if (innerTextRef.current)
        innerTextRef.current.style.transform = `translate(${-currentPos.current.x}px,${-currentPos.current.y}px)`;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    mousePos.current = { x: e.clientX - r.left, y: e.clientY - r.top };
  }, []);

  const onEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    mousePos.current = { x, y };
    currentPos.current = { x, y };
    setIsHovered(true);
  }, []);

  return (
    <div ref={containerRef} onMouseMove={onMove} onMouseEnter={onEnter} onMouseLeave={() => setIsHovered(false)}
      className={className} style={{ position:"relative", display:"inline-flex", alignItems:"center",
        justifyContent:"center", cursor:"none", userSelect:"none", ...style }}>
      <span>{text}</span>
      <div ref={circleRef} style={{
        position:"absolute", top:0, left:0, pointerEvents:"none", borderRadius:"50%",
        overflow:"hidden", backgroundColor:"#2DD4BF",
        width: isHovered ? 160 : 0, height: isHovered ? 160 : 0,
        transition:"width .5s cubic-bezier(.33,1,.68,1), height .5s cubic-bezier(.33,1,.68,1)",
        willChange:"transform, width, height",
      }}>
        <div ref={innerTextRef} style={{
          position:"absolute", display:"flex", alignItems:"center", justifyContent:"center",
          width: containerSize.width, height: containerSize.height, top:"50%", left:"50%",
          willChange:"transform",
        }}>
          <span style={{ color:"#080f1a", whiteSpace:"nowrap" }}>{hoverText}</span>
        </div>
      </div>
    </div>
  );
}

// ══ TYPEWRITER EFFECT SMOOTH ═════════════════════════════════════════════════
function TypewriterEffectSmooth({
  words,
  className = "",
  cursorClassName = "",
}: {
  words: { text: string; className?: string }[];
  className?: string;
  cursorClassName?: string;
}) {
  const wordsArray = words.map(w => ({ ...w, text: w.text.split("") }));
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4, margin:"8px 0" }} className={className}>
      <motion.div
        style={{ overflow:"hidden", paddingBottom:8 }}
        initial={{ width:"0%" }}
        whileInView={{ width:"fit-content" }}
        viewport={{ once:true }}
        transition={{ duration:1.5, ease:"linear", delay:0.3 }}
      >
        <div style={{ whiteSpace:"nowrap" }}>
          {wordsArray.map((word, wi) => (
            <span key={wi} style={{ display:"inline-block" }}>
              {word.text.map((char, ci) => (
                <span key={ci} className={word.className || ""} style={!word.className ? { color:"#fff" } : {}}>
                  {char}
                </span>
              ))}
              {" "}
            </span>
          ))}
        </div>
      </motion.div>
      <motion.span
        initial={{ opacity:0 }}
        animate={{ opacity:1 }}
        transition={{ duration:0.8, repeat:Infinity, repeatType:"reverse" }}
        style={{ display:"block", width:4, height:"1em", borderRadius:2, backgroundColor:"#2DD4BF", boxShadow:"0 0 10px #2DD4BF", flexShrink:0 }}
        className={cursorClassName}
      />
    </div>
  );
}

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

          <div className="fB" style={{ fontSize:"clamp(3rem,10vw,9rem)", letterSpacing:".03em",
            lineHeight:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <MagneticText
              text="LET'S REWIRE"
              hoverText="YOUR BRAIN."
              className="fB"
              style={{ fontSize:"clamp(3rem,10vw,9rem)", letterSpacing:".03em", color:"#fff" }}
            />
            <MagneticText
              text="THE FUTURE."
              hoverText="START TODAY."
              className="fB"
              style={{ fontSize:"clamp(3rem,10vw,9rem)", letterSpacing:".03em", color:"#2DD4BF" }}
            />
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

                  <MagButton type="submit" className="fB sweep-btn sweep-teal" style={{
                      width:"100%", padding:"16px", borderRadius:14,
                      fontSize:15, letterSpacing:".12em", justifyContent:"center",
                    }}>
                    <span className="sweep-bar" style={{ background:"rgba(45,212,191,.6)", boxShadow:"0 0 10px 10px rgba(45,212,191,.25)" }} />
                    <span style={{ position:"relative", zIndex:1 }}>SEND MESSAGE</span>
                  </MagButton>

                </form>

              )}

            </div>

          </Reveal>



          {/* Info */}

          <Reveal dir="right" delay={.15} style={{ paddingTop: 8 }}>

            <TypewriterEffectSmooth
              className="fB"
              cursorClassName=""
              words={[
                { text: "DESIGNED" },
                { text: "FOR" },
                { text: "PATIENTS." },
                { text: "BUILT",   className: "tw-teal" },
                { text: "FOR",     className: "tw-teal" },
                { text: "IMPACT.", className: "tw-teal" },
              ]}
            />
            <style dangerouslySetInnerHTML={{ __html: `.tw-teal { color: #2DD4BF !important; }` }} />

            <p className="fS" style={{
              fontSize: 15, color: "rgba(255,255,255,.78)",

              lineHeight: 1.75, fontWeight: 300, marginBottom: 42, marginTop: -10
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

            <div style={{ marginTop: 32 }}>
              <IsometricSocials />
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


// ══ ROLE SELECTION MODAL ═════════════════════════════════════════════════════
function RoleSelectionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Dark Blur Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(4,9,20,0.85)", backdropFilter: "blur(12px)" }} 
      />

      {/* The Modal Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{
          position: "relative", width: "90%", maxWidth: 700, 
          background: "linear-gradient(145deg, #0B1E33, #060e1c)",
          border: "1px solid rgba(45,212,191,0.25)", borderRadius: 32, padding: "48px 40px", 
          boxShadow: "0 30px 80px rgba(0,0,0,0.8), 0 0 50px rgba(45,212,191,0.15)",
          display: "flex", flexDirection: "column", alignItems: "center"
        }}>
        
        {/* Close Button */}
        <button onClick={onClose} style={{ position: "absolute", top: 24, right: 24, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.6)", cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>
          <X size={20} />
        </button>

        <div className="fM" style={{ fontSize: 10, color: "#2DD4BF", letterSpacing: ".3em", textTransform: "uppercase", marginBottom: 12 }}>Join ReViveX</div>
        <h2 className="fB" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "#fff", letterSpacing: ".02em", marginBottom: 40, textAlign: "center", lineHeight: 1 }}>HOW WOULD YOU LIKE TO<br/><span style={{color: "#2DD4BF"}}>PROCEED?</span></h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, width: "100%" }}>
          {/* Patient Selection Card */}
          <div onClick={() => router.push("/auth/patient/signup")}
            style={{ cursor: "pointer", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(45,212,191,0.15)", borderRadius: 24, padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", transition: "all 0.3s ease" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(45,212,191,0.08)"; e.currentTarget.style.borderColor = "#2DD4BF"; e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(45,212,191,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(45,212,191,0.15)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg, rgba(45,212,191,0.2), rgba(45,212,191,0.05))", border: "1px solid rgba(45,212,191,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, color: "#2DD4BF" }}>
              <Activity size={32} />
            </div>
            <h3 className="fB" style={{ fontSize: 28, color: "#fff", marginBottom: 8, letterSpacing: "0.04em" }}>I AM A PATIENT</h3>
            <p className="fS" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.6 }}>Start your immersive recovery journey, track your progress, and heal faster.</p>
          </div>

          {/* Doctor Selection Card */}
          <div onClick={() => router.push("/auth/doctor/signup")}
            style={{ cursor: "pointer", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 24, padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", transition: "all 0.3s ease" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(167,139,250,0.08)"; e.currentTarget.style.borderColor = "#a78bfa"; e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(167,139,250,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(167,139,250,0.15)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.05))", border: "1px solid rgba(167,139,250,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, color: "#a78bfa" }}>
              <Stethoscope size={32} />
            </div>
            <h3 className="fB" style={{ fontSize: 28, color: "#fff", marginBottom: 8, letterSpacing: "0.04em" }}>I AM A DOCTOR</h3>
            <p className="fS" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.6 }}>Manage your patients, monitor live data, and adjust protocols remotely.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


//  ROOT PAGE

export default function LandingPage() {
  const [booted, setBooted] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false); 

  useLenis();
  return (
    <div className="grain" style={{ background: "#080f1a" }}>
      <style>{CSS}</style>

      <MedicalCursor />
      {!booted && <Preloader onDone={() => setBooted(true)} />}

      
      <AnimatePresence>
        {showRoleModal && (
          <RoleSelectionModal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {booted && (
          <motion.div key="site"
            initial={{ opacity: 0, scale: .95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}>


            <Navbar onGetStarted={() => setShowRoleModal(true)} />

            <CinematicHero />
            <SectionSep color="#ef4444" dim />
            <RoadBridge />

            <ProblemSection />
            <SectionSep color="#2DD4BF" dim />
            <NeuralBridge />
            <SectionSep color="#2DD4BF" />

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