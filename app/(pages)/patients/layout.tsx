<<<<<<< HEAD
import React from 'react';
import PatientSidebar from '@/components/patients/Sidebar';
import PatientTopbar from '@/components/patients/Topbar';
=======
import React from "react";
import PatientSidebar from "@/components/PatientPortal/Sidebar";
import PatientTopNav from "@/components/PatientPortal/TopNav";
>>>>>>> senuka-feature-branch

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
<<<<<<< HEAD
    <div className="flex min-h-screen bg-[#F8FAFC]"> {/* Light Grey Background */}
      
      {/* 1. Fixed Sidebar */}
      <PatientSidebar />
      
      {/* 2. Main Content Wrapper */}
     
      <main className="flex-1 ml-72 relative flex flex-col min-w-0">

        {/* 3. Top Navigation */}
        <PatientTopbar /> 

        {/* 4. Page Content Injection */}
=======
    <div className="flex min-h-screen bg-[#F3F4F6]">

      <PatientSidebar />

      <main className="flex-1 ml-72 relative flex flex-col min-w-0">

        <PatientTopNav />

>>>>>>> senuka-feature-branch
        <div className="p-8 flex-1 overflow-y-auto animate-fade-in">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>

      </main>

    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> senuka-feature-branch
