"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Import both levels
import Level1Canvas from "@/components/GameCanvas/level1";
import Level2Canvas from "@/components/GameCanvas/level2";

function GameSwitcher() {
  const searchParams = useSearchParams();
  const level = searchParams.get("level");

  // Read the URL and serve the correct game!
  if (level === "1") return <Level1Canvas />;
  return <Level2Canvas />;
}

export default function GamePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020c1b]">
      <Suspense fallback={<div className="text-[#2DD4BF] font-mono animate-pulse">Loading Protocol...</div>}>
        <GameSwitcher />
      </Suspense>
    </div>
  );
}