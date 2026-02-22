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

function FloatingParticles({ count = 35 }: { count?: number }) {
  const P = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id:      i,
    x:       Math.random() * 100,
    size:    Math.random() * 2.5 + 0.5,
    dur:     Math.random() * 12 + 8,
    delay:   Math.random() * 15,
    opacity: Math.random() * 0.3 + 0.05,
    drift:   (Math.random() - 0.5) * 60, // Horizontal sway distance
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
            boxShadow: `0 0 ${p.size * 3}px rgba(45,212,191,0.8)` // Inner glow
          }}
          animate={{ 
            y: [0, -(vh * 1.2)], 
            x: [0, p.drift, -p.drift, 0], // Smooth organic swaying
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
function NeuralNetwork({ mouse }: { mouse: { x: number; y: number } }) {
  // Generate a complex 3D point cloud
  const { nodes, lines } = useMemo(() => {
    const n = Array.from({ length: 65 }, (_, i) => {
      const z = Math.random(); // Depth: 0 is far away, 1 is right up against the screen
      return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        z: z,
        r: 0.8 + z * 2.5,           // Closer nodes are larger
        speed: 0.02 + z * 0.12,     // Closer nodes move much faster (Parallax)
        blur: (1 - z) * 4,          // Far away nodes are blurred (Depth of Field)
        baseAlpha: 0.05 + z * 0.25, // Closer nodes are brighter
      };
    });

    const l = [];
    for (let i = 0; i < n.length; i++) {
      for (let j = i + 1; j < n.length; j++) {
        const dx = n[i].x - n[j].x;
        const dy = n[i].y - n[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Connect nodes if they are close on the X/Y axis AND close on the Z axis
        if (dist < 18 && Math.abs(n[i].z - n[j].z) < 0.3) {
          l.push({ 
            a: i, b: j, 
            baseAlpha: (1 - dist / 18) * 0.2, 
            zAvg: (n[i].z + n[j].z) / 2 
          });
        }
      }
    }
    return { nodes: n, lines: l };
  }, []);

  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      <defs>
        {/* Adds a subtle glowing filter to the synapses */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Render Connecting Lines */}
      {lines.map((l, i) => {
        const na = nodes[l.a], nb = nodes[l.b];
        
        // Calculate true positions including 3D parallax
        const ax = na.x + mouse.x * na.speed * 100;
        const ay = na.y + mouse.y * na.speed * 100;
        const bx = nb.x + mouse.x * nb.speed * 100;
        const by = nb.y + mouse.y * nb.speed * 100;

        // Calculate distance from the line to the mouse cursor for illumination
        const mx = (mouse.x + 0.5) * 100, my = (mouse.y + 0.5) * 100;
        const midX = (ax + bx) / 2, midY = (ay + by) / 2;
        const distToMouse = Math.sqrt(Math.pow(mx - midX, 2) + Math.pow(my - midY, 2));
        
        // If mouse is near, the line lights up and gets thicker
        const illumination = Math.max(0, 1 - distToMouse / 20);
        const finalAlpha = l.baseAlpha + (illumination * 0.4);

        return (
          <line key={`line-${i}`}
            x1={`${ax}%`} y1={`${ay}%`}
            x2={`${bx}%`} y2={`${by}%`}
            stroke={`rgba(45,212,191,${finalAlpha})`} 
            strokeWidth={0.5 + (l.zAvg * 1) + (illumination * 1.5)} 
            style={{ filter: illumination > 0.2 ? "url(#glow)" : "none", transition: "stroke 0.2s, stroke-width 0.2s" }}
          />
        );
      })}

      {/* Render Nodes */}
      {nodes.map(n => {
        // Apply Parallax Speed
        const nx = n.x + mouse.x * n.speed * 100;
        const ny = n.y + mouse.y * n.speed * 100;

        // Illumination math
        const mx = (mouse.x + 0.5) * 100, my = (mouse.y + 0.5) * 100;
        const distToMouse = Math.sqrt(Math.pow(mx - nx, 2) + Math.pow(my - ny, 2));
        const illumination = Math.max(0, 1 - distToMouse / 15);

        return (
          <circle key={`node-${n.id}`}
            cx={`${nx}%`}
            cy={`${ny}%`}
            r={n.r + (illumination * 3)}
            fill={`rgba(45,212,191,${n.baseAlpha + illumination})`}
            style={{ 
              filter: `blur(${n.blur}px)`, 
              transition: "r 0.15s, fill 0.15s",
              boxShadow: "0 0 10px #2DD4BF" 
            }} 
          />
        );
      })}
    </svg>
  );
}

function MedicalCursor() {

  const crossRef = useRef<HTMLDivElement>(null);

  const ringRef  = useRef<HTMLDivElement>(null);

  const trailRef = useRef<Array<HTMLDivElement | null>>([]);

  const histRef  = useRef<Array<{ x: number; y: number }>>([]);

  const TRAIL    = 8;



  const [mode,  setMode]  = useState<"default"|"hover"|"click">("default");

  const [light, setLight] = useState(false);



  useEffect(() => {

    let mx = -400, my = -400, rx = -400, ry = -400, raf = 0;



    const onMove = (e: MouseEvent) => {

      mx = e.clientX; my = e.clientY;

      let el = document.elementFromPoint(mx, my) as HTMLElement | null;

      while (el) {

        if (el.dataset?.theme === "light") { setLight(true);  break; }

        if (el.dataset?.theme === "dark")  { setLight(false); break; }

        el = el.parentElement;

      }

    };

    const onDown = () => setMode("click");

    const onUp   = () => setMode(m => m === "click" ? "default" : m);

    const onIn   = () => setMode("hover");

    const onOut  = () => setMode("default");



    document.addEventListener("mousemove", onMove);

    document.addEventListener("mousedown", onDown);

    document.addEventListener("mouseup",   onUp);

    document.querySelectorAll("button,a,[data-mag]").forEach(el => {

      el.addEventListener("mouseenter", onIn);

      el.addEventListener("mouseleave", onOut);

    });



    const tick = () => {

      if (crossRef.current) {

        crossRef.current.style.left = `${mx}px`;

        crossRef.current.style.top  = `${my}px`;

      }

      rx += (mx - rx) * 0.1; ry += (my - ry) * 0.1;

      if (ringRef.current) {

        ringRef.current.style.left = `${rx}px`;

        ringRef.current.style.top  = `${ry}px`;

      }

      histRef.current.unshift({ x: mx, y: my });

      if (histRef.current.length > TRAIL) histRef.current.pop();

      trailRef.current.forEach((dot, i) => {

        const p = histRef.current[i + 1];

        if (!dot || !p) return;

        dot.style.left    = `${p.x}px`;

        dot.style.top     = `${p.y}px`;

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

      document.removeEventListener("mouseup",   onUp);

      cancelAnimationFrame(raf);

    };

  }, []);



  const C  = light ? "#0B1E33" : "#2DD4BF";

  const sz = mode === "hover" ? 54 : mode === "click" ? 22 : 32;



  return (

    <>

      {Array.from({ length: TRAIL - 1 }).map((_, i) => (

        <div key={i} ref={el => { trailRef.current[i] = el; }}

          style={{ position: "fixed", zIndex: 99990, pointerEvents: "none",

            width: 4, height: 4, borderRadius: "50%", background: C, transform: "translate(-50%,-50%)" }} />

      ))}

      <div ref={ringRef} style={{

        position: "fixed", zIndex: 99997, pointerEvents: "none",

        width:  mode === "hover" ? 64 : mode === "click" ? 14 : 42,

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

          <line x1="-17" y1="0"   x2="-7"  y2="0"   stroke={C} strokeWidth={mode==="click"?1:1.5} strokeLinecap="round" />

          <line x1="7"   y1="0"   x2="17"  y2="0"   stroke={C} strokeWidth={mode==="click"?1:1.5} strokeLinecap="round" />

          <line x1="0"   y1="-17" x2="0"   y2="-7"  stroke={C} strokeWidth={mode==="click"?1:1.5} strokeLinecap="round" />

          <line x1="0"   y1="7"   x2="0"   y2="17"  stroke={C} strokeWidth={mode==="click"?1:1.5} strokeLinecap="round" />

          <circle cx="0" cy="0" r={mode==="click" ? 1.2 : 1.9} fill={C} />

          <g className="arc-cw">

            <path d="M-14,0 A14,14 0 0,1 0,-14" stroke={C} strokeWidth="1.5" fill="none"

              style={{ filter: `drop-shadow(0 0 4px ${C})` }} />

          </g>

          <g className="arc-ccw">

            <path d="M14,0 A14,14 0 0,1 0,14" stroke={C} strokeWidth="1.5" fill="none" opacity=".5" />

          </g>

          <line x1="-13" y1="-13" x2="-10" y2="-10" stroke={C} strokeWidth=".7" opacity=".4" />

          <line x1="13"  y1="-13" x2="10"  y2="-10" stroke={C} strokeWidth=".7" opacity=".4" />

          <line x1="-13" y1="13"  x2="-10" y2="10"  stroke={C} strokeWidth=".7" opacity=".4" />

          <line x1="13"  y1="13"  x2="10"  y2="10"  stroke={C} strokeWidth=".7" opacity=".4" />

          {mode === "hover" && (

            <>

              <path d="M-17,-17 L-10,-17 M-17,-17 L-17,-10" stroke={C} strokeWidth="1.5" fill="none" />

              <path d="M17,-17 L10,-17 M17,-17 L17,-10"     stroke={C} strokeWidth="1.5" fill="none" />

              <path d="M-17,17 L-10,17 M-17,17 L-17,10"     stroke={C} strokeWidth="1.5" fill="none" />

              <path d="M17,17 L10,17 M17,17 L17,10"         stroke={C} strokeWidth="1.5" fill="none" />

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

    return () => { clearInterval(counter); clearInterval(msgTimer); [t1, t2, t3].forEach(clearTimeout); };
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
            overflow: "hidden", background: "#080f1a",
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

        background:     scrolled ? "rgba(8,15,26,.9)" : "transparent",

        backdropFilter: scrolled ? "blur(22px)"       : "none",

        borderBottom:   scrolled ? "1px solid rgba(45,212,191,.07)" : "none",

        transition: "background .4s, backdrop-filter .4s, border .4s",

      }}>

      <div className="fB" style={{ fontSize: 22, letterSpacing: ".1em", color: "#fff" }}>

        REVIVE<span style={{ color: "#2DD4BF" }}>X</span>

      </div>

      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>

        {[["Problem","#problem"],["Solution","#solution"],["Offer","#offer"],["Why Us","#why"],["Contact","#contact"]].map(([l,h]) => (

          <a key={l} href={h} data-mag className="fM"

            style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: ".22em",

              color: "rgba(255,255,255,.38)", textDecoration: "none", transition: "color .3s" }}

            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,.85)")}

            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.38)")}>

            {l}

          </a>

        ))}

      </div>

      <a href="#contact" data-mag className="fM"

        style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: ".2em",

          color: "#2DD4BF", padding: "8px 18px", borderRadius: 99,

          border: "1px solid rgba(45,212,191,.3)", textDecoration: "none", transition: "background .3s" }}

        onMouseEnter={e => (e.currentTarget.style.background = "rgba(45,212,191,.1)")}

        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

        ● Get Started

      </a>

    </motion.nav>

  );

}


