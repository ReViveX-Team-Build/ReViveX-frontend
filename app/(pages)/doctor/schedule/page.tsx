'use client';

import { useState } from "react";

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState("2026-03-01");

  return (
    <div className="p-8 max-w-5xl">

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#0B1E33]">
          Scheduling
        </h1>
        <p className="text-gray-500 mt-1">
          Manage patient sessions and reminders
        </p>
      </header>

      <div className="space-y-8">

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-[#0B1E33] mb-4">
            Select Date
          </h2>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />

          <p className="text-xs text-gray-500 mt-3">
            Viewing sessions for {selectedDate}
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-[#0B1E33] mb-4">
            Scheduled Sessions
          </h2>

          <div className="space-y-4">
            <SessionCard
              patient="Nimal Perera"
              time="09:00 AM"
              type="Grip Strength Training"
              status="Confirmed"
            />

            <SessionCard
              patient="Saman Silva"
              time="11:30 AM"
              type="Cognitive Memory Exercise"
              status="Pending"
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-[#0B1E33] mb-4">
            Schedule New Session
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Patient Name" placeholder="Enter patient name" />
            <FormField label="Session Type" placeholder="Grip / Memory / Custom" />
            <FormField label="Time" placeholder="HH:MM" />
            <FormField label="Duration (mins)" placeholder="30" />
          </div>

          <button className="mt-6 bg-teal-600 hover:bg-teal-500 text-white px-6 py-2 rounded-xl font-semibold transition">
            Create Session
          </button>
        </section>

        <section className="bg-[#F7F9FC] rounded-2xl p-6 border border-gray-200">
          <h2 className="font-bold text-[#0B1E33] mb-4">
            Automated Reminders
          </h2>

          <p className="text-sm text-gray-600 mb-4">
            Patients will receive notifications before scheduled sessions.
          </p>

          <button className="px-5 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 transition">
            Configure Reminder Timing
          </button>
        </section>

      </div>
    </div>
  );
}

function SessionCard({
  patient,
  time,
  type,
  status,
}: {
  patient: string;
  time: string;
  type: string;
  status: string;
}) {
  return (
    <div className="flex justify-between items-center border border-gray-200 rounded-xl p-4">
      <div>
        <p className="font-semibold text-gray-800">
          {patient}
        </p>
        <p className="text-sm text-gray-500">
          {type}
        </p>
        <p className="text-sm text-gray-500">
          {time}
        </p>
      </div>

      <span
        className={`px-3 py-1 text-xs rounded-full ${
          status === "Confirmed"
            ? "bg-green-100 text-green-600"
            : "bg-yellow-100 text-yellow-600"
        }`}
      >
        {status}
      </span>
    </div>
  );
}

function FormField({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">
        {label}
      </p>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full px-4 py-2 rounded-xl bg-gray-50 text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
    </div>
  );
}