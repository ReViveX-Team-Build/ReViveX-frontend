"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/lib/firebase";
import { getPatientsByDoctor } from "@/app/lib/db/users";
import {
  checkUpcomingRemindersForDoctor,
  createScheduledSession,
  deleteScheduledSession,
  getDoctorSchedule,
  markMissedSessionsForDoctor,
  updateSessionStatus,
} from "@/app/lib/db/schedule";
import { GameId, PatientData, ScheduledSession } from "@/app/lib/db/types";

type NewSessionForm = {
  patientId: string;
  gameId: GameId;
  level: number;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
};

const initialForm: NewSessionForm = {
  patientId: "",
  gameId: "synapse_racer",
  level: 1,
  scheduledDate: "",
  scheduledTime: "10:30",
  durationMinutes: 30,
};

const gameLabels: Record<GameId, string> = {
  synapse_racer: "Synapse Racer",
  rhythm_reef: "Rhythm Reef",
  grip_surge: "Grip Surge",
  precision_hold: "Precision Hold",
  stability_core: "Stability Core",
};

export default function SchedulePage() {
  const [user, authLoading] = useAuthState(auth);
  const [selectedDate, setSelectedDate] = useState("2026-03-01");
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [form, setForm] = useState<NewSessionForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actioningSessionId, setActioningSessionId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const selectedDateSessions = useMemo(
    () => sessions.filter((s) => s.scheduledDate === selectedDate),
    [sessions, selectedDate],
  );

  const patientById = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of patients) m.set(p.uid, p.name);
    return m;
  }, [patients]);

  const refreshData = async (doctorUid: string) => {
    setLoading(true);
    setError(null);
    try {
      await markMissedSessionsForDoctor(doctorUid);
      await checkUpcomingRemindersForDoctor(doctorUid).catch((e) => {
        console.warn("Reminder check skipped:", e);
      });
      const [doctorPatients, doctorSchedule] = await Promise.all([
        getPatientsByDoctor(doctorUid),
        getDoctorSchedule(doctorUid),
      ]);
      setPatients(doctorPatients);
      setSessions(doctorSchedule);

      if (!form.patientId && doctorPatients.length > 0) {
        setForm((prev) => ({ ...prev, patientId: doctorPatients[0].uid }));
      }
    } catch (e) {
      console.error("Failed to load schedule data:", e);
      setError("Could not load schedule data. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setError("Please sign in to view your schedule.");
      return;
    }

    void refreshData(user.uid);
  }, [user, authLoading]);

  const handleCreate = async () => {
    if (!user) return;
    if (!form.patientId || !form.scheduledDate || !form.scheduledTime) {
      setError("Patient, date, and time are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createScheduledSession({
        doctorId: user.uid,
        patientId: form.patientId,
        gameId: form.gameId,
        level: form.level,
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime,
        durationMinutes: form.durationMinutes,
      });

      setSelectedDate(form.scheduledDate);
      setForm((prev) => ({
        ...prev,
        scheduledTime: "10:30",
        durationMinutes: 30,
      }));
      await refreshData(user.uid);
    } catch (e) {
      console.error("Failed to create schedule:", e);
      setError("Could not create session. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (sessionId?: string) => {
    if (!user || !sessionId) return;
    setActioningSessionId(sessionId);
    setError(null);
    try {
      await updateSessionStatus(sessionId, "cancelled");
      await refreshData(user.uid);
    } catch (e) {
      console.error("Failed to cancel session:", e);
      setError("Could not cancel session. Please try again.");
    } finally {
      setActioningSessionId(null);
    }
  };

  const handleDelete = async (sessionId?: string) => {
    if (!user || !sessionId) return;
    setActioningSessionId(sessionId);
    setError(null);
    try {
      await deleteScheduledSession(sessionId);
      await refreshData(user.uid);
    } catch (e) {
      console.error("Failed to delete session:", e);
      setError("Could not delete session. Please try again.");
    } finally {
      setActioningSessionId(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#0B1E33] dark:text-slate-100">
          Scheduling
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">
          Manage patient sessions and reminders
        </p>
      </header>

      <div className="space-y-8">
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-[#0B1E33] dark:text-slate-100 mb-4">
            Select Date
          </h2>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />

          <p className="text-xs text-gray-500 dark:text-slate-400 mt-3">
            Viewing sessions for {selectedDate}
          </p>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-[#0B1E33] dark:text-slate-100 mb-4">
            Scheduled Sessions
          </h2>

          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Loading sessions...
              </p>
            ) : selectedDateSessions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-slate-400">
                No sessions scheduled for this date.
              </p>
            ) : (
              selectedDateSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  sessionId={session.id}
                  patient={
                    patientById.get(session.patientId) ?? session.patientId
                  }
                  time={session.scheduledTime}
                  type={`${gameLabels[session.gameId]} · Level ${session.level}`}
                  status={session.status}
                  onCancel={handleCancel}
                  onDelete={handleDelete}
                  disabled={actioningSessionId === session.id}
                />
              ))
            )}
          </div>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-[#0B1E33] dark:text-slate-100 mb-4">
            Schedule New Session
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                Patient
              </p>
              <select
                value={form.patientId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, patientId: e.target.value }))
                }
                className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500">
                {patients.length === 0 ? (
                  <option value="">No patients linked</option>
                ) : (
                  patients.map((patient) => (
                    <option key={patient.uid} value={patient.uid}>
                      {patient.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                Game
              </p>
              <select
                value={form.gameId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    gameId: e.target.value as GameId,
                  }))
                }
                className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500">
                {(Object.keys(gameLabels) as GameId[]).map((gameId) => (
                  <option key={gameId} value={gameId}>
                    {gameLabels[gameId]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                Date
              </p>
              <input
                type="date"
                value={form.scheduledDate}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    scheduledDate: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                Time
              </p>
              <input
                type="time"
                value={form.scheduledTime}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    scheduledTime: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                Level
              </p>
              <input
                type="number"
                min={1}
                max={10}
                value={form.level}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    level: Number(e.target.value) || 1,
                  }))
                }
                className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                Duration (mins)
              </p>
              <input
                type="number"
                min={5}
                max={180}
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    durationMinutes: Number(e.target.value) || 30,
                  }))
                }
                className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={submitting || loading || !user || patients.length === 0}
            className="mt-6 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-400 text-white px-6 py-2 rounded-xl font-semibold transition">
            {submitting ? "Creating..." : "Create Session"}
          </button>

          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        </section>

        <section className="bg-[#F7F9FC] dark:bg-slate-800/50 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
          <h2 className="font-bold text-[#0B1E33] dark:text-slate-100 mb-4">
            Automated Reminders
          </h2>

          <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
            Patients will receive notifications before scheduled sessions.
          </p>

          <button className="px-5 py-2 rounded-xl border border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-slate-200 transition">
            Configure Reminder Timing
          </button>
        </section>
      </div>
    </div>
  );
}

