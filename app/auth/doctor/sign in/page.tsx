"use client";

import { useState } from "react";
import AnimatedBackground from "@/components/Auth/AnimatedBackground";
import DoctorIllustration from "@/components/Auth/DoctorIllustration";
import AuthInput from "@/components/Auth/AuthInput";

export default function DoctorSignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <AnimatedBackground />
      
      <div className="w-full max-w-6xl mx-auto px-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
            {/* Left side - Doctor Illustration */}
            <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-teal-500/20 to-cyan-500/20 p-12">
              <DoctorIllustration />
            </div>

            {/* Right side - Sign In Form */}
            <div className="flex items-center justify-center p-12">
              <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-white mb-2">
                    Doctor Portal
                  </h1>
                  <p className="text-teal-200">Sign in to continue</p>
                </div>

                {/* Form */}
                <form className="space-y-6">
                  {/* Doctor ID Input */}
                  <AuthInput
                    label="Doctor ID"
                    type="text"
                    placeholder="Enter your doctor ID (e.g., d123)"
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                  />
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}