function HeroSection() {

  const router  = useRouter();

  const skewY   = useVelocitySkew();

  const mouse   = useMouseParallax();

  const smoothX = useSpring(mouse.x, { stiffness: 90, damping: 22 });

  const smoothY = useSpring(mouse.y, { stiffness: 90, damping: 22 });



  const gX = useTransform(smoothX, v => v *  2);

  const gY = useTransform(smoothY, v => v *  2);

  const nX = useTransform(smoothX, v => v *  6);

  const nY = useTransform(smoothY, v => v *  6);

  const dX = useTransform(smoothX, v => v * 10);

  const dY = useTransform(smoothY, v => v * 10);


  const chip0x = useTransform(smoothX, v => -190 + v * 14 * 100); // Far Left, Top

  const chip0y = useTransform(smoothY, v =>   10 + v * 14 * 100); 

  const chip1x = useTransform(smoothX, v =>  190 + v * 18 * 100); // Far Right, Top

  const chip1y = useTransform(smoothY, v =>   30 + v * 18 * 100); 

  const chip2x = useTransform(smoothX, v => -170 + v * 12 * 100); // Far Left, Bottom

  const chip2y = useTransform(smoothY, v =>  180 + v * 12 * 100); 

  const chip3x = useTransform(smoothX, v =>  170 + v * 16 * 100); // Far Right, Bottom

  const chip3y = useTransform(smoothY, v =>  170 + v * 16 * 100);



  const chips = [

    { l: "GRIP",      v: "84 kPa", c: "#2DD4BF", delay: 1.9,  cx: chip0x, cy: chip0y },

    { l: "TREMOR",    v: "±0.02g", c: "#a78bfa", delay: 2.08, cx: chip1x, cy: chip1y },

    { l: "ADHERENCE", v: "87%",    c: "#34d399", delay: 2.26, cx: chip2x, cy: chip2y },

    { l: "XP POINTS", v: "+280",   c: "#fbbf24", delay: 2.44, cx: chip3x, cy: chip3y },

  ];

  return (

    <section data-theme="dark" style={{

      position: "relative", minHeight: "100vh",

      display: "flex", flexDirection: "column",

      alignItems: "center", justifyContent: "center",

      overflow: "hidden", background: "#080f1a",

    }}>

      {/* Breathing glow */}

      <motion.div style={{ x: gX, y: gY, position: "absolute", inset: 0, pointerEvents: "none" }}>

        <div className="glow-breath" style={{ width: "100%", height: "100%",

          background: "radial-gradient(ellipse 65% 60% at 50% 58%, rgba(45,212,191,.10), transparent 68%)" }} />

      </motion.div>



      <div className="grid-dk" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />



      {/* Decorative diagonal lines */}

      {[7, 22, 48, 74, 90].map((p, i) => (

        <div key={i} style={{ position: "absolute", top: "-30%", left: `${p}%`,

          width: 1, height: "180%", pointerEvents: "none",

          background: `linear-gradient(to bottom,transparent,rgba(45,212,191,${.042-i*.006}),transparent)`,

          transform: `rotate(${-13+i*5}deg)` }} />

      ))}

      <div className="scanline" />

      <FloatingParticles count={20} />

      {/* Neural network layer */}

      <motion.div style={{ x: nX, y: nY, position: "absolute", inset: 0, pointerEvents: "none" }}>

        <NeuralNetwork mouse={mouse} />

      </motion.div>



      {/* Main content */}

      <motion.div style={{ skewY, width: "100%", maxWidth: 1280,

        padding: "120px 40px 80px", display: "flex",

        flexDirection: "column", alignItems: "center", position: "relative", zIndex: 10 }}>


       {/* Badge */}

        <Reveal dir="down" delay={.2}>

          <div className="fM" style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: ".28em",

            color: "rgba(255,255,255,.38)", marginBottom: 38,

            display: "flex", alignItems: "center", gap: 10,

            padding: "8px 20px", borderRadius: 99,

            background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)" }}>

            <Heart size={11} style={{ color: "#2DD4BF" }} className="heartbeat" />

            Democratizing Neuro-Rehabilitation · SDGP CS-09

          </div>

        </Reveal>



        {/* Headline */}

        <div style={{ textAlign: "center", lineHeight: ".88", marginBottom: 24, perspective: 900, overflow: "hidden" }}>

          <div className="fB" style={{ fontSize: "clamp(4rem,12vw,11rem)", color: "#fff", letterSpacing: ".04em", overflow: "hidden" }}>

            <SplitText text="REWIRING" delay={.5} stagger={.04} />

          </div>

          <div className="fB" style={{ fontSize: "clamp(4rem,12vw,11rem)", color: "#2DD4BF", letterSpacing: ".04em", overflow: "hidden" }}>

            <SplitText text="RECOVERY." delay={.72} stagger={.04} />

          </div>

        </div>



        {/* Tagline */}

        <Reveal dir="up" delay={1.1}>

          <p className="fS" style={{ color: "rgba(255,255,255,.44)", fontSize: 17,

            textAlign: "center", maxWidth: 460, lineHeight: 1.68,

            fontWeight: 300, marginBottom: 52 }}>

            A revolutionary IoT device that turns repetitive physiotherapy into

            <span style={{ color: "rgba(255,255,255,.82)", fontWeight: 500 }}> immersive games</span>

            {" "}— so patients <span style={{ color: "#2DD4BF", fontWeight: 500 }}>actually want</span> to recover.

          </p>

        </Reveal>
        
        {/* Device */}

        <Reveal dir="zoom" delay={.85} style={{ marginBottom: 80 }}>

          <motion.div style={{ x: dX, y: dY, position: "relative", width: "300px", height: "240px" }}>

            {[280, 210, 148].map((s, i) => (

              <div key={i} style={{ position: "absolute", top: "50%", left: "50%",

                width: s, height: s, borderRadius: "50%",

                border: `1px solid rgba(45,212,191,${.04+i*.05})`,

                transform: "translate(-50%,-50%)", pointerEvents: "none" }} />

            ))}

            <div className="ring-pop" style={{ width: 190, height: 190, borderRadius: "50%",

              border: "1px solid rgba(45,212,191,.55)", pointerEvents: "none" }} />



            <TiltCard style={{ position: "relative", zIndex: 2, width: "100%", height: "100%",

              borderRadius: 44, display: "flex", flexDirection: "column",

              alignItems: "center", justifyContent: "center", gap: 14 }}

              className="float-card">

              <div style={{ width: "100%", height: "100%", borderRadius: 44,

                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,

                background: "linear-gradient(145deg,rgba(45,212,191,.12),rgba(4,10,20,.94))",

                border: "1px solid rgba(45,212,191,.24)",

                boxShadow: "0 0 80px rgba(45,212,191,.16), inset 0 1px 0 rgba(255,255,255,.05)" }}>

                <Cpu size={44} strokeWidth={.9} style={{ color: "#2DD4BF", opacity: .55 }} />

                <div className="fM" style={{ fontSize: 7, color: "rgba(255,255,255,.2)",

                  textTransform: "uppercase", letterSpacing: ".22em", textAlign: "center", lineHeight: 1.8 }}>

                  BP BULB · ESP32<br />MPX10DP · MPU6050

                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>

                  <div style={{ width: 6, height: 6, borderRadius: "50%",

                    background: "#2DD4BF", animation: "blink 1.3s step-end infinite" }} />

                  <span className="fM" style={{ fontSize: 7, color: "rgba(45,212,191,.5)",

                    textTransform: "uppercase", letterSpacing: ".26em" }}>LIVE</span>

                </div>

              </div>

            </TiltCard>

            {/* Floating data chips */}

            {chips.map((chip, i) => (

              <motion.div key={chip.l}

                style={{ position: "absolute", x: chip.cx, y: chip.cy,

                  left: "50%", transform: "translateX(-50%)" }}

                initial={{ opacity: 0, scale: .5 }}

                animate={{ opacity: 1, scale: 1 }}

                transition={{ delay: chip.delay, duration: .55 }}>

                <div style={{ padding: "7px 12px", borderRadius: 12, textAlign: "center",

                  background: "rgba(4,10,20,.94)", border: `1px solid ${chip.c}25`,

                  backdropFilter: "blur(14px)",

                  boxShadow: `0 4px 24px rgba(0,0,0,.5), 0 0 12px ${chip.c}15` }}>

                  <div className="fM" style={{ fontSize: 7, color: "rgba(255,255,255,.2)",

                    textTransform: "uppercase", letterSpacing: ".2em" }}>{chip.l}</div>

                  <div className="fB" style={{ fontSize: 15, color: chip.c, lineHeight: 1.2 }}>{chip.v}</div>

                </div>

              </motion.div>

            ))}

          </motion.div>

        </Reveal>

        
        {/* CTA pill */}

        <Reveal dir="up" delay={1.8}>

          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, padding: 8,

            borderRadius: 32, background: "rgba(255,255,255,.03)",

            border: "1px solid rgba(255,255,255,.07)",

            backdropFilter: "blur(24px)",

            boxShadow: "0 24px 64px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.04)" }}>

            <MagButton onClick={() => router.push("/patients/home")}

              className="btn-shim fB"

              style={{ position: "relative", overflow: "hidden",

                display: "flex", alignItems: "center", gap: 12,

                padding: "18px 44px", borderRadius: 24, fontSize: 15, letterSpacing: ".12em",

                background: "#2DD4BF", color: "#080f1a", border: "none",

                boxShadow: "0 0 55px rgba(45,212,191,.42)" }}>

              <Play size={16} style={{ fill: "#080f1a", position: "relative", zIndex: 1 }} />

              <span style={{ position: "relative", zIndex: 1 }}>Patient Portal</span>

            </MagButton>

            <div style={{ width: 1, height: 46, background: "rgba(255,255,255,.06)" }} />

            <MagButton onClick={() => router.push("/doctor/home")}

              className="fB"

              style={{ display: "flex", alignItems: "center", gap: 12,

                padding: "18px 44px", borderRadius: 24, fontSize: 15, letterSpacing: ".12em",

                background: "transparent", color: "rgba(255,255,255,.78)", border: "none" }}>

              <Stethoscope size={16} />

              Clinician Access

              <ArrowRight size={13} style={{ opacity: .4 }} />

            </MagButton>

          </div>

        </Reveal>

        {/* Scroll hint */}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}

          transition={{ delay: 2.9, duration: 1 }}

          style={{ position: "absolute", bottom: 36,

            display: "flex", flexDirection: "column", alignItems: "center",

            gap: 8, color: "rgba(255,255,255,.2)" }}>

          <span className="fM" style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: ".3em" }}>Scroll</span>

          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>

            <ChevronDown size={14} />

          </motion.div>

        </motion.div>

      </motion.div>

    </section>

  );

}

