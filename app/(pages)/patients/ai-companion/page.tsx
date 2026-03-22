"use client";
// app/(pages)/patients/ai-companion/page.tsx

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/lib/firebase";
import {
  Bot,
  Crown,
  Check,
  Sparkles,
  Zap,
  TrendingUp,
  Calendar,
  Trophy,
  Heart,
  Send,
  ChevronRight,
  Activity,
  Loader2,
} from "lucide-react";
import { useAiCompanion } from "@/app/lib/ai/useAiCompanion";
import AIMessageRenderer from "@/components/ai/AIMessageRenderer";
import { useSubscription } from "@/app/lib/hooks/useSubscription";
import { useDarkMode } from "@/app/lib/hooks/useDarkMode";
import AnalyticsSidebar from "@/components/ai/AnalyticsSidebar"; // ← NEW

// ─────────────────────────────────────────────────────────────────────────────
// QUICK ACTIONS
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    label: "How did I do this week?",
    icon: TrendingUp,
    mode: "weekly_analysis" as const,
  },
  { label: "When's my next milestone?", icon: Trophy, mode: "chat" as const },
  {
    label: "Why does my grip drop near the end?",
    icon: Activity,
    mode: "chat" as const,
  },
  { label: "Am I on track for my goal?", icon: Zap, mode: "chat" as const },
  {
    label: "What does my doctor's note mean?",
    icon: Heart,
    mode: "chat" as const,
  },
  { label: "Tips for today's session", icon: Calendar, mode: "chat" as const },
];

