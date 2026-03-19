import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

export type PlanType = "free" | "advanced_analytics" | "voice_companion";

export function useSubscription(uid: string | undefined) {
    const [plan, setPlan] = useState<PlanType>("free");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) {
            setLoading(false);
            return;
        }

        const unsub = onSnapshot(doc(db, "patients", uid), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setPlan(data?.subscription?.plan ?? "free");
            }
            setLoading(false);
        });

        return () => unsub();
    }, [uid]);

    return { plan, loading };
}