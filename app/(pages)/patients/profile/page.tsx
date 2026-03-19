"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User as UserIcon, Mail, Phone, PenLine, ClipboardList,
  Calendar, Loader2, CheckCircle2, Camera, X, Zap, Flame,
  Brain, Activity, Shield, ChevronRight, LogOut, Heart, Lock,
} from "lucide-react";
import { auth, db, storage } from "../../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile, type User } from "firebase/auth";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

interface PatientProfile {
  name: string; email: string; phone: string;
  goals: string; bio: string; condition: string;
  affectedSide: string; streak: number; totalXp: number;
  assignedProtocol: string; nextAppointment: string;
  profilePictureUrl: string; unlockedLevels: number[];
  completedSessions: number; joinedAt: string;
}

const EMPTY: PatientProfile = {
  name:"", email:"", phone:"", goals:"", bio:"", condition:"",
  affectedSide:"", streak:0, totalXp:0, assignedProtocol:"Not Assigned",
  nextAppointment:"—", profilePictureUrl:"", unlockedLevels:[],
  completedSessions:0, joinedAt:"",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

  .pf * { font-family:'Plus Jakarta Sans',system-ui,sans-serif; box-sizing:border-box; }
  .pf .mono { font-family:'JetBrains Mono',monospace; }

  @keyframes cardPop {
    from { opacity:0; transform:translateY(16px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(22px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes barShimmer {
    0%   { transform:translateX(-100%); }
    100% { transform:translateX(250%); }
  }
  @keyframes headerShine {
    0%   { transform:translateX(-200%) skewX(-15deg); }
    100% { transform:translateX(400%)  skewX(-15deg); }
  }
  @keyframes dotBlink {
    0%,100% { opacity:1; } 50% { opacity:0.25; }
  }
  @keyframes xpFill { from { width:0; } }
  @keyframes glow {
    0%,100% { box-shadow:0 0 0 0 rgba(45,212,191,0.35); }
    50%     { box-shadow:0 0 0 8px rgba(45,212,191,0); }
  }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes shimmerSlide {
    0%   { transform:translateX(-200%); }
    100% { transform:translateX(300%);  }
  }

  .pf-card {
    background:#fff; border-radius:22px;
    border:1px solid rgba(226,232,240,0.9);
    box-shadow:0 2px 18px rgba(11,30,51,0.055);
    transition:transform 0.28s cubic-bezier(0.22,1,0.36,1), box-shadow 0.28s ease;
  }

  .pf-input {
    width:100%; background:#f8fafc;
    border:1.5px solid rgba(226,232,240,0.8);
    color:#0B1E33; padding:10px 12px; font-size:14px;
    border-radius:10px; outline:none;
    transition:border-color .25s, background .25s;
    font-family:'Plus Jakarta Sans',system-ui,sans-serif;
    resize:none; font-weight:500;
  }
  .pf-input:focus { border-color:#2DD4BF; background:#f0fdfb; }
  .pf-input:disabled { opacity:.5; cursor:not-allowed; background:#f1f5f9; }
  .pf-input::placeholder { color:#94a3b8; font-weight:400; }

  .pf-select {
    width:100%; background:#f8fafc;
    border:1.5px solid rgba(226,232,240,0.8);
    color:#0B1E33; padding:10px 36px 10px 12px; font-size:14px;
    border-radius:10px; outline:none; appearance:none; cursor:pointer;
    font-family:'Plus Jakarta Sans',system-ui,sans-serif; font-weight:500;
    transition:border-color .25s;
  }
  .pf-select:focus { border-color:#2DD4BF; background:#f0fdfb; }

  .pf-save-btn {
    position:relative; overflow:hidden; cursor:pointer;
    display:flex; align-items:center; justify-content:center; gap:8px;
    width:100%; padding:15px; border-radius:14px;
    font-family:'JetBrains Mono',monospace;
    font-size:13px; letter-spacing:.10em; font-weight:700; text-transform:uppercase;
    background:#0B1E33; color:#2DD4BF;
    border:1.5px solid rgba(45,212,191,0.35);
    transition:all .3s ease; outline:none;
  }
  .pf-save-btn::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(90deg,transparent,rgba(45,212,191,0.12),transparent);
    animation:headerShine 2.8s ease-in-out infinite;
  }
  .pf-save-btn:hover:not(:disabled) {
    background:#112840; box-shadow:0 8px 28px rgba(45,212,191,0.22);
    transform:translateY(-2px);
  }
  .pf-save-btn:disabled { opacity:.45; cursor:not-allowed; }

  .fl { font-family:'JetBrains Mono',monospace; font-size:9px; font-weight:700;
    text-transform:uppercase; letter-spacing:.18em; margin-bottom:6px;
    display:flex; align-items:center; justify-content:space-between; color:#64748b; }
  .fl-edit { color:#2DD4BF; font-size:8px; display:flex; align-items:center; gap:3px; }

  .sep { height:1px; background:rgba(226,232,240,0.8); margin:20px 0; }

  .toast {
    position:fixed; bottom:28px; right:28px; z-index:9999;
    background:#0B1E33; border:1px solid rgba(45,212,191,0.3);
    border-radius:14px; padding:13px 20px;
    display:flex; align-items:center; gap:10px;
    box-shadow:0 8px 32px rgba(11,30,51,0.22);
    animation:fadeUp .35s cubic-bezier(.22,1,.36,1);
  }

  .stat-chip {
    display:flex; align-items:center; gap:6px; padding:6px 12px;
    border-radius:10px; background:#f8fafc;
    border:1px solid rgba(226,232,240,0.9);
  }

  .xp-bar-track {
    height:7px; background:rgba(11,30,51,0.07); border-radius:99px; overflow:hidden;
  }
  .xp-bar-fill {
    height:100%; border-radius:99px;
    background:linear-gradient(90deg,#14b8a6,#2DD4BF);
    box-shadow:0 0 10px rgba(45,212,191,0.45);
    animation:xpFill 1.4s cubic-bezier(.22,1,.36,1) .3s both;
    position:relative;
  }
  .xp-bar-fill::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent);
    animation:barShimmer 2.2s ease-in-out infinite;
  }

  .avatar-ring { animation:glow 3s ease-in-out infinite; }
`;

export default function PatientProfilePage() {
  const router = useRouter();
  const [user, setUser]                   = useState<User | null>(null);
  const [data, setData]                   = useState<PatientProfile>(EMPTY);
  const [draft, setDraft]                 = useState<PatientProfile>(EMPTY);
  const [isLoading, setIsLoading]         = useState(true);
  const [isSaving, setIsSaving]           = useState(false);
  const [isUploading, setIsUploading]     = useState(false);
  const [toast, setToast]                 = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u: User | null) => {
      if (!u) { router.replace("/auth/patient/signin"); return; }
      setUser(u);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setIsLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const raw  = snap.exists() ? snap.data() : {};
        const g    = raw.gamification || {};
        const profile: PatientProfile = {
          name:              raw.name                || user.displayName || "",
          email:             raw.email               || user.email       || "",
          phone:             raw.phone               || "",
          goals:             raw.goals               || "",
          bio:               raw.bio                 || "",
          condition:         raw.condition           || "",
          affectedSide:      raw.affectedSide        || "",
          streak:            g.currentStreak         || 0,
          totalXp:           g.totalXp               || 0,
          assignedProtocol:  raw.assignedProtocol    || "Not Assigned",
          nextAppointment:   raw.nextAppointment     || "—",
          profilePictureUrl: raw.profilePictureUrl   || user.photoURL    || "", 
          unlockedLevels:    g.unlockedLevels        || [],
          completedSessions: raw.completedSessions   || 0,
          joinedAt:          raw.createdAt?.toDate?.()?.toISOString?.() || "",
        };
        setData(profile); setDraft(profile);
        if (profile.profilePictureUrl) setAvatarPreview(profile.profilePictureUrl);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    })();
  }, [user]);