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