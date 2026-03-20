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
    <div className="p-10 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          My Schedule
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          View your upcoming and past therapy sessions
        </p>
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-6 border border-transparent dark:border-slate-700">
        <h2 className="font-semibold text-slate-700 dark:text-slate-100 mb-4">
          Upcoming Sessions
        </h2>

        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Loading sessions...
            </p>
          ) : upcomingSessions.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No upcoming sessions.
            </p>
          ) : (
            upcomingSessions.map((session) => (
              <div
                key={session.id}
                className="flex justify-between items-center border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-teal-50 dark:bg-teal-900/20">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    {formatDate(session.scheduledDate)}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
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
      </div>

      {/* Past Sessions */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-6 border border-transparent dark:border-slate-700">
        <h2 className="font-semibold text-slate-700 dark:text-slate-100 mb-4">
          Past Sessions
        </h2>

        <div className="space-y-4">
          {loading
            ? null
            : [...completedSessions, ...missedSessions].map((session) => (
                <div
                  key={session.id}
                  className="flex justify-between items-center border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-start gap-3">
                    <span>{session.status === "completed" ? "✅" : "⭕"}</span>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">
                        {formatDate(session.scheduledDate)}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
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
      </div>
    </div>
  );
}
