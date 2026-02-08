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