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
/* append to PAGE_CSS */

  .onb-root {
    min-height: 100vh;
    background: linear-gradient(135deg, #F0F4F8 0%, #e8eef8 50%, #F0F4F8 100%);
    padding: 32px 16px 48px;
    position: relative;
    overflow: hidden;
  }
  .onb-root::before {
    content: ''; position: absolute;
    top: -160px; right: -160px;
    width: 460px; height: 460px; border-radius: 50%;
    background: radial-gradient(circle, rgba(45,212,191,0.09) 0%, transparent 70%);
    pointer-events: none;
  }
  .onb-root::after {
    content: ''; position: absolute;
    bottom: -100px; left: -100px;
    width: 360px; height: 360px; border-radius: 50%;
    background: radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%);
    pointer-events: none;
  }

  .onb-header { max-width: 640px; margin: 0 auto 28px; animation: fadeUp 0.48s cubic-bezier(0.22,1,0.36,1) both; }

  .step-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
  .step-dot { width: 32px; height: 6px; border-radius: 999px; transition: background 0.3s; }
  .step-dot.done    { background: #2DD4BF; }
  .step-dot.active  { background: #2DD4BF; width: 48px; }
  .step-dot.pending { background: rgba(11,30,51,0.12); }
  .step-label { margin-left: auto; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.12em; }

  .search-bar {
    display: flex; align-items: center; gap: 10px;
    background: #ffffff;
    border: 1.5px solid rgba(226,232,240,0.9);
    border-radius: 14px; padding: 12px 18px;
    box-shadow: 0 2px 8px rgba(11,30,51,0.05);
    margin-top: 20px;
  }
  .search-bar input {
    flex: 1; border: none; outline: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; color: #0B1E33; background: transparent;
  }
  .search-bar input::placeholder { color: #cbd5e1; }
  /* append to PAGE_CSS */

  .doctors-grid { max-width: 640px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 12px; }

  .doctor-card {
    background: #ffffff;
    border: 1.5px solid rgba(226,232,240,0.9);
    border-radius: 18px; padding: 18px 20px;
    display: flex; align-items: center; gap: 16px;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
    animation: cardIn 0.38s ease both;
    position: relative; overflow: hidden;
  }
  .doctor-card:hover        { border-color: #2DD4BF; box-shadow: 0 4px 24px rgba(45,212,191,0.15); transform: translateY(-2px); }
  .doctor-card.selected     { border-color: #2DD4BF; box-shadow: 0 4px 28px rgba(45,212,191,0.20); background: rgba(45,212,191,0.03); }

  .doctor-avatar {
    width: 52px; height: 52px; border-radius: 50%;
    background: linear-gradient(135deg, #0B1E33, #1e3a5f);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; overflow: hidden;
    border: 2px solid rgba(45,212,191,0.20);
  }
  .doctor-avatar img   { width: 100%; height: 100%; object-fit: cover; }
  .doctor-initials     { font-size: 18px; font-weight: 800; color: #2DD4BF; letter-spacing: 0.05em; }

  .doctor-info  { flex: 1; min-width: 0; }
  .doctor-name  { font-size: 15px; font-weight: 700; color: #0B1E33; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .doctor-spec  { font-size: 12.5px; color: #64748b; display: flex; align-items: center; gap: 5px; }
  .doctor-id    { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #94a3b8; margin-top: 4px; }

  .select-badge {
    width: 30px; height: 30px; border-radius: 50%;
    background: rgba(45,212,191,0.12);
    border: 1.5px solid rgba(45,212,191,0.35);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: background 0.2s, border-color 0.2s;
  }
  .doctor-card.selected .select-badge { background: #2DD4BF; border-color: #2DD4BF; }

  .empty-state { text-align: center; padding: 48px 24px; color: #94a3b8; }