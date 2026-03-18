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

  /* ── CYBER CARD — CSS-only 3D tracker tilt ───────────────────────── */
  .cyber-card-container{position:relative;transition:200ms;user-select:none;-webkit-user-select:none;}
  .cyber-card-container:active{transform:scale(.97);}
  .ctr{position:absolute;inset:0;z-index:200;}
  .ctr-1:hover~.cyber-inner{transform:rotateX(14deg) rotateY(-8deg)}
  .ctr-2:hover~.cyber-inner{transform:rotateX(14deg) rotateY(-4deg)}
  .ctr-3:hover~.cyber-inner{transform:rotateX(14deg) rotateY(0deg)}
  .ctr-4:hover~.cyber-inner{transform:rotateX(14deg) rotateY(4deg)}
  .ctr-5:hover~.cyber-inner{transform:rotateX(14deg) rotateY(8deg)}
  .ctr-6:hover~.cyber-inner{transform:rotateX(7deg) rotateY(-8deg)}
  .ctr-7:hover~.cyber-inner{transform:rotateX(7deg) rotateY(-4deg)}
  .ctr-8:hover~.cyber-inner{transform:rotateX(7deg) rotateY(0deg)}
  .ctr-9:hover~.cyber-inner{transform:rotateX(7deg) rotateY(4deg)}
  .ctr-10:hover~.cyber-inner{transform:rotateX(7deg) rotateY(8deg)}
  .ctr-11:hover~.cyber-inner{transform:rotateX(0deg) rotateY(-8deg)}
  .ctr-12:hover~.cyber-inner{transform:rotateX(0deg) rotateY(-4deg)}
  .ctr-13:hover~.cyber-inner{transform:rotateX(0deg) rotateY(0deg)}
  .ctr-14:hover~.cyber-inner{transform:rotateX(0deg) rotateY(4deg)}
  .ctr-15:hover~.cyber-inner{transform:rotateX(0deg) rotateY(8deg)}
  .ctr-16:hover~.cyber-inner{transform:rotateX(-7deg) rotateY(-8deg)}
  .ctr-17:hover~.cyber-inner{transform:rotateX(-7deg) rotateY(-4deg)}
  .ctr-18:hover~.cyber-inner{transform:rotateX(-7deg) rotateY(0deg)}
  .ctr-19:hover~.cyber-inner{transform:rotateX(-7deg) rotateY(4deg)}
  .ctr-20:hover~.cyber-inner{transform:rotateX(-7deg) rotateY(8deg)}
  .ctr-21:hover~.cyber-inner{transform:rotateX(-14deg) rotateY(-8deg)}
  .ctr-22:hover~.cyber-inner{transform:rotateX(-14deg) rotateY(-4deg)}
  .ctr-23:hover~.cyber-inner{transform:rotateX(-14deg) rotateY(0deg)}
  .ctr-24:hover~.cyber-inner{transform:rotateX(-14deg) rotateY(4deg)}
  .ctr-25:hover~.cyber-inner{transform:rotateX(-14deg) rotateY(8deg)}
  .ctr:hover~.cyber-inner{transition:125ms ease-in-out;filter:brightness(1.08);}
  .cyber-inner{position:absolute;inset:0;border-radius:inherit;transition:700ms;transform-style:preserve-3d;overflow:hidden;}
  .ctr:hover~.cyber-inner .cyber-glare{opacity:1;}
  .ctr:hover~.cyber-inner .cyber-glow-el{opacity:1;}
  .ctr:hover~.cyber-inner .cyber-particle{animation:cyberParticleFloat 2s infinite;}
  .ctr:hover~.cyber-inner::before{opacity:.65;}
  .cyber-inner::before{content:"";position:absolute;inset:-50%;background:radial-gradient(circle,rgba(45,212,191,.08),transparent);filter:blur(20px);opacity:0;transition:opacity .3s;}
  .cyber-glare{position:absolute;inset:0;background:linear-gradient(125deg,rgba(255,255,255,0) 0%,rgba(255,255,255,.05) 50%,rgba(255,255,255,0) 100%);opacity:0;transition:opacity .3s;pointer-events:none;}
  .cyber-glow-el{opacity:0;transition:opacity .3s;}
  @keyframes cyberParticleFloat{0%{transform:translate(0,0);opacity:0;}50%{opacity:1;}100%{transform:translate(calc(var(--px)*28px),calc(var(--py)*28px));opacity:0;}}
  @keyframes cyberLineGrow{0%,100%{transform:scaleX(0);opacity:0;}50%{transform:scaleX(1);opacity:1;}}
  @keyframes cyberScan{0%{transform:translateY(-100%);}100%{transform:translateY(200%);}}
  .cyber-scan{position:absolute;inset:0;transform:translateY(-100%);animation:cyberScan 2.4s linear infinite;pointer-events:none;}
  .cyber-corner-el span{position:absolute;width:14px;height:14px;border:1.5px solid rgba(45,212,191,.28);transition:all .3s;}
  .ctr:hover~.cyber-inner .cyber-corner-el span{border-color:rgba(45,212,191,.80);box-shadow:0 0 8px rgba(45,212,191,.45);}
  .cyber-corner-el span:nth-child(1){top:10px;left:10px;border-right:0;border-bottom:0;}
  .cyber-corner-el span:nth-child(2){top:10px;right:10px;border-left:0;border-bottom:0;}
  .cyber-corner-el span:nth-child(3){bottom:10px;left:10px;border-right:0;border-top:0;}
  .cyber-corner-el span:nth-child(4){bottom:10px;right:10px;border-left:0;border-top:0;}
  .cyber-line{position:absolute;height:1px;width:100%;left:0;transform:scaleX(0);animation:cyberLineGrow 3s linear infinite;pointer-events:none;}
  .cyber-particle{position:absolute;width:3px;height:3px;border-radius:50%;opacity:0;pointer-events:none;}


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
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<"loading"|"exit">("loading");

  useEffect(() => {
    const step = setInterval(() =>
      setPct(p => { if (p >= 100) { clearInterval(step); return 100; } return p + 1; }), 26);
    const t1 = setTimeout(() => setPhase("exit"), 2900);
    const t2 = setTimeout(onDone, 3700);
    return () => { clearInterval(step); clearTimeout(t1); clearTimeout(t2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const PTS = "0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24";

  return (
    <AnimatePresence>
      {phase !== "exit" && (
        <motion.div
          key="pl"
          exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.76,0,0.24,1] } }}
          style={{
            position:"fixed", inset:0, zIndex:9900,
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            background:"#030810",
          }}
        >
          {/* Soft radial glow */}
          <div style={{
            position:"absolute", inset:0, pointerEvents:"none",
            background:"radial-gradient(ellipse 60% 45% at 50% 52%, rgba(45,212,191,0.08) 0%, transparent 70%)",
          }}/>

          {/* Wordmark */}
          <motion.div
            initial={{ opacity:0, y:12 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.15, duration:0.7, ease:[0.22,1,0.36,1] }}
            className="fB"
            style={{ fontSize:"clamp(2.8rem,8vw,6rem)", color:"#fff", letterSpacing:".10em", lineHeight:1, marginBottom:44 }}
          >
            REVIVE<span style={{ color:"#2DD4BF" }}>X</span>
          </motion.div>

          {/* Premium ECG — 5-layer glistening stack */}
          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            transition={{ delay:0.4, duration:0.6 }}
            style={{ marginBottom:40 }}
          >
            <svg viewBox="0 0 64 48" width={200} height={80} style={{ overflow:"visible" }}>
              <defs>
                <linearGradient id="pl-glisten" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#2DD4BF" stopOpacity="0.8"/>
                  <stop offset="42%"  stopColor="#7ffff4" stopOpacity="1"/>
                  <stop offset="50%"  stopColor="#ffffff" stopOpacity="1"/>
                  <stop offset="58%"  stopColor="#7ffff4" stopOpacity="1"/>
                  <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.8"/>
                  <animateTransform attributeName="gradientTransform" type="translate"
                    from="-1 0" to="1 0" dur="1.6s" repeatCount="indefinite"/>
                </linearGradient>
                <filter id="pl-glow" x="-30%" y="-300%" width="160%" height="700%">
                  <feGaussianBlur stdDeviation="2.2" result="b1"/>
                  <feGaussianBlur stdDeviation="5"   result="b2"/>
                  <feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              {/* halo */}
              <polyline points={PTS} fill="none" stroke="#2DD4BF" strokeWidth="5"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ filter:"blur(7px)", opacity:0.35 }}/>
              {/* ghost track */}
              <polyline points={PTS} fill="none" stroke="rgba(45,212,191,0.14)" strokeWidth="5"
                strokeLinecap="round" strokeLinejoin="round"/>
              {/* glow */}
              <polyline points={PTS} fill="none" stroke="#2DD4BF" strokeWidth="3.5"
                strokeLinecap="round" strokeLinejoin="round" filter="url(#pl-glow)" opacity={0.5}/>
              {/* glistening dash */}
              <polyline points={PTS} fill="none" stroke="url(#pl-glisten)" strokeWidth="4.5"
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="48 144" strokeDashoffset="192"
                style={{ animation:"ecg-dash 1.4s linear infinite" }}/>
              {/* hair line */}
              <polyline points={PTS} fill="none" stroke="rgba(255,255,255,0.88)" strokeWidth="1.2"
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="48 144" strokeDashoffset="192"
                style={{ animation:"ecg-dash 1.4s linear infinite" }}/>
            </svg>
          </motion.div>

          {/* Progress bar */}
          <div style={{ width:180, height:1, background:"rgba(255,255,255,.07)", overflow:"hidden", borderRadius:1 }}>
            <motion.div
              animate={{ width:`${pct}%` }}
              transition={{ duration:.04 }}
              style={{
                height:"100%",
                background:"linear-gradient(90deg,#14b8a6,#2DD4BF,#7ffff4)",
                boxShadow:"0 0 14px rgba(45,212,191,.8), 0 0 4px #fff",
              }}
            />
          </div>

          {/* Percentage */}
          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            transition={{ delay:0.5 }}
            className="fM"
            style={{ fontSize:9, color:"rgba(255,255,255,.28)", letterSpacing:".32em",
                     textTransform:"uppercase", marginTop:14 }}
          >
            {String(pct).padStart(3,"0")} %
          </motion.div>
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


// ══ EtherealShadow — animated SVG turbulence displacement for subtle bg ══════
interface EtherealShadowProps {
  color?: string;
  scale?: number;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
}
function EtherealShadow({ color="rgba(45,212,191,0.18)", scale=55, speed=60, className="", style }: EtherealShadowProps) {
  const id = React.useId().replace(/:/g,"");
  const filterId = `eth-${id}`;
  const hueRef  = useRef<SVGFEColorMatrixElement>(null);
  useEffect(() => {
    let rafId = 0, h = 180;
    const tick = () => {
      rafId = requestAnimationFrame(tick);
      h = (h + (101 - speed) * 0.002 + 0.05) % 360;
      hueRef.current?.setAttribute("values", String(h));
    };
    tick();
    return () => cancelAnimationFrame(rafId);
  }, [speed]);
  const disp = scale * 0.8;
  const freq  = `${0.0004 + (100-scale)*0.000003},${0.0016 + (100-scale)*0.000012}`;
  return (
    <div className={className} style={{ position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",...style }}>
      <div style={{ position:"absolute",inset:-disp,filter:`url(#${filterId}) blur(3px)` }}>
        <svg style={{ position:"absolute",width:0,height:0 }}>
          <defs>
            <filter id={filterId}>
              <feTurbulence result="und" numOctaves="2" baseFrequency={freq} seed="0" type="turbulence"/>
              <feColorMatrix ref={hueRef} in="und" type="hueRotate" values="180"/>
              <feColorMatrix in="dist" result="circ" type="matrix"
                values="4 0 0 0 1  4 0 0 0 1  4 0 0 0 1  1 0 0 0 0"/>
              <feDisplacementMap in="SourceGraphic" in2="circ" scale={disp} result="dist"/>
              <feDisplacementMap in="dist" in2="und"  scale={disp} result="out"/>
            </filter>
          </defs>
        </svg>
        <div style={{
          width:"100%", height:"100%",
          backgroundColor: color,
          maskImage:`url('https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png')`,
          maskSize:"cover", maskRepeat:"no-repeat", maskPosition:"center",
        }}/>
      </div>
    </div>
  );
}

// ══ GlobeSpinner — rotating Earth for Footer contact section ═════════════════
function GlobeSpinner({ size=280, className="" }: { size?: number; className?: string }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html:`
        @keyframes earthSpin { 0%{background-position:0 0} 100%{background-position:${size*1.6}px 0} }
        @keyframes globeStar1{0%,100%{opacity:.1}50%{opacity:1}}
        @keyframes globeStar2{0%,100%{opacity:.1}60%{opacity:.8}}
        @keyframes globeAtm { 0%,100%{opacity:.55} 50%{opacity:.9} }
      `}}/>
      {/* Outer atmosphere ring */}
      <div style={{
        position:"absolute", inset:-18, borderRadius:"50%", pointerEvents:"none",
        background:"radial-gradient(ellipse, transparent 58%, rgba(45,212,191,.10) 72%, rgba(45,212,191,.25) 78%, rgba(20,184,166,.08) 88%, transparent 100%)",
        animation:"globeAtm 4s ease-in-out infinite",
      }}/>
      {/* Secondary halo */}
      <div style={{
        position:"absolute", inset:-32, borderRadius:"50%", pointerEvents:"none",
        background:"radial-gradient(ellipse, transparent 65%, rgba(45,212,191,.05) 80%, transparent 100%)",
      }}/>
      {/* Globe body */}
      <div
        className={className}
        style={{
          width:size, height:size, borderRadius:"50%",
          overflow:"hidden", position:"relative",
          backgroundImage:"url('https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/globe.jpeg')",
          backgroundSize:"cover",
          backgroundPosition:"left",
          animation:`earthSpin 30s linear infinite`,
          boxShadow:[
            "0 0 0 1px rgba(45,212,191,.18)",
            "-5px 0 8px rgba(45,212,191,.35) inset",
            "15px 2px 25px rgba(0,0,0,.8) inset",
            "-24px -2px 34px rgba(45,212,191,.15) inset",
            "250px 0 44px rgba(0,0,0,.55) inset",
            "150px 0 38px rgba(0,0,0,.7) inset",
            "0 0 60px rgba(45,212,191,.12)",
          ].join(","),
        }}
      >
        {/* Teal city-lights overlay */}
        <div style={{
          position:"absolute",inset:0,borderRadius:"50%",
          background:"linear-gradient(135deg,rgba(45,212,191,.06) 0%,transparent 50%,rgba(20,184,166,.04) 100%)",
          mixBlendMode:"screen",
        }}/>
        {/* Terminator shadow */}
        <div style={{
          position:"absolute",inset:0,borderRadius:"50%",
          background:"linear-gradient(100deg,transparent 45%,rgba(3,8,20,.82) 100%)",
        }}/>
        {/* Twinkling stars around */}
        {[
          {l:-24,t:10,d:"1.2s"},{l:-44,t:40,d:"0s"},{l:size+8,t:55,d:"2.4s"},
          {l:size-30,t:size+8,d:"0.8s"},{l:20,t:size+12,d:"1.8s"},{l:size+4,t:-14,d:"3s"},
          {l:size+30,t:28,d:"0.4s"},{l:-12,t:size-20,d:"2s"},
        ].map((s,i)=>(
          <div key={i} style={{
            position:"absolute",left:s.l,top:s.t,
            width:2,height:2,borderRadius:"50%",
            background:i%2===0?"#2DD4BF":"#fff",
            opacity:0.6,
            animation:`globeStar${i%2+1} ${2+i*0.4}s ${s.d} ease-in-out infinite`,
            boxShadow:i%2===0?"0 0 4px #2DD4BF":"0 0 3px #fff",
          }}/>
        ))}
      </div>
    </>
  );
}


