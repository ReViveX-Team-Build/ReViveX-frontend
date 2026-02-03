"use client";

import { useState, useRef, useEffect } from "react";
import { Bot } from "lucide-react";
import { Crown, Check } from "lucide-react";

export default function PatientAICompanion() {
    type Message = {
        id: string;
        sender: "user" | "ai";
        text: string;
        timestamp: string;
    };

    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            sender: "ai",
            text:
                "Hello John! 👋 I’m your AI companion here to support you through your rehabilitation journey. How are you feeling today?",
            timestamp: "10:00 AM",
        },
    ]);

    const [inputValue, setInputValue] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const getAIResponse = (input: string): string => {
        const lower = input.toLowerCase();

        if (lower.includes("pain") || lower.includes("hurt")) {
            return "I’m sorry you’re feeling pain 💙. If it continues, it’s important to inform your therapist. Would you like me to remind you to report this?";
        }

        if (lower.includes("tired") || lower.includes("exhausted")) {
            return "Feeling tired after therapy is normal. Make sure you rest well and stay hydrated. You’re still doing great 👍";
        }

        if (lower.includes("progress") || lower.includes("improving")) {
            return "Great news! 🎉 Your recent sessions show steady improvement. Consistency like this really helps recovery.";
        }

        if (lower.includes("worried") || lower.includes("scared")) {
            return "It’s completely okay to feel worried sometimes. You’re not alone in this — your care team and I are here for you 🤍";
        }

        return "Thanks for sharing 💬. Keep staying consistent with your exercises — every small step matters in recovery!";
    };

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            sender: "user",
            text: inputValue,
            timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");

        // Simulated AI reply
        setTimeout(() => {
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                sender: "ai",
                text: getAIResponse(userMessage.text),
                timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };

            setMessages((prev) => [...prev, aiMessage]);
        }, 1000);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">

                {/* Page Header */}
                <div className="mb-8">
                    <h2 className="text-[#0A2E4C] mb-2">
                        AI Companion
                    </h2>
                    <p className="text-gray-600">
                        Your personal rehabilitation support assistant
                    </p>
                </div>

                {/* Main Layout */}
                <div className="grid gap-6 lg:grid-cols-3">

                    {/* Chat Area Placeholder */}
                    <div className="bg-white shadow-lg rounded-xl h-[calc(100vh-250px)] flex flex-col">

                        {/* Chat Messages */}
                        <div
                            ref={scrollRef}
                            className="flex-1 p-4 space-y-4 overflow-y-auto"
                        >
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${
                                        message.sender === "user" ? "justify-end" : "justify-start"
                                    }`}
                                >
                                    {message.sender === "ai" && (
                                        <div className="flex items-start gap-3 max-w-[80%]">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2DD4BF] to-[#0A2E4C] flex items-center justify-center">
                                                <Bot className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="bg-[#F8F9FA] text-[#0A2E4C] rounded-lg p-3">
                                                <p className="text-sm">{message.text}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {message.timestamp}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {message.sender === "user" && (
                                        <div className="bg-[#2DD4BF] text-white rounded-lg p-3 max-w-[80%]">
                                            <p className="text-sm">{message.text}</p>
                                            <p className="text-xs text-white/70 mt-1 text-right">
                                                {message.timestamp}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Input Placeholder */}
                        <div className="border-t p-4">
                            <div className="flex gap-2">
                                <input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                    placeholder="Type your message..."
                                    className="flex-1 px-4 py-3 border rounded-lg text-sm"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="bg-[#2DD4BF] hover:bg-[#2DD4BF]/90 text-white px-4 rounded-lg"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Plans / Info Placeholder */}
                    <div className="space-y-6">

                        {/* Current Plan */}
                        <div className="bg-white shadow-lg rounded-xl p-6">
                            <h3 className="text-[#0A2E4C] mb-3">
                                Current Plan
                            </h3>

                            <div className="bg-[#2DD4BF]/10 border border-[#2DD4BF]/20 rounded-lg p-4">
                                <p className="text-[#0A2E4C]">
                                    Text Chat
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Free plan with unlimited text-based AI support
                                </p>
                            </div>
                        </div>

                        {/* Premium Plans */}
                        <div className="bg-white shadow-lg rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Crown className="h-5 w-5 text-amber-500" />
                                <h3 className="text-[#0A2E4C]">
                                    Premium Plans
                                </h3>
                            </div>

                            {/* Voice Companion */}
                            <div className="border-2 border-amber-300 rounded-lg p-4 mb-4">
                                <p className="text-[#0A2E4C] mb-1">
                                    Voice Companion
                                </p>
                                <p className="text-2xl text-[#0A2E4C] mb-3">
                                    $29<span className="text-sm text-gray-600">/month</span>
                                </p>

                                <ul className="space-y-2 text-sm mb-4">
                                    <li className="flex items-start gap-2">
                                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                                        <span>Real-time voice guidance</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                                        <span>Hands-free interaction</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                                        <span>Personalized encouragement</span>
                                    </li>
                                </ul>

                                <button className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg">
                                    Upgrade Now
                                </button>
                            </div>

                            {/* Advanced Analytics */}
                            <div className="border-2 border-[#2DD4BF] rounded-lg p-4">
                                <p className="text-[#0A2E4C] mb-1">
                                    Advanced Analytics
                                </p>
                                <p className="text-2xl text-[#0A2E4C] mb-3">
                                    $19<span className="text-sm text-gray-600">/month</span>
                                </p>

                                <ul className="space-y-2 text-sm mb-4">
                                    <li className="flex items-start gap-2">
                                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                                        <span>Detailed progress insights</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                                        <span>Weekly AI reports</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                                        <span>Recovery trend predictions</span>
                                    </li>
                                </ul>

                                <button className="w-full border border-[#2DD4BF] text-[#2DD4BF] py-2 rounded-lg hover:bg-[#2DD4BF]/10">
                                    Upgrade
                                </button>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}