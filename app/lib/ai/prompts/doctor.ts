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