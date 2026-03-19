"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc } from "firebase/firestore";
import PatientSidebar from "@/components/PatientPortal/Sidebar";
import PatientTopbar from "@/components/PatientPortal/Topbar";
import { auth, db } from "@/app/lib/firebase"; 

export default function PatientLayout({
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

      // 1. Check if logged in at all
      if (!user) {
        router.replace("/auth/patient/signin");
        return;
      }

      // 2. Check if Email is Verified
      if (!user.emailVerified) {
        router.replace("/auth/patient/verify-email");
        return;
      }

      try {
        const profile = await getDoc(doc(db, "users", user.uid));
        if (!active) return;

        const data = profile.data();
        
        if (data?.role === "patient") {
          // 3. Check Doctor Approval Status
          if (data.connectionStatus === "none") {
            router.replace("/patients/onboarding"); // Need to pick a doctor
          } else if (data.connectionStatus === "pending") {
            router.replace("/patients/waiting-room"); // Waiting for approval
          } else if (data.connectionStatus === "rejected") {
            router.replace("/patients/rejected"); // Doctor denied
          } else {
            // connectionStatus === "accepted" -> Let them in!
            setIsAuthorized(true);
          }
        } else if (data?.role === "doctor") {
          router.replace("/doctor/home");
        } else {
          router.replace("/auth/patient/signin");
        }
      } catch (err) {
        console.error("Patient auth guard failed:", err);
        if (active) router.replace("/auth/patient/signin");
      } finally {
        if (active) setIsCheckingRole(false);
      }
    }

    checkAccess();

    return () => {
      active = false;
    };
  }, [authLoading, router, user]);

  // Show a loading state while we check Firebase
  if (authLoading || isCheckingRole) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F8FAFC]">
        <p className="text-sm text-slate-500">Checking authorization status...</p>
      </div>
    );
  }

  // If they aren't authorized, render nothing (the router will redirect them)
  if (!isAuthorized) return null;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]"> {/* Light Grey Background */}
      
      {/* 1. Fixed Sidebar */}
      <PatientSidebar />
      
      {/* 2. Main Content Wrapper */}
      <main className="flex-1 ml-72 relative flex flex-col min-w-0">

        {/* 3. Top Navigation */}
        <PatientTopbar /> 

        {/* 4. Page Content Injection */}
        <div className="p-8 flex-1 overflow-y-auto animate-fade-in">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>

      </main>
    </div>
  );
}