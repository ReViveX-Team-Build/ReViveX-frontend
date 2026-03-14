// lib/ai/dataProcessor.ts
// Pre-computes everything BEFORE touching Gemini
// Rule: rawSensorData NEVER goes into a prompt

import { GameSession, PatientData, TherapyProtocol } from '../db/types';
import { Communication } from '../db/types';

export interface ProcessedPatientContext {
  patient: {
    name: string;
    condition: string;
    level: number;
    streak: number;
    totalXp: number;
    adherencePercent: number;
  };
  thisWeek: {
    sessionsCompleted: number;
    sessionsPrescribed: number;  // from protocol
    avgGripForce: number;
    peakGripForce: number;
    avgReactionMs: number;
    avgCognitiveAccuracy: number;
    avgEnduranceDrop: number;
    missedDays: string[];
  };
  trend30Days: {
    gripStart: number;       // oldest session in last 30
    gripCurrent: number;     // most recent session
    gripImprovementPct: number;
    enduranceTrend: 'improving' | 'stable' | 'declining';
    consistencyScore: number; // 0-100
  };
  bilateral: {
    rightHandAvg: number;
    leftHandAvg: number;
    symmetryRatio: number;    // rightAvg/leftAvg * 100
    projectedWeeksTo100: number;
  };
  sensorQuality: {
    // Derived from rawSensorData — NOT the raw array
    avgVariance: number;     // tremor indicator
    peakConsistency: number; // how repeatable their peak squeezes are
    fatiguePattern: 'early' | 'late' | 'uniform' | 'none';
  };
  doctorContext: {
    lastInstruction: string | null;
    lastFeedback: string | null;
    currentProtocol: string;
    targetHand: string;
    difficulty: string;
  };
}

export function processPatientData(
  sessions: GameSession[],
  patient: PatientData,
  protocol: TherapyProtocol | null,
  doctorMessages: Communication[]
): ProcessedPatientContext {
  
  const last7 = sessions.slice(0, 7);
  const last30 = sessions.slice(0, 30);
  
  // ── Streak calculation ──
  const streak = calculateStreak(sessions);
  
  // ── Adherence ──
  const prescribed = protocol ? 7 : 5; // sessions/week from protocol
  const completed = last7.filter(s => s.durationSeconds > 60).length;
  const adherencePct = Math.round((completed / prescribed) * 100);
  
  // ── Grip trend ──
  const gripValues = last30
    .map(s => s.metrics.peakGripForce)
    .filter(Boolean);
  const gripStart = gripValues[gripValues.length - 1] ?? 0;
  const gripCurrent = gripValues[0] ?? 0;
  const gripImprovementPct = gripStart > 0
    ? Math.round(((gripCurrent - gripStart) / gripStart) * 100)
    : 0;

  // ── Bilateral ──
  const rightSessions = sessions.filter(s => s.targetHand === 'right');
  const leftSessions  = sessions.filter(s => s.targetHand === 'left');
  const rightAvg = avg(rightSessions.map(s => s.metrics.peakGripForce));
  const leftAvg  = avg(leftSessions.map(s => s.metrics.peakGripForce));
  const symmetryRatio = leftAvg > 0 ? Math.round((rightAvg / leftAvg) * 100) : 0;
  
  // Project weeks to 100% symmetry
  const weeklyGain = (gripCurrent - gripStart) / Math.max(last30.length / 7, 1);
  const gapToClose = leftAvg - rightAvg;
  const projectedWeeks = weeklyGain > 0
    ? Math.round(gapToClose / weeklyGain)
    : 99;

  // ── Sensor quality (from rawSensorData — summarized only) ──
  const lastSession = sessions[0];
  const raw = lastSession?.metrics.rawSensorData ?? [];
  const sensorQuality = raw.length > 10
    ? analyzeSensorQuality(raw)
    : { avgVariance: 0, peakConsistency: 0, fatiguePattern: 'none' as const };

  // ── Endurance trend ──
  const enduranceDrops = last7.map(s => s.metrics.muscleEnduranceDropPercent ?? 0);
  const enduranceTrend = detectTrend(enduranceDrops);

  // ── Doctor context ──
  const lastInstruction = doctorMessages
    .find(m => m.type === 'instruction')?.content ?? null;
  const lastFeedback = doctorMessages
    .find(m => m.type === 'feedback')?.content ?? null;

  // ── Missed days this week ──
  const completedDates = new Set(
    last7.filter(s => s.durationSeconds > 60)
      .map(s => s.timestamp.toDate().toDateString())
  );
  const missedDays: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (!completedDates.has(d.toDateString())) {
      missedDays.push(d.toDateString());
    }
  }

  return {
    patient: {
      name: patient.name,
      condition: patient.condition,
      level: computeLevel(patient.gamification.totalXp),
      streak,
      totalXp: patient.gamification.totalXp,
      adherencePercent: adherencePct,
    },
    thisWeek: {
      sessionsCompleted: completed,
      sessionsPrescribed: prescribed,
      avgGripForce: avg(last7.map(s => s.metrics.peakGripForce)),
      peakGripForce: Math.max(...last7.map(s => s.metrics.peakGripForce ?? 0)),
      avgReactionMs: avg(last7.map(s => s.metrics.reactionTimeMs)),
      avgCognitiveAccuracy: avg(last7.map(s => s.metrics.cognitiveAccuracyPercent)),
      avgEnduranceDrop: avg(last7.map(s => s.metrics.muscleEnduranceDropPercent)),
      missedDays,
    },
    trend30Days: {
      gripStart,
      gripCurrent,
      gripImprovementPct,
      enduranceTrend,
      consistencyScore: computeConsistency(sessions),
    },
    bilateral: {
      rightHandAvg: rightAvg,
      leftHandAvg: leftAvg,
      symmetryRatio,
      projectedWeeksTo100: projectedWeeks,
    },
    sensorQuality,
    doctorContext: {
      lastInstruction,
      lastFeedback,
      currentProtocol: protocol?.gameId ?? 'unassigned',
      targetHand: protocol?.targetHand ?? 'right',
      difficulty: protocol?.settings.difficulty ?? 'medium',
    },
  };
}