function SessionCard({
  sessionId,
  patient,
  time,
  type,
  status,
  onCancel,
  onDelete,
  disabled,
}: {
  sessionId?: string;
  patient: string;
  time: string;
  type: string;
  status: ScheduledSession["status"];
  onCancel: (sessionId?: string) => void;
  onDelete: (sessionId?: string) => void;
  disabled: boolean;
}) {
  const statusStyles: Record<ScheduledSession["status"], string> = {
    scheduled:
      "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    completed:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    missed: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    cancelled:
      "bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300",
  };

  return (
    <div className="flex justify-between items-center border border-gray-200 dark:border-slate-700 dark:bg-slate-700/30 rounded-xl p-4">
      <div>
        <p className="font-semibold text-gray-800 dark:text-slate-100">
          {patient}
        </p>
        <p className="text-sm text-gray-500 dark:text-slate-400">{type}</p>
        <p className="text-sm text-gray-500 dark:text-slate-400">{time}</p>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`px-3 py-1 text-xs rounded-full capitalize ${statusStyles[status]}`}>
          {status}
        </span>
        {status === "scheduled" && (
          <button
            onClick={() => onCancel(sessionId)}
            disabled={disabled}
            className="px-3 py-1 text-xs rounded-full border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-60 transition">
            Cancel
          </button>
        )}
        <button
          onClick={() => onDelete(sessionId)}
          disabled={disabled}
          className="px-3 py-1 text-xs rounded-full border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-60 transition">
          Delete
        </button>
      </div>
    </div>
  );
}
