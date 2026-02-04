import React from 'react';
import DoctorSidebar from '@/components/DoctorPortal/Sidebar';
import TopNav from '@/components/DoctorPortal/TopNav';

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F3F4F6]">
      
      <DoctorSidebar />
      
      <main className="flex-1 ml-72 relative flex flex-col min-w-0">

        <TopNav /> 


        <div className="p-8 flex-1 overflow-y-auto animate-fade-in">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>

    </div>
  );
}