import { auth, db } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut 
} from "firebase/auth";
import { doc, setDoc, getDoc, query, collection, where, getDocs, Timestamp } from "firebase/firestore";

// Interface for Doctor data
interface DoctorData {
  uid: string;
  role: "doctor";
  doctorId: string;
  name: string;
  email: string;
  specialization?: string;
  licenseNumber?: string;
  createdAt: any;
}

// --- SIGN UP DOCTOR ---
export const registerDoctor = async (
  email: string, 
  password: string, 
  name: string,
  specialization: string = "General",
  licenseNumber: string = ""
) => {
  try {
    // Create auth account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Generate doctor ID (d + random 6 characters from uid)
    const doctorId = "d" + user.uid.slice(-6).toLowerCase();
    
    // Create doctor profile in Firestore
    const doctorData: DoctorData = {
      uid: user.uid,
      role: "doctor",
      doctorId: doctorId,
      name: name,
      email: email,
      specialization: specialization,
      licenseNumber: licenseNumber,
      createdAt: Timestamp.now()
    };

    await setDoc(doc(db, "users", user.uid), doctorData);
    
    return { 
      success: true, 
      doctorId: doctorId, 
      uid: user.uid,
      message: `Account created! Your Doctor ID is: ${doctorId}` 
    };
  } catch (error: any) {
    console.error("Registration error:", error);
    
    // User-friendly error messages
    let errorMessage = "Registration failed";
    if (error.code === "auth/email-already-in-use") {
      errorMessage = "This email is already registered";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password should be at least 6 characters";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    }
    
    return { success: false, error: errorMessage };
  }
};

// --- SIGN IN WITH DOCTOR ID ---
export const signInWithDoctorId = async (doctorId: string, password: string) => {
  try {
    // Step 1: Find the email associated with this doctorId
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("doctorId", "==", doctorId.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, error: "Doctor ID not found" };
    }
    
    // Get the email from the doctor's profile
    const doctorDoc = querySnapshot.docs[0];
    const doctorData = doctorDoc.data();
    const email = doctorData.email;
    
    // Step 2: Sign in with email and password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Verify this is a doctor account
    if (doctorData.role !== "doctor") {
      await signOut(auth);
      return { success: false, error: "This account is not a doctor account" };
    }
    
    return { 
      success: true, 
      user: doctorData,
      uid: user.uid 
    };
  } catch (error: any) {
    console.error("Sign in error:", error);
    
    // User-friendly error messages
    let errorMessage = "Sign in failed";
    if (error.code === "auth/wrong-password") {
      errorMessage = "Incorrect password";
    } else if (error.code === "auth/invalid-credential") {
      errorMessage = "Invalid Doctor ID or password";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many failed attempts. Please try again later.";
    }
    
    return { success: false, error: errorMessage };
  }
};

// --- SIGN IN WITH EMAIL (Alternative method) ---
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Verify this is a doctor account
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (!userDoc.exists()) {
      await signOut(auth);
      return { success: false, error: "User profile not found" };
    }
    
    const userData = userDoc.data();
    
    if (userData.role !== "doctor") {
      await signOut(auth);
      return { success: false, error: "This account is not a doctor account" };
    }
    
    return { 
      success: true, 
      user: userData,
      uid: user.uid 
    };
  } catch (error: any) {
    console.error("Sign in error:", error);
    
    // User-friendly error messages
    let errorMessage = "Sign in failed";
    if (error.code === "auth/user-not-found") {
      errorMessage = "No account found with this email";
    } else if (error.code === "auth/wrong-password") {
      errorMessage = "Incorrect password";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    } else if (error.code === "auth/invalid-credential") {
      errorMessage = "Invalid email or password";
    }
    
    return { success: false, error: errorMessage };
  }
};

// --- SIGN OUT ---
export const signOutDoctor = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};