import { ProcessedPatientContext } from "../dataProcessor";

export function buildGeneratePrompt(
    patient: { name: string; id: string; condition: string; },
    ctx: ProcessedPatientContext,
    type: 'feedback' | 'instruction'
  ): string {
  
    const patientSummary = `
  Patient: ${patient.name} (${patient.id}) — ${patient.condition}
  Adherence: ${ctx.patient.adherencePercent}% (${ctx.thisWeek.sessionsCompleted}/${ctx.thisWeek.sessionsPrescribed} sessions this week)
  Peak grip force: ${ctx.thisWeek.peakGripForce} kPa (${ctx.trend30Days.gripImprovementPct > 0 ? '+' : ''}${ctx.trend30Days.gripImprovementPct}% since baseline)
  Cognitive accuracy: ${ctx.thisWeek.avgCognitiveAccuracy}%
  Endurance trend: ${ctx.trend30Days.enduranceTrend}
  Streak: ${ctx.patient.streak} days
  Missed this week: ${ctx.thisWeek.missedDays.length} days
  Current protocol: ${ctx.doctorContext.currentProtocol}, ${ctx.doctorContext.difficulty}, ${ctx.doctorContext.targetHand} hand
  `;

  if (type === 'feedback') {
    return `${patientSummary}
Write a warm, encouraging feedback message from their doctor to this patient.
- Address the patient directly by first name
- Reference 2-3 SPECIFIC metrics from their data above
- Mention something to improve if applicable
- Keep it under 80 words
- Tone: professional but warm, like a caring doctor who reviewed their chart
- Do NOT start with "Dear" — start directly with their name
`;
  }

  return `${patientSummary}
Write a clear clinical instruction from their doctor to this patient.
- Address the patient directly  
- State the specific protocol change or action required
- Reference WHY based on their data
- Keep it under 70 words
- Tone: clear, clinical, authoritative but kind
- This will be marked as IMPORTANT and requires patient acknowledgment
`;
}