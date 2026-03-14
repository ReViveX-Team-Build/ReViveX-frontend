const mockAdherenceData = {
  nextSession: {
    data: "Feb 10 2025",
    time: "10.30 AM",
    hand: "Right Hand",
  },
  weekly: {
    completed: 5,
    total: 7,
    percentage: 71,
  },
};

import Link from 'next/link';
import {
  Home,
  Gamepad2,
  BarChart3,
  Calendar,
  Bot,
  Play
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
      {/* Main Content Area */}
      <main className="flex-1 p-8">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Welcome back, John!</h2>
          <p className="text-orange-500 font-medium mt-1 flex items-center gap-2">
            You're on a 3-day streak! 🔥
          </p>
        </header>

      {/* HERO CARD: UP NEXT */}
      <div className="bg-[#0B1E33] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
         
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 w-80 h-80 bg-[#2DD4BF]/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-[#2DD4BF]/20 transition-all duration-500"></div>

         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div>
             <div className="flex items-center gap-3 mb-4">
               <span className="bg-[#2DD4BF] text-[#0B1E33] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                 Up Next
               </span>
               <span className="text-gray-300 text-sm font-medium">Today, 10:30 AM</span>
             </div>
             
             <h3 className="text-3xl font-bold mb-2">Synapse Racer: Protocol A</h3>
             <p className="text-gray-400 max-w-md">Targeting Right Hand Motor Control • Moderate Resistance • 15 Mins</p>
           </div>

           <Link href="/patients/game">
             <button className="bg-[#2DD4BF] hover:bg-[#20cbb5] text-[#0B1E33] font-bold py-4 px-8 rounded-2xl shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all active:scale-95 flex items-center gap-3">
               <Play size={20} fill="#0B1E33" /> Start Session
             </button>
           </Link>
         </div>
      </div>

        {/* Bottom Grid Placeholders */}
        
        <div className='bg-white p-6 rounded-2xl shadow-sm border-gray-100'>
          <h4 className='text-lg font-semibold text-[#0B1E33] mb-6'>
            Session & Adherence Status
          </h4>

          {/* Next Therapy Session */}

          <div className='bg-gray-50 rounded-xl p-5 mb-6'>
            <h5 className='font-semibold text-[#0B1E33] mb-4'>
              Next Therapy Session
            </h5>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center'>
                📅
                </div>
                <div>
                  <p className='text-gray-500'>Date</p>
                  <p className='font-semibold text-teal-600'>{mockAdherenceData.nextSession.data}</p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center'>
                ⏰
                </div>
                <div>
                  <p className='text-gray-500'>Time</p>
                  <p className='font-semibold text-teal-600'>{mockAdherenceData.nextSession.time}</p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center'>
                ✋
                </div>
                <div>
                  <p className='text-gray-500'>Prescribed Hand</p>
                  <p className='font-semibold text-teal-600'>{mockAdherenceData.nextSession.hand}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Adherence */}

          <div className='bg-green-50 rounded-xl p-5'>
            <div className='flex items-center justify-between mb-3'>
              <h5 className='font-semibold text-[#0B1E33]'>
                Weekly Adherence Score
              </h5>

              <p className='text-2xl font-bold text-green-600'>
                {mockAdherenceData.weekly.percentage}%
              </p>
            </div>

            {/* Progress Bar */}

            <div className='w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3'>
              <div 
              className='h-full bg-amber-600'
              style={{
                width: `${mockAdherenceData.weekly.percentage}%`,
              }}
              />
            </div>

            <p className='text-sm text-gray-600'>
              {mockAdherenceData.weekly.completed} /{" "}
              {mockAdherenceData.weekly.total} sessions completed this week 
            </p>
          </div>
        </div>

        <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-48'>
          <h4 className='font-bold text-[#0B1E33] mb-4'>AI Companion</h4>
          <div className='h-full flex items-center justify-center text-gray-400 bg-gray-50 
          rounded-xl border border-dashed border-gray-200'>
            Chat Bot Loading....
          </div>
        </div>

        <div className='bg-white p-6 rounded-2xl shadow-sm border-gray-100'>
          <div className='flex items-center justify-between mb-6'>
          <h4 className='text-lg font-semibold text-[#0B1E33] mb-6'>
            Quick Stats
          </h4>

          <button className='flex items-center gap-2 text-teal-500 font-medium hover:text-teal-600 transition'>
                 View Deyails →
            </button>
          </div>
          
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
            <div className='rounded-x1 p-5 border border-green-200 bg-gradient-to-br from-green-50 to-white'>
              <div className='flex items-center gap-2 text-green-600 mb-2'>
                <span>📈</span>
                <p className='text-sm font-medium'>Grip Strength</p>
              </div>
              <p className='text-2xl font-bold text-green-700'>
                +15% <span className='text-sm'>↗</span>
              </p>
            </div>

            <div className='rounded-xl p-5 border border-teal-200 bg-gradient-to-br from-teal-50 to-white'>
              <div className='flex items-center gap-2 text-teal-600 mb-2'>
              <span>🧠</span>
              <p className='text-sm font-medium'>Meomory Sucess</p>
              </div>
              <p className='text-2xl font-bold text-teal-700'>85%</p>
            </div>

            <div className='rounded-xl p-5 border border-teal-200 bg-gradient-to-br from-teal-50 to-white'>
              <div className='flex items-center gap-2 text-teal-600 mb-2'>
              <span>📊</span>
              <p className='text-sm font-medium'>Journey</p>
              </div>
              <p className='text-2xl font-bold text-teal-700'>40%</p>
            </div>
          </div>
        </div>

        {/* Hardware Status and Input Confirmation */}
        <div className='bg-white rounded-2xl shadow-sm border-gray-100 p-6'>
            <h4 className='text-lg font-semibold text-[#0B1E33] mb-6'>
              Hardware Status & Input Confirmation
            </h4> 

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
            <div className='rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-6'>
                <div className='flex items-center justify-between mb-4'>
                <h5 className='font-semibold text-[#0B1E33]'>Device Status</h5>

                <span className='flex items-center gap-2 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full'>
                  Connected
                </span>
                </div>

                <div className='flex items-center gap-4 mb-6'>
                  <div className='w-14 h-14 rounded-full bg-teal-100 items-center justify-center text-teal-600 text-xl'>
                    📶
                  </div>

                  <div>
                    <p className='text-sm text-gray-500'>Device ID</p>
                    <p className='text-lg font-semibold text-[#0B1E33]'>R-103</p>
                  </div>
                </div>
                
            </div>

            {/* Input Device Card */}  
            <div className='rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-6'>
              <h5 className='font-semibold text-[#0B1E33] mb-4'>
                Input Device Confirmed
              </h5>

              <div className='flex items-center gap-4 mb-4'>
                <div className='w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-xl'>
                  🫧
                </div>

                <div>
                  <p className='font-semibold text-[#0B1E33]'>
                    BP Bulb Pressure Sensor
                  </p>

                  <p className='text-sm text-gray-500'>
                    Rubber inflation bulb with tube 
                  </p>

                </div>
              </div>

              <p className='flex items-center gap-2 text-green-600 font-medium text-sm'>
                System Ready
              </p>

            </div>
          </div>
          
        </div>

      </main>
    </div>
  );
}