//  ROAD BRIDGE  

function RoadBridge() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const bgColor    = useTransform(p, [0, .6, .85, 1], ["#080f1a", "#080f1a", "#0B1E33", "#F8F9FA"]);
  const sweepX     = useTransform(p, [0, .10], ["-100%", "100%"]);
  const sweepOp    = useTransform(p, [3, .01, .10, .15], [2, 0, 0, 5]);


  const theY       = useTransform(p, [0, .10, .10, .32], ["100vh", "0vh", "0vh", "0vh"]);
  const theScale   = useTransform(p, [0, .10, .10, .32], [0.4, 1, 1.2, 20]);
  const theOp      = useTransform(p, [0, .10, .10, .32], [0, 1, 1, 0]);

  const iw         = typeof window !== "undefined" ? window.innerWidth : 1440;

  const probX      = useTransform(p, [.10, .10], [-iw * 0.15, 0]);
  const probOp     = useTransform(p, [.0, .10, .50, .58], [0, 1, 1, 0]);
  
  const cntY       = useTransform(p, [.0, .10], [100, 0]);
  const cntScale   = useTransform(p, [.0, .10], [.6, 1]);
  const cntOp      = useTransform(p, [.0, .15, .50, .58], [0, 0.15, 0.15, 0]); // Faint background

  const statsY     = useTransform(p, [.10, .10], [60, 0]);
  const statsOp    = useTransform(p, [.10, .40, .55, .62], [0, 1, 1, 0]);

  const realX      = useTransform(p, [.48, .56], [iw * 0.15, 0]);
  const realOp     = useTransform(p, [.48, .52, .70, .78], [0, 1, 1, 0]);

  const finalY     = useTransform(p, [.72, .82], [80, 0]);
  const finalScale = useTransform(p, [.72, .82, 1], [.8, 1, 1.05]); 
  const finalOp    = useTransform(p, [.72, .80], [0, 1]); 
  
  const textCol    = useTransform(p, [.72, .85], ["#FFFFFF", "#0B1E33"]);
  const subCol     = useTransform(p, [.72, .85], ["rgba(255,255,255,.5)", "rgba(11,30,51,.6)"]);

  const centerWrap: React.CSSProperties = {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    pointerEvents: "none"
  };

  return (
    <div ref={ref} style={{ height: "220vh", position: "relative" }}>
      <motion.div style={{
        position: "sticky", top: 0, height: "100vh", overflow: "hidden", backgroundColor: bgColor, perspective: 1000
      }}>
        <div className="grid-dk" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
        <div className="scanline" />

        <motion.div style={{ x: sweepX, opacity: sweepOp, position: "absolute", top: "50%", left: 0, width: "100%", height: 3, background: "linear-gradient(90deg,transparent,#2DD4BF,transparent)", boxShadow: "0 0 30px rgba(45,212,191,1)", pointerEvents: "none" }} />

        {/* 28% BACKGROUND */}
        <div style={centerWrap}>
          <motion.div style={{ opacity: cntOp, y: cntY, scale: cntScale, willChange: "transform, opacity" }}>
            <span className="fB" style={{ fontSize: "clamp(10rem,30vw,30rem)", color: "#ef4444", letterSpacing: ".02em", lineHeight: 1, filter: "blur(1px)" }}>28%</span>
          </motion.div>
        </div>

        {/* PROBLEM */}
        <div style={{ ...centerWrap, zIndex: 2 }}>
          <motion.div style={{ x: probX, opacity: probOp, display: "flex", flexDirection: "column", alignItems: "center", willChange: "transform, opacity" }}>
            <motion.span className="fB" style={{ fontSize: "clamp(5rem,14vw,13rem)", letterSpacing: ".05em", color: textCol, lineHeight: .9 }}>
              THE
            </motion.span>
            <motion.div className="fM" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".3em", color: "rgba(45,212,191,.55)", marginTop: 14 }}>
              Of patients quit physiotherapy at home
            </motion.div>
          </motion.div>
        </div>

        {/* STATS */}
        <motion.div style={{ position: "absolute", inset: 0, opacity: statsOp, y: statsY, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, willChange: "transform, opacity" }}>
          {[
            { v: "80%",   l: "Drop-out rate",    x: -38, y: -25 },
            { v: "$50K+", l: "Robotic cost",     x:  38, y: -22 },
            { v: "6–12m", l: "Recovery time",    x: -38, y:  30 },
            { v: "3 wks", l: "Before they quit", x:  38, y:  28 },
          ].map(s => (
            <motion.div key={s.v} style={{ position: "absolute", left: `${50 + s.x}vw`, top: `${50 + s.y}vh`, transform: "translate(-50%,-50%)" }}>
              <div style={{ textAlign: "center", padding: "10px 18px", borderRadius: 16, background: "rgba(8,15,26,.85)", border: "1px solid rgba(255,255,255,.06)", backdropFilter: "blur(12px)" }}>
                <div className="fB" style={{ fontSize: "2.2rem", color: "#ef4444", lineHeight: 1 }}>{s.v}</div>
                <div className="fM" style={{ fontSize: 8, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".18em" }}>{s.l}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* THE - ZOOMS OVER EVERYTHING ELSE */}
        <div style={{ ...centerWrap, zIndex: 10 }}>
          <motion.div style={{ scale: theScale, opacity: theOp, y: theY, willChange: "transform, opacity" }}>
            <motion.span className="fB" style={{ fontSize: "clamp(8rem,20vw,20rem)", letterSpacing: ".06em", color: textCol, lineHeight: 1 }}>PROBLEM</motion.span>
          </motion.div>
        </div>

        {/* IS REAL */}
        <div style={{ ...centerWrap, zIndex: 4 }}>
          <motion.div style={{ x: realX, opacity: realOp, willChange: "transform, opacity" }}>
            <span className="fB" style={{ fontSize: "clamp(5rem,14vw,13rem)", letterSpacing: ".05em", color: "#ef4444", lineHeight: .9 }}>IS REAL.</span>
          </motion.div>
        </div>

        {/* FINAL STATEMENT */}
        <div style={{ ...centerWrap, zIndex: 5 }}>
          <motion.div style={{ opacity: finalOp, y: finalY, scale: finalScale, textAlign: "center", willChange: "transform, opacity" }}>
            <motion.div className="fB" style={{ fontSize: "clamp(2.8rem,7vw,7.5rem)", letterSpacing: ".04em", color: textCol, lineHeight: .9 }}>
              RECOVERY IS<br /><span style={{ color: "#ef4444" }}>BROKEN.</span>
            </motion.div>
            <motion.div className="fM" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".28em", marginTop: 28, color: subCol }}>
              ↓ Scroll to see why →
            </motion.div>
          </motion.div>
        </div>

      </motion.div>
    </div>
  );
}

