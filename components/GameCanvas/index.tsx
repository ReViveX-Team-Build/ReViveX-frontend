"use client";

import React, { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, RotateCcw, Zap, Hand, Battery, Signal, Wifi, WifiOff } from "lucide-react";

// --- IMPORTS ---
import { Player } from "../../util/game-core/SynapsePlayer";
import { SynapseBackground } from "../../util/game-core/SynapseBackground";
import { SeaGrass } from "../../util/game-core/SynapseSeaGrass";
import { Particle } from "../../util/game-core/SynapseParticles";
import { SynapseCorals } from "../../util/game-core/SynapseCorals";
import { Pearl, CognitiveTask } from "../../util/game-core/SynapseCognitive";

// --- WEB SERIAL API TYPES ---
interface SerialPort {
  readonly readable: ReadableStream | null;
  readonly writable: WritableStream | null;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
}
interface Serial extends EventTarget {
  requestPort(): Promise<SerialPort>;
  getPorts(): Promise<SerialPort[]>;
}
declare global {
  interface Navigator { serial?: Serial; }
}

// --- PRESSURE THRESHOLDS ---
const IDLE_THRESHOLD    = 0.5;
const DANGER_THRESHOLD  = 2.0;

type CountdownValue = number | "GO!" | null;
interface ClinicalMetrics { accuracy: { correct: number; total: number }; missed: number; }

/* ─────────────────────────────────────────────
   INJECTED GLOBAL STYLES
   (fullscreen override + game-specific anims)
───────────────────────────────────────────── */
const GAME_CSS = `
  /* Hide the app shell when game is mounted */
  body:has(#synapse-game-root) aside,
  body:has(#synapse-game-root) nav,
  body:has(#synapse-game-root) header {
    display: none !important;
  }

  #synapse-game-root {
    position: fixed !important;
    inset: 0 !important;
    z-index: 9999 !important;
    width: 100vw !important;
    height: 100vh !important;
    overflow: hidden !important;
    background: #020c1b;
  }

  #synapse-game-root canvas {
    display: block;
    width: 100% !important;
    height: 100% !important;
    image-rendering: crisp-edges;
  }

  @keyframes countdown-pop {
    0%   { transform: translate(-50%,-50%) scale(0.4); opacity: 0; }
    40%  { transform: translate(-50%,-50%) scale(1.15); opacity: 1; }
    70%  { transform: translate(-50%,-50%) scale(0.95); }
    100% { transform: translate(-50%,-50%) scale(1); opacity: 1; }
  }
  @keyframes go-burst {
    0%   { transform: translate(-50%,-50%) scale(0.6); opacity: 0; }
    30%  { transform: translate(-50%,-50%) scale(1.3); opacity: 1; }
    60%  { transform: translate(-50%,-50%) scale(1.05); }
    100% { transform: translate(-50%,-50%) scale(1); opacity: 0; }
  }
  @keyframes hud-in {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes feedback-in {
    0%   { opacity: 0; transform: translate(-50%, -20px) scale(0.8); }
    30%  { opacity: 1; transform: translate(-50%, 0)    scale(1.05); }
    80%  { opacity: 1; transform: translate(-50%, 0)    scale(1); }
    100% { opacity: 0; transform: translate(-50%, 8px)  scale(0.95); }
  }
  @keyframes pressure-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(45,212,191,0); }
    50%       { box-shadow: 0 0 0 4px rgba(45,212,191,0.25); }
  }
  @keyframes shimmer-btn {
    0%   { transform: translateX(-200%) skewX(-20deg); }
    100% { transform: translateX(300%)  skewX(-20deg); }
  }
  @keyframes menu-fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes border-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes scanline {
    0%   { top: -10%; opacity: 0; }
    10%  { opacity: 0.7; }
    90%  { opacity: 0.7; }
    100% { top: 110%; opacity: 0; }
  }
`;

