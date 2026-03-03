'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, Cpu, Brain, Shield, Stethoscope, ChevronDown,
  Wifi, Activity, Zap, MessageSquare, ArrowLeft,
  HelpCircle, LifeBuoy, Mail, Phone, ExternalLink,
  AlertCircle, CheckCircle2, BookOpen, Settings2,
  Lock, Server, Bot, Sparkles, BarChart3, Eye,
  Send,
} from 'lucide-react';

// Define the strict shapes for our FAQ data so TypeScript can catch errors
interface FAQItem {
  q: string;
  a: React.ReactNode;
}

interface FAQCategory {
  id:    string;
  label: string;
  icon:  React.ReactNode;
  color: string;
  bg:    string;
  items: FAQItem[];
}

// The core knowledge base for the Help Center. 
// Grouped by categories so we can easily filter them via the UI tabs.
const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id:    'hardware',
    label: 'Hardware & Device Management',
    icon:  <Cpu size={16} />,
    color: '#0891b2',
    bg:    'rgba(8,145,178,0.08)',
    items: [
      {
        q: 'How do I calibrate the MPX5010DP pressure sensor for a new patient?',
        a: (
          <>
            <p>Sensor calibration is performed through the patient's initial <strong>"The Flow"</strong> calibration level, which must be completed before any therapeutic sessions are assigned.</p>
            <ol>
              <li>Navigate to <span className="hc-code">Patient Profile → Therapy Protocols → Calibration</span> and ensure the patient is in a neutral, resting seated position.</li>
              <li>Ask the patient to perform three full, maximal squeezes on the BP bulb. The MPX5010DP sensor will sample the peak kPa readings across all three attempts.</li>
              <li>The system automatically calculates and stores the <strong>Baseline Maximum Voluntary Contraction (MVC)</strong> from these readings. All subsequent grip force sensitivity targets are derived as a percentage of this stored baseline.</li>
              <li>Re-calibration is recommended after any significant clinical change (e.g., surgery, cast removal) or if the patient's reported peak force deviates more than 30% from the established baseline over two consecutive sessions.</li>
            </ol>
            <div className="hc-note">
              <AlertCircle size={12} />
              If calibration readings appear erratic, check that the silicone tubing connecting the bulb to the sensor is fully sealed with no micro-leaks before repeating the procedure.
            </div>
          </>
        ),
      },
      {
        q: "A patient's device is showing as \"Offline\" on my triage list. What should I do?",
        a: (
          <>
            <p>An <span className="hc-badge hc-badge-red">OFFLINE</span> status indicates the ESP32 microcontroller on the patient's device has failed to establish or maintain its MQTT over WiFi connection to the ReViveX cloud broker. Follow this diagnostic sequence:</p>
            <ol>
              <li><strong>Verify Device ID:</strong> Confirm the device ID shown on the triage card (e.g., <span className="hc-code">R-103</span>) matches the physical ID label on the patient's device unit. Mismatched IDs will always display as Offline.</li>
              <li><strong>Check WiFi Environment:</strong> Ask the patient (or caregiver) to confirm the home WiFi router is online and that the device is within range. The ESP32 module requires a standard 2.4 GHz network — 5 GHz bands are not supported.</li>
              <li><strong>Trigger a Manual Reconnect:</strong> Instruct the patient to hold the device's reset button for 3 seconds. The indicator LED will flash amber then transition to solid green on a successful reconnect. The dashboard status should update within 60 seconds.</li>
              <li><strong>Escalate if Persistent:</strong> If the device remains offline after 15 minutes, raise a hardware support ticket via the Contact Support panel below. Include the device ID and the patient's account PID for faster resolution.</li>
            </ol>
            <div className="hc-note hc-note-teal">
              <CheckCircle2 size={12} />
              You can also view the device's last-known connection timestamp in <span className="hc-code">Patient Profile → Device Details</span>.
            </div>
          </>
        ),
      },
      {
        q: 'Can I track left and right hands separately for the same patient?',
        a: (
          <>
            <p>Yes. ReViveX fully supports <strong>bilateral hand tracking</strong> within a single patient profile. Therapy protocols can be independently assigned to the left or right hand at the session level, and all resulting performance metrics are charted and stored independently.</p>
            <p>Within the <strong>Therapy Protocol configuration panel</strong>, use the <em>Target Hand</em> selector to designate <span className="hc-code">Left Hand</span> or <span className="hc-code">Right Hand</span> before assigning a game and difficulty. The patient's performance dashboard will automatically render two parallel data streams — one per hand — allowing direct comparative analysis of grip force, endurance drop percentage, and reaction time across laterality.</p>
            <p>This feature is particularly useful for patients with unilateral stroke or post-surgical recovery, where the affected limb's progress is tracked against the unaffected limb as a dynamic benchmark.</p>
          </>
        ),
      },
    ],
  },
  {
    id:    'protocols',
    label: 'Clinical Protocols & Dashboards',
    icon:  <Stethoscope size={16} />,
    color: '#2DD4BF',
    bg:    'rgba(45,212,191,0.08)',
    items: [
      {
        q: 'How is the "Muscle Endurance Drop Percentage" calculated?',
        a: (
          <>
            <p>The <strong>Muscle Endurance Drop %</strong> is a key fatigue index that quantifies motor output degradation across a single session. It is computed as follows:</p>
            <div className="hc-formula">
              <span className="hc-formula-label">Formula</span>
              <p>Endurance Drop % = <strong>((Avg Peak [First 3 Squeezes] − Avg Peak [Last 3 Squeezes]) / Avg Peak [First 3 Squeezes]) × 100</strong></p>
            </div>
            <ol>
              <li>The system records the <strong>peak kPa value</strong> from every squeeze event during a session.</li>
              <li>It then isolates the first three and last three peak readings of that session.</li>
              <li>The average of each set is computed, and the percentage difference between them represents muscular endurance degradation over the session duration.</li>
            </ol>
            <p>A drop of <strong>0–15%</strong> is considered clinically normal for most rehabilitation profiles. A drop exceeding <strong>25%</strong> across consecutive sessions may indicate under-recovery or inappropriate protocol difficulty, and warrants a protocol review.</p>
            <div className="hc-note">
              <AlertCircle size={12} />
              Sessions with fewer than 6 total squeeze events are excluded from the Endurance Drop calculation and will display as <span className="hc-code">N/A</span> in the dashboard.
            </div>
          </>
        ),
      },
      {
        q: 'How do I adjust the difficulty for a patient who is struggling?',
        a: (
          <>
            <p>Protocol difficulty adjustments are made through the patient's dedicated configuration panel and take effect immediately for the patient's next session — no session restart is required.</p>
            <ol>
              <li>Navigate to <span className="hc-code">My Patients → [Patient Name] → View Profile → Update Therapy Protocol</span>.</li>
              <li>Use the <strong>Speed / Difficulty</strong> slider to reduce from the current level (e.g., <em>Hard</em> → <em>Medium</em> or <em>Easy</em>).</li>
              <li>Enable <strong>Audio Hints</strong> to provide real-time spoken prompts that coach the patient through squeeze timing and pressure targets.</li>
              <li>Enable <strong>Visual Path Guides</strong> to overlay on-screen trajectory assistance, reducing the cognitive load of obstacle navigation.</li>
              <li>Optionally, reduce the <strong>Grip Force Sensitivity (MVC %)</strong> if the patient's absolute force output has declined, ensuring the game remains physically accessible.</li>
            </ol>
            <p>After adjusting, it is recommended to send the patient a contextual <strong>Instruction</strong> message via the Messaging Hub to explain the change and set appropriate session expectations.</p>
          </>
        ),
      },
    ],
  },
  {
    id:    'ai',
    label: 'AI Clinical Assistant (Gemini)',
    icon:  <Brain size={16} />,
    color: '#6366f1',
    bg:    'rgba(99,102,241,0.08)',
    items: [
      {
        q: 'Where do the Weekly AI Summaries come from?',
        a: (
          <>
            <p>Weekly AI Summaries are generated automatically every Monday at 06:00 UTC for each active patient on an <span className="hc-badge hc-badge-indigo"><Bot size={9} /> AI Companion</span> subscription tier.</p>
            <p>The generation pipeline works as follows:</p>
            <ol>
              <li>A secure server-side process retrieves the <strong>last 7 days of Firebase Firestore telemetry</strong> for the patient — including per-session grip force series, endurance drop percentages, cognitive accuracy scores (for Memory Gate), and adherence timestamps.</li>
              <li>This structured dataset is passed as context to the <strong>Gemini 1.5 Flash</strong> model via a controlled clinical system prompt, which instructs the model to produce concise, bulleted clinical observations.</li>
              <li>The generated summary is written back to Firestore and surfaced in the patient's communications inbox as an <span className="hc-badge hc-badge-indigo">AI INSIGHT</span> message, visible to both the doctor and patient.</li>
            </ol>
            <div className="hc-note hc-note-indigo">
              <Sparkles size={12} />
              All AI-generated content is clearly flagged with an <strong>AI</strong> badge in the interface and is intended to support — not replace — clinical judgment.
            </div>
          </>
        ),
      },
      {
        q: 'What is the difference between the standard AI Summary and the AI Companion Chat?',
        a: (
          <>
            <p>While both features are powered by Gemini and require the <strong>AI Companion plan</strong>, they serve distinct clinical purposes:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '14px 0' }}>
              <div className="hc-compare-box">
                <div className="hc-compare-title"><BarChart3 size={13} /> Weekly Summary</div>
                <ul>
                  <li>Automated — generated every Monday</li>
                  <li>Covers the full past 7 days of data</li>
                  <li>Delivered as a structured bulletin to the patient's inbox</li>
                  <li>Focuses on adherence rate, peak force trends, and overall progress direction</li>
                </ul>
              </div>
              <div className="hc-compare-box hc-compare-box-indigo">
                <div className="hc-compare-title"><MessageSquare size={13} /> AI Companion Chat</div>
                <ul>
                  <li>On-demand — initiated by doctor query</li>
                  <li>Can span any custom time range</li>
                  <li>Conversational — supports follow-up questions</li>
                  <li>Capable of querying specific trends, e.g., <em>"Show tremor amplitude variance across the last 30 days"</em> or <em>"Compare left vs right hand endurance for October"</em></li>
                </ul>
              </div>
            </div>
            <p>Use Summaries for routine weekly monitoring. Use the Companion Chat for deep longitudinal analysis and complex clinical hypotheses.</p>
          </>
        ),
      },
    ],
  },
  {
    id:    'security',
    label: 'Privacy & Data Security',
    icon:  <Shield size={16} />,
    color: '#f59e0b',
    bg:    'rgba(245,158,11,0.08)',
    items: [
      {
        q: 'Is patient telemetry data encrypted and secure?',
        a: (
          <>
            <p>Yes. ReViveX is architected with a multi-layer security model appropriate for clinical data environments. All patient telemetry is protected across every stage of its lifecycle:</p>
            <ol>
              <li><strong>In Transit:</strong> All communication between the patient's ESP32 device and the ReViveX cloud broker uses <span className="hc-code">TLS 1.3</span> encrypted MQTT channels. Web dashboard traffic is served exclusively over <span className="hc-code">HTTPS</span> with HSTS enforcement.</li>
              <li><strong>At Rest:</strong> Session telemetry, grip force series, and patient identifiers are stored in a <strong>secure, partitioned NoSQL cloud database</strong> (Firebase Firestore) with field-level security rules. No patient record is accessible without a valid, role-scoped authentication token.</li>
              <li><strong>Access Control:</strong> The system enforces strict Role-Based Access Control (RBAC). Doctors can only access records for patients explicitly assigned to their account. Admin-level operations require a secondary authentication challenge.</li>
              <li><strong>AI Data Handling:</strong> When telemetry is sent to the Gemini API for summary generation, it is transmitted as anonymised structured data. No personally identifiable information (name, date of birth, address) is included in AI prompt context.</li>
            </ol>
            <div className="hc-note hc-note-amber">
              <Lock size={12} />
              For a full Data Processing Agreement or to request a security audit report, contact your institutional administrator or email <strong>compliance@revivex.com</strong>.
            </div>
          </>
        ),
      },
    ],
  },
];

