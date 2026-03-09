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