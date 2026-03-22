"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";

// 1. IMPORT YOUR LEVELS
import Level1Canvas from "@/components/GameCanvas/level1";
import Level2Canvas from "@/components/GameCanvas/level2";

// (When you merge your teammate's work, import their games/levels here!)
// import MemoryGateLevel1 from "@/components/MemoryGate/level1";

function GameRouter() {
  // Grab the dynamic [gameId] from the folder structure
  const params = useParams(); 
  // Grab the ?level=1 from the end of the URL
  const searchParams = useSearchParams();
  
  const gameId = params.gameId; // e.g., "synapse_racer"
  const level = searchParams.get("level");

  console.log("🟢 DYNAMIC ROUTER LOADING GAME:", gameId, "| LEVEL:", level);

  // 2. SWITCHBOARD FOR SYNAPSE RACER
  if (gameId === "synapse_racer" || gameId === "synapse-racer") {
    if (level === "1") return <Level1Canvas />;
    if (level === "2") return <Level2Canvas />;
    
    // Default fallback for Synapse Racer
    return <Level2Canvas />; 
  }

  // 3. SWITCHBOARD FOR FUTURE GAMES (Teammate's work)
  // if (gameId === "memory_gate") {
  //    if (level === "1") return <MemoryGateLevel1 />;
  // }

  // Fallback if a game doesn't exist yet
  return (
    <div className="text-[#2DD4BF] font-mono text-xl animate-pulse">
      404: Protocol {gameId} not found.
    </div>
  );
}

export default function DynamicGamePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020c1b]">
      <Suspense fallback={<div className="text-[#2DD4BF] font-mono animate-pulse">Initializing Neural Link...</div>}>
        <GameRouter />
      </Suspense>
    </div>
  );
}