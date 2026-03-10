// app/api/llm/patient/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPatientData, getActiveProtocol } from "@/app/lib/db/users";
import { getRecentSessions, getSessionsForBothHands } from "@/app/lib/db/sessions";
import { getInboxMessages } from "@/app/lib/db/communications";
import { getHistoryForAI, saveMessage } from "@/app/lib/db/conversations";
import { GameSession, PatientData, TherapyProtocol } from "@/app/lib/db/types";

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

    // ── 1. Fetch all needed data in parallel ──────────────────────────────
    const [patient, sessions, bilateral, doctorMessages, history, protocol] =
      await Promise.all([
        getPatientData(uid),
        getRecentSessions(uid, 30),
        getSessionsForBothHands(uid, 20),
        getInboxMessages(uid),
        getHistoryForAI(uid, 16),
        getActiveProtocol(uid),
      ]);

    // ── 2. Pre-process data — Gemini NEVER sees rawSensorData ─────────────
    const ctx = buildPatientContext(patient, sessions, bilateral, protocol, doctorMessages);

    // ── 3. Build system prompt ────────────────────────────────────────────
    const systemPrompt = buildPatientPrompt(ctx, mode);

    // ── 4. Call Gemini with chat history ──────────────────────────────────
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

    // ── 5. Save both turns ────────────────────────────────────────────────
    await Promise.all([
      saveMessage(uid, "user", message),
      saveMessage(uid, "model", reply),
    ]);

    return NextResponse.json({ reply });

  } catch (err: any) {
    console.error("Patient LLM Route Error:", err);
    return NextResponse.json(
      { error: err.message ?? "AI failed to respond" },
      { status: 500 }
    );
  }
}

// ── Pre-process session data before it touches Gemini ────────────────────────
// rawSensorData arrays are NEVER sent — only derived stats

function buildPatientContext(
  patient: PatientData | null,
  sessions: GameSession[],
  bilateral: { left: GameSession[]; right: GameSession[] },
  protocol: TherapyProtocol | null,
  doctorMessages: any[]
) {
  const last7 = sessions.slice(0, 7);
  const last30 = sessions.slice(0, 30);

  // Safe numeric average
  const avg = (nums: (number | undefined)[]): number => {
    const valid = nums.filter((n): n is number => n !== undefined && !isNaN(n));
    if (!valid.length) return 0;
    return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
  };

  // Grip trend
  const gripValues = last30
    .map((s) => s.metrics.peakGripForce)
    .filter((v): v is number => v != null);
  const gripStart = gripValues.at(-1) ?? 0;
  const gripCurrent = gripValues.at(0) ?? 0;
  const gripImprovementPct =
    gripStart > 0
      ? Math.round(((gripCurrent - gripStart) / gripStart) * 100)
      : 0;

  // Bilateral
  const rightAvg = avg(bilateral.right.map((s) => s.metrics.peakGripForce));
  const leftAvg  = avg(bilateral.left.map((s) => s.metrics.peakGripForce));
  const symmetryRatio =
    leftAvg > 0 ? Math.round((rightAvg / leftAvg) * 100) : 0;

  // Streak (calendar days)
  const completedDays = new Set(
    sessions
      .filter((s) => s.durationSeconds > 60)
      .map((s) => s.timestamp.toDate().toDateString())
  );
  let streak = 0;
  const check = new Date();
  while (completedDays.has(check.toDateString())) {
    streak++;
    check.setDate(check.getDate() - 1);
  }

  // Adherence this week
  const prescribed = protocol?.sessionsPerWeek ?? 5;
  const completedThisWeek = last7.filter((s) => s.durationSeconds > 60).length;
  const adherencePct = Math.round((completedThisWeek / prescribed) * 100);

  // Doctor context (latest instruction + feedback only — no full content to save tokens)
  const lastInstruction =
    doctorMessages.find((m: any) => m.type === "instruction")?.content?.slice(0, 200) ?? null;
  const lastFeedback =
    doctorMessages.find((m: any) => m.type === "feedback")?.content?.slice(0, 200) ?? null;

  return {
    name: patient?.name ?? "Patient",
    condition: patient?.condition ?? "Unknown",
    totalXp: patient?.gamification?.totalXp ?? 0,
    streak,
    adherencePct,
    completedThisWeek,
    prescribed,
    // This week
    avgGrip: avg(last7.map((s) => s.metrics.peakGripForce)),
    peakGrip: Math.max(0, ...last7.map((s) => s.metrics.peakGripForce ?? 0)),
    avgReactionMs: avg(last7.map((s) => s.metrics.reactionTimeMs)),
    avgCognitiveAccuracy: avg(last7.map((s) => s.metrics.cognitiveAccuracyPercent)),
    avgEnduranceDrop: avg(last7.map((s) => s.metrics.muscleEnduranceDropPercent)),
    // Trend
    gripStart,
    gripCurrent,
    gripImprovementPct,
    // Bilateral
    rightHandAvg: rightAvg,
    leftHandAvg: leftAvg,
    symmetryRatio,
    // Protocol
    currentGame: protocol?.gameId ?? "unassigned",
    targetHand: protocol?.targetHand ?? "right",
    difficulty: protocol?.settings?.difficulty ?? "medium",
    sessionsPerWeek: prescribed,
    // Doctor context
    lastInstruction,
    lastFeedback,
  };
}

