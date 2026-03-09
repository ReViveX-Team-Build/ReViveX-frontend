import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPatientData } from "@/app/lib/db/users";
import { getRecentSessions } from "@/app/lib/db/sessions";
import { getInboxMessages } from "@/app/lib/db/communications";
import { GameSession, PatientData } from "@/app/lib/db/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const MODEL = "gemini-2.5-flash";