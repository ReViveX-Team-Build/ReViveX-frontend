"use client";

import React from "react";
import { Search, Bell, ChevronDown, User } from "lucide-react";

export default function PatientTopNav() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm px-8 py-4 flex items-center justify-between">

      {/* SEARCH BAR */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search exercises or sessions..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:bg-white transition-all text-sm"
          />
        </div>
      </div>

            
      <div className="flex items-center gap-6">
            
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <Bell size={22} />
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        
        <div className="h-8 w-px bg-gray-200"></div>

                
        <button className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-xl transition-all group">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-[#0B1E33] leading-none">P.B. Silva</p>
            <p className="text-xs text-gray-500 mt-1">Patient ID: RVX-9988</p>
          </div>
          
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#2DD4BF] to-purple-500 p-[2px]">
             <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                <User className="text-gray-400" /> 
             </div>
          </div>

          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#2DD4BF] to-blue-500 p-[2px]">
            <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              <User className="text-gray-400" />
            </div>
          </div>

          <ChevronDown
            size={16}
            className="text-gray-400 group-hover:text-[#0B1E33] transition-colors"
          />
        </button>

      </div>
    </header>
  );
}
