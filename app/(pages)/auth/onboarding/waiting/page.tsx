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