// ── Utilities ──

function avg(nums: (number | undefined)[]): number {
  const valid = nums.filter((n): n is number => n !== undefined && !isNaN(n));
  if (!valid.length) return 0;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}

function calculateStreak(sessions: GameSession[]): number {
  const completedDays = new Set(
    sessions
      .filter(s => s.durationSeconds > 60)
      .map(s => s.timestamp.toDate().toDateString())
  );
  let streak = 0;
  const check = new Date();
  while (completedDays.has(check.toDateString())) {
    streak++;
    check.setDate(check.getDate() - 1);
  }
  return streak;
}

export function computeLevel(xp: number): number {
  const thresholds = [0, 500, 1500, 3000, 6000, 10000];
  return thresholds.filter(t => xp >= t).length;
}

function analyzeSensorQuality(raw: number[]) {
  const mean = avg(raw);
  const variance = avg(raw.map(v => Math.pow(v - mean, 2)));
  const firstTen = avg(raw.slice(0, 10));
  const lastTen  = avg(raw.slice(-10));
  const fatigueDrop = firstTen > 0
    ? ((firstTen - lastTen) / firstTen) * 100
    : 0;
  return {
    avgVariance: Math.round(variance * 100) / 100,
    peakConsistency: Math.round((1 - variance / mean) * 100),
    fatiguePattern: fatigueDrop > 20 ? 'early' as const
                  : fatigueDrop > 10 ? 'late' as const
                  : 'uniform' as const,
  };
}

function detectTrend(values: number[]): 'improving' | 'stable' | 'declining' {
  if (values.length < 2) return 'stable';
  const first = avg(values.slice(0, Math.ceil(values.length / 2)));
  const last  = avg(values.slice(Math.floor(values.length / 2)));
  const diff  = last - first;
  if (diff < -5) return 'improving'; // endurance DROP decreasing = good
  if (diff >  5) return 'declining';
  return 'stable';
}

function computeConsistency(sessions: GameSession[]): number {
  if (sessions.length < 2) return 100;
  const gaps: number[] = [];
  for (let i = 0; i < sessions.length - 1; i++) {
    const a = sessions[i].timestamp.toDate().getTime();
    const b = sessions[i+1].timestamp.toDate().getTime();
    gaps.push((a - b) / (1000 * 60 * 60 * 24)); // days between sessions
  }
  const avgGap = avg(gaps);
  return Math.max(0, Math.round(100 - (avgGap - 1) * 20));
}