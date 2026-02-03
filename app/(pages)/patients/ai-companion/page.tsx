"use client";

import { Bot } from "lucide-react";

export default function PatientAICompanion() {
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
                        <div className="flex-1 p-4 space-y-4 overflow-y-auto">

                            {/* AI Message */}
                            <div className="flex items-start gap-3 max-w-[80%]">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2DD4BF] to-[#0A2E4C] flex items-center justify-center">
                                    <Bot className="h-5 w-5 text-white" />
                                </div>
                                <div className="bg-[#F8F9FA] text-[#0A2E4C] rounded-lg p-3">
                                    <p className="text-sm">
                                        Hello John! 👋 I’m your AI companion here to support you through your rehabilitation journey.
                                        How are you feeling today?
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">10:00 AM</p>
                                </div>
                            </div>

                            {/* User Message */}
                            <div className="flex justify-end">
                                <div className="bg-[#2DD4BF] text-white rounded-lg p-3 max-w-[80%]">
                                    <p className="text-sm">
                                        I’m feeling a bit tired after today’s session.
                                    </p>
                                    <p className="text-xs text-white/70 mt-1 text-right">10:02 AM</p>
                                </div>
                            </div>

                        </div>

                        {/* Input Placeholder */}
                        <div className="border-t p-4">
                            <input
                                disabled
                                placeholder="Type your message..."
                                className="w-full px-4 py-3 border rounded-lg text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                            />
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