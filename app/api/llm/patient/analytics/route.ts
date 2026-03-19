// app/api/llm/patient/analytics/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getLast30DaySessions, getSessionsForBothHands } from "@/app/lib/db/sessions";
import { getPatientData, getActiveProtocol } from "@/app/lib/db/users";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const MODEL = "gemini-2.5-flash";

export async function POST(req: Request) {
    try {
        const { uid, type } = await req.json();
        // type: "weekly_report" | "recovery_prediction"

        if (!uid || !type) {
            return NextResponse.json({ error: "uid and type required" }, { status: 400 });
        }

        // Fetch data
        const [patient, sessions30, bilateral, protocol] = await Promise.all([
            getPatientData(uid),
            getLast30DaySessions(uid),
            getSessionsForBothHands(uid, 20),
            getActiveProtocol(uid),
        ]);

        const last7 = sessions30.slice(0, 7);

        const avg = (nums: (number | undefined)[]): number => {
            const valid = nums.filter((n): n is number => n !== undefined && !isNaN(n));
            if (!valid.length) return 0;
            return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
        };

        const gripValues     = sessions30.map((s) => s.metrics.peakGripForce).filter((v): v is number => v != null);
        const gripStart      = gripValues.at(-1) ?? 0;
        const gripCurrent    = gripValues.at(0) ?? 0;
        const gripImprovement = gripStart > 0 ? Math.round(((gripCurrent - gripStart) / gripStart) * 100) : 0;
        const prescribed     = protocol?.sessionsPerWeek ?? 5;
        const completedWeek  = last7.filter((s) => s.durationSeconds > 60).length;
        const adherence      = Math.round((completedWeek / prescribed) * 100);
        const rightAvg       = avg(bilateral.right.map((s) => s.metrics.peakGripForce));
        const leftAvg        = avg(bilateral.left.map((s) => s.metrics.peakGripForce));
        const symmetry       = leftAvg > 0 ? Math.round((rightAvg / leftAvg) * 100) : 0;

        const patientContext = `
Patient: ${patient?.name ?? "Patient"} | Condition: ${patient?.condition ?? "Unknown"}
This week: ${completedWeek}/${prescribed} sessions (${adherence}% adherence)
Avg grip: ${avg(last7.map((s) => s.metrics.peakGripForce))} kPa | Peak: ${Math.max(0, ...last7.map((s) => s.metrics.peakGripForce ?? 0))} kPa
Reaction time: ${avg(last7.map((s) => s.metrics.reactionTimeMs))}ms
Cognitive accuracy: ${avg(last7.map((s) => s.metrics.cognitiveAccuracyPercent))}%
Endurance drop: ${avg(last7.map((s) => s.metrics.muscleEnduranceDropPercent))}%
30-day grip: ${gripStart} → ${gripCurrent} kPa (${gripImprovement > 0 ? "+" : ""}${gripImprovement}%)
Bilateral: Right ${rightAvg} kPa / Left ${leftAvg} kPa (${symmetry}% symmetry)
Protocol: ${protocol?.gameId ?? "unassigned"} | ${protocol?.targetHand ?? "right"} hand | ${protocol?.settings?.difficulty ?? "medium"} difficulty
`;

        const prompts: Record<string, string> = {
            weekly_report: `
You are ReViveX, a rehabilitation AI assistant.
Generate a concise weekly performance report for this patient.

${patientContext}

Format:
- Opening: one warm personal sentence
- 3-4 clinical observations (data-backed, specific numbers)
- One key recommendation for next week
- One motivating closing sentence

Keep it under 200 words. Plain text, no markdown headers.
`,
            recovery_prediction: `
You are ReViveX, a rehabilitation AI assistant.
Based on this patient's data, generate a short recovery trend prediction.

${patientContext}

Format:
- Current trajectory: one sentence describing their progress direction
- Predicted milestone: what they're likely to achieve in the next 2-4 weeks if they maintain current effort
- Risk flag: one sentence on what to watch out for (if any)
- Encouragement: one closing sentence

Keep it under 150 words. Plain text, no markdown.
`,
        };

        const prompt = prompts[type];
        if (!prompt) {
            return NextResponse.json({ error: "Invalid type" }, { status: 400 });
        }

        const model  = genAI.getGenerativeModel({ model: MODEL });
        const result = await model.generateContent(prompt);
        const text   = result.response.text();

        return NextResponse.json({ text });

    } catch (err: any) {
        console.error("Analytics LLM Error:", err);
        return NextResponse.json({ error: err.message ?? "AI failed" }, { status: 500 });
    }
}