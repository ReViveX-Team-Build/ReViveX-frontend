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
  
  assignedDoctorId: string | null; 
  
  connectionStatus: "none" | "pending" | "accepted"; 

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

// --- THERAPY PROTOCOLS ---
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

export interface SessionMetrics {
  // MPX50DP (Pressure) Metrics - Synapse Racer
  reactionTimeMs?: number; 
  peakGripForce?: number;
  muscleEnduranceDropPercent?: number; 
  cognitiveAccuracyPercent?: number;
  
  // NEW: Stores the raw squeeze data arrays for LLM analysis
  rawSensorData?: number[]; 

  // MPU6050 (Motion) Metrics - Stability Game
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
  // NEW: Added 'connection_request' to handle the Patient-Doctor handshake
  type: "instruction" | "feedback" | "direct_message" | "ai_insight" | "connection_request";
  content: string;
  timestamp: Timestamp;
  isRead: boolean;
}