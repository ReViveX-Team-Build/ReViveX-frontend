'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Send, Search, Circle, Bot, User, Paperclip, MoreHorizontal } from 'lucide-react';

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface Message {
  sender: 'doctor' | 'patient';
  text: string;
  time: string;
}

/* ─── Patient data ───────────────────────────────────────────────────────── */
const PATIENT_NAMES: Record<string, { name: string; pid: string; status: string; condition: string; isAI: boolean }> = {
  '1':  { name: 'P.B. De Silva',        pid: 'P001', status: 'Low',    condition: 'Stroke',      isAI: false },
  '2':  { name: 'Anura Dissanayaka',    pid: 'P002', status: 'High',   condition: 'TBI',         isAI: true  },
  '3':  { name: 'Isuri Alwis',          pid: 'P003', status: 'Medium', condition: 'Stroke',      isAI: true  },
  '4':  { name: 'Shifani Ameena',       pid: 'P004', status: 'Medium', condition: 'Post-Surgery',isAI: false },
  '5':  { name: 'Percy Silva',          pid: 'P005', status: 'High',   condition: 'TBI',         isAI: true  },
  '6':  { name: 'Athula Premachandra',  pid: 'P006', status: 'Low',    condition: 'Stroke',      isAI: false },
  '7':  { name: 'Aruni Perera',         pid: 'P007', status: 'High',   condition: 'Post-Surgery',isAI: true  },
  '8':  { name: 'Amal Mahendra',        pid: 'P008', status: 'Medium', condition: 'TBI',         isAI: false },
  '9':  { name: 'Malkanthi Peris',      pid: 'P009', status: 'Low',    condition: 'Stroke',      isAI: false },
  '10': { name: 'K.K. Muththukumaran',  pid: 'P010', status: 'High',   condition: 'TBI',         isAI: true  },
  '11': { name: 'Kamal Fernando',       pid: 'P011', status: 'High',   condition: 'Post-Surgery',isAI: true  },
  '12': { name: 'P.P. Sugathadasa',     pid: 'P012', status: 'High',   condition: 'Stroke',      isAI: true  },
};

const SEED_MESSAGES: Record<string, Message[]> = {
  '1': [
    { sender: 'patient', text: 'Good morning doctor.', time: '09:10' },
    { sender: 'doctor', text: 'Good morning. How is your grip feeling today?', time: '09:12' },
    { sender: 'patient', text: 'A bit weak but I did the exercises.', time: '09:14' },
    { sender: 'doctor', text: 'Good effort. Let\'s keep the pressure moderate for now.', time: '09:16' },
  ],
  '2': [
    { sender: 'patient', text: 'Doctor, I completed today\'s session!', time: '08:45' },
    { sender: 'doctor', text: 'Excellent work Anura! Your consistency is outstanding.', time: '08:50' },
    { sender: 'patient', text: 'The AI Companion really helps me stay on track.', time: '08:52' },
    { sender: 'doctor', text: 'Glad to hear it. Keep up the momentum — you\'re nearly at Level 3.', time: '08:55' },
  ],
};

function getMessages(id: string): Message[] {
  return SEED_MESSAGES[id] ?? [
    { sender: 'patient', text: 'Hello doctor, checking in for today.', time: '10:00' },
    { sender: 'doctor', text: 'Hello! How are you feeling after yesterday\'s session?', time: '10:03' },
  ];
}

function statusColor(s: string) {
  if (s === 'High')   return '#10b981';
  if (s === 'Medium') return '#f59e0b';
  return '#ef4444';
}

