"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { Video, Loader2, PhoneOff, ShieldAlert, UserSquare2 } from "lucide-react";

export default function PatientMeetingRoom() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;
  
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!meetingId) return;

    const meetingRef = doc(db, "appointments", meetingId);
    const unsubscribe = onSnapshot(meetingRef, (docSnap) => {
      if (docSnap.exists()) {
        setAppointment(docSnap.data());
      } else {
        setError(true);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [meetingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-teal-400">
        <Loader2 size={48} className="animate-spin mb-4" />
        <p className="font-mono text-sm tracking-widest uppercase">Initializing Secure Channel...</p>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-red-400">
        <ShieldAlert size={48} className="mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Meeting Not Found</h1>
        <p className="text-slate-400 mb-6">This telehealth session link is invalid or has expired.</p>
        <button onClick={() => router.push("/patients/schedule")} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">
          Return to Schedule
        </button>
      </div>
    );
  }

  // Check if the doctor has flagged themselves as joined in Firestore
  const isDoctorPresent = appointment.doctorJoined === true;

  // ══════════════════════════════════════════════════════════
  // WAITING ROOM UI (If doctor is not here yet)
  // ══════════════════════════════════════════════════════════
  if (!isDoctorPresent) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        
        {/* Ambient Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-md w-full relative z-10 text-center bg-slate-900/50 backdrop-blur-md border border-slate-700 p-10 rounded-3xl shadow-2xl">
          
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-4 rounded-full border-2 border-indigo-500/40 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-slate-800 border-2 border-indigo-400 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)] z-10">
                <Video size={32} className="text-indigo-400" />
              </div>
            </div>
          </div>

          <div className="text-indigo-400 text-xs font-bold tracking-[0.2em] uppercase mb-4 flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" /> WAITING ROOM
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">
            Waiting for your Doctor...
          </h1>
          
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Your telehealth session <strong>{appointment.title}</strong> is ready. 
            The video call will automatically start as soon as your clinician joins the room.
          </p>

          <button 
            onClick={() => router.push("/patients/schedule")}
            className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 font-bold text-xs tracking-widest uppercase transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 flex items-center justify-center gap-2 mx-auto w-full"
          >
            <PhoneOff size={16} /> Leave Waiting Room
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // ACTIVE VIDEO CALL UI (If doctor is present)
  // ══════════════════════════════════════════════════════════
  return (
    <div className="h-screen w-full bg-[#0f172a] flex flex-col">
      {/* Custom Header */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <UserSquare2 size={18} />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">{appointment.title}</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-slate-400 text-xs font-mono uppercase tracking-wider">Secure Channel Active</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => router.push("/patients/schedule")}
          className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all text-sm font-bold flex items-center gap-2"
        >
          <PhoneOff size={16} /> End Call
        </button>
      </div>

      {/* Free Open-Source Video Call Iframe (Jitsi) */}
      <div className="flex-1 w-full relative">
        <iframe
          src={`https://meet.jit.si/ReViveX_Telehealth_${meetingId}`}
          allow="camera; microphone; fullscreen; display-capture"
          className="w-full h-full border-none"
          style={{ background: '#0f172a' }}
        />
      </div>
    </div>
  );
}