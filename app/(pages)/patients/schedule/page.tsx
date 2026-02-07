"use client";

export default function SchedulePage() {

  const sessions = [
  {
    date: "Sunday, Nov 17, 2025",
    time: "10:30 AM",
    hand: "Right Hand",
    status: "upcoming",
  },
  {
    date: "Monday, Nov 18, 2025",
    time: "10:30 AM",
    hand: "Right Hand",
    status: "upcoming",
  },
  {
    date: "Tuesday, Nov 19, 2025",
    time: "10:30 AM",
    hand: "Right Hand",
    status: "upcoming",
  },
  {
    date: "Friday, Nov 15, 2025",
    time: "10:30 AM",
    hand: "Right Hand",
    status: "completed",
  },
  {
    date: "Monday, Nov 11, 2025",
    time: "10:30 AM",
    hand: "Right Hand",
    status: "missed",
  },
];
  const upcomingSessions = sessions.filter((s) => s.status === "upcoming");

  const pastSessions = sessions.filter((s) => s.status !== "upcoming");

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-800">
        My Schedule
      </h1>
      <p className="text-slate-500 mt-1">
        View your upcoming and past therapy sessions
      </p>
    </div>
  );
  <div className="mt-8 bg-white rounded-xl shadow p-6">
  <h2 className="font-semibold text-slate-700 mb-4">
    Upcoming Sessions
  </h2>

  <div className="space-y-4">
    {upcomingSessions.map((session, index) => (
      <div
        key={index}
        className="flex justify-between items-center border rounded-lg p-4 bg-teal-50"
      >
        <div>
          <p className="font-medium text-slate-800">
            {session.date}
          </p>
          <p className="text-sm text-slate-500">
            ⏰ {session.time} • ✋ {session.hand}
          </p>
        </div>

        <span className="text-sm bg-teal-400 text-white px-3 py-1 rounded-full">
          Scheduled
        </span>
      </div>
    ))}
  </div>
</div>

  
}
