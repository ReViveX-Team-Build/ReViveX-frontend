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

  /* append to PAGE_CSS */

  .modal-backdrop {
    position: fixed; inset: 0;
    background: rgba(11,30,51,0.40);
    backdrop-filter: blur(6px);
    z-index: 200;
  }
  .modal-card {
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: #ffffff;
    border-radius: 22px;
    border: 1px solid rgba(226,232,240,0.9);
    box-shadow: 0 24px 80px rgba(11,30,51,0.16);
    padding: 36px 40px;
    width: 90%; max-width: 400px;
    z-index: 201;
    animation: modalIn 0.32s cubic-bezier(0.22,1,0.36,1) both;
  }

  .cta-btn {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
    background: #0B1E33; color: #fff;
    border: none; border-radius: 12px; padding: 14px 24px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14.5px; font-weight: 700;
    cursor: pointer; position: relative; overflow: hidden;
    transition: transform 0.15s, box-shadow 0.2s;
  }
  .cta-btn:hover:not(:disabled)      { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(11,30,51,0.22); }
  .cta-btn:disabled                  { opacity: 0.48; cursor: not-allowed; }
  .cta-btn .shimmer                  { position: absolute; top: 0; left: 0; width: 40%; height: 100%; background: rgba(255,255,255,0.12); animation: shimmer 2.2s ease-in-out infinite; pointer-events: none; }
  .cta-btn.teal                      { background: #2DD4BF; color: #061422; box-shadow: 0 4px 20px rgba(45,212,191,0.30); }
  .cta-btn.teal:hover:not(:disabled) { box-shadow: 0 8px 28px rgba(45,212,191,0.45); }
  .cta-btn.ghost                     { background: transparent; color: #64748b; border: 1.5px solid rgba(226,232,240,0.9); box-shadow: none; }
  .cta-btn.ghost:hover               { background: #F8FAFC; color: #0B1E33; }

  export default function OnboardingSelectDoctor() {
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);

  // Data
  const [doctors,     setDoctors]     = useState<DoctorListing[]>([]);
  const [filtered,    setFiltered]    = useState<DoctorListing[]>([]);
  const [patientName, setPatientName] = useState("");

  // UI
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [selected,   setSelected]   = useState<DoctorListing | null>(null);
  const [showModal,  setShowModal]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth/patient/signin"); return; }

    Promise.all([
      getDoctorsForListing(),
      getPatientData(user.uid),
    ]).then(([docs, patientData]) => {
      // Already accepted → go straight to app
      if (patientData?.connectionStatus === "accepted") {
        router.replace("/patients/home");
        return;
      }
      // Request already sent → wait for doctor to accept
      if (patientData?.connectionStatus === "pending") {
        router.replace("/auth/onboarding/waiting");
        return;
      }

      setPatientName(patientData?.name ?? "");
      setDoctors(docs);
      setFiltered(docs);
    }).catch(() => {
      setError("Could not load doctor list. Please try again.");
    }).finally(() => setLoading(false));
  }, [user, authLoading]);
  useEffect(() => {
    if (!search.trim()) { setFiltered(doctors); return; }
    const q = search.toLowerCase();
    setFiltered(doctors.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.specialization.toLowerCase().includes(q) ||
      d.doctorId.toLowerCase().includes(q)
    ));
  }, [search, doctors]);
  // Open confirm modal for the tapped card
  const handleSelect = useCallback((doctor: DoctorListing) => {
    setSelected(doctor);
    setShowModal(true);
    setError(null);
  }, []);

  // Write to Firestore then navigate to waiting screen
  const handleConfirm = useCallback(async () => {
    if (!selected || !user) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        assignedDoctorId: selected.uid,
        connectionStatus: "pending",
      });
      await sendConnectionRequest(user.uid, patientName || "A new patient", selected.uid);
      router.push("/auth/onboarding/waiting");
    } catch (err: any) {
      console.error("Connection request failed:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [selected, user, patientName, router]);

  // Two-letter avatar fallback from display name
  const initials = (name: string) =>
    name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
  if (authLoading || loading) {
    return (
      <>
        <style>{PAGE_CSS}</style>
        <div className="onb-root" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <Loader2 size={36} style={{ color: "#2DD4BF", animation: "spin 1s linear infinite" }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#64748b", fontSize: 14 }}>
              Loading doctors…
            </span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="onb-root">

        <div className="onb-header">
          {/* Step progress dots */}
          <div className="step-bar">
            <div className="step-dot done" />
            <div className="step-dot active" />
            <div className="step-dot pending" />
            <span className="step-label">STEP 2 / 3</span>
          </div>

          {/* Section pill */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(139,92,246,0.10)", border: "1px solid rgba(139,92,246,0.30)",
            borderRadius: 999, padding: "5px 14px", marginBottom: 14,
          }}>
            <Stethoscope size={13} color="#8b5cf6" />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: "#8b5cf6", letterSpacing: "0.14em" }}>
              CHOOSE YOUR DOCTOR
            </span>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0B1E33", lineHeight: 1.22, marginBottom: 8 }}>
            Select your rehabilitation doctor
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65 }}>
            Your doctor will review your request and set up your therapy protocol.
            You can change this later from your settings.
          </p>

          {/* Search bar */}
          <div className="search-bar">
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by name or specialization…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Doctor cards grid — error banner + empty state + mapped cards */}
        <div className="doctors-grid">
          {error && !showModal && (
            <div style={{
              background: "rgba(255,71,87,0.07)", border: "1px solid rgba(255,71,87,0.25)",
              borderRadius: 12, padding: "12px 16px", color: "#dc2626",
              fontSize: 13, display: "flex", alignItems: "center", gap: 8,
            }}>
              <X size={15} /> {error}
            </div>
          )}

          {filtered.length === 0 && !loading && (
            <div className="empty-state">
              <Stethoscope size={40} style={{ margin: "0 auto 12px", display: "block", color: "#cbd5e1" }} />
              <p style={{ fontWeight: 600, color: "#94a3b8" }}>No doctors found</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Try a different search term.</p>
            </div>
          )}

          {filtered.map((doctor, i) => (
            <div
              key={doctor.uid}
              className={`doctor-card ${selected?.uid === doctor.uid ? "selected" : ""}`}
              style={{ animationDelay: `${i * 0.05}s` }}
              onClick={() => handleSelect(doctor)}
            >
              <div className="doctor-avatar">
                {doctor.profilePictureUrl
                  ? <img src={doctor.profilePictureUrl} alt={doctor.name} />
                  : <span className="doctor-initials">{initials(doctor.name)}</span>
                }
              </div>
              <div className="doctor-info">
                <div className="doctor-name">{doctor.name}</div>
                <div className="doctor-spec">
                  <Stethoscope size={11} color="#94a3b8" />
                  {doctor.specialization}
                </div>
                <div className="doctor-id">ID: {doctor.doctorId.toUpperCase()}</div>
              </div>
              <div className="select-badge">
                {selected?.uid === doctor.uid
                  ? <CheckCircle2 size={16} color="#ffffff" />
                  : <ChevronRight size={16} color="#2DD4BF" />
                }
              </div>
            </div>
          ))}
        </div>
      </div>