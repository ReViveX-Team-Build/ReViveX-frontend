"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Stethoscope, Users, AlertTriangle, TrendingUp, Activity, Send, Sparkles, BarChart3, Shield } from "lucide-react";
import { useAiCompanion } from "../../../lib/ai/useAiCompanion";
import AIMessageRenderer from "@/components/ai/AIMessageRenderer";

const QUICK_ACTIONS = [
    { label: "Weekly cohort summary",      icon: BarChart3,      mode: "weekly_summary" as const, color: "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100" },
    { label: "Who needs attention?",        icon: AlertTriangle,  mode: "triage" as const,         color: "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100" },
    { label: "Grip strength trends",        icon: TrendingUp,     mode: "chat" as const,           color: "text-teal-600 bg-teal-50 border-teal-200 hover:bg-teal-100" },
    { label: "Protocol optimisation tips",  icon: Stethoscope,    mode: "chat" as const,           color: "text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100" },
    { label: "Adherence breakdown",         icon: Activity,       mode: "chat" as const,           color: "text-teal-600 bg-teal-50 border-teal-200 hover:bg-teal-100" },
    { label: "Device health check",         icon: Shield,         mode: "chat" as const,           color: "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100" },
];


const COHORT = {
    total: 12, avgAdherence: 74, devicesOffline: 1, missedThisWeek: 3,
};

