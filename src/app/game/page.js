import GameCanvas from "../components/GameCanvas";

export default function GamePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020c1b]">
      <h1 className="text-2xl font-bold text-teal-500 mb-4">Calibration Phase</h1>
     
      <GameCanvas />
      <p className="text-gray-500 mt-4 text-sm">Press SPACE to swim</p>
    </div>
  );
};