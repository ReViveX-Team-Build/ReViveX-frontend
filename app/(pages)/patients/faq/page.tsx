'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
// Import UI icons from lucide-react for better viusal representation
import {
  Search, Cpu, Brain, Shield, Stethoscope, ChevronDown,
  Wifi, Activity, Zap, MessageSquare, ArrowLeft,
  HelpCircle, LifeBuoy, Mail, Phone, ExternalLink,
  AlertCircle, CheckCircle2, BookOpen, Settings2,
  Lock, Server, Bot, Sparkles, BarChart3, Eye,
  Send,
} from 'lucide-react';

// Represents a single faq item
interface FAQItem {
  q: string;
  a: React.ReactNode;
}

// Represents a category of faqs
interface FAQCategory {
  id:    string;
  label: string;
  icon:  React.ReactNode;
  color: string;
  bg:    string;
  items: FAQItem[];
}

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
]