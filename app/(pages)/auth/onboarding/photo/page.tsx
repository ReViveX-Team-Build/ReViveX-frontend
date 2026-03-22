"use client";
// app/(pages)/auth/onboarding/photo/page.tsx
//
// ONBOARDING STEP 1 — Profile Photo Upload
// Patient just registered. They must upload a profile picture before proceeding.
//
// Flow:
//   1. Confirm auth (redirect to signin if no user)
//   2. If profilePictureUrl already set → skip to select-doctor
//   3. Patient picks a file → preview shown
//   4. Upload to Firebase Storage at profilePictures/{uid}
//   5. Write URL back to Firestore via updateProfilePicture(uid, url)
//   6. Navigate to /auth/onboarding/select-doctor

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/lib/firebase";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { getPatientData, updateProfilePicture } from "@/app/lib/db/users";
import { Camera, Upload, ArrowRight, CheckCircle2, Loader2, UserCircle2, X } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// STYLES (injected once)
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body { font-family: 'Plus Jakarta Sans', sans-serif; background: #F0F4F8; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes popIn {
    0%   { transform: scale(0.88); opacity: 0; }
    65%  { transform: scale(1.04); }
    100% { transform: scale(1);    opacity: 1; }
  }
  @keyframes shimmer {
    0%   { transform: translateX(-120%) skewX(-12deg); }
    100% { transform: translateX(220%)  skewX(-12deg); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes ringPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(45,212,191,0.30); }
    50%       { box-shadow: 0 0 0 14px rgba(45,212,191,0.00); }
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
    width: 520px; height: 520px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(45,212,191,0.10) 0%, transparent 70%);
    pointer-events: none;
  }
  .onb-root::after {
    content: '';
    position: absolute;
    bottom: -120px; left: -120px;
    width: 400px; height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%);
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
    position: relative;
    z-index: 1;
  }

  .step-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 36px;
  }
  .step-dot {
    width: 32px; height: 6px;
    border-radius: 999px;
    transition: background 0.3s, width 0.3s;
  }
  .step-dot.active  { background: #2DD4BF; width: 48px; }
  .step-dot.done    { background: #2DD4BF; }
  .step-dot.pending { background: rgba(11,30,51,0.12); }

  .step-label {
    margin-left: auto;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    letter-spacing: 0.12em;
  }

  .avatar-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 28px 0 32px;
  }

  .avatar-ring {
    width: 140px; height: 140px;
    border-radius: 50%;
    border: 3px solid rgba(45,212,191,0.30);
    background: #F8FAFC;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: border-color 0.25s, transform 0.2s;
    position: relative;
    overflow: hidden;
    animation: ringPulse 2.8s ease-in-out infinite;
  }
  .avatar-ring:hover {
    border-color: rgba(45,212,191,0.70);
    transform: scale(1.03);
    animation: none;
  }
  .avatar-ring.has-image {
    border-color: #2DD4BF;
    animation: none;
  }
  .avatar-ring img {
    width: 100%; height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
  .avatar-overlay {
    position: absolute;
    inset: 0;
    background: rgba(11,30,51,0.40);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .avatar-ring:hover .avatar-overlay { opacity: 1; }

  .upload-btn {
    margin-top: 14px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(45,212,191,0.10);
    border: 1.5px dashed rgba(45,212,191,0.50);
    border-radius: 12px;
    padding: 10px 20px;
    color: #0B1E33;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
  }
  .upload-btn:hover {
    background: rgba(45,212,191,0.18);
    border-color: #2DD4BF;
  }

  .file-name {
    margin-top: 8px;
    font-size: 12px;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .error-box {
    background: rgba(255,71,87,0.07);
    border: 1px solid rgba(255,71,87,0.25);
    border-radius: 12px;
    padding: 12px 16px;
    color: #dc2626;
    font-size: 13px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .cta-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: #0B1E33;
    color: #ffffff;
    border: none;
    border-radius: 14px;
    padding: 15px 28px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.02em;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: transform 0.15s, box-shadow 0.2s;
  }
  .cta-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(11,30,51,0.22);
  }
  .cta-btn:disabled {
    opacity: 0.48;
    cursor: not-allowed;
    transform: none;
  }
  .cta-btn .shimmer {
    position: absolute;
    top: 0; left: 0;
    width: 40%; height: 100%;
    background: rgba(255,255,255,0.14);
    animation: shimmer 2.2s ease-in-out infinite;
    pointer-events: none;
  }
  .cta-btn.teal {
    background: #2DD4BF;
    color: #061422;
    box-shadow: 0 4px 20px rgba(45,212,191,0.35);
  }
  .cta-btn.teal:hover:not(:disabled) {
    box-shadow: 0 8px 30px rgba(45,212,191,0.50);
  }

  .skip-link {
    display: block;
    text-align: center;
    margin-top: 14px;
    font-size: 13px;
    color: #94a3b8;
    cursor: pointer;
    transition: color 0.2s;
    background: none;
    border: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .skip-link:hover { color: #64748b; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function OnboardingPhoto() {
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview,    setPreview]    = useState<string | null>(null);
  const [file,       setFile]       = useState<File | null>(null);
  const [uploading,  setUploading]  = useState(false);
  const [uploaded,   setUploaded]   = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [checkingSkip, setCheckingSkip] = useState(true);

  // On mount: if user already has a photo → skip this step
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth/patient/signin"); return; }

    getPatientData(user.uid).then((data) => {
      if (data?.profilePictureUrl) {
        router.replace("/auth/onboarding/select-doctor");
      } else {
        setCheckingSkip(false);
      }
    }).catch(() => setCheckingSkip(false));
  }, [user, authLoading]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);

    if (!f.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, WEBP).");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      return;
    }

    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file || !user) return;
    setUploading(true);
    setError(null);

    try {
      const storage  = getStorage();
      const fileRef  = storageRef(storage, `profilePictures/${user.uid}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      await updateProfilePicture(user.uid, url);
      setUploaded(true);

      // Brief success pause then navigate
      setTimeout(() => router.push("/auth/onboarding/select-doctor"), 900);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [file, user, router]);

  const handleSkip = useCallback(async () => {
    // Allow skipping — redirect logic at signin will re-route them
    // back here if they try to sign in without completing onboarding.
    // For now allow them through without a photo.
    if (!user) return;
    router.push("/auth/onboarding/select-doctor");
  }, [user, router]);

  // ─── Loading / guard states ────────────────────────────────────────────────
  if (authLoading || checkingSkip) {
    return (
      <>
        <style>{PAGE_CSS}</style>
        <div className="onb-root">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <Loader2 size={36} style={{ color: "#2DD4BF", animation: "spin 1s linear infinite" }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#64748b", fontSize: 14 }}>
              Loading…
            </span>
          </div>
        </div>
      </>
    );
  }

  // ─── Main UI ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="onb-root">
        <div className="onb-card">

          {/* Step indicator */}
          <div className="step-bar">
            <div className="step-dot active" />
            <div className="step-dot pending" />
            <div className="step-dot pending" />
            <span className="step-label">STEP 1 / 3</span>
          </div>

          {/* Header */}
          <div style={{ marginBottom: 4 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(45,212,191,0.10)", border: "1px solid rgba(45,212,191,0.30)",
              borderRadius: 999, padding: "5px 14px", marginBottom: 16,
            }}>
              <Camera size={13} color="#2DD4BF" />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: "#2DD4BF", letterSpacing: "0.14em" }}>
                PROFILE SETUP
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0B1E33", lineHeight: 1.25, marginBottom: 8 }}>
              Add a profile photo
            </h1>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
              Your doctor and care team will use this to identify you. A clear, recent photo works best.
            </p>
          </div>

          {/* Avatar zone */}
          <div className="avatar-zone">
            <div
              className={`avatar-ring ${preview ? "has-image" : ""}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <>
                  <img src={preview} alt="Preview" />
                  <div className="avatar-overlay">
                    <Camera size={22} color="#fff" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>Change</span>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <UserCircle2 size={52} color="#cbd5e1" />
                  <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Tap to add</span>
                </div>
              )}
              {uploaded && (
                <div style={{
                  position: "absolute", bottom: 6, right: 6,
                  background: "#2DD4BF", borderRadius: "50%",
                  width: 28, height: 28, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  animation: "popIn 0.4s ease both",
                }}>
                  <CheckCircle2 size={16} color="#fff" />
                </div>
              )}
            </div>

            {/* Upload trigger */}
            <button
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Upload size={15} color="#2DD4BF" />
              {file ? "Change photo" : "Choose from device"}
            </button>

            {file && !error && (
              <div className="file-name">
                <CheckCircle2 size={13} color="#2DD4BF" />
                {file.name}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="error-box">
              <X size={16} />
              {error}
            </div>
          )}

          {/* Upload / Continue CTA */}
          {uploaded ? (
            <button className="cta-btn teal" disabled>
              <CheckCircle2 size={18} />
              Photo saved — continuing…
            </button>
          ) : (
            <button
              className="cta-btn"
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                  Uploading…
                </>
              ) : (
                <>
                  <div className="shimmer" />
                  Continue
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          )}

          {/* Skip link */}
          {!uploading && !uploaded && (
            <button className="skip-link" onClick={handleSkip} type="button">
              Skip for now
            </button>
          )}

          {/* Fine print */}
          <p style={{ textAlign: "center", fontSize: 11.5, color: "#cbd5e1", marginTop: 18, lineHeight: 1.6 }}>
            Photos are stored securely and only visible to your care team.
          </p>
        </div>
      </div>
    </>
  );
}
