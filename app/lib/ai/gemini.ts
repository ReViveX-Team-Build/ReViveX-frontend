import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in .env.local");
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


export const GEMINI_MODEL = "gemini-2.0-flash";

export async function generateOnce(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function chatWithHistory(
  systemPrompt: string,
  history: { role: "user" | "model"; content: string }[],
  newMessage: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
  });

  // Gemini requires history to start with a user message
  const geminiHistory = history
    .filter((_, i) => !(i === 0 && history[0].role === "model"))
    .map((m) => ({ role: m.role, parts: [{ text: m.content }] }));

  const chat = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessage(newMessage);
  return result.response.text();
}