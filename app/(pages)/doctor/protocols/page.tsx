'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Gamepad2, Zap, Settings2, Brain, Save,
  Play, Send, Activity, Volume2, Eye,
  BookOpen, Users, ChevronDown, Check,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════ */
const GAMES = [
  { value: 'synapse', label: 'Synapse Racer (Motor Focus)', benefit: 'Patients control altitude by squeezing the BP Bulb. This game promotes grip strength modulation, impulse control, and sustained motor output. Ideal for stroke and Parkinson\'s patients working on hand function recovery.' },
  { value: 'memory',  label: 'Memory Gate (Cognitive Dual-Task)', benefit: 'Navigate obstacles while memorising colour sequences. Combines fine motor control with working memory training. Designed for TBI and post-surgical cognitive rehabilitation.' },
  { value: 'rhythm',  label: 'Rhythm Reef (Timing & Coordination)', benefit: 'Match squeeze cadence to oncoming patterns. Trains rhythmic grip timing and finger-hand synchronisation. Suitable for stroke and neurological coordination disorders.' },
];

const SAVED_PROTOCOLS = [
  { name: 'Stroke Standard - Week 1',  game: 'Synapse Racer',  patients: 12 },
  { name: "Parkinson's Advanced",       game: 'Memory Gate',    patients: 8  },
  { name: 'TBI Cognitive Dual Task',   game: 'Memory Gate',    patients: 15 },
];

const DIFFICULTY_LABELS = ['Easy', 'Medium', 'Hard', 'Expert'];

