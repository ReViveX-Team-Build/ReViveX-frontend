'use client';

import { useState, useRef, useEffect } from "react";

export default function MyProgressPage() {
  const [selectedRange, setSelectedRange] = useState("Last 7 Days");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = ["Last 7 Days", "Last 30 Days", "Last 3 Months"];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="p-8 max-w-5xl">

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#0B1E33]">
          My Progress
        </h1>
        <p className="text-gray-500 mt-1">
          Track your rehabilitation performance and improvements
        </p>
      </header>

      <div className="space-y-8">

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-[#0B1E33] mb-4">
            Time Range
          </h2>

          <div className="relative w-64" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className="w-full flex justify-between items-center px-4 py-3 rounded-xl border-2 border-teal-500 bg-white text-[#0B1E33] font-medium shadow-sm hover:shadow-md transition"
            >
              {selectedRange}
              <span className={`transition-transform ${open ? "rotate-180" : ""}`}>
                ▼
              </span>
            </button>

            {open && (
              <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                {options.map((option) => (
                  <div
                    key={option}
                    onClick={() => {
                      setSelectedRange(option);
                      setOpen(false);
                    }}
                    className={`px-4 py-3 cursor-pointer transition ${
                      selectedRange === option
                        ? "bg-teal-50 text-teal-600 font-medium"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Showing data for {selectedRange}
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-[#0B1E33] mb-4">
            Performance Summary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Grip Strength" value="32 kg" change="+5%" />
            <StatCard label="Reaction Time" value="420 ms" change="-8%" />
            <StatCard label="Cognitive Accuracy" value="87%" change="+4%" />
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-[#0B1E33] mb-4">
            Session History
          </h2>

          <div className="space-y-4">
            <SessionItem
              date="2026-02-25"
              type="Grip Strength Training"
              score="Completed"
            />
            <SessionItem
              date="2026-02-23"
              type="Cognitive Memory Exercise"
              score="Completed"
            />
            <SessionItem
              date="2026-02-20"
              type="Grip Strength Training"
              score="Missed"
            />
          </div>
        </section>

        <section className="bg-[#F7F9FC] rounded-2xl p-6 border border-gray-200">
          <h2 className="font-bold text-[#0B1E33] mb-4">
            Motivation
          </h2>

          <p className="text-sm text-gray-600 mb-4">
            You have completed 5 consecutive sessions. Keep going to maintain your streak.
          </p>

          <button className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-2 rounded-xl font-semibold transition">
            Start Today's Session
          </button>
        </section>

      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: string;
}) {
  const positive = change.startsWith("+");

  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <p className="text-sm text-gray-500 mb-1">
        {label}
      </p>
      <p className="text-xl font-semibold text-gray-800">
        {value}
      </p>
      <p className={`text-sm mt-1 ${positive ? "text-green-600" : "text-red-600"}`}>
        {change} from previous period
      </p>
    </div>
  );
}

function SessionItem({
  date,
  type,
  score,
}: {
  date: string;
  type: string;
  score: string;
}) {
  const completed = score === "Completed";

  return (
    <div className="flex justify-between items-center border border-gray-200 rounded-xl p-4">
      <div>
        <p className="font-semibold text-gray-800">
          {type}
        </p>
        <p className="text-sm text-gray-500">
          {date}
        </p>
      </div>

      <span
        className={`px-3 py-1 text-xs rounded-full ${
          completed
            ? "bg-green-100 text-green-600"
            : "bg-red-100 text-red-600"
        }`}
      >
        {score}
      </span>
    </div>
  );
}