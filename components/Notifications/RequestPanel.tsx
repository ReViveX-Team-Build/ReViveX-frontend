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
  /* append to PANEL_CSS */

  .req-card {
    border: 1.5px solid rgba(226,232,240,0.9);
    border-radius: 14px; padding: 14px 16px;
    background: #ffffff;
    animation: cardSlideIn 0.25s ease both;
    transition: border-color 0.2s;
  }
  .req-card:hover               { border-color: rgba(45,212,191,0.35); }
  .req-card.removing            { animation: fadeOut 0.35s ease forwards; pointer-events: none; overflow: hidden; }
  .req-card.accepted-flash      { animation: successFlash 0.6s ease both; }

  .req-top    { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }

  .req-avatar {
    width: 42px; height: 42px; border-radius: 50%;
    background: linear-gradient(135deg, #0B1E33, #1e3a5f);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; flex-shrink: 0;
    border: 2px solid rgba(45,212,191,0.20);
  }
  .req-avatar img { width: 100%; height: 100%; object-fit: cover; }

  .req-name      { font-size: 14px; font-weight: 700; color: #0B1E33; }
  .req-meta      { font-size: 12px; color: #64748b; display: flex; align-items: center; gap: 4px; margin-top: 2px; }
  .req-time      { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #94a3b8; margin-left: auto; flex-shrink: 0; }

  .req-condition {
    display: inline-flex; align-items: center;
    background: rgba(139,92,246,0.08);
    border: 1px solid rgba(139,92,246,0.20);
    border-radius: 999px; padding: 2px 8px;
    font-size: 10.5px; font-weight: 700; color: #8b5cf6;
    margin-top: 6px; margin-bottom: 10px;
  }

  .req-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

  .req-btn {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    border: none; border-radius: 10px; padding: 9px 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 12.5px; font-weight: 700;
    cursor: pointer;
    transition: transform 0.12s, box-shadow 0.15s;
  }
  .req-btn:hover:not(:disabled)         { transform: translateY(-1px); }
  .req-btn:disabled                     { opacity: 0.5; cursor: not-allowed; }
  .req-btn.accept                       { background: #2DD4BF; color: #061422; box-shadow: 0 2px 10px rgba(45,212,191,0.25); }
  .req-btn.accept:hover:not(:disabled)  { box-shadow: 0 4px 16px rgba(45,212,191,0.40); }
  .req-btn.decline                      { background: rgba(239,68,68,0.08); color: #ef4444; border: 1px solid rgba(239,68,68,0.25); }
  .req-btn.decline:hover:not(:disabled) { background: rgba(239,68,68,0.14); }
  // Shape of each enriched request row in local state
interface RequestItem {
  comm:          Communication;
  patient:       PatientData | null;
  loading:       boolean;   // true while patient data is being fetched
  removing:      boolean;   // true while fade-out animation plays
  actionLoading: boolean;   // true while accept/decline API call is in-flight
}

interface RequestPanelProps {
  doctorUid: string;
  onClose:   () => void;
}

// Converts a Firestore Timestamp to a human-readable "X ago" string
function timeAgo(ts: Timestamp): string {
  const diff = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Generates two-letter initials for avatar fallback
function initials(name: string): string {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}
export function RequestPanel({ doctorUid, onClose }: RequestPanelProps) {
  const [requests,     setRequests]     = useState<RequestItem[]>([]);
  const [panelLoading, setPanelLoading] = useState(true);
  const unsubRef = useRef<(() => void) | null>(null);

  // Subscribe to all unread connection_request comms sent to this doctor
  useEffect(() => {
    if (!doctorUid) return;

    const q = query(
      collection(db, "communications"),
      where("receiverId", "==", doctorUid),
      where("type",       "==", "connection_request"),
      where("isRead",     "==", false),
      orderBy("timestamp", "desc")
    );

    const unsub = onSnapshot(q, async (snap) => {
      const comms = snap.docs.map(d => ({ id: d.id, ...d.data() } as Communication));

      // Immediately populate list with loading skeletons
      const items: RequestItem[] = comms.map(comm => ({
        comm, patient: null, loading: true, removing: false, actionLoading: false,
      }));
      setRequests(items);
      setPanelLoading(false);

      // Enrich each item with its patient's profile data in parallel
      const enriched = await Promise.all(
        comms.map(async (comm) => {
          const patient = await getPatientData(comm.senderId).catch(() => null);
          return { comm, patient, loading: false, removing: false, actionLoading: false };
        })
      );
      setRequests(enriched);
    });

    unsubRef.current = unsub;
    return () => unsub();
  }, [doctorUid]);
  const handleAccept = useCallback(async (item: RequestItem) => {
    if (!item.comm.id) return;

    // Show spinner on this card's buttons
    setRequests(prev => prev.map(r =>
      r.comm.id === item.comm.id ? { ...r, actionLoading: true } : r
    ));

    try {
      await acceptPatientRequest(item.comm.senderId, doctorUid, item.comm.id);

      // Trigger CSS fade-out animation
      setRequests(prev => prev.map(r =>
        r.comm.id === item.comm.id ? { ...r, removing: true, actionLoading: false } : r
      ));
      // Remove from DOM after animation completes
      setTimeout(() => {
        setRequests(prev => prev.filter(r => r.comm.id !== item.comm.id));
      }, 380);
    } catch (err) {
      console.error("Accept failed:", err);
      setRequests(prev => prev.map(r =>
        r.comm.id === item.comm.id ? { ...r, actionLoading: false } : r
      ));
    }
  }, [doctorUid]);
  const handleDecline = useCallback(async (item: RequestItem) => {
    if (!item.comm.id) return;

    setRequests(prev => prev.map(r =>
      r.comm.id === item.comm.id ? { ...r, actionLoading: true } : r
    ));

    try {
      await rejectPatientRequest(item.comm.senderId, item.comm.id);

      setRequests(prev => prev.map(r =>
        r.comm.id === item.comm.id ? { ...r, removing: true, actionLoading: false } : r
      ));
      setTimeout(() => {
        setRequests(prev => prev.filter(r => r.comm.id !== item.comm.id));
      }, 380);
    } catch (err) {
      console.error("Decline failed:", err);
      setRequests(prev => prev.map(r =>
        r.comm.id === item.comm.id ? { ...r, actionLoading: false } : r
      ));
    }
  }, []);

  // Visible count excludes cards currently animating out
  const pendingCount = requests.filter(r => !r.removing).length;
  return (
    <>
      <style>{PANEL_CSS}</style>

      {/* Transparent backdrop — click outside to close */}
      <div className="rp-backdrop" onClick={onClose} />

      <div className="rp-panel">

        {/* Header */}
        <div className="rp-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="rp-badge">
              <Bell size={13} color="#2DD4BF" />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700, color: "#0B1E33" }}>
                Patient Requests
              </span>
            </div>
            {pendingCount > 0 && (
              <div className="rp-count">{pendingCount}</div>
            )}
          </div>
          <button className="rp-close" onClick={onClose}>
            <X size={14} color="#64748b" />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="rp-body">
          {panelLoading ? (
            // Initial load spinner
            <div className="rp-empty">
              <Loader2 size={28} style={{ color: "#2DD4BF", animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 13, color: "#94a3b8" }}>Loading requests…</span>
            </div>
          ) : requests.length === 0 ? (
            // Zero state
            <div className="rp-empty">
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "#F8FAFC", border: "1.5px solid rgba(226,232,240,0.9)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Bell size={22} color="#cbd5e1" />
              </div>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#94a3b8" }}>No pending requests</p>
              <p style={{ fontSize: 12.5, color: "#cbd5e1" }}>New patient requests will appear here.</p>
            </div>
          ) : (
            requests.map((item, i) => (
              <div
                key={item.comm.id}
                className={`req-card ${item.removing ? "removing" : ""}`}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                {item.loading ? (
                  // Skeleton placeholder while patient data fetches
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0" }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: "50%",
                      background: "linear-gradient(90deg, #F0F4F8 25%, #e8eef8 50%, #F0F4F8 75%)",
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ width: "55%", height: 12, borderRadius: 6, background: "#F0F4F8", marginBottom: 6 }} />
                      <div style={{ width: "35%", height: 10, borderRadius: 6, background: "#F8FAFC" }} />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Avatar + name + ID + timestamp */}
                    <div className="req-top">
                      <div className="req-avatar">
                        {item.patient?.profilePictureUrl
                          ? <img src={item.patient.profilePictureUrl} alt={item.patient.name} />
                          : <span style={{ fontSize: 14, fontWeight: 800, color: "#2DD4BF" }}>
                              {item.patient?.name ? initials(item.patient.name) : "?"}
                            </span>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="req-name">{item.patient?.name ?? "Unknown Patient"}</div>
                        <div className="req-meta">
                          <Stethoscope size={11} color="#94a3b8" />
                          ID: {item.patient?.patientId ?? "–"}
                        </div>
                      </div>
                      <div className="req-time">
                        {item.comm.timestamp ? timeAgo(item.comm.timestamp as Timestamp) : "—"}
                      </div>
                    </div>

                    {/* Condition pill */}
                    {item.patient?.condition && (
                      <div className="req-condition">
                        <BrainCircuit size={11} style={{ marginRight: 4 }} />
                        {item.patient.condition}
                      </div>
                    )}

                    {/* Message excerpt — clamped to 2 lines */}
                    <p style={{
                      fontSize: 12.5, color: "#64748b", lineHeight: 1.55,
                      marginBottom: 12,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical" as any,
                      overflow: "hidden",
                    }}>
                      {item.comm.content}
                    </p>

                    {/* Accept / Decline buttons */}
                    <div className="req-actions">
                      <button className="req-btn accept" onClick={() => handleAccept(item)} disabled={item.actionLoading}>
                        {item.actionLoading
                          ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                          : <CheckCircle2 size={14} />
                        }
                        Accept
                      </button>
                      <button className="req-btn decline" onClick={() => handleDecline(item)} disabled={item.actionLoading}>
                        <XCircle size={14} />
                        Decline
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer count — only shown when there are cards */}
        {!panelLoading && requests.length > 0 && (
          <div className="rp-footer">
            <span style={{ fontSize: 11.5, color: "#94a3b8" }}>
              {pendingCount} request{pendingCount !== 1 ? "s" : ""} awaiting your response
            </span>
          </div>
        )}
      </div>
    </>
  );
}