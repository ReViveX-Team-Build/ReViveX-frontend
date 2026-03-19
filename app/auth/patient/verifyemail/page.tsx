"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/lib/firebase"; 
import { sendEmailVerification, signOut } from "firebase/auth";
import { Mail, CheckCircle2, RefreshCw, LogOut, AlertCircle, ArrowRight } from "lucide-react";

const CSS = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 30px rgba(45,212,191,0.2), inset 0 0 20px rgba(45,212,191,0.1); }
    50% { box-shadow: 0 0 60px rgba(45,212,191,0.4), inset 0 0 30px rgba(45,212,191,0.2); }
  }
  .mail-icon-container {
    animation: float 4s ease-in-out infinite, pulseGlow 3s ease-in-out infinite;
  }
`;