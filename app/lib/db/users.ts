import { db } from "../firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { PatientData, DoctorData } from "./types";

export async function getUser(uid: string) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
}

export const getPatientsByDoctor = async (doctorId: string): Promise<PatientData[]> => {
  const q = query(
    collection(db, "users"),
    where("role", "==", "patient"),
    where("assignedDoctorId", "==", doctorId)
  );
  const querySnapshot = await getDocs(q);
  const patients: PatientData[] = [];
  querySnapshot.forEach((doc) => {
    patients.push({ uid: doc.id, ...doc.data() } as PatientData);
  });
  return patients;
};

// ✅ FIXED - Changed from "patients" to "users"
export async function getPatientData(uid: string): Promise<PatientData | null> {
  const docRef = doc(db, "users", uid);  // ← Changed here
  const snap = await getDoc(docRef);
  return snap.exists() ? ({ uid: snap.id, ...snap.data() } as PatientData) : null;
}

// ✅ FIXED - Changed from "patients" to "users"
export async function updateProfilePicture(uid: string, url: string) {
  const docRef = doc(db, "users", uid);  // ← Changed here
  await updateDoc(docRef, { profilePictureUrl: url });
}

export async function getDoctorsForListing(): Promise<Pick<DoctorData, "uid" | "name" | "specialization" | "profilePictureUrl" | "doctorId">[]> {
  const q = query(
    collection(db, "users"),
    where("role", "==", "doctor")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    uid:               d.id,
    name:              d.data().name,
    specialization:    d.data().specialization,
    profilePictureUrl: d.data().profilePictureUrl ?? null,
    doctorId:          d.data().doctorId,
  }));
}

export async function getDoctorData(uid: string): Promise<DoctorData | null> {
  const docRef = doc(db, "users", uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { uid: snap.id, ...snap.data() } as DoctorData;
  }
  return null;
}