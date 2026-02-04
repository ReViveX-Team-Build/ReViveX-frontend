import React from 'react';
import DoctorSidebar from '@/components/DoctorSidebar'; 

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F3F4F6]"> 
      
      {/* 1. The Fixed Sidebar */}
      <DoctorSidebar />

     
      <main className="flex-1 ml-72 p-8">
        <div className="max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>

    </div>
  );
}