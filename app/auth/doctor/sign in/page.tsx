"use client";

export default function DoctorSignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900">
      <div className="w-full max-w-6xl mx-auto px-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
            {/* Left side - Doctor Illustration (will add next) */}
            <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-teal-500/20 to-cyan-500/20 p-12">
              <div className="text-white text-center">
                <h2 className="text-3xl font-bold mb-4">Welcome Back, Doctor</h2>
                <p className="text-teal-200">Sign in to access your dashboard</p>
              </div>
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

                {/* Form will go here */}
                <div className="space-y-6">
                  <p className="text-white text-center">Form coming soon...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}