//  PROBLEM SECTION  — white bg

function ProblemSection() {

  return (

    <section id="problem" data-theme="light" style={{

      background: "#F8F9FA", padding: "120px 40px", position: "relative", overflow: "hidden",

    }}>

      <div className="grid-lt" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        <Reveal dir="left">

          <div className="fM" style={{ fontSize: 9, color: "rgba(11,30,51,.35)", textTransform: "uppercase",

            letterSpacing: ".32em", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>

            <span style={{ width: 32, height: 1, background: "rgba(11,30,51,.2)", display: "inline-block" }} />

            The Problem

          </div>

        </Reveal>

        <Reveal dir="zoom" style={{ marginBottom: 48 }}>

          <h2 className="fB" style={{ fontSize: "clamp(3.5rem,8vw,7.5rem)", color: "#0B1E33", letterSpacing: ".03em", lineHeight: .9 }}>

            RECOVERY IS<br /><span style={{ color: "#ef4444" }}>BROKEN.</span>

          </h2>

        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginBottom: 52 }}>

          <Reveal dir="left" delay={.1}>

            <p className="fS" style={{ fontSize: 17, color: "#374151", lineHeight: 1.75, fontWeight: 300, maxWidth: 460, marginBottom: 24 }}>

              Traditional physiotherapy is repetitive, demoralising, and completely disconnected

              from daily life. No feedback. No motivation. No way to see invisible progress.

              Patients don't fail because they're lazy —{" "}

              <strong style={{ color: "#0B1E33" }}>they quit because the system fails them.</strong>

            </p>

            <p className="fS" style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.75, fontWeight: 300, maxWidth: 460 }}>

              High-end robotic rehabilitation systems cost over{" "}

              <strong style={{ color: "#0B1E33" }}>LKR 5 million</strong>. Even if affordable,

              they only treat motor symptoms — ignoring the cognitive rewiring that neuroscience says is essential for real neuroplasticity.

            </p>


          </Reveal>

          <Reveal dir="right" delay={.15}>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              {[

                { n: 28, suf: "%",  pref: "",  l: "Home adherence", sub: "quit within 3 weeks",      c: "#ef4444" },

                { n: 50, suf: "K+", pref: "$", l: "Robotic cost",   sub: "vs our $200 solution",     c: "#f97316" },

                { n: 80, suf: "%",  pref: "",  l: "Drop-out rate",  sub: "before recovery target",   c: "#ef4444" },

                { n: 9,  suf: "m+", pref: "",  l: "Recovery time",  sub: "without proper adherence", c: "#f97316" },

              ].map((s, i) => (

                <Reveal key={s.l} dir="zoom" delay={i * .1}>

                  <TiltCard className="stat-card" style={{ padding: "20px 18px", borderRadius: 22,

                    background: "#fff", border: "1px solid rgba(11,30,51,.08)", boxShadow: "0 4px 24px rgba(11,30,51,.05)" }}>

                    <div className="fB" style={{ fontSize: "2.6rem", color: s.c, lineHeight: 1, marginBottom: 4 }}>

                      <CountUp to={s.n} suffix={s.suf} prefix={s.pref} />

                    </div>

                    <div className="fM" style={{ fontSize: 8, color: "#0B1E33", textTransform: "uppercase", letterSpacing: ".18em", marginBottom: 4 }}>{s.l}</div>

                    <div className="fS" style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.5 }}>{s.sub}</div>

                  </TiltCard>

                </Reveal>

              ))}

            </div>

          </Reveal>

        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>

          {[

            { t: "No Motivation", c: "#ef4444", b: "Squeezing a rubber ball 100 times with zero feedback isn't therapy — it's punishment. The brain doesn't rewire under boredom." },

            { t: "No Access",     c: "#f97316", b: "Robotic exoskeletons cost more than a car. Hospital visits 3× a week for 6 months is unsustainable for almost any family." },

            { t: "Cognitive Gap", c: "#ef4444", b: "Every existing device only trains the hand. None address the cognitive recovery neuroscience says is essential for real neuroplasticity." },

          ].map((card, i) => (

            <Reveal key={card.t} dir="up" delay={i * .12}>

              <TiltCard style={{ padding: "28px 24px", borderRadius: 26, height: "100%",

                background: "#fff", borderLeft: `3px solid ${card.c}`, boxShadow: "0 4px 28px rgba(11,30,51,.06)" }}>

                <div className="fB" style={{ fontSize: 22, color: "#0B1E33", letterSpacing: ".04em", marginBottom: 12 }}>{card.t}</div>

                <p className="fS" style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.75, fontWeight: 300 }}>{card.b}</p>

              </TiltCard>

            </Reveal>

          ))}

        </div>

      </div>

    </section>

  );

}


