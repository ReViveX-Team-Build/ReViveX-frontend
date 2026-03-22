"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/app/lib/firebase";
import { getDoctorSchedule } from "@/app/lib/db/schedule";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ScheduledSession } from "@/app/lib/db/types";
import { signOut } from "firebase/auth";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  BarChart2,
  Bot,
  Settings,
  HelpCircle,
  LogOut,
  Activity,
  ChevronRight,
  X,
  Menu,
  Stethoscope,
  Bell,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type BreakPoint = "mobile" | "tablet" | "desktop";
type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  badge: string | null;
};

// ─── Nav data ─────────────────────────────────────────────────────────────────
const navItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/doctor/home",
    badge: null,
  },

  { icon: Users, label: "My Patients", href: "/doctor/patients", badge: null },
  {
    icon: CalendarDays,
    label: "Schedule",
    href: "/doctor/schedule",
    badge: null,
  },
  {
    icon: Stethoscope,
    label: "Therapy Protocols",
    href: "/doctor/protocols",
    badge: null,
  },
  { icon: BarChart2, label: "Reports", href: "/doctor/reports", badge: null },
  {
    icon: Bot,
    label: "AI Companion",
    href: "/doctor/ai-companion",
    badge: null,
  },
];

const bottomItems = [
  { icon: Settings, label: "Settings", href: "/doctor/settings" },
  { icon: HelpCircle, label: "FAQ & Support", href: "/doctor/faq" },
];

