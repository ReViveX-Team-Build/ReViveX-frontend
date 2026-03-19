"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User as UserIcon, Mail, Phone, PenLine, ClipboardList,
  Calendar, Loader2, CheckCircle2, Camera, X, Zap, Flame,
  Brain, Activity, Shield, ChevronRight, LogOut, Heart, Lock,
} from "lucide-react";
import { auth, db, storage } from "../../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile, type User } from "firebase/auth";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

interface PatientProfile {
  name: string; email: string; phone: string;
  goals: string; bio: string; condition: string;
  affectedSide: string; streak: number; totalXp: number;
  assignedProtocol: string; nextAppointment: string;
  profilePictureUrl: string; unlockedLevels: number[];
  completedSessions: number; joinedAt: string;
}

const EMPTY: PatientProfile = {
  name:"", email:"", phone:"", goals:"", bio:"", condition:"",
  affectedSide:"", streak:0, totalXp:0, assignedProtocol:"Not Assigned",
  nextAppointment:"—", profilePictureUrl:"", unlockedLevels:[],
  completedSessions:0, joinedAt:"",
};