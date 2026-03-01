import { NextResponse } from "next/server";
import { askGemini } from "../../lib/ai/gemini";

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        const prompt = `
        You are a clinical AI assistant supporting a rehabilitation doctor.

        The doctor asked:
        "${message}"

        Provide professional, analytical insight.
        `;

        const response = await askGemini(prompt);

        return NextResponse.json({ reply: response });

    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { reply: "Error generating AI response." },
            { status: 500 }
        );
    }
}