import { NextResponse } from "next/server";
import { chatWithHistory } from "../../lib/ai/gemini"; 
import { getHistoryForAI } from "../../lib/db/conversations";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    // Extract the message, uid, and mode sent by useAiCompanion.ts
    const { message, uid } = await req.json();

    if (!uid) {
      return NextResponse.json(
        { error: "User ID (uid) is required to fetch history." }, 
        { status: 400 }
      );
    }

    // 1. Fetch the patient overview for the System Prompt
    const usersSnapshot = await getDocs(collection(db, "users"));
    let patientsSummary = "";

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.role === "patient") {
        patientsSummary += `
        Patient: ${data.name}
        Streak: ${data.streak || 0}
        XP: ${data.totalXp || 0}
        `;
      }
    });

    // 2. Define the System Instructions (Rules for the AI)
    const systemPrompt = `
      You are an AI Clinical Assistant supporting a rehabilitation doctor.
      
      Here is the current patient overview:
      ${patientsSummary}
      
      Provide analytical insights. Identify risks and recommendations based on the conversation context.
    `;

    // 3. Fetch the past conversation history for this specific user
    const history = await getHistoryForAI(uid);

    // 4. Send the System Prompt, the History, and the New Message to Gemini
    const response = await chatWithHistory(systemPrompt, history, message);
    
    // Return the response back to useAiCompanion.ts
    return NextResponse.json({ reply: response });

  } catch (error) {
    console.error("AI Route Error:", error);
    return NextResponse.json(
      { error: "Error generating AI response. Please check server logs." },
      { status: 500 },
    );
  }
}