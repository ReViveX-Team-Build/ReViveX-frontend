"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

// 1. IMPORT YOUR LEVELS
import Level1Canvas from "@/components/GameCanvas/level1";
import Level2Canvas from "@/components/GameCanvas/level2";

// (When you merge your teammate's work, just uncomment these!)
// import Level3Canvas from "@/components/GameCanvas/level3";
// import Level4Canvas from "@/components/GameCanvas/level4";
// import Level5Canvas from "@/components/GameCanvas/level5";

function GameRouter() {
  const searchParams = useSearchParams();
  const level = searchParams.get("level");


  console.log("🟢 NEXT.JS IS TRYING TO LOAD LEVEL:", level);

  // 2. SWITCHBOARD (Ready for all 5 levels)
  if (level === "1") return <Level1Canvas />;
  if (level === "2") return <Level2Canvas />;
  
  // (Uncomment these when merging your teammate's code)
  // if (level === "3") return <Level3Canvas />;
  // if (level === "4") return <Level4Canvas />;
  // if (level === "5") return <Level5Canvas />;

  // Default fallback if URL is weird
  return <Level2Canvas />;
}

export default function GamePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020c1b]">
      <Suspense fallback={<div className="text-[#2DD4BF] font-mono animate-pulse">Loading...</div>}>
        <GameRouter />
      </Suspense>
    </div>
  );
}