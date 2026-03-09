import { db } from "../firebase";
import {
  collection, addDoc, query, where,
  orderBy, getDocs, doc, updateDoc,
  Timestamp, limit,
} from "firebase/firestore";
import { Assignment, AssignmentStatus } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

export async function createAssignment(
  data: Omit<Assignment, "id" | "assignedDate" | "status">
): Promise<string> {
  const ref = await addDoc(collection(db, "assignments"), {
    ...data,
    status: "pending" as AssignmentStatus,
    assignedDate: Timestamp.now(),
  });
  return ref.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// READ — patient view
// ─────────────────────────────────────────────────────────────────────────────

// All assignments for a patient, newest first
export async function getPatientAssignments(
  patientId: string,
  maxResults: number = 20
): Promise<Assignment[]> {
  const snap = await getDocs(
    query(
      collection(db, "assignments"),
      where("patientId", "==", patientId),
      orderBy("assignedDate", "desc"),
      limit(maxResults)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment));
}

// Only pending/active assignments — shown on patient home & therapy games page
export async function getPendingAssignments(
  patientId: string
): Promise<Assignment[]> {
  const snap = await getDocs(
    query(
      collection(db, "assignments"),
      where("patientId", "==", patientId),
      where("status", "in", ["pending", "active"]),
      orderBy("assignedDate", "desc")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment));
}

// ─────────────────────────────────────────────────────────────────────────────
// READ — doctor view
// ─────────────────────────────────────────────────────────────────────────────

// All assignments the doctor has created across all patients
export async function getDoctorAssignments(
  doctorId: string,
  maxResults: number = 50
): Promise<Assignment[]> {
  const snap = await getDocs(
    query(
      collection(db, "assignments"),
      where("doctorId", "==", doctorId),
      orderBy("assignedDate", "desc"),
      limit(maxResults)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment));
}

// Assignments for one specific patient from the doctor's view
export async function getAssignmentsForPatient(
  doctorId: string,
  patientId: string
): Promise<Assignment[]> {
  const snap = await getDocs(
    query(
      collection(db, "assignments"),
      where("doctorId", "==", doctorId),
      where("patientId", "==", patientId),
      orderBy("assignedDate", "desc")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment));
}