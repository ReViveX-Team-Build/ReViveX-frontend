"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Bell, ChevronDown, X, Activity, Stethoscope, Clock, TrendingUp } from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────
const doctor = { name: "Dr. Suresh", role: "Neurologist", initials: "DS" };

const notifications = [
  { id: 1, type: "alert",   title: "P.B. Silva missed session",        time: "5m ago",  read: false, dot: "#f87171" },
  { id: 2, type: "info",    title: "Anura Dissanayake adherence drop",  time: "22m ago", read: false, dot: "#fbbf24" },
  { id: 3, type: "success", title: "Weekly report generated",           time: "1h ago",  read: true,  dot: "#34d399" },
  { id: 4, type: "info",    title: "New protocol update available",     time: "3h ago",  read: true,  dot: "#60a5fa" },
];

const searchSuggestions = [
  { label: "P.B. Silva",         sub: "Patient · P002",   icon: Stethoscope },
  { label: "Malini Perera",      sub: "Patient · P009",   icon: Stethoscope },
  { label: "Reports & Analytics",sub: "Page",             icon: TrendingUp  },
  { label: "Today's Schedule",   sub: "3 sessions",       icon: Clock       },
];

// ─── CSS ──────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

  .dtb * { font-family:'Plus Jakarta Sans',system-ui,sans-serif; box-sizing:border-box; }
  .dtb .mono { font-family:'JetBrains Mono',monospace; }

  @keyframes tbSlideDown {
    from { opacity:0; transform:translateY(-8px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes tbFadeIn {
    from { opacity:0; transform:translateY(4px) scale(0.98); }
    to   { opacity:1; transform:translateY(0)   scale(1); }
  }
  @keyframes notifDrop {
    from { opacity:0; transform:translateY(-12px) scale(0.96); }
    to   { opacity:1; transform:translateY(0)     scale(1); }
  }
  @keyframes pulseDot {
    0%,100% { box-shadow:0 0 0 0 rgba(248,113,113,0.6); }
    50%     { box-shadow:0 0 0 5px rgba(248,113,113,0); }
  }
  @keyframes shimmerSearch {
    0%   { transform:translateX(-100%) skewX(-15deg); }
    100% { transform:translateX(300%)  skewX(-15deg); }
  }
  @keyframes glowPulse {
    0%,100% { box-shadow:0 0 0 0 rgba(45,212,191,0.35); }
    50%     { box-shadow:0 0 0 8px rgba(45,212,191,0); }
  }
  @keyframes notifItemIn {
    from { opacity:0; transform:translateX(-8px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes suggItemIn {
    from { opacity:0; transform:translateX(-6px); }
    to   { opacity:1; transform:translateX(0); }
  }

  .dtb-search-input {
    width:100%; padding:10px 14px 10px 42px;
    background:rgba(255,255,255,0.06);
    border:1px solid rgba(255,255,255,0.10);
    border-radius:14px; color:#fff;
    font-size:13.5px; font-weight:500;
    transition:all 0.25s ease;
    outline:none;
  }
  .dtb-search-input::placeholder { color:rgba(255,255,255,0.28); }
  .dtb-search-input:focus {
    background:rgba(255,255,255,0.09);
    border-color:rgba(45,212,191,0.45);
    box-shadow:0 0 0 3px rgba(45,212,191,0.10);
  }

  .dtb-icon-btn {
    position:relative; width:40px; height:40px;
    border-radius:12px; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    background:rgba(255,255,255,0.05);
    color:rgba(255,255,255,0.55);
    transition:all 0.22s ease;
  }
  .dtb-icon-btn:hover {
    background:rgba(255,255,255,0.10);
    color:#fff;
    box-shadow:0 4px 16px rgba(0,0,0,0.2);
  }

  .dtb-profile-btn {
    display:flex; align-items:center; gap:10px;
    padding:6px 10px 6px 6px; border-radius:16px;
    border:1px solid rgba(255,255,255,0.08);
    background:rgba(255,255,255,0.04);
    cursor:pointer; transition:all 0.22s ease;
  }
  .dtb-profile-btn:hover {
    background:rgba(255,255,255,0.08);
    border-color:rgba(45,212,191,0.25);
    box-shadow:0 4px 20px rgba(0,0,0,0.2);
  }

  .dtb-dropdown {
    position:absolute; top:calc(100% + 10px); right:0;
    width:300px; z-index:600;
    background:linear-gradient(160deg,#0d2442,#0B1E33);
    border:1px solid rgba(255,255,255,0.09);
    border-radius:20px;
    box-shadow:0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(45,212,191,0.06);
    animation:notifDrop 0.22s cubic-bezier(0.22,1,0.36,1) both;
    overflow:hidden;
  }

  .dtb-notif-item {
    display:flex; align-items:flex-start; gap:12px;
    padding:12px 16px; cursor:pointer;
    transition:background 0.18s ease;
    animation:notifItemIn 0.3s cubic-bezier(0.22,1,0.36,1) both;
  }
  .dtb-notif-item:hover { background:rgba(255,255,255,0.05); }

  .dtb-suggestion {
    display:flex; align-items:center; gap:12px;
    padding:10px 14px; border-radius:12px;
    cursor:pointer; transition:all 0.18s ease;
    animation:suggItemIn 0.3s cubic-bezier(0.22,1,0.36,1) both;
  }
  .dtb-suggestion:hover { background:rgba(45,212,191,0.08); }

  .dtb-profile-dropdown {
    position:absolute; top:calc(100% + 10px); right:0;
    width:240px; z-index:600;
    background:linear-gradient(160deg,#0d2442,#0B1E33);
    border:1px solid rgba(255,255,255,0.09);
    border-radius:20px;
    box-shadow:0 20px 60px rgba(0,0,0,0.45);
    animation:notifDrop 0.22s cubic-bezier(0.22,1,0.36,1) both;
    overflow:hidden; padding:8px;
  }

  .dtb-menu-item {
    display:flex; align-items:center; gap:10px;
    padding:10px 12px; border-radius:12px;
    font-size:13px; font-weight:500;
    color:rgba(255,255,255,0.65);
    cursor:pointer; transition:all 0.18s ease;
    text-decoration:none;
  }
  .dtb-menu-item:hover { background:rgba(255,255,255,0.07); color:#fff; }

  /* Mobile search toggle */
  .dtb-mobile-search {
    position:absolute; top:100%; left:0; right:0;
    background:linear-gradient(to bottom,#0d2442,#0B1E33);
    border-bottom:1px solid rgba(45,212,191,0.12);
    padding:12px 16px;
    animation:tbSlideDown 0.25s ease both;
    z-index:500;
  }
`;

export default function DoctorTopbar() {
  const [searchFocused, setSearchFocused]       = useState(false);
  const [searchVal, setSearchVal]               = useState("");
  const [notifOpen, setNotifOpen]               = useState(false);
  const [profileOpen, setProfileOpen]           = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled]                 = useState(false);

  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.read).length;

  // Scroll shadow
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  // Click-outside close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showSuggestions = searchFocused && searchVal.length === 0;
  const filteredSugg    = searchVal.length > 0
    ? searchSuggestions.filter(s => s.label.toLowerCase().includes(searchVal.toLowerCase()))
    : [];

  return (
    // FIX: Outer div acts as a 64px placeholder so content below doesn't slide under the fixed header
    <div className="dtb" style={{ width: "100%", height: 64 }}>
      <style>{STYLES}</style>

      {/* FIX: Changed to position: fixed and added doc-main-offset so it perfectly attaches to sidebar */}
      <header className="doc-main-offset" style={{
        position: "fixed", 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 400,
        background: scrolled
          ? "linear-gradient(to right,rgba(11,30,51,0.97),rgba(13,36,66,0.97))"
          : "linear-gradient(to right,#0B1E33,#0d2442)",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.30)" : "none",
        transition: "background 0.3s ease, box-shadow 0.3s ease", // Kept CSS transition separate from margin-left transition
        padding: "0 24px",
        height: 64,
        display: "flex", alignItems: "center", gap: 16,
        animation: "tbSlideDown 0.5s cubic-bezier(0.22,1,0.36,1) both",
      }}>

        {/* ── Teal accent left bar ─────────────────────────────────── */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
          background: "linear-gradient(to bottom,#2DD4BF,transparent)",
          opacity: 0.6,
        }} />

        {/* ── Page title / breadcrumb ──────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "rgba(45,212,191,0.12)",
            border: "1px solid rgba(45,212,191,0.20)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Activity size={16} color="#2DD4BF" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1 }}>Dashboard</div>
            <div className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", letterSpacing: "0.12em", marginTop: 2 }}>
              DOCTOR PORTAL
            </div>
          </div>
        </div>

        {/* ── Divider ──────────────────────────────────────────────── */}
        <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

        {/* ── Search bar (desktop) ─────────────────────────────────── */}
        <div style={{ flex: 1, maxWidth: 420, position: "relative", display: "flex" }}
          className="dtb-search-desktop">
          <div style={{ position: "relative", width: "100%" }}>
            <Search size={16} color="rgba(255,255,255,0.35)"
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              className="dtb-search-input"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              placeholder="Search patients, sessions…"
            />
            {searchVal && (
              <button onClick={() => setSearchVal("")}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {(showSuggestions || filteredSugg.length > 0) && (
            <div style={{
              position: "absolute", top: "calc(100% + 10px)", left: 0, right: 0,
              background: "linear-gradient(160deg,#0d2442,#0B1E33)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 16, padding: "8px",
              boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
              animation: "tbFadeIn 0.2s ease both",
              zIndex: 600,
            }}>
              {showSuggestions && (
                <div className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.25)",
                  textTransform: "uppercase", letterSpacing: "0.16em", padding: "4px 14px 8px" }}>
                  Quick Access
                </div>
              )}
              {(showSuggestions ? searchSuggestions : filteredSugg).map((s, i) => (
                <div key={s.label} className="dtb-suggestion" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10,
                    background: "rgba(45,212,191,0.10)", display: "flex", alignItems: "center",
                    justifyContent: "center", color: "#2DD4BF", flexShrink: 0 }}>
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

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* ── Right actions ────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>

          {/* Mobile search toggle */}
          <button className="dtb-icon-btn"
            onClick={() => setMobileSearchOpen(p => !p)}
            style={{ display: "none" }}
            aria-label="Search">
            <Search size={18} />
          </button>

          {/* Notifications */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button className="dtb-icon-btn" onClick={() => { setNotifOpen(p => !p); setProfileOpen(false); }}>
              <Bell size={18} />
              {unread > 0 && (
                <span style={{
                  position: "absolute", top: 7, right: 7,
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#f87171",
                  border: "2px solid #0B1E33",
                  animation: "pulseDot 2s ease-in-out infinite",
                }} />
              )}
            </button>

            {notifOpen && (
              <div className="dtb-dropdown" ref={undefined}>
                {/* Header */}
                <div style={{ padding: "16px 16px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Notifications</div>
                    <div className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.30)",
                      textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 3 }}>
                      {unread} unread
                    </div>
                  </div>
                  <button style={{ fontSize: 11, fontWeight: 700, color: "#2DD4BF",
                    background: "none", border: "none", cursor: "pointer" }}>
                    Mark all read
                  </button>
                </div>

                {/* Items */}
                <div style={{ maxHeight: 280, overflowY: "auto" }}>
                  {notifications.map((n, i) => (
                    <div key={n.id} className="dtb-notif-item" style={{ animationDelay: `${i * 0.06}s`,
                      opacity: n.read ? 0.55 : 1 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.dot,
                        flexShrink: 0, marginTop: 5, boxShadow: `0 0 6px ${n.dot}` }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: n.read ? 500 : 700, color: "#fff",
                          lineHeight: 1.4 }}>{n.title}</div>
                        <div className="mono" style={{ fontSize: 9.5, color: "rgba(255,255,255,0.30)",
                          marginTop: 3 }}>{n.time}</div>
                      </div>
                      {!n.read && (
                        <div style={{ width: 6, height: 6, borderRadius: "50%",
                          background: "#2DD4BF", flexShrink: 0, marginTop: 6 }} />
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <button style={{ width: "100%", padding: "9px", borderRadius: 12,
                    background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.16)",
                    color: "#2DD4BF", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
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
            <button className="dtb-profile-btn" onClick={() => { setProfileOpen(p => !p); setNotifOpen(false); }}>
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: 11,
                background: "linear-gradient(135deg,#2DD4BF,#0891b2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: "#0B1E33",
                boxShadow: "0 0 0 2px rgba(45,212,191,0.25)",
                animation: "glowPulse 3s ease-in-out infinite",
                flexShrink: 0,
              }}>
                {doctor.initials}
              </div>
              {/* Info */}
              <div style={{ textAlign: "left" }} className="dtb-profile-text">
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{doctor.name}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981",
                    display: "inline-block", boxShadow: "0 0 5px #10b981" }} />
                  {doctor.role}
                </div>
              </div>
              <ChevronDown size={14} color="rgba(255,255,255,0.35)"
                style={{ transition: "transform 0.22s ease", transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
            </button>

            {profileOpen && (
              <div className="dtb-profile-dropdown">
                {/* Profile card */}
                <div style={{ padding: "12px 12px 10px", marginBottom: 6,
                  background: "rgba(45,212,191,0.06)", borderRadius: 14,
                  border: "1px solid rgba(45,212,191,0.12)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12,
                      background: "linear-gradient(135deg,#2DD4BF,#0891b2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 800, color: "#0B1E33" }}>
                      {doctor.initials}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{doctor.name}</div>
                      <div className="mono" style={{ fontSize: 9, color: "#2DD4BF",
                        textTransform: "uppercase", letterSpacing: "0.12em" }}>{doctor.role}</div>
                    </div>
                  </div>
                </div>

                {[
                  { label: "View Profile",    href: "/doctor/profile"  },
                  { label: "Account Settings",href: "/doctor/settings" },
                  { label: "Help & Support",  href: "/doctor/support"  },
                ].map(item => (
                  <a key={item.label} href={item.href} className="dtb-menu-item">{item.label}</a>
                ))}

                <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "6px 0" }} />

                <a href="/" className="dtb-menu-item" style={{ color: "#f87171" }}>Sign Out</a>
              </div>
            )}
          </div>
        </div>

        {/* FIX: Mobile search panel moved INSIDE the fixed header so it stays attached */}
        {mobileSearchOpen && (
          <div className="dtb-mobile-search">
            <div style={{ position: "relative" }}>
              <Search size={16} color="rgba(255,255,255,0.35)"
                style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <input className="dtb-search-input" placeholder="Search patients, sessions…" autoFocus />
            </div>
          </div>
        )}
      </header>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width:768px) {
          .dtb-search-desktop { display:none !important; }
          .dtb-profile-text   { display:none !important; }
          .dtb-icon-btn[aria-label="Search"] { display:flex !important; }
        }
        @media (max-width:480px) {
          header { padding:0 12px !important; }
        }
      `}</style>
    </div>
  );
}