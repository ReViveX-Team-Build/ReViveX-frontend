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