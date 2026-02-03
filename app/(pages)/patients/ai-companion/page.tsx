"use client";

import { useState, useRef, useEffect } from "react";
import { Bot } from "lucide-react";

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
                    <div className="bg-white shadow-lg rounded-xl p-6 flex items-center justify-center">
                        <p className="text-gray-400 text-sm">
                            Subscription and plan details will appear here
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}