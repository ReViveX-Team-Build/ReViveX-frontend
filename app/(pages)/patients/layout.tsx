import React from "react";
import PatientSidebar from "@/components/PatientPortal/Sidebar";
import PatientTopNav from "@/components/PatientPortal/TopNav";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F3F4F6]">

      <PatientSidebar />

      <main className="flex-1 ml-72 relative flex flex-col min-w-0">

        <PatientTopNav />

        <div className="p-8 flex-1 overflow-y-auto animate-fade-in">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>

      </main>

    </div>
  );
}