// ─────────────────────────────────────────────────────────────────────────────
// PLAN METADATA
// ─────────────────────────────────────────────────────────────────────────────
const PLAN_META = {
  free: {
    label: "Text Companion",
    description:
      "Unlimited AI-powered chat with your rehab data analysed in real-time.",
    features: ["Session Analysis", "Progress Tracking", "Doctor Context"],
  },
  advanced_analytics: {
    label: "Advanced Analytics",
    description: "Advanced insights, weekly reports, and trend predictions.",
    features: ["Progress Insights", "Weekly Reports", "Trend Predictions"],
  },
  voice_companion: {
    label: "Voice Companion",
    description: "Full voice + analytics access with real-time guidance.",
    features: ["Voice Guidance", "Analytics", "Doctor Context"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function PatientAICompanion() {
  const isDark = useDarkMode();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showUpgradeToast, setShowUpgradeToast] = useState(false);

  // Show toast if redirected back from Stripe with ?upgraded=true
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      setShowUpgradeToast(true);
      // Clean the URL without reloading
      window.history.replaceState({}, "", "/patients/ai-companion");
      setTimeout(() => setShowUpgradeToast(false), 5000);
    }
  }, [searchParams]);

  // ── Auth ─────────────────────────────────────────────────────────────────
  const [user, authLoading] = useAuthState(auth);

  // ── AI hook ───────────────────────────────────────────────────────────────
  const { messages, sendMessage, isLoading } = useAiCompanion(
    user?.uid ?? "",
    "patient",
  );

  // ── Subscription ─────────────────────────────────────────────────────────
  const { subscription } = useSubscription(user?.uid);
  const currentPlan = subscription.plan;

  // ── Upgrade loading state per button ─────────────────────────────────────
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null); // ← NEW

  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/patient/signin");
    }
  }, [user, authLoading, router]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSend = async (
    text?: string,
    mode?: "chat" | "weekly_analysis",
  ) => {
    const content = text ?? inputValue;
    if (!content.trim() || isLoading || !user) return;
    if (!text) setInputValue("");
    await sendMessage(content, mode ?? "chat");
  };

  // ── Stripe upgrade handler ────────────────────────────────────────────────
  const handleUpgrade = async (
    plan: "advanced_analytics" | "voice_companion",
  ) => {
    // ← NEW
    if (!user) return;
    setUpgradingPlan(plan);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          plan,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // redirect to Stripe-hosted checkout
      } else {
        console.error("No checkout URL returned:", data);
        setUpgradingPlan(null);
      }
    } catch (err) {
      console.error("Upgrade failed:", err);
      setUpgradingPlan(null);
    }
  };

  // ── Auth loading spinner ──────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? "bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950/30" : "bg-gradient-to-br from-slate-50 via-white to-teal-50/30"}`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-[#2DD4BF] animate-spin" />
          <p className="text-sm text-gray-400">Loading companion…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // ── Derived plan meta ────────────────────────────────────────────────────
  const planMeta = PLAN_META[currentPlan ?? "free"];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className={`h-full p-4 sm:p-6 lg:p-8 ${isDark ? "bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950/30" : "bg-gradient-to-br from-slate-50 via-white to-teal-50/30"}`}>
      {/* ── Upgrade success toast ──────────────────────────────── */}
      {showUpgradeToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#0A2E4C] text-white px-5 py-3 rounded-2xl shadow-xl animate-fade-in">
          <span className="text-lg">🎉</span>
          <p className="text-sm font-semibold">
            Plan upgraded! Your new features are now active.
          </p>
          <button
            onClick={() => setShowUpgradeToast(false)}
            className="ml-2 text-teal-300 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="mb-6 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2DD4BF] to-[#0A2E4C] flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <h2
              className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-[#0A2E4C]"}`}>
              AI Companion
            </h2>
            <span
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isDark ? "bg-emerald-900/20 border border-emerald-700/60 text-emerald-300" : "bg-emerald-50 border border-emerald-200 text-emerald-700"}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
          <p
            className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
            Your personal rehabilitation support assistant · Powered by Gemini
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px] min-h-0 flex-1">
          {/* ── Chat panel ──────────────────────────────────────── */}
          <div
            className={`border shadow-sm rounded-2xl flex flex-col min-h-0 h-[70vh] sm:h-[72vh] overflow-hidden ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-gray-100"}`}>
            {/* Chat header bar */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-[#0A2E4C] to-[#0d3a5c] flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2DD4BF] to-teal-400 flex items-center justify-center flex-shrink-0 shadow-md">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm leading-none">
                  ReViveX Companion
                </p>
                <p className="text-teal-300 text-xs mt-0.5">
                  Analysing your sessions in real-time
                </p>
              </div>
              <Sparkles className="h-4 w-4 text-teal-300" />
            </div>

            {/* Messages area */}
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 p-5 space-y-4 overflow-y-auto overscroll-contain">
              {/* Empty state */}
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? "bg-gradient-to-br from-[#2DD4BF]/20 to-slate-800 border border-slate-700" : "bg-gradient-to-br from-[#2DD4BF]/20 to-teal-100"}`}>
                    <Bot className="h-8 w-8 text-[#2DD4BF]" />
                  </div>
                  <div className="text-center">
                    <p
                      className={`font-semibold text-base ${isDark ? "text-slate-100" : "text-[#0A2E4C]"}`}>
                      Hello! I'm your ReViveX companion.
                    </p>
                    <p
                      className={`text-sm mt-1 max-w-xs ${isDark ? "text-slate-400" : "text-gray-400"}`}>
                      Ask me about your progress, sessions, or tap a quick
                      action below.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center max-w-md">
                    {QUICK_ACTIONS.slice(0, 3).map((a) => (
                      <button
                        key={a.label}
                        onClick={() => handleSend(a.label, a.mode)}
                        disabled={isLoading}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition disabled:opacity-50 ${isDark ? "bg-slate-800 border border-slate-700 text-teal-300 hover:bg-slate-700" : "bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100"}`}>
                        <a.icon className="h-3 w-3" />
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message list */}
              {messages.map((message, i) => (
                <div
                  key={message.id ?? i}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {/* AI bubble */}
                  {message.role === "model" && (
                    <div className="flex items-start gap-2.5 max-w-[85%]">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2DD4BF] to-[#0A2E4C] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <Bot className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div
                        className={`rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm min-w-0 overflow-hidden ${isDark ? "bg-slate-800 border border-slate-700" : "bg-gray-50 border border-gray-100"}`}>
                        <AIMessageRenderer
                          content={message.content}
                          variant="patient"
                        />
                      </div>
                    </div>
                  )}

                  {/* User bubble */}
                  {message.role === "user" && (
                    <div className="bg-gradient-to-br from-[#2DD4BF] to-teal-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[82%] shadow-sm">
                      <p className="text-sm leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2DD4BF] to-[#0A2E4C] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div
                    className={`rounded-2xl rounded-tl-sm px-4 py-3.5 shadow-sm ${isDark ? "bg-slate-800 border border-slate-700" : "bg-gray-50 border border-gray-100"}`}>
                    <div className="flex gap-1.5 items-center">
                      <span
                        className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick action chips */}
            <div
              className={`shrink-0 px-4 pt-3 flex gap-2 flex-wrap border-t ${isDark ? "border-slate-700" : "border-gray-50"}`}>
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => handleSend(a.label, a.mode)}
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-40 whitespace-nowrap ${isDark ? "bg-slate-800 border border-slate-700 text-teal-300 hover:bg-slate-700 hover:border-slate-600" : "bg-teal-50 border border-teal-100 text-teal-700 hover:bg-teal-100 hover:border-teal-300"}`}>
                  <a.icon className="h-3 w-3 flex-shrink-0" />
                  {a.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="shrink-0 p-4">
              <div
                className={`flex gap-2 items-center rounded-xl px-3 py-2 focus-within:border-[#2DD4BF] focus-within:ring-2 focus-within:ring-[#2DD4BF]/20 transition ${isDark ? "bg-slate-800 border border-slate-700" : "bg-gray-50 border border-gray-200"}`}>
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="Ask about your progress, sessions, or recovery..."
                  disabled={isLoading}
                  className={`flex-1 bg-transparent text-sm outline-none ${isDark ? "text-slate-100 placeholder:text-slate-500" : "text-[#0A2E4C] placeholder:text-gray-400"}`}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isLoading}
                  className="w-8 h-8 rounded-lg bg-[#2DD4BF] hover:bg-teal-400 text-white flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <p
                className={`text-center text-xs mt-2 ${isDark ? "text-slate-500" : "text-gray-300"}`}>
                AI responses are supportive guidance, not medical advice.
              </p>
            </div>
          </div>

          {/* ── Sidebar ─────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* ── Current Plan (dynamic) ───────────────────────── */}
            <div
              className={`border shadow-sm rounded-2xl p-5 ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-gray-100"}`}>
              <h3
                className={`font-semibold text-sm mb-3 flex items-center gap-2 ${isDark ? "text-slate-100" : "text-[#0A2E4C]"}`}>
                <Activity className="h-4 w-4 text-[#2DD4BF]" />
                Current Plan
              </h3>
              <div
                className={`rounded-xl p-4 border ${isDark ? "bg-gradient-to-br from-teal-950/40 to-slate-800 border-teal-800/40" : "bg-gradient-to-br from-teal-50 to-teal-100/50 border-[#2DD4BF]/20"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#2DD4BF] animate-pulse" />
                  <p
                    className={`font-semibold text-sm ${isDark ? "text-slate-100" : "text-[#0A2E4C]"}`}>
                    {planMeta.label}
                  </p>
                </div>
                <p
                  className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                  {planMeta.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {planMeta.features.map((f) => (
                    <span
                      key={f}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? "bg-slate-800 border border-teal-700/40 text-teal-300" : "bg-white border border-teal-200 text-teal-700"}`}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              {currentPlan !== "free" && (
                <button
                  onClick={async () => {
                    const res = await fetch("/api/stripe/create-portal", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ uid: user.uid }),
                    });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }}
                  className="mt-3 w-full text-xs text-gray-400 hover:text-red-400 transition underline underline-offset-2">
                  Manage or cancel subscription
                </button>
              )}
            </div>

            {/* ── Premium Plans OR Analytics (based on plan) ── */}
            {currentPlan === "advanced_analytics" ||
            currentPlan === "voice_companion" ? (
              // ── PRO: Show analytics widgets ──────────────────
              <AnalyticsSidebar uid={user.uid} />
            ) : (
              // ── FREE: Show upgrade cards ──────────────────────
              <div
                className={`border shadow-sm rounded-2xl p-5 ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-gray-100"}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <h3
                    className={`font-semibold text-sm ${isDark ? "text-slate-100" : "text-[#0A2E4C]"}`}>
                    Premium Plans
                  </h3>
                </div>

                {/* Voice Companion */}
                <div
                  className={`rounded-xl p-4 mb-3 border ${isDark ? "border-amber-700/40 bg-amber-950/20" : "border-amber-200 bg-amber-50/50"}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p
                        className={`font-semibold text-sm ${isDark ? "text-slate-100" : "text-[#0A2E4C]"}`}>
                        Voice Companion
                      </p>
                      <p className="text-2xl font-bold text-amber-600 mt-0.5">
                        $29
                        <span
                          className={`text-xs font-normal ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                          /mo
                        </span>
                      </p>
                    </div>
                    <Crown className="h-5 w-5 text-amber-400" />
                  </div>
                  <ul
                    className={`space-y-1.5 text-xs mb-3 ${isDark ? "text-slate-300" : "text-gray-600"}`}>
                    {[
                      "Real-time voice guidance",
                      "Hands-free interaction",
                      "Personalised encouragement",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-amber-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleUpgrade("voice_companion")}
                    disabled={upgradingPlan === "voice_companion"}
                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1">
                    {upgradingPlan === "voice_companion" ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />{" "}
                        Redirecting…
                      </>
                    ) : (
                      <>
                        Upgrade Now <ChevronRight className="h-3 w-3" />
                      </>
                    )}
                  </button>
                </div>

                {/* Advanced Analytics */}
                <div
                  className={`rounded-xl p-4 border ${isDark ? "border-teal-700/40 bg-teal-950/20" : "border-[#2DD4BF]/30 bg-teal-50/40"}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p
                        className={`font-semibold text-sm ${isDark ? "text-slate-100" : "text-[#0A2E4C]"}`}>
                        Advanced Analytics
                      </p>
                      <p
                        className={`text-2xl font-bold mt-0.5 ${isDark ? "text-slate-100" : "text-[#0A2E4C]"}`}>
                        $19
                        <span
                          className={`text-xs font-normal ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                          /mo
                        </span>
                      </p>
                    </div>
                    <Sparkles className="h-5 w-5 text-[#2DD4BF]" />
                  </div>
                  <ul
                    className={`space-y-1.5 text-xs mb-3 ${isDark ? "text-slate-300" : "text-gray-600"}`}>
                    {[
                      "Detailed progress insights",
                      "Weekly AI reports",
                      "Recovery trend predictions",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-[#2DD4BF] flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleUpgrade("advanced_analytics")}
                    disabled={upgradingPlan === "advanced_analytics"}
                    className="w-full border border-[#2DD4BF] text-[#2DD4BF] py-2 rounded-lg text-xs font-semibold hover:bg-[#2DD4BF]/10 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-1">
                    {upgradingPlan === "advanced_analytics" ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />{" "}
                        Redirecting…
                      </>
                    ) : (
                      "Upgrade"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div
              className={`rounded-xl p-4 border ${isDark ? "bg-blue-950/20 border-blue-900/40" : "bg-blue-50 border-blue-100"}`}>
              <p
                className={`text-xs leading-relaxed ${isDark ? "text-blue-200" : "text-blue-700"}`}>
                <span className="font-semibold">About your AI companion:</span>{" "}
                Responses are personalised using your real session data and
                doctor instructions. Always follow your neurologist's prescribed
                protocol.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
