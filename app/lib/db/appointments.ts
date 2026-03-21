import { db } from "../firebase";
import { 
  collection, addDoc, getDocs, query, where, 
  updateDoc, doc, Timestamp, orderBy, deleteDoc 
} from "firebase/firestore";
import { Appointment } from "./types";

const COLLECTION = "appointments";

export async function createAppointment(data: Omit<Appointment, "id" | "date" | "status" | "createdAt"> & { date: Date }) {
  const ref = collection(db, COLLECTION);
  const docRef = await addDoc(ref, {
    ...data,
    date: Timestamp.fromDate(data.date),
    status: "confirmed", // Auto-confirming doctor-created appts for now
    createdAt: Timestamp.now()
  });
  return docRef.id;
}

export async function getDoctorAppointments(doctorId: string) {
  const q = query(
    collection(db, COLLECTION),
    where("doctorId", "==", doctorId),
    orderBy("date", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Appointment[];
}

export async function updateAppointmentStatus(id: string, status: Appointment["status"]) {
  await updateDoc(doc(db, COLLECTION, id), { status });
}

export async function deleteAppointment(id: string) {
  await deleteDoc(doc(db, COLLECTION, id));
}