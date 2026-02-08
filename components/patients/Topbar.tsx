"use client";
import React from "react";
import { Search, Bell, ChevronDown, User } from "lucide-react";

export default function PatientTopbar() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm px-8 py-4 flex items-center justify-between">
    </header>
  );
}

      {/* 1. SEARCH BAR */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search your records..." 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:bg-white transition-all text-sm"
          />
        </div>
      </div>

