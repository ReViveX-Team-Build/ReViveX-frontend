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

    const [patient, sessions, bilateral, doctorMessages, history, protocol] =
    await Promise.all([
      getPatientData(uid),
      getRecentSessions(uid, 30),
      getSessionsForBothHands(uid, 20),
      getInboxMessages(uid),
      getHistoryForAI(uid, 16),
      getActiveProtocol(uid),
    ]);

  const ctx = buildPatientContext(patient, sessions, bilateral, protocol, doctorMessages);

  const systemPrompt = buildPatientPrompt(ctx, mode);

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
        console.error("Patient LLM Route Error:", err);
        return NextResponse.json(
          { error: err.message ?? "AI failed to respond" },
          { status: 500 }
        );
      }
    }
    
    function buildPatientContext(
      patient: PatientData | null,
      sessions: GameSession[],
      bilateral: { left: GameSession[]; right: GameSession[] },
      protocol: TherapyProtocol | null,
      doctorMessages: any[]
    ) {

        const last7 = sessions.slice(0, 7);
        const last30 = sessions.slice(0, 30);
      
        const avg = (nums: (number | undefined)[]): number => {
          const valid = nums.filter((n): n is number => n !== undefined && !isNaN(n));
          if (!valid.length) return 0;
          return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
        };
      
        const gripValues = last30
          .map((s) => s.metrics.peakGripForce)
          .filter((v): v is number => v != null);
      
        const gripStart = gripValues.at(-1) ?? 0;
        const gripCurrent = gripValues.at(0) ?? 0;
      
        const gripImprovementPct =
          gripStart > 0
            ? Math.round(((gripCurrent - gripStart) / gripStart) * 100)
            : 0;
      
        const rightAvg = avg(bilateral.right.map((s) => s.metrics.peakGripForce));
        const leftAvg  = avg(bilateral.left.map((s) => s.metrics.peakGripForce));
      
        const symmetryRatio =
          leftAvg > 0 ? Math.round((rightAvg / leftAvg) * 100) : 0;
      
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
      
        const prescribed = protocol?.sessionsPerWeek ?? 5;
        const completedThisWeek = last7.filter((s) => s.durationSeconds > 60).length;
      
        const adherencePct = Math.round((completedThisWeek / prescribed) * 100);
      
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
          avgGrip: avg(last7.map((s) => s.metrics.peakGripForce)),
          peakGrip: Math.max(0, ...last7.map((s) => s.metrics.peakGripForce ?? 0)),
          avgReactionMs: avg(last7.map((s) => s.metrics.reactionTimeMs)),
          avgCognitiveAccuracy: avg(last7.map((s) => s.metrics.cognitiveAccuracyPercent)),
          avgEnduranceDrop: avg(last7.map((s) => s.metrics.muscleEnduranceDropPercent)),
          gripStart,
          gripCurrent,
          gripImprovementPct,
          rightHandAvg: rightAvg,
          leftHandAvg: leftAvg,
          symmetryRatio,
          currentGame: protocol?.gameId ?? "unassigned",
          targetHand: protocol?.targetHand ?? "right",
          difficulty: protocol?.settings?.difficulty ?? "medium",
          sessionsPerWeek: prescribed,
          lastInstruction,
          lastFeedback,
        };
      }
      
      function buildPatientPrompt(ctx: ReturnType<typeof buildPatientContext>, mode: string): string {
      
        const base = `
      You are ReViveX, a warm and supportive AI rehabilitation companion for ${ctx.name}.
      ...
      `;
      
        const modeInstructions: Record<string, string> = {
          chat: `...`,
          weekly_analysis: `...`,
          home_insight: `...`,
          progress_insight: `...`,
        };
      
        return base + (modeInstructions[mode] ?? modeInstructions.chat);
      }