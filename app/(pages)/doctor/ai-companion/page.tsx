"use client";

import { Bot } from "lucide-react";

export default function DoctorAICompanion() {
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

                    {/* AI Message */}
                    <div className="flex items-start gap-3 max-w-2xl">
                        <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-700 mb-1">
                                AI Assistant
                            </p>
                            <div className="bg-gray-100 rounded-xl p-4 text-sm text-gray-800">
                                Hello Doctor 👋 I’m your AI Clinical Assistant.
                                I can help you analyze patient progress, adherence, and therapy risks.
                            </div>
                        </div>
                    </div>

                    {/* User Message */}
                    <div className="flex justify-end">
                        <div className="max-w-2xl">
                            <p className="text-sm font-semibold text-gray-700 mb-1 text-right">
                                You
                            </p>
                            <div className="bg-teal-600 text-white rounded-xl p-4 text-sm">
                                Show me patients who need attention today
                            </div>
                        </div>
                    </div>

                </div>

                {/* Input Placeholder (disabled for now) */}
                <div className="border-t border-gray-200 p-4">
                    <input
                        disabled
                        placeholder="Type your question here..."
                        className="w-full px-4 py-3 border rounded-lg text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                    />
                </div>
            </div>

        </div>
    );
}