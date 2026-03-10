"use client";
// app/(pages)/auth/onboarding/select-doctor/page.tsx
//
// ONBOARDING STEP 2 — Select a Doctor
//
// Flow:
//   1. Load all doctors via getDoctorsForListing()
//   2. Patient taps a doctor card → confirm modal
//   3. On confirm:
//        - updateDoc: patient.assignedDoctorId = doctorUid
//        - updateDoc: patient.connectionStatus = "pending"
//        - sendConnectionRequest(patientUid, patientName, doctorUid)
//   4. Navigate to /auth/onboarding/waiting

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/app/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { getDoctorsForListing, getPatientData } from "@/app/lib/db/users";
import { sendConnectionRequest } from "@/app/lib/db/communications";
import { DoctorData } from "@/app/lib/db/types";

import {
  Stethoscope, Search, UserCheck,
  Loader2, ChevronRight, X, CheckCircle2,
} from "lucide-react";
// Narrow Pick — only the fields the listing view actually needs
type DoctorListing = Pick
  DoctorData,
  "uid" | "name" | "specialization" | "profilePictureUrl" | "doctorId"
>;

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; background: #F0F4F8; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { transform: translateX(-120%) skewX(-12deg); }
    100% { transform: translateX(220%)  skewX(-12deg); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes modalIn {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.90); }
    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;