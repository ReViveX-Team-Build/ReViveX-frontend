import React from 'react';
import PatientSidebar from '@/components/PatientPortal/Sidebar';
import PatientTopbar from '@/components/PatientPortal/Topbar';

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]"> {/* Light Grey Background */}
      
      {/* 1. Fixed Sidebar */}
      <PatientSidebar />
      
      {/* 2. Main Content Wrapper */}
     
      <main className="flex-1 ml-72 relative flex flex-col min-w-0">

        {/* 3. Top Navigation */}
        <PatientTopbar /> 

        {/* 4. Page Content Injection */}
        <div className="p-8 flex-1 overflow-y-auto animate-fade-in">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>

      </main>

    </div>
  );
}
