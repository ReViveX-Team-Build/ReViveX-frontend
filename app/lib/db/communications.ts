/**
 * lib/db/communications.ts
 */

import { db } from '../firebase';
import {
  collection, addDoc, query, where, orderBy,
  getDocs, doc, updateDoc, Timestamp, onSnapshot,
  QuerySnapshot, DocumentData,
} from 'firebase/firestore';
import { Communication } from './types';

type FullCommunication = Communication & {
  title:        string;
  isImportant?: boolean;
};

export async function getInboxMessages(patientId: string): Promise<FullCommunication[]> {
  const q = query(
    collection(db, 'communications'),
    where('receiverId', '==', patientId),
    where('type', 'in', ['feedback', 'instruction', 'ai_insight']),
    orderBy('timestamp', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FullCommunication));
}

export async function getDirectChat(
  patientId: string,
  doctorId:  string
): Promise<FullCommunication[]> {
  const [snap1, snap2] = await Promise.all([
    getDocs(query(
      collection(db, 'communications'),
      where('senderId',   '==', doctorId),
      where('receiverId', '==', patientId),
      where('type', '==', 'direct_message'),
      orderBy('timestamp', 'asc')
    )),
    getDocs(query(
      collection(db, 'communications'),
      where('senderId',   '==', patientId),
      where('receiverId', '==', doctorId),
      where('type', '==', 'direct_message'),
      orderBy('timestamp', 'asc')
    )),
  ]);

  const toItems = (snap: QuerySnapshot<DocumentData>) =>
    snap.docs.map(d => ({ id: d.id, ...d.data() } as FullCommunication));

  const merged = [...toItems(snap1), ...toItems(snap2)];
  return merged.sort((a, b) => {
    const ta = (a.timestamp as Timestamp).seconds;
    const tb = (b.timestamp as Timestamp).seconds;
    return ta - tb;
  });
}

export function subscribeToDirect(
  patientId: string,
  doctorId:  string,
  callback:  (msgs: FullCommunication[]) => void
): () => void {
  const q = query(
    collection(db, 'communications'),
    where('type', '==', 'direct_message'),
    orderBy('timestamp', 'asc')
  );
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as FullCommunication))
      .filter(m =>
        (m.senderId === doctorId  && m.receiverId === patientId) ||
        (m.senderId === patientId && m.receiverId === doctorId)
      );
    callback(msgs);
  });
}

export async function sendDirectMessage(
  patientId: string,
  doctorId:  string,
  content:   string
): Promise<string> {
  const ref = await addDoc(collection(db, 'communications'), {
    senderId:    patientId,
    receiverId:  doctorId,
    type:        'direct_message',
    title:       'Direct Message',
    content,
    timestamp:   Timestamp.now(),
    isRead:      false,
    isImportant: false,
  } satisfies Omit<FullCommunication, 'id'>);
  return ref.id;
}

export async function sendFromDoctor(
  doctorId:    string,
  patientId:   string,
  type:        FullCommunication['type'],
  title:       string,
  content:     string,
  isImportant: boolean = false
): Promise<string> {
  const ref = await addDoc(collection(db, 'communications'), {
    senderId:   doctorId,
    receiverId: patientId,
    type,
    title,
    content,
    timestamp:   Timestamp.now(),
    isRead:      false,
    isImportant,
  } satisfies Omit<FullCommunication, 'id'>);
  return ref.id;
}

export async function markAsRead(messageId: string): Promise<void> {
  await updateDoc(doc(db, 'communications', messageId), { isRead: true });
}

export async function markAllAsRead(patientId: string): Promise<void> {
  const q = query(
    collection(db, 'communications'),
    where('receiverId', '==', patientId),
    where('isRead', '==', false)
  );
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map(d => updateDoc(d.ref, { isRead: true })));
}

export async function seedCommunications(
  patientId: string,
  doctorId:  string
): Promise<void> {
  const { addDoc, collection: col, Timestamp: TS } = await import('firebase/firestore');
  const { db: firestoreDb } = await import('../firebase');

  const items: Omit<FullCommunication, 'id'>[] = [
    {
      senderId: doctorId, receiverId: patientId,
      type: 'feedback', title: 'Excellent Progress This Week',
      content: "John, I reviewed your session data from this week and I'm very impressed with your consistency.",
      timestamp: Timestamp.fromDate(new Date('2025-11-15T09:00:00')),
      isRead: false, isImportant: false,
    },
    {
      senderId: doctorId, receiverId: patientId,
      type: 'instruction', title: 'Protocol Adjustment',
      content: "Based on your progress, I'm adjusting your therapy protocol starting next week.",
      timestamp: Timestamp.fromDate(new Date('2025-11-14T10:30:00')),
      isRead: false, isImportant: true,
    },
    {
      senderId: doctorId, receiverId: patientId,
      type: 'direct_message', title: 'Reminder: Hydration',
      content: 'Remember to stay well-hydrated before and after your therapy sessions.',
      timestamp: Timestamp.fromDate(new Date('2025-11-12T08:00:00')),
      isRead: true, isImportant: false,
    },
    {
      senderId: doctorId, receiverId: patientId,
      type: 'ai_insight', title: 'Memory Game Performance',
      content: 'Your cognitive exercise performance is excellent with an 85% success rate.',
      timestamp: Timestamp.fromDate(new Date('2025-11-10T11:00:00')),
      isRead: true, isImportant: false,
    },
    {
      senderId: doctorId, receiverId: patientId,
      type: 'instruction', title: 'Next Appointment Scheduled',
      content: "Your next in-person evaluation is scheduled for Nov 25, 2025 at 2:00 PM.",
      timestamp: Timestamp.fromDate(new Date('2025-11-08T09:00:00')),
      isRead: true, isImportant: true,
    },
  ];

  await Promise.all(items.map(item => addDoc(col(firestoreDb, 'communications'), item)));
  console.log('✅ Communications seeded successfully.');
}

export async function sendConnectionRequest(
  patientUid:  string,
  patientName: string,
  doctorUid:   string
): Promise<void> {
  await addDoc(collection(db, 'communications'), {
    senderId:    patientUid,
    receiverId:  doctorUid,
    type:        'connection_request',
    title:       'New Patient Request',
    content:     `${patientName} has requested to connect with you as their rehabilitation doctor.`,
    timestamp:   Timestamp.now(),
    isRead:      false,
    isImportant: true,
  });
}

// ← ADDED — called by RequestPanel when doctor taps Accept
// Marks the notification read and flips patient's connectionStatus to "accepted"
export async function acceptPatientRequest(
  patientUid: string,
  doctorUid:  string,
  commId:     string
): Promise<void> {
  await Promise.all([
    updateDoc(doc(db, 'communications', commId), {
      isRead: true,
    }),
    updateDoc(doc(db, 'users', patientUid), {
      connectionStatus: 'accepted',
      assignedDoctorId: doctorUid,
    }),
  ]);
}

// ← ADDED — called by RequestPanel when doctor taps Decline
// Marks the notification read and flips patient's connectionStatus to "rejected"
export async function rejectPatientRequest(
  patientUid: string,
  commId:     string
): Promise<void> {
  await Promise.all([
    updateDoc(doc(db, 'communications', commId), {
      isRead: true,
    }),
    updateDoc(doc(db, 'users', patientUid), {
      connectionStatus: 'rejected',
    }),
  ]);
}