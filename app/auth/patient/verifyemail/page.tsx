"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/lib/firebase"; 
import { sendEmailVerification, signOut } from "firebase/auth";
import { Mail, CheckCircle2, RefreshCw, LogOut, AlertCircle } from "lucide-react";

const CSS = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 30px rgba(45,212,191,0.2), inset 0 0 20px rgba(45,212,191,0.1); }
    50% { box-shadow: 0 0 60px rgba(45,212,191,0.4), inset 0 0 30px rgba(45,212,191,0.2); }
  }
  .mail-icon-container {
    animation: float 4s ease-in-out infinite, pulseGlow 3s ease-in-out infinite;
  }
`;

export default function VerifyEmailPage() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);

  // 1. Kick out users who aren't logged in
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/patient/signin");
    }
  }, [user, loading, router]);

  // 2. Loading screen
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#080f1a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  // 3. Kick out users who are ALREADY verified
  if (user.emailVerified) {
    router.replace("/patients/onboarding");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#080f1a] text-white flex items-center justify-center">
      <style>{CSS}</style>
      <p>Authentication secure. Building logic...</p>
    </div>
  );
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [isChecking, setIsChecking] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // If there's no user, kick them to login
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/patient/signin");
    }
  }, [user, loading, router]);

  // Handle Cooldown Timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);