"use client";

import { seedDatabase } from "../../app/lib/seedDatabase";
import { Database } from "lucide-react";

export default function SeedButton() {
  
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <button 
    suppressHydrationWarning={true}
      onClick={seedDatabase}
      className="fixed bottom-4 right-4 z-[9999] bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center gap-2 font-bold text-xs"
      title="Populate Mock Data"
    >
      <Database size={16} />
      SEED DB
    </button>
  );
}