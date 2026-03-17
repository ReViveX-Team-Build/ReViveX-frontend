// lib/db/types.ts

import { Timestamp } from "firebase/firestore";

// ─────────────────────────
// USERS
// ─────────────────────────

export interface UserProfile {
  uid: string;
  role: "patient" | "doctor";
  name: string;
  email: string;
  createdAt: Timestamp;
}

export interface PatientData extends UserProfile {
  role: "patient";               

  patientId: string;
  condition: "Stroke" | "Parkinson's" | "TBI" | "Post-Surgery" | "Other";
  assignedDoctorId: string | null;          // null = not yet assigned
  connectionStatus: "none" | "pending" | "accepted" | "rejected";
  subscriptionPlan: "standard" | "ai_companion";
  profilePictureUrl?: string;
  gamification: {
    totalXp: number;
    currentStreak: number;
    unlockedLevels: number[];
  };
  hardwareStatus: {
    deviceId: string;
    status: "connected" | "offline";
    lastSync: Timestamp;
  };
}

export interface DoctorData extends UserProfile {
  role: "doctor";                           // discriminant
  doctorId: string;
  specialization: string;
  licenseNumber?: string;
  profilePictureUrl?: string;
  subscriptionPlan?: "standard" | "premium";
}

// ─────────────────────────────────────────────────────────────────────────────
// THERAPY PROTOCOLS
// ─────────────────────────────────────────────────────────────────────────────


export type GameId =
  | "synapse_racer"
  | "rhythm_reef"
  | "grip_surge"
  | "precision_hold"
  | "stability_core";

export interface TherapyProtocol {
  id?: string;
  doctorId: string;
  patientId: string;
  gameId: GameId;
  level: number;
  targetHand: "left" | "right" | "both";
  hardwareFocus: "mpx_pressure" | "mpu_motion";
  assignedDate: Timestamp;
  doctorNote?: string;
  sessionsPerWeek: number;
  settings: {
    difficulty: "easy" | "medium" | "hard" | "expert";
    gripMvcPercent: number;
    audioHints: boolean;
    visualGuides: boolean;
    tremorFilter: boolean;
  };
}

// ─────────────────────────
// SESSIONS & METRICS
// ─────────────────────────

export interface SessionMetrics {
  reactionTimeMs?: number;
  peakGripForce?: number;
  muscleEnduranceDropPercent?: number;
  cognitiveAccuracyPercent?: number;
  rawSensorData?: number[];               // never sent to LLM — processed only

  // MPU6050 motion sensor (Stability Core — not yet assembled)
  tremorAmplitude?: number;               // √(SDx²+SDy²+SDz²)
  driftDistance?: number;                 // avg Euclidean distance from target
  movementSmoothness?: number;            // jerk: (Accel_cur − Accel_prev) / Time
}

export interface GameSession {
  id?: string;
  userId: string;
  protocolId: string;
  gameId: GameId;
  level: number;                          
  timestamp: Timestamp;
  durationSeconds: number;
  targetHand: "left" | "right";
  metrics: SessionMetrics;
  aiSummary?: string;
}

// ─────────────────────────
// ASSIGNMENTS
// ─────────────────────────

export type AssignmentStatus = "pending" | "active" | "completed" | "cancelled";

export interface Assignment {
  id?: string;
  doctorId: string;
  patientId: string;
  gameType: string;                       // display name e.g. "Rhythm Reef"
  gameId: GameId;
  note: string;
  targetDuration: number;                 // minutes
  status: AssignmentStatus;
  assignedDate: Timestamp;
  completedDate?: Timestamp;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMUNICATIONS
// ─────────────────────────

export interface Communication {
  id?: string;
  senderId: string;
  receiverId: string;
  type:
    | "instruction"
    | "feedback"
    | "direct_message"
    | "ai_insight"
    | "connection_request"  // patient → doctor during onboarding
    | "session_alert";      // system-generated low-adherence alert (to be built)
  content: string;
  title: string;
  timestamp: Timestamp;
  isRead: boolean;
  isImportant?: boolean;
  sessionId?: string;      
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULED SESSIONS — 
// ─────────────────────────────────────────────────────────────────────────────

export interface ScheduledSession {
  id?: string;
  doctorId: string;
  patientId: string;
  gameId: GameId;
  level: number;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  status: "scheduled" | "completed" | "missed" | "cancelled";
  createdAt: Timestamp;
}
