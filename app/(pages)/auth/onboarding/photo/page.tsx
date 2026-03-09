"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/lib/firebase";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { getPatientData, updateProfilePicture } from "@/app/lib/db/users";
import { Camera, Upload, ArrowRight, CheckCircle2, Loader2, UserCircle2, X } from "lucide-react";

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans...');
  @keyframes fadeUp { ... }
  @keyframes popIn { ... }
  @keyframes shimmer { ... }
  .onb-root { ... }
  .onb-card { ... }
  /* etc */
`;
const [checkingSkip, setCheckingSkip] = useState(true);

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
    const storage = getStorage();
    const fileRef = storageRef(storage, `profilePictures/${user.uid}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    await updateProfilePicture(user.uid, url);
    setUploaded(true);
    setTimeout(() => router.push("/auth/onboarding/select-doctor"), 900);
  } catch (err: any) {
    setError("Upload failed. Please try again.");
  } finally {
    setUploading(false);
  }
}, [file, user, router]);

return (
  <>
    <style>{PAGE_CSS}</style>
    <div className="onb-root">
      <div className="onb-card">
        <div className="step-bar">
          <div className="step-dot active" />
          <div className="step-dot pending" />
          <div className="step-dot pending" />
          <span className="step-label">STEP 1 / 3</span>
        </div>
        {/* avatar zone, upload button, error box, CTA, skip link */}
      </div>
    </div>
  </>
);