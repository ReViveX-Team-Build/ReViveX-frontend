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

    --mu:  #6B7280;

  }



  *, *::before, *::after { cursor: none !important; box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: auto; }

  body { overflow-x: hidden; background: var(--dk); }

  ::selection { background: rgba(45,212,191,.25); color: var(--dk2); }



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

  .stat-card:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(0,0,0,.12); }

  .stat-card { transition: transform .3s, box-shadow .3s; }

`;


function useLenis() {

  useEffect(() => {

    import("lenis").then(({ default: Lenis }) => {

      const l = new Lenis({ lerp: 0.075, smoothWheel: true });

      const raf = (t: number) => { l.raf(t); requestAnimationFrame(raf); };

      requestAnimationFrame(raf);

      return () => l.destroy();

    }).catch(() => {});

  }, []);

}

function useMouseParallax() {

  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {

    const h = (e: MouseEvent) => setPos({

      x: e.clientX / window.innerWidth  - 0.5,

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


type RDir = "up"|"down"|"left"|"right"|"zoom"|"zoom-tilt"|"horizon"|"flip";

function Reveal({ children, dir = "up", delay = 0, className = "", style }:

  { children: React.ReactNode; dir?: RDir; delay?: number; className?: string; style?: React.CSSProperties }) {

  const ref  = useRef(null);

  const seen = useInView(ref, { once: true, margin: "-65px" });

 const V: Record<RDir, Variants> = {

    up:          { hidden: { y: 72, opacity: 0 },                    visible: { y: 0, opacity: 1 } },

    down:        { hidden: { y: -50, opacity: 0 },                   visible: { y: 0, opacity: 1 } },

    left:        { hidden: { x: -110, opacity: 0 },                  visible: { x: 0, opacity: 1 } },

    right:       { hidden: { x: 110, opacity: 0 },                   visible: { x: 0, opacity: 1 } },

    zoom:        { hidden: { scale: .7, opacity: 0 },                 visible: { scale: 1, opacity: 1 } },

    "zoom-tilt": { hidden: { scale: .7, rotateY: -18, opacity: 0 }, visible: { scale: 1, rotateY: 0, opacity: 1 } },

    horizon:     { hidden: { scaleX: .06, scaleY: .06, opacity: 0 }, visible: { scaleX: 1, scaleY: 1, opacity: 1 } },

    flip:        { hidden: { rotateX: 90, opacity: 0 },              visible: { rotateX: 0, opacity: 1 } },

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

  const ref  = useRef(null);

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

  const ref    = useRef<HTMLSpanElement>(null);

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

    const x = ((e.clientX - r.left) / r.width  - 0.5) * 2;

    const y = ((e.clientY - r.top)  / r.height - 0.5) * 2;

    el.style.transform  = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.018)`;

    el.style.transition = "transform .07s";

  }, []);

  const onLeave = useCallback(() => {

    const el = ref.current; if (!el) return;

    el.style.transform  = "perspective(900px) rotateY(0) rotateX(0) scale(1)";

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

  { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties; className?: string; type?: "button"|"submit" }) {

  const ref   = useRef<HTMLButtonElement>(null);

  const RANGE = 90, PULL = 0.36;

  const onMove = useCallback((e: React.MouseEvent) => {

    const el = ref.current; if (!el) return;

    const r  = el.getBoundingClientRect();

    const dx = e.clientX - (r.left + r.width  / 2);

    const dy = e.clientY - (r.top  + r.height / 2);

    if (Math.sqrt(dx*dx + dy*dy) < RANGE) {

      el.style.transform  = `translate(${dx * PULL}px, ${dy * PULL}px)`;

      el.style.transition = "transform .15s";

    }

  }, []);

  const onLeave = useCallback(() => {

    const el = ref.current; if (!el) return;

    el.style.transform  = "translate(0,0)";

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


function FloatingParticles({ count = 22 }: { count?: number }) {

  const P = useMemo(() => Array.from({ length: count }, (_, i) => ({

    id:      i,

    x:       Math.random() * 100,

    size:    Math.random() * 2.2 + .8,

    dur:     Math.random() * 9 + 6,

    delay:   Math.random() * 12,

    opacity: Math.random() * 0.25 + 0.04,

  })), [count]);

  const vh = typeof window !== "undefined" ? window.innerHeight : 900;

  return (

    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>

      {P.map(p => (

        <motion.div key={p.id}

          style={{ position: "absolute", left: `${p.x}%`, bottom: -8,

            width: p.size, height: p.size, borderRadius: "50%", background: "#2DD4BF" }}

          animate={{ y: [0, -(vh * 1.15)], opacity: [0, p.opacity, p.opacity, 0] }}

          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "linear" }} />

      ))}

    </div>

  );

}

function NeuralNetwork({ mouse }: { mouse: { x: number; y: number } }) {

  const nodes = useMemo(() => Array.from({ length: 18 }, (_, i) => ({

    id:    i,

    x:     10 + Math.random() * 82,

    y:     8  + Math.random() * 82,

    r:     Math.random() * 2.2 + 1.5,

    speed: Math.random() * 0.04 + 0.01,

  })), []);

  const lines = useMemo(() => {

    const pairs: { a: number; b: number; alpha: number }[] = [];

    for (let i = 0; i < nodes.length; i++) {

      for (let j = i + 1; j < nodes.length; j++) {

        const dx = nodes[i].x - nodes[j].x;

        const dy = nodes[i].y - nodes[j].y;

        const d  = Math.sqrt(dx*dx + dy*dy);

        if (d < 28) pairs.push({ a: i, b: j, alpha: 1 - d / 28 });

      }

    }

    return pairs;

  }, [nodes]);

  return (

    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>

      {lines.map((l, i) => {

        const na = nodes[l.a], nb = nodes[l.b];

        return (

          <line key={i}

            x1={`${na.x + mouse.x * na.speed * 100}%`} y1={`${na.y + mouse.y * na.speed * 100}%`}

            x2={`${nb.x + mouse.x * nb.speed * 100}%`} y2={`${nb.y + mouse.y * nb.speed * 100}%`}

            stroke={`rgba(45,212,191,${l.alpha * 0.18})`} strokeWidth={l.alpha * 1.2} />

        );

      })}

      {nodes.map(n => {

        const mx = (mouse.x + 0.5) * 100, my = (mouse.y + 0.5) * 100;

        const dx = mx - (n.x + mouse.x * n.speed * 100);

        const dy = my - (n.y + mouse.y * n.speed * 100);

        const bright = Math.max(0, 1 - Math.sqrt(dx*dx + dy*dy) / 25);

        return (

          <circle key={n.id}

            cx={`${n.x + mouse.x * n.speed * 100}%`}

            cy={`${n.y + mouse.y * n.speed * 100}%`}

            r={n.r + bright * 3}

            fill={`rgba(45,212,191,${0.22 + bright * 0.55})`}

            style={{ transition: "r .2s, fill .2s" }} />

        );

      })}

    </svg>

  );

}