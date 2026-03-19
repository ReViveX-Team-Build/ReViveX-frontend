"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc } from "firebase/firestore";
import DoctorSidebar from "@/components/DoctorPortal/Sidebar";
import DoctorTopbar from "@/components/DoctorPortal/Topbar";
import { auth, db } from "@/app/lib/firebase"; // Adjust path if needed

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      if (authLoading) return;

      // 1. Check if logged in
      if (!user) {
        router.replace("/auth/doctor/signin");
        return;
      }

      // 2. Force Email Verification
      if (!user.emailVerified) {
        router.replace("/auth/doctor/verify-email");
        return;
      }

      try {
        const profile = await getDoc(doc(db, "users", user.uid));
        if (!active) return;

        const role = profile.data()?.role;
        if (role === "doctor") {
          // Doctors don't have a waiting room, so they go right in!
          setIsAuthorized(true);
        } else if (role === "patient") {
          router.replace("/patients/home");
        } else {
          router.replace("/auth/doctor/signin");
        }
      } catch (err) {
        console.error("Doctor auth guard failed:", err);
        if (active) router.replace("/auth/doctor/signin");
      } finally {
        if (active) setIsCheckingRole(false);
      }
    }

    checkAccess();

    return () => {
      active = false;
    };
  }, [authLoading, router, user]);

  if (authLoading || isCheckingRole) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F3F4F6] dark:bg-slate-900">
        <p className="text-sm text-slate-500">Verifying credentials...</p>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="flex min-h-screen bg-[#F3F4F6] dark:bg-slate-900">
    
      <DoctorSidebar />

      {/* 2. Main Wrapper */}
      <main className="flex-1 ml-72 relative flex flex-col min-w-0">
        {/* 3. Sticky Topbar */}
        <DoctorTopbar />

        {/* 4. Page Content Injection */}
        <div className="p-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}