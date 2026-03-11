"use client";
// app/components/notifications/RequestPanel.tsx
//
// DOCTOR NOTIFICATION BELL PANEL
//
// Shows pending patient connection_request notifications.
// Doctor can Accept or Decline each request.
//
// Usage in doctor nav:
//   const [showPanel, setShowPanel] = useState(false);
//   const { user } = useAuthState(auth);
//   ...
//   <Bell onClick={() => setShowPanel(true)} />
//   {showPanel && <RequestPanel doctorUid={user.uid} onClose={() => setShowPanel(false)} />}
//
// Data flow:
//   - Real-time onSnapshot on communications where:
//       receiverId == doctorUid, type == "connection_request", isRead == false
//   - Each card shows patient name (fetched from users collection via senderId)
//   - Accept → acceptPatientRequest(patientUid, doctorUid, commId)
//   - Decline → rejectPatientRequest(patientUid, commId)
//   - After action, that card disappears from the live listener
import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "@/app/lib/firebase";
import {
  collection, query, where, onSnapshot,
  orderBy, Timestamp,
} from "firebase/firestore";
import { getPatientData } from "@/app/lib/db/users";
import { acceptPatientRequest, rejectPatientRequest } from "@/app/lib/db/communications";
import { Communication, PatientData } from "@/app/lib/db/types";
import {
  Bell, X, CheckCircle2, XCircle, UserCircle2,
  Loader2, BrainCircuit, Clock, Stethoscope,
} from "lucide-react";
const PANEL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

  @keyframes panelSlideIn {
    from { opacity: 0; transform: translateY(-12px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)     scale(1); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes cardSlideIn {
    from { opacity: 0; transform: translateX(10px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeOut {
    from { opacity: 1; transform: scaleY(1);   max-height: 200px; }
    to   { opacity: 0; transform: scaleY(0.8); max-height: 0; }
  }
  @keyframes successFlash {
    0%   { background: rgba(45,212,191,0.15); }
    100% { background: transparent; }
  }
`;
/* append to PANEL_CSS */

  /* Transparent full-screen backdrop — clicking it closes the panel */
  .rp-backdrop {
    position: fixed; inset: 0;
    z-index: 300;
  }

  .rp-panel {
    position: absolute;
    top: calc(100% + 10px); right: 0;
    width: 360px; max-height: 520px;
    background: #ffffff;
    border-radius: 20px;
    border: 1px solid rgba(226,232,240,0.9);
    box-shadow: 0 16px 60px rgba(11,30,51,0.15), 0 4px 12px rgba(11,30,51,0.07);
    z-index: 301;
    animation: panelSlideIn 0.28s cubic-bezier(0.22,1,0.36,1) both;
    display: flex; flex-direction: column;
    overflow: hidden;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .rp-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 20px 14px;
    border-bottom: 1px solid rgba(226,232,240,0.9);
    flex-shrink: 0;
  }

  .rp-badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(45,212,191,0.10);
    border: 1px solid rgba(45,212,191,0.30);
    border-radius: 999px; padding: 4px 12px;
  }

  .rp-count {
    min-width: 20px; height: 20px; border-radius: 999px;
    background: #ef4444; color: #fff;
    font-size: 11px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    padding: 0 5px;
    font-family: 'JetBrains Mono', monospace;
  }

  .rp-close {
    width: 30px; height: 30px; border-radius: 50%;
    background: #F8FAFC;
    border: 1px solid rgba(226,232,240,0.9);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background 0.2s;
  }
  .rp-close:hover { background: #F0F4F8; }
  /* append to PANEL_CSS */

  .rp-body {
    overflow-y: auto; flex: 1;
    padding: 12px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .rp-body::-webkit-scrollbar       { width: 4px; }
  .rp-body::-webkit-scrollbar-track { background: transparent; }
  .rp-body::-webkit-scrollbar-thumb { background: rgba(11,30,51,0.10); border-radius: 4px; }

  .rp-empty {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 36px 20px; gap: 10px;
    color: #94a3b8; text-align: center;
  }

  .rp-footer {
    padding: 12px 16px;
    border-top: 1px solid rgba(226,232,240,0.9);
    text-align: center; flex-shrink: 0;
  }
  