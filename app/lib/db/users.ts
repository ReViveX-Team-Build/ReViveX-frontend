// lib/db/users.ts
import { db } from "../firebase";
import {
  doc, getDoc, collection, query,
  where, getDocs, updateDoc, Timestamp,
} from "firebase/firestore";
import { PatientData, DoctorData, TherapyProtocol } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Generic user fetch
// ─────────────────────────────────────────────────────────────────────────────

export async function getUser(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ─────────────────────────────────────────────────────────────────────────────
// Typed patient fetch
// ─────────────────────────────────────────────────────────────────────────────

export async function getPatientData(uid: string): Promise<PatientData | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as PatientData;
}

// ─────────────────────────────────────────────────────────────────────────────
// Typed doctor fetch
// ─────────────────────────────────────────────────────────────────────────────

export async function getDoctorData(uid: string): Promise<DoctorData | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as DoctorData;
}

// ─────────────────────────────────────────────────────────────────────────────
// All patients assigned to a doctor
// ─────────────────────────────────────────────────────────────────────────────

export const getPatientsByDoctor = async (
  doctorId: string
): Promise<PatientData[]> => {
  const snap = await getDocs(
    query(
      collection(db, "users"),
      where("role", "==", "patient"),
      where("assignedDoctorId", "==", doctorId)
    )
  );
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as PatientData));
};


export async function getActiveProtocol(
  patientId: string
): Promise<TherapyProtocol | null> {
  const snap = await getDocs(
    query(
      collection(db, "protocols"),    // ✅ "protocols" — correct collection name
      where("patientId", "==", patientId)
    )
  );
  if (snap.empty) return null;

  const sorted = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as TherapyProtocol))
    .sort((a, b) => b.assignedDate.seconds - a.assignedDate.seconds);

  return sorted[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Hardware status sync — called by useSensor on connect / disconnect
// ─────────────────────────────────────────────────────────────────────────────

export async function updateHardwareStatus(
  uid: string,
  status: "connected" | "offline",
  deviceId?: string
): Promise<void> {
  if (!uid) return;
  try {
    await updateDoc(doc(db, "users", uid), {
      "hardwareStatus.status": status,
      "hardwareStatus.lastSync": Timestamp.now(),
      ...(deviceId ? { "hardwareStatus.deviceId": deviceId } : {}),
    });
  } catch (err) {
    console.warn("Hardware status update failed:", err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// XP update after a game session
// ─────────────────────────────────────────────────────────────────────────────

export async function addXpToPatient(
  uid: string,
  xpEarned: number
): Promise<void> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return;

  const current = (snap.data().gamification?.totalXp as number) ?? 0;
  await updateDoc(doc(db, "users", uid), {
    "gamification.totalXp": current + xpEarned,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Doctors listing — used on patient onboarding select-doctor page
// Returns all doctors with name, specialization, profilePictureUrl, doctorId
// ─────────────────────────────────────────────────────────────────────────────

export async function getDoctorsForListing(): Promise<
  Pick<DoctorData, "uid" | "name" | "specialization" | "profilePictureUrl" | "doctorId">[]
> {
  const snap = await getDocs(
    query(collection(db, "users"), where("role", "==", "doctor"))
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      name: data.name ?? "",
      specialization: data.specialization ?? "",
      profilePictureUrl: data.profilePictureUrl ?? null,
      doctorId: data.doctorId ?? "",
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile picture — called after Firebase Storage upload on onboarding step 1
// ─────────────────────────────────────────────────────────────────────────────

export async function updateProfilePicture(
  uid: string,
  url: string
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    profilePictureUrl: url,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Connection status — called by doctor accept/reject flow
// and on the patient waiting screen to detect when they've been accepted
// ─────────────────────────────────────────────────────────────────────────────

export async function updateConnectionStatus(
  patientUid: string,
  status: "none" | "pending" | "accepted" | "rejected"
): Promise<void> {
  await updateDoc(doc(db, "users", patientUid), {
    connectionStatus: status,
  });
}