import { Suspense } from "react";
import GameCanvas from "@/components/GameCanvas";

export default function GamePage() {
  return (
    // Centered container with dark background
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020c1b]">
      <Suspense fallback={<div className="text-white">Loading game...</div>}>
        <GameCanvas />
      </Suspense>
    </div>
  );
}
