import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function askGemini(systemPrompt: string, userMessage: string) {

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash"
  });

  const fullPrompt = `${systemPrompt}\n\nPatient asks: ${userMessage}`;

  const result = await model.generateContent(fullPrompt);

  return result.response.text();
}