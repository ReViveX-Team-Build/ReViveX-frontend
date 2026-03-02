'use client';

import { useState } from "react";

export default function PatientSettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [sessionReminders, setSessionReminders] = useState(true);

  return (
    <div className="p-8 max-w-5xl">

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#0B1E33]">
          Settings
        </h1>
        <p className="text-gray-500 mt-1">
          Manage your account and preferences
        </p>
      </header>

      <div className="space-y-8">

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-[#0B1E33] mb-4">
            Profile Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SettingField label="Full Name" value="Nimal Perera" />
            <SettingField label="Email Address" value="nimal@example.com" />
            <SettingField label="Patient ID" value="RVX-001" />
            <SettingField label="Assigned Therapist" value="Dr. Silva" />
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Contact the administrator to update profile details.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-[#0B1E33] mb-4">
            Preferences
          </h2>

          <div className="space-y-4">
            <ToggleSetting
              title="Email Notifications"
              description="Receive updates about your therapy progress"
              enabled={emailNotifications}
              onToggle={() => setEmailNotifications(!emailNotifications)}
            />

            <ToggleSetting
              title="Session Reminders"
              description="Get reminders before scheduled sessions"
              enabled={sessionReminders}
              onToggle={() => setSessionReminders(!sessionReminders)}
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-[#0B1E33] mb-4">
            Security
          </h2>

          <button className="px-5 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 transition">
            Change Password
          </button>

          <p className="text-xs text-gray-500 mt-3">
            Password updates will be available once authentication is fully enabled.
          </p>
        </section>

        <section className="bg-[#F7F9FC] rounded-2xl p-6 border border-gray-200">
          <h2 className="font-bold text-[#0B1E33] mb-3">
            Session
          </h2>

          <button className="bg-red-500 hover:bg-red-400 text-white px-6 py-2 rounded-xl font-semibold transition">
            Log Out
          </button>
        </section>

      </div>
    </div>
  );
}

function SettingField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">
        {label}
      </p>
      <div className="px-4 py-2 rounded-xl bg-gray-50 text-gray-800 border border-gray-200">
        {value}
      </div>
    </div>
  );
}

function ToggleSetting({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-medium text-gray-800">
          {title}
        </p>
        <p className="text-sm text-gray-500">
          {description}
        </p>
      </div>

      <button
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition ${
          enabled ? "bg-teal-500" : "bg-gray-300"
        }`}
      >
        <span
          className={`block w-5 h-5 bg-white rounded-full transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        ></span>
      </button>
    </div>
  );
}