// ── System prompt builder ─────────────────────────────────────────────────────
function buildPatientPrompt(ctx: ReturnType<typeof buildPatientContext>, mode: string): string {

  const base = `
You are ReViveX, a warm and supportive AI rehabilitation companion for ${ctx.name}.

PATIENT PROFILE:
- Condition: ${ctx.condition}
- Current XP: ${ctx.totalXp} | Active streak: ${ctx.streak} days
- Weekly adherence: ${ctx.adherencePct}% (${ctx.completedThisWeek}/${ctx.prescribed} sessions completed)

THIS WEEK'S PERFORMANCE:
- Average grip force: ${ctx.avgGrip} kPa | Peak: ${ctx.peakGrip} kPa
- Average reaction time: ${ctx.avgReactionMs}ms
- Cognitive accuracy: ${ctx.avgCognitiveAccuracy}%
- Muscle endurance drop: ${ctx.avgEnduranceDrop}%

30-DAY GRIP TREND:
- Start: ${ctx.gripStart} kPa → Current: ${ctx.gripCurrent} kPa (${ctx.gripImprovementPct > 0 ? "+" : ""}${ctx.gripImprovementPct}% improvement)

BILATERAL BALANCE:
- Right hand (affected): ${ctx.rightHandAvg} kPa
- Left hand (healthy): ${ctx.leftHandAvg} kPa
- Symmetry ratio: ${ctx.symmetryRatio}%

CURRENT PROTOCOL:
- Game: ${ctx.currentGame} | Hand: ${ctx.targetHand} | Difficulty: ${ctx.difficulty}
- Prescribed: ${ctx.sessionsPerWeek} sessions/week

DOCTOR'S LAST INSTRUCTION: "${ctx.lastInstruction ?? "None on file"}"
DOCTOR'S LAST FEEDBACK: "${ctx.lastFeedback ?? "None on file"}"
`;

  const modeInstructions: Record<string, string> = {
    chat: `
Your role as a companion:
- Be warm, encouraging, and personal — use ${ctx.name}'s first name occasionally
- Reference their ACTUAL data when relevant (never make up numbers)
- Keep replies under 120 words unless they ask for detail
- If they ask about pain or medical concerns, always advise them to contact their doctor
- Never override the doctor's protocol instructions
- Celebrate milestones genuinely and specifically
`,
    weekly_analysis: `
Generate a structured weekly analysis for ${ctx.name}.
Format it as a clear, readable report with:
1. A personal opening (one sentence)
2. 4-5 clinical observations (specific, data-backed, encouraging where possible)
3. One recommendation for next week
4. A motivating closing sentence

Use plain text. Be warm but clinical. Reference real numbers from their data above.
`,
    home_insight: `
Generate ONE short motivating phrase for ${ctx.name}'s home page card.
Requirements:
- Maximum 15 words
- Reference their actual streak (${ctx.streak} days) or completion rate (${ctx.completedThisWeek}/${ctx.prescribed} sessions)
- Encouraging and specific, not generic
- No quotes, just the phrase itself

Example good format: "5 sessions done this week — you're building real momentum, ${ctx.name.split(" ")[0]}!"
`,
    progress_insight: `
Generate a clinical insight for ${ctx.name}'s therapy games page.
Return ONLY this JSON (no markdown fences, no preamble):
{
  "insight": "One sentence about a specific improvement this week (max 20 words, use real numbers)",
  "nextStep": "One sentence about what they need to complete to unlock the next level (max 20 words)"
}
`,
  };

  return base + (modeInstructions[mode] ?? modeInstructions.chat);
}