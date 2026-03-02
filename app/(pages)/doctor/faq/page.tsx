'use client';

import { useState } from "react";

type FAQItem = {
  question: string;
  answer: string;
};

export default function DoctorFAQPage() {
  const faqs: FAQItem[] = [
    {
      question: "How do I monitor a patient’s rehabilitation progress?",
      answer:
        "Navigate to Patient Reports to view performance metrics, session completion rates, missed sessions, improvement trends, and engagement streaks. These metrics help guide clinical decisions.",
    },
    {
      question: "How are missed sessions tracked?",
      answer:
        "The system automatically records missed sessions when a patient does not complete a scheduled therapy session. These are visible in the patient’s detailed report for review.",
    },
    {
      question: "Can I modify a patient’s therapy plan?",
      answer:
        "Yes. You can adjust therapy frequency, difficulty levels, and exercise types based on patient performance trends and medical evaluation.",
    },
    {
      question: "How is patient data secured?",
      answer:
        "All patient medical data and performance metrics are securely stored with role-based access control. Only authorized clinicians and approved caregivers can access relevant data.",
    },
    {
      question: "What should I do if a patient’s performance declines?",
      answer:
        "Review their detailed report for missed sessions, reduced engagement, or declining metrics. Contact the caregiver if necessary and consider adjusting the therapy intensity or frequency.",
    },
    {
      question: "Can caregivers contact me directly?",
      answer:
        "Yes. Caregivers can communicate via the messaging system to discuss concerns or clarifications regarding the patient’s rehabilitation.",
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
          Doctor FAQ
        </h1>
        <p className="text-gray-500 mt-1">
          Common questions regarding patient management and system usage
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
          Need Technical Support?
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          For system issues, data discrepancies, or urgent clinical concerns, contact platform support.
        </p>
        <button className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-2 rounded-xl font-semibold transition">
          Contact Support
        </button>
      </section>

    </div>
  );
}