//  DARK BRIDGE 

function DarkBridge() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Background transition
  const bg = useTransform(p, [0, 0.3], ["#F8F9FA", "#080f1a"]);
  
  const rawWordY     = useTransform(p, [0, 0.15], [300, 0]);
  const rawWordScale = useTransform(p, [0.25, 0.45], [1, 25]); 
  const wordOp       = useTransform(p, [0, 0.05, 0.35, 0.45], [0, 1, 1, 0]); 
  
  const statsOp      = useTransform(p, [0.2, 0.25, 0.40, 0.45], [0, 1, 1, 0]);

  // SPRING PHYSICS
  const wordY     = useSpring(rawWordY, { stiffness: 70, damping: 25 });
  const wordScale = useSpring(rawWordScale, { stiffness: 70, damping: 25 });

  const absCenter: React.CSSProperties = {
    position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    pointerEvents: "none", width: "100%"
  };

  return (
    <div ref={ref} style={{ height: "300vh", position: "relative" }}>
      <motion.div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", backgroundColor: bg }}>
        <div className="grid-dk" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
        <div className="scanline" />
        
        {/* Floating Data Points */}
        <div style={absCenter}>
          <motion.div style={{ 
            position: "absolute", opacity: statsOp, 
            width: "100vw", height: "100vh", 
            willChange: "opacity" 
          }}>
            {[
              { label: "MOTOR",     x: -36, y: -18, ang: -12, c: "#2DD4BF" },
              { label: "COGNITIVE", x:  34, y: -22, ang:  10, c: "#a78bfa" },
              { label: "CLINICAL",  x: -32, y:  20, ang:  -8, c: "#fbbf24" },
              { label: "REMOTE",    x:  32, y:  22, ang:   6, c: "#34d399" },
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
            willChange: "transform, opacity",
            transform: "translateZ(0)"
          }}>
            <div className="fB" style={{ fontSize: "clamp(5rem,15vw,16rem)", letterSpacing: "0.04em", lineHeight: .88, color: "#FFFFFF" }}>
              THE<br /><span style={{ color: "#2DD4BF" }}>SOLUTION</span>
            </div>
            <div className="fM" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".3em", marginTop: 26, color: "rgba(45,212,191,.6)" }}>
              ↓ A new paradigm in rehabilitation
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}