// Configuration for the top shortcut cards that link down to specific sections
const QUICK_ACTIONS = [
  {
    icon:  <Cpu size={20} />,
    label: 'Hardware Troubleshooting',
    desc:  'Sensor calibration, connectivity & device IDs',
    color: '#0891b2',
    bg:    'rgba(8,145,178,0.08)',
    border:'rgba(8,145,178,0.22)',
    anchor:'#hardware',
  },
  {
    icon:  <Stethoscope size={20} />,
    label: 'Therapy Protocols',
    desc:  'Difficulty settings, hand targeting & metrics',
    color: '#2DD4BF',
    bg:    'rgba(45,212,191,0.08)',
    border:'rgba(45,212,191,0.25)',
    anchor:'#protocols',
  },
  {
    icon:  <Brain size={20} />,
    label: 'AI Insights',
    desc:  'Summaries, Companion Chat & Gemini features',
    color: '#6366f1',
    bg:    'rgba(99,102,241,0.08)',
    border:'rgba(99,102,241,0.22)',
    anchor:'#ai',
  },
  {
    icon:  <LifeBuoy size={20} />,
    label: 'Contact Support',
    desc:  'Submit a ticket or reach the support team',
    color: '#f59e0b',
    bg:    'rgba(245,158,11,0.08)',
    border:'rgba(245,158,11,0.22)',
    anchor:'#contact',
  },
];

