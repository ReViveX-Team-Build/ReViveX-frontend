import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  limit,
} from "firebase/firestore";

import { db } from "../firebase";
import { ScheduledSession } from "./types";

// ─────────────────────────────────────────────────────────────
// COLLECTION
// ─────────────────────────────────────────────────────────────

const SCHEDULE_COLLECTION = "scheduled_sessions";
const COMMUNICATION_COLLECTION = "communications";
type ScheduleStatus = ScheduledSession["status"];

export interface AdherenceSummary {
  adherenceRate: number;
  completedSessions: number;
  missedSessions: number;
  scheduledSessions: number;
  sessionsThisWeek: number;
}

// ─────────────────────────────────────────────────────────────
// CREATE SESSION
// ─────────────────────────────────────────────────────────────

export async function createScheduledSession(
  session: Omit<ScheduledSession, "id" | "createdAt" | "status">,
): Promise<string> {
  const ref = collection(db, SCHEDULE_COLLECTION);

  const newSession: Omit<ScheduledSession, "id"> = {
    ...session,
    status: "scheduled",
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(ref, newSession);
  return docRef.id;
}

// ─────────────────────────────────────────────────────────────
// GET DOCTOR SCHEDULE
// ─────────────────────────────────────────────────────────────

export async function getDoctorSchedule(
  doctorId: string,
): Promise<ScheduledSession[]> {
  const ref = collection(db, SCHEDULE_COLLECTION);

  const q = query(
    ref,
    where("doctorId", "==", doctorId),
    orderBy("scheduledDate", "asc"),
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  })) as ScheduledSession[];
}

// ─────────────────────────────────────────────────────────────
// GET PATIENT SCHEDULE
// ─────────────────────────────────────────────────────────────

export async function getPatientSchedule(
  patientId: string,
): Promise<ScheduledSession[]> {
  const ref = collection(db, SCHEDULE_COLLECTION);

  const q = query(
    ref,
    where("patientId", "==", patientId),
    orderBy("scheduledDate", "asc"),
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  })) as ScheduledSession[];
}

// ─────────────────────────────────────────────────────────────
// ADHERENCE SUMMARY
// ─────────────────────────────────────────────────────────────

export async function getDoctorAdherenceSummary(
  doctorId: string,
): Promise<AdherenceSummary> {
  const sessions = await getDoctorSchedule(doctorId);
  return buildAdherenceSummary(sessions);
}

function buildAdherenceSummary(sessions: ScheduledSession[]): AdherenceSummary {
  const nonCancelled = sessions.filter((s) => s.status !== "cancelled");
  const completed = nonCancelled.filter((s) => s.status === "completed").length;
  const missed = nonCancelled.filter((s) => s.status === "missed").length;
  const scheduled = nonCancelled.filter((s) => s.status === "scheduled").length;

  const denom = completed + missed + scheduled;
  const adherenceRate = denom === 0 ? 0 : Math.round((completed / denom) * 100);

  const now = new Date();
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = day === 0 ? 6 : day - 1;
  startOfWeek.setDate(startOfWeek.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const sessionsThisWeek = nonCancelled.filter((s) => {
    const dt = new Date(`${s.scheduledDate}T${s.scheduledTime}`);
    return !Number.isNaN(dt.getTime()) && dt >= startOfWeek && dt < endOfWeek;
  }).length;

  return {
    adherenceRate,
    completedSessions: completed,
    missedSessions: missed,
    scheduledSessions: scheduled,
    sessionsThisWeek,
  };
}

// ─────────────────────────────────────────────────────────────
// UPDATE SESSION STATUS
// ─────────────────────────────────────────────────────────────

export async function updateSessionStatus(
  sessionId: string,
  status: ScheduleStatus,
): Promise<void> {
  const ref = doc(db, SCHEDULE_COLLECTION, sessionId);

  await updateDoc(ref, {
    status,
  });
}

// ─────────────────────────────────────────────────────────────
// AUTO MARK MISSED
// ─────────────────────────────────────────────────────────────

export async function markMissedSessionsForDoctor(
  doctorId: string,
): Promise<number> {
  const sessions = await getDoctorSchedule(doctorId);
  return markMissedSessions(sessions);
}

export async function markMissedSessionsForPatient(
  patientId: string,
): Promise<number> {
  const sessions = await getPatientSchedule(patientId);
  return markMissedSessions(sessions);
}

// ─────────────────────────────────────────────────────────────
// REMINDERS
// ─────────────────────────────────────────────────────────────

export async function checkUpcomingRemindersForPatient(
  patientId: string,
): Promise<number> {
  const sessions = await getPatientSchedule(patientId);
  return dispatchUpcomingReminders(sessions, patientId);
}

export async function checkUpcomingRemindersForDoctor(
  doctorId: string,
): Promise<number> {
  const sessions = await getDoctorSchedule(doctorId);
  return dispatchUpcomingReminders(sessions);
}

async function dispatchUpcomingReminders(
  sessions: ScheduledSession[],
  specificPatientId?: string,
): Promise<number> {
  const now = new Date();
  const horizonMs = 30 * 60 * 1000;
  let sentCount = 0;

  const alertQuery = specificPatientId
    ? query(
        collection(db, COMMUNICATION_COLLECTION),
        where("receiverId", "==", specificPatientId),
        where("type", "==", "session_alert"),
        orderBy("timestamp", "desc"),
        limit(100),
      )
    : query(
        collection(db, COMMUNICATION_COLLECTION),
        where("type", "==", "session_alert"),
        orderBy("timestamp", "desc"),
        limit(300),
      );

  const existingAlerts = await getDocs(alertQuery);
  const alertedSessionIds = new Set(
    existingAlerts.docs
      .map((d) => d.data()?.sessionId as string | undefined)
      .filter((v): v is string => Boolean(v)),
  );

  for (const session of sessions) {
    if (session.status !== "scheduled" || !session.id) continue;
    const at = new Date(`${session.scheduledDate}T${session.scheduledTime}`);
    if (Number.isNaN(at.getTime())) continue;

    const delta = at.getTime() - now.getTime();
    if (delta < 0 || delta > horizonMs) continue;
    if (alertedSessionIds.has(session.id)) continue;

    await addDoc(collection(db, COMMUNICATION_COLLECTION), {
      senderId: session.doctorId,
      receiverId: session.patientId,
      type: "session_alert",
      title: "Upcoming Therapy Session",
      content: `Your therapy session starts in 30 minutes at ${session.scheduledTime}.`,
      timestamp: Timestamp.now(),
      isRead: false,
      isImportant: true,
      sessionId: session.id,
    });

    sentCount += 1;
    alertedSessionIds.add(session.id);
  }

  return sentCount;
}

async function markMissedSessions(
  sessions: ScheduledSession[],
): Promise<number> {
  const now = new Date();
  let updated = 0;

  for (const session of sessions) {
    if (session.status !== "scheduled" || !session.id) continue;

    const sessionDateTime = new Date(
      `${session.scheduledDate}T${session.scheduledTime}`,
    );
    if (Number.isNaN(sessionDateTime.getTime())) continue;

    if (sessionDateTime < now) {
      await updateSessionStatus(session.id, "missed");
      updated += 1;
    }
  }

  return updated;
}

// ─────────────────────────────────────────────────────────────
// DELETE SESSION
// ─────────────────────────────────────────────────────────────

export async function deleteScheduledSession(sessionId: string): Promise<void> {
  const ref = doc(db, SCHEDULE_COLLECTION, sessionId);
  await deleteDoc(ref);
}
