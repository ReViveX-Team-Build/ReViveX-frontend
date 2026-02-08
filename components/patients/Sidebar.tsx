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
