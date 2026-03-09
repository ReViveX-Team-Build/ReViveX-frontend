

import { db } from "../firebase";
import {
  collection, addDoc, query, where, orderBy,
  getDocs, doc, updateDoc, Timestamp, onSnapshot,
  QuerySnapshot, DocumentData,
} from "firebase/firestore";
import { Communication } from "./types";
import { updateConnectionStatus } from "./users";

type FullCommunication = Communication;

// ─────────────────────────────────────────────────────────────────────────────
// Patient inbox — feedback, instructions, AI insights (no direct messages)
// ─────────────────────────────────────────────────────────────────────────────

export async function getInboxMessages(
  patientId: string
): Promise<FullCommunication[]> {
  const q = query(
    collection(db, "communications"),
    where("receiverId", "==", patientId),
    where("type", "in", ["feedback", "instruction", "ai_insight"]),
    orderBy("timestamp", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FullCommunication));
}

// ─────────────────────────────────────────────────────────────────────────────
// Direct chat history (one-time fetch)
// ─────────────────────────────────────────────────────────────────────────────

export async function getDirectChat(
  patientId: string,
  doctorId: string
): Promise<FullCommunication[]> {
  const [snap1, snap2] = await Promise.all([
    getDocs(query(
      collection(db, "communications"),
      where("senderId", "==", doctorId),
      where("receiverId", "==", patientId),
      where("type", "==", "direct_message"),
      orderBy("timestamp", "asc")
    )),
    getDocs(query(
      collection(db, "communications"),
      where("senderId", "==", patientId),
      where("receiverId", "==", doctorId),
      where("type", "==", "direct_message"),
      orderBy("timestamp", "asc")
    )),
  ]);

  const toItems = (snap: QuerySnapshot<DocumentData>) =>
    snap.docs.map((d) => ({ id: d.id, ...d.data() } as FullCommunication));

  return [...toItems(snap1), ...toItems(snap2)].sort(
    (a, b) => (a.timestamp as Timestamp).seconds - (b.timestamp as Timestamp).seconds
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Real-time listener — FIXED: uses two targeted queries instead of
// querying all direct_messages and filtering client-side
// ─────────────────────────────────────────────────────────────────────────────

export function subscribeToDirect(
  patientId: string,
  doctorId: string,
  callback: (msgs: FullCommunication[]) => void
): () => void {
  let fromDoctor:  FullCommunication[] = [];
  let fromPatient: FullCommunication[] = [];

  const merge = () => {
    callback(
      [...fromDoctor, ...fromPatient].sort(
        (a, b) => (a.timestamp as Timestamp).seconds - (b.timestamp as Timestamp).seconds
      )
    );
  };

  const unsub1 = onSnapshot(
    query(
      collection(db, "communications"),
      where("senderId",   "==", doctorId),
      where("receiverId", "==", patientId),
      where("type",       "==", "direct_message"),
      orderBy("timestamp", "asc")
    ),
    (snap) => {
      fromDoctor = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FullCommunication));
      merge();
    }
  );

  const unsub2 = onSnapshot(
    query(
      collection(db, "communications"),
      where("senderId",   "==", patientId),
      where("receiverId", "==", doctorId),
      where("type",       "==", "direct_message"),
      orderBy("timestamp", "asc")
    ),
    (snap) => {
      fromPatient = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FullCommunication));
      merge();
    }
  );

  return () => { unsub1(); unsub2(); };
}

// ─────────────────────────────────────────────────────────────────────────────
// SEND
// ─────────────────────────────────────────────────────────────────────────────

export async function sendDirectMessage(
  senderId: string,
  receiverId: string,
  content: string
): Promise<string> {
  const ref = await addDoc(collection(db, "communications"), {
    senderId,
    receiverId,
    type: "direct_message",
    title: "Direct Message",
    content,
    timestamp: Timestamp.now(),
    isRead: false,
    isImportant: false,
  } satisfies Omit<FullCommunication, "id">);
  return ref.id;
}

export async function sendFromDoctor(
  doctorId: string,
  patientId: string,
  type: FullCommunication["type"],
  title: string,
  content: string,
  isImportant: boolean = false
): Promise<string> {
  const ref = await addDoc(collection(db, "communications"), {
    senderId: doctorId,
    receiverId: patientId,
    type,
    title,
    content,
    timestamp: Timestamp.now(),
    isRead: false,
    isImportant,
  } satisfies Omit<FullCommunication, "id">);
  return ref.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// READ STATUS
// ─────────────────────────────────────────────────────────────────────────────

export async function markAsRead(messageId: string): Promise<void> {
  await updateDoc(doc(db, "communications", messageId), { isRead: true });
}

export async function markAllAsRead(patientId: string): Promise<void> {
  const snap = await getDocs(
    query(
      collection(db, "communications"),
      where("receiverId", "==", patientId),
      where("isRead",     "==", false)
    )
  );
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { isRead: true })));
}

// Unread count for the notification bell icon
export async function getUnreadCount(userId: string): Promise<number> {
  const snap = await getDocs(
    query(
      collection(db, "communications"),
      where("receiverId", "==", userId),
      where("isRead",     "==", false)
    )
  );
  return snap.size;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONNECTION REQUESTS — onboarding flow
// Patient selects a doctor → writes a connection_request communication.
// Doctor sees a notification bell badge and can accept or reject.
// ─────────────────────────────────────────────────────────────────────────────

export async function sendConnectionRequest(
  patientUid: string,
  patientName: string,
  doctorUid: string
): Promise<string> {
  const ref = await addDoc(collection(db, "communications"), {
    senderId:    patientUid,
    receiverId:  doctorUid,
    type:        "connection_request",
    title:       "New Patient Request",
    content:     `${patientName} has requested to connect with you as their rehabilitation doctor.`,
    timestamp:   Timestamp.now(),
    isRead:      false,
    isImportant: true,
  } satisfies Omit<FullCommunication, "id">);
  return ref.id;
}

/**
 * Returns all unread connection_request messages for a doctor.
 * Used by the notification bell and the pending requests panel.
 */
export async function getPendingPatientRequests(
  doctorUid: string
): Promise<FullCommunication[]> {
  const snap = await getDocs(
    query(
      collection(db, "communications"),
      where("receiverId", "==", doctorUid),
      where("type",       "==", "connection_request"),
      where("isRead",     "==", false),
      orderBy("timestamp", "desc")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FullCommunication));
}

/**
 * Doctor accepts a patient.
 * 1. Sets patient's connectionStatus → "accepted"
 * 2. Sets patient's assignedDoctorId → doctorUid  (in case it wasn't set yet)
 * 3. Marks the connection_request communication as read
 */
export async function acceptPatientRequest(
  patientUid:    string,
  doctorUid:     string,
  communicationId: string
): Promise<void> {
  await Promise.all([
    // Update the patient's user doc
    updateDoc(doc(db, "users", patientUid), {
      connectionStatus:  "accepted",
      assignedDoctorId:  doctorUid,
    }),
    // Mark the notification as read so the bell badge clears
    updateDoc(doc(db, "communications", communicationId), { isRead: true }),
  ]);
}

/**
 * Doctor rejects a patient.
 * 1. Sets patient's connectionStatus → "rejected"
 * 2. Marks the connection_request communication as read
 * Patient will see the rejection screen on their waiting page.
 */
export async function rejectPatientRequest(
  patientUid:      string,
  communicationId: string
): Promise<void> {
  await Promise.all([
    updateConnectionStatus(patientUid, "rejected"),
    updateDoc(doc(db, "communications", communicationId), { isRead: true }),
  ]);
}