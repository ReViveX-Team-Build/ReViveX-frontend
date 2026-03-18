"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/app/lib/firebase";
import {
  checkUpcomingRemindersForPatient,
  markMissedSessionsForPatient,
} from "@/app/lib/db/schedule";
import { GameId, ScheduledSession } from "@/app/lib/db/types";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Unsubscribe 
} from "firebase/firestore";
import { 
  Calendar, 
  Clock, 
  Loader2, 
  Play, 
  Gamepad2,
  TrendingUp,
  AlertCircle
} from "lucide-react";

const gameLabels: Record<GameId, string> = {
  synapse_racer: "Synapse Racer",
  rhythm_reef: "Rhythm Reef",
  grip_surge: "Grip Surge",
  precision_hold: "Precision Hold",
  stability_core: "Stability Core",
};

const gameIcons: Record<GameId, string> = {
  synapse_racer: "🌊",
  rhythm_reef: "🐠",
  grip_surge: "💪",
  precision_hold: "🎯",
  stability_core: "⚖️",
};

export default function PatientSchedulePage() {
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);

  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time Firestore listener
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setLoading(false);
      router.push("/auth/patient/signin");
      return;
    }

    let unsubscribe: Unsubscribe;

    const setupRealtimeListener = async () => {
      try {
        setError(null);
        
        // Auto-mark missed sessions on load
        await markMissedSessionsForPatient(user.uid);
        
        // Check for upcoming reminders (fire-and-forget)
        checkUpcomingRemindersForPatient(user.uid).catch((e: unknown) => {
          console.warn("Reminder check skipped:", e);
        });

        // Set up real-time listener
        const q = query(
          collection(db, "scheduled_sessions"),
          where("patientId", "==", user.uid),
          orderBy("scheduledDate", "asc")
        );

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const sessionData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as ScheduledSession[];

            setSessions(sessionData);
            setLoading(false);
          },
          (err) => {
            console.error("Firestore listener error:", err);
            setError("Failed to load sessions in real-time.");
            setLoading(false);
          }
        );
      } catch (e) {
        console.error("Failed to set up schedule listener:", e);
        setError("Could not load sessions. Please retry.");
        setLoading(false);
      }
    };

    setupRealtimeListener();

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, authLoading, router]);

  // Filter sessions
  const now = new Date();
  const upcomingSessions = sessions
    .filter((s) => {
      if (s.status !== "scheduled") return false;
      const sessionDate = new Date(`${s.scheduledDate}T${s.scheduledTime}`);
      return sessionDate >= now;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime}`);
      const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
      return dateA.getTime() - dateB.getTime();
    });

  const completedSessions = sessions
    .filter((s) => s.status === "completed")
    .sort((a, b) => {
      const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime}`);
      const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
      return dateB.getTime() - dateA.getTime();
    });

  const missedSessions = sessions
    .filter((s) => s.status === "missed")
    .sort((a, b) => {
      const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime}`);
      const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
      return dateB.getTime() - dateA.getTime();
    });

  // Format date helper
  const formatDate = (isoDate: string) => {
    const d = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return isoDate;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionDate = new Date(d);
    sessionDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((sessionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-teal-500 animate-spin" />
          <p className="text-slate-500">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1E33]">
            My Schedule
          </h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2">
            <Calendar size={16} />
            View your upcoming and past therapy sessions
          </p>
        </div>
        
        {upcomingSessions.length > 0 && (
          <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-4 py-2 rounded-xl border border-teal-200">
            <p className="text-sm text-teal-700 font-semibold">
              {upcomingSessions.length} upcoming session{upcomingSessions.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
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
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <TrendingUp size={24} className="text-white" />
            <h2 className="text-xl font-bold text-white">
              Upcoming Sessions
            </h2>
          </div>
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
      {(completedSessions.length > 0 || missedSessions.length > 0) && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-500 to-slate-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <Gamepad2 size={24} className="text-white" />
              <h2 className="text-xl font-bold text-white">
                Past Sessions
              </h2>
            </div>
          </div>

          <div className="p-6 space-y-3">
            {[...completedSessions, ...missedSessions].map((session) => (
              <div
                key={session.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:bg-slate-100 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl mt-1">
                      {session.status === "completed" ? "✅" : "⭕"}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-800">
                          {gameLabels[session.gameId]}
                        </h3>
                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                          Level {session.level}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(session.scheduledDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatTime(session.scheduledTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-semibold px-4 py-2 rounded-full ${
                      session.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {session.status === "completed" ? "Completed" : "Missed"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {sessions.length === 0 && !loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Calendar size={64} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">
            No Sessions Yet
          </h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Your therapy schedule is empty. Your doctor will create scheduled sessions for you to complete.
          </p>
        </div>
      )}
    </div>
  );
}