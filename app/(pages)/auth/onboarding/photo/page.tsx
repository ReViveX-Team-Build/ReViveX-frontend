"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/lib/firebase";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { getPatientData, updateProfilePicture } from "@/app/lib/db/users";
import { Camera, Upload, ArrowRight, CheckCircle2, Loader2, UserCircle2, X } from "lucide-react";

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans...');
  @keyframes fadeUp { ... }
  @keyframes popIn { ... }
  @keyframes shimmer { ... }
  .onb-root { ... }
  .onb-card { ... }
  /* etc */
`;