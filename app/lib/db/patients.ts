// lib/db/patients.ts
// Doctor-facing queries about the patient cohort.

import { db } from "../firebase";
import {
  collection, query, where, getDocs,
  doc, getDoc, updateDoc,
} from "firebase/firestore";
import { PatientData } from "./types";
import { getLastSessionPerPatient, getCohortSessionsThisWeek } from "./sessions";

// ─────────────────────────────────────────────────────────────────────────────
// Single patient
// ✅ Fixed: uses getDoc (direct doc lookup) instead of querying by field.
//    Patient docs use uid as the document ID so this is faster and cheaper.
// ─────────────────────────────────────────────────────────────────────────────

export async function getPatientById(uid: string): Promise<PatientData | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.role !== "patient") return null;
  return { uid: snap.id, ...data } as PatientData;
}

// Update XP and streak after a game session completes
export async function updateGamification(
  uid: string,
  xpEarned: number,
  newStreak: number
): Promise<void> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return;

  const current = snap.data().gamification?.totalXp ?? 0;
  await updateDoc(doc(db, "users", uid), {
    "gamification.totalXp": current + xpEarned,
    "gamification.currentStreak": newStreak,
  });
}

// Unlock a new level (called by doctor or auto after XP threshold)
export async function unlockLevel(uid: string, level: number): Promise<void> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return;

  const current: number[] = snap.data().gamification?.unlockedLevels ?? [];
  if (!current.includes(level)) {
    await updateDoc(doc(db, "users", uid), {
      "gamification.unlockedLevels": [...current, level],
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cohort stats — used by doctor dashboard + AI weekly summary
// ─────────────────────────────────────────────────────────────────────────────

export interface CohortStats {
  totalPatients: number;
  highAdherence: number;        // >80%
  mediumAdherence: number;      // 50–80%
  lowAdherence: number;         // <50%
  avgAdherencePercent: number;
  avgGripImprovement: number;
  missedSessionsTotal: number;
  devicesOffline: number;
  decliningPatients: {
    uid: string;
    name: string;
    adherencePercent: number;
    lastSessionDate: Date | null;
    condition: string;
  }[];
}

export async function getCohortStats(
  doctorId: string,
  prescribedSessionsPerWeek: number = 5
): Promise<CohortStats> {

  const patientsSnap = await getDocs(
    query(
      collection(db, "users"),
      where("role", "==", "patient"),
      where("assignedDoctorId", "==", doctorId)
    )
  );

  const patients = patientsSnap.docs.map(
    (d) => ({ uid: d.id, ...d.data() } as PatientData)
  );

  if (patients.length === 0) {
    return {
      totalPatients: 0, highAdherence: 0, mediumAdherence: 0,
      lowAdherence: 0, avgAdherencePercent: 0, avgGripImprovement: 0,
      missedSessionsTotal: 0, devicesOffline: 0, decliningPatients: [],
    };
  }

  const patientUids = patients.map((p) => p.uid);

  const [weekSessions, lastSessionMap] = await Promise.all([
    getCohortSessionsThisWeek(patientUids),
    getLastSessionPerPatient(patientUids),
  ]);

  const adherenceRates: number[] = [];
  const gripImprovements: number[] = [];
  let missedTotal = 0;
  const decliningPatients: CohortStats["decliningPatients"] = [];

  for (const patient of patients) {
    const patientSessions = weekSessions.filter((s) => s.userId === patient.uid);
    const completed = patientSessions.filter((s) => s.durationSeconds > 60).length;
    const adherence = Math.min(100, Math.round((completed / prescribedSessionsPerWeek) * 100));

    adherenceRates.push(adherence);
    missedTotal += Math.max(0, prescribedSessionsPerWeek - completed);

    // Grip improvement: first vs last session this week
    const withGrip = patientSessions
      .filter((s) => s.metrics?.peakGripForce != null)
      .sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);

    if (withGrip.length >= 2) {
      const first = withGrip[0].metrics.peakGripForce!;
      const last  = withGrip[withGrip.length - 1].metrics.peakGripForce!;
      if (first > 0) gripImprovements.push(((last - first) / first) * 100);
    }

    if (adherence < 70) {
      decliningPatients.push({
        uid: patient.uid,
        name: patient.name,
        adherencePercent: adherence,
        lastSessionDate: lastSessionMap.get(patient.uid) ?? null,
        condition: patient.condition,
      });
    }
  }

  decliningPatients.sort((a, b) => a.adherencePercent - b.adherencePercent);

  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  return {
    totalPatients: patients.length,
    highAdherence:   adherenceRates.filter((r) => r > 80).length,
    mediumAdherence: adherenceRates.filter((r) => r >= 50 && r <= 80).length,
    lowAdherence:    adherenceRates.filter((r) => r < 50).length,
    avgAdherencePercent: avg(adherenceRates),
    avgGripImprovement:  avg(gripImprovements),
    missedSessionsTotal: missedTotal,
    devicesOffline: patients.filter((p) => p.hardwareStatus?.status === "offline").length,
    decliningPatients: decliningPatients.slice(0, 5),
  };
}