import { Timestamp } from "firebase/firestore";

// USERS (Patients & Doctors)
export interface UserProfile {
  uid: string;
  role: "patient" | "doctor";
  name: string;
  email: string;
  createdAt: Timestamp;
}

export interface PatientData extends UserProfile {
  condition: "Stroke" | "Parkinson's" | "Other";
  assignedDoctorId: string;
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

//  THERAPY PROTOCOLS 
export interface TherapyProtocol {
  id?: string;
  doctorId: string;
  patientId: string;
  gameId: "synapse_racer" | "stability_game";
  level: number; // 1-5
  targetHand: "left" | "right" | "both";
  hardwareFocus: "mpx_pressure" | "mpu_motion";
  assignedDate: Timestamp;
  settings: {
    difficulty: "easy" | "medium" | "hard" | "expert";
    audioHints: boolean;
    visualGuides: boolean;
  };
}

// --- GAME SESSIONS (Directly from your Metrics PDF) ---
export interface SessionMetrics {
  // MPX50DP (Pressure) Metrics -Synapse Racer
  reactionTimeMs?: number; 
  peakGripForce?: number;
  muscleEnduranceDropPercent?: number; 
  cognitiveAccuracyPercent?: number;

  // MPU6050 (Motion) Metrics -Stability Game
  tremorAmplitude?: number;
  driftDistance?: number;
  movementSmoothness?: number;
}

export interface GameSession {
  id?: string;
  patientId: string;
  protocolId: string; // Links back to the doctor's assignment
  gameId: string;
  date: Timestamp;
  durationSeconds: number;
  targetHand: "left" | "right";
  metrics: SessionMetrics; 
  aiSummary?: string; 
}

// --- COMMUNICATIONS (Chat n alerts) ---
export interface Communication {
  id?: string;
  senderId: string; // Could be doctor, patient, or "system" (AI)
  receiverId: string;
  type: "instruction" | "feedback" | "direct_message" | "ai_insight";
  content: string;
  timestamp: Timestamp;
  isRead: boolean;
}