/* ═══════════════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  .tp * { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; box-sizing: border-box; }
  .tp .mono { font-family: 'JetBrains Mono', monospace; }

  /* ── Keyframes ────────────────────────────────────────── */
  @keyframes tpFadeUp {
    from { opacity:0; transform:translateY(22px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes tpCardPop {
    0%   { opacity:0; transform:translateY(16px) scale(0.975); }
    100% { opacity:1; transform:translateY(0)    scale(1); }
  }
  @keyframes tpShimmer {
    0%   { transform:translateX(-200%) skewX(-15deg); }
    100% { transform:translateX(400%)  skewX(-15deg); }
  }
  @keyframes tpBarShimmer {
    0%   { transform:translateX(-100%); }
    100% { transform:translateX(300%); }
  }
  @keyframes tpGlow {
    0%,100% { box-shadow:0 0 0 0 rgba(45,212,191,0.40); }
    50%     { box-shadow:0 0 0 10px rgba(45,212,191,0); }
  }
  @keyframes tpScanLine {
    0%   { top:-4%;  opacity:0; }
    6%   { opacity:1; }
    92%  { opacity:0.5; }
    100% { top:108%; opacity:0; }
  }
  @keyframes tpDot {
    0%,100% { opacity:1; }
    50%     { opacity:0.3; }
  }
  @keyframes tpSensorFlash {
    0%,100% { color:#2DD4BF; }
    50%     { color:#67e8f9; }
  }
  @keyframes tpPulseRing {
    0%   { transform:scale(1);   opacity:0.6; }
    100% { transform:scale(2.2); opacity:0; }
  }
  @keyframes tpProtocolIn {
    from { opacity:0; transform:translateX(-12px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes tpToggleOn {
    from { transform:translateX(0); }
    to   { transform:translateX(22px); }
  }
  @keyframes tpToggleOff {
    from { transform:translateX(22px); }
    to   { transform:translateX(0); }
  }

  /* ── Card ─────────────────────────────────────────────── */
  .tp-card {
    background:#fff; border-radius:18px;
    border:1px solid rgba(226,232,240,0.9);
    box-shadow:0 2px 20px rgba(11,30,51,0.06);
    padding:24px;
    transition:box-shadow 0.28s ease;
  }
  .tp-card:hover { box-shadow:0 8px 40px rgba(11,30,51,0.10); }

  /* ── Section title ────────────────────────────────────── */
  .tp-section-title {
    display:flex; align-items:center; gap:10px;
    font-size:16px; font-weight:800; color:#0B1E33;
    margin-bottom:18px;
  }
  .tp-section-title .icon-wrap {
    width:32px; height:32px; border-radius:9px;
    display:flex; align-items:center; justify-content:center;
    background:rgba(45,212,191,0.10); color:#2DD4BF; flex-shrink:0;
  }

  /* ── Game select ──────────────────────────────────────── */
  .tp-game-select {
    width:100%; padding:11px 36px 11px 14px;
    background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 13px center;
    border:1.5px solid #e2e8f0; border-radius:12px;
    font-size:14px; font-weight:600; color:#0B1E33;
    outline:none; cursor:pointer; -webkit-appearance:none; appearance:none;
    transition:all 0.2s ease;
    font-family:'Plus Jakarta Sans', sans-serif;
  }
  .tp-game-select:focus {
    border-color:rgba(45,212,191,0.6);
    box-shadow:0 0 0 3px rgba(45,212,191,0.10);
  }

  /* ── Medical benefit box ──────────────────────────────── */
  .tp-benefit {
    background:rgba(240,253,250,1);
    border:1px solid rgba(45,212,191,0.22);
    border-radius:12px; padding:14px 16px; margin-top:14px;
  }
  .tp-benefit-label { font-size:13px; font-weight:700; color:#0f766e; margin-bottom:6px; }
  .tp-benefit-text  { font-size:12.5px; color:#475569; line-height:1.7; }

  /* ── Input source pills ───────────────────────────────── */
  .tp-pill {
    display:inline-flex; align-items:center; gap:6px;
    padding:7px 16px; border-radius:99px;
    font-size:12.5px; font-weight:700; cursor:pointer;
    border:1.5px solid transparent; transition:all 0.2s ease;
    font-family:'Plus Jakarta Sans',sans-serif;
  }
  .tp-pill.active {
    background:rgba(45,212,191,0.10);
    border-color:rgba(45,212,191,0.40); color:#0f766e;
  }
  .tp-pill.inactive {
    background:#f8fafc; border-color:#e2e8f0; color:#64748b;
  }
  .tp-pill.inactive:hover { border-color:rgba(45,212,191,0.30); color:#0f766e; }

  /* ── Hand selection ───────────────────────────────────── */
  .tp-hand-btn {
    flex:1; padding:13px 10px; border-radius:12px;
    font-size:13.5px; font-weight:700; cursor:pointer;
    display:flex; align-items:center; justify-content:center; gap:8px;
    transition:all 0.22s ease; border:1.5px solid #e2e8f0;
    font-family:'Plus Jakarta Sans',sans-serif;
  }
  .tp-hand-btn.active {
    border-color:#2DD4BF; color:#0f766e;
    background:rgba(45,212,191,0.07);
    box-shadow:0 0 0 3px rgba(45,212,191,0.12);
  }
  .tp-hand-btn.inactive { background:#fff; color:#475569; }
  .tp-hand-btn.inactive:hover { border-color:rgba(45,212,191,0.30); }

  /* ── Custom range slider ──────────────────────────────── */
  .tp-slider {
    -webkit-appearance:none; appearance:none;
    width:100%; height:6px; border-radius:99px; outline:none; cursor:pointer;
  }
  .tp-slider.teal {
    background:linear-gradient(to right, #2DD4BF var(--val,45%), #e2e8f0 var(--val,45%));
  }
  .tp-slider.purple {
    background:linear-gradient(to right, #8b5cf6 var(--val,50%), #e2e8f0 var(--val,50%));
  }
  .tp-slider::-webkit-slider-thumb {
    -webkit-appearance:none; appearance:none;
    width:18px; height:18px; border-radius:50%; cursor:pointer;
    border:3px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.18);
    transition:transform 0.15s ease;
  }
  .tp-slider.teal::-webkit-slider-thumb  { background:#2DD4BF; }
  .tp-slider.purple::-webkit-slider-thumb { background:#8b5cf6; }
  .tp-slider::-webkit-slider-thumb:hover { transform:scale(1.2); }

  /* ── Toggle switch ────────────────────────────────────── */
  .tp-toggle-wrap {
    display:flex; align-items:center; justify-content:space-between;
    padding:14px 16px; border-radius:14px;
    background:rgba(240,244,248,0.7);
    border:1px solid rgba(226,232,240,0.8);
    cursor:pointer; transition:all 0.2s ease;
  }
  .tp-toggle-wrap:hover { background:rgba(240,253,250,0.8); border-color:rgba(45,212,191,0.22); }
  .tp-toggle-track {
    width:46px; height:24px; border-radius:99px;
    position:relative; transition:background 0.25s ease; flex-shrink:0;
  }
  .tp-toggle-track.on  { background:#2DD4BF; }
  .tp-toggle-track.off { background:#cbd5e1; }
  .tp-toggle-thumb {
    position:absolute; top:3px;
    width:18px; height:18px; border-radius:50%;
    background:#fff; box-shadow:0 2px 6px rgba(0,0,0,0.20);
    transition:left 0.25s cubic-bezier(0.22,1,0.36,1);
  }
  .tp-toggle-track.on  .tp-toggle-thumb { left:25px; }
  .tp-toggle-track.off .tp-toggle-thumb { left:3px; }

  /* ── Session duration input ───────────────────────────── */
  .tp-dur-input {
    width:80px; padding:10px 12px; border-radius:10px;
    border:1.5px solid #e2e8f0; font-size:14px; font-weight:700;
    color:#0B1E33; outline:none; text-align:center;
    transition:all 0.2s ease;
    font-family:'JetBrains Mono', monospace;
  }
  .tp-dur-input:focus {
    border-color:rgba(45,212,191,0.6);
    box-shadow:0 0 0 3px rgba(45,212,191,0.10);
  }

  /* ── Action buttons ───────────────────────────────────── */
  .tp-btn-preview {
    flex:1; padding:12px; border-radius:13px; border:none; cursor:pointer;
    background:linear-gradient(135deg,#2DD4BF,#0891b2);
    color:#0B1E33; font-size:14px; font-weight:800;
    display:flex; align-items:center; justify-content:center; gap:8px;
    box-shadow:0 4px 20px rgba(45,212,191,0.35);
    transition:all 0.22s ease; position:relative; overflow:hidden;
    font-family:'Plus Jakarta Sans',sans-serif;
  }
  .tp-btn-preview::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);
    animation:tpShimmer 2.8s ease-in-out infinite;
  }
  .tp-btn-preview:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(45,212,191,0.45); }

  .tp-btn-assign {
    flex:1; padding:12px; border-radius:13px; border:none; cursor:pointer;
    background:linear-gradient(135deg,#6366f1,#4f46e5);
    color:#fff; font-size:14px; font-weight:800;
    display:flex; align-items:center; justify-content:center; gap:8px;
    box-shadow:0 4px 20px rgba(99,102,241,0.30);
    transition:all 0.22s ease; position:relative; overflow:hidden;
    font-family:'Plus Jakarta Sans',sans-serif;
  }
  .tp-btn-assign::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.20),transparent);
    animation:tpShimmer 3s ease-in-out infinite 0.4s;
  }
  .tp-btn-assign:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(99,102,241,0.40); }

  .tp-btn-save {
    flex:1; padding:12px; border-radius:13px; border:none; cursor:pointer;
    background:#334155; color:#fff;
    font-size:14px; font-weight:800;
    display:flex; align-items:center; justify-content:center; gap:8px;
    box-shadow:0 4px 16px rgba(51,65,85,0.25);
    transition:all 0.22s ease;
    font-family:'Plus Jakarta Sans',sans-serif;
  }
  .tp-btn-save:hover { background:#1e293b; transform:translateY(-2px); box-shadow:0 8px 24px rgba(30,41,59,0.30); }

  /* ── Saved protocol item ──────────────────────────────── */
  .tp-protocol-item {
    padding:14px 16px; border-radius:12px;
    border:1px solid rgba(226,232,240,0.8);
    transition:all 0.2s ease; cursor:pointer;
    animation:tpProtocolIn 0.4s cubic-bezier(0.22,1,0.36,1) both;
  }
  .tp-protocol-item:hover {
    border-color:rgba(45,212,191,0.35);
    background:rgba(240,253,250,0.6);
    transform:translateX(3px);
  }

  /* ── Responsive ───────────────────────────────────────── */
  .tp-main-grid { display:grid; grid-template-columns:1fr 1fr; gap:22px; align-items:start; }
  @media (max-width:1050px) { .tp-main-grid { grid-template-columns:1fr; } }
  @media (max-width:600px)  {
    .tp .tp-outer { padding:18px 14px !important; }
    .tp-btn-row { flex-direction:column !important; }
  }
`;

/* ═══════════════════════════════════════════════════════════
   ANIMATED GAME CANVAS
═══════════════════════════════════════════════════════════ */
interface Pipe { x: number; gapY: number; scored: boolean; }

const GameCanvas: React.FC<{ pressure: number; hand: string }> = ({ pressure, hand }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef({
    pipes: [
      { x: 340, gapY: 120, scored: false },
      { x: 560, gapY: 90,  scored: false },
    ] as Pipe[],
    ballY:   140,
    score:   42,
    t:       0,
    raf:     0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
    };
    resize();

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const s = stateRef.current;
      const W = canvas.width  / dpr;
      const H = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      s.t += 0.018;

      /* ── Sky gradient ── */
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0,   '#b8e4f9');
      sky.addColorStop(1,   '#ddf0fc');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      /* ── Subtle grid ── */
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 36) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 36) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      /* ── Guide dashed line ── */
      ctx.setLineDash([8, 5]);
      ctx.strokeStyle = 'rgba(45,212,191,0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, H / 2);
      ctx.lineTo(W, H / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      /* ── Pipes ── */
      const PIPE_W  = 52;
      const GAP     = 110;
      const PIPE_SPD = 1.1;

      s.pipes.forEach(pipe => {
        pipe.x -= PIPE_SPD;
        if (pipe.x < -PIPE_W) {
          pipe.x   = W + 20;
          pipe.gapY = 70 + Math.random() * (H - 160);
          pipe.scored = false;
        }
        if (!pipe.scored && pipe.x < 80) { s.score++; pipe.scored = true; }

        // Top pipe
        const pipeGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_W, 0);
        pipeGrad.addColorStop(0, '#1a9a4a');
        pipeGrad.addColorStop(0.4, '#22c55e');
        pipeGrad.addColorStop(1, '#16a34a');
        ctx.fillStyle = pipeGrad;
        ctx.beginPath();
        ctx.roundRect(pipe.x, 0, PIPE_W, pipe.gapY, [0, 0, 6, 6]);
        ctx.fill();
        // Cap
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.roundRect(pipe.x - 4, pipe.gapY - 18, PIPE_W + 8, 18, [4, 4, 0, 0]);
        ctx.fill();

        // Bottom pipe
        const btmY = pipe.gapY + GAP;
        ctx.fillStyle = pipeGrad;
        ctx.beginPath();
        ctx.roundRect(pipe.x, btmY, PIPE_W, H - btmY, [6, 6, 0, 0]);
        ctx.fill();
        // Cap
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.roundRect(pipe.x - 4, btmY, PIPE_W + 8, 18, [0, 0, 4, 4]);
        ctx.fill();

        // Pipe shine
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(pipe.x + 8, 0, 10, pipe.gapY);
        ctx.fillRect(pipe.x + 8, btmY, 10, H - btmY);
      });

      /* ── Ball ── */
      const ballX = W * 0.22;
      s.ballY = (H / 2) + Math.sin(s.t * 1.3) * 55;

      // Glow
      const glowR = ctx.createRadialGradient(ballX, s.ballY, 0, ballX, s.ballY, 28);
      glowR.addColorStop(0, 'rgba(251,146,60,0.5)');
      glowR.addColorStop(1, 'rgba(251,146,60,0)');
      ctx.fillStyle = glowR;
      ctx.beginPath(); ctx.arc(ballX, s.ballY, 28, 0, Math.PI * 2); ctx.fill();

      // Ball body
      const ballGrad = ctx.createRadialGradient(ballX - 5, s.ballY - 5, 2, ballX, s.ballY, 18);
      ballGrad.addColorStop(0, '#fde68a');
      ballGrad.addColorStop(0.5, '#fb923c');
      ballGrad.addColorStop(1, '#ea580c');
      ctx.fillStyle = ballGrad;
      ctx.beginPath(); ctx.arc(ballX, s.ballY, 18, 0, Math.PI * 2); ctx.fill();

      // Shine
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(ballX - 5, s.ballY - 7, 7, 5, -0.5, 0, Math.PI * 2); ctx.fill();

      /* ── Score ── */
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(String(s.score), 18, 38);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText('SCORE', 18, 54);

      s.raf = requestAnimationFrame(draw);
    };

    s.raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(stateRef.current.raf);
  }, []);

  const s = stateRef.current;

  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(226,232,240,0.8)' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 240, display: 'block' }}
      />
      {/* Live Sensor Data tooltip */}
      <div style={{
        position: 'absolute', top: 14, right: 14,
        background: '#0B1E33',
        borderRadius: 10, padding: '10px 14px',
        border: '1px solid rgba(45,212,191,0.22)',
        boxShadow: '0 4px 20px rgba(11,30,51,0.40)',
        minWidth: 155,
        animation: 'tpCardPop 0.4s ease both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2DD4BF', boxShadow: '0 0 6px #2DD4BF', animation: 'tpDot 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '0.04em' }}>Live Sensor Data</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
          <Activity size={11} color="#2DD4BF" />
          <span className="mono" style={{ fontSize: 11, color: '#2DD4BF', animation: 'tpSensorFlash 2.2s ease-in-out infinite' }}>
            Pressure: {pressure}kPa
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Zap size={11} color="#fbbf24" />
          <span className="mono" style={{ fontSize: 11, color: '#fbbf24' }}>Hand: {hand}</span>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   TOGGLE COMPONENT
═══════════════════════════════════════════════════════════ */
function Toggle({ on, onChange, label, sub }: { on: boolean; onChange: () => void; label: string; sub: string }) {
  return (
    <div className="tp-toggle-wrap" onClick={onChange}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0B1E33' }}>{label}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{sub}</div>
      </div>
      <div className={`tp-toggle-track ${on ? 'on' : 'off'}`}>
        <div className="tp-toggle-thumb" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function TherapyProtocolsPage() {
  const [mounted,      setMounted]      = useState(false);
  const [game,         setGame]         = useState('synapse');
  const [inputSrc,     setInputSrc]     = useState<'bp' | 'imu'>('bp');
  const [hand,         setHand]         = useState<'left' | 'right'>('right');
  const [gripForce,    setGripForce]    = useState(45);
  const [tremor,       setTremor]       = useState(true);
  const [difficulty,   setDifficulty]   = useState(1);
  const [duration,     setDuration]     = useState(15);
  const [audioHints,   setAudioHints]   = useState(true);
  const [visualGuides, setVisualGuides] = useState(true);
  const [pressure,     setPressure]     = useState(45);
  const [savedMsg,     setSavedMsg]     = useState('');

  useEffect(() => { setMounted(true); }, []);

  // Animate live pressure value
  useEffect(() => {
    if (!mounted) return;
    const iv = setInterval(() => {
      setPressure(p => Math.max(30, Math.min(75, p + (Math.random() - 0.5) * 6)));
    }, 1400);
    return () => clearInterval(iv);
  }, [mounted]);

  const selectedGame = GAMES.find(g => g.value === game) ?? GAMES[0];
  const diffLabel = DIFFICULTY_LABELS[Math.min(difficulty, 3)];

  const handleSave = () => {
    setSavedMsg('Protocol saved!');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  if (!mounted) return null;

  return (
    <div className="tp" style={{ minHeight: '100vh', background: '#F0F4F8', paddingBottom: 52 }}>
      <style>{CSS}</style>

      {/* ── Ambient BG ─────────────────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-8%', right: '6%', width: 700, height: 700, background: 'radial-gradient(circle,rgba(45,212,191,0.055),transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '4%', width: 600, height: 600, background: 'radial-gradient(circle,rgba(99,102,241,0.04),transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(11,30,51,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(11,30,51,0.022) 1px,transparent 1px)', backgroundSize: '52px 52px' }} />
      </div>

      <div className="tp-outer" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 28px', position: 'relative', zIndex: 1 }}>

        {/* ── Page Header ──────────────────────────────────────────── */}
        <div style={{ marginBottom: 28, animation: 'tpFadeUp 0.55s ease both' }}>
          <p className="mono" style={{ fontSize: 9.5, color: 'rgba(45,212,191,0.75)', textTransform: 'uppercase', letterSpacing: '0.20em', marginBottom: 5, fontWeight: 600 }}>
            Neuro-Rehabilitation
          </p>
          <h1 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 800, color: '#0B1E33', margin: 0, lineHeight: 1.15 }}>
            Therapy Protocols &amp; <span style={{ color: '#2DD4BF' }}>Game Configuration</span>
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 6, fontWeight: 500 }}>
            Configure hardware-controlled therapeutic games for patient rehabilitation
          </p>
        </div>

        {/* ── Main Grid ──────────────────────────────────────────────── */}
        <div className="tp-main-grid">

          {/* ═══ LEFT COLUMN ═══════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── 1. Game Selection ─────────────────────────────────── */}
            <div className="tp-card" style={{ animation: 'tpCardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.06s both' }}>
              <div className="tp-section-title">
                <span className="icon-wrap"><Gamepad2 size={16} /></span>
                Game Selection
              </div>

              <select className="tp-game-select" value={game} onChange={e => setGame(e.target.value)}>
                {GAMES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>

              <div className="tp-benefit">
                <div className="tp-benefit-label">Medical Benefit:</div>
                <div className="tp-benefit-text">{selectedGame.benefit}</div>
              </div>
            </div>

            {/* ── 2. Hardware Calibration ───────────────────────────── */}
            <div className="tp-card" style={{ animation: 'tpCardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.13s both' }}>
              <div className="tp-section-title">
                <span className="icon-wrap"><Settings2 size={16} /></span>
                Hardware Calibration
              </div>

              {/* Input Source */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 10 }}>Input Source</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className={`tp-pill ${inputSrc === 'bp' ? 'active' : 'inactive'}`} onClick={() => setInputSrc('bp')}>
                    <Activity size={13} /> BP Bulb Pressure
                  </button>
                  <button className={`tp-pill ${inputSrc === 'imu' ? 'active' : 'inactive'}`} onClick={() => setInputSrc('imu')}>
                    <Zap size={13} /> IMU Motion
                  </button>
                </div>
              </div>

              {/* Hand Selection */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 10 }}>Hand Selection</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className={`tp-hand-btn ${hand === 'left' ? 'active' : 'inactive'}`} onClick={() => setHand('left')}>
                    <span style={{ fontSize: 17 }}>🤚</span> Left Hand
                  </button>
                  <button className={`tp-hand-btn ${hand === 'right' ? 'active' : 'inactive'}`} onClick={() => setHand('right')}>
                    <span style={{ fontSize: 17 }}>✋</span> Right Hand
                  </button>
                </div>
              </div>

              {/* Grip Force Sensitivity */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0B1E33' }}>Grip Force Sensitivity (MVC)</div>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 800, color: '#2DD4BF' }}>{gripForce}%</span>
                </div>
                <input
                  type="range" min={5} max={100} value={gripForce}
                  className="tp-slider teal"
                  style={{ '--val': `${gripForce}%` } as React.CSSProperties}
                  onChange={e => setGripForce(Number(e.target.value))}
                />
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 8, lineHeight: 1.6 }}>
                  Set the squeeze force required to control the game (% of Maximum Voluntary Contraction)
                </p>
              </div>

              {/* Tremor Filter */}
              <Toggle
                on={tremor}
                onChange={() => setTremor(v => !v)}
                label="Tremor Filter"
                sub="Active stabilization to reduce tremor artifacts"
              />
            </div>

            {/* ── 3. Game Logic Settings ────────────────────────────── */}
            <div className="tp-card" style={{ animation: 'tpCardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.20s both' }}>
              <div className="tp-section-title">
                <span className="icon-wrap" style={{ background: 'rgba(99,102,241,0.10)', color: '#6366f1' }}><Brain size={16} /></span>
                Game Logic Settings
              </div>

              {/* Speed / Difficulty */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0B1E33' }}>Speed / Difficulty</div>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>{diffLabel}</span>
                </div>
                <input
                  type="range" min={0} max={3} value={difficulty}
                  className="tp-slider purple"
                  style={{ '--val': `${(difficulty / 3) * 100}%` } as React.CSSProperties}
                  onChange={e => setDifficulty(Number(e.target.value))}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  {DIFFICULTY_LABELS.map((l, i) => (
                    <span key={l} className="mono" style={{ fontSize: 9, color: i === difficulty ? '#6366f1' : '#94a3b8', fontWeight: i === difficulty ? 700 : 500, letterSpacing: '0.08em' }}>{l}</span>
                  ))}
                </div>
              </div>

              {/* Session Duration */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0B1E33', marginBottom: 10 }}>Session Duration</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    type="number" min={5} max={60} value={duration}
                    className="tp-dur-input"
                    onChange={e => setDuration(Number(e.target.value))}
                  />
                  <span style={{ fontSize: 13.5, color: '#64748b', fontWeight: 500 }}>minutes</span>
                </div>
              </div>

              {/* Assistance Cues */}
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0B1E33', marginBottom: 12 }}>Assistance Cues</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Toggle
                    on={audioHints}
                    onChange={() => setAudioHints(v => !v)}
                    label="Audio Hints"
                    sub="Voice prompts and sound cues during gameplay"
                  />
                  <Toggle
                    on={visualGuides}
                    onChange={() => setVisualGuides(v => !v)}
                    label="Visual Path Guides"
                    sub="Overlay guides to assist target navigation"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ═══ RIGHT COLUMN ══════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Live Preview ─────────────────────────────────────── */}
            <div className="tp-card" style={{
              animation: 'tpCardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.08s both',
              position: 'sticky', top: 20,
            }}>
              <div className="tp-section-title">
                <span className="icon-wrap" style={{ background: 'rgba(251,191,36,0.12)', color: '#f59e0b' }}>
                  <Zap size={16} />
                </span>
                Live Preview
              </div>

              <GameCanvas pressure={Math.round(pressure)} hand={hand === 'right' ? 'Right' : 'Left'} />

              {/* Buttons */}
              <div className="tp-btn-row" style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="tp-btn-preview">
                  <Play size={16} fill="currentColor" style={{ position: 'relative', zIndex: 2 }} />
                  <span style={{ position: 'relative', zIndex: 2 }}>Preview</span>
                </button>
                <button className="tp-btn-assign">
                  <Send size={15} style={{ position: 'relative', zIndex: 2 }} />
                  <span style={{ position: 'relative', zIndex: 2 }}>Assign</span>
                </button>
                <button className="tp-btn-save" onClick={handleSave}>
                  <Save size={15} />
                  {savedMsg || 'Save'}
                </button>
              </div>
            </div>

            {/* ── Saved Protocols ───────────────────────────────────── */}
            <div className="tp-card" style={{ animation: 'tpCardPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.18s both' }}>
              <div className="tp-section-title">
                <span className="icon-wrap" style={{ background: 'rgba(99,102,241,0.10)', color: '#6366f1' }}>
                  <BookOpen size={16} />
                </span>
                Saved Protocols
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {SAVED_PROTOCOLS.map((proto, i) => (
                  <div
                    key={proto.name}
                    className="tp-protocol-item"
                    style={{ animationDelay: `${0.22 + i * 0.07}s` }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0B1E33' }}>{proto.name}</span>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(45,212,191,0.10)', border: '1px solid rgba(45,212,191,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronDown size={12} color="#2DD4BF" style={{ transform: 'rotate(-90deg)' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{proto.game}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>•</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Users size={11} color="#94a3b8" />
                        <span className="mono" style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{proto.patients} patients assigned</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* New protocol CTA */}
              <button style={{
                width: '100%', marginTop: 14, padding: '11px',
                borderRadius: 12, border: '1.5px dashed rgba(45,212,191,0.35)',
                background: 'rgba(240,253,250,0.6)', color: '#0f766e',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                transition: 'all 0.2s ease',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(45,212,191,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(240,253,250,0.6)')}
              >
                + Save Current as New Protocol
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}