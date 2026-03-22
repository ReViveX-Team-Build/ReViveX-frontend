"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Lottie from "lottie-react";
import doctorAnimation from "@/public/animations/doctor-animation.json";
import { signInWithDoctorId, signInWithEmail } from "@/app/lib/auth/doctorAuth";

function DoctorSignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginMethod, setLoginMethod] = useState<"doctorId" | "email">("doctorId");
  const [doctorId, setDoctorId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const prefilledEmail = searchParams.get("email");
    if (prefilledEmail) {
      setLoginMethod("email");
      setEmail(prefilledEmail);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      let result;

      if (loginMethod === "doctorId") {
        result = await signInWithDoctorId(doctorId, password);
      } else {
        result = await signInWithEmail(email, password);
      }

      if (result.success) {
        router.push("/doctor/home");
      } else {
        setError(result.error || "Sign in failed");
      }
    } catch (err: any) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#080f1a] via-[#0B1E33] to-[#060e1c] relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(45,212,191,0.08),transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(45,212,191,0.06),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(45,212,191,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,0.02)_1px,transparent_1px)] bg-[size:44px_44px]" />
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 py-8 relative z-10">
        <div className="bg-gradient-to-br from-[#0B1E33] to-[#060e1c] rounded-2xl shadow-[0_0_50px_rgba(45,212,191,0.15)] overflow-hidden border border-[rgba(45,212,191,0.2)]">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {/* Left Side - Dark Aqua Theme */}
            <div className="lg:col-span-2 bg-gradient-to-br from-[#0B1E33] via-[#0d1f38] to-[#060e1c] p-8 flex flex-col justify-center min-h-[500px] relative overflow-hidden border-r border-[rgba(45,212,191,0.15)]">
              {/* Teal Glow Effects */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle,rgba(45,212,191,0.15),transparent_60%)] blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[radial-gradient(circle,rgba(45,212,191,0.1),transparent_60%)] blur-2xl" />
              
              <div className="relative z-10">
                <h3 className="text-3xl font-bold text-white mb-6 tracking-wide">
                  REVIVE<span className="text-[#2DD4BF]">X</span>
                </h3>
                <h2 className="text-3xl font-bold text-white mb-3">
                  Welcome Back,
                  <br />
                  Doctor !
                </h2>
                <p className="text-gray-300 text-base">
                  Sign in to access your patient dashboard
                </p>

                <div className="mt-8 flex justify-center">
                  <Lottie
                    animationData={doctorAnimation}
                    loop={true}
                    className="w-64 h-64"
                  />
                </div>
              </div>

              {/* Corner Accents */}
              <div className="absolute top-6 left-6 w-6 h-6 border-t-2 border-l-2 border-[#2DD4BF] opacity-40" />
              <div className="absolute bottom-6 right-6 w-6 h-6 border-b-2 border-r-2 border-[#2DD4BF] opacity-40" />
            </div>

            {/* Right Side - Dark Form */}
            <div className="lg:col-span-3 bg-[#0a0e1a] p-8">
              <div className="max-w-md mx-auto">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-white mb-1">
                    Doctor Portal
                  </h1>
                  <p className="text-gray-400 text-sm">
                    Enter your credentials to access your account
                  </p>
                </div>

                {/* Login Method Toggle */}
                <div className="flex gap-2 mb-6">
                  <button
                    type="button"
                    onClick={() => setLoginMethod("doctorId")}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                      loginMethod === "doctorId"
                        ? "bg-gradient-to-r from-[#2DD4BF] to-[#0d9488] text-[#0B1E33] shadow-[0_0_20px_rgba(45,212,191,0.3)]"
                        : "bg-[rgba(30,41,59,0.6)] text-gray-400 hover:bg-[rgba(30,41,59,0.8)] border border-[rgba(71,85,105,0.4)]"
                    }`}>
                    Doctor ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod("email")}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                      loginMethod === "email"
                        ? "bg-gradient-to-r from-[#2DD4BF] to-[#0d9488] text-[#0B1E33] shadow-[0_0_20px_rgba(45,212,191,0.3)]"
                        : "bg-[rgba(30,41,59,0.6)] text-gray-400 hover:bg-[rgba(30,41,59,0.8)] border border-[rgba(71,85,105,0.4)]"
                    }`}>
                    Email
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-lg">
                    <p className="text-sm text-red-400 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
                  {/* Doctor ID or Email Input */}
                  {loginMethod === "doctorId" ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Doctor ID
                      </label>
                      <input
                        type="text"
                        value={doctorId}
                        onChange={(e) => {
                          setDoctorId(e.target.value);
                          setError("");
                        }}
                        placeholder="e.g., d7a3b2f"
                        autoComplete="off"
                        className="w-full px-4 py-2.5 bg-[rgba(30,41,59,0.7)] border border-[rgba(71,85,105,0.5)] rounded-lg focus:outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[rgba(45,212,191,0.2)] focus:bg-[rgba(30,41,59,0.9)] transition-all text-white placeholder-gray-500"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Use the Doctor ID provided during registration
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        placeholder="doctor@example.com"
                        autoComplete="off"
                        className="w-full px-4 py-2.5 bg-[rgba(30,41,59,0.7)] border border-[rgba(71,85,105,0.5)] rounded-lg focus:outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[rgba(45,212,191,0.2)] focus:bg-[rgba(30,41,59,0.9)] transition-all text-white placeholder-gray-500"
                        required
                      />
                    </div>
                  )}

                  {/* Password Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError("");
                        }}
                        placeholder="Enter your password"
                        autoComplete="new-password"
                        className="w-full px-4 py-2.5 bg-[rgba(30,41,59,0.7)] border border-[rgba(71,85,105,0.5)] rounded-lg focus:outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[rgba(45,212,191,0.2)] focus:bg-[rgba(30,41,59,0.9)] transition-all text-white placeholder-gray-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2DD4BF] transition-colors">
                        {showPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 bg-[rgba(30,41,59,0.7)] border-2 border-[rgba(71,85,105,0.6)] rounded peer-checked:bg-[#2DD4BF] peer-checked:border-[#2DD4BF] transition-all flex items-center justify-center">
                          {rememberMe && (
                            <svg className="w-3 h-3 text-[#0B1E33]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="ml-2 text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                        Remember me
                      </span>
                    </label>
                    <Link
                      href="/auth/doctor/forgot-password"
                      className="text-sm text-[#2DD4BF] hover:text-[#14b8a6] font-medium transition-colors">
                      Forgot password?
                    </Link>
                  </div>

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-[#2DD4BF] to-[#0d9488] text-[#0B1E33] py-2.5 rounded-lg font-semibold shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_30px_rgba(45,212,191,0.5)] transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                    {isLoading ? "Signing in..." : "Sign In"}
                  </button>

                  {/* Sign Up Link */}
                  <p className="text-center text-sm text-gray-400">
                    Don't have an account?{" "}
                    <Link
                      href="/auth/doctor/signup"
                      className="text-[#2DD4BF] hover:text-[#14b8a6] font-semibold transition-colors">
                      Sign up here
                    </Link>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DoctorSignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080f1a]" />}>
      <DoctorSignInContent />
    </Suspense>
  );
}
