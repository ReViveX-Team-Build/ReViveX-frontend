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

// ─────────────────────────────────────────────────────────────
// AGGREGATED METRICS FOR DOCTOR REPORTS
// ─────────────────────────────────────────────────────────────

export interface DoctorReportMetrics {
  // Adherence metrics (from existing function)
  adherenceRate: number;
  completedSessions: number;
  missedSessions: number;
  scheduledSessions: number;
  sessionsThisWeek: number;
  
  // Performance metrics (from game sessions)
  averagePeakGripStrength: number;      // N
  averageSustainedForce: number;        // N
  averageTremorFrequency: number;       // Hz
  averageReactionTime: number;          // ms
  averageCognitiveAccuracy: number;     // %
  averageMotorPrecision: number;        // %
  
  // Session analytics
  totalSessionDuration: number;         // minutes
  averageSessionDuration: number;       // minutes
  sessionsLast7Days: number;
  sessionsLast30Days: number;
  
  // Trends (percentage change from previous period)
  gripStrengthTrend: number;            // % change
  reactionTimeTrend: number;            // % change
  cognitiveAccuracyTrend: number;       // % change
}

export async function getDoctorReportMetrics(
  doctorId: string,
): Promise<DoctorReportMetrics> {
  // Get adherence summary
  const adherenceSummary = await getDoctorAdherenceSummary(doctorId);
  
  // Get all patients for this doctor
  const patientsRef = collection(db, "patients");
  const patientsQuery = query(
    patientsRef,
    where("assignedDoctorId", "==", doctorId)
  );
  const patientsSnapshot = await getDocs(patientsQuery);
  const patientIds = patientsSnapshot.docs.map(doc => doc.id);
  
  if (patientIds.length === 0) {
    // No patients, return zeros
    return {
      ...adherenceSummary,
      averagePeakGripStrength: 0,
      averageSustainedForce: 0,
      averageTremorFrequency: 0,
      averageReactionTime: 0,
      averageCognitiveAccuracy: 0,
      averageMotorPrecision: 0,
      totalSessionDuration: 0,
      averageSessionDuration: 0,
      sessionsLast7Days: 0,
      sessionsLast30Days: 0,
      gripStrengthTrend: 0,
      reactionTimeTrend: 0,
      cognitiveAccuracyTrend: 0,
    };
  }
  
  // Get game sessions for all patients
  const sessionsRef = collection(db, "game_sessions");
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  // Query all sessions for all patients in last 60 days
  const allSessions: any[] = [];
  for (const patientId of patientIds) {
    const q = query(
      sessionsRef,
      where("userId", "==", patientId),
      where("timestamp", ">=", Timestamp.fromDate(sixtyDaysAgo)),
      orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(q);
    allSessions.push(...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }
  
  if (allSessions.length === 0) {
    return {
      ...adherenceSummary,
      averagePeakGripStrength: 0,
      averageSustainedForce: 0,
      averageTremorFrequency: 0,
      averageReactionTime: 0,
      averageCognitiveAccuracy: 0,
      averageMotorPrecision: 0,
      totalSessionDuration: 0,
      averageSessionDuration: 0,
      sessionsLast7Days: 0,
      sessionsLast30Days: 0,
      gripStrengthTrend: 0,
      reactionTimeTrend: 0,
      cognitiveAccuracyTrend: 0,
    };
  }
  
  // Filter sessions by time periods
  const last30Days = allSessions.filter(s => 
    s.timestamp.toDate() >= thirtyDaysAgo
  );
  const last7Days = allSessions.filter(s => 
    s.timestamp.toDate() >= sevenDaysAgo
  );
  const previous30Days = allSessions.filter(s => 
    s.timestamp.toDate() >= sixtyDaysAgo && 
    s.timestamp.toDate() < thirtyDaysAgo
  );
  
  // Calculate current period metrics (last 30 days)
  const current = calculatePeriodMetrics(last30Days);
  
  // Calculate previous period metrics (30-60 days ago)
  const previous = calculatePeriodMetrics(previous30Days);
  
  // Calculate trends
  const gripStrengthTrend = calculateTrend(
    previous.avgPeakGrip,
    current.avgPeakGrip
  );
  const reactionTimeTrend = calculateTrend(
    previous.avgReactionTime,
    current.avgReactionTime
  );
  const cognitiveAccuracyTrend = calculateTrend(
    previous.avgCognitiveAccuracy,
    current.avgCognitiveAccuracy
  );
  
  return {
    ...adherenceSummary,
    averagePeakGripStrength: current.avgPeakGrip,
    averageSustainedForce: current.avgSustainedForce,
    averageTremorFrequency: current.avgTremorFreq,
    averageReactionTime: current.avgReactionTime,
    averageCognitiveAccuracy: current.avgCognitiveAccuracy,
    averageMotorPrecision: current.avgMotorPrecision,
    totalSessionDuration: current.totalDuration,
    averageSessionDuration: current.avgDuration,
    sessionsLast7Days: last7Days.length,
    sessionsLast30Days: last30Days.length,
    gripStrengthTrend,
    reactionTimeTrend,
    cognitiveAccuracyTrend,
  };
}

// Helper function to calculate metrics for a period
function calculatePeriodMetrics(sessions: any[]) {
  if (sessions.length === 0) {
    return {
      avgPeakGrip: 0,
      avgSustainedForce: 0,
      avgTremorFreq: 0,
      avgReactionTime: 0,
      avgCognitiveAccuracy: 0,
      avgMotorPrecision: 0,
      totalDuration: 0,
      avgDuration: 0,
    };
  }
  
  let totalPeakGrip = 0;
  let totalSustainedForce = 0;
  let totalTremorFreq = 0;
  let totalReactionTime = 0;
  let totalCognitiveAccuracy = 0;
  let totalMotorPrecision = 0;
  let totalDuration = 0;
  
  let peakGripCount = 0;
  let sustainedForceCount = 0;
  let tremorFreqCount = 0;
  let reactionTimeCount = 0;
  let cognitiveAccuracyCount = 0;
  let motorPrecisionCount = 0;
  
  for (const session of sessions) {
    const metrics = session.metrics || {};
    
    if (metrics.peakGripForce !== undefined) {
      totalPeakGrip += metrics.peakGripForce;
      peakGripCount++;
    }
    
    // Sustained force approximated from muscle endurance
    if (metrics.muscleEnduranceDropPercent !== undefined) {
      const sustainedForce = metrics.peakGripForce * 
        (1 - metrics.muscleEnduranceDropPercent / 100);
      totalSustainedForce += sustainedForce;
      sustainedForceCount++;
    }
    
    // Tremor frequency from tremor amplitude
    if (metrics.tremorAmplitude !== undefined) {
      totalTremorFreq += metrics.tremorAmplitude;
      tremorFreqCount++;
    }
    
    if (metrics.reactionTimeMs !== undefined) {
      totalReactionTime += metrics.reactionTimeMs;
      reactionTimeCount++;
    }
    
    if (metrics.cognitiveAccuracyPercent !== undefined) {
      totalCognitiveAccuracy += metrics.cognitiveAccuracyPercent;
      cognitiveAccuracyCount++;
    }
    
    // Motor precision from drift distance (inverse relationship)
    if (metrics.driftDistance !== undefined) {
      const precision = Math.max(0, 100 - metrics.driftDistance * 10);
      totalMotorPrecision += precision;
      motorPrecisionCount++;
    }
    
    totalDuration += session.durationSeconds || 0;
  }
  
  return {
    avgPeakGrip: peakGripCount > 0 ? totalPeakGrip / peakGripCount : 0,
    avgSustainedForce: sustainedForceCount > 0 ? totalSustainedForce / sustainedForceCount : 0,
    avgTremorFreq: tremorFreqCount > 0 ? totalTremorFreq / tremorFreqCount : 0,
    avgReactionTime: reactionTimeCount > 0 ? totalReactionTime / reactionTimeCount : 0,
    avgCognitiveAccuracy: cognitiveAccuracyCount > 0 ? totalCognitiveAccuracy / cognitiveAccuracyCount : 0,
    avgMotorPrecision: motorPrecisionCount > 0 ? totalMotorPrecision / motorPrecisionCount : 0,
    totalDuration: totalDuration / 60, // Convert to minutes
    avgDuration: sessions.length > 0 ? (totalDuration / 60) / sessions.length : 0,
  };
}

// Helper function to calculate trend percentage
function calculateTrend(previousValue: number, currentValue: number): number {
  if (previousValue === 0) return 0;
  return Math.round(((currentValue - previousValue) / previousValue) * 100);
}