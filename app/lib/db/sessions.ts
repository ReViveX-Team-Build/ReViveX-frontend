// lib/db/sessions.ts

import { db } from "../firebase";
import {
  collection, addDoc, query, where,
  orderBy, getDocs, limit, Timestamp,
} from "firebase/firestore";
import { GameSession } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// WRITE
// ─────────────────────────────────────────────────────────────────────────────

export const saveGameSession = async (
  sessionData: Omit<GameSession, "id">
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "game_sessions"), sessionData);
    return docRef.id;
  } catch (error) {
    console.error("Error saving session:", error);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// READ — single patient
// ─────────────────────────────────────────────────────────────────────────────

// Most-used: last N sessions for a patient, newest first
export async function getRecentSessions(
  uid: string,
  maxResults: number = 10
): Promise<GameSession[]> {
  const snap = await getDocs(
    query(
      collection(db, "game_sessions"),
      where("userId", "==", uid),
      orderBy("timestamp", "desc"),
      limit(maxResults)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GameSession));
}

// For the 30-day grip strength chart and bilateral analysis
export async function getSessionsByDateRange(
  uid: string,
  startDate: Date,
  endDate: Date
): Promise<GameSession[]> {
  const snap = await getDocs(
    query(
      collection(db, "game_sessions"),
      where("userId", "==", uid),
      where("timestamp", ">=", Timestamp.fromDate(startDate)),
      where("timestamp", "<=", Timestamp.fromDate(endDate)),
      orderBy("timestamp", "desc")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GameSession));
}

// For bilateral balance — returns left and right hand sessions separately
// Used by the progress page chart and the data processor
export async function getSessionsForBothHands(
  uid: string,
  maxResults: number = 30
): Promise<{ left: GameSession[]; right: GameSession[] }> {
  const [leftSnap, rightSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, "game_sessions"),
        where("userId", "==", uid),
        where("targetHand", "==", "left"),
        orderBy("timestamp", "desc"),
        limit(maxResults)
      )
    ),
    getDocs(
      query(
        collection(db, "game_sessions"),
        where("userId", "==", uid),
        where("targetHand", "==", "right"),
        orderBy("timestamp", "desc"),
        limit(maxResults)
      )
    ),
  ]);

  return {
    left:  leftSnap.docs.map((d) => ({ id: d.id, ...d.data() } as GameSession)),
    right: rightSnap.docs.map((d) => ({ id: d.id, ...d.data() } as GameSession)),
  };
}

// Last 30 days — convenience wrapper used by the progress page
export async function getLast30DaySessions(uid: string): Promise<GameSession[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return getSessionsByDateRange(uid, start, end);
}

// ─────────────────────────────────────────────────────────────────────────────
// READ — doctor / cohort level
// ─────────────────────────────────────────────────────────────────────────────

// All sessions for a list of patient UIDs within the last 7 days
// Used by doctor dashboard AI weekly summary
export async function getCohortSessionsThisWeek(
  patientUids: string[]
): Promise<GameSession[]> {
  if (patientUids.length === 0) return [];

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Firestore "in" operator supports max 30 items — batched accordingly
  const BATCH = 30;
  const batches: string[][] = [];
  for (let i = 0; i < patientUids.length; i += BATCH) {
    batches.push(patientUids.slice(i, i + BATCH));
  }

  const results = await Promise.all(
    batches.map((batch) =>
      getDocs(
        query(
          collection(db, "game_sessions"),
          where("userId", "in", batch),
          where("timestamp", ">=", Timestamp.fromDate(weekAgo)),
          orderBy("timestamp", "desc")
        )
      )
    )
  );

  return results.flatMap((snap) =>
    snap.docs.map((d) => ({ id: d.id, ...d.data() } as GameSession))
  );
}

// Per-patient last session date — used to detect who hasn't played recently
export async function getLastSessionPerPatient(
  patientUids: string[]
): Promise<Map<string, Date>> {
  const map = new Map<string, Date>();
  if (patientUids.length === 0) return map;

  await Promise.all(
    patientUids.map(async (uid) => {
      const snap = await getDocs(
        query(
          collection(db, "game_sessions"),
          where("userId", "==", uid),
          orderBy("timestamp", "desc"),
          limit(1)
        )
      );
      if (!snap.empty) {
        const ts = snap.docs[0].data().timestamp as Timestamp;
        map.set(uid, ts.toDate());
      }
    })
  );

  return map;
}