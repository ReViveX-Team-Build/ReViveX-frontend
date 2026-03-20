"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc } from "firebase/firestore";
import DoctorSidebar from "@/components/DoctorPortal/Sidebar";
import DoctorTopbar from "@/components/DoctorPortal/Topbar";
import { auth, db } from "@/app/lib/firebase";

function DoctorLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, authLoading] = useAuthState(auth);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  // THE BACKDOOR
  const isDevMode = searchParams.get("dev") === "true";

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      if (isDevMode) {
        setIsAuthorized(true);
        setIsCheckingRole(false);
        return;
      }

      if (authLoading) return;
      if (!user) { router.replace("/auth/doctor/signin"); return; }
      if (!user.emailVerified) { router.replace("/auth/doctor/verify-email"); return; }

      try {
        const profile = await getDoc(doc(db, "users", user.uid));
        if (!active) return;
        const role = profile.data()?.role;
        if (role === "doctor") {
          setIsAuthorized(true);
        } else if (role === "patient") {
          router.replace("/patients/home");
        } else {
          router.replace("/auth/doctor/signin");
        }
      } catch (err) {
        if (active) router.replace("/auth/doctor/signin");
      } finally {
        if (active) setIsCheckingRole(false);
      }
    }

    checkAccess();
    return () => { active = false; };
  }, [authLoading, router, user, isDevMode]);

  if (authLoading || isCheckingRole) {
    return <div className="min-h-screen grid place-items-center bg-[#F3F4F6] dark:bg-slate-900"><p className="text-sm text-slate-500">Verifying credentials...</p></div>;
  }

  if (!isAuthorized) return null;

  return (
    <div className="flex min-h-screen bg-[#F3F4F6] dark:bg-slate-900">
      <DoctorSidebar />
      <main className="flex-1 ml-72 relative flex flex-col min-w-0">
        <DoctorTopbar />
        <div className="p-8 animate-fade-in"><div className="max-w-7xl mx-auto">{children}</div></div>
      </main>
    </div>
  );
}

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <DoctorLayoutContent>{children}</DoctorLayoutContent>
    </Suspense>
  );
}