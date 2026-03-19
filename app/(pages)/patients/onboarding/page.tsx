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