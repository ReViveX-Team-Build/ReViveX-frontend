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