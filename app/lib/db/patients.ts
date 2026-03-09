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