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