// app/lib/utils/metrics.ts
import { GameSession, PatientData } from "../db/types";

// ─── 1. LEVEL & XP LOGIC ─────────────────────────────────────────────────────
// Levels 1-2: Rhythm Reef | Levels 3-5: Synapse Racer
const XP_THRESHOLDS = [0, 500, 1500, 3000, 6000, 10000];

export function computeLevel(totalXp: number): number {
  // Returns current level based on XP (e.g., 2450 XP = Level 3)
  return XP_THRESHOLDS.filter(threshold => totalXp >= threshold).length;
}

export function getXpToNextLevel(totalXp: number): { current: number; next: number; remaining: number; percent: number } {
  const currentLevel = computeLevel(totalXp);
  // Cap at max level
  if (currentLevel >= XP_THRESHOLDS.length) {
    return { current: totalXp, next: totalXp, remaining: 0, percent: 100 };
  }
  
  const nextThreshold = XP_THRESHOLDS[currentLevel];
  const prevThreshold = XP_THRESHOLDS[currentLevel - 1] || 0;
  
  const remaining = Math.max(0, nextThreshold - totalXp);
  const levelRange = nextThreshold - prevThreshold;
  const xpInCurrentLevel = totalXp - prevThreshold;
  
  const percent = levelRange > 0 ? Math.min(100, Math.round((xpInCurrentLevel / levelRange) * 100)) : 100;

  return { current: totalXp, next: nextThreshold, remaining, percent };
}

// ─── 2. STREAK LOGIC ─────────────────────────────────────────────────────────

export function calculateStreak(sessions: GameSession[]): number {
  if (!sessions || sessions.length === 0) return 0;

  // Get unique calendar days where a session lasted at least 1 minute
  const completedDays = new Set(
    sessions
      .filter(s => s.durationSeconds > 60)
      .map(s => s.timestamp.toDate().toDateString())
  );

  let streak = 0;
  const checkDate = new Date();

  // If they haven't played today, we check yesterday to see if streak is still alive
  if (!completedDays.has(checkDate.toDateString())) {
    checkDate.setDate(checkDate.getDate() - 1);
    if (!completedDays.has(checkDate.toDateString())) {
      return 0; // Streak broken
    }
  }

  // Count backwards continuously
  while (completedDays.has(checkDate.toDateString())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

// ─── 3. ADHERENCE & IMPROVEMENT LOGIC ────────────────────────────────────────

export function calculateWeeklyAdherence(sessions: GameSession[], prescribedPerWeek: number = 5): number {
  if (prescribedPerWeek === 0) return 100;
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const completedThisWeek = sessions.filter(s => 
    s.durationSeconds > 60 && s.timestamp.toDate() >= oneWeekAgo
  ).length;

  return Math.min(100, Math.round((completedThisWeek / prescribedPerWeek) * 100));
}

export function calculateGripImprovement(sessions: GameSession[]): number {
  const validSessions = sessions
    .filter(s => s.metrics?.peakGripForce !== undefined && s.metrics.peakGripForce > 0)
    .sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);

  if (validSessions.length < 2) return 0;

  const baseline = validSessions[0].metrics.peakGripForce!;
  const current = validSessions[validSessions.length - 1].metrics.peakGripForce!;

  return Math.round(((current - baseline) / baseline) * 100);
}

// ─── 4. TROPHY / MILESTONE EVALUATOR ─────────────────────────────────────────

export interface Trophy {
  id: string;
  title: string;
  description: string;
  isUnlocked: boolean;
  icon: string;
}

export function evaluateTrophies(patient: PatientData, sessions: GameSession[]): Trophy[] {
  const streak = calculateStreak(sessions);
  
  // Extract metrics based on the ReViveX Game Metrics PDF
  const peakGripAllTime = sessions.length > 0 
    ? Math.max(...sessions.map(s => s.metrics?.peakGripForce || 0)) 
    : 0;
  
  // Cognitive accuracy (N_correct / N_total * 100)
  const perfectAccuracySessions = sessions.filter(s => 
    (s.metrics?.cognitiveAccuracyPercent || 0) >= 90
  ).length;

  // Endurance (F_end / F_start * 100). If it drops less than 10%, that's clinical mastery.
  const highEnduranceSessions = sessions.filter(s =>
    s.metrics?.muscleEnduranceDropPercent !== undefined && 
    s.metrics.muscleEnduranceDropPercent <= 10
  ).length;

  return [
    {
      id: "first_session",
      title: "First Session",
      description: "Completed your first rehab session",
      isUnlocked: sessions.length > 0,
      icon: "🎯"
    },
    {
      id: "streak_3",
      title: "3-Day Streak",
      description: "Played 3 consecutive days",
      isUnlocked: streak >= 3,
      icon: "🔥"
    },
    {
      id: "streak_7",
      title: "7-Day Streak",
      description: "Play 7 consecutive days",
      isUnlocked: streak >= 7,
      icon: "🏆"
    },
    {
      id: "iron_squeeze",
      title: "Iron Squeeze",
      description: "Reached 1.0 kPa peak grip force",
      isUnlocked: peakGripAllTime >= 1.0, 
      icon: "💪"
    },
    {
      id: "perfect_accuracy",
      title: "Perfect Accuracy",
      description: "Scored 90%+ cognitive accuracy in a session",
      isUnlocked: perfectAccuracySessions > 0,
      icon: "⚡"
    },
    {
      id: "endurance_master",
      title: "Endurance Master",
      description: "Maintained 90%+ grip endurance throughout a full session",
      isUnlocked: highEnduranceSessions > 0,
      icon: "🔋"
    }
  ];
}