"use client";
// app/(pages)/patients/ai-companion/page.tsx

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/lib/firebase";
import { useSubscription } from "@/app/lib/hooks/useSubscription";
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

const QUICK_ACTIONS = [
  { label: "How did I do this week?", icon: TrendingUp, mode: "weekly_analysis" as const },
  { label: "When's my next milestone?", icon: Trophy, mode: "chat" as const },
  { label: "Why does my grip drop near the end?", icon: Activity, mode: "chat" as const },
  { label: "Am I on track for my goal?", icon: Zap, mode: "chat" as const },
  { label: "What does my doctor's note mean?", icon: Heart, mode: "chat" as const },
  { label: "Tips for today's session", icon: Calendar, mode: "chat" as const },
];

export default function PatientAICompanion() {
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);
  const { plan } = useSubscription(user?.uid);

  const { messages, sendMessage, isLoading } = useAiCompanion(
      user?.uid ?? "",
      "patient"
  );

  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/patient/signin");
    }
  }, [user, authLoading, router]);

  const handleSend = async (
      text?: string,
      mode?: "chat" | "weekly_analysis"
  ) => {
    const content = text ?? inputValue;
    if (!content.trim() || isLoading || !user) return;
    if (!text) setInputValue("");
    await sendMessage(content, mode ?? "chat");
  };

  // 🔥 STRIPE HANDLER (ADDED)
  const handleUpgrade = async (
      plan: "advanced_analytics" | "voice_companion"
  ) => {
    if (!user) return;

    try {
      console.log("Upgrade clicked:", plan);

      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          plan,
        }),
      });

      const data = await res.json();
      console.log("Stripe response:", data);

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned:", data);
      }
    } catch (error) {
      console.error("Upgrade error:", error);
    }
  };

  if (authLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
          <Loader2 className="h-8 w-8 text-[#2DD4BF] animate-spin" />
        </div>
    );
  }

  if (!user) return null;

  return (
      <div className="h-full p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        <div className="max-w-7xl mx-auto h-full flex flex-col">

          {/* CHAT AREA (UNCHANGED) */}
          <div className="grid gap-5 lg:grid-cols-[1fr_320px] flex-1">

            <div className="bg-white rounded-2xl p-5 flex flex-col">
              <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3">
                {messages.map((m, i) => (
                    <div key={i}>
                      <AIMessageRenderer content={m.content} />
                    </div>
                ))}
              </div>

              <div className="flex gap-2 mt-3">
                <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-1 border rounded px-3 py-2"
                />
                <button
                    onClick={() => handleSend()}
                    className="bg-teal-500 text-white px-4 rounded"
                >
                  Send
                </button>
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="space-y-4">

              {/* VOICE PLAN */}
              <div className="border p-4 rounded-xl">
                <p className="font-semibold">Voice Companion</p>
                <p>$29/mo</p>

                <button
                    onClick={() => handleUpgrade("voice_companion")}
                    disabled={plan === "voice_companion"}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  {plan === "voice_companion" ? "Current Plan ✓" : <>Upgrade Now <ChevronRight className="h-3 w-3" /></>}
                </button>
              </div>

              {/* ANALYTICS PLAN */}
              <div className="border p-4 rounded-xl">
                <p className="font-semibold">Advanced Analytics</p>
                <p>$19/mo</p>

                <button
                    onClick={() => handleUpgrade("advanced_analytics")}
                    disabled={plan === "advanced_analytics" || plan === "voice_companion"}
                    className="w-full border border-[#2DD4BF] text-[#2DD4BF] py-2 rounded-lg text-xs font-semibold hover:bg-[#2DD4BF]/10 transition disabled:opacity-50"
                >
                  {plan === "advanced_analytics"
                      ? "Current Plan ✓"
                      : plan === "voice_companion"
                          ? "Included in Voice ✓"
                          : "Upgrade"}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
  );
}