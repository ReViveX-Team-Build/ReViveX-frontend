// app/lib/hooks/useSubscription.ts
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

export type PlanType = "free" | "advanced_analytics" | "voice_companion";

interface Subscription {
    plan: PlanType;
    status: "active" | "cancelled" | null;
}

export function useSubscription(uid: string | undefined) {
    const [subscription, setSubscription] = useState<Subscription>({
        plan: "free",
        status: null,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) {
            setLoading(false);
            return;
        }

        // Real-time listener — updates instantly after webhook fires
        const unsubscribe = onSnapshot(doc(db, "users", uid), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setSubscription({
                    plan:   data?.subscription?.plan   ?? "free",
                    status: data?.subscription?.status ?? null,
                });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [uid]);

    return { subscription, loading };
}