/* ─────────────────────────────────────────────
   PRESSURE BAR COLOUR
───────────────────────────────────────────── */
const getPressureColor = (p: number) => {
  if (p < IDLE_THRESHOLD)            return { hex: '#4B5563', label: 'IDLE'   };
  if (p < DANGER_THRESHOLD * 0.6)    return { hex: '#2DD4BF', label: 'GOOD'   };
  if (p < DANGER_THRESHOLD * 0.85)   return { hex: '#FACC15', label: 'HIGH'   };
  return                                      { hex: '#EF4444', label: 'DANGER' };
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef    = useRef<number | null>(null);
  const router    = useRouter();

  // Hardware
  const [isConnected, setIsConnected]     = useState(false);
  const isConnectedRef                     = useRef(false);
  const pressureRef                        = useRef(0);
  const serialPortRef                      = useRef<SerialPort | null>(null);
  const readerRef                          = useRef<ReadableStreamDefaultReader<string> | null>(null);

  // Game refs
  const playerRef    = useRef<Player | null>(null);
  const bgRef        = useRef<SynapseBackground | null>(null);
  const grassRef     = useRef<SeaGrass | null>(null);
  const coralsRef    = useRef<SynapseCorals | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const pearlsRef    = useRef<Pearl[]>([]);
  const inputRef     = useRef(false);
  const taskTimerRef = useRef(0);

  // Game state (dual ref+state pattern)
  const gameStateRef = useRef<'MENU' | 'PLAYING' | 'SOFT_FAIL'>('MENU');
  const countdownRef = useRef<CountdownValue>(null);

  // UI state
  const [uiState,    setUiState]    = useState<'MENU' | 'PLAYING' | 'SOFT_FAIL'>('MENU');
  const [uiCountdown, setUiCountdown] = useState<CountdownValue>(null);
  const [score,       setScore]       = useState(0);
  const [streak,      setStreak]      = useState(0);
  const [failReason,  setFailReason]  = useState<'floor' | 'ceiling' | 'pressure' | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [currentTask] = useState<CognitiveTask>({ instruction: 'Collect BLUE', targetColor: '#00BFFF' });
  const [feedback,    setFeedback]    = useState<{ text: string; color: string } | null>(null);
  const [pressureDisplay, setPressureDisplay] = useState(0);
  // Canvas size (fills viewport)
  const [canvasSize, setCanvasSize] = useState({ w: 1280, h: 720 });

  const metricsRef    = useRef<ClinicalMetrics>({ accuracy: { correct: 0, total: 0 }, missed: 0 });
  const startTimeRef  = useRef(0);
  const lastFrameRef  = useRef(0);
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);

  /* ── STATE HELPERS ── */
  const setGameStatus = (s: 'MENU' | 'PLAYING' | 'SOFT_FAIL') => { gameStateRef.current = s; setUiState(s); };
  const setCountdownStatus = (v: CountdownValue) => { countdownRef.current = v; setUiCountdown(v); };

  /* ── IoT CONNECT ── */
  const connectSerial = async () => {
    try {
      if (!navigator.serial) { alert('Web Serial not supported. Use Chrome or Edge.'); return; }
      const port = await navigator.serial.requestPort();
      if (port.readable === null) await port.open({ baudRate: 115200 });
      serialPortRef.current = port;
      setIsConnected(true); isConnectedRef.current = true;
      const td = new TextDecoderStream();
      port.readable!.pipeTo(td.writable).catch(() => {});
      const reader = td.readable.getReader();
      readerRef.current = reader;
      readSerialData(reader);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'NotFoundError') return;
      alert('Could not connect. Make sure device is plugged in.');
    }
  };

  const disconnectSerial = async () => {
    setIsConnected(false); isConnectedRef.current = false; pressureRef.current = 0;
    try { if (readerRef.current) { await readerRef.current.cancel(); readerRef.current.releaseLock(); readerRef.current = null; } } catch (_) {}
    try { if (serialPortRef.current) { await serialPortRef.current.close(); serialPortRef.current = null; } } catch (_) {}
  };

  const readSerialData = async (reader: ReadableStreamDefaultReader<string>) => {
    let buf = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        const lines = buf.split('\n'); buf = lines.pop() || '';
        for (const line of lines) {
          const m = line.match(/V:([\d.]+)/);
          if (m) pressureRef.current = parseFloat(m[1]);
        }
      }
    } catch (_) { setIsConnected(false); isConnectedRef.current = false; }
  };

  /* ── INPUT BRIDGE ── */
  const getShouldSwimUp = (): boolean => {
    if (isConnectedRef.current) { const p = pressureRef.current; return p > IDLE_THRESHOLD && p < DANGER_THRESHOLD; }
    return inputRef.current;
  };

  /* ── RESIZE HANDLER ── */
  useEffect(() => {
    const onResize = () => {
      setCanvasSize({ w: window.innerWidth, h: window.innerHeight });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      // Reinit background to new size
      bgRef.current     = new SynapseBackground(canvas.width, canvas.height);
      grassRef.current  = new SeaGrass(canvas.width, canvas.height);
      coralsRef.current = new SynapseCorals(canvas.width, canvas.height);
      if (playerRef.current) {
        playerRef.current = new Player(canvas.width, canvas.height);
      }
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ── INIT ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    playerRef.current  = new Player(canvas.width, canvas.height);
    bgRef.current      = new SynapseBackground(canvas.width, canvas.height);
    grassRef.current   = new SeaGrass(canvas.width, canvas.height);
    coralsRef.current  = new SynapseCorals(canvas.width, canvas.height);

    startTimeRef.current   = Date.now();
    lastFrameRef.current   = performance.now();
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      const cleanup = async () => {
        try { if (readerRef.current) { await readerRef.current.cancel(); readerRef.current.releaseLock(); readerRef.current = null; } } catch (_) {}
        try { if (serialPortRef.current) { await serialPortRef.current.close(); serialPortRef.current = null; } } catch (_) {}
      };
      cleanup();
    };
  }, []);

  /* ── KEYBOARD ── */
  useEffect(() => {
    const kd = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); inputRef.current = true; } };
    const ku = (e: KeyboardEvent) => { if (e.code === 'Space') inputRef.current = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  /* ── START SESSION ── */
  const startSession = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (playerRef.current) { playerRef.current.y = canvas.height / 2; playerRef.current.velocity = 0; playerRef.current.status = 'swimming'; }
    particlesRef.current = []; pearlsRef.current = [];
    metricsRef.current = { accuracy: { correct: 0, total: 0 }, missed: 0 };
    setScore(0); setStreak(0); setFailReason(null);
    setGameStatus('PLAYING'); setCountdownStatus(3);
    let count = 3;
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    countdownTimer.current = setInterval(() => {
      count--;
      if (count > 0) setCountdownStatus(count);
      else if (count === 0) setCountdownStatus('GO!');
      else { setCountdownStatus(null); if (countdownTimer.current) clearInterval(countdownTimer.current); }
    }, 900);
  };

  /* ── GAME LOOP ── */
  const loop = (now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const delta   = Math.min(32, now - lastFrameRef.current);
    lastFrameRef.current = now;
    const elapsed = Date.now() - startTimeRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. WORLD
    let nightFactor = 0, sandHeight = 80;
    if (bgRef.current) { nightFactor = bgRef.current.update(elapsed); bgRef.current.draw(ctx, nightFactor); sandHeight = bgRef.current.sandHeight; }
    if (coralsRef.current) { coralsRef.current.update(); coralsRef.current.draw(ctx, nightFactor); }
    if (grassRef.current && playerRef.current) { grassRef.current.update(playerRef.current.x, playerRef.current.y, delta); grassRef.current.draw(ctx); }

    // 2. GAME LOGIC
    const state = gameStateRef.current;
    const isCounting   = countdownRef.current !== null;
    const physicsActive = state === 'PLAYING' && !isCounting;

    if (playerRef.current) {
      if (isConnectedRef.current && pressureRef.current >= DANGER_THRESHOLD && physicsActive) { setFailReason('pressure'); setGameStatus('SOFT_FAIL'); }
      if (physicsActive) {
        playerRef.current.update(getShouldSwimUp(), delta, sandHeight, particlesRef.current, nightFactor);
        taskTimerRef.current += delta;
        if (taskTimerRef.current > 2000) { spawnPearls(canvas.width, canvas.height); taskTimerRef.current = 0; }
        if (playerRef.current.status === 'hit_floor')   { setFailReason('floor');   setGameStatus('SOFT_FAIL'); }
        if (playerRef.current.status === 'hit_ceiling') { setFailReason('ceiling'); setGameStatus('SOFT_FAIL'); }
        pearlsRef.current.forEach(pearl => {
          if (!pearl.collected && !pearl.markedForDeletion) {
            const dx = playerRef.current!.x - pearl.x, dy = playerRef.current!.y - pearl.y;
            if (Math.sqrt(dx*dx+dy*dy) < playerRef.current!.radius + pearl.radius + 10) collectPearl(pearl);
          }
        });
        setPressureDisplay(parseFloat(pressureRef.current.toFixed(2)));
      } else if (state === 'MENU' || isCounting) {
        playerRef.current.y = canvas.height / 2 + Math.sin(elapsed * 0.003) * 20;
        playerRef.current.velocity = 0; playerRef.current.rotation = 0;
      }
      playerRef.current.draw(ctx, nightFactor);
    }

    // 3. PEARLS & PARTICLES
    for (let i = pearlsRef.current.length - 1; i >= 0; i--) {
      const p = pearlsRef.current[i];
      if (physicsActive) p.update(4);
      p.draw(ctx);
      if (p.markedForDeletion) { if (!p.collected && p.isTarget) metricsRef.current.missed++; pearlsRef.current.splice(i, 1); }
    }
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      if (physicsActive) p.update();
      p.draw(ctx);
      if (p.markedForDeletion) particlesRef.current.splice(i, 1);
    }

    rafRef.current = requestAnimationFrame(loop);
  };

  /* ── HELPERS ── */
  const spawnPearls = (w: number, h: number) => {
    const top = Math.random() > 0.5;
    const bad  = '#FF4500';
    pearlsRef.current.push(new Pearl(w + 50, h * 0.3, top  ? currentTask.targetColor : bad,  top));
    pearlsRef.current.push(new Pearl(w + 50, h * 0.7, !top ? currentTask.targetColor : bad, !top));
  };

  const triggerFeedback = (text: string, color: string) => {
    setFeedback({ text, color });
    setTimeout(() => setFeedback(null), 2000);
  };

  const collectPearl = (pearl: Pearl) => {
    pearl.collected = true;
    metricsRef.current.accuracy.total++;
    if (pearl.isTarget) {
      metricsRef.current.accuracy.correct++;
      setScore(p => p + 100);
      setStreak(p => {
        const n = p + 1;
        if (n % 5 === 0) triggerFeedback(`${n} Streak! 🔥`, '#FFD700');
        else if (n === 3) triggerFeedback('Great Rhythm!', '#2DD4BF');
        return n;
      });
      for (let i = 0; i < 8; i++) particlesRef.current.push(new Particle(pearl.x, pearl.y, 1, true));
    } else {
      setScore(p => Math.max(0, p - 50));
      setStreak(0);
      triggerFeedback('Oops! Focus on Blue!', '#FF6B6B');
      for (let i = 0; i < 12; i++) {
        const p = new Particle(pearl.x, pearl.y, 1.5, true);
        p.color = 'rgba(255,69,0,0.8)';
        particlesRef.current.push(p);
      }
    }
  };

  const resumeGame = () => {
    const canvas = canvasRef.current;
    if (playerRef.current && canvas) {
      playerRef.current.y = canvas.height / 2;
      playerRef.current.velocity = 0; playerRef.current.status = 'swimming';
      playerRef.current.floorTime = 0; playerRef.current.surfaceTime = 0;
    }
    setFailReason(null); setGameStatus('PLAYING');
  };

  const handleBackClick = () => {
    if (gameStateRef.current === 'PLAYING') { setGameStatus('SOFT_FAIL'); setShowExitConfirm(true); }
    else setShowExitConfirm(true);
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
    if (gameStateRef.current === 'SOFT_FAIL' && !failReason) setGameStatus('PLAYING');
  };

  const pressureInfo = getPressureColor(pressureDisplay);
  const pressurePct  = Math.min(100, (pressureDisplay / DANGER_THRESHOLD) * 100);

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div id="synapse-game-root">
      <style>{GAME_CSS}</style>
      <canvas ref={canvasRef} />

      {/* ── DEVICE BADGE (top-right) ── */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 60 }}>
        {isConnected ? (
          <button onClick={disconnectSerial}
            style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.4)', padding:'8px 16px', borderRadius:999, cursor:'pointer', backdropFilter:'blur(8px)' }}>
            <Wifi size={14} style={{ color:'#34d399' }} />
            <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#34d399' }}>Connected</span>
          </button>
        ) : (
          <button onClick={connectSerial}
            style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.4)', padding:'8px 16px', borderRadius:999, cursor:'pointer', backdropFilter:'blur(8px)' }}>
            <WifiOff size={14} style={{ color:'#f87171' }} />
            <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#f87171' }}>Connect Device</span>
          </button>
        )}
      </div>

      {/* ── MENU ── */}
      {uiState === 'MENU' && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(2,12,27,0.65)', backdropFilter:'blur(4px)', zIndex:20 }}>
          <div style={{ animation:'menu-fade-in 0.5s ease both', background:'rgba(8,20,40,0.92)', border:'1.5px solid rgba(45,212,191,0.35)', borderRadius:28, padding:'40px 44px', maxWidth:500, width:'90%', textAlign:'center', backdropFilter:'blur(20px)', boxShadow:'0 0 60px rgba(45,212,191,0.12), 0 30px 80px rgba(0,0,0,0.5)', position:'relative', overflow:'hidden' }}>

            {/* Scanline */}
            <div style={{ position:'absolute', left:0, right:0, height:'30%', background:'linear-gradient(to bottom,transparent,rgba(45,212,191,0.04),transparent)', animation:'scanline 6s linear infinite', pointerEvents:'none' }} />

            <h1 style={{ fontSize:36, fontWeight:900, color:'#00FFFF', letterSpacing:'0.08em', marginBottom:4, textShadow:'0 0 30px rgba(0,255,255,0.4)' }}>
              SYNAPSE RACER
            </h1>
            <p style={{ color:'rgba(255,255,255,0.35)', fontSize:11, letterSpacing:'0.22em', textTransform:'uppercase', marginBottom:32 }}>
              Protocol A · Motor &amp; Cognitive
            </p>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:32, textAlign:'left' }}>
              {/* Controls */}
              <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'16px 18px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <Hand size={20} style={{ color:'#2DD4BF' }} />
                  <span style={{ color:'#fff', fontWeight:700, fontSize:13 }}>CONTROLS</span>
                </div>
                {isConnected ? (
                  <>
                    <p style={{ color:'rgba(255,255,255,0.6)', fontSize:12, lineHeight:1.6, margin:0 }}>Squeeze the bulb to swim up.</p>
                    <p style={{ color:'rgba(255,255,255,0.6)', fontSize:12, lineHeight:1.6, margin:0 }}>Release to dive down.</p>
                    <p style={{ color:'#FACC15', fontSize:11, marginTop:6 }}>Don't over-squeeze!</p>
                  </>
                ) : (
                  <>
                    <p style={{ color:'rgba(255,255,255,0.6)', fontSize:12, lineHeight:1.6, margin:0 }}>Hold <strong style={{ color:'#2DD4BF' }}>SPACE</strong> to swim up.</p>
                    <p style={{ color:'rgba(255,255,255,0.6)', fontSize:12, lineHeight:1.6, margin:0 }}>Release to dive.</p>
                    <p style={{ color:'rgba(255,255,255,0.25)', fontSize:10, marginTop:6 }}>Connect device for hardware control</p>
                  </>
                )}
              </div>
              {/* Goal */}
              <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'16px 18px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <Zap size={20} style={{ color:'#FFD700' }} />
                  <span style={{ color:'#fff', fontWeight:700, fontSize:13 }}>GOAL</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:'#00BFFF', boxShadow:'0 0 8px #00BFFF' }} />
                  <span style={{ color:'rgba(255,255,255,0.6)', fontSize:12 }}>Collect Blue (+100)</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:'#FF4500', boxShadow:'0 0 8px #FF4500' }} />
                  <span style={{ color:'rgba(255,255,255,0.6)', fontSize:12 }}>Avoid Red (−50)</span>
                </div>
              </div>
            </div>

            {/* Start button */}
            <button onClick={startSession}
              style={{ position:'relative', overflow:'hidden', background:'#2DD4BF', color:'#0B1E33', border:'none', borderRadius:999, padding:'16px 52px', fontSize:18, fontWeight:900, letterSpacing:'0.08em', cursor:'pointer', boxShadow:'0 0 40px rgba(45,212,191,0.5)', display:'inline-flex', alignItems:'center', gap:12, transition:'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              {/* Shimmer overlay */}
              <div style={{ position:'absolute', top:0, left:0, width:'40%', height:'100%', background:'rgba(255,255,255,0.35)', animation:'shimmer-btn 1.8s ease-in-out infinite', pointerEvents:'none' }} />
              <Play size={22} fill="#0B1E33" style={{ position:'relative', zIndex:1 }} />
              <span style={{ position:'relative', zIndex:1 }}>START MISSION</span>
            </button>
          </div>
        </div>
      )}

      {/* ── SOFT FAIL ── */}
      {uiState === 'SOFT_FAIL' && failReason && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(2,8,18,0.75)', backdropFilter:'blur(6px)', zIndex:20 }}>
          <div style={{ background:'rgba(8,18,35,0.95)', border:'1.5px solid rgba(239,68,68,0.4)', borderRadius:28, padding:'40px 48px', textAlign:'center', boxShadow:'0 0 40px rgba(239,68,68,0.12)', animation:'menu-fade-in 0.35s ease both' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>
              {failReason === 'floor' ? '🐟' : failReason === 'pressure' ? '💥' : '🦅'}
            </div>
            <h2 style={{ color:'#fff', fontSize:22, fontWeight:900, marginBottom:8 }}>
              {failReason === 'floor' ? 'The Fish is Sleeping...' : failReason === 'pressure' ? 'TOO MUCH PRESSURE!' : 'Too High!'}
            </h2>
            <p style={{ color:'#2DD4BF', marginBottom:28, fontSize:14 }}>
              {failReason === 'floor' ? 'Squeeze harder to wake up!' : failReason === 'pressure' ? 'Gently! Don\'t crush the sensor.' : 'Relax your grip to dive down.'}
            </p>
            <button onClick={resumeGame}
              style={{ display:'inline-flex', alignItems:'center', gap:10, background:'#2DD4BF', color:'#0B1E33', border:'none', borderRadius:999, padding:'13px 36px', fontSize:16, fontWeight:700, cursor:'pointer', boxShadow:'0 0 20px rgba(45,212,191,0.4)' }}>
              <RotateCcw size={18} /> Resume
            </button>
          </div>
        </div>
      )}

      {/* ── PLAYING HUD ── */}
      {uiState === 'PLAYING' && (
        <>
          {/* Score + Streak — top centre */}
          <div style={{ position:'absolute', top:16, left:'50%', transform:'translateX(-50%)', display:'flex', gap:12, zIndex:30, pointerEvents:'none', animation:'hud-in 0.4s ease both' }}>
            {/* Score */}
            <div style={{ background:'rgba(8,20,40,0.7)', backdropFilter:'blur(12px)', border:'1px solid rgba(45,212,191,0.25)', borderRadius:999, padding:'8px 22px', display:'flex', flexDirection:'column', alignItems:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}>
              <span style={{ fontSize:9, color:'#2DD4BF', fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase' }}>Score</span>
              <span style={{ fontSize:26, fontFamily:'monospace', fontWeight:900, color:'#fff', lineHeight:1 }}>
                {score.toString().padStart(4, '0')}
              </span>
            </div>
            {/* Streak */}
            <div style={{ background:'rgba(8,20,40,0.7)', backdropFilter:'blur(12px)', border:`1px solid ${streak > 5 ? 'rgba(250,204,21,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius:999, padding:'8px 18px', display:'flex', flexDirection:'column', alignItems:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.3)', transition:'border-color 0.3s' }}>
              <span style={{ fontSize:9, color:'rgba(255,255,255,0.4)', fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase' }}>Streak</span>
              <div style={{ display:'flex', alignItems:'center', gap:4, lineHeight:1 }}>
                <Zap size={14} style={{ color: streak > 5 ? '#FACC15' : '#4B5563', fill: streak > 5 ? '#FACC15' : 'none', transition:'color 0.3s' }} />
                <span style={{ fontSize:26, fontWeight:900, color: streak > 5 ? '#FACC15' : '#fff', transition:'color 0.3s' }}>{streak}</span>
              </div>
            </div>
          </div>

          {/* Pressure gauge — bottom centre (only when connected) */}
          {isConnected && (
            <div style={{ position:'absolute', bottom:20, left:'50%', transform:'translateX(-50%)', zIndex:30, display:'flex', flexDirection:'column', alignItems:'center', gap:5, pointerEvents:'none' }}>
              <span style={{ fontSize:9, color:'rgba(255,255,255,0.35)', fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase' }}>Grip Pressure</span>
              {/* Track */}
              <div style={{ width:200, height:10, background:'rgba(255,255,255,0.08)', borderRadius:999, overflow:'hidden', border:'1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ height:'100%', width:`${pressurePct}%`, background:pressureInfo.hex, borderRadius:999, transition:'width 0.08s, background 0.15s', boxShadow:`0 0 10px ${pressureInfo.hex}` }} />
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:10, fontFamily:'monospace', color:pressureInfo.hex, fontWeight:700 }}>{pressureDisplay.toFixed(2)} V</span>
                <span style={{ fontSize:8, color:pressureInfo.hex, fontWeight:700, letterSpacing:'0.15em', background:`${pressureInfo.hex}20`, border:`1px solid ${pressureInfo.hex}40`, borderRadius:4, padding:'1px 5px' }}>{pressureInfo.label}</span>
              </div>
            </div>
          )}

          {/* Feedback toast */}
          {feedback && (
            <div style={{ position:'absolute', top:'20%', left:'50%', zIndex:40, animation:'feedback-in 2s ease-in-out both', pointerEvents:'none' }}>
              <div style={{ background:'rgba(8,20,40,0.92)', color:feedback.color, border:`1px solid ${feedback.color}50`, borderRadius:999, padding:'10px 28px', fontWeight:700, fontSize:16, backdropFilter:'blur(12px)', boxShadow:`0 0 24px ${feedback.color}40`, whiteSpace:'nowrap' }}>
                {feedback.text}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── COUNTDOWN ── */}
      {uiCountdown !== null && (
        <div style={{
          position:'absolute', top:'50%', left:'50%', zIndex:50,
          fontSize: uiCountdown === 'GO!' ? '7rem' : '10rem',
          fontWeight:900, color: uiCountdown === 'GO!' ? '#2DD4BF' : '#00FFFF',
          textShadow:`0 0 60px ${uiCountdown === 'GO!' ? 'rgba(45,212,191,0.8)' : 'rgba(0,255,255,0.8)'}`,
          animation: uiCountdown === 'GO!' ? 'go-burst 0.9s ease-out both' : 'countdown-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
          userSelect:'none', pointerEvents:'none',
        }}>
          {uiCountdown}
        </div>
      )}

      {/* ── EXIT CONFIRM ── */}
      {showExitConfirm && (
        <div style={{ position:'absolute', inset:0, background:'rgba(2,8,18,0.85)', backdropFilter:'blur(10px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:100 }}>
          <div style={{ background:'rgba(12,22,40,0.98)', padding:'36px 48px', borderRadius:24, border:'1px solid rgba(255,255,255,0.1)', textAlign:'center', boxShadow:'0 30px 80px rgba(0,0,0,0.6)', animation:'menu-fade-in 0.3s ease both' }}>
            <h3 style={{ color:'#fff', marginTop:0, fontSize:22, fontWeight:700 }}>Pause Session?</h3>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13, marginBottom:28 }}>Your progress this session will be saved.</p>
            <div style={{ display:'flex', gap:14, justifyContent:'center' }}>
              <button onClick={cancelExit}
                style={{ padding:'12px 32px', background:'transparent', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', borderRadius:999, fontSize:14, fontWeight:700, cursor:'pointer' }}>
                Resume
              </button>
              <button onClick={() => router.push('/patients/home')}
                style={{ padding:'12px 32px', background:'#EF4444', border:'none', color:'#fff', borderRadius:999, fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 0 20px rgba(239,68,68,0.4)' }}>
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BACK BUTTON (top-left) ── */}
      <button onClick={handleBackClick}
        style={{ position:'absolute', top:16, left:16, zIndex:60, display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', padding:'9px 18px', borderRadius:999, color:'#fff', fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', backdropFilter:'blur(10px)', transition:'background 0.2s' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
      >
        <RotateCcw size={14} /> EXIT
      </button>
    </div>
  );
};

export default GameCanvas;