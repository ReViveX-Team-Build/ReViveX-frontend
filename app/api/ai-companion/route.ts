import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/app/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

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

        // Mock userId for now
        const userId = "patient_mock_001";

// Fetch patient info
        const userSnap = await getDoc(doc(db, "users", userId));
        const userData = userSnap.data();

// Fetch last 3 game sessions
        const sessionsQuery = query(
            collection(db, "game_sessions"),
            where("userId", "==", userId),
            orderBy("timestamp", "desc"),
            limit(3)
        );

        const sessionSnap = await getDocs(sessionsQuery);

        const sessions = sessionSnap.docs.map(doc => doc.data());

// Build context string
        let context = `Patient Name: ${userData?.name}
            Streak: ${userData?.streak}
            Recent Sessions:\n`;

        sessions.forEach((s, index) => {
            context += `Session ${index + 1}: Score ${s.score}, Accuracy ${s.metrics?.accuracy}%\n`;
        });

// Create prompt
        const fullPrompt = `
                You are a rehabilitation AI companion.
                
                Here is patient data:
                ${context}
                
                Patient asks:
                ${message}
                
                Give a supportive, medically responsible answer.
                `;

        const result = await model.generateContent(fullPrompt);
        const reply = result.response.text();

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