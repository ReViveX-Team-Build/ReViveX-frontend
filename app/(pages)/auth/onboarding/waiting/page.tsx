"use client";


import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/app/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { getPatientData, getDoctorData } from "@/app/lib/db/users";
import { Loader2, Clock, Stethoscope, CheckCircle2, BrainCircuit } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
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

  .onb-root {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    background: linear-gradient(135deg, #F0F4F8 0%, #e8eef8 50%, #F0F4F8 100%);
    position: relative;
    overflow: hidden;
  }
  .onb-root::before {
    content: '';
    position: absolute;
    top: -180px; right: -180px;
    width: 500px; height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(45,212,191,0.09) 0%, transparent 70%);
    pointer-events: none;
  }

  .onb-card {
    background: #ffffff;
    border-radius: 28px;
    border: 1px solid rgba(226,232,240,0.9);
    box-shadow: 0 8px 48px rgba(11,30,51,0.10), 0 2px 8px rgba(11,30,51,0.04);
    padding: 44px 48px;
    width: 100%;
    max-width: 480px;
    animation: fadeUp 0.52s cubic-bezier(0.22,1,0.36,1) both;
    text-align: center;
    position: relative;
    z-index: 1;
  }

  .step-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 36px;
  }
  .step-dot { width: 32px; height: 6px; border-radius: 999px; }
  .step-dot.done    { background: #2DD4BF; }
  .step-dot.active  { background: #2DD4BF; width: 48px; }
  .step-dot.pending { background: rgba(11,30,51,0.12); }
  .step-label { margin-left: auto; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.12em; }

  /* Pulse orb */
  .pulse-orb-wrap {
    position: relative;
    width: 120px; height: 120px;
    margin: 0 auto 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pulse-ripple {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 2px solid rgba(45,212,191,0.35);
    animation: ripple 2.2s ease-out infinite;
  }
  .pulse-ripple:nth-child(2) { animation-delay: 0.7s; }
  .pulse-ripple:nth-child(3) { animation-delay: 1.4s; }
  .pulse-orb {
    width: 80px; height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0B1E33 0%, #1e3a5f 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: breathe 3s ease-in-out infinite;
    box-shadow: 0 0 0 8px rgba(45,212,191,0.08), 0 8px 32px rgba(11,30,51,0.22);
    position: relative;
    z-index: 1;
  }
  .pulse-orb.success {
    background: linear-gradient(135deg, #059669, #10b981);
    animation: successBurst 0.5s ease both;
    box-shadow: 0 0 0 12px rgba(16,185,129,0.12), 0 8px 32px rgba(16,185,129,0.30);
  }

  /* Doctor chip */
  .doctor-chip {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: rgba(11,30,51,0.05);
    border: 1px solid rgba(226,232,240,0.9);
    border-radius: 14px;
    padding: 10px 18px;
    margin: 18px auto;
  }
  .doctor-chip-avatar {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0B1E33, #1e3a5f);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
    border: 1.5px solid rgba(45,212,191,0.25);
  }

  /* Tips */
  .tips-list {
    text-align: left;
    margin-top: 28px;
    border-top: 1px solid rgba(226,232,240,0.9);
    padding-top: 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .tip-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    animation: tipSlide 0.35s ease both;
  }
  .tip-icon {
    width: 32px; height: 32px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// TIPS shown while waiting
// ─────────────────────────────────────────────────────────────────────────────
const TIPS = [
  {
    icon: <BrainCircuit size={16} color="#8b5cf6" />,
    iconBg: "rgba(139,92,246,0.10)",
    text: "ReViveX uses AI to personalize your therapy based on real sensor data from every session.",
  },
  {
    icon: <Stethoscope size={16} color="#2DD4BF" />,
    iconBg: "rgba(45,212,191,0.10)",
    text: "Your doctor will assign a custom therapy protocol once they accept your request.",
  },
  {
    icon: <CheckCircle2 size={16} color="#f59e0b" />,
    iconBg: "rgba(245,158,11,0.10)",
    text: "Consistent daily sessions lead to 3× faster recovery outcomes on average.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function OnboardingWaiting() {
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);

  const [doctorName,   setDoctorName]   = useState<string>("");
  const [doctorPhoto,  setDoctorPhoto]  = useState<string | null>(null);
  const [accepted,     setAccepted]     = useState(false);
  const [loading,      setLoading]      = useState(true);
  const unsubRef = useRef<(() => void) | null>(null);

  // Initials helper
  const initials = (name: string) =>
    name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth/patient/signin"); return; }

    // 1. Load patient data to get assignedDoctorId + current status
    getPatientData(user.uid).then(async (patient) => {
      if (!patient) { router.replace("/auth/patient/signin"); return; }

      // Route guard — check existing status before subscribing
      if (patient.connectionStatus === "accepted") {
        router.replace("/patients/home"); return;
      }
      if (patient.connectionStatus === "rejected") {
        router.replace("/auth/onboarding/rejected"); return;
      }
      if (!patient.assignedDoctorId) {
        // No doctor selected yet — push back to select-doctor
        router.replace("/auth/onboarding/select-doctor"); return;
      }

      // 2. Fetch doctor details for the waiting card
      const doctor = await getDoctorData(patient.assignedDoctorId);
      if (doctor) {
        setDoctorName(doctor.name);
        setDoctorPhoto(doctor.profilePictureUrl ?? null);
      }

      setLoading(false);

      // 3. Real-time listener on patient's own user doc
      const patientDocRef = doc(db, "users", user.uid);
      const unsub = onSnapshot(patientDocRef, (snap) => {
        if (!snap.exists()) return;
        const status = snap.data().connectionStatus as string;

        if (status === "accepted") {
          setAccepted(true);
          // Brief celebration delay then redirect
          setTimeout(() => router.push("/patients/home"), 1400);
        } else if (status === "rejected") {
          router.push("/auth/onboarding/rejected");
        }
      });

      unsubRef.current = unsub;
    }).catch((err) => {
      console.error("Waiting page load error:", err);
      setLoading(false);
    });

    return () => { unsubRef.current?.(); };
  }, [user, authLoading]);

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <>
        <style>{PAGE_CSS}</style>
        <div className="onb-root">
          <Loader2 size={36} style={{ color: "#2DD4BF", animation: "spin 1s linear infinite" }} />
        </div>
      </>
    );
  }

  // ─── Main UI ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="onb-root">
        <div className="onb-card">

          {/* Step bar */}
          <div className="step-bar">
            <div className="step-dot done" />
            <div className="step-dot done" />
            <div className="step-dot active" />
            <span className="step-label">STEP 3 / 3</span>
          </div>

          {/* Pulsing orb */}
          <div className="pulse-orb-wrap">
            <div className="pulse-ripple" />
            <div className="pulse-ripple" />
            <div className="pulse-ripple" />
            <div className={`pulse-orb ${accepted ? "success" : ""}`}>
              {accepted ? (
                <CheckCircle2 size={34} color="#ffffff" />
              ) : (
                <Clock size={34} color="#2DD4BF" />
              )}
            </div>
          </div>

          {/* Status text */}
          {accepted ? (
            <>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.30)",
                borderRadius: 999, padding: "5px 14px", marginBottom: 14,
              }}>
                <CheckCircle2 size={13} color="#10b981" />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: "#10b981", letterSpacing: "0.14em" }}>
                  REQUEST ACCEPTED
                </span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0B1E33", marginBottom: 8 }}>
                You're all set! 🎉
              </h2>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65 }}>
                {doctorName || "Your doctor"} has accepted your request. Taking you to your portal…
              </p>
            </>
          ) : (
            <>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(45,212,191,0.10)", border: "1px solid rgba(45,212,191,0.30)",
                borderRadius: 999, padding: "5px 14px", marginBottom: 14,
              }}>
                <Clock size={13} color="#2DD4BF" />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: "#2DD4BF", letterSpacing: "0.14em" }}>
                  AWAITING APPROVAL
                </span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0B1E33", marginBottom: 8 }}>
                Request sent!
              </h2>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65 }}>
                Your request is waiting for approval. This page will update automatically — no need to refresh.
              </p>

              {/* Doctor chip */}
              {doctorName && (
                <div className="doctor-chip">
                  <div className="doctor-chip-avatar">
                    {doctorPhoto ? (
                      <img src={doctorPhoto} alt={doctorName}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#2DD4BF" }}>
                        {initials(doctorName)}
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0B1E33" }}>{doctorName}</div>
                    <div style={{ fontSize: 11.5, color: "#94a3b8" }}>Request pending review</div>
                  </div>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: "#f59e0b",
                    boxShadow: "0 0 6px rgba(245,158,11,0.60)",
                    marginLeft: 4,
                    animation: "breathe 2s ease-in-out infinite",
                  }} />
                </div>
              )}
            </>
          )}

          {/* Tips */}
          {!accepted && (
            <div className="tips-list">
              <p style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                While you wait
              </p>
              {TIPS.map((tip, i) => (
                <div key={i} className="tip-row" style={{ animationDelay: `${0.2 + i * 0.10}s` }}>
                  <div className="tip-icon" style={{ background: tip.iconBg }}>
                    {tip.icon}
                  </div>
                  <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
                    {tip.text}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Change doctor link */}
          {!accepted && (
            <button
              onClick={() => router.push("/auth/onboarding/select-doctor")}
              style={{
                display: "block", margin: "20px auto 0",
                background: "none", border: "none",
                fontSize: 13, color: "#94a3b8",
                cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: "color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#64748b")}
              onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
            >
              Choose a different doctor
            </button>
          )}
        </div>
      </div>
    </>
  );
}
