import { db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { PatientData } from "./types";
// Fetches a single user's profile data from the database using their unique ID.
export async function getUser(uid: string) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  
  if (snap.exists()) {
    // Inject the document ID into the returned object so the frontend can reference it easily later.
    return { id: snap.id, ...snap.data() };
  }
  
  // Explicitly return null if the user isn't found (cleaner for error handling than undefined).
  return null; 
}

// Fetches a list of all patients assigned to a specific doctor.
// Used primarily to populate the Doctor Dashboard and Patient list views.
export const getPatientsByDoctor = async (doctorId: string): Promise<PatientData[]> => {
  const q = query(
    collection(db, "users"), 
    where("role", "==", "patient"),
    where("assignedDoctorId", "==", doctorId)
  );
  
  const querySnapshot = await getDocs(q);
  const patients: PatientData[] = [];
  
  querySnapshot.forEach((doc) => {
    // Merge the document ID with the Firestore data and enforce our TypeScript shape
    // so the frontend knows exactly what fields are available.
    patients.push({ uid: doc.id, ...doc.data() } as PatientData);
  });
  
  return patients;
};