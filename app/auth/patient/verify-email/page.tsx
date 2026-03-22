"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/lib/firebase"; // Adjust path if needed
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

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#080f1a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  // If somehow they get here and are already verified, push them out
  useEffect(() => {
    if (!loading && user?.emailVerified) {
      router.replace("/patients/onboarding");
    }
  }, [user, loading, router]);

  // While checking/loading, show a placeholder so we don't return null too early
  if (loading || (user && user.emailVerified)) {
    return (
      <div className="min-h-screen bg-[#080f1a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080f1a] flex items-center justify-center p-4 relative overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{CSS}</style>
      
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        
        {/* Main Glass Card */}
        <div className="bg-[#0B1E33]/80 backdrop-blur-xl border border-teal-500/20 rounded-3xl p-8 md:p-10 shadow-2xl shadow-teal-900/20 text-center relative overflow-hidden">
          
          {/* Decorative Top Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-50" />

          {/* Glowing Mail Icon */}
          <div className="mx-auto w-24 h-24 bg-[#080f1a] border border-teal-500/30 rounded-2xl flex items-center justify-center mb-8 mail-icon-container">
            <Mail size={40} className="text-teal-400" strokeWidth={1.5} />
          </div>

          <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em" }}>
            VERIFY YOUR <span className="text-teal-400">EMAIL</span>
          </h1>
          
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            We've sent a secure verification link to <br/>
            <strong className="text-white font-medium">{user.email}</strong>. <br/>
            Please click the link in that email to activate your account.
          </p>

          {/* Status Message Toast */}
          {message && (
            <div className={`mb-6 p-3 rounded-xl flex items-center gap-3 text-sm font-medium ${
              message.type === 'success' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span className="text-left">{message.text}</span>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {/* Primary Action Button */}
            <button 
              onClick={handleCheckVerification}
              disabled={isChecking}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-teal-500 to-cyan-600 text-[#080f1a] font-bold text-sm tracking-widest uppercase py-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(45,212,191,0.4)]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative flex items-center justify-center gap-2">
                {isChecking ? (
                  <><RefreshCw size={18} className="animate-spin" /> Verifying...</>
                ) : (
                  <><CheckCircle2 size={18} /> I've Verified My Email</>
                )}
              </span>
            </button>

            {/* Resend Button */}
            <button 
              onClick={handleResendEmail}
              disabled={resendCooldown > 0}
              className="w-full py-4 rounded-xl border border-white/10 bg-white/5 text-slate-300 font-bold text-sm tracking-widest uppercase transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} className={resendCooldown > 0 ? "opacity-50" : ""} />
              {resendCooldown > 0 ? `Resend Available in ${resendCooldown}s` : "Resend Email"}
            </button>
          </div>

        </div>

        {/* Bottom Utility Link */}
        <div className="mt-8 flex justify-center">
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-red-400 transition-colors"
          >
            <LogOut size={14} /> Wrong Account? Sign Out
          </button>
        </div>

      </div>
    </div>
  );
}