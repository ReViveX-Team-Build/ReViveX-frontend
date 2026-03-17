"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/lib/firebase";
import {
  checkUpcomingRemindersForPatient,
  getPatientSchedule,
  markMissedSessionsForPatient,
} from "@/app/lib/db/schedule";
import { GameId, ScheduledSession } from "@/app/lib/db/types";

const gameLabels: Record<GameId, string> = {
  synapse_racer: "Synapse Racer",
  rhythm_reef: "Rhythm Reef",
  grip_surge: "Grip Surge",
  precision_hold: "Precision Hold",
  stability_core: "Stability Core",
};

export default function SchedulePage() {
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (authLoading) return;
      if (!user) {
        setLoading(false);
        setError("Please sign in to view your schedule.");
        return;
      }

      try {
        setError(null);
        await markMissedSessionsForPatient(user.uid);
        await checkUpcomingRemindersForPatient(user.uid).catch((e) => {
          console.warn("Reminder check skipped:", e);
        });
        const data = await getPatientSchedule(user.uid);
        setSessions(data);
      } catch (e) {
        console.error("Failed to load patient schedule:", e);
        setError("Could not load sessions. Please retry.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user, authLoading]);

  const upcomingSessions = useMemo(
    () => sessions.filter((s) => s.status === "scheduled"),
    [sessions],
  );

  const completedSessions = useMemo(
    () => sessions.filter((s) => s.status === "completed"),
    [sessions],
  );

  const missedSessions = useMemo(
    () => sessions.filter((s) => s.status === "missed"),
    [sessions],
  );

  const formatDate = (isoDate: string) => {
    const d = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">My Schedule</h1>
        <p className="text-slate-500 mt-1">
          View your upcoming and past therapy sessions
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5" />
          <div>
            <p className="text-red-800 font-semibold">Error Loading Schedule</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold text-slate-700 mb-4">Upcoming Sessions</h2>

        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-slate-500">Loading sessions...</p>
          ) : upcomingSessions.length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming sessions.</p>
          ) : (
            upcomingSessions.map((session) => (
              <div
                key={session.id}
                className="flex justify-between items-center border rounded-lg p-4 bg-teal-50">
                <div>
                  <p className="font-medium text-slate-800">
                    {formatDate(session.scheduledDate)}
                  </p>
                  <p className="text-sm text-slate-500">
                    ⏰ {session.scheduledTime} • 🎮 {gameLabels[session.gameId]}{" "}
                    • L{session.level}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm bg-teal-400 text-white px-3 py-1 rounded-full">
                    Scheduled
                  </span>
                  <button
                    onClick={() =>
                      router.push(
                        `/games/${session.gameId}?sessionId=${session.id}&gameId=${session.gameId}`,
                      )
                    }
                    className="text-sm bg-[#0B1E33] hover:bg-[#0d2640] text-white px-3 py-1 rounded-full transition">
                    Start Session
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6">
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-400 text-lg font-medium">No upcoming sessions</p>
              <p className="text-slate-400 text-sm mt-2">
                Your doctor will schedule therapy sessions for you
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="group relative bg-gradient-to-r from-teal-50 to-white border border-teal-100 rounded-xl p-5 hover:shadow-lg hover:border-teal-300 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-400/0 to-teal-400/0 group-hover:from-teal-400/5 group-hover:to-teal-400/10 rounded-xl transition-all duration-300" />
                  
                  <div className="relative flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{gameIcons[session.gameId]}</span>
                        <div>
                          <h3 className="text-lg font-bold text-[#0B1E33]">
                            {gameLabels[session.gameId]}
                          </h3>
                          <p className="text-sm text-slate-500">
                            Level {session.level} • {session.durationMinutes} minutes
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar size={16} className="text-teal-500" />
                          <span className="font-medium">{formatDate(session.scheduledDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock size={16} className="text-teal-500" />
                          <span className="font-medium">{formatTime(session.scheduledTime)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      <span className="bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-sm font-semibold">
                        Scheduled
                      </span>
                      <button
                        onClick={() =>
                          router.push(
                            `/games/${session.gameId}?sessionId=${session.id}&gameId=${session.gameId}`
                          )
                        }
                        className="bg-gradient-to-r from-[#0B1E33] to-[#0d2640] hover:from-[#0d2640] hover:to-[#0B1E33] text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                      >
                        <Play size={18} fill="white" />
                        Start Session
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Past Sessions */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold text-slate-700 mb-4">Past Sessions</h2>

        <div className="space-y-4">
          {loading
            ? null
            : [...completedSessions, ...missedSessions].map((session) => (
                <div
                  key={session.id}
                  className="flex justify-between items-center border rounded-lg p-4 bg-slate-50">
                  <div className="flex items-start gap-3">
                    <span>{session.status === "completed" ? "✅" : "⭕"}</span>
                    <div>
                      <p className="font-medium text-slate-800">
                        {formatDate(session.scheduledDate)}
                      </p>
                      <p className="text-sm text-slate-500">
                        ⏰ {session.scheduledTime} • 🎮{" "}
                        {gameLabels[session.gameId]} • L{session.level}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      session.status === "completed"
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 text-gray-700"
                    }`}>
                    {session.status === "completed" ? "Completed" : "Missed"}
                  </span>
                </div>
              ))}
          {!loading &&
            completedSessions.length === 0 &&
            missedSessions.length === 0 && (
              <p className="text-sm text-slate-500">
                No completed or missed sessions yet.
              </p>
            )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}