export default function DoctorAICompanion() {
    const { messages, sendMessage, isLoading } = useAiCompanion("doctor_mock_001", "doctor");
    const [inputValue, setInputValue] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isLoading]);

    const handleSend = async (text?: string, mode?: typeof QUICK_ACTIONS[0]["mode"]) => {
        const content = text ?? inputValue;
        if (!content.trim() || isLoading) return;
        if (!text) setInputValue("");
        await sendMessage(content, mode ?? "chat");
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/60">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0A2E4C] to-[#2DD4BF] flex items-center justify-center">
                            <Stethoscope className="h-4 w-4 text-white" />
                        </div>
                        <h2 className="text-[#0A2E4C] text-2xl font-bold tracking-tight">Clinical AI</h2>
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0A2E4C] text-[#2DD4BF] text-xs font-bold border border-[#2DD4BF]/30">
                            Doctor Mode
                        </span>
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Online
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm">Clinical decision support · Real-time cohort analysis · Powered by Gemini</p>
                </div>

                <div className="grid gap-5 lg:grid-cols-[1fr_300px]">

                    {/* Chat Panel */}
                    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl flex flex-col h-[calc(100vh-220px)] overflow-hidden">

                        {/* Chat header bar */}
                        <div className="px-5 py-3.5 bg-gradient-to-r from-[#0A2E4C] to-[#0d3a5c] flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2DD4BF] to-teal-400 flex items-center justify-center flex-shrink-0 shadow-md">
                                <Bot className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-semibold text-sm leading-none">ReViveX Clinical AI</p>
                                <p className="text-teal-300 text-xs mt-0.5">Analysing {COHORT.total} patients · {COHORT.avgAdherence}% avg adherence</p>
                            </div>
                            <Sparkles className="h-4 w-4 text-teal-300" />
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 p-5 space-y-4 overflow-y-auto">

                            {messages.length === 0 && !isLoading && (
                                <div className="flex flex-col items-center justify-center h-full gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0A2E4C]/10 to-[#2DD4BF]/20 flex items-center justify-center">
                                        <Stethoscope className="h-8 w-8 text-[#0A2E4C]" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[#0A2E4C] font-semibold text-base">Clinical AI ready.</p>
                                        <p className="text-gray-400 text-sm mt-1 max-w-xs">Ask about your cohort, patient adherence, or protocol recommendations.</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                                        {QUICK_ACTIONS.slice(0, 3).map((a) => (
                                            <button key={a.label} onClick={() => handleSend(a.label, a.mode)} disabled={isLoading}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition disabled:opacity-50 ${a.color}`}>
                                                <a.icon className="h-3 w-3" />{a.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((message, i) => (
                                <div key={message.id ?? i} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>

                                    {message.role === "model" && (
                                        <div className="flex items-start gap-2.5 max-w-[88%]">
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2DD4BF] to-[#0A2E4C] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                                <Bot className="h-3.5 w-3.5 text-white" />
                                            </div>
                                            <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm min-w-0 overflow-hidden">
                                              
                                                <AIMessageRenderer content={message.content} variant="doctor" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Doctor message bubble */}
                                    {message.role === "user" && (
                                        <div className="bg-gradient-to-br from-[#0A2E4C] to-[#0d3a5c] text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[82%] shadow-sm">
                                            <p className="text-sm leading-relaxed">{message.content}</p>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex items-start gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2DD4BF] to-[#0A2E4C] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                        <Bot className="h-3.5 w-3.5 text-white" />
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3.5 shadow-sm">
                                        <div className="flex gap-1.5 items-center">
                                            <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick actions */}
                        <div className="px-4 pt-3 flex gap-2 flex-wrap border-t border-gray-50">
                            {QUICK_ACTIONS.map((a) => (
                                <button key={a.label} onClick={() => handleSend(a.label, a.mode)} disabled={isLoading}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition disabled:opacity-40 whitespace-nowrap ${a.color}`}>
                                    <a.icon className="h-3 w-3 flex-shrink-0" />{a.label}
                                </button>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="p-4">
                            <div className="flex gap-2 items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-[#2DD4BF] focus-within:ring-2 focus-within:ring-[#2DD4BF]/20 transition">
                                <input value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                                    placeholder="Ask about patients, adherence, protocols, or trends..."
                                    disabled={isLoading}
                                    className="flex-1 bg-transparent text-sm text-[#0A2E4C] placeholder:text-gray-400 outline-none" />
                                <button onClick={() => handleSend()} disabled={!inputValue.trim() || isLoading}
                                    className="w-8 h-8 rounded-lg bg-[#0A2E4C] hover:bg-[#0d3a5c] text-white flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
                                    <Send className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <p className="text-center text-gray-300 text-xs mt-2">Clinical support tool · Not a substitute for professional medical judgment.</p>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">

                        {/* Cohort snapshot */}
                        <div className="bg-[#0A2E4C] rounded-2xl p-5 text-white">
                            <div className="flex items-center gap-2 mb-4">
                                <Users className="h-4 w-4 text-[#2DD4BF]" />
                                <h3 className="font-semibold text-sm">Cohort Snapshot</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: "Patients",       value: COHORT.total,          color: "text-white" },
                                    { label: "Avg Adherence",  value: `${COHORT.avgAdherence}%`, color: "text-[#2DD4BF]" },
                                    { label: "Missed / Week",  value: COHORT.missedThisWeek, color: "text-amber-400" },
                                    { label: "Offline Devices",value: COHORT.devicesOffline, color: "text-red-400" },
                                ].map((stat) => (
                                    <div key={stat.label} className="bg-white/5 rounded-xl p-3 border border-white/10">
                                        <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                                        <p className="text-gray-400 text-xs mt-0.5">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* What I can do */}
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
                            <h3 className="text-[#0A2E4C] font-semibold text-sm mb-3 flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-[#2DD4BF]" />What I can do
                            </h3>
                            <ul className="space-y-2.5 text-xs text-gray-600">
                                {[
                                    "Summarise this week's cohort performance",
                                    "Identify patients at risk of dropout",
                                    "Suggest protocol adjustments based on trends",
                                    "Explain grip force or endurance patterns",
                                    "Flag devices that have been offline too long",
                                    "Help draft patient feedback messages",
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] mt-1.5 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Compliance note */}
                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                            <div className="flex items-start gap-2">
                                <Shield className="h-4 w-4 text-[#2DD4BF] flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Clinical AI outputs are decision support only. All patient data is processed in compliance with applicable healthcare data regulations. Final clinical decisions remain with the treating physician.
                                </p>
                            </div>
                        </div>
                    </div>
                  </div>
                )}

                {message.role === "user" && (
                  <div className="bg-teal-600 text-white rounded-xl p-4 text-sm">
                    {message.content}
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>

      {/* Premium AI Info */}
      <div className="mt-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
        <p className="text-sm text-gray-700 dark:text-slate-300">
          <span className="font-semibold text-purple-800 dark:text-purple-400">
            Premium AI Features:
          </span>{" "}
          This clinical AI assistant is designed to analyze patient adherence,
          rehabilitation progress, and therapy risks using secure Firebase Cloud
          Functions and advanced machine learning models. All data access is
          role-based and compliant with healthcare data privacy standards.
        </p>
      </div>
    </div>
  );
}
