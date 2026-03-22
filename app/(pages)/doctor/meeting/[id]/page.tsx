"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/lib/firebase";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function DoctorMeetingPage() {
  const params = useParams();
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [isJitsiLoading, setIsJitsiLoading] = useState(true);
  const apiRef = useRef<any>(null); // Store the API instance to clean it up

  const meetingId = (params?.id as string)?.replace(/[^a-zA-Z0-9]/g, "") || "default";
  const roomName = `ReViveX-Telehealth-Clinic-${meetingId}`;

  // Helper to go back to schedule
  const handleExit = () => {
    if (apiRef.current) {
      apiRef.current.dispose(); // Properly kill the video session
    }
    router.push("/doctor/schedule");
  };

  useEffect(() => {
    if (loading || !user || !jitsiContainerRef.current) return;

    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js"; 
    script.async = true;
    script.onload = () => {
      const domain = "meet.jit.si";
      const options = {
        roomName: roomName,
        width: "100%",
        height: "100%",
        parentNode: jitsiContainerRef.current,
        configOverwrite: {
          startWithAudioMuted: true,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'chat', 'settings', 
            'tileview'
          ],
        },
        userInfo: {
          displayName: user.displayName || "Doctor",
          email: user.email || "",
        },
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);
      apiRef.current = api;
      api.addEventListener("videoConferenceLeft", () => {
        handleExit();
      });

      // This fires when Jitsi is ready to close the frame
      api.addEventListener("readyToClose", () => {
        handleExit();
      });
      
      api.addEventListener("videoConferenceJoined", () => {
        setIsJitsiLoading(false);
      });
    };

    document.body.appendChild(script);

    return () => {
      if (apiRef.current) apiRef.current.dispose();
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [user, loading, roomName]);

  if (loading) return null;

  if (!user) {
    router.push("/auth/doctor/signin");
    return null;
  }

  return (
    <div style={{ height: "100vh", width: "100%", display: "flex", flexDirection: "column", background: "#0f172a", overflow: "hidden" }}>
      
      <header style={{ 
        padding: "16px 24px", background: "#0B1E33", display: "flex", 
        alignItems: "center", justifyContent: "space-between", 
        borderBottom: "1px solid rgba(45,212,191,0.2)", zIndex: 20
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>

          <button 
            onClick={handleExit}
            style={{ 
              display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.1)", 
              border: "1px solid rgba(255,255,255,0.05)", padding: "8px 16px", borderRadius: 10, 
              color: "#f1f5f9", cursor: "pointer", fontSize: 13, fontWeight: 700
            }}>
            <ArrowLeft size={14} /> Exit to Schedule
          </button>
          <div style={{ color: "#2DD4BF", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
             Telehealth Session · <span style={{ color: "#94a3b8" }}>Encrypted</span>
          </div>
        </div>
        <div style={{ color: "#2DD4BF", fontWeight: 800 }}>ReViveX Clinic</div>
      </header>

      <div style={{ flex: 1, position: "relative", background: "#000" }}>
        {isJitsiLoading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0f172a", zIndex: 10 }}>
            <Loader2 className="animate-spin" size={32} color="#2DD4BF" />
          </div>
        )}
        <div ref={jitsiContainerRef} style={{ height: "100%", width: "100%" }} />
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}