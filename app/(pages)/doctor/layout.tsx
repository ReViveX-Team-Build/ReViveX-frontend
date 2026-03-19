import React from "react";
// Ensure these paths match where you saved your components
import DoctorSidebar from "@/components/DoctorPortal/Sidebar";
import DoctorTopbar from "@/components/DoctorPortal/Topbar";

import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F3F4F6] dark:bg-slate-900">
      {/* 1. Fixed Sidebar */}
      <DoctorSidebar />

      {/* 2. Main Wrapper */}
      {/* ml-72 creates the empty space for the sidebar to sit in */}
      <main className="flex-1 ml-72 relative flex flex-col min-w-0">
        {/* 3. Sticky Topbar */}
        <DoctorTopbar />

        {/* 4. Page Content Injection */}
        {/* This is where your Dashboard page gets put */}
        <div className="p-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
