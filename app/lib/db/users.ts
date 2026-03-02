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