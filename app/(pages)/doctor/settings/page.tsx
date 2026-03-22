'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/app/lib/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { User, Bell, Shield, LogOut, Moon, Loader2 } from "lucide-react";

export default function DoctorSettingsPage() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  
  // Local preferences
  const [darkMode, setDarkMode] = useState(false);
  
  // Database preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [sessionReminders, setSessionReminders] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile Data
  const [profile, setProfile] = useState({
    name: "Loading...",
    email: "Loading...",
    specialization: "Neuro Rehabilitation", // Can be made dynamic later
    clinic: "ReViveX Medical Center"        // Can be made dynamic later
  });

  // ─── 1. Load Dark Mode from LocalStorage (Device Preference) ───
  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  // ─── 2. Load User Data & Settings from Firestore (Cloud Preference) ───
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        // Set basic auth data first
        setProfile(prev => ({ 
          ...prev, 
          name: user.displayName || "Doctor", 
          email: user.email || "" 
        }));

        // Fetch detailed profile and settings from Firestore
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.name) setProfile(prev => ({ ...prev, name: data.name }));
          
          // Load settings if they exist
          if (data.settings) {
            if (typeof data.settings.emailNotifications === 'boolean') setEmailNotifs(data.settings.emailNotifications);
            if (typeof data.settings.sessionReminders === 'boolean') setSessionReminders(data.settings.sessionReminders);
          }
        }
      }
    };
    fetchUserData();
  }, [user]);

  // ─── Handlers ───
  function handleDarkModeToggle() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
    document.documentElement.classList.toggle("dark", next);
  }

  const handleCloudSettingToggle = async (settingType: 'emailNotifications' | 'sessionReminders', currentValue: boolean) => {
    if (!user) return;
    setIsSaving(true);
    const newValue = !currentValue;
    
    // Optimistic UI update
    if (settingType === 'emailNotifications') setEmailNotifs(newValue);
    if (settingType === 'sessionReminders') setSessionReminders(newValue);

    try {
      const docRef = doc(db, "users", user.uid);
      // Use setDoc with merge: true to avoid overwriting other user data
      await setDoc(docRef, {
        settings: {
          [settingType]: newValue
        }
      }, { merge: true });
    } catch (error) {
      console.error("Failed to save settings:", error);
      // Revert UI on failure
      if (settingType === 'emailNotifications') setEmailNotifs(currentValue);
      if (settingType === 'sessionReminders') setSessionReminders(currentValue);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push("/auth/doctor/signin");
    return null;
  }

  return (
    <div className="p-8 max-w-4xl transition-colors duration-200">

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#0B1E33] dark:text-slate-100 tracking-tight">
          Settings
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1.5 font-medium">
          Manage your account, preferences, and notifications.
        </p>
      </header>

      <div className="space-y-8">

        {/* Profile Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-7 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <User size={20} />
            </div>
            <h2 className="font-bold text-lg text-[#0B1E33] dark:text-slate-100">
              Profile Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SettingField label="Full Name" value={profile.name} />
            <SettingField label="Email Address" value={profile.email} />
            <SettingField label="Specialization" value={profile.specialization} />
            <SettingField label="Hospital / Clinic" value={profile.clinic} />
          </div>

          <p className="text-xs text-gray-500 dark:text-slate-400 mt-5 flex items-center gap-1.5">
            <Shield size={12} /> Profile details are synced securely with your ReViveX account.
          </p>
        </section>

        {/* Preferences Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-7 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors relative">
          {/* Saving Indicator */}
          {isSaving && (
            <div className="absolute top-6 right-6 flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-full">
              <Loader2 size={12} className="animate-spin" /> Saving...
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg">
              <Bell size={20} />
            </div>
            <h2 className="font-bold text-lg text-[#0B1E33] dark:text-slate-100">
              Preferences & Notifications
            </h2>
          </div>

          <div className="space-y-6">
            <ToggleSetting
              title="Email Notifications"
              description="Receive weekly summaries and urgent patient alerts directly to your inbox."
              checked={emailNotifs}
              onChange={() => handleCloudSettingToggle('emailNotifications', emailNotifs)}
            />
            
            <hr className="border-gray-100 dark:border-slate-700" />

            <ToggleSetting
              title="Session Reminders"
              description="Show in-app banner alerts for upcoming patient telehealth and game sessions."
              checked={sessionReminders}
              onChange={() => handleCloudSettingToggle('sessionReminders', sessionReminders)}
            />

            <hr className="border-gray-100 dark:border-slate-700" />

            <ToggleSetting
              title="Dark Mode"
              description="Switch to a dark theme to reduce eye strain in low-light environments."
              checked={darkMode}
              onChange={handleDarkModeToggle}
              icon={<Moon size={18} className={darkMode ? "text-teal-500" : "text-gray-400"} />}
            />
          </div>
        </section>

        {/* Security Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-7 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Shield size={20} />
            </div>
            <h2 className="font-bold text-lg text-[#0B1E33] dark:text-slate-100">
              Security
            </h2>
          </div>

          <div className="space-y-4">
            <button className="w-full md:w-auto px-6 py-2.5 rounded-xl border-2 border-gray-200 dark:border-slate-600 font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 transition-all">
              Change Password
            </button>

            <p className="text-xs text-gray-500 dark:text-slate-400">
              Secure authentication is managed by Google Firebase.
            </p>
          </div>
        </section>

        {/* Logout */}
        <section className="bg-red-50/50 dark:bg-red-900/10 rounded-2xl p-7 border border-red-100 dark:border-red-900/30 transition-colors">
          <h2 className="font-bold text-red-900 dark:text-red-400 mb-4">
            Danger Zone
          </h2>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <LogOut size={18} /> Secure Log Out
          </button>
        </section>

      </div>
    </div>
  );
}

/* ---------- Components ---------- */

function SettingField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1.5">
        {label}
      </p>
      <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-slate-100 border border-gray-200 dark:border-slate-600 font-medium">
        {value}
      </div>
    </div>
  );
}

function ToggleSetting({
  title,
  description,
  disabled,
  checked,
  onChange,
  icon,
}: {
  title: string;
  description: string;
  disabled?: boolean;
  checked?: boolean;
  onChange?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex gap-4 items-start">
        {icon && <div className="mt-1">{icon}</div>}
        <div>
          <p className="font-bold text-gray-900 dark:text-slate-100 text-base">
            {title}
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed pr-4">
            {description}
          </p>
        </div>
      </div>

      <button
        disabled={disabled}
        onClick={onChange}
        className={`relative w-14 h-7 flex-shrink-0 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-teal-500/20 ${
          disabled
            ? "bg-gray-200 dark:bg-slate-700 cursor-not-allowed opacity-50"
            : checked
            ? "bg-teal-500 shadow-inner"
            : "bg-gray-300 dark:bg-slate-600 shadow-inner"
        }`}
      >
        <span 
          className={`absolute top-1 block w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ease-bounce ${
            checked ? "translate-x-8" : "translate-x-1"
          }`} 
        />
      </button>
    </div>
  );
}