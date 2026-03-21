"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Lottie from "lottie-react";
import doctorAnimation from "@/public/animations/doctor-animation.json";
import { registerDoctor } from "@/app/lib/auth/doctorAuth";

export default function DoctorSignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    specialization: "General Medicine",
    licenseNumber: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailExists, setEmailExists] = useState(false);
  const [generatedDoctorId, setGeneratedDoctorId] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setEmailExists(false);
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
    setEmailExists(false);
    setIsLoading(true);

    try {
      const result = await registerDoctor(
        formData.email,
        formData.password,
        formData.name,
        formData.specialization,
        formData.licenseNumber,
      );

      if (result.success) {
        setGeneratedDoctorId(result.doctorId || "");
      } else {
        setError(result.error || "Registration failed");
        setEmailExists(
          result.status === "EXISTS" ||
            result.code === "auth/email-already-in-use",
        );
      }
    } catch (err: any) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Success Modal
  if (generatedDoctorId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#080f1a] via-[#0B1E33] to-[#060e1c] p-4 relative overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(45,212,191,0.1),transparent_70%)]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(45,212,191,0.08),transparent_70%)]" />
        </div>

        <div className="bg-gradient-to-br from-[#0B1E33] to-[#060e1c] rounded-2xl shadow-[0_0_60px_rgba(45,212,191,0.2)] p-8 max-w-md w-full text-center border border-[rgba(45,212,191,0.3)] relative z-10">
          <div className="w-20 h-20 bg-[rgba(45,212,191,0.15)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[rgba(45,212,191,0.3)]">
            <svg
              className="w-10 h-10 text-[#2DD4BF]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Account Created Successfully! 🎉
          </h2>
          <p className="text-gray-400 mb-6">
            Welcome to ReViveX, Dr. {formData.name}!
          </p>

          <div className="bg-[rgba(45,212,191,0.08)] border-2 border-[#2DD4BF] rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400 mb-2">Your Doctor ID:</p>
            <p className="text-2xl font-bold text-[#2DD4BF] tracking-wider">
              {generatedDoctorId}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Save this ID - you'll need it to sign in!
            </p>
          </div>

          <button
            onClick={() => router.push("/auth/doctor/signin")}
            className="w-full bg-gradient-to-r from-[#2DD4BF] to-[#0d9488] text-[#0B1E33] py-3 rounded-lg font-semibold shadow-[0_0_20px_rgba(45,212,191,0.4)] hover:shadow-[0_0_30px_rgba(45,212,191,0.6)] transition-all duration-300">
            Continue to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#080f1a] via-[#0B1E33] to-[#060e1c] py-8 relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(45,212,191,0.08),transparent_70%)]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(45,212,191,0.06),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(45,212,191,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,0.02)_1px,transparent_1px)] bg-[size:44px_44px]" />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 relative z-10">
        <div className="bg-gradient-to-br from-[#0B1E33] to-[#060e1c] rounded-2xl shadow-[0_0_50px_rgba(45,212,191,0.15)] overflow-hidden border border-[rgba(45,212,191,0.2)]">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {/* Left Side - Dark Aqua Branding */}
            <div className="lg:col-span-2 bg-gradient-to-br from-[#0B1E33] via-[#0d1f38] to-[#060e1c] p-8 flex flex-col justify-center relative overflow-hidden border-r border-[rgba(45,212,191,0.15)]">
              {/* Teal Glow Effects */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle,rgba(45,212,191,0.15),transparent_60%)] blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[radial-gradient(circle,rgba(45,212,191,0.1),transparent_60%)] blur-2xl" />
              
              <div className="relative z-10">
                <h3 className="text-3xl font-bold text-white mb-6 tracking-wide">
                  REVIVE<span className="text-[#2DD4BF]">X</span>
                </h3>
                <h2 className="text-3xl font-bold text-white mb-3">
                  Join Our Platform 🚀
                </h2>
                <p className="text-gray-300 text-base mb-8">
                  Create your doctor account and start helping patients recover better
                </p>

                <div className="flex justify-center">
                  <Lottie
                    animationData={doctorAnimation}
                    loop={true}
                    className="w-56 h-56"
                  />
                </div>
              </div>

              {/* Corner Accents */}
              <div className="absolute top-6 left-6 w-6 h-6 border-t-2 border-l-2 border-[#2DD4BF] opacity-40" />
              <div className="absolute bottom-6 right-6 w-6 h-6 border-b-2 border-r-2 border-[#2DD4BF] opacity-40" />
            </div>

            {/* Right Side - Dark Sign Up Form */}
            <div className="lg:col-span-3 bg-[#0a0e1a] p-8">
              <div className="max-w-md mx-auto">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-white mb-1">
                    Create Doctor Account
                  </h1>
                  <p className="text-gray-400 text-sm">
                    Fill in your details to get started
                  </p>
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
                    {emailExists && (
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/auth/doctor/signin?email=${encodeURIComponent(formData.email)}`,
                          )
                        }
                        className="mt-2 text-sm font-semibold text-[#2DD4BF] hover:text-[#14b8a6] transition-colors">
                        Account already exists. Sign in instead.
                      </button>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Dr. John Smith"
                      autoComplete="off"
                      className="w-full px-4 py-2.5 bg-[rgba(30,41,59,0.7)] border border-[rgba(71,85,105,0.5)] rounded-lg focus:outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[rgba(45,212,191,0.2)] focus:bg-[rgba(30,41,59,0.9)] transition-all text-white placeholder-gray-500"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="doctor@hospital.com"
                      autoComplete="off"
                      className="w-full px-4 py-2.5 bg-[rgba(30,41,59,0.7)] border border-[rgba(71,85,105,0.5)] rounded-lg focus:outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[rgba(45,212,191,0.2)] focus:bg-[rgba(30,41,59,0.9)] transition-all text-white placeholder-gray-500"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Minimum 6 characters"
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

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                        className="w-full px-4 py-2.5 bg-[rgba(30,41,59,0.7)] border border-[rgba(71,85,105,0.5)] rounded-lg focus:outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[rgba(45,212,191,0.2)] focus:bg-[rgba(30,41,59,0.9)] transition-all text-white placeholder-gray-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2DD4BF] transition-colors">
                        {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>

                  {/* Specialization */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Specialization
                    </label>
                    <select
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-[rgba(30,41,59,0.7)] border border-[rgba(71,85,105,0.5)] rounded-lg focus:outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[rgba(45,212,191,0.2)] focus:bg-[rgba(30,41,59,0.9)] transition-all text-white">
                      <option value="General Medicine" className="bg-[#1e293b]">General Medicine</option>
                      <option value="Neurology" className="bg-[#1e293b]">Neurology</option>
                      <option value="Cardiology" className="bg-[#1e293b]">Cardiology</option>
                      <option value="Orthopedics" className="bg-[#1e293b]">Orthopedics</option>
                      <option value="Physical Therapy" className="bg-[#1e293b]">Physical Therapy</option>
                      <option value="Rehabilitation" className="bg-[#1e293b]">Rehabilitation</option>
                      <option value="Sports Medicine" className="bg-[#1e293b]">Sports Medicine</option>
                      <option value="Other" className="bg-[#1e293b]">Other</option>
                    </select>
                  </div>

                  {/* License Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      License Number (Optional)
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      placeholder="Medical license number"
                      autoComplete="off"
                      className="w-full px-4 py-2.5 bg-[rgba(30,41,59,0.7)] border border-[rgba(71,85,105,0.5)] rounded-lg focus:outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[rgba(45,212,191,0.2)] focus:bg-[rgba(30,41,59,0.9)] transition-all text-white placeholder-gray-500"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-[#2DD4BF] to-[#0d9488] text-[#0B1E33] py-3 rounded-lg font-semibold shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_30px_rgba(45,212,191,0.5)] transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-6">
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </button>

                  {/* Sign In Link */}
                  <p className="text-center text-sm text-gray-400 mt-4">
                    Already have an account?{" "}
                    <Link
                      href="/auth/doctor/signin"
                      className="text-[#2DD4BF] hover:text-[#14b8a6] font-semibold transition-colors">
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
