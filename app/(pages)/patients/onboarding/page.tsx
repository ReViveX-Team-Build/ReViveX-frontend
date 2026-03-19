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

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Avatar Upload */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className={`w-28 h-28 rounded-full border-2 overflow-hidden bg-[#080f1a] flex items-center justify-center transition-all ${avatarPreview ? 'border-teal-400' : 'border-teal-500/30 border-dashed'}`}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={32} className="text-teal-500/50 group-hover:text-teal-400 transition-colors" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-bold tracking-wider">UPLOAD</span>
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              <p className="text-slate-500 text-xs mt-3 uppercase tracking-widest">Profile Picture (Optional)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Condition Dropdown */}
              <div>
                <label className="block text-xs font-bold text-teal-400/70 uppercase tracking-widest mb-2">Primary Condition</label>
                <div className="relative">
                  <select 
                    value={condition} 
                    onChange={e => setCondition(e.target.value)}
                    className="w-full bg-white/5 border-b-2 border-teal-500/20 text-white p-4 rounded-t-xl outline-none appearance-none focus:border-teal-400 focus:bg-teal-500/5 transition-all cursor-pointer"
                  >
                    <option value="" disabled className="bg-[#0B1E33]">Select your condition...</option>
                    {CONDITIONS.map(c => <option key={c} value={c} className="bg-[#0B1E33]">{c}</option>)}
                  </select>
                  <Activity size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-teal-500/50 pointer-events-none" />
                </div>
              </div>

              {/* Affected Side */}
              <div>
                <label className="block text-xs font-bold text-teal-400/70 uppercase tracking-widest mb-2">Affected Side</label>
                <div className="flex gap-2">
                  {SIDES.map(side => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setAffectedSide(side)}
                      className={`flex-1 py-3.5 rounded-xl text-sm font-bold tracking-wider transition-all border ${
                        affectedSide === side 
                          ? 'bg-teal-500/20 border-teal-400 text-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.2)]' 
                          : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {side}
                    </button>
                  ))}
                </div>
              </div>
            </div>