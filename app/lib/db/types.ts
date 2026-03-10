import { Timestamp } from "firebase/firestore";

// --- USERS (Patients & Doctors) ---
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
  connectionStatus: "pending" | "accepted" | "rejected"; // ← ADDED
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

// ← ADDED — needed by the select-doctor onboarding page
export interface DoctorData extends UserProfile {
  doctorId: string;
  specialization: string;
  profilePictureUrl?: string;
}

// --- THERAPY PROTOCOLS ---
export interface TherapyProtocol {
  id?: string;
  doctorId: string;
  patientId: string;
  gameId: "synapse_racer" | "stability_game";
  level: number;
  targetHand: "left" | "right" | "both";
  hardwareFocus: "mpx_pressure" | "mpu_motion";
  assignedDate: Timestamp;
  settings: {
    difficulty: "easy" | "medium" | "hard" | "expert";
    audioHints: boolean;
    visualGuides: boolean;
  };
}

export interface SessionMetrics {
  reactionTimeMs?: number;
  peakGripForce?: number;
  muscleEnduranceDropPercent?: number;
  cognitiveAccuracyPercent?: number;
  tremorAmplitude?: number;
  driftDistance?: number;
  movementSmoothness?: number;
}

export interface GameSession {
  id?: string;
  userId: string;
  protocolId: string;
  gameId: string;
  timestamp: Timestamp;
  durationSeconds: number;
  targetHand: "left" | "right";
  metrics: SessionMetrics;
  aiSummary?: string;
}

// --- COMMUNICATIONS (Chat & Alerts) ---
export interface Communication {
  id?: string;
  senderId: string;
  receiverId: string;
  type: "instruction" | "feedback" | "direct_message" | "ai_insight" | "connection_request"; // ← ADDED connection_request
  content: string;
  timestamp: Timestamp;
  isRead: boolean;
}