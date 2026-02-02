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

            {/* Main Container (Empty for now) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[65vh] flex items-center justify-center">
                <p className="text-gray-400 text-sm">
                    AI Assistant interface will appear here
                </p>
            </div>

        </div>
    );
}