import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUser } from "@/app/lib/db/users";
import { getPatientsByDoctor } from "@/app/lib/db/users";
import { getHistoryForAI, saveMessage } from "@/app/lib/db/conversations";
import { getCohortStats } from "@/app/lib/db/patients";