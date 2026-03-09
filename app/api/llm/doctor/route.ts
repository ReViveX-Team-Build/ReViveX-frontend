import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUser } from "@/app/lib/db/users";
import { getPatientsByDoctor } from "@/app/lib/db/users";
import { getHistoryForAI, saveMessage } from "@/app/lib/db/conversations";
import { getCohortStats } from "@/app/lib/db/patients";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const MODEL = "gemini-2.5-flash";

export async function POST(req: Request) {
    try {
      const { message, uid, mode = "chat" } = await req.json();
  
      if (!message || !uid) {
        return NextResponse.json(
          { error: "message and uid required" },
          { status: 400 }
        );
      }

        const [doctor, patients, history] = await Promise.all([
            getUser(uid),
            getPatientsByDoctor(uid),
            getHistoryForAI(uid, 16),
        ]);

        const cohort = await getCohortStats(uid);

        const doctorName = doctor ? (doctor as any).name ?? "Doctor" : "Doctor";

        const systemPrompt = buildDoctorPrompt(doctorName, cohort, mode);

        const model = genAI.getGenerativeModel({
            model: MODEL,
            systemInstruction: systemPrompt,
        });

        const firstUserIdx = history.findIndex((m) => m.role === "user");
        const geminiHistory = (firstUserIdx > 0 ? history.slice(firstUserIdx) : history)
        .map((m) => ({
            role: m.role,
            parts: [{ text: m.content }],
        }));

        const chat = model.startChat({ history: geminiHistory });
        const result = await chat.sendMessage(message);
        const reply = result.response.text();

        await Promise.all([
            saveMessage(uid, "user", message),
            saveMessage(uid, "model", reply),
        ]);

        return NextResponse.json({ reply });

    } catch (err: any) {
        console.error("Doctor LLM Route Error:", err);
        return NextResponse.json(
        { error: err.message ?? "AI failed to respond" },
        { status: 500 }
        );
    }
    }

function buildDoctorPrompt(
    doctorName: string,
    cohort: Awaited<ReturnType<typeof getCohortStats>>,
    mode: string
  ): string {
  
    const base = `
  You are ReViveX Clinical AI, a medical decision-support assistant for Dr. ${doctorName}.
  
  COHORT OVERVIEW:
  - Total active patients: ${cohort.totalPatients}
  - Average adherence this week: ${cohort.avgAdherencePercent}%
  - High adherence (>80%): ${cohort.highAdherence} patients
  - Medium adherence (50-80%): ${cohort.mediumAdherence} patients  
  - Low adherence (<50%): ${cohort.lowAdherence} patients
  - Missed sessions this week: ${cohort.missedSessionsTotal}
  - Devices currently offline: ${cohort.devicesOffline}
  - Average grip improvement this week: ${cohort.avgGripImprovement > 0 ? "+" : ""}${cohort.avgGripImprovement}%
  
  PATIENTS REQUIRING ATTENTION (declining adherence):
  ${
    cohort.decliningPatients.length > 0
      ? cohort.decliningPatients
          .map(
            (p, i) =>
              `${i + 1}. ${p.name} (${p.uid}) — ${p.condition}, adherence: ${p.adherencePercent}%, last session: ${
                p.lastSessionDate
                  ? p.lastSessionDate.toLocaleDateString()
                  : "never"
              }`
          )
          .join("\n")
      : "No patients currently flagged as declining."
  }
  `;

  const modeInstructions: Record<string, string> = {
    chat: `
You are a clinical decision-support tool. Your role:
- Provide evidence-based rehabilitation insights
- Reference specific patient data from the cohort when available
- Flag patterns that suggest protocol adjustment needed
- Keep responses concise and clinical in tone
- You CAN identify at-risk patients and suggest interventions
- Never make final medical decisions — support the doctor's judgment
- Do not discuss patients not assigned to this doctor
`,
    weekly_summary: `
Generate a structured weekly cohort summary.
Return a clear, formatted report with:
1. A brief executive summary (2-3 sentences)
2. Key insights (3 bullet points, data-backed)
3. Patients requiring immediate attention (by name and why)
4. One recommended action for this week

Use plain text formatting, not JSON. Be clinical and direct.
`,
    triage: `
Identify the top patients most at risk from the declining list.
For each patient:
- State their name and condition
- Explain specifically WHY they are at risk (adherence %, days since last session)
- Suggest ONE concrete intervention (e.g. "Send a check-in message", "Reduce difficulty to re-engage")

Be direct. Prioritize worst-adherence patients first.
`,
  };

  return base + (modeInstructions[mode] ?? modeInstructions.chat);
}