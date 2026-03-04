"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Lottie from 'lottie-react';
import doctorAnimation from '@/public/animations/doctor-animation.json';
import { signInWithPatientId, signInWithEmail } from "@/app/lib/auth/patientAuth";

export default function PatientSignInPage() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<"patientId" | "email">("patientId");
  const [patientId, setPatientId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      let result;
      
      if (loginMethod === "patientId") {
        result = await signInWithPatientId(patientId, password);
      } else {
        result = await signInWithEmail(email, password);
      }
      
      if (result.success) {
        router.push("/patients/home");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="w-full max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {/* Left side */}
            <div className="lg:col-span-2 bg-gradient-to-br from-purple-400 via-pink-500 to-purple-500 p-8 flex flex-col justify-center min-h-[500px]">
              <h3 className="text-3xl font-bold text-white mb-6">ReViveX</h3>
              <h2 className="text-3xl font-bold text-white mb-3">
                Welcome Back! 👋
              </h2>
              <p className="text-purple-50 text-base">
                Sign in to continue your recovery journey
              </p>
              
              <div className="mt-8 flex justify-center">
                <Lottie 
                  animationData={doctorAnimation} 
                  loop={true}
                  className="w-64 h-64"
                />
              </div>
            </div>

            {/* Right side - Form */}
            <div className="lg:col-span-3 bg-white p-8">
              <div className="max-w-md mx-auto">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    Patient Portal
                  </h1>
                  <p className="text-gray-600 text-sm">
                    Enter your credentials to access your account
                  </p>
                </div>

                {/* Login Method Toggle */}
                <div className="flex gap-2 mb-6">
                  <button
                    type="button"
                    onClick={() => setLoginMethod("patientId")}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      loginMethod === "patientId"
                        ? "bg-purple-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Patient ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod("email")}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      loginMethod === "email"
                        ? "bg-purple-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Email
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Patient ID or Email Input */}
                  {loginMethod === "patientId" ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Patient ID
                      </label>
                      <input
                        type="text"
                        value={patientId}
                        onChange={(e) => {
                          setPatientId(e.target.value);
                          setError("");
                        }}
                        placeholder="e.g., p7a3b2f"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors text-gray-900 placeholder-gray-400"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Use the Patient ID provided during registration
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        placeholder="patient@example.com"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors text-gray-900 placeholder-gray-400"
                        required
                      />
                    </div>
                  )}

                  {/* Password Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors text-gray-900 placeholder-gray-400"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-purple-500 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-600">Remember me</span>
                    </label>
                    <Link 
                      href="/auth/patient/forgot-password" 
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </button>

                  {/* Sign Up Link */}
                  <p className="text-center text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Link 
                      href="/auth/patient/signup" 
                      className="text-purple-600 hover:text-purple-700 font-semibold"
                    >
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