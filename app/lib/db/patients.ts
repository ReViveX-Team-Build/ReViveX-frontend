import { db } from "../firebase";
import {
  collection, query, where, getDocs,
  doc, getDoc, updateDoc,
} from "firebase/firestore";
import { PatientData } from "./types";
import { getLastSessionPerPatient, getCohortSessionsThisWeek } from "./sessions";

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