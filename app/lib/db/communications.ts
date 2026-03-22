/**
 * lib/db/communications.ts
 */

import { db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { Communication } from "./types";

type FullCommunication = Communication & {
  title: string;
  isImportant?: boolean;
};

// ──────────────────────────
// Patient inbox — feedback, instructions, AI insights
// ─────────────────────────

export async function getInboxMessages(
  patientId: string,
): Promise<FullCommunication[]> {
  const q = query(
    collection(db, "communications"),
    where("receiverId", "==", patientId),
    where("type", "in", ["feedback", "instruction", "ai_insight"]),
    orderBy("timestamp", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FullCommunication);
}

// ─────────────────────────
// Direct chat — one-time fetch
// ─────────────────────────

export async function getDirectChat(
  patientId: string,
  doctorId: string,
): Promise<FullCommunication[]> {
  const [snap1, snap2] = await Promise.all([
    getDocs(
      query(
        collection(db, "communications"),
        where("senderId", "==", doctorId),
        where("receiverId", "==", patientId),
        where("type", "==", "direct_message"),
      ),
    ),
    getDocs(
      query(
        collection(db, "communications"),
        where("senderId", "==", patientId),
        where("receiverId", "==", doctorId),
        where("type", "==", "direct_message"),
      ),
    ),
  ]);

  const toItems = (snap: QuerySnapshot<DocumentData>) =>
    snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FullCommunication);

  return [...toItems(snap1), ...toItems(snap2)].sort(
    (a, b) =>
      (a.timestamp as Timestamp).seconds - (b.timestamp as Timestamp).seconds,
  );
}

//
// Real-time listener — two targeted queries (NOT a full collection scan)

export function subscribeToDirect(
  patientId: string,
  doctorId: string,
  callback: (msgs: FullCommunication[]) => void,
): () => void {
  let fromDoctor: FullCommunication[] = [];
  let fromPatient: FullCommunication[] = [];

  const merge = () => {
    callback(
      [...fromDoctor, ...fromPatient].sort(
        (a, b) =>
          (a.timestamp as Timestamp).seconds -
          (b.timestamp as Timestamp).seconds,
      ),
    );
  };

  const unsub1 = onSnapshot(
    query(
      collection(db, "communications"),
      where("senderId", "==", doctorId),
      where("receiverId", "==", patientId),
      where("type", "==", "direct_message"),
    ),
    (snap) => {
      fromDoctor = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as FullCommunication,
      );
      merge();
    },
  );

  const unsub2 = onSnapshot(
    query(
      collection(db, "communications"),
      where("senderId", "==", patientId),
      where("receiverId", "==", doctorId),
      where("type", "==", "direct_message"),
    ),
    (snap) => {
      fromPatient = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as FullCommunication,
      );
      merge();
    },
  );

  return () => {
    unsub1();
    unsub2();
  };
}

// ───────────────────────────
// SEND
// ─────────────────────────

// Generic — senderId can be either patient or doctor
export async function sendDirectMessage(
  senderId: string,
  receiverId: string,
  content: string,
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
  isImportant: boolean = false,
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

// ──────────────────────
// READ STATUS
// ────────────────────────

export async function markAsRead(messageId: string): Promise<void> {
  await updateDoc(doc(db, "communications", messageId), { isRead: true });
}

export async function markAllAsRead(patientId: string): Promise<void> {
  const snap = await getDocs(
    query(
      collection(db, "communications"),
      where("receiverId", "==", patientId),
      where("isRead", "==", false),
    ),
  );
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { isRead: true })));
}

export async function getUnreadCount(userId: string): Promise<number> {
  const snap = await getDocs(
    query(
      collection(db, "communications"),
      where("receiverId", "==", userId),
      where("isRead", "==", false),
    ),
  );
  return snap.size;
}

// ─────────────────────────
// CONNECTION REQUESTS
// ─────────────────────────
// Returns string ID so caller can reference the communication if needed
export async function sendConnectionRequest(
  patientUid: string,
  patientName: string,
  doctorUid: string,
): Promise<string> {
  const ref = await addDoc(collection(db, "communications"), {
    senderId: patientUid,
    receiverId: doctorUid,
    type: "connection_request",
    title: "New Patient Request",
    content: `${patientName} has requested to connect with you as their rehabilitation doctor.`,
    timestamp: Timestamp.now(),
    isRead: false,
    isImportant: true,
  } satisfies Omit<FullCommunication, "id">);
  return ref.id;
}

export async function getPendingPatientRequests(
  doctorUid: string,
): Promise<FullCommunication[]> {
  const snap = await getDocs(
    query(
      collection(db, "communications"),
      where("receiverId", "==", doctorUid),
      where("type", "==", "connection_request"),
      where("isRead", "==", false),
      orderBy("timestamp", "desc"),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FullCommunication);
}

export async function acceptPatientRequest(
  patientUid: string,
  doctorUid: string,
  commId: string,
): Promise<void> {
  await Promise.all([
    updateDoc(doc(db, "communications", commId), { isRead: true }),
    updateDoc(doc(db, "users", patientUid), {
      connectionStatus: "accepted",
      assignedDoctorId: doctorUid,
    }),
  ]);
}

export async function rejectPatientRequest(
  patientUid: string,
  commId: string,
): Promise<void> {
  await Promise.all([
    updateDoc(doc(db, "communications", commId), { isRead: true }),
    updateDoc(doc(db, "users", patientUid), {
      connectionStatus: "rejected",
    }),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED — alpha testing only
// ─────────────────────────────────────────────────────────────────────────────

export async function seedCommunications(
  patientId: string,
  doctorId: string,
): Promise<void> {
  const items: Omit<FullCommunication, "id">[] = [
    {
      senderId: doctorId,
      receiverId: patientId,
      type: "feedback",
      title: "Excellent Progress This Week",
      content:
        "John, I reviewed your session data from this week and I'm very impressed with your consistency.",
      timestamp: Timestamp.fromDate(new Date("2025-11-15T09:00:00")),
      isRead: false,
      isImportant: false,
    },
    {
      senderId: doctorId,
      receiverId: patientId,
      type: "instruction",
      title: "Protocol Adjustment",
      content:
        "Based on your progress, I'm adjusting your therapy protocol starting next week.",
      timestamp: Timestamp.fromDate(new Date("2025-11-14T10:30:00")),
      isRead: false,
      isImportant: true,
    },
    {
      senderId: doctorId,
      receiverId: patientId,
      type: "direct_message",
      title: "Reminder: Hydration",
      content:
        "Remember to stay well-hydrated before and after your therapy sessions.",
      timestamp: Timestamp.fromDate(new Date("2025-11-12T08:00:00")),
      isRead: true,
      isImportant: false,
    },
    {
      senderId: doctorId,
      receiverId: patientId,
      type: "ai_insight",
      title: "Memory Game Performance",
      content:
        "Your cognitive exercise performance is excellent with an 85% success rate.",
      timestamp: Timestamp.fromDate(new Date("2025-11-10T11:00:00")),
      isRead: true,
      isImportant: false,
    },
    {
      senderId: doctorId,
      receiverId: patientId,
      type: "instruction",
      title: "Next Appointment Scheduled",
      content:
        "Your next in-person evaluation is scheduled for Nov 25, 2025 at 2:00 PM.",
      timestamp: Timestamp.fromDate(new Date("2025-11-08T09:00:00")),
      isRead: true,
      isImportant: true,
    },
  ];

  await Promise.all(
    items.map((item) => addDoc(collection(db, "communications"), item)),
  );
  console.log("✅ Communications seeded successfully.");
}
