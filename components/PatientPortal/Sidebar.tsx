"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Gamepad2,
  BarChart3,
  Calendar,
  MessageCircle,
  Bot,
  User,
  Settings,
} from "lucide-react";

export default function PatientSidebar() {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
      pathname === path
        ? "bg-teal-500 text-[#062E2B] font-semibold"
        : "text-gray-300 hover:bg-white/10"
    }`;

  return (
    <aside className="fixed left-0 top-0 w-72 h-screen bg-[#0B1E33] text-white p-6 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center font-bold text-lg text-[#062E2B]">
          R
        </div>
        <div>
          <h1 className="text-xl font-bold">ReViveX</h1>
          <p className="text-xs text-gray-400">Patient Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        <Link href="/patients/home" className={linkClass("/patients/home")}>
          <Home size={18} />
          Home
        </Link>

        <Link href="/patients/therapy-games" className={linkClass("/patients/therapy-games")}>
          <Gamepad2 size={18} />
          Therapy Games
        </Link>

        <Link
          href="/patients/progress"
          className={linkClass("/patients/progress")}>
          <BarChart3 size={18} />
          My Progress
        </Link>

        <Link
          href="/patients/schedule"
          className={linkClass("/patients/schedule")}>
          <Calendar size={18} />
          Schedule
        </Link>

        <Link
          href="/patients/messages"
          className={linkClass("/patients/messages")}>
          <MessageCircle size={18} />
          Messages
        </Link>

        <Link
          href="/patients/ai-companion"
          className={linkClass("/patients/ai-companion")}>
          <Bot size={18} />
          AI Companion
        </Link>

        <Link
          href="/patients/profile"
          className={linkClass("/patients/profile")}>
          <User size={18} />
          Profile
        </Link>

        <Link
          href="/patients/settings"
          className={linkClass("/patients/settings")}>
          <Settings size={18} />
          Settings
        </Link>
      </nav>
    </aside>
  );
}
