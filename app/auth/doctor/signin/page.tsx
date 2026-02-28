"use client";

import { useState } from "react";
import Link from "next/link";
import Lottie from 'lottie-react';
import doctorAnimation from '@/public/animations/doctor-animation.json';

export default function DoctorSignInPage() {
  const [doctorId, setDoctorId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Add Firebase authentication later
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900">
      <div className="w-full max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {/* Left side - Branding & Animation */}
            <div className="lg:col-span-2 bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500 p-8 flex flex-col justify-center min-h-[500px]">
              <h3 className="text-3xl font-bold text-white mb-6">ReViveX</h3>
              <h2 className="text-3xl font-bold text-white mb-3">
                Welcome Back,<br />Doctor! 👋
              </h2>
              <p className="text-teal-50 text-base">
                Sign in to access your patient dashboard
              </p>
              
              {/* Lottie Animation */}
              <div className="mt-8 flex justify-center">
                <Lottie 
                  animationData={doctorAnimation} 
                  loop={true}
                  className="w-64 h-64"
                />
              </div>
            </div>

            {/* Right side - Sign In Form */}
            <div className="lg:col-span-3 bg-white p-8">
              <div className="max-w-md mx-auto">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    Doctor Portal
                  </h1>
                  <p className="text-gray-600 text-sm">
                    Enter your credentials to access your account
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Doctor ID Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Doctor ID
                    </label>
                    <input
                      type="text"
                      value={doctorId}
                      onChange={(e) => setDoctorId(e.target.value)}
                      placeholder="e.g., d123"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 transition-colors text-gray-900 placeholder-gray-400"
                      required
                    />
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 transition-colors text-gray-900 placeholder-gray-400"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
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
                        className="w-4 h-4 text-teal-500 border-gray-300 rounded focus:ring-teal-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">Remember me</span>
                    </label>
                    <Link 
                      href="/auth/doctor/forgot-password" 
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </button>

                  {/* Sign Up Link */}
                  <p className="text-center text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Link 
                      href="/auth/doctor/signup" 
                      className="text-teal-600 hover:text-teal-700 font-semibold transition-colors"
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