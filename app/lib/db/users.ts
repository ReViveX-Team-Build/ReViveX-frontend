import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export async function getUser(uid: string) {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.data();
}