//  SOLUTION SECTION

function SolutionSection() {
  return (
    <section id="solution" data-theme="dark" style={{ background: "#080f1a", padding: "120px 40px", position: "relative", overflow: "hidden" }}>
      <div className="grid-dk" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      <div className="scanline" />
      <div className="glow-breath" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 52% 42% at 50% 50%, rgba(45,212,191,.07), transparent 65%)" }} />
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
          <div style={{ borderRadius:36, overflow:"hidden", border:"1px solid rgba(45,212,191,.14)", boxShadow:"0 40px 100px rgba(0,0,0,.5)", width: "90vw", maxWidth: 1000 }}>
            {/* Replace with your actual video or image */}
            <div style={{ width: "100%", height: "460px", background: "#0a192f", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="fM" style={{ color: "#2DD4BF", opacity: 0.5 }}>[IMG:GAMEPLAY] Placeholder</span>
            </div>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
          {[
            { n:"01", c:"#2DD4BF", icon:<Cpu size={26} strokeWidth={1.1}/>, tag:"Hardware", t:"$200 IoT Controller", b:"BP bulb + ESP32 + MPX10DP pressure sensor + MPU6050 gyroscope. Medical-grade data capture at the cost of a restaurant dinner." },
            { n:"02", c:"#a78bfa", icon:<Zap size={26} strokeWidth={1.1}/>, tag:"Therapy", t:"Dual-Task Gamification", b:"Squeeze to fly the character. Recall colour sequences to pass cognitive gates. Motor + cognitive rehab simultaneously — proven to drive neuroplasticity." },
            { n:"03", c:"#fbbf24", icon:<BarChart3 size={26} strokeWidth={1.1}/>, tag:"Cloud", t:"Remote Clinical Dashboard", b:"Every squeeze streams live to Firebase. Grip force, tremor amplitude, reaction time — your doctor adjusts therapy remotely without clinic visits." },
          ].map((card, i) => (
            <Reveal key={card.n} dir="zoom" delay={i * .14}>
              <TiltCard style={{ padding: "38px 32px", borderRadius: 34, position: "relative", overflow: "hidden", height: "100%", background: "rgba(255,255,255,.025)", border: `1px solid ${card.c}1e` }}>
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

    <section id="offer" data-theme="light" style={{ background: "#FFFFFF", padding: "120px 40px", position: "relative" }}>

      <div className="grid-lt" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        <Reveal dir="left" style={{ marginBottom: 60 }}>

          <div className="fM" style={{ fontSize: 9, color: "rgba(11,30,51,.35)", textTransform: "uppercase", letterSpacing: ".3em", marginBottom: 12 }}>What We Offer</div>

          <h2 className="fB" style={{ fontSize: "clamp(3rem,7vw,6.5rem)", letterSpacing: ".03em", lineHeight: .9, color: "#0B1E33" }}>

            EVERYTHING YOUR<br /><span style={{ color: "#2DD4BF" }}>RECOVERY NEEDS.</span>

          </h2>

        </Reveal>



        {/* Row 1 */}

        <div style={{ display: "grid", gridTemplateColumns: "7fr 5fr", gap: 16, marginBottom: 16 }}>

          <Reveal dir="zoom">

            <TiltCard style={{ padding: "42px 38px", borderRadius: 34, background: "#0B1E33", minHeight: 300, position: "relative", overflow: "hidden" }}>

              <div className="scanline" />

              <div style={{ position: "absolute", bottom: -40, right: -40, width: 200, height: 200, borderRadius: "50%", pointerEvents: "none",

                background: "radial-gradient(circle,rgba(45,212,191,.14),transparent 70%)" }} />

              <div style={{ position: "relative", zIndex: 1 }}>

                <div style={{ width: 54, height: 54, borderRadius: 18, marginBottom: 20,

                  display: "flex", alignItems: "center", justifyContent: "center",

                  background: "rgba(45,212,191,.12)", border: "1px solid rgba(45,212,191,.24)", color: "#2DD4BF" }}>

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

            <TiltCard style={{ padding: "36px 32px", borderRadius: 34, background: "#F3F0FF", minHeight: 300, border: "1px solid rgba(139,92,246,.14)" }}>

              <div style={{ width: 54, height: 54, borderRadius: 18, marginBottom: 20,

                display: "flex", alignItems: "center", justifyContent: "center",

                background: "rgba(139,92,246,.12)", border: "1px solid rgba(139,92,246,.2)", color: "#8b5cf6" }}>

                <Brain size={22} />

              </div>

              <div className="fM" style={{ fontSize: 8, color: "rgba(139,92,246,.65)", textTransform: "uppercase", letterSpacing: ".22em", marginBottom: 10 }}>Dual-Task</div>

              <h3 className="fB" style={{ fontSize: 24, color: "#0B1E33", letterSpacing: ".04em", marginBottom: 14, lineHeight: 1.05 }}>

                Motor + Cognitive. Simultaneously.

              </h3>

              <p className="fS" style={{ fontSize: 14, color: "#374151", lineHeight: 1.75, fontWeight: 300 }}>

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

            <TiltCard style={{ padding: "36px 32px", borderRadius: 34, background: "#F0FDF4", border: "1px solid rgba(52,211,153,.16)", minHeight: 260 }}>

              <div style={{ width: 54, height: 54, borderRadius: 18, marginBottom: 20,

                display: "flex", alignItems: "center", justifyContent: "center",

                background: "rgba(52,211,153,.12)", border: "1px solid rgba(52,211,153,.22)", color: "#34d399" }}>

                <Waves size={22} />

              </div>

              <div className="fM" style={{ fontSize: 8, color: "rgba(52,211,153,.68)", textTransform: "uppercase", letterSpacing: ".22em", marginBottom: 10 }}>Tremor Intelligence</div>

              <h3 className="fB" style={{ fontSize: 22, color: "#0B1E33", letterSpacing: ".04em", marginBottom: 12, lineHeight: 1.05 }}>

                Filters involuntary tremors in real-time.

              </h3>

              <p className="fS" style={{ fontSize: 14, color: "#374151", lineHeight: 1.75, fontWeight: 300 }}>

                6-axis IMU continuously separates Parkinson's tremors from intentional grip for clinical accuracy even in severe cases.

              </p>

            </TiltCard>

          </Reveal>

          <Reveal dir="right" delay={.2}>

            <TiltCard style={{ padding: "36px 32px", borderRadius: 34, background: "#FFFBF0", border: "1px solid rgba(251,191,36,.16)", minHeight: 260 }}>


              <div style={{ width: 54, height: 54, borderRadius: 18, marginBottom: 20,

                display: "flex", alignItems: "center", justifyContent: "center",

                background: "rgba(251,191,36,.10)", border: "1px solid rgba(251,191,36,.24)", color: "#fbbf24" }}>

                <BarChart3 size={22} />

              </div>

              <div className="fM" style={{ fontSize: 8, color: "rgba(251,191,36,.72)", textTransform: "uppercase", letterSpacing: ".22em", marginBottom: 10 }}>Tele-Rehab</div>

              <h3 className="fB" style={{ fontSize: 22, color: "#0B1E33", letterSpacing: ".04em", marginBottom: 12, lineHeight: 1.05 }}>

                Your doctor sees every session, from anywhere.

              </h3>

              <p className="fS" style={{ fontSize: 14, color: "#374151", lineHeight: 1.75, fontWeight: 300 }}>

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

    { n:"01", c:"#2DD4BF", dir:"left"  as const, t:"Dual-task is the only way.",

      b:"Every other device trains motor OR cognitive. Science requires both simultaneously. ReViveX is the only system built around this clinical truth." },

    { n:"02", c:"#a78bfa", dir:"right" as const, t:"Patients play. They don't quit.",

      b:"Gamification is a proven adherence mechanism. When therapy feels like a game, patients return daily instead of abandoning after week two." },

    { n:"03", c:"#fbbf24", dir:"left"  as const, t:"A doctor is always in the loop.",

      b:"Unlike every home rehab app that sends data nowhere, every session streams live to a verified clinical dashboard. Real oversight drives real outcomes." },

    { n:"04", c:"#34d399", dir:"right" as const, t:"Priced for the world.",

      b:"The entire device costs less than a single hospital physio session. Built to be reproducible, repairable, and accessible to every patient who needs it." },

  ];

  return (

    <section id="why" data-theme="dark" style={{ background: "#0B1E33", padding: "120px 40px", position: "relative", overflow: "hidden" }}>

      <div className="grid-dk" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

      <div style={{ position: "absolute", top: 0, right: 0, width: 500, height: 500, pointerEvents: "none",

        background: "radial-gradient(circle at top right, rgba(251,191,36,.04), transparent 65%)" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        <Reveal dir="zoom" style={{ textAlign: "center", marginBottom: 72 }}>

          <div className="fM" style={{ fontSize: 9, color: "rgba(45,212,191,.5)", textTransform: "uppercase", letterSpacing: ".32em", marginBottom: 16 }}>Why ReViveX</div>

          <h2 className="fB" style={{ fontSize: "clamp(3rem,8vw,7rem)", letterSpacing: ".03em", lineHeight: .9, color: "#fff" }}>

            NOT ANOTHER<br /><span style={{ color: "#2DD4BF" }}>REHAB GADGET.</span>

          </h2>

        </Reveal>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {POINTS.map((pt, i) => (

            <Reveal key={pt.n} dir={pt.dir} delay={i * .1}>

              <TiltCard style={{ padding: "36px 40px", borderRadius: 28,

                display: "grid", gridTemplateColumns: "80px 1fr", gap: 32, alignItems: "center",

                background: "rgba(255,255,255,.022)", borderLeft: `3px solid ${pt.c}`, position: "relative", overflow: "hidden" }}>

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

  const A = ["MOTOR RECOVERY","COGNITIVE TRAINING","GRIP STRENGTH","TREMOR DETECTION","DUAL-TASK PROTOCOL","AI ADAPTATION","TELE-REHABILITATION","NEUROPLASTICITY"];

  const B = ["STROKE RECOVERY","PARKINSON'S CARE","BRAIN INJURY REHAB","ADAPTIVE DIFFICULTY","REAL-TIME FEEDBACK","GAMIFIED THERAPY","HOME-BASED CARE","CLINICAL DASHBOARD"];

  const dot = <span style={{ margin: "0 18px", color: "rgba(45,212,191,.28)" }}>·</span>;

  const makeRow = (items: string[], cls: string) => (

    <div style={{ overflow: "hidden", marginBottom: 8 }}>

      <div className={cls} style={{ display: "flex", whiteSpace: "nowrap", width: "200%" }}>

        {[0, 1].map(r => (

          <span key={r} style={{ width: "50%", display: "inline-block" }}>

            {items.map((t, i) => (

              <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>

                <span className="fB" style={{ fontSize: 13, color: "rgba(255,255,255,.12)", letterSpacing: ".14em" }}>{t}</span>

                {dot}

              </span>

            ))}

          </span>

        ))}

      </div>

    </div>

  );

  return (

    <div style={{ background: "#060f1a", padding: "20px 0",

      borderTop: "1px solid rgba(255,255,255,.04)", borderBottom: "1px solid rgba(255,255,255,.04)", overflow: "hidden" }}>

      {makeRow(A, "mqL")}

      {makeRow(B, "mqR")}

    </div>

  );

}

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

      background: "#060f1a", padding: "120px 40px 60px",

      position: "relative", overflow: "hidden",

      borderTop: "1px solid rgba(45,212,191,.06)",

    }}>

      <div className="glow-breath" style={{ position: "absolute", inset: 0, pointerEvents: "none",

        background: "radial-gradient(ellipse 55% 42% at 50% 92%, rgba(45,212,191,.06), transparent 58%)" }} />

      <div className="fB" style={{ position: "absolute", bottom: 0, left: "50%",

        transform: "translateX(-50%)", fontSize: "clamp(5rem,18vw,17rem)",

        color: "rgba(255,255,255,.012)", letterSpacing: "-0.04em",

        whiteSpace: "nowrap", lineHeight: 1, pointerEvents: "none", userSelect: "none" }}>

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

            <div style={{ padding: "42px 38px", borderRadius: 34,

              background: "rgba(255,255,255,.025)", border: "1px solid rgba(45,212,191,.10)" }}>

              <div className="fM" style={{ fontSize: 9, color: "rgba(45,212,191,.5)",

                textTransform: "uppercase", letterSpacing: ".22em", marginBottom: 28 }}>Get In Touch</div>

              {sent ? (

                <motion.div initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }}

                  style={{ textAlign: "center", padding: "44px 0" }}>

                  <CheckCircle2 size={52} style={{ color: "#2DD4BF", display: "block", margin: "0 auto 18px" }} />

                  <div className="fB" style={{ fontSize: 26, color: "#fff", letterSpacing: ".06em" }}>MESSAGE RECEIVED.</div>

                  <div className="fM" style={{ fontSize: 9, color: "rgba(255,255,255,.25)",

                    textTransform: "uppercase", letterSpacing: ".2em", marginTop: 10 }}>We'll be in touch.</div>

                </motion.div>

              ) : (

                <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                  {[

                    { k: "name",  l: "Name",  t: "text",  ph: "Dr. Sarah Johnson" },

                    { k: "email", l: "Email", t: "email", ph: "hello@hospital.lk" },

                  ].map(f => (

                    <div key={f.k}>

                      <div className="fM" style={{ fontSize: 8, color: "rgba(255,255,255,.28)",

                        textTransform: "uppercase", letterSpacing: ".18em", marginBottom: 9 }}>{f.l}</div>

                      <input type={f.t} placeholder={f.ph} required

                        value={(form as any)[f.k]}

                        onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}

                        className="fS"

                        style={{ width: "100%", padding: "14px 16px", borderRadius: 14, fontSize: 14,

                          color: "rgba(255,255,255,.8)",

                          background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }} />

                    </div>

                  ))}

                  <div>

                    <div className="fM" style={{ fontSize: 8, color: "rgba(255,255,255,.28)",

                      textTransform: "uppercase", letterSpacing: ".18em", marginBottom: 9 }}>Message</div>

                    <textarea rows={4} required placeholder="I'd like to learn more about ReViveX..."

                      value={form.msg}

                      onChange={e => setForm(p => ({ ...p, msg: e.target.value }))}

                      className="fS"

                      style={{ width: "100%", padding: "14px 16px", borderRadius: 14, fontSize: 14,

                        color: "rgba(255,255,255,.8)", resize: "none",

                        background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }} />

                  </div>

                  <MagButton type="submit"

                    className="btn-shim fB"

                    style={{ position: "relative", overflow: "hidden", width: "100%", padding: "18px",

                      borderRadius: 16, fontSize: 15, letterSpacing: ".12em",

                      background: "#2DD4BF", color: "#080f1a", border: "none",

                      boxShadow: "0 0 44px rgba(45,212,191,.3)" }}>

                    <span style={{ position: "relative", zIndex: 1 }}>SEND MESSAGE</span>

                  </MagButton>

                </form>

              )}

            </div>

          </Reveal>



          {/* Info */}

          <Reveal dir="right" delay={.15} style={{ paddingTop: 8 }}>

            <h3 className="fB" style={{ fontSize: "clamp(1.8rem,3vw,2.8rem)", color: "#fff",

              letterSpacing: ".04em", lineHeight: 1.1, marginBottom: 22 }}>

              DESIGNED FOR PATIENTS.<br /><span style={{ color: "#2DD4BF" }}>BUILT FOR IMPACT.</span>

            </h3>

            <p className="fS" style={{ fontSize: 15, color: "rgba(255,255,255,.42)",

              lineHeight: 1.75, fontWeight: 300, marginBottom: 42 }}>

              Whether you're a clinician, a hospital administrator, or a patient wanting

              to take control of your recovery — we'd love to connect.

            </p>

            {[

              { icon: <Mail size={15}/>,  l: "Email",   v: "hello@revivex.io", href: "mailto:hello@revivex.io" },

              { icon: <Phone size={15}/>, l: "Phone",   v: "+94 77 000 0000",  href: "#" },

              { icon: <Globe size={15}/>, l: "Website", v: "www.revivex.io",   href: "#" },

            ].map(c => (

              <a key={c.l} href={c.href} data-mag

                style={{ display: "flex", alignItems: "center", gap: 16,

                  textDecoration: "none", marginBottom: 18, color: "inherit" }}>

                <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0,

                  display: "flex", alignItems: "center", justifyContent: "center",

                  background: "rgba(45,212,191,.08)", border: "1px solid rgba(45,212,191,.18)", color: "#2DD4BF" }}>

                  {c.icon}

                </div>

                <div>

                  <div className="fM" style={{ fontSize: 8, color: "rgba(255,255,255,.22)",

                    textTransform: "uppercase", letterSpacing: ".18em" }}>{c.l}</div>

                  <div className="fS" style={{ fontSize: 14, color: "rgba(255,255,255,.65)" }}>{c.v}</div>

                </div>

              </a>

            ))}

            <div style={{ display: "flex", gap: 12, marginTop: 22 }}>

              {[

                { icon: <Linkedin size={17}/>,  href: "#", label: "LinkedIn"  },

                { icon: <Instagram size={17}/>, href: "#", label: "Instagram" },

              ].map(s => (

                <motion.a key={s.label} href={s.href} data-mag aria-label={s.label}

                  whileHover={{ y: -5, scale: 1.12 }}

                  style={{ width: 50, height: 50, borderRadius: 16, textDecoration: "none",

                    display: "flex", alignItems: "center", justifyContent: "center",

                    background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)",

                    color: "rgba(255,255,255,.45)" }}>

                  {s.icon}

                </motion.a>

              ))}

            </div>

          </Reveal>

        </div>



        <div style={{ marginTop: 80, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,.05)",

          display: "flex", justifyContent: "space-between", alignItems: "center" }}>

          <div className="fB" style={{ fontSize: 20, letterSpacing: ".10em", color: "#fff" }}>

            REVIVE<span style={{ color: "#2DD4BF" }}>X</span>

          </div>

          <div className="fM" style={{ fontSize: 8, color: "rgba(255,255,255,.15)",

            textTransform: "uppercase", letterSpacing: ".22em" }}>

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

    <div className="grain" style={{ overflowX: "hidden", background: "#080f1a" }}>

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

