import { db } from "./firebase"; 
import { collection, addDoc, doc, setDoc, Timestamp } from "firebase/firestore";

export const seedDatabase = async () => {
  try {
    const confirm = window.confirm("Are you sure you want to erase/overwrite test data with Clinical Metrics?");
    if (!confirm) return;

    console.log("🌱 Starting Clinical Seed Process...");

    // 1. Create a Mock Patient (Matches the PatientData interface)
    const patientId = "patient_mock_001";
    await setDoc(doc(db, "users", patientId), {
      role: "patient",
      name: "John Smith",
      email: "john@revivex.com",
      condition: "Stroke",
      assignedDoctorId: "doctor_001",
      gamification: {
        totalXp: 2450,
        currentStreak: 5,
        unlockedLevels: [1, 2]
      },
      hardwareStatus: {
        deviceId: "R-103",
        status: "connected",
        lastSync: Timestamp.now()
      },
      createdAt: Timestamp.now()
    });

    // 2. Create a Mock Therapy Protocol
    const protocolId = "prot_mock_001";
    await setDoc(doc(db, "protocols", protocolId), {
      doctorId: "doctor_001",
      patientId: patientId,
      gameId: "synapse_racer",
      level: 2,
      targetHand: "right",
      hardwareFocus: "mpx_pressure",
      assignedDate: Timestamp.now(),
      settings: {
        difficulty: "medium",
        audioHints: true,
        visualGuides: true
      }
    });

    // 3. Create Mock Game Sessions (Based on your Clinical Metrics PDF)
    // We will simulate 3 days of progress showing improvement in endurance
    const sessions = [
      { 
        date: new Date("2025-11-13T10:30:00"), 
        metrics: { peakGripForce: 38.5, muscleEnduranceDropPercent: 25, reactionTimeMs: 520, cognitiveAccuracyPercent: 75 },
        aiSummary: "High endurance drop detected early in session. Recommend monitoring for fatigue."
      },
      { 
        date: new Date("2025-11-14T10:30:00"), 
        metrics: { peakGripForce: 42.1, muscleEnduranceDropPercent: 18, reactionTimeMs: 480, cognitiveAccuracyPercent: 80 },
        aiSummary: "Notable improvement in grip stability. Endurance is increasing."
      },
      { 
        date: new Date("2025-11-15T10:30:00"), 
        metrics: { peakGripForce: 45.2, muscleEnduranceDropPercent: 12, reactionTimeMs: 420, cognitiveAccuracyPercent: 85 },
        aiSummary: "Excellent consistency today. Motor execution and cognitive praxis are synchronizing well."
      },
    ];

    for (const s of sessions) {
      await addDoc(collection(db, "game_sessions"), {
        userId: patientId,
        protocolId: protocolId,
        gameId: "synapse_racer",
        timestamp: Timestamp.fromDate(s.date),
        durationSeconds: 900, // 15 mins
        targetHand: "right",
        metrics: s.metrics, // Injects the MPX clinical data!
        aiSummary: s.aiSummary
      });
    }

    alert("✅ Clinical Database Populated! Check your Firebase Console.");

  } catch (error) {
    console.error("Error seeding database:", error);
    alert("Error. Check console (F12) for details.");
  }
};