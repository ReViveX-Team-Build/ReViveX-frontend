import { db } from "../firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { PatientData } from "./types";

// Fetches a single user's profile data from the database using their unique ID.
export async function getUser(uid: string) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  
  return null; 
}

// Fetches a list of all patients assigned to a specific doctor.
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

// Fetches a single patient's data from the 'patients' collection by their uid.
// Used during onboarding to check if a profile photo already exists.
export async function getPatientData(uid: string) {
  const docRef = doc(db, "patients", uid);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
}

// Updates the profilePictureUrl field for a patient in the 'patients' collection.
// Called after a successful Firebase Storage upload during onboarding.
export async function updateProfilePicture(uid: string, url: string) {
  const docRef = doc(db, "patients", uid);
  await updateDoc(docRef, { profilePictureUrl: url });
}