import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";

interface PatientData {
  uid: string;
  role: "patient";
  patientId: string;
  name: string;
  email: string;
  assignedDoctorId: string | null; // links to their doctor, null when not assigned
  createdAt: any;
}

// --- SIGN UP PATIENT ---
export const registerPatient = async (
  email: string,
  password: string,
  name: string,
  doctorId: string = "", // Optional doctor ID
) => {
  try {
    // Create Firebase Auth account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // Generate patient ID (p + last 6 chars of uid)
    const patientId = "p" + user.uid.slice(-6).toLowerCase();

    // Create patient profile
    const patientData: PatientData = {
      uid: user.uid,
      role: "patient",
      patientId: patientId,
      name: name,
      email: email,
      assignedDoctorId: doctorId || null,
      createdAt: Timestamp.now(),
    };

    // Save to Firestore
    await setDoc(doc(db, "users", user.uid), patientData);

    return {
      success: true,
      status: "CREATED",
      patientId: patientId,
      uid: user.uid,
      message: `Account created! Your Patient ID is: ${patientId}`,
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
    } else if (error.code === "auth/operation-not-allowed") {
      errorMessage =
        "Email/password sign-up is disabled in Firebase Authentication.";
    } else if (error.code === "auth/network-request-failed") {
      errorMessage =
        "Network error. Check your internet connection and try again.";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many attempts. Please try again later.";
    } else if (error.code === "auth/invalid-api-key") {
      errorMessage =
        "Firebase API key is invalid. Check your .env.local configuration.";
    } else if (error.code) {
      errorMessage = `Registration failed (${error.code})`;
    }
    return {
      success: false,
      status: "FAILED",
      error: errorMessage,
      code: error.code,
    };
  }
};

// --- SIGN IN WITH PATIENT ID ---
export const signInWithPatientId = async (
  patientId: string,
  password: string,
) => {
  try {
    // Find patient by Patient ID
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("patientId", "==", patientId.toLowerCase()),
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: "Patient ID not found" };
    }

    // Get patient data
    const patientData = querySnapshot.docs[0].data();

    // Sign in with email + password
    const userCredential = await signInWithEmailAndPassword(
      auth,
      patientData.email,
      password,
    );

    // Verify it's a patient account
    if (patientData.role !== "patient") {
      await signOut(auth);
      return { success: false, error: "This account is not a patient account" };
    }

    return {
      success: true,
      user: patientData,
      uid: userCredential.user.uid,
    };
  } catch (error: any) {
    let errorMessage = "Sign in failed";
    if (error.code === "auth/wrong-password") {
      errorMessage = "Incorrect password";
    } else if (error.code === "auth/invalid-credential") {
      errorMessage = "Invalid Patient ID or password";
    }
    return { success: false, error: errorMessage };
  }
};

// --- SIGN IN WITH EMAIL ---
export const signInWithEmail = async (email: string, password: string) => {
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );

    // Get patient data from Firestore
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

    if (!userDoc.exists()) {
      await signOut(auth);
      return { success: false, error: "User profile not found" };
    }

    const userData = userDoc.data();

    // Verify it's a patient account
    if (userData.role !== "patient") {
      await signOut(auth);
      return { success: false, error: "This account is not a patient account" };
    }

    return {
      success: true,
      user: userData,
      uid: userCredential.user.uid,
    };
  } catch (error: any) {
    let errorMessage = "Sign in failed";
    if (error.code === "auth/invalid-credential") {
      errorMessage = "Invalid email or password";
    }
    return { success: false, error: errorMessage };
  }
};

// --- SIGN OUT ---
export const signOutPatient = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
