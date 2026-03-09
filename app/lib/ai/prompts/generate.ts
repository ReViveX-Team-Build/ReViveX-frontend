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