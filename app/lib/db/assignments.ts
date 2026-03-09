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