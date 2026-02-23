import { db } from "./firebase"; 
import { collection, addDoc, doc, setDoc, Timestamp } from "firebase/firestore";

export const seedDatabase = async () => {
  try {
    const confirm = window.confirm("Are you sure you want to erase/overwrite test data?");
    if (!confirm) return;

    console.log("🌱 Starting Seed Process...");

    // 1. Create a Mock Patient
    const patientId = "patient_mock_001";
    await setDoc(doc(db, "users", patientId), {
      role: "patient",
      name: "Alex Rehabit",
      email: "alex@revivex.com",
      condition: "Post-Stroke Recovery",
      joinedAt: Timestamp.now(),
      streak: 5,
      totalXp: 1200
    });

    // 2. Create Mock Game Sessions (History)
    const sessions = [
      { level: 1, score: 450, accuracy: 65, date: new Date("2025-02-01") },
      { level: 1, score: 700, accuracy: 80, date: new Date("2025-02-03") },
      { level: 2, score: 1200, accuracy: 92, date: new Date("2025-02-05") },
    ];

    for (const s of sessions) {
      await addDoc(collection(db, "game_sessions"), {
        userId: patientId,
        gameId: "synapse_racer",
        level: s.level,
        score: s.score,
        metrics: {
          accuracy: s.accuracy,
          avgReactionTime: 400 - (s.score / 10), 
        },
        timestamp: Timestamp.fromDate(s.date),
        status: "completed"
      });
    }

    // 3. Create a Doctor Assignment
    await addDoc(collection(db, "assignments"), {
        patientId: patientId,
        doctorId: "doctor_001",
        gameType: "Rhythm Reef",
        targetDuration: 15, // mins
        status: "pending",
        assignedDate: Timestamp.now(),
        note: "Focus on smooth grip release."
    });

    alert("✅ Database Populated! Refresh your Firebase Console to see the data.");

  } catch (error) {
    console.error("Error seeding database:", error);
    alert("Error. Check console (F12) for details.");
  }
};