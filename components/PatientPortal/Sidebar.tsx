"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  TrendingUp,
  CalendarDays,
  Bot,
  MessageCircle,
  Settings,
  HelpCircle,
  LogOut,
  BrainCircuit,
  ChevronRight,
  X,
  Menu,
  Zap,
  Trophy,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type BreakPoint = "mobile" | "tablet" | "desktop";

// ─── Data ─────────────────────────────────────────────────────────────────────
const navItems = [
  { icon: Home,          label: "Home",           href: "/patients/home",         badge: null },
  { icon: TrendingUp,    label: "My Progress",    href: "/patients/progress",     badge: null },
  { icon: CalendarDays,  label: "My Schedule",    href: "/patients/schedule",     badge: "2"  },
  { icon: Bot,           label: "AI Companion",   href: "/patients/ai-companion", badge: null },
  { icon: MessageCircle, label: "Doctor Messages",href: "/patients/messages",     badge: "1"  },
];

const bottomItems = [
  { icon: Settings,   label: "Settings", href: "/patients/settings" },
  { icon: HelpCircle, label: "FAQ",      href: "/patients/faq"      },
];

const patient = {
  name: "P.B. Silva",
  level: "Level 4",
  xp: 2450,
  streak: 5,
  initials: "PB",
  adherence: 71,
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .pat-sb * { font-family:'Plus Jakarta Sans',system-ui,sans-serif; box-sizing:border-box; }

  @keyframes sbSlideIn {
    from { transform:translateX(-100%); opacity:0; }
    to   { transform:translateX(0);     opacity:1; }
  }
  @keyframes sbFadeIn {
    from { opacity:0; transform:translateY(6px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes tooltipPop {
    from { opacity:0; transform:translateX(-6px) scale(0.94); }
    to   { opacity:1; transform:translateX(0)    scale(1); }
  }
  @keyframes activePulse {
    0%,100% { box-shadow:0 0 0 0 rgba(45,212,191,0.4); }
    50%     { box-shadow:0 0 0 6px rgba(45,212,191,0);  }
  }
  @keyframes xpFill {
    from { width:0%; }
    to   { width:var(--xp-w); }
  }
  @keyframes glowBreath {
    0%,100% { box-shadow:0 0 15px rgba(45,212,191,0.5); }
    50%     { box-shadow:0 0 28px rgba(45,212,191,0.85); }
  }
  @keyframes badgePop {
    0%  { transform:scale(0); }
    70% { transform:scale(1.15); }
    100%{ transform:scale(1); }
  }
  @keyframes overlayFade {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes streakPop {
    0%   { transform:scale(0.7); }
    70%  { transform:scale(1.1); }
    100% { transform:scale(1); }
  }
  @keyframes dotBlink {
    0%,100% { opacity:1; }
    50%     { opacity:0.3; }
  }

  /* Nav item */
  .psb-item {
    display:flex; align-items:center; gap:14px;
    padding:11px 14px; border-radius:14px;
    cursor:pointer; transition:all 0.22s cubic-bezier(0.22,1,0.36,1);
    position:relative; text-decoration:none;
  }
  .psb-item:hover { background:rgba(255,255,255,0.06); }
  .psb-item.active {
    background:linear-gradient(135deg,#2DD4BF,#0891b2);
    box-shadow:0 6px 24px rgba(45,212,191,0.30);
    transform:translateX(3px);
    animation:activePulse 2.5s ease-in-out infinite;
  }
  .psb-item .psb-icon { transition:all 0.22s ease; flex-shrink:0; }
  .psb-item:hover .psb-icon { color:#2DD4BF; }
  .psb-item.active .psb-icon { color:#0B1E33; }

  /* Active indicator */
  .psb-item.active::before {
    content:''; position:absolute; left:-16px; top:50%;
    transform:translateY(-50%);
    width:4px; height:60%; background:#2DD4BF;
    border-radius:0 4px 4px 0;
  }

  /* Badge */
  .psb-badge {
    margin-left:auto; min-width:20px; height:20px;
    padding:0 6px; border-radius:99px;
    font-size:10px; font-weight:800;
    display:flex; align-items:center; justify-content:center;
    animation:badgePop 0.4s cubic-bezier(0.22,1,0.36,1) both;
  }
  .psb-badge-active { background:rgba(11,30,51,0.25); color:#0B1E33; }
  .psb-badge-default{ background:rgba(45,212,191,0.15); color:#2DD4BF; }

  /* Tooltip */
  .psb-tooltip {
    position:absolute; left:calc(100% + 14px); top:50%;
    transform:translateY(-50%);
    background:#0B1E33; color:#fff;
    padding:6px 12px; border-radius:10px;
    font-size:12px; font-weight:600; white-space:nowrap;
    border:1px solid rgba(45,212,191,0.20);
    box-shadow:0 8px 24px rgba(0,0,0,0.35);
    pointer-events:none; opacity:0;
    z-index:200;
  }
  .psb-tooltip::before {
    content:''; position:absolute; right:100%; top:50%;
    transform:translateY(-50%);
    border:5px solid transparent;
    border-right-color:#0B1E33;
  }
  .psb-item:hover .psb-tooltip { opacity:1; animation:tooltipPop 0.18s ease both; }

  /* Util item */
  .psb-util {
    display:flex; align-items:center; gap:12px;
    padding:10px 14px; border-radius:12px;
    text-decoration:none; transition:all 0.2s ease;
    color:rgba(255,255,255,0.38); font-size:13px; font-weight:500;
  }
  .psb-util:hover { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.80); }

  /* Hamburger */
  .psb-hamburger {
    position:fixed; top:14px; left:14px; z-index:300;
    width:42px; height:42px; border-radius:13px;
    background:#0B1E33; border:1px solid rgba(45,212,191,0.25);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; box-shadow:0 4px 20px rgba(0,0,0,0.3);
    transition:all 0.22s ease;
  }
  .psb-hamburger:hover { box-shadow:0 4px 20px rgba(45,212,191,0.25); }

  /* Overlay */
  .psb-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,0.55);
    backdrop-filter:blur(3px);
    z-index:199; animation:overlayFade 0.25s ease both;
  }

  /* XP bar fill */
  .xp-bar-fill {
    --xp-w: 71%;
    animation:xpFill 1.4s cubic-bezier(0.22,1,0.36,1) 0.4s both;
  }

  /* Stagger */
  .psb-nav-animate .psb-item { opacity:0; animation:sbFadeIn 0.45s cubic-bezier(0.22,1,0.36,1) both; }
  .psb-nav-animate .psb-item:nth-child(1){ animation-delay:0.05s; }
  .psb-nav-animate .psb-item:nth-child(2){ animation-delay:0.10s; }
  .psb-nav-animate .psb-item:nth-child(3){ animation-delay:0.15s; }
  .psb-nav-animate .psb-item:nth-child(4){ animation-delay:0.20s; }
  .psb-nav-animate .psb-item:nth-child(5){ animation-delay:0.25s; }

  .no-psb::-webkit-scrollbar { display:none; }
  .no-psb { -ms-overflow-style:none; scrollbar-width:none; }
`;

// ─── AdherenceRing ─────────────────────────────────────────────────────────────
function AdherenceRing({ value }: { value: number }) {
  const size = 38, stroke = 3.5, r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(45,212,191,0.12)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#2DD4BF" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 4px rgba(45,212,191,0.7))", transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1) 0.5s" }}
      />
    </svg>
  );
}

// ─── Sidebar Content ──────────────────────────────────────────────────────────
function SidebarContent({
  collapsed,
  onClose,
  pathname,
}: {
  collapsed: boolean;
  onClose?: () => void;
  pathname: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div style={{
        padding: collapsed ? "20px 12px 16px" : "20px 20px 16px",
        display: "flex", alignItems: "center",
        gap: collapsed ? 0 : 12,
        justifyContent: collapsed ? "center" : "flex-start",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        marginBottom: 8, position: "relative",
      }}>
        {onClose && (
          <button onClick={onClose} style={{
            position: "absolute", right: 14, top: 14,
            background: "rgba(255,255,255,0.06)", border: "none",
            borderRadius: 10, width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.5)",
          }}>
            <X size={16} />
          </button>
        )}
        <div style={{
          width: 40, height: 40, borderRadius: 13,
          background: "linear-gradient(135deg,#2DD4BF,#0891b2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, animation: "glowBreath 3s ease-in-out infinite",
        }}>
          <BrainCircuit size={20} color="#0B1E33" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "0.02em", lineHeight: 1.2 }}>
              ReVive<span style={{ color: "#2DD4BF" }}>X</span>
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#2DD4BF", textTransform: "uppercase", letterSpacing: "0.22em" }}>
              Patient Portal
            </div>
          </div>
        )}
      </div>

      {/* Collapsed avatar */}
      {collapsed && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10, padding: "0 12px" }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: "linear-gradient(135deg,#2DD4BF,#0891b2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 800, color: "#0B1E33",
          }}>
            {patient.initials}
          </div>
        </div>
      )}

      {/* ── Navigation ───────────────────────────────────────────────── */}
      <nav
        className="no-psb"
        style={{ flex: 1, overflowY: "auto", padding: collapsed ? "0 8px" : "0 12px" }}
      >
        {!collapsed && (
          <div style={{
            fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.22)",
            textTransform: "uppercase", letterSpacing: "0.18em",
            padding: "0 14px", marginBottom: 8,
          }}>
            Navigation
          </div>
        )}

        <div className="psb-nav-animate" style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <div
                  className={`psb-item ${isActive ? "active" : ""}`}
                  style={{
                    justifyContent: collapsed ? "center" : "flex-start",
                    padding: collapsed ? "12px" : "11px 14px",
                  }}
                >
                  <span className="psb-icon" style={{ color: isActive ? "#0B1E33" : "rgba(255,255,255,0.45)" }}>
                    <item.icon size={20} />
                  </span>

                  {collapsed && (
                    <div className="psb-tooltip">
                      {item.label}
                      {item.badge && (
                        <span style={{
                          marginLeft: 6, background: "#2DD4BF", color: "#0B1E33",
                          borderRadius: 99, padding: "0 6px", fontSize: 10, fontWeight: 800,
                        }}>{item.badge}</span>
                      )}
                    </div>
                  )}

                  {!collapsed && (
                    <>
                      <span style={{
                        fontSize: 13, fontWeight: isActive ? 700 : 500, flex: 1,
                        color: isActive ? "#0B1E33" : "rgba(255,255,255,0.65)",
                      }}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className={`psb-badge ${isActive ? "psb-badge-active" : "psb-badge-default"}`}>
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight size={14} style={{ color: "#0B1E33", opacity: 0.6, flexShrink: 0 }} />}
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Bottom ───────────────────────────────────────────────────── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: collapsed ? "12px 8px" : "12px",
        background: "rgba(0,0,0,0.15)",
      }}>
        {!collapsed && (
          <div style={{ marginBottom: 8 }}>
            {bottomItems.map((item) => (
              <Link key={item.href} href={item.href} className="psb-util">
                <item.icon size={16} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}

        {collapsed && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
            {bottomItems.map((item) => (
              <Link key={item.href} href={item.href} style={{
                display: "flex", justifyContent: "center", padding: "10px",
                borderRadius: 12, color: "rgba(255,255,255,0.38)",
                textDecoration: "none", transition: "all 0.2s ease", position: "relative",
              }}>
                <item.icon size={18} />
                <div className="psb-tooltip">{item.label}</div>
              </Link>
            ))}
          </div>
        )}

        <Link href="/" style={{ textDecoration: "none", display: "block" }}>
          <div style={{
            display: "flex", alignItems: "center",
            gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? "10px" : "10px 14px",
            borderRadius: 12,
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.15)",
            color: "#f87171", fontSize: 13, fontWeight: 700,
            cursor: "pointer", transition: "all 0.2s ease",
            position: "relative",
          }}>
            <LogOut size={16} />
            {!collapsed && <span>Sign Out</span>}
            {collapsed && <div className="psb-tooltip">Sign Out</div>}
          </div>
        </Link>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PatientSidebar() {
  const pathname = usePathname();
  const [bp, setBp] = useState<BreakPoint>("desktop");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 768) setBp("mobile");
      else if (w < 1024) setBp("tablet");
      else setBp("desktop");
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  const collapsed = bp === "tablet";
  const hidden    = bp === "mobile" && !mobileOpen;
  const width     = bp === "desktop" ? 272 : bp === "tablet" ? 72 : 272;

  return (
    <div className="pat-sb">
      <style>{STYLES}</style>

      {/* Hamburger */}
      {bp === "mobile" && !mobileOpen && (
        <button className="psb-hamburger" onClick={() => setMobileOpen(true)}>
          <Menu size={20} color="#2DD4BF" />
        </button>
      )}

      {/* Overlay */}
      {bp === "mobile" && mobileOpen && (
        <div className="psb-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Panel */}
      <aside style={{
        position: "fixed", left: 0, top: 0,
        height: "100vh", width,
        background: "linear-gradient(180deg,#0d2442 0%,#0B1E33 40%,#081626 100%)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "4px 0 40px rgba(0,0,0,0.35)",
        zIndex: 200,
        display: hidden ? "none" : "flex",
        flexDirection: "column",
        transition: "width 0.3s cubic-bezier(0.22,1,0.36,1)",
        animation: bp === "mobile" && mobileOpen ? "sbSlideIn 0.3s cubic-bezier(0.22,1,0.36,1)" : "none",
        overflow: "hidden",
      }}>
        {/* Decorative glow */}
        <div style={{
          position: "absolute", top: -60, left: -60, width: 200, height: 200,
          background: "radial-gradient(circle,rgba(45,212,191,0.08),transparent 70%)",
          pointerEvents: "none",
        }} />

        <SidebarContent
          collapsed={collapsed}
          onClose={bp === "mobile" ? () => setMobileOpen(false) : undefined}
          pathname={pathname}
        />
      </aside>

      {/* Offset helper */}
      <style>{`
        .pat-main-offset {
          margin-left: ${bp === "desktop" ? "272px" : bp === "tablet" ? "72px" : "0px"};
          transition: margin-left 0.3s cubic-bezier(0.22,1,0.36,1);
        }
        @media (max-width:767px) {
          .pat-main-offset { margin-left:0 !important; padding-top:64px; }
        }
      `}</style>
    </div>
  );
}
