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