import { NextResponse } from "next/server";
import { askGemini  } from "../../lib/ai/gemini";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

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

    const prompt = `
            You are an AI Clinical Assistant supporting a rehabilitation doctor.
            
            Here is the current patient overview:
            ${patientsSummary}
            
            Doctor question:
            "${message}"
            
            Provide analytical insights.
            Identify risks and recommendations.
        `;

    const response = await generateOnce(prompt);

    return NextResponse.json({ reply: response });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { reply: "Error generating AI response." },
      { status: 500 },
    );
  }
}
