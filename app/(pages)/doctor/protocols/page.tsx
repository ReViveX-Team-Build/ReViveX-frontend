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