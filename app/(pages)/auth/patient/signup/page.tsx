"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Lottie from 'lottie-react';
import doctorAnimation from '@/public/animations/doctor-animation.json';
import { registerPatient } from "@/app/lib/auth/patientAuth";

export default function PatientSignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    doctorId: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedPatientId, setGeneratedPatientId] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setError("");
    setIsLoading(true);

    try {
      const result = await registerPatient(
        formData.email,
        formData.password,
        formData.name,
        formData.doctorId
      );
      
      if (result.success) {
        setGeneratedPatientId(result.patientId || "");
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (err: any) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Success Modal
  if (generatedPatientId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Account Created Successfully! 🎉
          </h2>
          <p className="text-gray-600 mb-6">
            Welcome to ReViveX, {formData.name}!
          </p>
          
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Your Patient ID:</p>
            <p className="text-2xl font-bold text-purple-600 tracking-wider">
              {generatedPatientId}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Save this ID - you'll need it to sign in!
            </p>
          </div>

          <button
            onClick={() => router.push("/auth/onboarding/photo")}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Continue to Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8">
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {/* Left side - Branding */}
            <div className="lg:col-span-2 bg-gradient-to-br from-purple-400 via-pink-500 to-purple-500 p-8 flex flex-col justify-center">
              <h3 className="text-3xl font-bold text-white mb-6">ReViveX</h3>
              <h2 className="text-3xl font-bold text-white mb-3">
                Start Your Recovery Journey! 💪
              </h2>
              <p className="text-purple-50 text-base mb-8">
                Create your patient account and begin your path to better health
              </p>
              
              <div className="flex justify-center">
                <Lottie 
                  animationData={doctorAnimation} 
                  loop={true}
                  className="w-56 h-56"
                />
              </div>
            </div>

            {/* Right side - Sign Up Form */}
            <div className="lg:col-span-3 bg-white p-8">
              <div className="max-w-md mx-auto">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    Create Patient Account
                  </h1>
                  <p className="text-gray-600 text-sm">
                    Fill in your details to get started
                  </p>
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

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors text-gray-900"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="patient@example.com"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors text-gray-900"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Minimum 6 characters"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors text-gray-900"
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

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter password"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors text-gray-900"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>

                  {/* Doctor ID (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Doctor ID (Optional)
                    </label>
                    <input
                      type="text"
                      name="doctorId"
                      value={formData.doctorId}
                      onChange={handleChange}
                      placeholder="e.g., d123456"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter your doctor's ID to link your account
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-6"
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </button>

                  {/* Sign In Link */}
                  <p className="text-center text-sm text-gray-600 mt-4">
                    Already have an account?{" "}
                    <Link 
                      href="/auth/patient/signin" 
                      className="text-purple-600 hover:text-purple-700 font-semibold"
                    >
                      Sign in here
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