// ══ CyberCard — CSS-only 3D tracker tilt, no styled-components ═══════════════
interface CyberCardProps {
  children: React.ReactNode;
  accentColor?: string;     // hex like "#2DD4BF"
  accentRgb?: string;       // "45,212,191"
  style?: React.CSSProperties;
  className?: string;
}
function CyberCard({ children, accentColor="#2DD4BF", accentRgb="45,212,191", style, className="" }: CyberCardProps) {
  // 25 tracker zones for smooth CSS-only 3D tilt
  const trackers = Array.from({ length: 25 }, (_, i) => i + 1);
  return (
    <div className={`cyber-card-container ${className}`} style={{ ...style }}>
      <div className="cyber-card-canvas" style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gridTemplateRows:"repeat(5,1fr)", position:"absolute", inset:0, zIndex:20 }}>
        {trackers.map(n => (
          <div key={n} className={`ctr ctr-${n}`} />
        ))}
        {/* The actual card — after all trackers so CSS sibling selector works */}
        <div className="cyber-inner" style={{
          background:`linear-gradient(145deg, rgba(${accentRgb},.05) 0%, rgba(8,14,26,.95) 60%)`,
          border:`1px solid rgba(${accentRgb},.18)`,
          boxShadow:`0 0 28px rgba(${accentRgb},.07), inset 0 1px 0 rgba(${accentRgb},.08)`,
          borderRadius:"inherit",
        }}>
          <div className="cyber-glare"/>
          {/* Animated scan lines */}
          <div aria-hidden style={{ position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden" }}>
            {[18,36,55,74].map((top,i) => (
              <div key={i} className="cyber-line" style={{
                top:`${top}%`,
                background:`linear-gradient(90deg,transparent,rgba(${accentRgb},.18),transparent)`,
                animationDelay:`${i*0.8}s`,
                transformOrigin: i%2===0?"left":"right",
              }}/>
            ))}
          </div>
          {/* Corner bracket elements */}
          <div className="cyber-corner-el" aria-hidden>
            <span/><span/><span/><span/>
          </div>
          {/* Scan sweep */}
          <div className="cyber-scan" style={{ background:`linear-gradient(to bottom,transparent,rgba(${accentRgb},.06),transparent)` }}/>
          {/* Ambient glow blobs */}
          <div className="cyber-glow-el" style={{ position:"absolute",inset:0,pointerEvents:"none" }}>
            <div style={{ position:"absolute",top:-20,left:-20,width:100,height:100,borderRadius:"50%",background:`radial-gradient(circle,rgba(${accentRgb},.20) 0%,transparent 70%)`,filter:"blur(14px)" }}/>
            <div style={{ position:"absolute",bottom:-20,right:10,width:90,height:90,borderRadius:"50%",background:`radial-gradient(circle,rgba(${accentRgb},.14) 0%,transparent 70%)`,filter:"blur(12px)" }}/>
          </div>
          {/* Floating particles */}
          <div aria-hidden style={{ position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden" }}>
            {[{px:1,py:-1,t:40,l:20},{px:-1,py:-1,t:60,r:20},{px:.5,py:1,t:22,l:42},{px:-.5,py:1,t:78,r:38}].map((p,i)=>(
              <div key={i} className="cyber-particle"
                style={{ top:`${p.t}%`, left:p.l?`${p.l}%`:undefined, right:(p as any).r?`${(p as any).r}%`:undefined,
                  background:accentColor, boxShadow:`0 0 6px ${accentColor}`,
                  ['--px' as any]:p.px, ['--py' as any]:p.py,
                  animationDelay:`${i*0.4}s` }}/>
            ))}
          </div>
          {/* Content */}
          <div style={{ position:"relative",zIndex:2,width:"100%",height:"100%" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavShinyButton({ children, href }: { children: React.ReactNode; href?: string }) {
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
        : <button className="nav-shiny"><span>{children}</span></button>
      }
    </>
  );
}

function Navbar() {
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
      {/* ─── Glass pill ─────────────────────────────────────────────────
          Uses backgroundColor (not background shorthand) to prevent the
          React "conflicting property" warning.
          Gradient border done as a separate absolutely-positioned element. */}
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
        {/* Gradient bottom border — separate div, no shorthand conflict */}
        <div style={{
          position: "absolute", bottom: 0, left: "8%", right: "8%", height: 1,
          background: "linear-gradient(90deg, transparent, rgba(45,212,191,.22), transparent)",
          opacity: scrolled ? 1 : 0.45,
          transition: "opacity .5s",
          pointerEvents: "none",
        }} />

        {/* Logo */}
        <div className="fB" style={{ fontSize: 20, letterSpacing: ".1em", color: "#fff", flexShrink: 0 }}>
          REVIVE<span style={{ color: "#2DD4BF" }}>X</span>
        </div>

        {/* Nav links — text-shadow glow on hover */}
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

        {/* ShinyButton CTA */}
        <NavShinyButton href="#contact">Get Started</NavShinyButton>
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
  const words = ["RECOVERY.", "MOTIVATION.", "THE BRAIN.", "PHYSIOTHERAPY.", "NEUROPLASTICITY."];
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
    let particleMat: any = null;
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
      scene.background = new THREE.Color(0x080f1a);
      scene.fog = new THREE.FogExp2(0x080f1a, 0.018);
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
      renderer.toneMapping = (THREE as any).ACESFilmicToneMapping; renderer.toneMappingExposure = 1.6;

      // Particles — sparse halo, never overlapping model
      const N = 300;
      const pPos = new Float32Array(N*3), pCol = new Float32Array(N*3), pSz = new Float32Array(N);
      const CT = new THREE.Color("#2DD4BF"), CP = new THREE.Color("#a78bfa"), CW = new THREE.Color("#ddeeff");
      for (let i = 0; i < N; i++) {
        const angle = Math.random()*Math.PI*2, radius = 8+Math.random()*22, depth = -8-Math.random()*35;
        pPos[i*3]=Math.cos(angle)*radius; pPos[i*3+1]=Math.sin(angle)*radius*.55; pPos[i*3+2]=depth;
        const r=Math.random(), col=r<.4?CT:r<.7?CP:CW; pCol[i*3]=col.r;pCol[i*3+1]=col.g;pCol[i*3+2]=col.b; pSz[i]=Math.random()*1.2+.25;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute("position",new THREE.BufferAttribute(pPos,3));
      pGeo.setAttribute("aColor",new THREE.BufferAttribute(pCol,3));
      pGeo.setAttribute("aSize",new THREE.BufferAttribute(pSz,1));
      particleMat = new THREE.ShaderMaterial({ uniforms:{time:{value:0}},
        vertexShader:`attribute float aSize;attribute vec3 aColor;varying vec3 vCol;uniform float time;void main(){vCol=aColor;vec3 p=position;p.x+=sin(time*.25+p.z*.08)*.3;p.y+=cos(time*.20+p.z*.06)*.22;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=aSize*(280./-mv.z);gl_Position=projectionMatrix*mv;}`,
        fragmentShader:`varying vec3 vCol;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float a=(1.-smoothstep(0.,.5,d))*.70;gl_FragColor=vec4(vCol,a);}`,
        transparent:true, blending:THREE.AdditiveBlending, depthWrite:false });
      scene.add(new THREE.Points(pGeo, particleMat));

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
      const onPM = (e: PointerEvent) => { if(!isDragging)return; const dx=e.clientX-lastDragX,dy=e.clientY-lastDragY; rotY-=dx*.012; velY=-dx*.012; rotX+=dy*.012; lastDragX=e.clientX; lastDragY=e.clientY; if(model){model.rotation.y=rotY;model.rotation.x=rotX;} };
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
        const zoomP=eo(cl(p,0,.55)), cameraZ=lp(100,4.0,zoomP), slideP=eio(cl(p,.52,.74));
        const cameraX=lp(0,-2.6,slideP), cameraY=lp(0,.2,zoomP), plungeP=eo(cl(p,.88,1.0));
        camera.position.set(cameraX, lp(cameraY,-8,plungeP), lp(cameraZ,-20,plungeP));
        camera.lookAt(cameraX*.3,.2,0);
        if(tealL) tealL.intensity=5.0+Math.sin(t*1.3)*.9;
        if(purpL) purpL.intensity=3.2+Math.sin(t*.9+1)*.6;
        if(model){
          modelPosX=lp(0,1.65,slideP); model.position.x=model.position.x+(modelPosX-model.position.x)*.08;
          const faceP=cl(p,.48,.66);
          if(faceP>0&&!isDragging){rotY=lp(rotY,0,faceP*.10);rotX=lp(rotX,0,faceP*.09);}
          if(faceP>=.97&&!lockedFace){lockedFace=true;cv.style.cursor="grab";}
          if(!isDragging){velY*=.90;rotY+=velY;if(!lockedFace)rotY+=.004*(1-faceP);}
          model.rotation.y=rotY; model.rotation.x=rotX;
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
              IoT-powered therapy that turns repetitive exercises into <span style={{ color:"rgba(255,255,255,.90)",fontWeight:500 }}>immersive games</span>.
              <br />Patients recover because they <span style={{ color:"#2DD4BF",fontWeight:600 }}>want</span> to.
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
        <div style={{ position:"absolute",inset:0,zIndex:1,pointerEvents:"none",background:"linear-gradient(90deg,rgba(8,15,26,.90) 0%,rgba(8,15,26,.60) 48%,transparent 100%)" }} />

        {/* VOID — opacity driven by MotionValue, no React re-render */}
        <motion.div style={{ ...absC, zIndex:10, opacity:voidOp }}>
          {([{top:28,left:28,borderTop:"1px solid rgba(45,212,191,.28)",borderLeft:"1px solid rgba(45,212,191,.28)"},{top:28,right:28,borderTop:"1px solid rgba(45,212,191,.28)",borderRight:"1px solid rgba(45,212,191,.28)"},{bottom:28,left:28,borderBottom:"1px solid rgba(45,212,191,.28)",borderLeft:"1px solid rgba(45,212,191,.28)"},{bottom:28,right:28,borderBottom:"1px solid rgba(45,212,191,.28)",borderRight:"1px solid rgba(45,212,191,.28)"}] as React.CSSProperties[]).map((s,i)=>(
            <div key={i} style={{ position:"absolute",width:24,height:24,pointerEvents:"none",...s }} />
          ))}
          <div className="fM" style={{ fontSize:"clamp(.44rem,.82vw,.70rem)",color:"rgba(45,212,191,.45)",textTransform:"uppercase",letterSpacing:".55em",marginBottom:28,textAlign:"center",display:"flex",alignItems:"center",gap:12,justifyContent:"center" }}>
            <span style={{ width:22,height:1,background:"rgba(45,212,191,.35)",display:"inline-block" }} /> REVIVEX PLATFORM v1.2 <span style={{ width:22,height:1,background:"rgba(45,212,191,.35)",display:"inline-block" }} />
          </div>
          <div className="fB" style={{ fontSize:"clamp(3rem,7.5vw,7rem)",color:"#fff",letterSpacing:".06em",lineHeight:0.92,textAlign:"center" }}>
            NEURAL LINK<br /><span style={{ color:"#2DD4BF",textShadow:"0 0 60px rgba(45,212,191,.45)" }}>ESTABLISHED.</span>
          </div>
          <div style={{ width:"clamp(120px,18vw,200px)",height:1,background:"linear-gradient(90deg,transparent,rgba(45,212,191,.45),transparent)",margin:"28px auto" }} />
          <div className="fM" style={{ fontSize:"clamp(.38rem,.72vw,.60rem)",color:"rgba(255,255,255,.16)",textTransform:"uppercase",letterSpacing:".48em",textAlign:"center" }}>Scroll to initiate sequence</div>
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
              IoT-powered therapy that turns repetitive exercises into{" "}
              <span style={{ color:"rgba(255,255,255,.85)",fontWeight:500 }}>immersive games</span>.
              <br />Patients recover because they <span style={{ color:"#2DD4BF",fontWeight:600 }}>want</span> to.
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
  const realX     = useTransform(p,[t1,t2],[800,0]);
  const realScale = useTransform(p,[t2,t3],[1,11]);
  const realOp    = useTransform(p,[t1,t2,t3],[0,1,0]);
  const statY     = useTransform(p,[t2,t3],[800,0]);
  const statScale = useTransform(p,[t3,t4],[1,9]);
  const statOp    = useTransform(p,[t2,t3,t4],[0,1,0]);
  const subOp     = useTransform(p,[t3+.08,t3+.18,t4],[0,1,1]);
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
          <motion.div style={{ x:realX,scale:realScale,opacity:realOp,willChange:"transform,opacity" }}>
            <span className="fB" style={{ fontSize:"clamp(4rem,10vw,10rem)",color:"#ef4444",letterSpacing:"-.02em",display:"block",textShadow:"0 0 80px rgba(239,68,68,.45)" }}>IS REAL.</span>
          </motion.div>
        </div>
        <div style={{ ...C,zIndex:3 }}>
          <motion.div style={{ opacity:statOp,scale:statScale,y:statY,willChange:"transform,opacity",textAlign:"center" }}>
            <span className="fB" style={{ fontSize:"clamp(6rem,16vw,16rem)",color:"#ef4444",letterSpacing:"-.03em",display:"block",textShadow:"0 0 120px rgba(239,68,68,.55)" }}>28%</span>
          </motion.div>
        </div>
        {/* Subtitle — dead center between stat cards, cinematic scale */}
        <motion.div style={{ position:"absolute",inset:0,zIndex:6,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",opacity:subOp,pointerEvents:"none" }}>
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:12 }}>
            <div style={{ width:64,height:1,background:"linear-gradient(90deg,transparent,rgba(239,68,68,.65),transparent)" }} />
            <div className="fB" style={{
              color:"rgba(255,255,255,.82)",
              fontSize:"clamp(1.2rem,2.2vw,2rem)",
              textTransform:"uppercase",
              letterSpacing:".14em",
              lineHeight:1.25,
              textShadow:"0 0 40px rgba(239,68,68,.40), 0 2px 20px rgba(0,0,0,.6)",
            }}>
              Of patients quit<br />physiotherapy at home
            </div>
            <div style={{ width:64,height:1,background:"linear-gradient(90deg,transparent,rgba(239,68,68,.65),transparent)" }} />
          </div>
        </motion.div>
        <motion.div style={{ position:"absolute",inset:0,opacity:cardsOp,pointerEvents:"none",zIndex:4 }}>
          {[{v:"80%",l:"Drop-out rate",x:-38,y:-24},{v:"$50K+",l:"Robotic cost",x:38,y:-22},{v:"6–12m",l:"Recovery time",x:-38,y:30},{v:"3 wks",l:"Before they quit",x:38,y:28}].map(s=>(
            <div key={s.v} style={{ position:"absolute",left:`calc(50% + ${s.x}vw)`,top:`calc(50% + ${s.y}vh)`,transform:"translate(-50%,-50%)" }}>
              <div style={{ textAlign:"center",padding:"14px 22px",borderRadius:16,background:"linear-gradient(145deg,rgba(18,4,4,.96),rgba(12,2,2,.98))",border:"1px solid rgba(239,68,68,.22)",backdropFilter:"blur(20px)" }}>
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

}


//  DARK BRIDGE 

// ══ NEURAL BRIDGE — Three.js + GSAP scroll-driven dataverse ══════════════════
// ══ NEURAL LATTICE — 3-D Interconnected Node Graph Scroll Journey ════════════
// Engine: Three.js + GSAP ScrollTrigger
// Art: node cloud + LineSegments web, UnrealBloom post-process
// Camera: flies through the lattice on scroll
// Memory-safe: isMounted flag, forceContextLoss, full dispose chain
// ══════════════════════════════════════════════════════════════════════════════
// ══ NEURAL BRIDGE — GLSLHills Perlin mountains + shader grid + scroll journey ══
function NeuralBridge() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const stage0Ref    = useRef<HTMLDivElement>(null);
  const stage1Ref    = useRef<HTMLDivElement>(null);
  const stage2Ref    = useRef<HTMLDivElement>(null);
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    const canvas    = canvasRef.current;
    if (!container || !canvas || typeof window === "undefined") return;

    let rafId = 0, renderer: any = null, isVisible = false;
    let stInstances: any[] = [];

    // ── Lazy boot ──────────────────────────────────────────────────────────
    let didInit = false;
    const bootObs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !didInit) {
        didInit = true; isVisible = true;
        bootObs.disconnect();
        initScene();
      }
    }, { rootMargin: "300px" });
    if (container) bootObs.observe(container);

    async function initScene() {
      const THREE     = await import("three");
      const { gsap }  = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      (window as any).__gsap__ = { gsap, ScrollTrigger };

      // ── Scene + camera ────────────────────────────────────────────────────
      const scene: any  = new THREE.Scene();
      const bgColor0    = new THREE.Color(0x040c18); // navy   — stage 0
      const bgColor1    = new THREE.Color(0x060414); // purple — stage 1
      const bgColor2    = new THREE.Color(0x030d12); // teal   — stage 2
      scene.background  = bgColor0.clone();
      scene.fog         = new THREE.FogExp2(0x040c18, 0.0014);

      const W = window.innerWidth, H = window.innerHeight;
      const camera: any = new THREE.PerspectiveCamera(55, W/H, 0.1, 2000);
      camera.position.set(0, 22, 120);

      // Target look-at per stage (interpolated by scroll)
      const lookTargets = [
        new THREE.Vector3(0,  12, -260),   // stage 0 — wide horizon
        new THREE.Vector3(-18, 8, -480),   // stage 1 — drift left, deeper
        new THREE.Vector3(14, 18, -680),   // stage 2 — right, higher, far
      ];
      const smoothLook = lookTargets[0].clone();
      const targetLook = lookTargets[0].clone();

      const _ce = console.error; console.error = () => {};
      try {
        renderer = new THREE.WebGLRenderer({
          canvas: canvas as HTMLCanvasElement, antialias: true,
          alpha: false, powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
        });
      } catch(e) { console.error = _ce; setWebglOk(false); return; }
      console.error = _ce;
      if (!renderer) return;
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.3));
      renderer.setClearColor(0x040c18, 1);
      (renderer as any).outputColorSpace = "srgb";

      // ── Perlin noise GLSL (from GLSLHills) ───────────────────────────────
      const PERLIN_GLSL = `
        vec3 mod289v3(vec3 x){return x-floor(x*(1./289.))*289.;}
        vec4 mod289v4(vec4 x){return x-floor(x*(1./289.))*289.;}
        vec4 permute(vec4 x){return mod289v4(((x*34.)+1.)*x);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
        vec3 fade(vec3 t){return t*t*t*(t*(t*6.-15.)+10.);}
        float cnoise(vec3 P){
          vec3 Pi0=floor(P),Pi1=Pi0+1.;
          Pi0=mod289v3(Pi0);Pi1=mod289v3(Pi1);
          vec3 Pf0=fract(P),Pf1=Pf0-1.;
          vec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x);
          vec4 iy=vec4(Pi0.yy,Pi1.yy);
          vec4 iz0=Pi0.zzzz,iz1=Pi1.zzzz;
          vec4 ixy=permute(permute(ix)+iy);
          vec4 ixy0=permute(ixy+iz0),ixy1=permute(ixy+iz1);
          vec4 gx0=ixy0*(1./7.),gy0=fract(floor(gx0)*(1./7.))-.5;
          gx0=fract(gx0);
          vec4 gz0=vec4(.5)-abs(gx0)-abs(gy0);
          vec4 sz0=step(gz0,vec4(0.));
          gx0-=sz0*(step(0.,gx0)-.5);gy0-=sz0*(step(0.,gy0)-.5);
          vec4 gx1=ixy1*(1./7.),gy1=fract(floor(gx1)*(1./7.))-.5;
          gx1=fract(gx1);
          vec4 gz1=vec4(.5)-abs(gx1)-abs(gy1);
          vec4 sz1=step(gz1,vec4(0.));
          gx1-=sz1*(step(0.,gx1)-.5);gy1-=sz1*(step(0.,gy1)-.5);
          vec3 g000=vec3(gx0.x,gy0.x,gz0.x),g100=vec3(gx0.y,gy0.y,gz0.y);
          vec3 g010=vec3(gx0.z,gy0.z,gz0.z),g110=vec3(gx0.w,gy0.w,gz0.w);
          vec3 g001=vec3(gx1.x,gy1.x,gz1.x),g101=vec3(gx1.y,gy1.y,gz1.y);
          vec3 g011=vec3(gx1.z,gy1.z,gz1.z),g111=vec3(gx1.w,gy1.w,gz1.w);
          vec4 norm0=taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
          g000*=norm0.x;g010*=norm0.y;g100*=norm0.z;g110*=norm0.w;
          vec4 norm1=taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
          g001*=norm1.x;g011*=norm1.y;g101*=norm1.z;g111*=norm1.w;
          float n000=dot(g000,Pf0),n100=dot(g100,vec3(Pf1.x,Pf0.yz));
          float n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z)),n110=dot(g110,vec3(Pf1.xy,Pf0.z));
          float n001=dot(g001,vec3(Pf0.xy,Pf1.z)),n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));
          float n011=dot(g011,vec3(Pf0.x,Pf1.yz)),n111=dot(g111,Pf1);
          vec3 fade_xyz=fade(Pf0);
          vec4 n_z=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
          vec2 n_yz=mix(n_z.xy,n_z.zw,fade_xyz.y);
          return 2.2*mix(n_yz.x,n_yz.y,fade_xyz.x);
        }`;

      // ── Build one Perlin mountain mesh ────────────────────────────────────
      // planeSize=256, 256 segments — same as GLSLHills
      const PLANE = 256;
      const mountainMats: any[] = [];

      interface LayerDef {
        z: number; speed: number; amplitude: number;
        r: number; g: number; b: number;   // ridge colour
        opacity: number; timeOffset: number;
      }
      const layers: LayerDef[] = [
        { z:  -20, speed:0.28, amplitude:0.85, r:0.11,g:0.20,b:0.30, opacity:0.92, timeOffset:0.0   }, // front — deep navy
        { z:  -80, speed:0.22, amplitude:1.10, r:0.10,g:0.35,b:0.38, opacity:0.82, timeOffset:1.3   }, // navy→teal
        { z: -160, speed:0.18, amplitude:1.35, r:0.05,g:0.45,b:0.42, opacity:0.68, timeOffset:2.8   }, // teal
        { z: -260, speed:0.14, amplitude:1.60, r:0.22,g:0.18,b:0.50, opacity:0.52, timeOffset:4.1   }, // teal→purple
        { z: -370, speed:0.10, amplitude:1.80, r:0.35,g:0.12,b:0.60, opacity:0.35, timeOffset:5.7   }, // deep purple bg
      ];

      const mountainMeshes: any[] = [];

      layers.forEach((layer) => {
        const mat: any = new THREE.RawShaderMaterial({
          uniforms: {
            time:      { value: layer.timeOffset },
            speed:     { value: layer.speed },
            amplitude: { value: layer.amplitude },
            ridgeR:    { value: layer.r },
            ridgeG:    { value: layer.g },
            ridgeB:    { value: layer.b },
            opacity:   { value: layer.opacity },
          },
          vertexShader: `
            precision highp float;
            attribute vec3 position;
            uniform mat4 projectionMatrix;
            uniform mat4 modelViewMatrix;
            uniform float time;
            uniform float speed;
            uniform float amplitude;
            varying vec3 vPos;
            varying float vHeight;
            varying float vDist;

            ${PERLIN_GLSL}

            mat4 rotX(float r){
              return mat4(1,0,0,0, 0,cos(r),-sin(r),0, 0,sin(r),cos(r),0, 0,0,0,1);
            }
            void main(){
              vec3 p=(rotX(radians(90.))*vec4(position,1.)).xyz;
              float edge=sin(radians(p.x/128.*90.));  // GLSLHills edge fade
              vec3 np=p+vec3(0.,0.,time*-30.*speed);
              float n1=cnoise(np*0.08);
              float n2=cnoise(np*0.055);
              float n3=cnoise(np*0.38);
              float disp=(n1*edge*9.+n2*edge*9.+n3*(abs(edge)*2.2+0.4)+pow(edge,2.)*44.)*amplitude;
              vec3 fp=p+vec3(0.,disp,0.);
              vPos=fp;
              vHeight=disp;
              vDist=length((modelViewMatrix*vec4(fp,1.)).xyz);
              gl_Position=projectionMatrix*modelViewMatrix*vec4(fp,1.);
            }`,
          fragmentShader: `
            precision highp float;
            uniform float ridgeR,ridgeG,ridgeB,opacity;
            varying vec3 vPos;
            varying float vHeight;
            varying float vDist;
            void main(){
              // Distance fade — same GLSLHills formula
              float distFade=(110.-vDist)/280.*opacity;
              distFade=clamp(distFade,0.,1.);
              // Height tint — ridges glow brighter
              float heightFactor=clamp((vHeight+8.)/32.,0.,1.);
              // Base dark colour that brightens toward ridge
              vec3 base=vec3(ridgeR,ridgeG,ridgeB);
              vec3 dark=base*0.18;
              vec3 col=mix(dark,base,heightFactor*heightFactor);
              // Specular ridge sparkle
              float sparkle=pow(heightFactor,4.)*0.55;
              col+=vec3(sparkle*0.5,sparkle*0.9,sparkle)*vec3(ridgeR+0.2,ridgeG+0.3,ridgeB+0.4);
              gl_FragColor=vec4(col,distFade*distFade);
            }`,
          transparent: true,
          blending: THREE.NormalBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        mountainMats.push(mat);
        const geo: any = new THREE.PlaneGeometry(PLANE, PLANE, PLANE, PLANE);
        const mesh: any = new THREE.Mesh(geo, mat);
        mesh.position.set(0, -22, layer.z);
        mesh.userData.baseZ = layer.z;
        scene.add(mesh);
        mountainMeshes.push(mesh);
      });

      // ── Shader grid floor — distance-fade lines ────────────────────────────
      const gridMat: any = new THREE.ShaderMaterial({
        uniforms: {
          time:   { value: 0 },
          colR:   { value: 0.18 },
          colG:   { value: 0.83 },
          colB:   { value: 0.75 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying float vDist;
          void main(){
            vUv=uv;
            vec4 mv=modelViewMatrix*vec4(position,1.);
            vDist=-mv.z;
            gl_Position=projectionMatrix*mv;
          }`,
        fragmentShader: `
          precision highp float;
          uniform float time,colR,colG,colB;
          varying vec2 vUv;
          varying float vDist;
          void main(){
            // Two-scale grid: coarse + fine
            vec2 g1=abs(fract(vUv*24.-0.5)-0.5)/fwidth(vUv*24.);
            vec2 g2=abs(fract(vUv*96.-0.5)-0.5)/fwidth(vUv*96.);
            float line1=1.-min(min(g1.x,g1.y),1.);
            float line2=(1.-min(min(g2.x,g2.y),1.))*0.35;
            float grid=max(line1,line2);
            // Distance fade — strong falloff
            float fade=clamp(1.-vDist/520.,0.,1.);
            fade=fade*fade*fade;
            // Subtle pulse
            float pulse=0.78+0.22*sin(time*0.6+vUv.y*12.);
            float alpha=grid*fade*pulse*0.55;
            gl_FragColor=vec4(colR,colG,colB,alpha);
          }`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        extensions: { derivatives: true } as any,
      });
      const gridGeo: any = new THREE.PlaneGeometry(600, 600, 1, 1);
      const gridMesh: any = new THREE.Mesh(gridGeo, gridMat);
      gridMesh.rotation.x = -Math.PI / 2;
      gridMesh.position.set(0, -28, -200);
      scene.add(gridMesh);

      // ── Sparse background particles (neural haze) ─────────────────────────
      const N = 600;
      const pPos = new Float32Array(N*3), pCol = new Float32Array(N*3);
      const CT = new THREE.Color(0x1a6a60), CP = new THREE.Color(0x4a3268), CW = new THREE.Color(0x6688aa);
      for (let i = 0; i < N; i++) {
        const r=180+Math.random()*900, th=Math.random()*Math.PI*2, ph=Math.acos(Math.random()*2-1);
        pPos[i*3]=r*Math.sin(ph)*Math.cos(th); pPos[i*3+1]=r*Math.sin(ph)*Math.sin(th); pPos[i*3+2]=r*Math.cos(ph);
        const rr=Math.random(), col=rr<0.35?CT:rr<0.65?CP:CW;
        pCol[i*3]=col.r; pCol[i*3+1]=col.g; pCol[i*3+2]=col.b;
      }
      const pGeo: any = new THREE.BufferGeometry();
      pGeo.setAttribute("position",new THREE.BufferAttribute(pPos,3));
      pGeo.setAttribute("aColor",  new THREE.BufferAttribute(pCol,3));
      const starMat: any = new THREE.ShaderMaterial({
        uniforms:{ time:{value:0} },
        vertexShader:`
          attribute vec3 aColor; varying vec3 vCol; uniform float time;
          void main(){
            vCol=aColor; vec3 p=position;
            float a=time*0.028;
            mat2 rot=mat2(cos(a),-sin(a),sin(a),cos(a));
            p.xy=rot*p.xy;
            p.x+=sin(time*0.18+p.z*0.005)*2.2;
            p.y+=cos(time*0.14+p.z*0.004)*1.4;
            vec4 mv=modelViewMatrix*vec4(p,1.);
            gl_PointSize=2.4*(280./-mv.z);
            gl_Position=projectionMatrix*mv;
          }`,
        fragmentShader:`
          varying vec3 vCol;
          void main(){
            float d=length(gl_PointCoord-vec2(0.5));
            if(d>0.5)discard;
            float a=(1.-smoothstep(0.,0.5,d))*0.75;
            gl_FragColor=vec4(vCol,a);
          }`,
        transparent:true, blending:THREE.AdditiveBlending, depthWrite:false,
      });
      scene.add(new THREE.Points(pGeo, starMat));

      // ── Synapse connection lines ───────────────────────────────────────────
      const synapseGroup: any = new THREE.Group();
      for (let i = 0; i < 14; i++) {
        const pts2: any[] = [];
        let sx=(Math.random()-.5)*700, sy=(Math.random()-.5)*380, sz=-80-Math.random()*600;
        const segs=3+Math.floor(Math.random()*4);
        for(let j=0;j<=segs;j++){
          pts2.push(new THREE.Vector3(sx,sy,sz));
          sx+=(Math.random()-.5)*160; sy+=(Math.random()-.5)*100;
        }
        const lGeo: any = new THREE.BufferGeometry().setFromPoints(pts2);
        const rr=Math.random();
        synapseGroup.add(new THREE.Line(lGeo, new THREE.LineBasicMaterial({
          color: rr<0.45?0x2DD4BF:rr<0.75?0x7360a9:0xffffff,
          transparent:true, opacity:0.10+Math.random()*0.18,
          blending:THREE.AdditiveBlending,
        })));
      }
      scene.add(synapseGroup);

      // ── GSAP scroll ────────────────────────────────────────────────────────
      const camPositions = [
        { x:0,  y:22, z:120 },
        { x:-8, y:16, z:-80 },
        { x:8,  y:28, z:-520},
      ];
      const targetCam = { ...camPositions[0] };
      const smoothCam = { ...camPositions[0] };
      const bgWork = { r:bgColor0.r, g:bgColor0.g, b:bgColor0.b };

      const st0 = ScrollTrigger.create({
        trigger: container, start:"top top", end:"bottom bottom", scrub:1.6,
        onUpdate:(self:any)=>{
          const p=self.progress;
          const seg=Math.min(Math.floor(p*2),1), sp=(p*2)%1;
          const from=camPositions[seg], to=camPositions[seg+1]||camPositions[2];
          targetCam.x=from.x+(to.x-from.x)*sp;
          targetCam.y=from.y+(to.y-from.y)*sp;
          targetCam.z=from.z+(to.z-from.z)*sp;

          // lerp look-at target
          const li=Math.min(Math.floor(p*3),2);
          const lp=(p*3)%1;
          const lA=lookTargets[li], lB=lookTargets[Math.min(li+1,2)];
          targetLook.set(lA.x+(lB.x-lA.x)*lp, lA.y+(lB.y-lA.y)*lp, lA.z+(lB.z-lA.z)*lp);

          // background colour cross-fade: navy→purple(stage1)→teal-dark(stage2)
          const c0=bgColor0, c1=bgColor1, c2=bgColor2;
          let bg:any;
          if(p<0.45){ bg=c0.clone().lerp(c1, p/0.45); }
          else if(p<0.72){ bg=c1.clone().lerp(c2,(p-0.45)/0.27); }
          else{ bg=c2; }
          bgWork.r=bg.r; bgWork.g=bg.g; bgWork.b=bg.b;

          // parallax scroll mountains
          mountainMeshes.forEach((m)=>{
            const spd=0.5+Math.abs(m.userData.baseZ)*0.0012;
            m.position.z=m.userData.baseZ+p*spd*320;
          });
          gridMesh.position.z = -200 + p * 280;
          synapseGroup.rotation.y = p * 0.7;
        },
      });
      stInstances.push(st0);

      // Stage text fades
      const textStages = [
        { ref:stage0Ref, start:"top top",  end:"20% top",  mode:0 },
        { ref:stage1Ref, start:"24% top",  end:"56% top",  mode:1 },
        { ref:stage2Ref, start:"60% top",  end:"96% top",  mode:2 },
      ];
      textStages.forEach(({ref:stRef,start,end,mode})=>{
        if(!stRef.current) return;
        const el=stRef.current;
        const st=ScrollTrigger.create({
          trigger:container, start, end, scrub:true,
          onUpdate:(self:any)=>{
            const p2=self.progress;
            let op=1, ty=0;
            if(mode===0){ op=Math.pow(Math.max(0,1-p2*1.5),1.4); ty=-p2*45; }
            else if(mode===1){
              const inP=Math.min(p2/0.3,1), outP=Math.max(0,(p2-0.72)/0.28);
              op=inP*(1-outP); ty=(1-Math.pow(inP,0.5))*40-outP*35;
            } else {
              const inP=Math.min(p2/0.25,1); op=inP; ty=(1-Math.pow(inP,0.5))*35;
            }
            el.style.opacity=String(Math.max(0,op));
            el.style.transform=`translateY(${ty}px)`;
          },
        });
        stInstances.push(st);
      });

      // ── Resize ─────────────────────────────────────────────────────────────
      const onResize=()=>{
        const w=window.innerWidth,h=window.innerHeight;
        camera.aspect=w/h; camera.updateProjectionMatrix();
        renderer.setSize(w,h);
      };
      window.addEventListener("resize",onResize);

      // ── Visibility observer ─────────────────────────────────────────────────
      const visObs=new IntersectionObserver(e=>{isVisible=e[0].isIntersecting;},{rootMargin:"80px"});
      if(container) visObs.observe(container);

      // ── RAF ─────────────────────────────────────────────────────────────────
      let firstFrame=true;
      const draw=()=>{
        rafId=requestAnimationFrame(draw);
        if(!isVisible||document.hidden) return;
        const t=Date.now()*0.001;

        // Update mountain time uniforms — each layer drifts at own speed
        mountainMats.forEach((mat,i)=>{
          mat.uniforms.time.value=t*layers[i].speed+layers[i].timeOffset;
        });
        gridMat.uniforms.time.value=t;
        starMat.uniforms.time.value=t;

        // Smooth camera
        smoothCam.x+=(targetCam.x-smoothCam.x)*0.038;
        smoothCam.y+=(targetCam.y-smoothCam.y)*0.038;
        smoothCam.z+=(targetCam.z-smoothCam.z)*0.038;
        camera.position.set(
          smoothCam.x+Math.sin(t*0.07)*2.5,
          smoothCam.y+Math.cos(t*0.09)*1.2,
          smoothCam.z,
        );

        // Smooth look-at
        smoothLook.lerp(targetLook, 0.035);
        camera.lookAt(smoothLook);

        // Background lerp
        scene.background.r+=(bgWork.r-scene.background.r)*0.03;
        scene.background.g+=(bgWork.g-scene.background.g)*0.03;
        scene.background.b+=(bgWork.b-scene.background.b)*0.03;
        scene.fog.color.copy(scene.background);

        // Slow synapse rotation
        synapseGroup.rotation.x=Math.sin(t*0.055)*0.035;

        if(firstFrame){ firstFrame=false; setWebglOk(true); }
        renderer.render(scene,camera);
      };
      draw();

      return ()=>{
        visObs.disconnect();
        window.removeEventListener("resize",onResize);
        stInstances.forEach(st=>st.kill());
        cancelAnimationFrame(rafId);
        mountainMeshes.forEach(m=>{ m.geometry.dispose(); m.material.dispose(); });
        mountainMats.forEach(m=>m.dispose());
        gridGeo.dispose(); gridMat.dispose();
        pGeo.dispose(); starMat.dispose();
        if(renderer){ renderer.forceContextLoss?.(); renderer.dispose(); (renderer as any).domElement=null; renderer=null; }
      };
    }

    return ()=>{
      bootObs.disconnect();
      cancelAnimationFrame(rafId);
      if(renderer){ try{renderer.forceContextLoss?.();renderer.dispose();}catch(_){} (renderer as any).domElement=null; renderer=null; }
    };
  }, []);

  const absC: React.CSSProperties = {
    position:"absolute",inset:0,
    display:"flex",flexDirection:"column",
    alignItems:"center",justifyContent:"center",
    pointerEvents:"none",
  };

  if (!webglOk) {
    return (
      <section style={{ background:"#040c18",padding:"120px 40px",position:"relative",overflow:"hidden" }}>
        <div style={{ maxWidth:900,margin:"0 auto",textAlign:"center",position:"relative",zIndex:2 }}>
          <div className="fB" style={{ fontSize:"clamp(3rem,8vw,7rem)",color:"#fff",letterSpacing:"-.01em" }}>
            THE<br/><span style={{ color:"#2DD4BF" }}>SOLUTION</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div ref={containerRef} style={{ height:"240vh",position:"relative" }}>
      <div style={{ position:"sticky",top:0,height:"100vh",overflow:"hidden" }}>
        {/* WebGL canvas — background is THREE.Scene.background (transitions per stage) */}
        <canvas ref={canvasRef} style={{ position:"absolute",inset:0,width:"100%",height:"100%",zIndex:0 }}/>

        {/* Cinematic vignette — depth darkening at edges */}
        <div style={{
          position:"absolute",inset:0,zIndex:2,pointerEvents:"none",
          background:"radial-gradient(ellipse 90% 75% at 50% 50%, transparent 38%, rgba(2,6,14,.80) 100%)",
        }}/>
        {/* Bottom fog gradient — mountains disappear into darkness */}
        <div style={{
          position:"absolute",bottom:0,left:0,right:0,height:"38%",zIndex:2,pointerEvents:"none",
          background:"linear-gradient(to top, rgba(3,8,14,.95) 0%, transparent 100%)",
        }}/>
        <div className="scanline"/>

        {/* ── STAGE 0 — THE SOLUTION ─────────────────────────────────────── */}
        <div ref={stage0Ref} style={{ ...absC,zIndex:10 }}>
          {/* Pulsing rings */}
          <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none" }}>
            <div className="ring-pop" style={{ width:280,height:280,borderRadius:"50%",border:"1px solid rgba(45,212,191,.12)" }}/>
            <div className="ring-pop" style={{ width:280,height:280,borderRadius:"50%",border:"1px solid rgba(167,139,250,.07)",animationDelay:"1.5s" }}/>
          </div>
          {/* CRT corner brackets */}
          {([{top:20,left:20,bT:"#2DD4BF",bL:"#2DD4BF"},{top:20,right:20,bT:"#2DD4BF",bR:"#2DD4BF"},
             {bottom:20,left:20,bB:"#a78bfa",bL:"#a78bfa"},{bottom:20,right:20,bB:"#a78bfa",bR:"#a78bfa"}] as any[]).map((s,i)=>(
            <div key={i} style={{
              position:"absolute",width:24,height:24,pointerEvents:"none",
              top:s.top,left:s.left,right:s.right,bottom:s.bottom,
              borderTop:s.bT?`1px solid ${s.bT}45`:"none",
              borderLeft:s.bL?`1px solid ${s.bL}45`:"none",
              borderBottom:s.bB?`1px solid ${s.bB}45`:"none",
              borderRight:s.bR?`1px solid ${s.bR}45`:"none",
            }}/>
          ))}
          <div className="fM" style={{ fontSize:9,fontWeight:600,color:"rgba(45,212,191,.50)",textTransform:"uppercase",letterSpacing:".22em",marginBottom:20,textAlign:"center",display:"flex",alignItems:"center",gap:10,justifyContent:"center" }}>
            <span style={{ width:16,height:1,background:"rgba(45,212,191,.3)",display:"inline-block" }}/>
            NEURO-REHABILITATION PLATFORM
            <span style={{ width:16,height:1,background:"rgba(45,212,191,.3)",display:"inline-block" }}/>
          </div>
          {/* Title — reduced font, Bebas Neue */}
          <div className="fB" style={{
            fontSize:"clamp(2.8rem,7vw,6.5rem)",
            color:"#fff",letterSpacing:".02em",lineHeight:.88,textAlign:"center",
            textShadow:"0 0 60px rgba(45,212,191,.20)",
          }}>
            THE<br/><span style={{ color:"#2DD4BF",textShadow:"0 0 80px rgba(45,212,191,.50)" }}>SOLUTION</span>
          </div>
          <div className="fM" style={{ fontSize:"clamp(.38rem,.65vw,.58rem)",color:"rgba(255,255,255,.16)",textTransform:"uppercase",letterSpacing:".42em",marginTop:24,textAlign:"center" }}>
            A new paradigm in neuro-rehabilitation
          </div>
          {/* Floating tags */}
          {[{t:"MOTOR RECOVERY",x:"-30vw",y:"-13vh",c:"#2DD4BF",d:"-7deg"},{t:"COGNITIVE AI",x:"28vw",y:"-15vh",c:"#a78bfa",d:"6deg"},{t:"GRIP SENSOR",x:"-26vw",y:"16vh",c:"#34d399",d:"4deg"},{t:"LIVE DASHBOARD",x:"26vw",y:"18vh",c:"#fbbf24",d:"-5deg"}].map(tag=>(
            <div key={tag.t} style={{ position:"absolute",left:`calc(50% + ${tag.x})`,top:`calc(50% + ${tag.y})`,transform:`translate(-50%,-50%) rotate(${tag.d})`,padding:"4px 11px",borderRadius:7,border:`1px solid ${tag.c}28`,background:"rgba(6,12,22,.88)",backdropFilter:"blur(12px)" }}>
              <div className="fM" style={{ fontSize:7,color:tag.c,textTransform:"uppercase",letterSpacing:".20em",opacity:.68,whiteSpace:"nowrap" }}>· {tag.t} ·</div>
            </div>
          ))}
          <motion.div animate={{ y:[0,8,0] }} transition={{ repeat:Infinity,duration:2.2,ease:"easeInOut" }} style={{ position:"absolute",bottom:34,color:"rgba(255,255,255,.12)" }}>
            <ChevronDown size={20}/>
          </motion.div>
        </div>

        {/* ── STAGE 1 — IMMERSIVE ─────────────────────────────────────────── */}
        <div ref={stage1Ref} style={{ ...absC,zIndex:10,opacity:0 }}>
          {/* Horizontal scan lines */}
          <div style={{ position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden" }}>
            {[12,30,52,68,86].map(pct=>(
              <div key={pct} style={{ position:"absolute",left:0,right:0,top:`${pct}%`,height:1,
                background:`linear-gradient(90deg,transparent,rgba(167,139,250,.055),transparent)` }}/>
            ))}
          </div>
          <div className="fM" style={{ fontSize:9,color:"rgba(167,139,250,.60)",textTransform:"uppercase",letterSpacing:".28em",marginBottom:16,textAlign:"center" }}>GAMIFIED ENVIRONMENTS</div>
          {/* Font: Bebas Neue, reduced from 13vw → 8vw */}
          <div className="fB" style={{
            fontSize:"clamp(2.8rem,8vw,7.5rem)",
            letterSpacing:".01em",lineHeight:.88,textAlign:"center",
            color:"#a78bfa",textShadow:"0 0 60px rgba(167,139,250,.45), 0 0 160px rgba(167,139,250,.18)",
          }}>
            IMMERSIVE
          </div>
          <div style={{ width:"clamp(200px,32vw,400px)",height:1,background:"linear-gradient(90deg,transparent,rgba(167,139,250,.50),transparent)",margin:"20px auto" }}/>
          <div className="fS" style={{ fontSize:"clamp(.75rem,1.1vw,.92rem)",textAlign:"center",maxWidth:380,color:"rgba(255,255,255,.68)",lineHeight:1.65 }}>
            Gamified environments that command attention<br/>and build real neural pathways.
          </div>
          <div style={{ display:"flex",gap:16,marginTop:22 }}>
            {["SQUEEZE TO PLAY","COGNITIVE GATES","ADAPTIVE LEVELS"].map(l=>(
              <div key={l} className="fM" style={{ color:"rgba(167,139,250,.58)",padding:"3px 10px",border:"1px solid rgba(167,139,250,.15)",borderRadius:5,fontSize:7,textTransform:"uppercase",letterSpacing:".18em" }}>{l}</div>
            ))}
          </div>
        </div>

        {/* ── STAGE 2 — INTELLIGENT ───────────────────────────────────────── */}
        <div ref={stage2Ref} style={{ ...absC,zIndex:10,opacity:0 }}>
          {/* Vertical circuit traces */}
          <div style={{ position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden" }}>
            {[7,22,50,78,93].map(pct=>(
              <div key={pct} style={{ position:"absolute",top:0,bottom:0,left:`${pct}%`,width:1,
                background:`linear-gradient(180deg,transparent,rgba(45,212,191,.055),transparent)` }}/>
            ))}
          </div>
          <div className="fM" style={{ fontSize:9,color:"rgba(45,212,191,.60)",textTransform:"uppercase",letterSpacing:".28em",marginBottom:16,textAlign:"center" }}>REAL-TIME ADAPTATION</div>
          {/* Font: Bebas Neue, reduced from 12vw → 8vw */}
          <div className="fB" style={{
            fontSize:"clamp(2.8rem,8vw,7.5rem)",
            letterSpacing:".01em",lineHeight:.88,textAlign:"center",
            color:"#2DD4BF",textShadow:"0 0 60px rgba(45,212,191,.50), 0 0 180px rgba(45,212,191,.20)",
          }}>
            INTELLIGENT
          </div>
          <div style={{ width:"clamp(200px,32vw,400px)",height:1,background:"linear-gradient(90deg,transparent,rgba(45,212,191,.50),transparent)",margin:"20px auto" }}/>
          <div className="fS" style={{ fontSize:"clamp(.75rem,1.1vw,.92rem)",textAlign:"center",maxWidth:380,color:"rgba(255,255,255,.68)",lineHeight:1.65 }}>
            Real-time AI adapting to every micro-movement,<br/>tremor, and grip pattern.
          </div>
          <div style={{ display:"flex",gap:16,marginTop:22 }}>
            {["GRIP ANALYTICS","TREMOR FILTER","AI COMPANION"].map(l=>(
              <div key={l} className="fM" style={{ color:"rgba(45,212,191,.58)",padding:"3px 10px",border:"1px solid rgba(45,212,191,.15)",borderRadius:5,fontSize:7,textTransform:"uppercase",letterSpacing:".18em" }}>{l}</div>
            ))}
          </div>
          <div className="fM" style={{ fontSize:"clamp(.38rem,.62vw,.55rem)",color:"rgba(45,212,191,.32)",textTransform:"uppercase",letterSpacing:".34em",marginTop:32,textAlign:"center" }}>↓ DISCOVER THE INTERFACE</div>
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

        <Reveal dir="left" style={{ marginBottom: 60 }}>

          <div className="fM" style={{ fontSize: 9, color: "rgba(167,139,250,.8)", textTransform: "uppercase", letterSpacing: ".3em", marginBottom: 12 }}>What We Offer</div>

          <h2 className="fB" style={{ fontSize: "clamp(3rem,7vw,6.5rem)", letterSpacing: ".03em", lineHeight: .9, color: "#fff" }}>

            EVERYTHING YOUR<br /><span style={{ color: "#a78bfa" }}>RECOVERY NEEDS.</span>

          </h2>

        </Reveal>



        {/* Row 1 */}

        <div style={{ display: "grid", gridTemplateColumns: "7fr 5fr", gap: 16, marginBottom: 16 }}>

          <Reveal dir="zoom">
            <CyberCard accentColor="#2DD4BF" accentRgb="45,212,191"
              style={{ borderRadius:34, minHeight:300, padding:"42px 38px" }}>
              <div style={{ display:"flex",flexDirection:"column",height:"100%" }}>
                <div style={{ width:54,height:54,borderRadius:18,marginBottom:20,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(45,212,191,.12)",border:"1px solid rgba(45,212,191,.24)",color:"#2DD4BF" }}>
                  <Sparkles size={22}/>
                </div>
                <div className="fM" style={{ fontSize:8,color:"rgba(45,212,191,.55)",textTransform:"uppercase",letterSpacing:".22em",marginBottom:10 }}>AI-Powered</div>
                <h3 className="fB" style={{ fontSize:28,color:"#fff",letterSpacing:".04em",marginBottom:14,lineHeight:1.05 }}>
                  Therapy that grows with the patient.
                </h3>
                <p className="fS" style={{ fontSize:14,color:"rgba(255,255,255,.50)",lineHeight:1.78,fontWeight:300,maxWidth:400 }}>
                  Reinforcement learning monitors every squeeze and adjusts difficulty live.
                  An AI companion provides vocal encouragement. Always meeting you exactly where you are.
                </p>
              </div>
            </CyberCard>
          </Reveal>

          <Reveal dir="right" delay={.1}>
            <CyberCard accentColor="#a78bfa" accentRgb="167,139,250"
              style={{ borderRadius:34, minHeight:300, padding:"36px 32px" }}>
              <div style={{ display:"flex",flexDirection:"column",height:"100%" }}>
                <div style={{ width:54,height:54,borderRadius:18,marginBottom:20,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(167,139,250,.12)",border:"1px solid rgba(167,139,250,.20)",color:"#a78bfa" }}>
                  <Brain size={22}/>
                </div>
                <div className="fM" style={{ fontSize:8,color:"rgba(167,139,250,.65)",textTransform:"uppercase",letterSpacing:".22em",marginBottom:10 }}>Dual-Task</div>
                <h3 className="fB" style={{ fontSize:24,color:"#fff",letterSpacing:".04em",marginBottom:14,lineHeight:1.05 }}>
                  Motor + Cognitive. Simultaneously.
                </h3>
                <p className="fS" style={{ fontSize:14,color:"rgba(255,255,255,.76)",lineHeight:1.75,fontWeight:300 }}>
                  The only therapy system training both physical grip and working memory at once. Because neuroplasticity requires both.
                </p>
                <div style={{ marginTop:20,display:"flex",alignItems:"center",gap:8,color:"#a78bfa" }}>
                  <CheckCircle2 size={13}/>
                  <span className="fM" style={{ fontSize:8,textTransform:"uppercase",letterSpacing:".18em" }}>Clinically validated</span>
                </div>
              </div>
            </CyberCard>
          </Reveal>

        </div>



        {/* Row 2 */}

        <div style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: 16 }}>

          <Reveal dir="left" delay={.15}>
            <CyberCard accentColor="#34d399" accentRgb="52,211,153"
              style={{ borderRadius:34, minHeight:260, padding:"36px 32px" }}>
              <div style={{ display:"flex",flexDirection:"column",height:"100%" }}>
                <div style={{ width:54,height:54,borderRadius:18,marginBottom:20,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(52,211,153,.12)",border:"1px solid rgba(52,211,153,.22)",color:"#34d399" }}>
                  <Waves size={22}/>
                </div>
                <div className="fM" style={{ fontSize:8,color:"rgba(52,211,153,.68)",textTransform:"uppercase",letterSpacing:".22em",marginBottom:10 }}>Tremor Intelligence</div>
                <h3 className="fB" style={{ fontSize:22,color:"#fff",letterSpacing:".04em",marginBottom:12,lineHeight:1.05 }}>
                  Filters involuntary tremors in real-time.
                </h3>
                <p className="fS" style={{ fontSize:14,color:"rgba(255,255,255,.76)",lineHeight:1.75,fontWeight:300 }}>
                  6-axis IMU continuously separates Parkinson's tremors from intentional grip for clinical accuracy even in severe cases.
                </p>
              </div>
            </CyberCard>
          </Reveal>

          <Reveal dir="right" delay={.2}>
            <CyberCard accentColor="#fbbf24" accentRgb="251,191,36"
              style={{ borderRadius:34, minHeight:260, padding:"36px 32px" }}>
              <div style={{ display:"flex",flexDirection:"column",height:"100%" }}>
                <div style={{ width:54,height:54,borderRadius:18,marginBottom:20,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(251,191,36,.10)",border:"1px solid rgba(251,191,36,.24)",color:"#fbbf24" }}>
                  <BarChart3 size={22}/>
                </div>
                <div className="fM" style={{ fontSize:8,color:"rgba(251,191,36,.72)",textTransform:"uppercase",letterSpacing:".22em",marginBottom:10 }}>Tele-Rehab</div>
                <h3 className="fB" style={{ fontSize:22,color:"#fff",letterSpacing:".04em",marginBottom:12,lineHeight:1.05 }}>
                  Your doctor sees every session, from anywhere.
                </h3>
                <p className="fS" style={{ fontSize:14,color:"rgba(255,255,255,.76)",lineHeight:1.75,fontWeight:300 }}>
                  Firebase streams grip force, tremor amplitude, and reaction data live. Therapy adjustments happen remotely — no clinic visits needed.
                </p>
              </div>
            </CyberCard>
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

            {/* Globe — partially visible top-right, clipped for cinematic look */}
            <div style={{
              position:"absolute", top:-60, right:-80,
              width:280, height:280,
              pointerEvents:"none", zIndex:0,
              // Clip bottom half so only top hemisphere peeks above
              clipPath:"ellipse(140px 100px at 140px 80px)",
              opacity:0.70,
            }}>
              <div style={{ position:"relative", width:280, height:280 }}>
                <GlobeSpinner size={240} />
              </div>
            </div>

            <h3 className="fB" style={{
              fontSize: "clamp(1.8rem,3vw,2.8rem)", color: "#fff",
              letterSpacing: ".04em", lineHeight: 1.1, marginBottom: 22,
              position:"relative", zIndex:1,
            }}>

              DESIGNED FOR PATIENTS.<br /><span style={{ color: "#2DD4BF" }}>BUILT FOR IMPACT.</span>

            </h3>

            <p className="fS" style={{
              fontSize: 15, color: "rgba(255,255,255,.78)",
              lineHeight: 1.75, fontWeight: 300, marginBottom: 42,
              position:"relative", zIndex:1,
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