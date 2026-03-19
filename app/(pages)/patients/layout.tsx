"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const [user, authLoading] = useAuthState(auth);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  // Define our funnel pages that SHOULD NOT have a sidebar
  const isSpecialPage = [
    "/patients/onboarding", 
    "/patients/waiting-room", 
    "/patients/rejected"
  ].includes(pathname);

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      if (authLoading) return;

      if (!user) {
        router.replace("/auth/patient/signin");
        return;
      }

      if (!user.emailVerified) {
        router.replace("/auth/patient/verify-email");
        return;
      }

      try {
        const profile = await getDoc(doc(db, "users", user.uid));
        if (!active) return;

        const data = profile.data();
        
        if (data?.role === "patient") {
          const status = data.connectionStatus;
          
          // Force them to the right page based on status
          if (status === "none" && pathname !== "/patients/onboarding") {
            router.replace("/patients/onboarding");
          } else if (status === "pending" && pathname !== "/patients/waiting-room") {
            router.replace("/patients/waiting-room");
          } else if (status === "rejected" && pathname !== "/patients/rejected") {
            router.replace("/patients/rejected");
          } else if (status === "accepted" && isSpecialPage) {
            // If they are approved but somehow on a special page, kick to home
            router.replace("/patients/home");
          } else {
            // They are exactly where they belong. Let them render!
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
    return () => { active = false; };
  }, [authLoading, router, user, pathname, isSpecialPage]);

  if (authLoading || isCheckingRole) {
    return (
      <div className="min-h-screen bg-[#080f1a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) return null;

  
  if (isSpecialPage) {
    return <>{children}</>;
  }

  // Otherwise, render the full Dashboard Layout!
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <PatientSidebar />
      <main className="flex-1 ml-72 relative flex flex-col min-w-0">
        <PatientTopbar /> 
        <div className="p-8 flex-1 overflow-y-auto animate-fade-in">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}