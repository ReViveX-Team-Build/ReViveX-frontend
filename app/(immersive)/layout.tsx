"use client";

import React, { useState } from 'react';
// Imports pointing to your existing components
import Sidebar from '@/components/PatientPortal/Sidebar'; 
import Topbar from '@/components/PatientPortal/Topbar';   

export default function ImmersiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showUI, setShowUI] = useState(false);

  return (
    <div className="relative w-screen h-screen bg-[#020c1b] overflow-hidden">
      
      {/* --- TOP TRIGGER ZONE --- */}
      {/* Hovering the top 10px slides the Topbar down */}
      <div 
        className="absolute top-0 left-0 w-full h-4 z-50 hover:h-24 transition-all duration-300"
        onMouseEnter={() => setShowUI(true)}
        onMouseLeave={() => setShowUI(false)}
      >
        <div className={`transition-transform duration-500 ease-out ${showUI ? 'translate-y-0' : '-translate-y-full'}`}>
           <Topbar />
        </div>
      </div>

      {/* --- LEFT TRIGGER ZONE --- */}
      {/* Hovering the left 10px slides the Sidebar out */}
      <div 
        className="absolute top-0 left-0 h-full w-4 z-50 hover:w-72 transition-all duration-300"
        onMouseEnter={() => setShowUI(true)}
        onMouseLeave={() => setShowUI(false)}
      >
         <div className={`h-full transition-transform duration-500 ease-out ${showUI ? 'translate-x-0' : '-translate-x-full'}`}>
            <Sidebar />
         </div>
      </div>

      {/* --- GAME CONTENT (Full Screen) --- */}
      <main className="w-full h-full relative z-0">
        {children}
      </main>

    </div>
  );
}