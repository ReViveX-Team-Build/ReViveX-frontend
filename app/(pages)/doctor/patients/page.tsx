'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Search, Bot, Shield, MessageCircle, ClipboardList, User } from 'lucide-react';

/* ─── Data ────────────────────────────────────────────────────────────────── */
const ALL_PATIENTS = [
  { id: '1',  name: 'P.B. De Silva',        pid: 'P001', adherence: 45,  lastSession: '2025-11-10', status: 'Low',    sub: 'Standard',     condition: 'Stroke',       hasProtocol: false },
  { id: '2',  name: 'Anura Dissanayaka',    pid: 'P002', adherence: 92,  lastSession: '2025-11-14', status: 'High',   sub: 'AI Companion', condition: 'TBI',          hasProtocol: true  },
  { id: '3',  name: 'Saeath Watawala',      pid: 'P003', adherence: 78,  lastSession: '2025-11-13', status: 'Medium', sub: 'AI Companion', condition: 'Stroke',       hasProtocol: true  },
  { id: '4',  name: 'Shifani Ameena',       pid: 'P004', adherence: 65,  lastSession: '2025-11-12', status: 'Medium', sub: 'Standard',     condition: 'Post-Surgery',  hasProtocol: false },
  { id: '5',  name: 'Percy Silva',          pid: 'P005', adherence: 88,  lastSession: '2025-11-14', status: 'High',   sub: 'AI Companion', condition: 'TBI',          hasProtocol: true  },
  { id: '6',  name: 'Athula Premachandra',  pid: 'P006', adherence: 52,  lastSession: '2025-11-14', status: 'Low',    sub: 'Standard',     condition: 'Stroke',       hasProtocol: false },
  { id: '7',  name: 'Aruni Perera',         pid: 'P007', adherence: 95,  lastSession: '2025-11-11', status: 'High',   sub: 'AI Companion', condition: 'Post-Surgery',  hasProtocol: true  },
  { id: '8',  name: 'Amal Mahendra',        pid: 'P008', adherence: 73,  lastSession: '2025-11-13', status: 'Medium', sub: 'Standard',     condition: 'TBI',          hasProtocol: true  },
  { id: '9',  name: 'Malkanthi Peris',      pid: 'P009', adherence: 25,  lastSession: '2025-11-12', status: 'Low',    sub: 'Standard',     condition: 'Stroke',       hasProtocol: false },
  { id: '10', name: 'K.K. Muththukumaran',  pid: 'P010', adherence: 76,  lastSession: '2025-11-15', status: 'High',   sub: 'AI Companion', condition: 'TBI',          hasProtocol: true  },
  { id: '11', name: 'Kamal Fernando',       pid: 'P011', adherence: 80,  lastSession: '2025-11-10', status: 'High',   sub: 'AI Companion', condition: 'Post-Surgery',  hasProtocol: true  },
  { id: '12', name: 'P.P. Sugathadasa',     pid: 'P012', adherence: 63,  lastSession: '2025-11-14', status: 'High',   sub: 'AI Companion', condition: 'Stroke',       hasProtocol: false },
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function adherenceColor(v: number) {
  if (v >= 80) return '#22c55e';
  if (v >= 55) return '#f97316';
  return '#ef4444';
}
function statusColor(s: string) {
  if (s === 'High')   return '#22c55e';
  if (s === 'Medium') return '#f97316';
  return '#ef4444';
}
/* ─── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  .mpp * { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; box-sizing: border-box; }
  .mpp .mono { font-family: 'JetBrains Mono', monospace; }

  @keyframes mppFadeUp {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes mppRowIn {
    from { opacity:0; transform:translateX(-6px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes mppShimmer {
    0%   { transform:translateX(-100%); }
    100% { transform:translateX(300%); }
  }
  @keyframes mppProtocolPing {
    0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.45); }
    50%     { box-shadow: 0 0 0 6px rgba(99,102,241,0); }
  }

  /* ── Search ─────────────────────────────────────────── */
  .mpp-search {
    width: 100%; padding: 10px 14px 10px 40px;
    background: #f8fafc; border: 1.5px solid #e2e8f0;
    border-radius: 12px; font-size: 13.5px; font-weight: 500; color: #0B1E33;
    outline: none; transition: all 0.2s ease;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .mpp-search::placeholder { color: #94a3b8; }
  .mpp-search:focus {
    background: #fff; border-color: rgba(45,212,191,0.65);
    box-shadow: 0 0 0 3px rgba(45,212,191,0.10);
  }

  /* ── Select ──────────────────────────────────────────── */
  .mpp-select {
    padding: 10px 38px 10px 16px;
    background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 13px center;
    border: 1.5px solid #e2e8f0; border-radius: 12px;
    font-size: 13.5px; font-weight: 600; color: #0B1E33;
    outline: none; cursor: pointer; -webkit-appearance: none; appearance: none;
    transition: all 0.2s ease; font-family: 'Plus Jakarta Sans', sans-serif; min-width: 155px;
  }
  .mpp-select:focus { border-color: rgba(45,212,191,0.65); box-shadow: 0 0 0 3px rgba(45,212,191,0.10); }

  /* ── Row ─────────────────────────────────────────────── */
  .mpp-tr { animation: mppRowIn 0.35s cubic-bezier(0.22,1,0.36,1) both; }
  .mpp-tr:hover td { background: rgba(45,212,191,0.025) !important; }
  .mpp-tr:last-child td { border-bottom: none !important; }

  /* ── Message button ──────────────────────────────────── */
  .mpp-msg-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 7px 14px; border-radius: 9px; font-size: 12px; font-weight: 700;
    border: 1.5px solid rgba(45,212,191,0.35);
    background: rgba(45,212,191,0.07); color: #0891b2;
    cursor: pointer; transition: all 0.18s ease; text-decoration: none; white-space: nowrap;
  }
  .mpp-msg-btn:hover {
    background: linear-gradient(135deg,#2DD4BF,#0891b2); color: #0B1E33;
    border-color: transparent; box-shadow: 0 4px 14px rgba(45,212,191,0.30);
    transform: translateY(-1px);
  }

  /* ── Protocol button ─────────────────────────────────── */
  .mpp-proto-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 7px 14px; border-radius: 9px; font-size: 12px; font-weight: 700;
    border: 1.5px solid rgba(99,102,241,0.30);
    background: rgba(99,102,241,0.07); color: #6366f1;
    cursor: pointer; transition: all 0.18s ease; text-decoration: none; white-space: nowrap;
    position: relative;
  }
  .mpp-proto-btn:hover {
    background: linear-gradient(135deg,#6366f1,#4f46e5); color: #fff;
    border-color: transparent; box-shadow: 0 4px 14px rgba(99,102,241,0.30);
    transform: translateY(-1px);
  }
  .mpp-proto-btn.has-protocol {
    animation: mppProtocolPing 3s ease-in-out infinite;
  }

  /* ── Protocol set badge ──────────────────────────────── */
  .mpp-proto-set {
    position: absolute; top: -5px; right: -5px;
    width: 12px; height: 12px; border-radius: 50%;
    background: #22c55e; border: 2px solid #fff;
    box-shadow: 0 0 5px rgba(34,197,94,0.6);
  }

  /* ── View Profile btn ────────────────────────────────── */
  .mpp-view-btn {
    display: inline-flex; align-items: center;
    padding: 7px 16px; border-radius: 9px; font-size: 12px; font-weight: 700;
    border: 1.5px solid #cbd5e1; background: #fff; color: #1e293b;
    cursor: pointer; transition: all 0.18s ease; text-decoration: none; white-space: nowrap;
  }
  .mpp-view-btn:hover {
    background: #0B1E33; color: #fff; border-color: #0B1E33;
    box-shadow: 0 4px 14px rgba(11,30,51,0.20); transform: translateY(-1px);
  }

  /* ── Condition badge ─────────────────────────────────── */
  .mpp-condition {
    display: inline-flex; align-items: center;
    padding: 3px 10px; border-radius: 99px;
    font-size: 11px; font-weight: 600;
    background: rgba(11,30,51,0.05);
    color: #475569; white-space: nowrap;
    border: 1px solid rgba(11,30,51,0.08);
  }

  /* ── Scrollbar ───────────────────────────────────────── */
  .mpp-scroll::-webkit-scrollbar { height: 4px; }
  .mpp-scroll::-webkit-scrollbar-thumb { background: rgba(45,212,191,0.28); border-radius: 99px; }

  /* ── Stats strip ─────────────────────────────────────── */
  @keyframes mppCountUp {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .mpp-stat {
    flex: 1; padding: 16px 20px; background: #fff;
    border-radius: 16px; border: 1px solid rgba(226,232,240,0.9);
    box-shadow: 0 2px 14px rgba(11,30,51,0.05);
    animation: mppCountUp 0.45s ease both;
  }

  @media (max-width: 1100px) { .mpp-stats { flex-wrap: wrap !important; } .mpp-stat { min-width: calc(50% - 8px); } }
  @media (max-width: 860px)  { .mpp-filter-row { flex-wrap: wrap !important; } .mpp-selects { flex-wrap: wrap; } }
  @media (max-width: 600px)  { .mpp .mpp-pad { padding: 20px 14px !important; } .mpp-title { font-size: 22px !important; } }
`;