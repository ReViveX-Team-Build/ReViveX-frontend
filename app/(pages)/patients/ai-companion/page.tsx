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
                    <div className="lg:col-span-2">
                        <div className="bg-white shadow-lg rounded-xl h-[calc(100vh-250px)] flex items-center justify-center">
                            <p className="text-gray-400 text-sm">
                                Patient AI chat interface will appear here
                            </p>
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