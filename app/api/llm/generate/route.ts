import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPatientData } from "@/app/lib/db/users";
import { getRecentSessions } from "@/app/lib/db/sessions";
import { getInboxMessages } from "@/app/lib/db/communications";
import { GameSession, PatientData } from "@/app/lib/db/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const MODEL = "gemini-2.5-flash";

export async function POST(req: Request) {
    try {
      const { patientUid, type } = await req.json();
      // type = "feedback" | "instruction"
  
      if (!patientUid || !type) {
        return NextResponse.json(
          { error: "patientUid and type required" },
          { status: 400 }
        );
      }

      const [patient, sessions, messages] = await Promise.all([
        getPatientData(patientUid),
        getRecentSessions(patientUid, 7),
        getInboxMessages(patientUid),
      ]);

      if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }

      const prompt = buildGeneratePrompt(patient, sessions, type);

      const model = genAI.getGenerativeModel({ model: MODEL });
      const result = await model.generateContent(prompt);
      const generated = result.response.text();

      return NextResponse.json({ generated });

    } catch (err: any) {
        console.error("Generate LLM Route Error:", err);
        return NextResponse.json(
          { error: err.message ?? "Generation failed" },
          { status: 500 }
        );
      }
    }

function buildGeneratePrompt(
    patient: PatientData,
    sessions: GameSession[],
    type: "feedback" | "instruction"
  ): string {
        const avg = (nums: (number | undefined)[]): number => {
            const valid = nums.filter((n): n is number => n != null && !isNaN(n));
            return valid.length
            ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10
            : 0;
        };

        const completed = sessions.filter((s) => s.durationSeconds > 60).length;
        const adherence = Math.round((completed / 7) * 100);
        const peakGrip = Math.max(0, ...sessions.map((s) => s.metrics.peakGripForce ?? 0));
        const avgCognitive = avg(sessions.map((s) => s.metrics.cognitiveAccuracyPercent));
        const avgEndurance = avg(sessions.map((s) => s.metrics.muscleEnduranceDropPercent));

        const patientSummary = `
        Patient: ${patient.name} — ${patient.condition}
        Adherence this week: ${adherence}% (${completed}/7 sessions completed)
        Peak grip force: ${peakGrip} kPa
        Cognitive accuracy: ${avgCognitive}%
        Endurance drop: ${avgEndurance}%
        Active streak: ${patient.gamification?.currentStreak ?? 0} days
        `;

        if (type === "feedback") {
            return `${patientSummary}
        You are writing a feedback message FROM a doctor TO their patient in a rehabilitation app.
        
        Requirements:
        - Address the patient directly by first name (${patient.name.split(" ")[0]})
        - Reference 2-3 SPECIFIC metrics from the data above
        - Acknowledge something positive first
        - Mention one area to improve if the data shows it (keep it encouraging, not critical)
        - Under 80 words
        - Tone: warm, professional, like a caring doctor who actually reviewed the chart
        - Do NOT start with "Dear" — start directly with their first name
        - Do NOT use generic phrases like "keep up the good work" without context
        `;
          }

          return `${patientSummary}
          You are writing a clinical instruction FROM a doctor TO their patient in a rehabilitation app.
          This instruction will be marked IMPORTANT and requires the patient to acknowledge it.
          
          Requirements:
          - Address the patient directly by first name (${patient.name.split(" ")[0]})
          - State a specific protocol change or required action
          - Reference WHY, based on their data (e.g. "your adherence has dropped to X%")
          - Under 70 words
          - Tone: clear, direct, clinical but kind
          - Start with the action/change, not pleasantries
          `;
    }