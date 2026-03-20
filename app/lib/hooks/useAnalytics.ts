// app/lib/hooks/useAnalytics.ts
import { useEffect, useState } from "react";
import { getRecentSessions, getLast30DaySessions, getSessionsForBothHands } from "@/app/lib/db/sessions";
import { getActiveProtocol } from "@/app/lib/db/users";
import { GameSession } from "@/app/lib/db/types";

export interface AnalyticsData {
    // Grip trend — 30 days, for the chart
    gripTrend: { date: string; grip: number }[];

    // This week stats
    adherencePct: number;
    completedThisWeek: number;
    prescribed: number;
    avgGrip: number;
    peakGrip: number;
    avgReactionMs: number;
    avgCognitiveAccuracy: number;

    // Bilateral
    rightHandAvg: number;
    leftHandAvg: number;
    symmetryRatio: number;

    // 30-day improvement
    gripImprovementPct: number;
}

export function useAnalytics(uid: string | undefined) {
    const [data, setData]       = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

    useEffect(() => {
        if (!uid) { setLoading(false); return; }

        async function fetch() {
            try {
                const [sessions30, bilateral, protocol] = await Promise.all([
                    getLast30DaySessions(uid!),
                    getSessionsForBothHands(uid!, 20),
                    getActiveProtocol(uid!),
                ]);

                const last7 = sessions30.slice(0, 7);

                // Safe average helper
                const avg = (nums: (number | undefined)[]): number => {
                    const valid = nums.filter((n): n is number => n !== undefined && !isNaN(n));
                    if (!valid.length) return 0;
                    return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
                };

                // Grip trend for chart — one point per session, last 30 days
                const gripTrend = sessions30
                    .slice()
                    .reverse()
                    .map((s) => ({
                        date: s.timestamp.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                        grip: s.metrics.peakGripForce ?? 0,
                    }));

                // 30-day grip improvement
                const gripValues = sessions30.map((s) => s.metrics.peakGripForce).filter((v): v is number => v != null);
                const gripStart   = gripValues.at(-1) ?? 0;
                const gripCurrent = gripValues.at(0) ?? 0;
                const gripImprovementPct = gripStart > 0
                    ? Math.round(((gripCurrent - gripStart) / gripStart) * 100)
                    : 0;

                // Adherence
                const prescribed       = protocol?.sessionsPerWeek ?? 5;
                const completedThisWeek = last7.filter((s) => s.durationSeconds > 60).length;
                const adherencePct     = Math.round((completedThisWeek / prescribed) * 100);

                // Bilateral
                const rightAvg = avg(bilateral.right.map((s) => s.metrics.peakGripForce));
                const leftAvg  = avg(bilateral.left.map((s) => s.metrics.peakGripForce));
                const symmetryRatio = leftAvg > 0 ? Math.round((rightAvg / leftAvg) * 100) : 0;

                setData({
                    gripTrend,
                    adherencePct,
                    completedThisWeek,
                    prescribed,
                    avgGrip:             avg(last7.map((s) => s.metrics.peakGripForce)),
                    peakGrip:            Math.max(0, ...last7.map((s) => s.metrics.peakGripForce ?? 0)),
                    avgReactionMs:       avg(last7.map((s) => s.metrics.reactionTimeMs)),
                    avgCognitiveAccuracy: avg(last7.map((s) => s.metrics.cognitiveAccuracyPercent)),
                    rightHandAvg:        rightAvg,
                    leftHandAvg:         leftAvg,
                    symmetryRatio,
                    gripImprovementPct,
                });
            } catch (err: any) {
                setError(err.message ?? "Failed to load analytics");
            } finally {
                setLoading(false);
            }
        }

        fetch();
    }, [uid]);

    return { data, loading, error };
}