// Global CSS and Keyframes specifically scoped to the Help Center (.hc)
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

  .hc * { font-family:'Plus Jakarta Sans',system-ui,sans-serif; box-sizing:border-box; }
  .hc .mono { font-family:'JetBrains Mono',monospace; }

  /* ── Keyframes ────────────────────────────────────────── */
  @keyframes hcFadeUp {
    from { opacity:0; transform:translateY(18px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes hcCardPop {
    0%   { opacity:0; transform:translateY(14px) scale(0.97); }
    100% { opacity:1; transform:translateY(0)    scale(1); }
  }
  @keyframes hcShimmer {
    0%   { transform:translateX(-200%) skewX(-15deg); }
    100% { transform:translateX(400%)  skewX(-15deg); }
  }
  @keyframes hcScanLine {
    0%   { top:-6%;  opacity:0; }
    8%   { opacity:1; }
    90%  { opacity:0.5; }
    100% { top:108%; opacity:0; }
  }
  @keyframes hcGlow {
    0%,100% { box-shadow:0 0 0 0 rgba(45,212,191,0.35); }
    50%     { box-shadow:0 0 0 9px rgba(45,212,191,0); }
  }
  @keyframes hcDot {
    0%,100% { opacity:1; }
    50%     { opacity:0.25; }
  }
  @keyframes hcAccordionOpen {
    from { opacity:0; transform:translateY(-6px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes hcSearchFocus {
    from { box-shadow:0 0 0 0 rgba(45,212,191,0.30); }
    to   { box-shadow:0 0 0 4px rgba(45,212,191,0.15); }
  }

  /* ── Quick action cards ───────────────────────────────── */
  .hc-quick-card {
    display:flex; flex-direction:column; gap:10px;
    padding:20px 22px; border-radius:18px;
    text-decoration:none; cursor:pointer;
    transition:all 0.25s cubic-bezier(0.22,1,0.36,1);
    position:relative; overflow:hidden;
  }
  .hc-quick-card:hover {
    transform:translateY(-4px);
    box-shadow:0 12px 36px rgba(11,30,51,0.12);
  }
  .hc-quick-card::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent);
    animation:hcShimmer 4s ease-in-out infinite;
    opacity:0; transition:opacity 0.3s;
  }
  .hc-quick-card:hover::after { opacity:1; }

  /* ── Search bar ───────────────────────────────────────── */
  .hc-search {
    width:100%; padding:14px 18px 14px 48px;
    background:rgba(255,255,255,0.95);
    border:1.5px solid rgba(226,232,240,0.9);
    border-radius:15px; font-size:14px; font-weight:500; color:#0B1E33;
    outline:none; transition:all 0.22s ease;
    font-family:'Plus Jakarta Sans',sans-serif;
    box-shadow:0 2px 12px rgba(11,30,51,0.05);
  }
  .hc-search::placeholder { color:#94a3b8; }
  .hc-search:focus {
    border-color:rgba(45,212,191,0.55);
    box-shadow:0 0 0 4px rgba(45,212,191,0.12), 0 2px 16px rgba(11,30,51,0.07);
    background:#fff;
    animation:hcSearchFocus 0.22s ease both;
  }

  /* ── Category pill ────────────────────────────────────── */
  .hc-cat-pill {
    display:inline-flex; align-items:center; gap:6px;
    padding:6px 14px; border-radius:99px;
    font-size:11px; font-weight:800; letter-spacing:0.06em;
    font-family:'JetBrains Mono',monospace;
    text-transform:uppercase;
  }

  /* ── Accordion ────────────────────────────────────────── */
  .hc-accordion-item {
    background:#fff; border-radius:16px;
    border:1px solid rgba(226,232,240,0.9);
    box-shadow:0 2px 14px rgba(11,30,51,0.045);
    overflow:hidden;
    transition:box-shadow 0.25s ease, border-color 0.25s ease;
  }
  .hc-accordion-item.open {
    box-shadow:0 6px 28px rgba(11,30,51,0.09);
  }
  .hc-accordion-trigger {
    width:100%; display:flex; align-items:center; justify-content:space-between;
    gap:16px; padding:20px 24px; background:none; border:none; cursor:pointer;
    text-align:left; transition:background 0.18s ease;
    font-family:'Plus Jakarta Sans',sans-serif;
  }
  .hc-accordion-trigger:hover { background:rgba(240,244,248,0.6); }
  .hc-accordion-trigger.open  { background:rgba(240,244,248,0.5); }
  .hc-accordion-content {
    padding:0 24px 22px;
    animation:hcAccordionOpen 0.28s cubic-bezier(0.22,1,0.36,1) both;
    border-top:1px solid rgba(226,232,240,0.7);
  }
  .hc-accordion-content p {
    font-size:13.5px; color:#475569; line-height:1.78; margin:12px 0;
  }
  .hc-accordion-content ol {
    padding-left:20px; margin:12px 0;
  }
  .hc-accordion-content ol li {
    font-size:13.5px; color:#475569; line-height:1.78; margin-bottom:8px;
  }
  .hc-accordion-content ol li strong { color:#0B1E33; font-weight:700; }
  .hc-accordion-content ul {
    padding-left:18px; margin:8px 0;
  }
  .hc-accordion-content ul li {
    font-size:13px; color:#475569; line-height:1.7; margin-bottom:5px;
  }
  .hc-accordion-content em { font-style:italic; color:#64748b; }

  /* ── Inline code ──────────────────────────────────────── */
  .hc-code {
    font-family:'JetBrains Mono',monospace;
    font-size:11.5px; font-weight:600;
    background:rgba(11,30,51,0.06); color:#0B1E33;
    padding:1px 7px; border-radius:6px;
    border:1px solid rgba(11,30,51,0.09);
  }

  /* ── Inline badge ─────────────────────────────────────── */
  .hc-badge {
    display:inline-flex; align-items:center; gap:4px;
    font-family:'JetBrains Mono',monospace;
    font-size:10px; font-weight:700; letter-spacing:0.10em;
    padding:2px 8px; border-radius:99px; text-transform:uppercase;
  }
  .hc-badge-red    { background:rgba(239,68,68,0.09);   color:#dc2626; border:1px solid rgba(239,68,68,0.22); }
  .hc-badge-indigo { background:rgba(99,102,241,0.09);  color:#4f46e5; border:1px solid rgba(99,102,241,0.22); }
  .hc-badge-teal   { background:rgba(45,212,191,0.09);  color:#0f766e; border:1px solid rgba(45,212,191,0.22); }

  /* ── Callout note ─────────────────────────────────────── */
  .hc-note {
    display:flex; align-items:flex-start; gap:8px;
    padding:11px 15px; border-radius:11px; margin-top:14px;
    background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.18);
    font-size:12.5px; color:#991b1b; line-height:1.65;
  }
  .hc-note svg { flex-shrink:0; margin-top:1px; }
  .hc-note-teal   { background:rgba(45,212,191,0.06);  border-color:rgba(45,212,191,0.22);  color:#0f766e; }
  .hc-note-indigo { background:rgba(99,102,241,0.07);  border-color:rgba(99,102,241,0.22);  color:#3730a3; }
  .hc-note-amber  { background:rgba(245,158,11,0.07);  border-color:rgba(245,158,11,0.24);  color:#92400e; }

  /* ── Formula box ──────────────────────────────────────── */
  .hc-formula {
    background:rgba(11,30,51,0.04); border:1.5px solid rgba(11,30,51,0.08);
    border-radius:12px; padding:16px 18px; margin:14px 0; position:relative;
  }
  .hc-formula-label {
    display:inline-block; margin-bottom:8px;
    font-family:'JetBrains Mono',monospace;
    font-size:9px; font-weight:700; letter-spacing:0.18em;
    text-transform:uppercase; color:#94a3b8;
  }
  .hc-formula p {
    font-family:'JetBrains Mono',monospace !important;
    font-size:12px !important; color:#0B1E33 !important;
    background:none; margin:0 !important; line-height:1.7 !important;
  }
  .hc-formula p strong { color:#2DD4BF !important; }

  /* ── Compare grid boxes ───────────────────────────────── */
  .hc-compare-box {
    padding:14px 16px; border-radius:13px;
    background:rgba(240,244,248,0.7); border:1px solid rgba(226,232,240,0.9);
  }
  .hc-compare-box-indigo {
    background:rgba(99,102,241,0.05); border-color:rgba(99,102,241,0.20);
  }
  .hc-compare-title {
    display:flex; align-items:center; gap:6px;
    font-size:12.5px; font-weight:800; color:#0B1E33; margin-bottom:10px;
  }

  /* ── Contact cards ────────────────────────────────────── */
  .hc-contact-card {
    display:flex; align-items:center; gap:14px; padding:18px 22px;
    background:#fff; border-radius:16px;
    border:1px solid rgba(226,232,240,0.9);
    box-shadow:0 2px 14px rgba(11,30,51,0.045);
    transition:all 0.22s ease; cursor:pointer; text-decoration:none;
  }
  .hc-contact-card:hover {
    transform:translateY(-3px);
    box-shadow:0 8px 28px rgba(11,30,51,0.09);
    border-color:rgba(45,212,191,0.35);
  }

  /* ── Filter tab ───────────────────────────────────────── */
  .hc-filter-tab {
    display:inline-flex; align-items:center; gap:6px;
    padding:7px 16px; border-radius:99px; border:none; cursor:pointer;
    font-size:12px; font-weight:700; transition:all 0.18s ease;
    font-family:'Plus Jakarta Sans',sans-serif; white-space:nowrap;
  }

  /* ── Scrollbar ────────────────────────────────────────── */
  .hc::-webkit-scrollbar { width:4px; }
  .hc::-webkit-scrollbar-thumb { background:rgba(45,212,191,0.25); border-radius:99px; }

  /* ── Responsive ───────────────────────────────────────── */
  .hc-quick-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
  .hc-contact-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
  .hc-compare-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }

  @media (max-width:1100px) { .hc-quick-grid { grid-template-columns:repeat(2,1fr); } }
  @media (max-width:900px)  { .hc-compare-grid { grid-template-columns:1fr; } .hc-contact-grid { grid-template-columns:1fr 1fr; } }
  @media (max-width:640px)  {
    .hc-quick-grid { grid-template-columns:1fr; }
    .hc-contact-grid { grid-template-columns:1fr; }
    .hc .hc-pad { padding:18px 14px !important; }
    .hc-accordion-trigger { padding:16px 18px !important; }
    .hc-accordion-content { padding:0 18px 18px !important; }
  }
`;

// Renders an individual FAQ question/answer block with smooth expand/collapse animations
function AccordionItem({
  item,
  catColor,
  catBg,
  index,
  isOpen,
  onToggle,
}: {
  item:     FAQItem;
  catColor: string;
  catBg:    string;
  index:    number;
  isOpen:   boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`hc-accordion-item ${isOpen ? 'open' : ''}`}
      style={{
        borderColor: isOpen ? `${catColor}38` : 'rgba(226,232,240,0.9)',
        animationDelay: `${index * 0.06}s`,
        animation: `hcCardPop 0.45s cubic-bezier(0.22,1,0.36,1) ${index * 0.06}s both`,
      }}
    >
      <button
        className={`hc-accordion-trigger ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        {/* Number + question */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 9, flexShrink: 0,
            background: isOpen ? catBg : 'rgba(240,244,248,0.8)',
            border: `1.5px solid ${isOpen ? catColor + '40' : 'rgba(226,232,240,0.9)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10, fontWeight: 700,
            color: isOpen ? catColor : '#94a3b8',
            transition: 'all 0.2s ease', marginTop: 1,
          }}>
            {String(index + 1).padStart(2, '0')}
          </div>
          <span style={{
            fontSize: 14.5, fontWeight: 700,
            color: isOpen ? '#0B1E33' : '#334155',
            lineHeight: 1.5, flex: 1,
          }}>
            {item.q}
          </span>
        </div>

        {/* Chevron icon */}
        <div style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0,
          background: isOpen ? catBg : 'rgba(240,244,248,0.8)',
          border: `1.5px solid ${isOpen ? catColor + '35' : 'rgba(226,232,240,0.9)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.28s cubic-bezier(0.22,1,0.36,1)',
          color: isOpen ? catColor : '#94a3b8',
        }}>
          <ChevronDown
            size={15}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.28s cubic-bezier(0.22,1,0.36,1)',
            }}
          />
        </div>
      </button>

      {isOpen && (
        <div className="hc-accordion-content">
          <div style={{ paddingTop: 16 }}>
            {item.a}
          </div>
        </div>
      )}
    </div>
  );
}

// Wraps a group of AccordionItems under a single themed category header
function CategorySection({ cat, openMap, onToggle }: {
  cat:     FAQCategory;
  openMap: Record<string, boolean>;
  onToggle:(key: string) => void;
}) {
  return (
    <div id={cat.id} style={{ scrollMarginTop: 24 }}>
      {/* Category header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 11,
          background: cat.bg, border: `1.5px solid ${cat.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: cat.color, flexShrink: 0,
        }}>
          {cat.icon}
        </div>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0B1E33', margin: 0 }}>
            {cat.label}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span className="mono" style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600 }}>
              {cat.items.length} {cat.items.length === 1 ? 'topic' : 'topics'}
            </span>
          </div>
        </div>
        <div style={{ flex: 1, height: 1, background: 'rgba(226,232,240,0.8)', marginLeft: 4 }} />
      </div>

      {/* Renders the actual FAQ items for this category */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cat.items.map((item, i) => {
          const key = `${cat.id}-${i}`;
          return (
            <AccordionItem
              key={key}
              item={item}
              catColor={cat.color}
              catBg={cat.bg}
              index={i}
              isOpen={!!openMap[key]}
              onToggle={() => onToggle(key)}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function DoctorHelpPage() {
  const [mounted,   setMounted]   = useState(false);
  const [search,    setSearch]    = useState('');
  const [openMap,   setOpenMap]   = useState<Record<string, boolean>>({});
  const [activeFilter, setFilter] = useState<string>('all');
  
  // State for the mock support ticket form
  const [ticketSent, setTicketSent] = useState(false);
  const [ticketMsg,  setTicketMsg]  = useState('');

  useEffect(() => { setMounted(true); }, []);

  const toggleAccordion = (key: string) => {
    setOpenMap(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Dynamically filters the FAQ list based on the active tab and the user's search query
  const visibleCategories = FAQ_CATEGORIES.filter(cat => {
    const matchesFilter = activeFilter === 'all' || cat.id === activeFilter;
    if (!matchesFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return cat.items.some(item =>
      item.q.toLowerCase().includes(q)
    );
  }).map(cat => ({
    ...cat,
    items: !search.trim()
      ? cat.items
      : cat.items.filter(item => item.q.toLowerCase().includes(search.toLowerCase())),
  }));

  const handleTicket = () => {
    if (!ticketMsg.trim()) return;
    setTicketSent(true);
    // Auto-reset the success state after 3.5 seconds
    setTimeout(() => { setTicketSent(false); setTicketMsg(''); }, 3500);
  };

  if (!mounted) return null;

  return (
    <div className="hc" style={{ minHeight: '100vh', background: '#F0F4F8', paddingBottom: 72 }}>
      <style>{CSS}</style>

      {/* ── Ambient background ───────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-12%', right: '3%', width: 700, height: 700, background: 'radial-gradient(circle,rgba(45,212,191,0.050),transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '2%', width: 600, height: 600, background: 'radial-gradient(circle,rgba(99,102,241,0.040),transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(11,30,51,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(11,30,51,0.018) 1px,transparent 1px)', backgroundSize: '54px 54px' }} />
      </div>

      <div className="hc-pad" style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 24px', position: 'relative', zIndex: 1 }}>

        {/* ── Back nav ─────────────────────────────────────── */}
        <div style={{ marginBottom: 24, animation: 'hcFadeUp 0.40s ease both' }}>
          <Link href="/doctor/home" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '8px 16px', borderRadius: 12,
            background: '#fff', border: '1.5px solid rgba(226,232,240,0.9)',
            fontSize: 13, fontWeight: 700, color: '#64748b', textDecoration: 'none',
            transition: 'all 0.2s ease', boxShadow: '0 1px 8px rgba(11,30,51,0.05)',
          }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </Link >
        </div>

        {/* ══════════════════════════════════════════════════
            HERO — dark header card
        ══════════════════════════════════════════════════ */}
        <div style={{
          background: '#0B1E33', borderRadius: 22, marginBottom: 28,
          overflow: 'hidden', position: 'relative',
          animation: 'hcFadeUp 0.45s ease 0.04s both',
        }}>
          {/* Grid overlay */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(45,212,191,0.038) 1px,transparent 1px),linear-gradient(90deg,rgba(45,212,191,0.038) 1px,transparent 1px)', backgroundSize: '34px 34px' }} />
          {/* Scan line */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, height: '22%', background: 'linear-gradient(to bottom,transparent,rgba(45,212,191,0.055),transparent)', animation: 'hcScanLine 6s linear infinite' }} />
          </div>

          <div style={{ position: 'relative', zIndex: 2, padding: '36px 40px' }}>
            {/* Label */}
            <p className="mono" style={{ fontSize: 9, color: 'rgba(45,212,191,0.65)', textTransform: 'uppercase', letterSpacing: '0.24em', marginBottom: 10, fontWeight: 600 }}>
              ReViveX Clinical Platform
            </p>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap', marginBottom: 28 }}>
              <div>
                <h1 style={{ fontSize: 'clamp(1.6rem,3vw,2.25rem)', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.12 }}>
                  Help &amp; Clinical <span style={{ color: '#2DD4BF' }}>Support</span>
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 8, fontWeight: 500, maxWidth: 480, lineHeight: 1.65 }}>
                  Documentation, clinical protocols, hardware troubleshooting, and AI feature guidance for the ReViveX Doctor Dashboard.
                </p>
              </div>

              {/* Status pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 11, background: 'rgba(45,212,191,0.10)', border: '1px solid rgba(45,212,191,0.20)' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.7)', animation: 'hcDot 2s ease-in-out infinite' }} />
                  <span className="mono" style={{ fontSize: 9.5, color: '#2DD4BF', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>All Systems Operational</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Server size={11} color="rgba(255,255,255,0.35)" />
                  <span className="mono" style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.40)', fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase' }}>v2.4.1 — Platform Build</span>
                </div>
              </div>
            </div>

            {/* Search bar */}
            <div style={{ position: 'relative', maxWidth: 620 }}>
              <Search size={17} color="#94a3b8" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }} />
              <input
                className="hc-search"
                placeholder="Search protocols, hardware setups, or AI features..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18, lineHeight: 1 }}
                >
                  ×
                </button>
              )}
            </div>
            {search && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 10 }}>
                Showing results for <span style={{ color: '#2DD4BF', fontWeight: 700 }}>"{search}"</span>
                {' '}— {visibleCategories.reduce((n, c) => n + c.items.length, 0)} topics found
              </p>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            QUICK ACTION CARDS
        ══════════════════════════════════════════════════ */}
        <div style={{ marginBottom: 32, animation: 'hcFadeUp 0.48s ease 0.08s both' }}>
          <div className="hc-quick-grid">
            {QUICK_ACTIONS.map((card, i) => (
              <a
                key={card.label}
                href={card.anchor}
                className="hc-quick-card"
                style={{
                  background: card.bg,
                  border: `1.5px solid ${card.border}`,
                  animationDelay: `${0.10 + i * 0.06}s`,
                  animation: `hcCardPop 0.45s cubic-bezier(0.22,1,0.36,1) ${0.10 + i * 0.06}s both`,
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 13,
                  background: `${card.color}18`,
                  border: `1.5px solid ${card.color}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: card.color, flexShrink: 0,
                }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0B1E33', marginBottom: 4 }}>
                    {card.label}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.55 }}>
                    {card.desc}
                  </div>
                </div>
                <ChevronDown
                  size={14}
                  color={card.color}
                  style={{ transform: 'rotate(-90deg)', marginTop: 'auto', alignSelf: 'flex-end' }}
                />
              </a>
            ))}
          </div>
        </div>