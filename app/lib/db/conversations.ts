import { db } from '../firebase';
import { 
  collection, addDoc, query, where, orderBy, 
  getDocs, Timestamp, limit 
} from 'firebase/firestore';

export interface ChatMessage {
  id?: string;
  userId: string;
  role: 'user' | 'model'; // 'user' is the patient, 'model' is Gemini
  content: string;
  timestamp: Timestamp;
}

// Fetches the most recent chat history so the AI remembers what you were talking about
export async function getConversationHistory(uid: string, maxMessages: number = 20): Promise<ChatMessage[]> {
  const q = query(
    collection(db, 'ai_conversations'),
    where('userId', '==', uid),
    orderBy('timestamp', 'asc'), // Order by oldest to newest so chat reads top-to-bottom
    limit(maxMessages)
  );

  const snap = await getDocs(q);
  
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as ChatMessage));
}

// Saves a single message to the database.
// once for what the patient typed, and once for what Gemini replied.
export async function saveMessage(
  uid: string, 
  role: 'user' | 'model', 
  content: string
): Promise<string> {
  const docRef = await addDoc(collection(db, 'ai_conversations'), {
    userId: uid,
    role,
    content,
    timestamp: Timestamp.now(),
  });
  
  return docRef.id;
}