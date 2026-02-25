'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Gamepad2, Zap, Settings2, Brain, Save,
  Play, Send, Activity, Volume2, Eye,
  BookOpen, Users, ChevronDown, Check,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════ */
const GAMES = [
  { value: 'synapse', label: 'Synapse Racer (Motor Focus)', benefit: 'Patients control altitude by squeezing the BP Bulb. This game promotes grip strength modulation, impulse control, and sustained motor output. Ideal for stroke and Parkinson\'s patients working on hand function recovery.' },
  { value: 'memory',  label: 'Memory Gate (Cognitive Dual-Task)', benefit: 'Navigate obstacles while memorising colour sequences. Combines fine motor control with working memory training. Designed for TBI and post-surgical cognitive rehabilitation.' },
  { value: 'rhythm',  label: 'Rhythm Reef (Timing & Coordination)', benefit: 'Match squeeze cadence to oncoming patterns. Trains rhythmic grip timing and finger-hand synchronisation. Suitable for stroke and neurological coordination disorders.' },
];

const SAVED_PROTOCOLS = [
  { name: 'Stroke Standard - Week 1',  game: 'Synapse Racer',  patients: 12 },
  { name: "Parkinson's Advanced",       game: 'Memory Gate',    patients: 8  },
  { name: 'TBI Cognitive Dual Task',   game: 'Memory Gate',    patients: 15 },
];

const DIFFICULTY_LABELS = ['Easy', 'Medium', 'Hard', 'Expert'];