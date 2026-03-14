// lib/seedDatabase.ts


import { db } from "./firebase";
import {
  collection, addDoc, doc, setDoc, Timestamp,
} from "firebase/firestore";

const REAL_DOCTOR_UID = "At7huRhhIBReUdlALY8vtsTZktx2";
const PATIENT_ID      = "patient_mock_001";
const PROTOCOL_ID     = "prot_mock_001";

export const seedDatabase = async () => {
  try {
    const confirm = window.confirm(
      "This will overwrite mock data in Firestore.\n\nContinue?"
    );
    if (!confirm) return;

    console.log("🌱 Seeding ReViveX database...");

    // ── 1. Patient document ────────────────────────────────────────────────
    await setDoc(doc(db, "users", PATIENT_ID), {
      role:             "patient",
      patientId:        PATIENT_ID,
      name:             "John Smith",
      email:            "john@revivex.com",
      condition:        "Stroke",
      assignedDoctorId: REAL_DOCTOR_UID,
      connectionStatus: "accepted",
      subscriptionPlan: "ai_companion",
      gamification: {
        totalXp:         2450,
        currentStreak:   5,
        unlockedLevels:  [1, 2],
      },
      hardwareStatus: {
        deviceId:  "R-103",
        status:    "connected",
        lastSync:  Timestamp.now(),
      },
      createdAt: Timestamp.now(),
    });
    console.log("✅ Patient created:", PATIENT_ID);

    // ── 2. Protocol document ───────────────────────────────────────────────
    await setDoc(doc(db, "protocols", PROTOCOL_ID), {
      doctorId:        REAL_DOCTOR_UID,
      patientId:       PATIENT_ID,
      gameId:          "synapse_racer",
      level:           2,
      targetHand:      "right",
      hardwareFocus:   "mpx_pressure",
      assignedDate:    Timestamp.now(),
      sessionsPerWeek: 5,
      doctorNote:      "Focus on consistent grip pressure. Avoid overexertion in final third of session.",
      settings: {
        difficulty:      "medium",
        gripMvcPercent:  45,
        audioHints:      true,
        visualGuides:    true,
        tremorFilter:    false,
      },
    });
    console.log("✅ Protocol created:", PROTOCOL_ID);

    // ── 3. Game sessions ───────────────────────────────────────────────────
    const now    = new Date();
    const daysAgo = (n: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - n);
      d.setHours(10, 30, 0, 0);
      return d;
    };

    const makeSensorData = (peak: number): number[] =>
      Array.from({ length: 120 }, (_, i) => {
        const fatigueFactor = i < 80 ? 1 : 1 - ((i - 80) / 120);
        const noise = (Math.random() - 0.5) * 0.15;
        return Math.max(0.3, Math.min(peak, peak * fatigueFactor + noise));
      }).map((v) => Math.round(v * 1000) / 1000);

    const sessionData = [
      {
        date: daysAgo(10), targetHand: "right" as const,
        level: 2, durationSeconds: 720,
        metrics: { peakGripForce: 0.82, muscleEnduranceDropPercent: 28, reactionTimeMs: 540, cognitiveAccuracyPercent: 72, rawSensorData: makeSensorData(0.82) },
        aiSummary: "Baseline session. High fatigue drop observed in final third.",
      },
      {
        date: daysAgo(9), targetHand: "left" as const,
        level: 2, durationSeconds: 680,
        metrics: { peakGripForce: 1.14, muscleEnduranceDropPercent: 10, reactionTimeMs: 390, cognitiveAccuracyPercent: 88, rawSensorData: makeSensorData(1.14) },
        aiSummary: "Left hand reference session. Strong baseline for bilateral comparison.",
      },
      {
        date: daysAgo(8), targetHand: "right" as const,
        level: 2, durationSeconds: 780,
        metrics: { peakGripForce: 0.89, muscleEnduranceDropPercent: 24, reactionTimeMs: 510, cognitiveAccuracyPercent: 75, rawSensorData: makeSensorData(0.89) },
        aiSummary: "Marginal improvement in peak force. Endurance still elevated.",
      },
      {
        date: daysAgo(7), targetHand: "right" as const,
        level: 2, durationSeconds: 810,
        metrics: { peakGripForce: 0.94, muscleEnduranceDropPercent: 21, reactionTimeMs: 490, cognitiveAccuracyPercent: 78, rawSensorData: makeSensorData(0.94) },
        aiSummary: "Steady improvement across all metrics. Good session.",
      },
      {
        date: daysAgo(6), targetHand: "left" as const,
        level: 2, durationSeconds: 700,
        metrics: { peakGripForce: 1.18, muscleEnduranceDropPercent: 8, reactionTimeMs: 375, cognitiveAccuracyPercent: 90, rawSensorData: makeSensorData(1.18) },
        aiSummary: "Left hand reference. Bilateral gap narrowing slightly.",
      },
      {
        date: daysAgo(5), targetHand: "right" as const,
        level: 2, durationSeconds: 840,
        metrics: { peakGripForce: 0.99, muscleEnduranceDropPercent: 18, reactionTimeMs: 465, cognitiveAccuracyPercent: 81, rawSensorData: makeSensorData(0.99) },
        aiSummary: "Peak force approaching 1.0 kPa. Cognitive score improving.",
      },
      {
        date: daysAgo(4), targetHand: "right" as const,
        level: 2, durationSeconds: 900,
        metrics: { peakGripForce: 1.05, muscleEnduranceDropPercent: 15, reactionTimeMs: 445, cognitiveAccuracyPercent: 83, rawSensorData: makeSensorData(1.05) },
        aiSummary: "First time exceeding 1.0 kPa peak. Strong milestone session.",
      },
      {
        date: daysAgo(3), targetHand: "right" as const,
        level: 2, durationSeconds: 920,
        metrics: { peakGripForce: 1.09, muscleEnduranceDropPercent: 13, reactionTimeMs: 432, cognitiveAccuracyPercent: 85, rawSensorData: makeSensorData(1.09) },
        aiSummary: "Excellent consistency. Endurance drop reducing significantly.",
      },
      {
        date: daysAgo(2), targetHand: "right" as const,
        level: 2, durationSeconds: 880,
        metrics: { peakGripForce: 1.12, muscleEnduranceDropPercent: 11, reactionTimeMs: 421, cognitiveAccuracyPercent: 87, rawSensorData: makeSensorData(1.12) },
        aiSummary: "Consistent improvement trajectory. Protocol level-up candidate.",
      },
      {
        date: daysAgo(1), targetHand: "right" as const,
        level: 2, durationSeconds: 149,
        metrics: { peakGripForce: 1.24, muscleEnduranceDropPercent: 0, reactionTimeMs: 437, cognitiveAccuracyPercent: 91, rawSensorData: makeSensorData(1.24) },
        aiSummary: "Best session to date. Peak grip 1.24 kPa, near-zero endurance drop.",
      },
    ];

    for (const s of sessionData) {
      await addDoc(collection(db, "game_sessions"), {
        userId:          PATIENT_ID,
        protocolId:      PROTOCOL_ID,
        gameId:          "synapse_racer",
        level:           s.level,
        timestamp:       Timestamp.fromDate(s.date),
        durationSeconds: s.durationSeconds,
        targetHand:      s.targetHand,
        metrics:         s.metrics,
        aiSummary:       s.aiSummary,
      });
    }
    console.log("✅ 10 game sessions created");

    // ── 4. Communications ──────────────────────────────────────────────────
    const commsRef = collection(db, "communications");

    await addDoc(commsRef, {
      senderId:    REAL_DOCTOR_UID,
      receiverId:  PATIENT_ID,
      type:        "feedback",
      title:       "Great Progress This Week",
      content:     "John, I reviewed your session data and I'm very impressed. Your grip strength has improved from 0.82 to 1.24 kPa over 10 days — a 51% improvement. Your endurance drop has also reduced from 28% to near zero. Keep up the current protocol.",
      timestamp:   Timestamp.fromDate(daysAgo(1)),
      isRead:      false,
      isImportant: false,
    });

    await addDoc(commsRef, {
      senderId:    REAL_DOCTOR_UID,
      receiverId:  PATIENT_ID,
      type:        "instruction",
      title:       "Protocol Update — Level 3 Unlocked",
      content:     "Based on your consistent performance above 1.0 kPa, I'm unlocking Level 3 starting next week. Increase session duration target to 20 minutes. If you experience any discomfort in the forearm, reduce to Level 2 immediately and message me.",
      timestamp:   Timestamp.fromDate(daysAgo(3)),
      isRead:      false,
      isImportant: true,
    });

    await addDoc(commsRef, {
      senderId:    REAL_DOCTOR_UID,
      receiverId:  PATIENT_ID,
      type:        "ai_insight",
      title:       "AI Analysis: Bilateral Gap Closing",
      content:     "Your right hand (affected) is now at 1.12 kPa vs left hand at 1.18 kPa — a symmetry ratio of 95%. This is excellent recovery progress for a stroke patient at this stage.",
      timestamp:   Timestamp.fromDate(daysAgo(5)),
      isRead:      true,
      isImportant: false,
    });

    console.log("✅ Communications seeded");

    // ── 5. Assignments ─────────────────────────────────────────────────────
    const assignRef = collection(db, "assignments");

    await addDoc(assignRef, {
      doctorId:       REAL_DOCTOR_UID,
      patientId:      PATIENT_ID,
      gameType:       "Synapse Racer",
      gameId:         "synapse_racer",
      note:           "Complete 3 full sessions this week focusing on sustained grip pressure.",
      targetDuration: 15,
      status:         "active",
      assignedDate:   Timestamp.fromDate(daysAgo(3)),
    });

    await addDoc(assignRef, {
      doctorId:       REAL_DOCTOR_UID,
      patientId:      PATIENT_ID,
      gameType:       "Rhythm Reef",
      gameId:         "rhythm_reef",
      note:           "Warm-up exercise before main session. 5 minutes only.",
      targetDuration: 5,
      status:         "pending",
      assignedDate:   Timestamp.fromDate(daysAgo(1)),
    });

    console.log("✅ Assignments seeded");

    // ── 6. Scheduled sessions ──────────────────────────────────────────────
    const scheduleRef = collection(db, "scheduled_sessions");

    await addDoc(scheduleRef, {
      doctorId:        REAL_DOCTOR_UID,
      patientId:       PATIENT_ID,
      gameId:          "synapse_racer",
      level:           2,
      scheduledDate:   new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
                         .toISOString().split("T")[0],
      scheduledTime:   "10:30",
      durationMinutes: 15,
      status:          "scheduled",
      createdAt:       Timestamp.now(),
    });

    await addDoc(scheduleRef, {
      doctorId:        REAL_DOCTOR_UID,
      patientId:       PATIENT_ID,
      gameId:          "rhythm_reef",
      level:           1,
      scheduledDate:   new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3)
                         .toISOString().split("T")[0],
      scheduledTime:   "11:00",
      durationMinutes: 10,
      status:          "scheduled",
      createdAt:       Timestamp.now(),
    });

    console.log("✅ Scheduled sessions seeded");

    alert(
      "✅ Database seeded successfully!\n\n" +
      "Patient: John Smith (" + PATIENT_ID + ")\n" +
      "Doctor UID: " + REAL_DOCTOR_UID + "\n" +
      "Sessions: 10 (last 10 days)\n" +
      "Assignments: 2\n" +
      "Scheduled sessions: 2\n\n" +
      "⚠️ Note: Mock patient cannot log in — use a real Auth UID for patient portal testing."
    );

  } catch (error: any) {
    console.error("❌ Seed error:", error);
    alert("Error seeding: " + error.message + "\nCheck console (F12).");
  }
};