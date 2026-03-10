// lib/seedDatabase.ts
// Run this ONCE from DevTools or a seed button to populate Firestore with
// realistic mock data that matches the real doctor's Firebase Auth UID.
//
// ⚠️  REPLACE  REAL_DOCTOR_UID  below with the actual UID from your Firebase
//     Auth console (Authentication → Users tab).
//     Current real doctor: dasuni → At7huRhhIBReUdlALY8vtsTZktx2

import { db } from "./firebase";
import {
  collection, addDoc, doc, setDoc,
  Timestamp, writeBatch,
} from "firebase/firestore";

// ─────────────────────────────────────────────────────────────────────────────
// ✅ CHANGE THIS to match whoever is logged in as the doctor during testing
// ─────────────────────────────────────────────────────────────────────────────
const REAL_DOCTOR_UID = "At7huRhhIBReUdlALY8vtsTZktx2"; // dasuni's real Firebase UID

const PATIENT_ID   = "patient_mock_001";
const PROTOCOL_ID  = "prot_mock_001";

export const seedDatabase = async () => {
  try {
    const confirm = window.confirm(
      "This will overwrite mock data in Firestore.\n\nContinue?"
    );
    if (!confirm) return;

    console.log("🌱 Seeding ReViveX database...");

    // ── 1. Patient document ────────────────────────────────────────────────
    // ✅ assignedDoctorId now points to the REAL doctor UID
    await setDoc(doc(db, "users", PATIENT_ID), {
      role: "patient",
      name: "John Smith",
      email: "john@revivex.com",
      condition: "Stroke",
      assignedDoctorId: REAL_DOCTOR_UID, // ✅ was "doctor_001" — broken
      connectionStatus: "accepted",
      gamification: {
        totalXp: 2450,
        currentStreak: 5,
        unlockedLevels: [1, 2],
      },
      hardwareStatus: {
        deviceId: "R-103",
        status: "connected",
        lastSync: Timestamp.now(),
      },
      createdAt: Timestamp.now(),
    });
    console.log("✅ Patient created:", PATIENT_ID);

    // ── 2. Protocol document ───────────────────────────────────────────────
    // ✅ collection is "protocols" (matches your Firestore)
    // ✅ added sessionsPerWeek so AI adherence calc works
    await setDoc(doc(db, "protocols", PROTOCOL_ID), {
      doctorId: REAL_DOCTOR_UID,    // ✅ was "doctor_001" — broken
      patientId: PATIENT_ID,
      gameId: "synapse_racer",
      level: 2,
      targetHand: "right",
      hardwareFocus: "mpx_pressure",
      assignedDate: Timestamp.now(),
      sessionsPerWeek: 5,            // ✅ added — AI needs this for adherence %
      doctorNote: "Focus on consistent grip pressure. Avoid overexertion in final third of session.",
      settings: {
        difficulty: "medium",
        gripMvcPercent: 45,
        audioHints: true,
        visualGuides: true,
        tremorFilter: false,
      },
    });
    console.log("✅ Protocol created:", PROTOCOL_ID);

    // ── 3. Game sessions ───────────────────────────────────────────────────
    // 10 sessions across the last 10 days showing realistic improvement.
    // ✅ userId is PATIENT_ID — matches everything the AI queries
    // ✅ rawSensorData is a realistic array (summarised by AI, never sent raw)
    const now = new Date();
    const daysAgo = (n: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - n);
      d.setHours(10, 30, 0, 0);
      return d;
    };

    // Generate a plausible raw sensor array (120 readings around a peak)
    const makeSensorData = (peak: number): number[] => {
      return Array.from({ length: 120 }, (_, i) => {
        const fatigueFactor = i < 80 ? 1 : 1 - ((i - 80) / 120);
        const noise = (Math.random() - 0.5) * 0.15;
        return Math.max(0.3, Math.min(peak, peak * fatigueFactor + noise));
      }).map((v) => Math.round(v * 1000) / 1000);
    };

    const sessionData = [
      // Day 10 ago — baseline
      {
        date: daysAgo(10),
        targetHand: "right" as const,
        durationSeconds: 720,
        metrics: {
          peakGripForce: 0.82,
          muscleEnduranceDropPercent: 28,
          reactionTimeMs: 540,
          cognitiveAccuracyPercent: 72,
          rawSensorData: makeSensorData(0.82),
        },
        aiSummary: "Baseline session. High fatigue drop observed in final third.",
      },
      // Day 9 — left hand comparison
      {
        date: daysAgo(9),
        targetHand: "left" as const,
        durationSeconds: 680,
        metrics: {
          peakGripForce: 1.14,
          muscleEnduranceDropPercent: 10,
          reactionTimeMs: 390,
          cognitiveAccuracyPercent: 88,
          rawSensorData: makeSensorData(1.14),
        },
        aiSummary: "Left hand reference session. Strong baseline for bilateral comparison.",
      },
      // Day 8
      {
        date: daysAgo(8),
        targetHand: "right" as const,
        durationSeconds: 780,
        metrics: {
          peakGripForce: 0.89,
          muscleEnduranceDropPercent: 24,
          reactionTimeMs: 510,
          cognitiveAccuracyPercent: 75,
          rawSensorData: makeSensorData(0.89),
        },
        aiSummary: "Marginal improvement in peak force. Endurance still elevated.",
      },
      // Day 7
      {
        date: daysAgo(7),
        targetHand: "right" as const,
        durationSeconds: 810,
        metrics: {
          peakGripForce: 0.94,
          muscleEnduranceDropPercent: 21,
          reactionTimeMs: 490,
          cognitiveAccuracyPercent: 78,
          rawSensorData: makeSensorData(0.94),
        },
        aiSummary: "Steady improvement across all metrics. Good session.",
      },
      // Day 6 — left hand
      {
        date: daysAgo(6),
        targetHand: "left" as const,
        durationSeconds: 700,
        metrics: {
          peakGripForce: 1.18,
          muscleEnduranceDropPercent: 8,
          reactionTimeMs: 375,
          cognitiveAccuracyPercent: 90,
          rawSensorData: makeSensorData(1.18),
        },
        aiSummary: "Left hand reference. Bilateral gap narrowing slightly.",
      },
      // Day 5
      {
        date: daysAgo(5),
        targetHand: "right" as const,
        durationSeconds: 840,
        metrics: {
          peakGripForce: 0.99,
          muscleEnduranceDropPercent: 18,
          reactionTimeMs: 465,
          cognitiveAccuracyPercent: 81,
          rawSensorData: makeSensorData(0.99),
        },
        aiSummary: "Peak force approaching 1.0 kPa. Cognitive score improving.",
      },
      // Day 4
      {
        date: daysAgo(4),
        targetHand: "right" as const,
        durationSeconds: 900,
        metrics: {
          peakGripForce: 1.05,
          muscleEnduranceDropPercent: 15,
          reactionTimeMs: 445,
          cognitiveAccuracyPercent: 83,
          rawSensorData: makeSensorData(1.05),
        },
        aiSummary: "First time exceeding 1.0 kPa peak. Strong milestone session.",
      },
      // Day 3
      {
        date: daysAgo(3),
        targetHand: "right" as const,
        durationSeconds: 920,
        metrics: {
          peakGripForce: 1.09,
          muscleEnduranceDropPercent: 13,
          reactionTimeMs: 432,
          cognitiveAccuracyPercent: 85,
          rawSensorData: makeSensorData(1.09),
        },
        aiSummary: "Excellent consistency. Endurance drop reducing significantly.",
      },
      // Day 2
      {
        date: daysAgo(2),
        targetHand: "right" as const,
        durationSeconds: 880,
        metrics: {
          peakGripForce: 1.12,
          muscleEnduranceDropPercent: 11,
          reactionTimeMs: 421,
          cognitiveAccuracyPercent: 87,
          rawSensorData: makeSensorData(1.12),
        },
        aiSummary: "Consistent improvement trajectory. Protocol level-up candidate.",
      },
      // Yesterday — most recent
      {
        date: daysAgo(1),
        targetHand: "right" as const,
        durationSeconds: 149, // ✅ matches your real hardware session
        metrics: {
          peakGripForce: 1.24,
          muscleEnduranceDropPercent: 0,
          reactionTimeMs: 437,
          cognitiveAccuracyPercent: 91,
          rawSensorData: makeSensorData(1.24),
        },
        aiSummary: "Best session to date. Peak grip 1.24 kPa, near-zero endurance drop.",
      },
    ];

    // Write all sessions
    for (const s of sessionData) {
      await addDoc(collection(db, "game_sessions"), {
        userId: PATIENT_ID,       // ✅ was "pat_mock_123" in old data — broken
        protocolId: PROTOCOL_ID,
        gameId: "synapse_racer",
        timestamp: Timestamp.fromDate(s.date),
        durationSeconds: s.durationSeconds,
        targetHand: s.targetHand,
        metrics: s.metrics,
        aiSummary: s.aiSummary,
      });
    }
    console.log("✅ 10 game sessions created");

    // ── 4. Doctor communications to patient ───────────────────────────────
    const commsRef = collection(db, "communications");
    await addDoc(commsRef, {
      senderId: REAL_DOCTOR_UID,
      receiverId: PATIENT_ID,
      type: "feedback",
      title: "Great Progress This Week",
      content: "John, I reviewed your session data and I'm very impressed. Your grip strength has improved from 0.82 to 1.24 kPa over 10 days — a 51% improvement. Your endurance drop has also reduced from 28% to near zero. Keep up the current protocol.",
      timestamp: Timestamp.fromDate(daysAgo(1)),
      isRead: false,
      isImportant: false,
    });

    await addDoc(commsRef, {
      senderId: REAL_DOCTOR_UID,
      receiverId: PATIENT_ID,
      type: "instruction",
      title: "Protocol Update — Level 3 Unlocked",
      content: "Based on your consistent performance above 1.0 kPa, I'm unlocking Level 3 starting next week. Increase session duration target to 20 minutes. If you experience any discomfort in the forearm, reduce to Level 2 immediately and message me.",
      timestamp: Timestamp.fromDate(daysAgo(3)),
      isRead: false,
      isImportant: true,
    });

    await addDoc(commsRef, {
      senderId: REAL_DOCTOR_UID,
      receiverId: PATIENT_ID,
      type: "ai_insight",
      title: "AI Analysis: Bilateral Gap Closing",
      content: "Your right hand (affected) is now at 1.12 kPa vs left hand at 1.18 kPa — a symmetry ratio of 95%. This is excellent recovery progress for a stroke patient at this stage.",
      timestamp: Timestamp.fromDate(daysAgo(5)),
      isRead: true,
      isImportant: false,
    });

    console.log("✅ Communications seeded");

    alert(
      "✅ Database seeded successfully!\n\n" +
      "Patient: John Smith (patient_mock_001)\n" +
      "Doctor UID: " + REAL_DOCTOR_UID + "\n" +
      "Sessions: 10 (last 10 days)\n\n" +
      "The AI companion should now have full data to work with."
    );

  } catch (error: any) {
    console.error("❌ Seed error:", error);
    alert("Error seeding: " + error.message + "\nCheck console (F12).");
  }
};