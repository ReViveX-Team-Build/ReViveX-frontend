// app/lib/hooks/useAnalytics.ts
import { useEffect, useState } from "react";
import { getLast30DaySessions, getSessionsForBothHands } from "@/app/lib/db/sessions";
import { getActiveProtocol } from "@/app/lib/db/users";

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

    // Week-over-week grip trend (no Gemini)
    weekOverWeekGripPct: number | null; // null = not enough data
}

export function useAnalytics(uid: string | undefined) {
    const [data, setData]       = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

    useEffect(() => {
        if (!uid) { setLoading(false); return; }

        async function load() {
            try {
                const [sessions30, bilateral, protocol] = await Promise.all([
                    getLast30DaySessions(uid!),
                    getSessionsForBothHands(uid!, 20),
                    getActiveProtocol(uid!),
                ]);

                const avg = (nums: (number | undefined)[]): number => {
                    const valid = nums.filter((n): n is number => n !== undefined && !isNaN(n));
                    if (!valid.length) return 0;
                    return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
                };

                // Split into this week vs last week
                const thisWeek = sessions30.slice(0, 7);
                const lastWeek = sessions30.slice(7, 14);

                // Week-over-week grip trend
                const thisWeekGrip = avg(thisWeek.map((s) => s.metrics.peakGripForce));
                const lastWeekGrip = avg(lastWeek.map((s) => s.metrics.peakGripForce));
                const weekOverWeekGripPct =
                    lastWeekGrip > 0 && thisWeekGrip > 0
                        ? Math.round(((thisWeekGrip - lastWeekGrip) / lastWeekGrip) * 100)
                        : null;

                // Grip trend for chart
                const gripTrend = sessions30
                    .slice()
                    .reverse()
                    .map((s) => ({
                        date: s.timestamp.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                        grip: s.metrics.peakGripForce ?? 0,
                    }));

                // 30-day improvement
                const gripValues  = sessions30.map((s) => s.metrics.peakGripForce).filter((v): v is number => v != null);
                const gripStart   = gripValues.at(-1) ?? 0;
                const gripCurrent = gripValues.at(0) ?? 0;
                const gripImprovementPct = gripStart > 0
                    ? Math.round(((gripCurrent - gripStart) / gripStart) * 100)
                    : 0;

                // Adherence
                const prescribed        = protocol?.sessionsPerWeek ?? 5;
                const completedThisWeek = thisWeek.filter((s) => s.durationSeconds > 60).length;
                const adherencePct      = Math.round((completedThisWeek / prescribed) * 100);

                // Bilateral
                const rightAvg      = avg(bilateral.right.map((s) => s.metrics.peakGripForce));
                const leftAvg       = avg(bilateral.left.map((s) => s.metrics.peakGripForce));
                const symmetryRatio = leftAvg > 0 ? Math.round((rightAvg / leftAvg) * 100) : 0;

                setData({
                    gripTrend,
                    adherencePct,
                    completedThisWeek,
                    prescribed,
                    avgGrip:              avg(thisWeek.map((s) => s.metrics.peakGripForce)),
                    peakGrip:             Math.max(0, ...thisWeek.map((s) => s.metrics.peakGripForce ?? 0)),
                    avgReactionMs:        avg(thisWeek.map((s) => s.metrics.reactionTimeMs)),
                    avgCognitiveAccuracy: avg(thisWeek.map((s) => s.metrics.cognitiveAccuracyPercent)),
                    rightHandAvg:         rightAvg,
                    leftHandAvg:          leftAvg,
                    symmetryRatio,
                    gripImprovementPct,
                    weekOverWeekGripPct,
                });
            } catch (err: any) {
                setError(err.message ?? "Failed to load analytics");
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [uid]);

    return { data, loading, error };
}