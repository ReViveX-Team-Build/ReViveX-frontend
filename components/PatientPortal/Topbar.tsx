"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search, Bell, ChevronDown, X,
  Zap, Trophy, Flame, BrainCircuit,
  CalendarClock, TrendingUp, MessageCircle,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────
const patient = { name: "P.B. Silva", id: "RVX-9988", initials: "PB", xp: 2450, streak: 5, level: 4 };

const notifications = [
  { id: 1, type: "session", title: "Session starts in 30 minutes",        time: "Now",    read: false, dot: "#2DD4BF", icon: CalendarClock },
  { id: 2, type: "message", title: "Dr. Suresh sent you a message",       time: "14m ago",read: false, dot: "#6366f1", icon: MessageCircle },
  { id: 3, type: "badge",   title: "You earned the '7-Day Streak' badge", time: "1h ago", read: true,  dot: "#f59e0b", icon: Trophy        },
  { id: 4, type: "tip",     title: "Morning sessions boost your score",   time: "3h ago", read: true,  dot: "#34d399", icon: TrendingUp    },
];

const suggestions = [
  { label: "My Progress",    sub: "View your therapy stats",  icon: TrendingUp    },
  { label: "Today's Session",sub: "10:30 AM · Right Hand",    icon: CalendarClock },
  { label: "AI Companion",   sub: "Chat with your AI coach",  icon: BrainCircuit  },
];

