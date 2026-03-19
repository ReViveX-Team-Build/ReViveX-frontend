"use client"

import React, {useState, useRef, useEffect} from "react";
import Link from 'next/link';
import{Search, Cpu, Brain, Shield, Stethoscope, ChevronDown,
  Wifi, Activity, Zap, MessageSquare, ArrowLeft,
  HelpCircle, LifeBuoy, Mail, Phone, ExternalLink,
  AlertCircle, CheckCircle2, BookOpen, Settings2,
  Lock, Server, Bot, Sparkles, BarChart3, Eye,
  Send,
}from 'lucide-react';

interface FAQItem{
  q: string;
  a: React.ReactNode;
}

interface FAQCategory{
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  items: FAQItem[]; 
}

const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: 'hardware',
    label: 'Hardware & Device Management',
    icon: <Cpu size={16} />,
    color: '#0891b2',
    bg: 'rgba(8,145,178,0,0.08)',
    items: [
      {
        q: 'How do I calibrate the MPX5010DP pressure sensor for a new patient?',
        a: (
          <>
            <p>Sensor calibration is performed through the patient's initial <strong>"The Flow"</strong> calibration level, which must be completed before any therapeutic sessions are assigned.</p>
          </>
        )
      }
    ]
  }
]