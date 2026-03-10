'use client';

import Link from "next/link";
import { useState, useEffect } from "react";

export default function DoctorSettingsPage() {
  const [darkMode, setDarkMode] = useState(false);

  // On mount: read saved preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  function handleDarkModeToggle() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
    document.documentElement.classList.toggle("dark", next);
  }

  return (
    <div className="p-8 max-w-5xl">

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#0B1E33] dark:text-slate-100">
          Settings
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">
          Manage your account and preferences
        </p>
      </header>

      <div className="space-y-8">

        {/* Profile Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-[#0B1E33] dark:text-slate-100 mb-4">
            Profile Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SettingField label="Full Name" value="Dr. Silva" />
            <SettingField label="Email Address" value="dr.silva@revivex.com" />
            <SettingField label="Specialization" value="Neuro Rehabilitation" />
            <SettingField label="Hospital / Clinic" value="ReViveX Medical Center" />
          </div>

          <p className="text-xs text-gray-500 dark:text-slate-400 mt-4">
            Profile details are managed by the system administrator.
          </p>
        </section>

        {/* Preferences Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-[#0B1E33] dark:text-slate-100 mb-4">
            Preferences
          </h2>

          <div className="space-y-4">
            <ToggleSetting
              title="Email Notifications"
              description="Receive updates about patient activity and alerts"
            />

            <ToggleSetting
              title="Session Reminders"
              description="Get reminders for scheduled patient sessions"
            />

            <ToggleSetting
              title="Dark Mode"
              description="Enable dark mode for reduced eye strain"
              checked={darkMode}
              onChange={handleDarkModeToggle}
            />
          </div>
        </section>

        {/* Security Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-[#0B1E33] dark:text-slate-100 mb-4">
            Security
          </h2>

          <div className="space-y-3">
            <button className="w-full md:w-auto px-5 py-2 rounded-xl border border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-slate-200 transition">
              Change Password
            </button>

            <p className="text-xs text-gray-500 dark:text-slate-400">
              Password changes will be available once authentication is enabled.
            </p>
          </div>
        </section>

        {/* Logout */}
        <section className="bg-[#F7F9FC] dark:bg-slate-800/50 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
          <h2 className="font-bold text-[#0B1E33] dark:text-slate-100 mb-3">
            Session
          </h2>

          <Link href="/">
            <button className="bg-red-500 hover:bg-red-400 text-white px-6 py-2 rounded-xl font-semibold transition">
              Log Out
            </button>
          </Link>
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
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
        {label}
      </p>
      <div className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-600">
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
}: {
  title: string;
  description: string;
  disabled?: boolean;
  checked?: boolean;
  onChange?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-medium text-gray-800 dark:text-slate-200">
          {title}
        </p>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      <button
        disabled={disabled}
        onClick={onChange}
        className={`w-12 h-6 rounded-full transition-colors ${
          disabled
            ? "bg-gray-300 dark:bg-slate-600 cursor-not-allowed"
            : checked
            ? "bg-teal-500"
            : "bg-gray-300 dark:bg-slate-600"
        }`}
      >
        <span className={`block w-5 h-5 bg-white rounded-full transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`} />
      </button>
    </div>
  );
}
