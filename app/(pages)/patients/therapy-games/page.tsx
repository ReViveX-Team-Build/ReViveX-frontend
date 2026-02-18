import Link from "next/link";

interface Game {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  link: string;
}

const games: Game[] = [
  {
    id: "synapse-racer",
    title: "Synapse Racer",
    description: "Reaction-based grip strength training.",
    difficulty: "Moderate",
    link: "/patients/game",
  },
  {
    id: "grip-challenge",
    title: "Grip Challenge",
    description: "Sustained pressure control exercise.",
    difficulty: "Beginner",
    link: "/patient/therapy-games/grip-challenge",
  },
  {
    id: "memory-grip",
    title: "Memory Grip",
    description: "Dual-task memory and motor coordination training.",
    difficulty: "Advanced",
    link: "/patient/therapy-games/memory-grip",
  },
];

export default function TherapyGamesPage() {
  return (
    <div className="space-y-8">

      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-[#0B1E33]">
          Therapy Games
        </h1>
        <p className="text-gray-500 mt-1">
          Select a rehabilitation game to begin your session.
        </p>
      </header>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {games.map((game) => (
          <div
            key={game.id}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-semibold text-[#0B1E33]">
                {game.title}
              </h2>

              <p className="text-sm text-gray-500 mt-2">
                {game.description}
              </p>

              <p className="text-xs mt-4 font-medium text-teal-600">
                Difficulty: {game.difficulty}
              </p>
            </div>

            <Link
              href={game.link}
              className="mt-6 inline-block bg-teal-500 hover:bg-teal-400 text-[#062E2B] font-semibold py-2 px-4 rounded-xl transition text-center"
            >
              Play
            </Link>
          </div>
        ))}

      </div>

    </div>
  );
}
