export interface ProcessedCohortContext {
    doctor: { name: string; totalPatients: number };
    cohort: {
      avgAdherence: number;
      decliningPatients: { name: string; id: string; adherence: number; lastSession: string }[];
      avgGripImprovement: number;
      missedSessionsThisWeek: number;
      devicesOffline: number;
    };
    weeklySnapshot: {
      totalSessionsCompleted: number;
      totalSessionsMissed: number;
      highAdherenceCount: number;
      lowAdherenceCount: number;
    };
  }

  export function buildDoctorSystemPrompt(
    ctx: ProcessedCohortContext,
    mode: "chat" | "weekly_summary" | "triage"
  ): string {
    const base = `
  You are ReViveX Clinical AI, assisting Dr. ${ctx.doctor.name}.
  Total active patients: ${ctx.doctor.totalPatients}
  Average cohort adherence: ${ctx.cohort.avgAdherence}%
  Average grip improvement this week: ${ctx.cohort.avgGripImprovement}%
  Missed sessions this week (cohort-wide): ${ctx.cohort.missedSessionsThisWeek}
  Devices currently offline: ${ctx.cohort.devicesOffline}
  
  Patients requiring attention (adherence below 70%):
  ${ctx.cohort.decliningPatients.map(
    (p) => `- ${p.name} (${p.id}): ${p.adherence}% adherence, last session: ${p.lastSession}`
  ).join("\n") || "- None currently"}
  
  This week: ${ctx.weeklySnapshot.totalSessionsCompleted} sessions completed, ${ctx.weeklySnapshot.totalSessionsMissed} missed.
  High adherence patients (>80%): ${ctx.weeklySnapshot.highAdherenceCount}
  Low adherence patients (<50%): ${ctx.weeklySnapshot.lowAdherenceCount}
  `;
  
    const dataPoints = ctx.doctor.totalPatients * 5 * 5;