import Link from 'next/link';
import {
  Home,
  Gamepad2,
  BarChart3,
  Calendar,
  Bot
} from "lucide-react";

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, active = false }) => {
  const baseClasses = "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors";
  const activeClasses = active 
    ? "bg-teal-500 text-[#0B1E33] font-semibold shadow-lg shadow-teal-900/20"
    : "hover:bg-white/10 text-gray-300";

  return (
    <button className={`${baseClasses} ${activeClasses}`}>
      {icon}
      {label}
    </button>
  );
};

export default function PatientDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#0B1E33] text-white hidden md:flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center font-bold text-lg">R</div>
          <div>
            <h1 className="text-xl font-bold">ReViveX</h1>
            <p className="text-xs text-gray-400">Patient Portal</p>
          </div>
        </div>
        <nav className="space-y-2">
          <NavButton icon={<Home size={18} />} label="Home" active />
          <NavButton icon={<Gamepad2 size={18} />} label="Therapy Games" />
          <NavButton icon={<BarChart3 size={18} />} label="My Progress" />
          <NavButton icon={<Calendar size={18} />} label="Schedule" />
          <NavButton icon={<Bot size={18} />} label="AI Companion" />
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Welcome back, John!</h2>
          <p className="text-orange-500 font-medium mt-1 flex items-center gap-2">
            You're on a 3-day streak! 🔥
          </p>
        </header>

        {/* The "Up Next" Game Card */}
        <div className="bg-[#0B1E33] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          {/* Background Decorative Circle */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-teal-500 text-[#0B1E33] text-xs font-bold px-3 py-1 rounded-full uppercase">
                  Up Next
                </span>
                <span className="text-gray-400 text-sm">Today, 10:30 AM</span>
              </div>
              
              <h3 className="text-3xl font-bold mb-2">Synapse Racer: Protocol A</h3>
              <p className="text-gray-400">Target: Right Hand • Moderate Resistance • 15 Mins</p>
            </div>

            <Link href="/patients/game">
              <button className="bg-teal-500 hover:bg-teal-400 text-[#0B1E33] font-bold py-3 px-8 rounded-xl shadow-lg shadow-teal-500/20 transition-transform active:scale-95 flex items-center gap-2">
                ▶ Start Therapy
              </button>
            </Link>
          </div>
        </div>

        {/* Bottom Grid Placeholders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-48">
            <h4 className="font-bold text-[#0B1E33] mb-4">Session & Adherence Status</h4>
            <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              Chart Loading...
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-48">
            <h4 className="font-bold text-[#0B1E33] mb-4">AI Companion</h4>
             <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              Chat Bot Loading...
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}