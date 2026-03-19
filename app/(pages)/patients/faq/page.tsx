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