"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/lib/firebase";
import { Mail, CheckCircle2, ArrowRight, RefreshCw } from "lucide-react";
import { sendEmailVerification } from "firebase/auth";

export default function DoctorVerifyEmailPage() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    if (!loading && user?.emailVerified) {
      // If already verified, move them to the doctor dashboard
      router.replace("/doctor/home");
    }
  }, [user, loading, router]);

  const handleResend = async () => {
    if (user) {
      try {
        await sendEmailVerification(user);
        alert("Verification email resent!");
      } catch (err) {
        console.error("Resend failed:", err);
      }
    }
  };

  // While checking auth status or if already verified (waiting for redirect)
  if (loading || (user && user.emailVerified)) {
    return (
      <div className="min-h-screen bg-[#080f1a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  // If no user is logged in at all, send them back to sign-in
  if (!user) {
    return (
      <div className="min-h-screen bg-[#080f1a] flex items-center justify-center p-4">
        <div className="bg-[#0B1E33]/80 backdrop-blur-xl border border-teal-500/20 rounded-3xl p-8 text-center max-w-md">
          <p className="text-white mb-6">You need to be signed in to verify your email.</p>
          <button 
            onClick={() => router.push("/auth/doctor/signin")}
            className="w-full bg-teal-500 text-[#080f1a] font-bold py-3 rounded-xl"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080f1a] flex items-center justify-center p-4">
      <div className="bg-[#0B1E33]/80 backdrop-blur-xl border border-teal-500/20 rounded-3xl p-10 text-center max-w-lg relative overflow-hidden">
        {/* Aesthetic Background Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/10 blur-[80px] pointer-events-none" />
        
        <div className="mx-auto w-20 h-20 bg-teal-500/10 border border-teal-500/30 rounded-2xl flex items-center justify-center mb-8">
          <Mail size={40} className="text-teal-400" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">VERIFY YOUR EMAIL</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Welcome to the ReViveX clinical team. We've sent a verification link to <span className="text-teal-400 font-medium">{user.email}</span>. 
          Please check your inbox to activate your professional portal.
        </p>

        <div className="space-y-4">
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-teal-500 hover:bg-teal-400 text-[#080f1a] font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
          >
            I've Verified My Email
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <button 
            onClick={handleResend}
            className="w-full bg-white/5 hover:bg-white/10 text-slate-300 font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Resend Email
          </button>
        </div>

        <p className="mt-8 text-xs text-slate-500 uppercase tracking-widest">
          Secure Medical Gateway · ReViveX v1.0
        </p>
      </div>
    </div>
  );
}