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
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("none");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [initialDoctorId, setInitialDoctorId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);

  const selectedDoctorLabel = useMemo(() => {
    if (!selectedDoctorId) return "Not assigned";
    const doc = doctors.find((d) => d.uid === selectedDoctorId);
    if (!doc) return "Unknown doctor";
    return `${doc.name} (${doc.doctorId})`;
  }, [doctors, selectedDoctorId]);

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
        setConnectionStatus(
          (patient.connectionStatus as ConnectionStatus) ?? "none",
        );
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
      <div className="p-8 max-w-5xl">
        <p className="text-gray-500">Loading settings...</p>
      </div>
    );
  }

  if (!user?.uid) {
    return (
      <div className="p-8 max-w-5xl">
        <p className="text-gray-500">Please sign in to manage your settings.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#0B1E33]">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your account, doctor selection, and preferences
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="space-y-8">
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-[#0B1E33] mb-4">Profile Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EditableField
              label="Full Name"
              value={fullName}
              onChange={setFullName}
              placeholder="Enter your full name"
            />

            <SettingField label="Email Address" value={email} />
            <SettingField label="Patient ID" value={patientId || user.uid} />

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
              value={
                connectionStatus === "none" ? "Not Connected" : connectionStatus
              }
            />
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Selecting a different doctor marks your connection as pending until
            approval.
          </p>

          <div className="mt-5">
            <button
              onClick={onSave}
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-500 text-white px-5 py-2 rounded-xl font-semibold transition disabled:opacity-60">
              {saving ? "Saving..." : "Save Settings"}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Current doctor: {selectedDoctorLabel}
            </p>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-[#0B1E33] mb-4">Preferences</h2>

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
          <h2 className="font-bold text-[#0B1E33] mb-4">Security</h2>

          <button className="px-5 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 transition">
            Change Password
          </button>

          <p className="text-xs text-gray-500 mt-3">
            Password updates will be available once authentication is fully
            enabled.
          </p>
        </section>

        <section className="bg-[#F7F9FC] rounded-2xl p-6 border border-gray-200">
          <h2 className="font-bold text-[#0B1E33] mb-3">Session</h2>

          <button
            onClick={onLogOut}
            className="bg-red-500 hover:bg-red-400 text-white px-6 py-2 rounded-xl font-semibold transition">
            Log Out
          </button>
        </section>
      </div>
    </div>
  );
}

function SettingField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
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
        <p className="font-medium text-gray-800">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      <button
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition ${
          enabled ? "bg-teal-500" : "bg-gray-300"
        }`}>
        <span
          className={`block w-5 h-5 bg-white rounded-full transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}></span>
      </button>
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 rounded-xl bg-white text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-200"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 rounded-xl bg-white text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-200">
        {options.map((opt) => (
          <option key={opt.value || "none"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