// ─── CSS ──────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .doc-sb * { font-family:'Plus Jakarta Sans',system-ui,sans-serif; box-sizing:border-box; }

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
  @keyframes dotBlink {
    0%,100% { opacity:1; }
    50%     { opacity:0.3; }
  }

  /* Sidebar nav item */
  .sb-item {
    display:flex; align-items:center; gap:14px;
    padding:11px 14px; border-radius:14px;
    cursor:pointer; transition:all 0.22s cubic-bezier(0.22,1,0.36,1);
    position:relative; text-decoration:none;
  }
  .sb-item:hover { background:rgba(255,255,255,0.06); }
  .sb-item.active {
    background:linear-gradient(135deg,#2DD4BF,#0891b2);
    box-shadow:0 6px 24px rgba(45,212,191,0.30);
    transform:translateX(3px);
    animation:activePulse 2.5s ease-in-out infinite;
  }
  .sb-item .sb-icon { transition:all 0.22s ease; flex-shrink:0; }
  .sb-item:hover .sb-icon { color:#2DD4BF; }
  .sb-item.active .sb-icon { color:#0B1E33; }

  /* Active indicator bar */
  .sb-item.active::before {
    content:''; position:absolute; left:-16px; top:50%;
    transform:translateY(-50%);
    width:4px; height:60%; background:#2DD4BF;
    border-radius:0 4px 4px 0;
  }

  /* Badge */
  .sb-badge {
    margin-left:auto; min-width:20px; height:20px;
    padding:0 6px; border-radius:99px;
    font-size:10px; font-weight:800;
    display:flex; align-items:center; justify-content:center;
    animation:badgePop 0.4s cubic-bezier(0.22,1,0.36,1) both;
  }
  .sb-badge-active { background:rgba(11,30,51,0.25); color:#0B1E33; }
  .sb-badge-default{ background:rgba(45,212,191,0.15); color:#2DD4BF; }

  /* Tooltip for collapsed mode */
  .sb-tooltip {
    position:absolute; left:calc(100% + 14px); top:50%;
    transform:translateY(-50%);
    background:#0B1E33; color:#fff;
    padding:6px 12px; border-radius:10px;
    font-size:12px; font-weight:600; white-space:nowrap;
    border:1px solid rgba(45,212,191,0.20);
    box-shadow:0 8px 24px rgba(0,0,0,0.35);
    pointer-events:none; opacity:0;
    animation:none;
    z-index:200;
  }
  .sb-tooltip::before {
    content:''; position:absolute; right:100%; top:50%;
    transform:translateY(-50%);
    border:5px solid transparent;
    border-right-color:#0B1E33;
  }
  .sb-item:hover .sb-tooltip { opacity:1; animation:tooltipPop 0.18s ease both; }

  /* Bottom util item */
  .sb-util {
    display:flex; align-items:center; gap:12px;
    padding:10px 14px; border-radius:12px;
    text-decoration:none; transition:all 0.2s ease;
    color:rgba(255,255,255,0.40); font-size:13px; font-weight:500;
  }
  .sb-util:hover { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.80); }

  /* Hamburger button */
  .sb-hamburger {
    position:fixed; top:14px; left:14px; z-index:300;
    width:42px; height:42px; border-radius:13px;
    background:#0B1E33; border:1px solid rgba(45,212,191,0.25);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; box-shadow:0 4px 20px rgba(0,0,0,0.3);
    transition:all 0.22s ease;
  }
  .sb-hamburger:hover { background:#0d2640; box-shadow:0 4px 20px rgba(45,212,191,0.20); }

  /* Mobile overlay */
  .sb-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,0.55);
    backdrop-filter:blur(3px);
    z-index:199; animation:overlayFade 0.25s ease both;
  }

  /* Section label */
  .sb-section-label {
    font-size:9px; font-weight:700; color:rgba(255,255,255,0.22);
    text-transform:uppercase; letter-spacing:0.18em;
    padding:0 14px; margin-bottom:6px; margin-top:4px;
  }

  /* Scrollbar hide */
  .no-sb::-webkit-scrollbar { display:none; }
  .no-sb { -ms-overflow-style:none; scrollbar-width:none; }

  /* Stagger nav items */
  .sb-item:nth-child(1){ animation-delay:0.05s; }
  .sb-item:nth-child(2){ animation-delay:0.10s; }
  .sb-item:nth-child(3){ animation-delay:0.15s; }
  .sb-item:nth-child(4){ animation-delay:0.20s; }
  .sb-item:nth-child(5){ animation-delay:0.25s; }
  .sb-item:nth-child(6){ animation-delay:0.30s; }
  .sb-nav-animate .sb-item {
    opacity:0; animation:sbFadeIn 0.45s cubic-bezier(0.22,1,0.36,1) both;
  }
`;

// ─── Sidebar inner content ─────────────────────────────────────────────────────
function SidebarContent({
  collapsed,
  onClose,
  pathname,
  navItems,
  initials, 
}: {
  collapsed: boolean;
  onClose?: () => void;
  pathname: string;
  navItems: NavItem[];
  initials: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "0",
      }}>
      {/* ── Logo ───────────────────────────────────────────────────── */}
      <div
        style={{
          padding: collapsed ? "20px 12px 16px" : "20px 20px 16px",
          display: "flex",
          alignItems: "center",
          gap: collapsed ? 0 : 12,
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          marginBottom: 8,
          position: "relative",
        }}>
        {/* Close button on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              right: 14,
              top: 14,
              background: "rgba(255,255,255,0.06)",
              border: "none",
              borderRadius: 10,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "rgba(255,255,255,0.5)",
            }}>
            <X size={16} />
          </button>
        )}
        {/* Logo icon */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 13,
            background: "linear-gradient(135deg,#2DD4BF,#0891b2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            animation: "glowBreath 3s ease-in-out infinite",
          }}>
          <Activity size={20} color="#0B1E33" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "0.02em",
                lineHeight: 1.2,
              }}>
              ReVive<span style={{ color: "#2DD4BF" }}>X</span>
            </div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#2DD4BF",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
              }}>
              Doctor Portal
            </div>
          </div>
        )}
      </div>

      {/* Collapsed avatar */}
      {collapsed && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 12,
            padding: "0 12px",
          }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: "linear-gradient(135deg,#2DD4BF,#0891b2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 800,
              color: "#0B1E33",
            }}>
            {initials}
          </div>
        </div>
      )}

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <nav
        className="no-sb"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: collapsed ? "0 8px" : "0 12px",
        }}>
        {!collapsed && (
          <div className="sb-section-label" style={{ marginBottom: 8 }}>
            Main Menu
          </div>
        )}

        <div
          className="sb-nav-animate"
          style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{ textDecoration: "none" }}>
                <div
                  className={`sb-item ${isActive ? "active" : ""}`}
                  style={{
                    justifyContent: collapsed ? "center" : "flex-start",
                    padding: collapsed ? "12px" : "11px 14px",
                  }}>
                  <span
                    className="sb-icon"
                    style={{
                      color: isActive ? "#0B1E33" : "rgba(255,255,255,0.45)",
                    }}>
                    <item.icon size={20} />
                  </span>

                  {/* Tooltip in collapsed mode */}
                  {collapsed && (
                    <div className="sb-tooltip">
                      {item.label}
                      {item.badge && (
                        <span
                          style={{
                            marginLeft: 6,
                            background: "#2DD4BF",
                            color: "#0B1E33",
                            borderRadius: 99,
                            padding: "0 6px",
                            fontSize: 10,
                            fontWeight: 800,
                          }}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {!collapsed && (
                    <>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: isActive ? 700 : 500,
                          color: isActive
                            ? "#0B1E33"
                            : "rgba(255,255,255,0.65)",
                          flex: 1,
                        }}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`sb-badge ${isActive ? "sb-badge-active" : "sb-badge-default"}`}>
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <ChevronRight
                          size={14}
                          style={{
                            color: "#0B1E33",
                            opacity: 0.6,
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Bottom ─────────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: collapsed ? "12px 8px" : "12px",
          background: "rgba(0,0,0,0.15)",
        }}>
        {!collapsed && (
          <div style={{ marginBottom: 8 }}>
            {bottomItems.map((item) => (
              <Link key={item.href} href={item.href} className="sb-util">
                <item.icon size={16} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}

        {collapsed && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              marginBottom: 8,
            }}>
            {bottomItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "10px",
                  borderRadius: 12,
                  color: "rgba(255,255,255,0.38)",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}>
                <item.icon size={18} />
                <div className="sb-tooltip">{item.label}</div>
              </Link>
            ))}
          </div>
        )}

        <button
          onClick={() => signOut(auth)}
          style={{
            border: "none",
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? "10px" : "10px 14px",
            borderRadius: 12,
            background: "rgba(239,68,68,0.07)",
            borderTop: "1px solid rgba(239,68,68,0.15)",
            color: "#f87171",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}>
          <LogOut size={16} />
          {!collapsed && <span>Sign Out</span>}
          {collapsed && <div className="sb-tooltip">Sign Out</div>}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DoctorSidebar() {
  const pathname = usePathname();
  const [user] = useAuthState(auth);
  const [bp, setBp] = useState<BreakPoint>("desktop");
  const [mobileOpen, setMobileOpen] = useState(false);
  
  //  States for badges
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [patientCount, setPatientCount] = useState(0);
  const [initials, setInitials] = useState("DR");

  // Load Doctor Initials
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then((d) => {
      if (d.exists() && d.data().name) {
        const parts = d.data().name.trim().split(" ");
        setInitials(
          parts.length >= 2
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            : d.data().name.slice(0, 2).toUpperCase()
        );
      }
    });
  }, [user]);

  // Load Schedule Count
  useEffect(() => {
    const loadUpcomingCount = async () => {
      if (!user) {
        setUpcomingCount(0);
        return;
      }
      try {
        const schedule = await getDoctorSchedule(user.uid);
        const now = new Date();
        const upcoming = schedule.filter((session: ScheduledSession) => {
          if (session.status !== "scheduled") return false;
          const dt = new Date(
            `${session.scheduledDate}T${session.scheduledTime}`,
          );
          return !Number.isNaN(dt.getTime()) && dt >= now;
        }).length;
        setUpcomingCount(upcoming);
      } catch (e) {
        console.error("Failed to load doctor schedule count:", e);
        setUpcomingCount(0);
      }
    };
    void loadUpcomingCount();
  }, [user, pathname]);

  // 🟢 Load Real Patient Count
  useEffect(() => {
    const loadPatientCount = async () => {
      if (!user) {
        setPatientCount(0);
        return;
      }
      try {
        // Query users collection for patients assigned to this doctor
        const q = query(
          collection(db, "users"),
          where("role", "==", "patient"),
          where("assignedDoctorId", "==", user.uid)
        );
        const snap = await getDocs(q);
        setPatientCount(snap.size);
      } catch (e) {
        console.error("Failed to load patient count:", e);
        setPatientCount(0);
      }
    };
    void loadPatientCount();
  }, [user, pathname]);

  // 🟢 Dynamically map badges onto the navigation items
  const navItemsWithCounts = useMemo(
    () =>
      navItems.map((item) => {
        if (item.href === "/doctor/schedule") {
          return { ...item, badge: upcomingCount > 0 ? String(upcomingCount) : null };
        }
        if (item.href === "/doctor/patients") {
          return { ...item, badge: patientCount > 0 ? String(patientCount) : null };
        }
        return item;
      }),
    [upcomingCount, patientCount]
  );

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

  // Close drawer on route change
  useEffect(() => setMobileOpen(false), [pathname]);

  const collapsed = bp === "tablet";
  const hidden = bp === "mobile" && !mobileOpen;
  const width = bp === "desktop" ? 272 : bp === "tablet" ? 72 : 272;

  return (
    <div className="doc-sb">
      <style>{STYLES}</style>

      {/* ── Hamburger (mobile only) ─────────────────────────────────── */}
      {bp === "mobile" && !mobileOpen && (
        <button className="sb-hamburger" onClick={() => setMobileOpen(true)}>
          <Menu size={20} color="#2DD4BF" />
        </button>
      )}

      {/* ── Overlay (mobile) ────────────────────────────────────────── */}
      {bp === "mobile" && mobileOpen && (
        <div className="sb-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar panel ───────────────────────────────────────────── */}
      <aside
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          height: "100vh",
          width,
          background:
            "linear-gradient(180deg,#0d2442 0%,#0B1E33 40%,#081626 100%)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "4px 0 40px rgba(0,0,0,0.35)",
          zIndex: 200,
          display: hidden ? "none" : "flex",
          flexDirection: "column",
          transition: "width 0.3s cubic-bezier(0.22,1,0.36,1)",
          animation:
            bp === "mobile" && mobileOpen
              ? "sbSlideIn 0.3s cubic-bezier(0.22,1,0.36,1)"
              : "none",
          overflow: "hidden",
        }}>
        {/* Decorative teal glow top */}
        <div
          style={{
            position: "absolute",
            top: -60,
            left: -60,
            width: 200,
            height: 200,
            background:
              "radial-gradient(circle,rgba(45,212,191,0.08),transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <SidebarContent
          collapsed={collapsed}
          onClose={bp === "mobile" ? () => setMobileOpen(false) : undefined}
          pathname={pathname}
          navItems={navItemsWithCounts}
          initials={initials} 
        />
      </aside>

      {/* ── Main content offset ─────────────────────────────────────── */}
      {/* Export the offset so parent layout can use it */}
      <style>{`
        .doc-main-offset {
          margin-left: ${bp === "desktop" ? "272px" : bp === "tablet" ? "72px" : "0px"};
          transition: margin-left 0.3s cubic-bezier(0.22,1,0.36,1);
        }
        @media (max-width:767px) {
          .doc-main-offset { margin-left:0 !important; padding-top:64px; }
        }
      `}</style>
    </div>
  );
}