import { auth, db } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,   
  signOut,
  sendEmailVerification 
} from "firebase/auth";
import { doc, setDoc, getDoc, query, collection, where, getDocs, Timestamp } from "firebase/firestore";


interface DoctorData {
  uid: string;
  role: "doctor";
  doctorId: string;
  name: string;
  email: string;
  specialization: string;
  licenseNumber?: string;
  subscriptionPlan: "standard" | "premium";
  createdAt: any;
}

export const registerDoctor = async (
  email: string, 
  password: string, 
  name: string,
  specialization: string = "General",
  licenseNumber: string = ""
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    //  SEND VERIFICATION EMAIL IMMEDIATELY
    await sendEmailVerification(user);
    
    const doctorId = "d" + user.uid.slice(-6).toLowerCase();
    
    const doctorData: DoctorData = {
      uid: user.uid,
      role: "doctor",
      doctorId: doctorId,
      name: name,
      email: email,
      specialization: specialization,
      licenseNumber: licenseNumber,
      subscriptionPlan: "standard", // Set default plan
      createdAt: Timestamp.now()
    };

    await setDoc(doc(db, "users", user.uid), doctorData);
    
    return { 
      success: true, 
      status: "CREATED",
      doctorId: doctorId, 
      uid: user.uid,
      message: `Account created! Please check your email to verify your account.` 
    };
  } catch (error: any) {
    console.error("Registration error:", error);
    
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

export const signInWithDoctorId = async (doctorId: string, password: string) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("doctorId", "==", doctorId.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, error: "Doctor ID not found" };
    }
    
    const doctorDoc = querySnapshot.docs[0];
    const doctorData = doctorDoc.data();
    
    const userCredential = await signInWithEmailAndPassword(auth, doctorData.email, password);
    
    if (doctorData.role !== "doctor") {
      await signOut(auth);
      return { success: false, error: "This account is not a doctor account" };
    }
    
    return { success: true, user: doctorData, uid: userCredential.user.uid };
  } catch (error: any) {
    let errorMessage = "Sign in failed";
    if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
      errorMessage = "Invalid Doctor ID or password";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many failed attempts. Please try again later.";
    }
    return { success: false, error: errorMessage };
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    
    if (!userDoc.exists()) {
      await signOut(auth);
      return { success: false, error: "User profile not found" };
    }
    
    const userData = userDoc.data();
    if (userData.role !== "doctor") {
      await signOut(auth);
      return { success: false, error: "This account is not a doctor account" };
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

export const signOutDoctor = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};