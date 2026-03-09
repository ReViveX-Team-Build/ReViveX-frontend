import { ProcessedPatientContext } from "../dataProcessor";

export function buildPatientSystemPrompt(
  ctx: ProcessedPatientContext,
  mode: "chat" | "weekly_analysis" | "home_insight" | "progress_insight"
): string {