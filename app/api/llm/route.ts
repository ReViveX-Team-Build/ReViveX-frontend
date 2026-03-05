import { NextResponse } from "next/server";
import { askGemini } from "@/app/lib/ai/gemini";
import { getUser } from "@/app/lib/db/users";
import { getRecentSessions } from "@/app/lib/db/sessions";

export async function POST(req: Request) {
  try {
    const { message, uid } = await req.json();

    if (!message || !uid) {
      return NextResponse.json(
        { error: "Message and UID are required" },
        { status: 400 }
      );
    }

    const user = await getUser(uid);
    const sessions = await getRecentSessions(uid, 3);

    const prompt = `
You are ReViveX, a supportive and medically responsible rehabilitation AI companion.

Patient Name: ${user && "name" in user ? user.name : "Patient"}

Recent Game Sessions:
${JSON.stringify(sessions)}

Patient Question:
${message}

Instructions:
- Answer clearly and concisely
- Reference session performance if helpful
- Be supportive and encouraging
`;

    const aiReply = await askGemini(prompt);

    return NextResponse.json({ reply: aiReply });

  } catch (err) {
    console.error("LLM Route Error:", err);
    return NextResponse.json({ error: "AI failed to respond" }, { status: 500 });
  }
}