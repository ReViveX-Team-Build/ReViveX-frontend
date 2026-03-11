"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/app/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { getPatientData } from "@/app/lib/db/users";
import { XCircle, ArrowRight, Stethoscope, Loader2, LogOut } from "lucide-react";
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
  @keyframes shimmer {
    0%   { transform: translateX(-120%) skewX(-12deg); }
    100% { transform: translateX(220%)  skewX(-12deg); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-12px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-6px); }
    40%       { transform: translateX(6px); }
    60%       { transform: translateX(-4px); }
    80%       { transform: translateX(4px); }
  }
`;
  .onb-root {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 24px 16px;
    background: linear-gradient(135deg, #F0F4F8 0%, #fce8e8 40%, #F0F4F8 100%);
    position: relative; overflow: hidden;
  }
  .onb-root::before {
    content: ''; position: absolute;
    top: -160px; right: -160px;
    width: 440px; height: 440px; border-radius: 50%;
    background: radial-gradient(circle, rgba(239,68,68,0.07) 0%, transparent 70%);
    pointer-events: none;
  }
  .onb-root::after {
    content: ''; position: absolute;
    bottom: -120px; left: -120px;
    width: 360px; height: 360px; border-radius: 50%;
    background: radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%);
    pointer-events: none;
  }

  .onb-card {
    background: #ffffff;
    border-radius: 28px;
    border: 1px solid rgba(239,68,68,0.18);
    box-shadow: 0 8px 48px rgba(239,68,68,0.08), 0 2px 8px rgba(11,30,51,0.04);
    padding: 44px 48px;
    width: 100%; max-width: 460px;
    animation: fadeUp 0.52s cubic-bezier(0.22,1,0.36,1) both;
    position: relative; z-index: 1;
    text-align: center;
  }
  