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

  
}
