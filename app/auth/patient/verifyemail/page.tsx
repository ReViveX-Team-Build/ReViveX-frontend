"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/lib/firebase"; 
import { sendEmailVerification, signOut } from "firebase/auth";
import { Mail, CheckCircle2, RefreshCw, LogOut, AlertCircle, ArrowRight } from "lucide-react";

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

  const handleCheckVerification = async () => {
    if (!user) return;
    setIsChecking(true);
    setMessage(null);

    try {
      await user.reload(); 
      
      if (user.emailVerified) {
        setMessage({ text: "Email verified successfully! Redirecting...", type: "success" });
        // Since it's a patient, send them to onboarding to finish profile & pick doctor!
        setTimeout(() => router.push("/patients/onboarding"), 1500);
      } else {
        setMessage({ text: "Email not verified yet. Please check your inbox.", type: "error" });
      }
    } catch (error) {
      console.error("Error checking verification:", error);
      setMessage({ text: "An error occurred while checking. Please try again.", type: "error" });
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (!user || resendCooldown > 0) return;
    
    try {
      await sendEmailVerification(user);
      setMessage({ text: "Verification email resent! Check your spam folder.", type: "success" });
      setResendCooldown(60); // 60 second cooldown
    } catch (error: any) {
      console.error("Error resending email:", error);
      if (error.code === 'auth/too-many-requests') {
        setMessage({ text: "Too many requests. Please wait a minute.", type: "error" });
      } else {
        setMessage({ text: "Failed to resend email. Please try again later.", type: "error" });
      }
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };