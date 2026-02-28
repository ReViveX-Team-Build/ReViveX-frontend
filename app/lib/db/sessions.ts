import { db } from "../firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

export async function getRecentSessions(uid: string) {
    const q = query(
        collection(db, "game_sessions"),
        where("userId", "==", uid),
        orderBy("timestamp", "desc")
    );

    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
}