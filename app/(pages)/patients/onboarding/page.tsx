"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db, storage } from "@/app/lib/firebase"; 
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { Camera, Activity, Shield, ChevronRight, Loader2, CheckCircle2, User } from "lucide-react";

const CONDITIONS = ["Stroke", "Parkinson's", "TBI", "Post-Surgery", "Other"];
const SIDES = ["Left", "Right", "Both"];

export default function PatientOnboardingPage() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  
  // Form State
  const [doctors, setDoctors] = useState<{ id: string; name: string; specialization: string }[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [condition, setCondition] = useState("");
  const [affectedSide, setAffectedSide] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Auth Guard & Fetch Doctors
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/patient/signin");
      return;
    }

    const fetchDoctors = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "doctor"));
        const snapshot = await getDocs(q);
        const docsList = snapshot.docs.map(d => ({
          id: d.id,
          name: d.data().name || "Unknown Doctor",
          specialization: d.data().specialization || "General"
        }));
        setDoctors(docsList);
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      }
    };

    if (user) fetchDoctors();
  }, [user, loading, router]);

  // 2. Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // 3. Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!condition || !affectedSide || !selectedDoctor) {
      setError("Please complete all fields to continue.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      let photoURL = "";
      
      // Upload avatar if selected
      if (avatarFile) {
        const imgRef = storageRef(storage, `avatars/${user.uid}`);
        await uploadBytes(imgRef, avatarFile);
        photoURL = await getDownloadURL(imgRef);
      }

      // Update patient document
      await updateDoc(doc(db, "users", user.uid), {
        condition,
        affectedSide,
        assignedDoctorId: selectedDoctor,
        connectionStatus: "pending", 
        ...(photoURL && { photoURL })
      });


      router.push("/patients/waiting-room");
      
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to save profile. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#080f1a] flex items-center justify-center">
        <Loader2 size={40} className="text-teal-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080f1a] flex items-center justify-center p-4 relative overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-2xl w-full relative z-10 my-10">
        <div className="bg-[#0B1E33]/80 backdrop-blur-xl border border-teal-500/20 rounded-3xl p-8 shadow-2xl shadow-teal-900/20 relative overflow-hidden">
          
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-50" />

          <div className="text-center mb-10">
            <div className="text-teal-400 text-xs font-bold tracking-[0.3em] uppercase mb-3">Step 2 of 2</div>
            <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em" }}>
              COMPLETE YOUR <span className="text-teal-400">PROFILE</span>
            </h1>
            <p className="text-slate-400 text-sm">Help your doctor tailor your recovery protocol.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm text-center">
              {error}
            </div>
          )}