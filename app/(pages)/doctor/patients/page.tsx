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