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