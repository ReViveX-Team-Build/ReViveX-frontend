// lib/db/conversations.ts
import { db } from "../firebase";
import {
  collection, addDoc, query, where,
  orderBy, getDocs, Timestamp, limit, deleteDoc,
} from "firebase/firestore";

export interface ChatMessage {
  id?: string;
  userId: string;
  role: "user" | "model";
  content: string;
  timestamp: Timestamp;
}

export async function getConversationHistory(
  uid: string,
  maxMessages: number = 30
): Promise<ChatMessage[]> {
  const q = query(
    collection(db, "ai_conversations"),
    where("userId", "==", uid),
    orderBy("timestamp", "asc"),
    limit(maxMessages)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
}

export async function getHistoryForAI(
  uid: string,
  maxMessages: number = 20
): Promise<{ role: "user" | "model"; content: string }[]> {
  const messages = await getConversationHistory(uid, maxMessages + 1);

  const history = messages.slice(0, -1);
  const firstUserIdx = history.findIndex((m) => m.role === "user");
  const trimmed = firstUserIdx > 0 ? history.slice(firstUserIdx) : history;

  return trimmed.map((m) => ({ role: m.role, content: m.content }));
}

export async function saveMessage(
  uid: string,
  role: "user" | "model",
  content: string
): Promise<string> {
  const ref = await addDoc(collection(db, "ai_conversations"), {
    userId: uid,
    role,
    content,
    timestamp: Timestamp.now(),
  });
  return ref.id;
}

export async function pruneOldMessages(
  uid: string,
  keepLast: number = 50
): Promise<void> {
  const q = query(
    collection(db, "ai_conversations"),
    where("userId", "==", uid),
    orderBy("timestamp", "desc")
  );
  const snap = await getDocs(q);
  const toDelete = snap.docs.slice(keepLast);
  await Promise.all(toDelete.map((d) => deleteDoc(d.ref)));
}