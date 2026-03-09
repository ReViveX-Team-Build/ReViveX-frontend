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