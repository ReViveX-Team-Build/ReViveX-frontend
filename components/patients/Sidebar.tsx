"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  TrendingUp,   // My Progress
  CalendarDays, // My Schedule
  Bot,          // AI Companion
  MessageCircle,// Doctor Messages
  Settings,
  HelpCircle,   // FAQ
  LogOut,
  BrainCircuit  
} from "lucide-react";

const PatientSidebar = () => {
  const pathname = usePathname();

  // Navigation Items
  const navItems = [
    { icon: <Home size={22} />, label: "Home", href: "/patients/home" },
    { icon: <TrendingUp size={22} />, label: "My Progress", href: "/patients/progress" },
    { icon: <CalendarDays size={22} />, label: "My Schedule", href: "/patients/schedule" },
    { icon: <Bot size={22} />, label: "AI Companion", href: "/patients/ai" },
    { icon: <MessageCircle size={22} />, label: "Doctor Messages", href: "/patients/messages" },
  ];

//BOTTOM ISTEMS

const bottomItems = [
    { icon: <Settings size={20} />, label: "Settings", href: "/patients/settings" },
    { icon: <HelpCircle size={20} />, label: "FAQ", href: "/patients/faq" },
  ];

  return (
    <aside className="h-screen w-72 bg-[#0B1E33] text-white flex flex-col fixed left-0 top-0 border-r border-white/10 shadow-2xl z-50">
      
      {/* 1. LOGO AREA */}
      <div className="p-6 mb-2 flex items-center gap-3">
        {/* Patient Logo uses a slightly different style or icon to distinguish from Doctor */}
        <div className="h-10 w-10 rounded-xl bg-[#2DD4BF] flex items-center justify-center shadow-[0_0_15px_rgba(45,212,191,0.5)]">
             <BrainCircuit className="text-[#0B1E33] h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-wide">ReViveX</h1>
          <p className="text-[10px] text-[#2DD4BF] uppercase tracking-widest font-bold">Patient Portal</p>
        </div>
      </div>

      <div className="p-6 mb-2 flex items-center gap-3">
  <div className="h-10 w-10 rounded-xl bg-[#2DD4BF] flex items-center justify-center shadow-[0_0_15px_rgba(45,212,191,0.5)]">
    <BrainCircuit className="text-[#0B1E33] h-6 w-6" />
  </div>
  <div>
    <h1 className="text-xl font-bold tracking-wide">ReViveX</h1>
    <p className="text-[10px] text-[#2DD4BF] uppercase tracking-widest font-bold">
      Patient Portal
    </p>
  </div>
</div>

{/* 2. NAVIGATION MENU */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto no-scrollbar">
        <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Menu</p>
        
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href}>
              <div className={`
                flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? "bg-[#2DD4BF] text-[#0B1E33] font-bold shadow-lg shadow-[#2DD4BF]/20 translate-x-1" 
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
                }
              `}>
                <span className={isActive ? "text-[#0B1E33]" : "group-hover:text-[#2DD4BF] transition-colors"}>
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* 3. BOTTOM UTILITIES & LOGOUT */}
      <div className="p-4 border-t border-white/10 bg-[#081626]">
        <div className="space-y-1 mb-4">
            {bottomItems.map((item) => (
                <Link key={item.href} href={item.href}>
                <div className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                    {item.icon}
                    <span className="text-sm font-medium">{item.label}</span>
                </div>
                </Link>
            ))}
        </div>

       <Link href="/">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors text-sm font-bold bg-red-500/5 border border-red-500/20">
              <LogOut size={18} />
              <span>Sign Out</span>
          </button>
        </Link>
      </div>
    </aside>
  );
};

export default PatientSidebar;
