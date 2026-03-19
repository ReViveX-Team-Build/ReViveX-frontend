import { auth, db } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification 
} from "firebase/auth";
import { doc, setDoc, getDoc, query, collection, where, getDocs, Timestamp } from "firebase/firestore";


interface PatientData {
  uid: string;
  role: "patient";
  patientId: string;
  name: string;
  email: string;
  assignedDoctorId: string | null;
  connectionStatus: "none" | "pending" | "accepted" | "rejected";
  subscriptionPlan: "standard" | "ai_companion";
  condition: "Stroke" | "Parkinson's" | "TBI" | "Post-Surgery" | "Other";
  gamification: {
    totalXp: number;
    currentStreak: number;
    unlockedLevels: number[];
  };
  hardwareStatus: {
    deviceId: string;
    status: "connected" | "offline";
    lastSync: any;
  };
  createdAt: any;
}

// --- SIGN UP PATIENT ---
export const registerPatient = async (
  email: string, 
  password: string, 
  name: string,
  doctorId: string = "" 
) => {
  try {
    // 1. Create Firebase Auth account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // 2. SEND VERIFICATION EMAIL IMMEDIATELY
    await sendEmailVerification(user);
    
    // 3. Generate patient ID
    const patientId = "p" + user.uid.slice(-6).toLowerCase();
    
    // 4. Create patient profile
    const patientData: PatientData = {
      uid: user.uid,
      role: "patient",
      patientId: patientId,
      name: name,
      email: email,
      assignedDoctorId: doctorId || null,
      connectionStatus: doctorId ? "pending" : "none", // Locks them in the waiting room!
      subscriptionPlan: "standard",
      condition: "Other", // Default until they complete their profile
      gamification: {
        totalXp: 0,
        currentStreak: 0,
        unlockedLevels: [1]
      },
      hardwareStatus: {
        deviceId: "",
        status: "offline",
        lastSync: Timestamp.now()
      },
      createdAt: Timestamp.now()
    };

    // 5. Save to Firestore
    await setDoc(doc(db, "users", user.uid), patientData);
    
    return { 
      success: true, 
      status: "CREATED",
      patientId: patientId, 
      uid: user.uid,
      message: `Account created! Please check your email to verify your account.` 
    };
  } catch (error: any) {
    console.error("Patient registration error:", error);

    if (error.code === "auth/email-already-in-use") {
      return {
        success: false,
        status: "EXISTS",
        error: "This email is already registered. Please sign in instead.",
        code: "auth/email-already-in-use",
      };
    }

    let errorMessage = "Registration failed";
    if (error.code === "auth/weak-password") {
      errorMessage = "Password should be at least 6 characters";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    }
    return { success: false, status: "FAILED", error: errorMessage, code: error.code };
  }
};

//  SIGN IN WITH PATIENT ID 
export const signInWithPatientId = async (patientId: string, password: string) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("patientId", "==", patientId.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, error: "Patient ID not found" };
    }
    
    const patientData = querySnapshot.docs[0].data();
    const userCredential = await signInWithEmailAndPassword(auth, patientData.email, password);
    
    if (patientData.role !== "patient") {
      await signOut(auth);
      return { success: false, error: "This account is not a patient account" };
    }
    
    return { success: true, user: patientData, uid: userCredential.user.uid };
  } catch (error: any) {
    let errorMessage = "Sign in failed";
    if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
      errorMessage = "Invalid Patient ID or password";
    }
    return { success: false, error: errorMessage };
  }
};

//  SIGN IN WITH EMAIL 
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    
    if (!userDoc.exists()) {
      await signOut(auth);
      return { success: false, error: "User profile not found" };
    }
    
    const userData = userDoc.data();
    if (userData.role !== "patient") {
      await signOut(auth);
      return { success: false, error: "This account is not a patient account" };
    }
    
    return { success: true, user: userData, uid: userCredential.user.uid };
  } catch (error: any) {
    let errorMessage = "Sign in failed";
    if (error.code === "auth/invalid-credential") {
      errorMessage = "Invalid email or password";
    }
    return { success: false, error: errorMessage };
  }
};

//  SIGN OUT 
export const signOutPatient = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};