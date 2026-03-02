/**
 * lib/db/communications.ts
 *
 * Firestore helpers for the `communications` collection.
 *
 * NOTE: Make sure your Firestore indexes are set up in the console:
 * 1. Collection: communications | Fields: receiverId ASC, timestamp DESC
 * 2. Collection: communications | Fields: senderId ASC, receiverId ASC, type ASC, timestamp ASC
 */

import { db } from '../firebase';
import {
  collection, addDoc, query, where, orderBy,
  getDocs, doc, updateDoc, Timestamp, onSnapshot,
  QuerySnapshot, DocumentData,
} from 'firebase/firestore';
import { Communication } from './types';

// We extend the base Communication type here to require title and isImportant.
// Eventually, this should just be moved into lib/db/types.ts directly.
type FullCommunication = Communication & {
  title:        string;
  isImportant?: boolean;
};

// Fetches the patient's "inbox" (the formal stuff: feedback, instructions, AI insights).
// We exclude standard direct messages here so they don't clutter the main feed.
export async function getInboxMessages(patientId: string): Promise<FullCommunication[]> {
  const q = query(
    collection(db, 'communications'),
    where('receiverId', '==', patientId),
    where('type', 'in', ['feedback', 'instruction', 'ai_insight']),
    orderBy('timestamp', 'desc')
  );

  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  } as FullCommunication));
}

// Fetches the direct message chat history between a patient and a doctor.
export async function getDirectChat(
  patientId: string,
  doctorId:  string
): Promise<FullCommunication[]> {
  // Firebase doesn't easily support querying "Where sender is A AND receiver is B -- OR -- sender is B AND receiver is A"
  // To get around this, we just fire off two separate queries for both directions and merge the results.
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

  // Sort the final merged array so the chat timeline flows naturally (oldest to newest)
  return merged.sort((a, b) => {
    const ta = (a.timestamp as Timestamp).seconds;
    const tb = (b.timestamp as Timestamp).seconds;
    return ta - tb;
  });
}

// Real-time listener for the chat UI. 
// Call this in a useEffect so new messages pop up instantly without refreshing the page.
// Make sure to call the returned unsubscribe function on component unmount!
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
    // We filter client-side here to grab only the messages between these two specific users.
    const msgs = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as FullCommunication))
      .filter(m =>
        (m.senderId === doctorId  && m.receiverId === patientId) ||
        (m.senderId === patientId && m.receiverId === doctorId)
      );
    callback(msgs);
  });
}

// Used when the patient types a message into the chat box and hits send.
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

// Used by the doctor dashboard to push formal updates (instructions, AI generated notes, etc.)
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

// Flips the boolean when a user clicks the "acknowledge/read" checkbox on a specific message.
export async function markAsRead(messageId: string): Promise<void> {
  await updateDoc(doc(db, 'communications', messageId), {
    isRead: true,
  });
}

// Handy utility if we ever want to add a "Mark all as read" button to clear the whole inbox at once.
export async function markAllAsRead(patientId: string): Promise<void> {
  const q = query(
    collection(db, 'communications'),
    where('receiverId', '==', patientId),
    where('isRead', '==', false)
  );
  
  const snap = await getDocs(q);
  
  // Fire off all the updates simultaneously 
  await Promise.all(
    snap.docs.map(d => updateDoc(d.ref, { isRead: true }))
  );
}

// Generates some dummy data so the UI isn't empty when testing.
// Run this once from your seedDatabase script.
export async function seedCommunications(
  patientId: string,
  doctorId:  string
): Promise<void> {
  // Dynamic imports so we don't load these into the main bundle unless we are actively seeding
  const { addDoc, collection: col, Timestamp: TS } = await import('firebase/firestore');
  const { db: firestoreDb } = await import('../firebase');

  const items: Omit<FullCommunication, 'id'>[] = [
    {
      senderId: doctorId, receiverId: patientId,
      type: 'feedback', title: 'Excellent Progress This Week',
      content: "John, I reviewed your session data from this week and I'm very impressed with your consistency. Your grip strength has improved significantly, and your adherence score is outstanding. Keep up the great work! Continue with the current protocol - Right hand, Medium difficulty.",
      timestamp: Timestamp.fromDate(new Date('2025-11-15T09:00:00')),
      isRead: false, isImportant: false,
    },
    {
      senderId: doctorId, receiverId: patientId,
      type: 'instruction', title: 'Protocol Adjustment',
      content: "Based on your progress, I'm adjusting your therapy protocol starting next week. We'll increase the difficulty level to \"High\" for your right hand exercises. If you experience any discomfort, please let me know immediately.",
      timestamp: Timestamp.fromDate(new Date('2025-11-14T10:30:00')),
      isRead: false, isImportant: true,
    },
    {
      senderId: doctorId, receiverId: patientId,
      type: 'direct_message', title: 'Reminder: Hydration',
      content: 'Remember to stay well-hydrated before and after your therapy sessions. Proper hydration helps with muscle recovery and overall performance during rehabilitation exercises.',
      timestamp: Timestamp.fromDate(new Date('2025-11-12T08:00:00')),
      isRead: true, isImportant: false,
    },
    {
      senderId: doctorId, receiverId: patientId,
      type: 'ai_insight', title: 'Memory Game Performance',
      content: 'Your cognitive exercise performance is excellent with an 85% success rate. The dual-task therapy approach is working well for you.',
      timestamp: Timestamp.fromDate(new Date('2025-11-10T11:00:00')),
      isRead: true, isImportant: false,
    },
    {
      senderId: doctorId, receiverId: patientId,
      type: 'instruction', title: 'Next Appointment Scheduled',
      content: "Your next in-person evaluation is scheduled for Nov 25, 2025 at 2:00 PM. Please complete all scheduled sessions before this appointment.",
      timestamp: Timestamp.fromDate(new Date('2025-11-08T09:00:00')),
      isRead: true, isImportant: true,
    },
  ];

  await Promise.all(items.map(item =>
    addDoc(col(firestoreDb, 'communications'), item)
  ));
  
  console.log('✅ Communications seeded successfully.');
}