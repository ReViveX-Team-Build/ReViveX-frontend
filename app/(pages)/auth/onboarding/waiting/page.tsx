"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/app/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { getPatientData, getDoctorData } from "@/app/lib/db/users";
import { Loader2, Clock, Stethoscope, CheckCircle2, BrainCircuit } from "lucide-react";

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; background: #F0F4F8; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes breathe {
    0%, 100% { transform: scale(1);    opacity: 1; }
    50%       { transform: scale(1.08); opacity: 0.85; }
  }
  @keyframes ripple {
    0%   { transform: scale(0.9);  opacity: 0.7; }
    100% { transform: scale(2.2);  opacity: 0; }
  }
  @keyframes tipSlide {
    from { opacity: 0; transform: translateX(12px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes successBurst {
    0%   { transform: scale(0.6); opacity: 0; }
    60%  { transform: scale(1.12); }
    100% { transform: scale(1);   opacity: 1; }
  }
`;
/* append to PAGE_CSS */

  .onb-root {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 24px 16px;
    background: linear-gradient(135deg, #F0F4F8 0%, #e8eef8 50%, #F0F4F8 100%);
    position: relative; overflow: hidden;
  }
  .onb-root::before {
    content: ''; position: absolute;
    top: -180px; right: -180px;
    width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(45,212,191,0.09) 0%, transparent 70%);
    pointer-events: none;
  }

  .onb-card {
    background: #ffffff;
    border-radius: 28px;
    border: 1px solid rgba(226,232,240,0.9);
    box-shadow: 0 8px 48px rgba(11,30,51,0.10), 0 2px 8px rgba(11,30,51,0.04);
    padding: 44px 48px;
    width: 100%; max-width: 480px;
    animation: fadeUp 0.52s cubic-bezier(0.22,1,0.36,1) both;
    text-align: center;
    position: relative; z-index: 1;
  }

  .step-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 36px; }
  .step-dot { width: 32px; height: 6px; border-radius: 999px; }
  .step-dot.done    { background: #2DD4BF; }
  .step-dot.active  { background: #2DD4BF; width: 48px; }
  .step-dot.pending { background: rgba(11,30,51,0.12); }
  .step-label { margin-left: auto; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.12em; }
  /* append to PAGE_CSS */

  /* Pulse orb */
  .pulse-orb-wrap {
    position: relative;
    width: 120px; height: 120px;
    margin: 0 auto 28px;
    display: flex; align-items: center; justify-content: center;
  }
  .pulse-ripple {
    position: absolute; inset: 0;
    border-radius: 50%;
    border: 2px solid rgba(45,212,191,0.35);
    animation: ripple 2.2s ease-out infinite;
  }
  .pulse-ripple:nth-child(2) { animation-delay: 0.7s; }
  .pulse-ripple:nth-child(3) { animation-delay: 1.4s; }
  .pulse-orb {
    width: 80px; height: 80px; border-radius: 50%;
    background: linear-gradient(135deg, #0B1E33 0%, #1e3a5f 100%);
    display: flex; align-items: center; justify-content: center;
    animation: breathe 3s ease-in-out infinite;
    box-shadow: 0 0 0 8px rgba(45,212,191,0.08), 0 8px 32px rgba(11,30,51,0.22);
    position: relative; z-index: 1;
  }
  .pulse-orb.success {
    background: linear-gradient(135deg, #059669, #10b981);
    animation: successBurst 0.5s ease both;
    box-shadow: 0 0 0 12px rgba(16,185,129,0.12), 0 8px 32px rgba(16,185,129,0.30);
  }

  /* Doctor chip */
  .doctor-chip {
    display: inline-flex; align-items: center; gap: 10px;
    background: rgba(11,30,51,0.05);
    border: 1px solid rgba(226,232,240,0.9);
    border-radius: 14px; padding: 10px 18px;
    margin: 18px auto;
  }
  .doctor-chip-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, #0B1E33, #1e3a5f);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
    border: 1.5px solid rgba(45,212,191,0.25);
  }

  /* Tips */
  .tips-list {
    text-align: left; margin-top: 28px;
    border-top: 1px solid rgba(226,232,240,0.9);
    padding-top: 24px;
    display: flex; flex-direction: column; gap: 12px;
  }
  .tip-row {
    display: flex; align-items: flex-start; gap: 12px;
    animation: tipSlide 0.35s ease both;
  }
  .tip-icon {
    width: 32px; height: 32px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  const TIPS = [
  {
    icon:   <BrainCircuit size={16} color="#8b5cf6" />,
    iconBg: "rgba(139,92,246,0.10)",
    text:   "ReViveX uses AI to personalize your therapy based on real sensor data from every session.",
  },
  {
    icon:   <Stethoscope size={16} color="#2DD4BF" />,
    iconBg: "rgba(45,212,191,0.10)",
    text:   "Your doctor will assign a custom therapy protocol once they accept your request.",
  },
  {
    icon:   <CheckCircle2 size={16} color="#f59e0b" />,
    iconBg: "rgba(245,158,11,0.10)",
    text:   "Consistent daily sessions lead to 3× faster recovery outcomes on average.",
  },
];

