import GameCanvas from "../components/SynapseGameCanvas";

export default function GamePage() {
  return (
    // Centered container with dark background
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020c1b]">
      <GameCanvas />
    </div>
  );
};