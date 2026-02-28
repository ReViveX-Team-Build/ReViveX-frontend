import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        const genAI = new GoogleGenerativeAI(
            process.env.GEMINI_API_KEY as string
        );
        console.log("Gemini Key:", process.env.GEMINI_API_KEY);

        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
        });

        const result = await model.generateContent(message);

        const response = result.response.text();

        return NextResponse.json({ reply: response });
    } catch (error) {
        console.error("Gemini error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}