import { auth, db } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut 
} from "firebase/auth";
import { doc, setDoc, getDoc, query, collection, where, getDocs, Timestamp } from "firebase/firestore";

interface PatientData {
  uid: string;
  role: "patient";
  patientId: string;
  name: string;
  email: string;
  assignedDoctorId?: string;
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
    console.log("🚀 Starting patient registration...");
    console.log("📧 Email:", email);
    console.log("👤 Name:", name);
    console.log("🏥 Doctor ID:", doctorId || "(none)");
    
    // Create Firebase Auth account
    console.log("⏳ Creating Firebase Auth account...");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("✅ Firebase Auth account created successfully!");
    console.log("🆔 User UID:", user.uid);
    
    // Generate patient ID (p + last 6 chars of uid)
    const patientId = "p" + user.uid.slice(-6).toLowerCase();
    console.log("✅ Generated Patient ID:", patientId);
    
    // Create patient profile - conditionally add assignedDoctorId
    const patientData: any = {
      uid: user.uid,
      role: "patient",
      patientId: patientId,
      name: name,
      email: email,
      createdAt: Timestamp.now()
    };

    // Only add assignedDoctorId if doctorId is provided and not empty
    if (doctorId && doctorId.trim() !== "") {
      patientData.assignedDoctorId = doctorId.trim();
      console.log("✅ Assigned to doctor:", doctorId.trim());
    } else {
      console.log("ℹ️ No doctor assigned");
    }

    console.log("📝 Preparing to save to Firestore...");
    console.log("📂 Collection: users");
    console.log("🗂️ Document ID:", user.uid);
    console.log("💾 Data to save:", JSON.stringify(patientData, null, 2));
    
    // Save to Firestore
    console.log("⏳ Saving to Firestore...");
    await setDoc(doc(db, "users", user.uid), patientData);
    console.log("✅ Firestore document saved successfully!");
    
    console.log("🎉 Patient registration completed successfully!");
    
    return { 
      success: true, 
      patientId: patientId, 
      uid: user.uid,
      message: `Account created! Your Patient ID is: ${patientId}` 
    };
  } catch (error: any) {
    console.error("❌❌❌ PATIENT REGISTRATION ERROR ❌❌❌");
    console.error("🔥 Full error object:", error);
    console.error("📋 Error code:", error.code);
    console.error("💬 Error message:", error.message);
    console.error("📚 Error stack:", error.stack);
    
    let errorMessage = "Registration failed";
    
    if (error.code === "auth/email-already-in-use") {
      errorMessage = "This email is already registered. Please use a different email or sign in.";
      console.error("🚫 Reason: Email already exists in Firebase Auth");
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password should be at least 6 characters";
      console.error("🚫 Reason: Password too weak");
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address format";
      console.error("🚫 Reason: Invalid email format");
    } else if (error.code === "permission-denied") {
      errorMessage = "Database permission error. Please contact support.";
      console.error("🚫 Reason: Firestore permission denied");
    } else if (error.message) {
      errorMessage = `Registration failed: ${error.message}`;
      console.error("🚫 Reason: Unknown error -", error.message);
    }
    
    return { success: false, error: errorMessage };
  }
};

// --- SIGN IN WITH PATIENT ID ---
export const signInWithPatientId = async (patientId: string, password: string) => {
  try {
    console.log("🔑 Signing in with Patient ID:", patientId);
    
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("patientId", "==", patientId.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error("❌ Patient ID not found in database");
      return { success: false, error: "Patient ID not found" };
    }
    
    const patientData = querySnapshot.docs[0].data();
    console.log("✅ Patient found:", patientData.email);
    
    const userCredential = await signInWithEmailAndPassword(auth, patientData.email, password);
    console.log("✅ Signed in successfully");
    
    if (patientData.role !== "patient") {
      console.error("❌ Account is not a patient account, role:", patientData.role);
      await signOut(auth);
      return { success: false, error: "This account is not a patient account" };
    }
    
    return { 
      success: true, 
      user: patientData,
      uid: userCredential.user.uid 
    };
  } catch (error: any) {
    console.error("❌ Sign in error:", error);
    
    let errorMessage = "Sign in failed";
    if (error.code === "auth/wrong-password") {
      errorMessage = "Incorrect password";
    } else if (error.code === "auth/invalid-credential") {
      errorMessage = "Invalid Patient ID or password";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many failed attempts. Please try again later.";
    }
    
    return { success: false, error: errorMessage };
  }
};

// --- SIGN IN WITH EMAIL ---
export const signInWithEmail = async (email: string, password: string) => {
  try {
    console.log("🔑 Signing in with email:", email);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("✅ Firebase Auth sign in successful");
    
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    
    if (!userDoc.exists()) {
      console.error("❌ User profile not found in Firestore");
      await signOut(auth);
      return { success: false, error: "User profile not found" };
    }
    
    const userData = userDoc.data();
    console.log("✅ User profile found, role:", userData.role);
    
    if (userData.role !== "patient") {
      console.error("❌ Account is not a patient account");
      await signOut(auth);
      return { success: false, error: "This account is not a patient account" };
    }
    
    return { 
      success: true, 
      user: userData,
      uid: userCredential.user.uid 
    };
  } catch (error: any) {
    console.error("❌ Sign in error:", error);
    
    let errorMessage = "Sign in failed";
    if (error.code === "auth/invalid-credential") {
      errorMessage = "Invalid email or password";
    } else if (error.code === "auth/user-not-found") {
      errorMessage = "No account found with this email";
    } else if (error.code === "auth/wrong-password") {
      errorMessage = "Incorrect password";
    }
    
    return { success: false, error: errorMessage };
  }
};

// --- SIGN OUT ---
export const signOutPatient = async () => {
  try {
    await signOut(auth);
    console.log("✅ Patient signed out successfully");
    return { success: true };
  } catch (error: any) {
    console.error("❌ Sign out error:", error);
    return { success: false, error: error.message };
  }
};