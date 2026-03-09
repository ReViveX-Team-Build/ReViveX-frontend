"use client";

import { useState, useRef, useEffect } from "react";
import { Bot } from "lucide-react";
import { useAiCompanion } from "../../../lib/ai/useAiCompanion";

export default function DoctorAICompanion() {

    const { messages, sendMessage, isLoading } =
        useAiCompanion("doctor_mock_001", "doctor");

    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const content = input;
        setInput("");

        await sendMessage(content);
    };

    return (
        <div className="p-8 min-h-screen bg-gray-50">

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                        <Bot className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            AI Clinical Assistant
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full" />
                            <p className="text-sm text-gray-600">
                                Premium Feature • Online
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Container */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[65vh] flex flex-col">

                {/* Messages */}
                <div
                    ref={scrollRef}
                    className="flex-1 p-6 space-y-6 overflow-y-auto"
                >
                    {messages.length === 0 && (
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="bg-gray-100 rounded-xl p-4 text-sm text-gray-800">
                                Hello Doctor 👋 I’m your AI Clinical Assistant. I can help you analyze patient progress, adherence, and therapy risks.
                            </div>
                        </div>
                    )}

                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${
                                message.role === "user"
                                    ? "justify-end"
                                    : "justify-start"
                            }`}
                        >
                            <div className="max-w-2xl">

                                {message.role === "model" && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                                            <Bot className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="bg-gray-100 rounded-xl p-4 text-sm text-gray-800">
                                            {message.content}
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
                    ))}

                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white animate-pulse" />
                            </div>
                            <div className="bg-gray-100 rounded-xl p-4 text-sm text-gray-600">
                                AI is thinking...
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 p-4">

                    {/* Quick Actions */}
                    <div className="mb-3 flex flex-wrap gap-2">
                        {[
                            "Analyze patient progress trends",
                            "Identify at-risk patients",
                            "Generate weekly summary report",
                            "Suggest protocol optimizations",
                        ].map((action) => (
                            <button
                                key={action}
                                onClick={() => setInput(action)}
                                className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                            >
                                {action}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && handleSend()
                            }
                            placeholder="Ask me anything about your patients..."
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />

                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="px-5 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>

            {/* Premium AI Info */}
            <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                    <span className="font-semibold text-purple-800">
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