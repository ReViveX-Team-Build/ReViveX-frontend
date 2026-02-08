'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Bot,
  Settings,
} from 'lucide-react';

export function DoctorSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + '/');

  const linkClass = (path: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
      isActive(path)
        ? 'bg-teal-500 text-[#0B1E33] font-semibold'
        : 'text-gray-300 hover:bg-white/10'
    }`;

  return (
    <aside className="w-64 bg-[#0B1E33] text-white hidden md:flex flex-col p-6">
      
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center font-bold text-lg text-[#0B1E33]">
          R
        </div>
        <div>
          <h1 className="text-xl font-bold">ReViveX</h1>
          <p className="text-xs text-gray-400">Doctor Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        <Link href="/doctor" className={linkClass('/doctor')}>
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        <Link href="/doctor/patients" className={linkClass('/doctor/patients')}>
          <Users size={18} />
          Patients
        </Link>

        <Link href="/doctor/schedule" className={linkClass('/doctor/schedule')}>
          <Calendar size={18} />
          Schedule
        </Link>

        <Link href="/doctor/reports" className={linkClass('/doctor/reports')}>
          <FileText size={18} />
          Reports
        </Link>

        <Link
          href="/doctor/ai-assistant"
          className={linkClass('/doctor/ai-assistant')}
        >
          <Bot size={18} />
          AI Assistant
        </Link>

        <Link href="/doctor/settings" className={linkClass('/doctor/settings')}>
          <Settings size={18} />
          Settings
        </Link>
      </nav>
    </aside>
  );
}