/* ─── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  .mc * { font-family:'Plus Jakarta Sans',system-ui,sans-serif; box-sizing:border-box; }
  .mc .mono { font-family:'JetBrains Mono',monospace; }

  @keyframes mcFadeUp {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes mcMsgIn {
    from { opacity:0; transform:translateY(10px) scale(0.97); }
    to   { opacity:1; transform:translateY(0)    scale(1); }
  }
  @keyframes mcShimmer {
    0%   { transform:translateX(-200%) skewX(-15deg); }
    100% { transform:translateX(400%)  skewX(-15deg); }
  }
  @keyframes mcDot {
    0%,100% { opacity:1; }
    50%     { opacity:0.35; }
  }
  @keyframes mcGlow {
    0%,100% { box-shadow:0 0 0 0 rgba(45,212,191,0.35); }
    50%     { box-shadow:0 0 0 8px rgba(45,212,191,0); }
  }
  @keyframes mcTypingBounce {
    0%,60%,100% { transform:translateY(0); }
    30%         { transform:translateY(-5px); }
  }

  /* Sidebar patient button */
  .mc-patient-btn {
    width:100%; text-align:left; background:none; border:none;
    padding:10px 12px; border-radius:14px; cursor:pointer;
    transition:all 0.2s ease; display:flex; align-items:center; gap:10px;
  }
  .mc-patient-btn:hover { background:rgba(45,212,191,0.07); }
  .mc-patient-btn.active {
    background:linear-gradient(135deg,rgba(45,212,191,0.15),rgba(8,145,178,0.10));
    border:1px solid rgba(45,212,191,0.25);
  }

  /* Doctor bubble */
  .mc-bubble-doc {
    background:linear-gradient(135deg,#2DD4BF,#0891b2);
    color:#0B1E33; border-radius:18px 18px 4px 18px;
    padding:12px 16px; max-width:72%;
    box-shadow:0 4px 16px rgba(45,212,191,0.30);
    animation:mcMsgIn 0.3s cubic-bezier(0.22,1,0.36,1) both;
    position:relative; overflow:hidden;
  }
  .mc-bubble-doc::before {
    content:''; position:absolute; inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);
    animation:mcShimmer 4s ease-in-out infinite;
  }

  /* Patient bubble */
  .mc-bubble-pat {
    background:#fff; color:#0B1E33;
    border:1.5px solid rgba(226,232,240,0.9);
    border-radius:18px 18px 18px 4px;
    padding:12px 16px; max-width:72%;
    box-shadow:0 2px 12px rgba(11,30,51,0.06);
    animation:mcMsgIn 0.3s cubic-bezier(0.22,1,0.36,1) both;
  }

  /* Send button */
  .mc-send-btn {
    width:44px; height:44px; border-radius:13px; border:none; cursor:pointer;
    background:linear-gradient(135deg,#2DD4BF,#0891b2);
    color:#0B1E33; display:flex; align-items:center; justify-content:center;
    box-shadow:0 4px 16px rgba(45,212,191,0.35);
    transition:all 0.22s ease; flex-shrink:0;
    animation:mcGlow 3s ease-in-out infinite;
  }
  .mc-send-btn:hover { transform:scale(1.08) translateY(-2px); box-shadow:0 8px 24px rgba(45,212,191,0.45); }
  .mc-send-btn:active { transform:scale(0.96); }

  /* Text input */
  .mc-input {
    flex:1; padding:11px 16px;
    background:rgba(240,244,248,0.8);
    border:1.5px solid rgba(226,232,240,0.9);
    border-radius:13px; font-size:13.5px; font-weight:500;
    color:#0B1E33; outline:none;
    transition:all 0.22s ease;
    font-family:'Plus Jakarta Sans',sans-serif;
  }
  .mc-input::placeholder { color:#94a3b8; }
  .mc-input:focus {
    background:#fff;
    border-color:rgba(45,212,191,0.50);
    box-shadow:0 0 0 3px rgba(45,212,191,0.10);
  }

  /* Scrollbar */
  .mc-msgs::-webkit-scrollbar { width:4px; }
  .mc-msgs::-webkit-scrollbar-track { background:transparent; }
  .mc-msgs::-webkit-scrollbar-thumb { background:rgba(45,212,191,0.22); border-radius:99px; }

  .mc-sidebar::-webkit-scrollbar { width:3px; }
  .mc-sidebar::-webkit-scrollbar-thumb { background:rgba(45,212,191,0.18); border-radius:99px; }

  @media (max-width:700px) {
    .mc-sidebar-wrap { display:none !important; }
    .mc-chat-col    { border-radius:22px !important; }
  }
`;

/* ─── Main ───────────────────────────────────────────────────────────────── */
export default function DoctorPatientMessagesPage() {
  const { id } = useParams();
  const idStr = Array.isArray(id) ? id[0] : (id ?? '1');

  const [selectedId, setSelectedId]     = useState(idStr);
  const [allMessages, setAllMessages]   = useState<Record<string, Message[]>>(() => {
    const init: Record<string, Message[]> = {};
    Object.keys(PATIENT_NAMES).forEach(k => { init[k] = getMessages(k); });
    return init;
  });
  const [newMessage, setNewMessage]     = useState('');
  const [search, setSearch]             = useState('');
  const [mounted, setMounted]           = useState(false);
  const messagesEndRef                  = useRef<HTMLDivElement>(null);
  const inputRef                        = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [allMessages, selectedId]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAllMessages(prev => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] ?? []), { sender: 'doctor', text: newMessage.trim(), time }],
    }));
    setNewMessage('');
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const patient = PATIENT_NAMES[selectedId] ?? PATIENT_NAMES['1'];
  const messages = allMessages[selectedId] ?? [];
  const sColor = statusColor(patient.status);

  const filteredPatients = Object.entries(PATIENT_NAMES).filter(([, p]) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.pid.toLowerCase().includes(search.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <div className="mc" style={{ height: '100vh', background: '#F0F4F8', display: 'flex', flexDirection: 'column', padding: '20px', gap: 16, overflow: 'hidden' }}>
      <style>{CSS}</style>

      {/* Back nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, animation: 'mcFadeUp 0.5s ease both', flexShrink: 0 }}>
        <Link href="/doctor/patients" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '8px 14px', borderRadius: 12,
          background: '#fff', border: '1.5px solid rgba(226,232,240,0.9)',
          fontSize: 13, fontWeight: 700, color: '#64748b', textDecoration: 'none',
          transition: 'all 0.2s ease',
        }}>
          <ArrowLeft size={14} /> Back to Patients
        </Link>
        <span className="mono" style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Patient Messaging
        </span>
      </div>

      {/* Main layout */}
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0, animation: 'mcFadeUp 0.55s ease 0.06s both' }}>

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <div className="mc-sidebar-wrap" style={{
          width: 280, flexShrink: 0,
          background: '#fff',
          borderRadius: 20, overflow: 'hidden',
          border: '1px solid rgba(226,232,240,0.9)',
          boxShadow: '0 2px 18px rgba(11,30,51,0.06)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Sidebar header */}
          <div style={{
            padding: '18px 16px 14px',
            borderBottom: '1px solid rgba(226,232,240,0.8)',
            background: 'linear-gradient(135deg,#f8fdfc,#f0fdfb)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(45,212,191,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2DD4BF' }}>
                <User size={16} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0B1E33' }}>Messages</div>
                <div className="mono" style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{Object.keys(PATIENT_NAMES).length} patients</div>
              </div>
            </div>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search patients..."
                style={{
                  width: '100%', padding: '8px 12px 8px 30px',
                  background: 'rgba(240,244,248,0.8)', border: '1px solid rgba(226,232,240,0.9)',
                  borderRadius: 10, fontSize: 12, color: '#0B1E33', outline: 'none',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              />
            </div>
          </div>

          {/* Patient list */}
          <div className="mc-sidebar" style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {filteredPatients.map(([pid, p]) => {
              const sc = statusColor(p.status);
              const msgs = allMessages[pid] ?? [];
              const lastMsg = msgs[msgs.length - 1];
              const isActive = pid === selectedId;
              return (
                <button
                  key={pid}
                  className={`mc-patient-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedId(pid)}
                >
                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 12,
                      background: isActive ? 'linear-gradient(135deg,#2DD4BF,#0891b2)' : 'rgba(11,30,51,0.07)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800,
                      color: isActive ? '#0B1E33' : '#64748b',
                    }}>
                      {p.name.split(' ').map(w => w[0]).slice(0,2).join('')}
                    </div>
                    <div style={{ position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderRadius: '50%', background: sc, border: '2px solid #fff', animation: 'mcDot 2s ease-in-out infinite' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0B1E33', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{p.name}</span>
                      {lastMsg && <span className="mono" style={{ fontSize: 9, color: '#94a3b8' }}>{lastMsg.time}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                      <span className="mono" style={{ fontSize: 9, color: '#2DD4BF', background: 'rgba(45,212,191,0.08)', padding: '1px 6px', borderRadius: 6 }}>{p.pid}</span>
                      {p.isAI && <Bot size={10} color="#6366f1" />}
                    </div>
                    {lastMsg && (
                      <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2, maxWidth: 160 }}>
                        {lastMsg.sender === 'doctor' ? 'You: ' : ''}{lastMsg.text}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Chat Panel ──────────────────────────────────────────────── */}
        <div className="mc-chat-col" style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: '#fff', borderRadius: 20,
          border: '1px solid rgba(226,232,240,0.9)',
          boxShadow: '0 2px 18px rgba(11,30,51,0.06)',
          overflow: 'hidden', minWidth: 0,
        }}>

          {/* Chat header */}
          <div style={{
            padding: '16px 22px',
            borderBottom: '1px solid rgba(226,232,240,0.8)',
            background: 'linear-gradient(135deg,#f8fdfc,#f0fdfb)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Avatar */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: 'linear-gradient(135deg,#2DD4BF,#0891b2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: '#0B1E33',
                  boxShadow: '0 0 0 2px rgba(45,212,191,0.25)',
                  animation: 'mcGlow 3s ease-in-out infinite',
                }}>
                  {patient.name.split(' ').map(w => w[0]).slice(0,2).join('')}
                </div>
                <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: sColor, border: '2px solid #fff', boxShadow: `0 0 5px ${sColor}` }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0B1E33' }}>{patient.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <span className="mono" style={{ fontSize: 10, color: '#2DD4BF', background: 'rgba(45,212,191,0.08)', padding: '1px 8px', borderRadius: 6 }}>{patient.pid}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{patient.condition}</span>
                  {patient.isAI && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#0B1E33', borderRadius: 8, padding: '2px 8px' }}>
                      <Bot size={10} color="#2DD4BF" />
                      <span className="mono" style={{ fontSize: 8.5, color: '#2DD4BF', fontWeight: 700, letterSpacing: '0.10em' }}>AI</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href={`/doctor/patients/${selectedId}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 11,
                background: 'rgba(11,30,51,0.06)', border: '1px solid rgba(226,232,240,0.9)',
                fontSize: 12, fontWeight: 700, color: '#0B1E33', textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}>
                View Profile
              </Link>
            </div>
          </div>

          {/* Messages area */}
          <div className="mc-msgs" style={{ flex: 1, overflowY: 'auto', padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Date stamp */}
            <div style={{ textAlign: 'center', margin: '4px 0 8px' }}>
              <span className="mono" style={{ fontSize: 9.5, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.14em', background: 'rgba(240,244,248,0.9)', padding: '4px 14px', borderRadius: 99 }}>
                Today
              </span>
            </div>

            {messages.map((msg, i) => {
              const isDoc = msg.sender === 'doctor';
              return (
                <div key={i} style={{ display: 'flex', justifyContent: isDoc ? 'flex-end' : 'flex-start', gap: 10, alignItems: 'flex-end' }}>
                  {/* Patient avatar */}
                  {!isDoc && (
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(11,30,51,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#64748b', flexShrink: 0 }}>
                      {patient.name.split(' ').map(w => w[0]).slice(0,2).join('')}
                    </div>
                  )}

                  <div className={isDoc ? 'mc-bubble-doc' : 'mc-bubble-pat'} style={{ animationDelay: `${i * 0.04}s` }}>
                    <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0, position: 'relative', zIndex: 1 }}>{msg.text}</p>
                    <p className="mono" style={{
                      fontSize: 9.5, marginTop: 6, textAlign: 'right', position: 'relative', zIndex: 1,
                      color: isDoc ? 'rgba(11,30,51,0.45)' : '#94a3b8',
                    }}>{msg.time}</p>
                  </div>

                  {/* Doctor avatar */}
                  {isDoc && (
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#2DD4BF,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#0B1E33', flexShrink: 0 }}>
                      DS
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div style={{
            padding: '14px 18px',
            borderTop: '1px solid rgba(226,232,240,0.8)',
            background: '#fafbfd',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            {/* Attach */}
            <button style={{
              width: 40, height: 40, borderRadius: 12, cursor: 'pointer',
              background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#2DD4BF', transition: 'all 0.2s ease', flexShrink: 0,
            }}>
              <Paperclip size={16} />
            </button>

            <input
              ref={inputRef}
              className="mc-input"
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Message ${patient.name.split(' ')[0]}...`}
            />

            <button className="mc-send-btn" onClick={sendMessage}>
              <Send size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}