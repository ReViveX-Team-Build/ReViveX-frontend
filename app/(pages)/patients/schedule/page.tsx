'use client';

import { useState } from "react";

type Session = {
  id: number;
  date: string;
  time: string;
  type: string;
  status: "Upcoming" | "Completed" | "Missed";
};

export default function PatientSchedulePage() {
  const [sessions] = useState<Session[]>([
    {
      id: 1,
      date: "2026-03-05",
      time: "09:00 AM",
      type: "Grip Strength Training",
      status: "Upcoming",
    },
    {
      id: 2,
      date: "2026-03-03",
      time: "10:30 AM",
      type: "Cognitive Memory Exercise",
      status: "Completed",
    },
    {
      id: 3,
      date: "2026-02-28",
      time: "08:45 AM",
      type: "Grip Strength Training",
      status: "Missed",
    },
  ]);

  const upcomingSessions = sessions.filter((s) => s.status === "Upcoming");
  const pastSessions = sessions.filter((s) => s.status !== "Upcoming");

  return (
    <div className="p-8 max-w-6xl">

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#0B1E33]">
          My Schedule
        </h1>
        <p className="text-gray-500 mt-1">
          View upcoming sessions and track your therapy schedule
        </p>
      </header>

      <div className="space-y-8">

        {/* Next Session */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-[#0B1E33] mb-4">
            Next Session
          </h2>

          {upcomingSessions.length > 0 ? (
            <div className="flex justify-between items-center border border-gray-200 rounded-xl p-4">
              <div>
                <p className="font-semibold text-gray-800">
                  {upcomingSessions[0].type}
                </p>
                <p className="text-sm text-gray-500">
                  {upcomingSessions[0].date} at {upcomingSessions[0].time}
                </p>
              </div>

              <button className="bg-teal-600 hover:bg-teal-500 text-white px-5 py-2 rounded-xl font-semibold transition">
                Start Session
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              No upcoming sessions scheduled.
            </p>
          )}
        </section>

        {/* Upcoming Sessions */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-[#0B1E33] mb-4">
            Upcoming Sessions
          </h2>

          <div className="space-y-4">
            {upcomingSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}

            {upcomingSessions.length === 0 && (
              <p className="text-sm text-gray-500">
                No upcoming sessions.
              </p>
            )}
          </div>
        </section>

        {/* Session History */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-[#0B1E33] mb-4">
            Session History
          </h2>

          <div className="space-y-4">
            {pastSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}

            {pastSessions.length === 0 && (
              <p className="text-sm text-gray-500">
                No session history available.
              </p>
            )}
          </div>
        </section>

        {/* Reminders */}
        <section className="bg-[#F7F9FC] rounded-2xl p-6 border border-gray-200">
          <h2 className="font-bold text-[#0B1E33] mb-4">
            Reminders
          </h2>

          <p className="text-sm text-gray-600 mb-4">
            Make sure notifications are enabled so you never miss a session.
          </p>

          <button className="px-5 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 transition">
            Manage Reminder Settings
          </button>
        </section>

      </div>
    </div>
  );
}

function SessionCard({ session }: { session: Session }) {
  const statusColor =
    session.status === "Completed"
      ? "bg-green-100 text-green-600"
      : session.status === "Missed"
      ? "bg-red-100 text-red-600"
      : "bg-yellow-100 text-yellow-600";

  return (
    <div className="flex justify-between items-center border border-gray-200 rounded-xl p-4">
      <div>
        <p className="font-semibold text-gray-800">
          {session.type}
        </p>
        <p className="text-sm text-gray-500">
          {session.date} at {session.time}
        </p>
      </div>

      <span className={`px-3 py-1 text-xs rounded-full ${statusColor}`}>
        {session.status}
      </span>
    </div>
  );
}