// ─── CSS ──────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

  .ptb * { font-family:'Plus Jakarta Sans',system-ui,sans-serif; box-sizing:border-box; }
  .ptb .mono { font-family:'JetBrains Mono',monospace; }

  @keyframes ptbSlideDown {
    from { opacity:0; transform:translateY(-8px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes ptbFadeIn {
    from { opacity:0; transform:translateY(4px) scale(0.97); }
    to   { opacity:1; transform:translateY(0)   scale(1); }
  }
  @keyframes dropIn {
    from { opacity:0; transform:translateY(-12px) scale(0.96); }
    to   { opacity:1; transform:translateY(0)     scale(1); }
  }
  @keyframes pulseDot {
    0%,100% { box-shadow:0 0 0 0 rgba(248,113,113,0.5); }
    50%     { box-shadow:0 0 0 5px rgba(248,113,113,0); }
  }
  @keyframes xpShimmer {
    0%   { transform:translateX(-100%) skewX(-15deg); }
    100% { transform:translateX(300%)  skewX(-15deg); }
  }
  @keyframes glowAvatar {
    0%,100% { box-shadow:0 0 0 0 rgba(45,212,191,0.35); }
    50%     { box-shadow:0 0 0 7px rgba(45,212,191,0); }
  }
  @keyframes streakBounce {
    0%,100% { transform:scale(1); }
    50%     { transform:scale(1.15); }
  }
  @keyframes notifItemIn {
    from { opacity:0; transform:translateX(-8px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes suggIn {
    from { opacity:0; transform:translateX(-6px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes xpFill {
    from { width:0%; }
    to   { width:71%; }
  }

  .ptb-search-input {
    width:100%; padding:10px 14px 10px 42px;
    background:rgba(255,255,255,0.06);
    border:1px solid rgba(255,255,255,0.10);
    border-radius:14px; color:#fff;
    font-size:13.5px; font-weight:500;
    transition:all 0.25s ease; outline:none;
  }
  .ptb-search-input::placeholder { color:rgba(255,255,255,0.28); }
  .ptb-search-input:focus {
    background:rgba(255,255,255,0.09);
    border-color:rgba(45,212,191,0.45);
    box-shadow:0 0 0 3px rgba(45,212,191,0.10);
  }

  .ptb-icon-btn {
    position:relative; width:40px; height:40px;
    border-radius:12px; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    background:rgba(255,255,255,0.05);
    color:rgba(255,255,255,0.55);
    transition:all 0.22s ease;
  }
  .ptb-icon-btn:hover { background:rgba(255,255,255,0.10); color:#fff; }

  .ptb-profile-btn {
    display:flex; align-items:center; gap:10px;
    padding:5px 10px 5px 5px; border-radius:16px;
    border:1px solid rgba(255,255,255,0.08);
    background:rgba(255,255,255,0.04);
    cursor:pointer; transition:all 0.22s ease;
  }
  .ptb-profile-btn:hover {
    background:rgba(255,255,255,0.08);
    border-color:rgba(45,212,191,0.25);
  }

  .ptb-dropdown {
    position:absolute; top:calc(100% + 10px); right:0;
    width:310px; z-index:600;
    background:linear-gradient(160deg,#0d2442,#0B1E33);
    border:1px solid rgba(255,255,255,0.09);
    border-radius:20px;
    box-shadow:0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(45,212,191,0.05);
    animation:dropIn 0.22s cubic-bezier(0.22,1,0.36,1) both;
    overflow:hidden;
  }

  .ptb-notif-item {
    display:flex; align-items:flex-start; gap:12px;
    padding:11px 16px; cursor:pointer;
    transition:background 0.18s ease;
    animation:notifItemIn 0.3s cubic-bezier(0.22,1,0.36,1) both;
  }
  .ptb-notif-item:hover { background:rgba(255,255,255,0.05); }

  .ptb-sugg {
    display:flex; align-items:center; gap:12px;
    padding:10px 14px; border-radius:12px;
    cursor:pointer; transition:all 0.18s ease;
    animation:suggIn 0.3s cubic-bezier(0.22,1,0.36,1) both;
  }
  .ptb-sugg:hover { background:rgba(45,212,191,0.08); }

  .ptb-profile-drop {
    position:absolute; top:calc(100% + 10px); right:0;
    width:256px; z-index:600;
    background:linear-gradient(160deg,#0d2442,#0B1E33);
    border:1px solid rgba(255,255,255,0.09);
    border-radius:20px;
    box-shadow:0 20px 60px rgba(0,0,0,0.45);
    animation:dropIn 0.22s cubic-bezier(0.22,1,0.36,1) both;
    overflow:hidden; padding:8px;
  }

  .ptb-menu-item {
    display:flex; align-items:center; gap:10px;
    padding:10px 12px; border-radius:12px;
    font-size:13px; font-weight:500;
    color:rgba(255,255,255,0.60);
    cursor:pointer; transition:all 0.18s ease;
    text-decoration:none;
  }
  .ptb-menu-item:hover { background:rgba(255,255,255,0.07); color:#fff; }

  .ptb-mobile-search {
    position:absolute; top:100%; left:0; right:0;
    background:linear-gradient(to bottom,#0d2442,#0B1E33);
    border-bottom:1px solid rgba(45,212,191,0.12);
    padding:12px 16px;
    animation:ptbSlideDown 0.25s ease both;
    z-index:500;
  }

  /* XP bar fill on mount */
  .ptb-xp-fill {
    animation:xpFill 1.4s cubic-bezier(0.22,1,0.36,1) 0.2s both;
  }
`;

export default function PatientTopbar() {
  const [searchFocused, setSearchFocused]       = useState(false);
  const [searchVal, setSearchVal]               = useState("");
  const [notifOpen, setNotifOpen]               = useState(false);
  const [profileOpen, setProfileOpen]           = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled]                 = useState(false);

  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const unread     = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filteredSugg = searchVal.length > 0
    ? suggestions.filter(s => s.label.toLowerCase().includes(searchVal.toLowerCase()))
    : [];
  const showSugg = (searchFocused && searchVal.length === 0) || filteredSugg.length > 0;

  return (
    // FIX: Outer div acts as a placeholder so content doesn't jump underneath
    <div className="ptb" style={{ width: "100%", height: 64 }}>
      <style>{STYLES}</style>

      {/* FIX: Position fixed and added class so it attaches to sidebar mathematically */}
      <header className="pat-main-offset" style={{
        position: "fixed",
        top: 0, left: 0, right: 0, zIndex: 400,
        background: scrolled
          ? "linear-gradient(to right,rgba(11,30,51,0.97),rgba(13,36,66,0.97))"
          : "linear-gradient(to right,#0B1E33,#0d2442)",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.30)" : "none",
        transition: "background 0.3s ease, box-shadow 0.3s ease",
        padding: "0 24px",
        height: 64,
        display: "flex", alignItems: "center", gap: 14,
        animation: "ptbSlideDown 0.5s cubic-bezier(0.22,1,0.36,1) both",
      }}>

        {/* Teal left accent */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
          background: "linear-gradient(to bottom,#2DD4BF,transparent)", opacity: 0.55,
        }} />

        {/* ── Gamification strip (streak + XP) ─────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
        }} className="ptb-game-strip">
          {/* Streak */}
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "rgba(245,158,11,0.10)",
            border: "1px solid rgba(245,158,11,0.22)",
            borderRadius: 12, padding: "5px 10px",
          }}>
            <Flame size={14} color="#f59e0b" fill="#f59e0b"
              style={{ animation: "streakBounce 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: "#f59e0b" }}>
              {patient.streak}
            </span>
            <span className="mono" style={{ fontSize: 9, color: "rgba(245,158,11,0.6)",
              textTransform: "uppercase", letterSpacing: "0.10em" }}>streak</span>
          </div>

          {/* XP pill with mini bar */}
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "rgba(45,212,191,0.08)",
            border: "1px solid rgba(45,212,191,0.18)",
            borderRadius: 12, padding: "5px 10px",
          }}>
            <Zap size={13} color="#2DD4BF" fill="#2DD4BF" />
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#2DD4BF", lineHeight: 1 }}>
                  {patient.xp.toLocaleString()}
                </span>
                <span className="mono" style={{ fontSize: 8, color: "rgba(45,212,191,0.5)",
                  textTransform: "uppercase", letterSpacing: "0.10em" }}>xp</span>
              </div>
              {/* Mini XP bar */}
              <div style={{ width: 44, height: 3, background: "rgba(45,212,191,0.12)",
                borderRadius: 99, overflow: "hidden", marginTop: 3 }}>
                <div className="ptb-xp-fill" style={{
                  height: "100%", width: 0, borderRadius: 99,
                  background: "linear-gradient(90deg,#14b8a6,#2DD4BF)",
                  boxShadow: "0 0 6px rgba(45,212,191,0.5)",
                }} />
              </div>
            </div>
          </div>

          {/* Level badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "rgba(99,102,241,0.10)",
            border: "1px solid rgba(99,102,241,0.20)",
            borderRadius: 12, padding: "5px 10px",
          }}>
            <Trophy size={13} color="#818cf8" />
            <span style={{ fontSize: 12, fontWeight: 800, color: "#818cf8" }}>
              Lv.{patient.level}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.08)", flexShrink: 0 }}
          className="ptb-div-left" />

        {/* ── Search ───────────────────────────────────────────────── */}
        <div style={{ flex: 1, maxWidth: 380, position: "relative" }}
          className="ptb-search-desktop">
          <div style={{ position: "relative" }}>
            <Search size={16} color="rgba(255,255,255,0.35)"
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              className="ptb-search-input"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              placeholder="Search records, schedules…"
            />
            {searchVal && (
              <button onClick={() => setSearchVal("")}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "rgba(255,255,255,0.35)", padding: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>

          {showSugg && (
            <div style={{
              position: "absolute", top: "calc(100% + 10px)", left: 0, right: 0,
              background: "linear-gradient(160deg,#0d2442,#0B1E33)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 16, padding: "8px",
              boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
              animation: "ptbFadeIn 0.2s ease both", zIndex: 600,
            }}>
              {searchVal.length === 0 && (
                <div className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.25)",
                  textTransform: "uppercase", letterSpacing: "0.16em", padding: "4px 14px 8px" }}>
                  Quick Links
                </div>
              )}
              {(searchVal.length === 0 ? suggestions : filteredSugg).map((s, i) => (
                <div key={s.label} className="ptb-sugg" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10,
                    background: "rgba(45,212,191,0.10)", display: "flex",
                    alignItems: "center", justifyContent: "center", color: "#2DD4BF", flexShrink: 0 }}>
                    <s.icon size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* ── Right actions ─────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>

          {/* Mobile search */}
          <button className="ptb-icon-btn ptb-mobile-search-btn"
            onClick={() => setMobileSearchOpen(p => !p)}
            style={{ display: "none" }} aria-label="Search">
            <Search size={18} />
          </button>

          {/* Notifications */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button className="ptb-icon-btn" onClick={() => { setNotifOpen(p => !p); setProfileOpen(false); }}>
              <Bell size={18} />
              {unread > 0 && (
                <span style={{
                  position: "absolute", top: 7, right: 7,
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#f87171", border: "2px solid #0B1E33",
                  animation: "pulseDot 2s ease-in-out infinite",
                }} />
              )}
            </button>

            {notifOpen && (
              <div className="ptb-dropdown">
                <div style={{ padding: "16px 16px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Notifications</div>
                    <div className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.30)",
                      textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 3 }}>
                      {unread} new
                    </div>
                  </div>
                  <button style={{ fontSize: 11, fontWeight: 700, color: "#2DD4BF",
                    background: "none", border: "none", cursor: "pointer" }}>
                    Clear all
                  </button>
                </div>

                <div style={{ maxHeight: 288, overflowY: "auto" }}>
                  {notifications.map((n, i) => (
                    <div key={n.id} className="ptb-notif-item"
                      style={{ animationDelay: `${i * 0.06}s`, opacity: n.read ? 0.5 : 1 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                        background: `${n.dot}18`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: n.dot,
                      }}>
                        <n.icon size={15} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: n.read ? 500 : 700,
                          color: "#fff", lineHeight: 1.4 }}>{n.title}</div>
                        <div className="mono" style={{ fontSize: 9.5,
                          color: "rgba(255,255,255,0.28)", marginTop: 3 }}>{n.time}</div>
                      </div>
                      {!n.read && (
                        <div style={{ width: 6, height: 6, borderRadius: "50%",
                          background: "#2DD4BF", flexShrink: 0, marginTop: 5 }} />
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <button style={{
                    width: "100%", padding: "9px", borderRadius: 12,
                    background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.16)",
                    color: "#2DD4BF", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}>
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.08)" }} />

          {/* Profile */}
          <div ref={profileRef} style={{ position: "relative" }}>
            <button className="ptb-profile-btn" onClick={() => { setProfileOpen(p => !p); setNotifOpen(false); }}>
              <div style={{
                width: 36, height: 36, borderRadius: 11,
                background: "linear-gradient(135deg,#2DD4BF,#0891b2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: "#0B1E33",
                animation: "glowAvatar 3s ease-in-out infinite", flexShrink: 0,
              }}>
                {patient.initials}
              </div>
              <div style={{ textAlign: "left" }} className="ptb-profile-text">
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{patient.name}</div>
                <div className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>
                  ID: {patient.id}
                </div>
              </div>
              <ChevronDown size={14} color="rgba(255,255,255,0.35)"
                style={{ transition: "transform 0.22s ease",
                  transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
            </button>

            {profileOpen && (
              <div className="ptb-profile-drop">
                {/* Profile card */}
                <div style={{
                  padding: "12px", marginBottom: 6,
                  background: "rgba(45,212,191,0.06)",
                  border: "1px solid rgba(45,212,191,0.12)", borderRadius: 14,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12,
                      background: "linear-gradient(135deg,#2DD4BF,#0891b2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 800, color: "#0B1E33" }}>
                      {patient.initials}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{patient.name}</div>
                      <div className="mono" style={{ fontSize: 9, color: "#2DD4BF",
                        textTransform: "uppercase", letterSpacing: "0.10em" }}>
                        {patient.id}
                      </div>
                    </div>
                  </div>
                  {/* Stats row */}
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { label: "Streak", value: `${patient.streak}d`, color: "#f59e0b" },
                      { label: "Level",  value: `Lv.${patient.level}`,color: "#818cf8"  },
                      { label: "XP",     value: patient.xp.toLocaleString(), color: "#2DD4BF" },
                    ].map(s => (
                      <div key={s.label} style={{ flex: 1, textAlign: "center",
                        background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "6px 4px" }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div className="mono" style={{ fontSize: 8.5, color: "rgba(255,255,255,0.30)",
                          textTransform: "uppercase", letterSpacing: "0.10em" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {[
                  { label: "My Profile",    href: "/patients/profile"   },
                  { label: "Settings",      href: "/patients/settings"  },
                  { label: "FAQ & Help",    href: "/patients/faq"       },
                ].map(item => (
                  <a key={item.label} href={item.href} className="ptb-menu-item">{item.label}</a>
                ))}

                <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "6px 0" }} />
                <a href="/" className="ptb-menu-item" style={{ color: "#f87171" }}>Sign Out</a>
              </div>
            )}
          </div>
        </div>

        {/* FIX: Moved Mobile Search Panel INSIDE the fixed header so it drops down properly */}
        {mobileSearchOpen && (
          <div className="ptb-mobile-search">
            <div style={{ position: "relative" }}>
              <Search size={16} color="rgba(255,255,255,0.35)"
                style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <input className="ptb-search-input" placeholder="Search records, schedules…" autoFocus />
            </div>
          </div>
        )}
      </header>

      {/* Responsive */}
      <style>{`
        @media (max-width:1024px) {
          .ptb-game-strip > div:last-child { display:none !important; }
        }
        @media (max-width:768px) {
          .ptb-search-desktop { display:none !important; }
          .ptb-div-left { display:none !important; }
          .ptb-profile-text { display:none !important; }
          .ptb-mobile-search-btn { display:flex !important; }
          .ptb-game-strip > div:nth-child(2),
          .ptb-game-strip > div:last-child { display:none !important; }
        }
        @media (max-width:480px) {
          header { padding:0 12px !important; }
          .ptb-game-strip { gap:6px !important; }
          .ptb-game-strip > div { padding:4px 8px !important; }
        }
      `}</style>
    </div>
  );
}