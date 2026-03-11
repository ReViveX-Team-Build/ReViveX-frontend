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
