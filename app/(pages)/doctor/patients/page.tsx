'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Search, Bot, Shield } from 'lucide-react';

/* ─── Data ────────────────────────────────────────────────────────────────── */
const ALL_PATIENTS = [
  { id: '1',  name: 'P.B. De Silva',        pid: 'P001', adherence: 45,  lastSession: '2025-11-10', status: 'Low',    sub: 'Standard',     condition: 'Stroke'       },
  { id: '2',  name: 'Anura Dissanayaka',    pid: 'P002', adherence: 92,  lastSession: '2025-11-14', status: 'High',   sub: 'AI Companion', condition: 'TBI'          },
  { id: '3',  name: 'Saeath Watawala',          pid: 'P003', adherence: 78,  lastSession: '2025-11-13', status: 'Medium', sub: 'AI Companion', condition: 'Stroke'       },
  { id: '4',  name: 'Shifani Ameena',       pid: 'P004', adherence: 65,  lastSession: '2025-11-12', status: 'Medium', sub: 'Standard',     condition: 'Post-Surgery' },
  { id: '5',  name: 'Percy Silva',          pid: 'P005', adherence: 88,  lastSession: '2025-11-14', status: 'High',   sub: 'AI Companion', condition: 'TBI'          },
  { id: '6',  name: 'Athula Premachandra',  pid: 'P006', adherence: 52,  lastSession: '2025-11-14', status: 'Low',    sub: 'Standard',     condition: 'Stroke'       },
  { id: '7',  name: 'Aruni Perera',         pid: 'P007', adherence: 95,  lastSession: '2025-11-11', status: 'High',   sub: 'AI Companion', condition: 'Post-Surgery' },
  { id: '8',  name: 'Amal Mahendra',        pid: 'P008', adherence: 73,  lastSession: '2025-11-13', status: 'Medium', sub: 'Standard',     condition: 'TBI'          },
  { id: '9',  name: 'Malkanthi Peris',      pid: 'P009', adherence: 25,  lastSession: '2025-11-12', status: 'Low',    sub: 'Standard',     condition: 'Stroke'       },
  { id: '10', name: 'K.K. Muththukumaran', pid: 'P010', adherence: 76,  lastSession: '2025-11-15', status: 'High',   sub: 'AI Companion', condition: 'TBI'          },
  { id: '11', name: 'Kamal Fernando',       pid: 'P011', adherence: 80,  lastSession: '2025-11-10', status: 'High',   sub: 'AI Companion', condition: 'Post-Surgery' },
  { id: '12', name: 'P.P. Sugathadasa',     pid: 'P012', adherence: 63,  lastSession: '2025-11-14', status: 'High',   sub: 'AI Companion', condition: 'Stroke'       },
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
    from { opacity:0; transform:translateX(-8px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes mppShimmer {
    0%   { transform:translateX(-100%); }
    100% { transform:translateX(300%); }
  }

  /* Search */
  .mpp-search {
    width: 100%;
    padding: 10px 14px 10px 40px;
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    font-size: 13.5px; font-weight: 500; color: #0B1E33;
    outline: none; transition: all 0.2s ease;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .mpp-search::placeholder { color: #94a3b8; }
  .mpp-search:focus {
    background: #fff;
    border-color: rgba(45,212,191,0.65);
    box-shadow: 0 0 0 3px rgba(45,212,191,0.10);
  }

  /* Select */
  .mpp-select {
    padding: 10px 38px 10px 16px;
    background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 13px center;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px; font-size: 13.5px; font-weight: 600;
    color: #0B1E33; outline: none; cursor: pointer;
    -webkit-appearance: none; appearance: none;
    transition: all 0.2s ease;
    font-family: 'Plus Jakarta Sans', sans-serif;
    min-width: 155px;
  }
  .mpp-select:focus {
    border-color: rgba(45,212,191,0.65);
    box-shadow: 0 0 0 3px rgba(45,212,191,0.10);
  }

  /* Row hover */
  .mpp-tr { animation: mppRowIn 0.35s cubic-bezier(0.22,1,0.36,1) both; }
  .mpp-tr:hover td { background: rgba(45,212,191,0.028) !important; }
  .mpp-tr:last-child td { border-bottom: none !important; }

  /* Message btn */
  .mpp-msg-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 7px 16px; border-radius: 9px;
    font-size: 12.5px; font-weight: 700;
    border: 1.5px solid rgba(45,212,191,0.35);
    background: rgba(45,212,191,0.07); color: #0891b2;
    cursor: pointer; transition: all 0.18s ease;
    text-decoration: none; white-space: nowrap;
  }
  .mpp-msg-btn:hover {
    background: linear-gradient(135deg,#2DD4BF,#0891b2);
    color: #0B1E33; border-color: transparent;
    box-shadow: 0 4px 14px rgba(45,212,191,0.30);
    transform: translateY(-1px);
  }

  /* View Profile btn */
  .mpp-view-btn {
    display: inline-flex; align-items: center;
    padding: 7px 18px; border-radius: 9px;
    font-size: 12.5px; font-weight: 700;
    border: 1.5px solid #cbd5e1;
    background: #fff; color: #1e293b;
    cursor: pointer; transition: all 0.18s ease;
    text-decoration: none; white-space: nowrap;
  }
  .mpp-view-btn:hover {
    background: #0B1E33; color: #fff;
    border-color: #0B1E33;
    box-shadow: 0 4px 14px rgba(11,30,51,0.20);
    transform: translateY(-1px);
  }

  /* Horizontal scroll */
  .mpp-scroll::-webkit-scrollbar { height: 4px; }
  .mpp-scroll::-webkit-scrollbar-thumb { background: rgba(45,212,191,0.28); border-radius: 99px; }

  @media (max-width: 860px) {
    .mpp-filter-row { flex-wrap: wrap !important; }
    .mpp-selects { flex-wrap: wrap; }
  }
  @media (max-width: 600px) {
    .mpp .mpp-pad { padding: 20px 14px !important; }
    .mpp-title { font-size: 22px !important; }
  }
`;

/* ─── Adherence Bar ───────────────────────────────────────────────────────── */
function AdherenceBar({ value, delay = 0 }: { value: number; delay?: number }) {
  const [w, setW] = useState(0);
  const color = adherenceColor(value);
  useEffect(() => {
    const t = setTimeout(() => setW(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 68, height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{
          height: '100%', borderRadius: 99, width: `${w}%`,
          background: color,
          transition: 'width 1.0s cubic-bezier(0.22,1,0.36,1)',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)', animation: 'mppShimmer 2.2s ease-in-out infinite' }} />
        </div>
      </div>
      <span className="mono" style={{ fontSize: 12, fontWeight: 700, color, minWidth: 32 }}>{value}%</span>
    </div>
  );
}

/* ─── Sub Badge ───────────────────────────────────────────────────────────── */
function SubBadge({ type }: { type: string }) {
  const isAI = type === 'AI Companion';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 13px', borderRadius: 99,
      background: isAI ? '#0B1E33' : '#f1f5f9',
      color: isAI ? '#2DD4BF' : '#475569',
      fontSize: 11.5, fontWeight: 700,
      border: isAI ? '1px solid rgba(45,212,191,0.18)' : '1px solid #e2e8f0',
      whiteSpace: 'nowrap',
    }}>
      {isAI ? <Bot size={11} /> : <Shield size={11} />}
      {type}
    </span>
  );
}

/* ─── Status Dot ──────────────────────────────────────────────────────────── */
function StatusDot({ status }: { status: string }) {
  const color = statusColor(status);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}80`, flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{status}</span>
    </div>
  );
}

/* ─── Table header cell ───────────────────────────────────────────────────── */
function TH({ children }: { children: React.ReactNode }) {
  return (
    <th style={{
      padding: '13px 18px', textAlign: 'left',
      fontSize: 10.5, fontWeight: 700, color: '#64748b',
      textTransform: 'uppercase', letterSpacing: '0.10em',
      fontFamily: "'JetBrains Mono', monospace",
      borderBottom: '1.5px solid #e2e8f0',
      background: '#fff', whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function DoctorPatientsPage() {
  const [search, setSearch]                   = useState('');
  const [adherenceFilter, setAdherenceFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [mounted, setMounted]                 = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const filtered = useMemo(() =>
    ALL_PATIENTS.filter(p => {
      const q = search.toLowerCase();
      const matchQ = p.name.toLowerCase().includes(q) || p.pid.toLowerCase().includes(q);
      const matchA =
        adherenceFilter === 'all'                                ||
        (adherenceFilter === 'high'   && p.status === 'High')   ||
        (adherenceFilter === 'medium' && p.status === 'Medium') ||
        (adherenceFilter === 'low'    && p.status === 'Low');
      const matchC =
        conditionFilter === 'all' ||
        p.condition.toLowerCase().replace(/[\s-]/g, '') === conditionFilter.toLowerCase().replace(/[\s-]/g, '');
      return matchQ && matchA && matchC;
    }),
  [search, adherenceFilter, conditionFilter]);

  if (!mounted) return null;

  return (
    <div className="mpp" style={{ minHeight: '100vh', background: '#F0F4F8' }}>
      <style>{CSS}</style>

      <div className="mpp-pad" style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 28px' }}>

        {/* ── Title ──────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 26, animation: 'mppFadeUp 0.45s ease both' }}>
          <h1 className="mpp-title" style={{ fontSize: 26, fontWeight: 800, color: '#0B1E33', margin: 0 }}>
            My Patients
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 5, fontWeight: 500 }}>
            Manage and monitor all your patients
          </p>
        </div>

        {/* ── Filters ────────────────────────────────────────────────── */}
        <div className="mpp-filter-row" style={{
          display: 'flex', alignItems: 'center', gap: 14,
          marginBottom: 20,
          animation: 'mppFadeUp 0.45s ease 0.07s both',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', width: 260, flexShrink: 0 }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              className="mpp-search"
              placeholder="Search by name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ flex: 1 }} />

          {/* Dropdowns */}
          <div className="mpp-selects" style={{ display: 'flex', gap: 10 }}>
            <select className="mpp-select" value={adherenceFilter} onChange={e => setAdherenceFilter(e.target.value)}>
              <option value="all">All Adherence</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select className="mpp-select" value={conditionFilter} onChange={e => setConditionFilter(e.target.value)}>
              <option value="all">All Conditions</option>
              <option value="stroke">Stroke</option>
              <option value="tbi">TBI</option>
              <option value="postsurgery">Post-Surgery</option>
            </select>
          </div>
        </div>

        {/* ── Table card ─────────────────────────────────────────────── */}
        <div style={{
          background: '#fff',
          border: '2px solid #2DD4BF',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 4px 28px rgba(45,212,191,0.10)',
          animation: 'mppFadeUp 0.45s ease 0.13s both',
        }}>
          <div className="mpp-scroll" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>

              <thead>
                <tr>
                  <TH>Patient Name</TH>
                  <TH>Patient ID</TH>
                  <TH>Adherence</TH>
                  <TH>Last Session</TH>
                  <TH>Status</TH>
                  <TH>Subscription</TH>
                  <TH>Message</TH>
                  <TH>Action</TH>
                </tr>
              </thead>

              <tbody>
                {filtered.map((p, i) => (
                  <tr
                    key={p.id}
                    className="mpp-tr"
                    style={{ animationDelay: `${0.13 + i * 0.038}s` }}
                  >
                    {/* Name */}
                    <td style={{ padding: '16px 18px', borderBottom: '1.5px dashed rgba(45,212,191,0.30)', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0B1E33' }}>{p.name}</span>
                    </td>

                    {/* ID */}
                    <td style={{ padding: '16px 18px', borderBottom: '1.5px dashed rgba(45,212,191,0.30)', verticalAlign: 'middle' }}>
                      <span className="mono" style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{p.pid}</span>
                    </td>

                    {/* Adherence */}
                    <td style={{ padding: '16px 18px', borderBottom: '1.5px dashed rgba(45,212,191,0.30)', verticalAlign: 'middle' }}>
                      <AdherenceBar value={p.adherence} delay={120 + i * 35} />
                    </td>

                    {/* Last session */}
                    <td style={{ padding: '16px 18px', borderBottom: '1.5px dashed rgba(45,212,191,0.30)', verticalAlign: 'middle' }}>
                      <span className="mono" style={{ fontSize: 12.5, color: '#475569', fontWeight: 500 }}>{p.lastSession}</span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '16px 18px', borderBottom: '1.5px dashed rgba(45,212,191,0.30)', verticalAlign: 'middle' }}>
                      <StatusDot status={p.status} />
                    </td>

                    {/* Subscription */}
                    <td style={{ padding: '16px 18px', borderBottom: '1.5px dashed rgba(45,212,191,0.30)', verticalAlign: 'middle' }}>
                      <SubBadge type={p.sub} />
                    </td>

                    {/* Message */}
                    <td style={{ padding: '16px 18px', borderBottom: '1.5px dashed rgba(45,212,191,0.30)', verticalAlign: 'middle' }}>
                      <Link href={`/doctor/patients/${p.id}/messages`} className="mpp-msg-btn">
                        Message
                      </Link>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '16px 18px', borderBottom: '1.5px dashed rgba(45,212,191,0.30)', verticalAlign: 'middle' }}>
                      <Link href={`/doctor/patients/${p.id}`} className="mpp-view-btn">
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: 14, fontWeight: 500 }}>
                      No patients match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Row count */}
        <div style={{ marginTop: 10, textAlign: 'right' }}>
          <span className="mono" style={{ fontSize: 10.5, color: '#94a3b8', letterSpacing: '0.08em' }}>
            {filtered.length} of {ALL_PATIENTS.length} patients
          </span>
        </div>

      </div>
    </div>
  );
}