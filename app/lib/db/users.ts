import { db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { PatientData } from "./types";

// Enhanced version of your friend's getUser function
export async function getUser(uid: string) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  
  if (snap.exists()) {
    // We add the 'id' into the returned object so the frontend knows the document ID
    return { id: snap.id, ...snap.data() };
  }
  return null; // Safer than returning undefined if the user doesn't exist
}

//  For the Doctor Dashboard: Get all patients assigned to a specific doctor
export const getPatientsByDoctor = async (doctorId: string): Promise<PatientData[]> => {
  const q = query(
    collection(db, "users"), 
    where("role", "==", "patient"),
    where("assignedDoctorId", "==", doctorId)
  );
  
  const querySnapshot = await getDocs(q);
  const patients: PatientData[] = [];
  
  querySnapshot.forEach((doc) => {
    // We cast it to PatientData so TypeScript knows exactly what fields are available
    patients.push({ uid: doc.id, ...doc.data() } as PatientData);
  });
  
  return patients;
};