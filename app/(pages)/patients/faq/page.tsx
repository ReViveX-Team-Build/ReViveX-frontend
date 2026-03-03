'use client';

import { useState } from "react";

type FAQItem = {
  question: string;
  answer: string;
};

export default function PatientFAQPage() {
  const faqs: FAQItem[] = [
    {
      question: "What is ReViveX and how does it help?",
      answer:
        "ReViveX is a rehabilitation support platform designed to help improve grip strength, coordination, and cognitive function. It combines guided therapy sessions with progress tracking so you and your caregiver can monitor recovery clearly.",
    },
    {
      question: "How often should I complete my therapy sessions?",
      answer:
        "Follow the schedule assigned by your doctor. Most patients are recommended to complete sessions daily or several times per week. Consistency improves recovery outcomes and helps maintain your session streak.",
    },
    {
      question: "What happens if I miss a session?",
      answer:
        "If you miss a session, it will be marked as missed in your history. Try to resume your next scheduled session. If you frequently miss sessions, inform your doctor so your plan can be adjusted.",
    },
    {
      question: "Can my caregiver track my progress?",
      answer:
        "Yes. Your caregiver can view your progress summary, session history, and performance metrics. This allows them to support your therapy routine effectively.",
    },
    {
      question: "Is my medical and therapy data secure?",
      answer:
        "Yes. Your personal and medical data is securely stored and protected. Only authorized healthcare professionals and approved caregivers can access your information.",
    },
    {
      question: "What should I do if I feel pain during a session?",
      answer:
        "Stop the session immediately if you experience unusual pain or discomfort. Inform your doctor before continuing therapy to ensure your exercises remain safe and appropriate.",
    },
    {
      question: "How do reminders work?",
      answer:
        "You will receive reminders before scheduled sessions. Make sure notifications are enabled in your settings so you do not miss important therapy appointments.",
    },
    {
      question: "Can my therapy plan change over time?",
      answer:
        "Yes. Your doctor may adjust your therapy plan based on your performance data, improvement rate, and medical needs. The system supports adaptive therapy recommendations.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="p-8 max-w-5xl">

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#0B1E33]">
          Frequently Asked Questions
        </h1>
        <p className="text-gray-500 mt-1">
          Helpful information for patients and caregivers
        </p>
      </header>

      <div className="space-y-4">

        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <button
              onClick={() => toggle(index)}
              className="w-full text-left px-6 py-4 flex justify-between items-center"
            >
              <span className="font-medium text-[#0B1E33]">
                {faq.question}
              </span>
              <span className={`transition-transform ${openIndex === index ? "rotate-180" : ""}`}>
                ▼
              </span>
            </button>

            {openIndex === index && (
              <div className="px-6 pb-6 text-sm text-gray-600 leading-relaxed">
                {faq.answer}
              </div>
            )}
          </div>
        ))}

      </div>

      <section className="mt-10 bg-[#F7F9FC] rounded-2xl p-6 border border-gray-200">
        <h2 className="font-bold text-[#0B1E33] mb-2">
          Still need help?
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          If your question is not listed here, contact your assigned doctor or use the Messages page for direct support.
        </p>
        <button className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-2 rounded-xl font-semibold transition">
          Go to Messages
        </button>
      </section>

    </div>
  );
}