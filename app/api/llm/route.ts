import { NextResponse } from "next/server";
import { askGemini } from "@/app/lib/ai/gemini";
import { getUser } from "@/app/lib/db/users";
import { getRecentSessions } from "@/app/lib/db/sessions";

export async function POST(req: Request) {
    try {
        const { message, uid } = await req.json();

        const user = await getUser(uid);
        const sessions = await getRecentSessions(uid);

        const prompt = `
        Patient name: ${user?.name}
        Recent sessions: ${JSON.stringify(sessions)}
        Question: ${message}
        `;

        const aiReply = await askGemini(prompt);

        return NextResponse.json({ reply: aiReply });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "AI failed" }, { status: 500 });
    }
}