"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import {
  getDoctorsForListing,
  getPatientData,
  updatePatientSettings,
} from "@/app/lib/db/users";
import { PatientData } from "@/app/lib/db/types";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type DoctorOption = {
  uid: string;
  name: string;
  specialization: string;
  doctorId: string;
};

type Condition = PatientData["condition"];
type Plan = PatientData["subscriptionPlan"];
type ConnectionStatus = PatientData["connectionStatus"];

const CONDITIONS: Condition[] = [
  "Stroke",
  "Parkinson's",
  "TBI",
  "Post-Surgery",
  "Other",
];

export default function PatientSettingsPage() {
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);

  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [sessionReminders, setSessionReminders] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [patientId, setPatientId] = useState("");
  const [condition, setCondition] = useState<Condition>("Other");
  const [subscriptionPlan, setSubscriptionPlan] = useState<Plan>("standard");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("none");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [initialDoctorId, setInitialDoctorId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);

  const selectedDoctorLabel = useMemo(() => {
    if (!selectedDoctorId) return "Not assigned";
    const doc = doctors.find((d) => d.uid === selectedDoctorId);
    if (!doc) return "Unknown doctor";
    return `${doc.name} (${doc.doctorId})`;
  }, [doctors, selectedDoctorId]);

  // ── Dark Mode Init ──
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

  // ── Data Fetching ──
  useEffect(() => {
    async function loadData() {
      if (!user?.uid) return;
      setPageLoading(true);
      setError("");

      try {
        const [patient, doctorsList] = await Promise.all([
          getPatientData(user.uid),
          getDoctorsForListing(),
        ]);

        if (!patient) {
          setError("Unable to find your patient profile.");
          return;
        }

        setFullName(patient.name ?? "");
        setEmail(patient.email ?? user.email ?? "");
        setPatientId(patient.patientId ?? "");
        setCondition((patient.condition as Condition) ?? "Other");
        setSubscriptionPlan((patient.subscriptionPlan as Plan) ?? "standard");
        setConnectionStatus((patient.connectionStatus as ConnectionStatus) ?? "none");
        setSelectedDoctorId(patient.assignedDoctorId ?? "");
        setInitialDoctorId(patient.assignedDoctorId ?? null);
        setDoctors(doctorsList as DoctorOption[]);
      } catch (err) {
        console.error("Failed to load patient settings:", err);
        setError("Failed to load your settings. Please refresh and try again.");
      } finally {
        setPageLoading(false);
      }
    }

    if (authLoading) return;
    if (!user?.uid) {
      setPageLoading(false);
      return;
    }

    loadData();
  }, [authLoading, user?.uid, user?.email]);

  const onSave = async () => {
    if (!user?.uid) return;
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const doctorChanged = (initialDoctorId ?? "") !== selectedDoctorId;
      const nextConnectionStatus: ConnectionStatus = doctorChanged
        ? selectedDoctorId
          ? "pending"
          : "none"
        : connectionStatus;

      await updatePatientSettings(user.uid, {
        name: fullName.trim(),
        condition,
        subscriptionPlan,
        assignedDoctorId: selectedDoctorId || null,
        connectionStatus: nextConnectionStatus,
      });

      setConnectionStatus(nextConnectionStatus);
      setInitialDoctorId(selectedDoctorId || null);
      setSuccess("Settings saved successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error("Failed to save patient settings:", err);
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const onLogOut = async () => {
    await signOut(auth);
    router.push("/auth/patient/signin");
  };

  if (pageLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-500" size={32} />
      </div>
    );
  }

  if (!user?.uid) {
    return (
      <div className="p-8 max-w-5xl">
        <p className="text-gray-500 dark:text-slate-400">Please sign in to manage your settings.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#0B1E33] dark:text-slate-100">
          Settings
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">
          Manage your account, doctor selection, and preferences
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 font-medium transition-all">
          {success}
        </div>
      )}

      <div className="space-y-8">
        
        {/* Profile Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-[#0B1E33] dark:text-slate-100 mb-6">
            Profile Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EditableField
              label="Full Name"
              value={fullName}
              onChange={setFullName}
              placeholder="Enter your full name"
            />
            <SettingField label="Email Address" value={email} />
            <SettingField label="Patient ID" value={patientId || user.uid.slice(0, 8).toUpperCase()} />

            <SelectField
              label="Condition"
              value={condition}
              onChange={(value) => setCondition(value as Condition)}
              options={CONDITIONS.map((c) => ({ value: c, label: c }))}
            />

            <SelectField
              label="Subscription Plan"
              value={subscriptionPlan}
              onChange={(value) => setSubscriptionPlan(value as Plan)}
              options={[
                { value: "standard", label: "Standard" },
                { value: "ai_companion", label: "AI Companion" },
              ]}
            />

            <SelectField
              label="Assigned Doctor"
              value={selectedDoctorId}
              onChange={setSelectedDoctorId}
              options={[
                { value: "", label: "Not assigned" },
                ...doctors.map((d) => ({
                  value: d.uid,
                  label: `${d.name} (${d.doctorId})${d.specialization ? ` - ${d.specialization}` : ""}`,
                })),
              ]}
            />

            <SettingField
              label="Connection Status"
              value={connectionStatus === "none" ? "Not Connected" : connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
            />
          </div>

          <p className="text-xs text-gray-500 dark:text-slate-400 mt-4 mb-6">
            Selecting a different doctor marks your connection as pending until approval.
          </p>

          <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button
              onClick={onSave}
              disabled={saving}
              className="bg-teal-500 hover:bg-teal-400 dark:bg-teal-600 dark:hover:bg-teal-500 text-white px-6 py-2.5 rounded-xl font-semibold transition shadow-sm disabled:opacity-60 flex items-center justify-center min-w-[140px]">
              {saving ? <Loader2 size={18} className="animate-spin" /> : "Save Settings"}
            </button>
            <p className="text-xs font-mono text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              Current: {selectedDoctorLabel}
            </p>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-[#0B1E33] dark:text-slate-100 mb-6">
            Preferences
          </h2>

          <div className="space-y-5">
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

            <ToggleSetting
              title="Dark Mode"
              description="Enable dark mode for reduced eye strain"
              enabled={darkMode}
              onToggle={handleDarkModeToggle}
            />
          </div>
        </section>

        {/* Security Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-[#0B1E33] dark:text-slate-100 mb-4">
            Security
          </h2>
          <button className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-medium transition">
            Change Password
          </button>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-3">
            Password updates will be available once authentication is fully enabled.
          </p>
        </section>

        {/* Logout Section */}
        <section className="bg-[#F7F9FC] dark:bg-slate-800/50 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
          <h2 className="font-bold text-[#0B1E33] dark:text-slate-100 mb-4">
            Session
          </h2>
          <button
            onClick={onLogOut}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-semibold transition shadow-sm">
            Log Out
          </button>
        </section>
      </div>
    </div>
  );
}

/* ---------- Sub-Components ---------- */

function SettingField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-1.5">{label}</p>
      <div className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/50 text-gray-800 dark:text-slate-300 border border-gray-200 dark:border-slate-700/60 shadow-inner shadow-gray-100/50 dark:shadow-none">
        {value}
      </div>
    </div>
  );
}

function EditableField({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-1.5">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:focus:ring-teal-400/30 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
      />
    </div>
  );
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-1.5">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:focus:ring-teal-400/30 transition-all cursor-pointer appearance-none">
        {options.map((opt) => (
          <option key={opt.value || "none"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleSetting({
  title, description, enabled, onToggle,
}: {
  title: string; description: string; enabled: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <p className="font-semibold text-gray-800 dark:text-slate-200">{title}</p>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{description}</p>
      </div>

      <button
        onClick={onToggle}
        className={`relative w-12 h-6 rounded-full transition-colors duration-300 ease-in-out shrink-0 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
          enabled ? "bg-teal-500 dark:bg-teal-500" : "bg-gray-200 dark:bg-slate-600"
        }`}>
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out ${
            enabled ? "translate-x-6" : "translate-x-0"
          }`} />
      </button>
    </div>
  );
}