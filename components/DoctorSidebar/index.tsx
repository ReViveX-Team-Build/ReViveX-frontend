"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  MessageSquare,
  PieChart,
  Settings,
  HelpCircle,
  LogOut,
  Activity // Placeholder icon for logo
} from "lucide-react";

const DoctorSidebar = () => {
  const pathname = usePathname();

  // 1. Define your Navigation Items
  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/doctor/home" },
    { icon: <CalendarDays size={20} />, label: "Appointments", href: "/doctor/appointments" },
    { icon: <Users size={20} />, label: "Patients", href: "/doctor/patients" },
    { icon: <MessageSquare size={20} />, label: "Messages", href: "/doctor/messages" },
    { icon: <PieChart size={20} />, label: "Analytics", href: "/doctor/analytics" },
  ];

  const utilityItems = [
    { icon: <Settings size={20} />, label: "Settings", href: "/doctor/settings" },
    { icon: <HelpCircle size={20} />, label: "Help & Support", href: "/doctor/support" },
  ];

  // 2. Helper Component for Links
  const NavLink = ({ item, isUtility = false }: { item: any, isUtility?: boolean }) => {
    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

    return (
      <Link href={item.href} className="block mb-1">
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium
            ${isActive 
                ? "bg-secondary text-primary shadow-lg shadow-secondary/20 translate-x-1 font-bold" // Active: Teal Background
                : "text-primary-foreground/70 hover:bg-white/10 hover:text-secondary" // Inactive: Transparent
            } 
            ${isUtility ? "text-sm" : ""}`
          }
        >
          <span className={`${isActive ? "text-primary" : "group-hover:text-secondary"}`}>
            {item.icon}
          </span>
          <span>{item.label}</span>
        </div>
      </Link>
    );
  };

  return (
    <aside className="h-screen w-72 bg-primary text-primary-foreground flex flex-col border-r border-white/10 sticky top-0 shadow-xl z-50">
      
      {/* --- HEADER --- */}
      <div className="p-6 mb-4 flex items-center gap-3">
        {/* Logo Placeholder */}
        <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shadow-[0_0_15px_rgba(45,212,191,0.5)]">
             <Activity className="text-primary h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-wide">ReViveX</h1>
          <p className="text-xs text-secondary uppercase tracking-wider font-semibold">Doctor Portal</p>
        </div>
      </div>

      {/* --- MENU --- */}
      <nav className="flex-1 px-4 space-y-6 overflow-y-auto no-scrollbar">
        <div>
          <p className="px-4 mb-2 text-xs font-semibold text-primary-foreground/50 uppercase tracking-wider">Main Menu</p>
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        <div>
          <p className="px-4 mb-2 text-xs font-semibold text-primary-foreground/50 uppercase tracking-wider">System</p>
          {utilityItems.map((item) => (
            <NavLink key={item.href} item={item} isUtility />
          ))}
        </div>
      </nav>

      {/* --- FOOTER --- */}
      <div className="p-4 m-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-secondary/20 border-2 border-secondary flex items-center justify-center text-secondary">
                 <Users size={20} />
            </div>
            <div className="overflow-hidden">
                <p className="font-semibold text-sm truncate">Dr. S. Connors</p>
                <p className="text-xs text-primary-foreground/60">Neuro Specialist</p>
            </div>
        </div>
        <Link href="/">
          <button className="w-full flex items-center justify-center gap-2 p-2.5 text-xs font-semibold text-red-300 hover:bg-red-500/10 hover:text-red-200 rounded-lg transition-colors uppercase tracking-wide">
            <LogOut size={14} />
            Sign Out
          </button>
        </Link>
      </div>
    </aside>
  );
};

export default DoctorSidebar;