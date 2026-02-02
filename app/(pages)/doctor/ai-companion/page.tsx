"use client";

import { Bot } from "lucide-react";
import { useState } from "react";

export default function DoctorAICompanion() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<
        { sender: "ai" | "user"; text: string }[]
    >([
        {
            sender: "ai",
            text: "Hello Doctor 👋 I’m your AI Clinical Assistant. I can help you analyze patient progress, adherence, and therapy risks.",
        },
    ]);
    const handleSend = () => {
        if (!input.trim()) return;

        // Add user message
        const userMessage = { sender: "user" as const, text: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");

        // Simulate AI response (Firebase-style placeholder)
        setTimeout(() => {
            const aiMessage = {
                sender: "ai" as const,
                text:
                    "I've analyzed the current data. Two patients show declining adherence and may need intervention. Would you like a detailed report?",
            };
            setMessages((prev) => [...prev, aiMessage]);
        }, 1000);
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
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${
                                msg.sender === "user" ? "justify-end" : "justify-start"
                            }`}
                        >
                            <div className="max-w-2xl">
                                {msg.sender === "ai" && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                                            <Bot className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="bg-gray-100 rounded-xl p-4 text-sm text-gray-800">
                                            {msg.text}
                                        </div>
                                    </div>
                                )}

                                {msg.sender === "user" && (
                                    <div className="bg-teal-600 text-white rounded-xl p-4 text-sm">
                                        {msg.text}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Placeholder (disabled for now) */}
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
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Ask me anything about your patients..."
                            className="flex-1 px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />

                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="px-5 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}