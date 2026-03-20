"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/app/lib/firebase"; 
import { doc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { ShieldAlert, Activity, LogOut, Clock, XCircle } from "lucide-react";
import { signOut } from "firebase/auth";

const CSS = `
  @keyframes radarSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .radar-sweep {
    background: conic-gradient(from 0deg, transparent 70%, rgba(45,212,191,0.4) 100%);
    animation: radarSpin 4s linear infinite;
  }
`;

export default function WaitingRoomPage() {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const [doctorName, setDoctorName] = useState("your selected doctor");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!user) return;

    // 1. Real-time listener on the patient's document
    const patientRef = doc(db, "users", user.uid);
    
    const unsubscribe = onSnapshot(patientRef, async (docSnap) => {
      if (!docSnap.exists()) return;
      
      const data = docSnap.data();
      
      // If the doctor accepts, send them to the dashboard immediately!
      if (data.connectionStatus === "accepted") {
        router.push("/patients/home");
      }
      
      // If the doctor rejects, send them to the rejected page
      if (data.connectionStatus === "rejected") {
        router.push("/patients/rejected");
      }

      // Fetch the doctor's name for the UI
      if (data.assignedDoctorId && doctorName === "your selected doctor") {
        try {
          const docProfile = await getDoc(doc(db, "users", data.assignedDoctorId));
          if (docProfile.exists()) {
            setDoctorName(`Dr. ${docProfile.data().name}`);
          }
        } catch (e) {
          console.error("Could not fetch doctor name", e);
        }
      }
    });

    return () => unsubscribe();
  }, [user, router, doctorName]);

  const handleCancelRequest = async () => {
    if (!user) return;
    setIsCancelling(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        connectionStatus: "none",
        assignedDoctorId: null
      });
      // The layout gatekeeper will automatically kick them back to the onboarding page!
    } catch (e) {
      console.error("Failed to cancel request", e);
      setIsCancelling(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#080f1a] flex items-center justify-center p-4 relative overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{CSS}</style>
      
      {/* Ambient Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-lg w-full relative z-10 text-center">
        
        {/* Radar Animation */}
        <div className="relative w-48 h-48 mx-auto mb-10">
          <div className="absolute inset-0 rounded-full border border-teal-500/20" />
          <div className="absolute inset-4 rounded-full border border-teal-500/30" />
          <div className="absolute inset-10 rounded-full border border-teal-500/40" />
          <div className="absolute inset-0 rounded-full radar-sweep" style={{ borderRadius: "50%" }} />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-[#0B1E33] border-2 border-teal-400 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(45,212,191,0.5)] z-10">
              <ShieldAlert size={28} className="text-teal-400" />
            </div>
          </div>
        </div>

        <div className="text-teal-400 text-xs font-bold tracking-[0.3em] uppercase mb-4 flex items-center justify-center gap-2">
          <Clock size={14} className="animate-pulse" /> AWAITING CLINICAL APPROVAL
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em" }}>
          CONNECTION <span className="text-teal-400">PENDING</span>
        </h1>
        
        <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-md mx-auto">
          Your profile has been securely transmitted to <strong className="text-white">{doctorName}</strong>. 
          You will automatically be granted access to the ReViveX platform as soon as they review and approve your clinical request.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={handleCancelRequest}
            disabled={isCancelling}
            className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 font-bold text-xs tracking-widest uppercase transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 flex items-center gap-2 disabled:opacity-50"
          >
            <XCircle size={16} /> {isCancelling ? "Cancelling..." : "Cancel Request"}
          </button>
          
          <button 
            onClick={handleSignOut}
            className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 font-bold text-xs tracking-widest uppercase transition-all hover:bg-white/10 flex items-center gap-2"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>

      </div>
    </div>
  );
}