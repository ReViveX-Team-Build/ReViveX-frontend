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



    const handleSendMessage = async () => {
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

        try {
            const res = await fetch("/api/ai-companion", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: userMessage.text }),
            });

            const data = await res.json();

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                sender: "ai",
                text: data.reply || "No response from AI",
                timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error("Frontend error:", error);
        }
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