import { Suspense } from 'react';
import SkyMemoryGame from "@/components/SkyMemoryGame";

export default function SkyMemoryPage() {
  return (
    <Suspense fallback={<div>Loading game...</div>}>
      <SkyMemoryGame />
    </Suspense>
  );
}

