import { db } from "../firebase";
import { collection, addDoc, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import { GameSession } from "./types";

export const saveGameSession = async (sessionData: Omit<GameSession, "id">) => {
  try {
    
    const docRef = await addDoc(collection(db, "game_sessions"), sessionData);
    return docRef.id;
  } catch (error) {
    console.error("Error saving session:", error);
    throw error;
  }
};


export async function getRecentSessions(uid: string, maxResults: number = 10) {
  const q = query(
    collection(db, "game_sessions"),
    where("userId", "==", uid), 
    orderBy("timestamp", "desc"),
    limit(maxResults)
  );

  const snap = await getDocs(q);
  
  
  return snap.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  })) as GameSession[];
}