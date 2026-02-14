"use client";

export default function PatientSettingsPage() {
    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">

                <div className="mb-8">
                    <h2 className="text-[#0A2E4C] text-2xl font-semibold mb-2">
                        Settings
                    </h2>
                    <p className="text-gray-600">
                        Manage your account and notification preferences
                    </p>
                </div>

                <div className="space-y-6">

                    {/* Profile Information */}
                    <div className="bg-white shadow-lg rounded-xl p-6">

                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-[#0A2E4C] text-lg font-semibold">
                                Profile Information
                            </h3>
                        </div>

                        <div className="bg-[#F8F9FA] rounded-lg p-6 space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">

                                <div>
                                    <p className="text-sm text-gray-600">Full Name</p>
                                    <p className="text-[#0A2E4C] mt-1">John Smith</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600">Patient ID</p>
                                    <p className="text-[#0A2E4C] mt-1">RVX-2024-1234</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600">Date of Birth</p>
                                    <p className="text-[#0A2E4C] mt-1">March 15, 1955</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600">Assigned Clinician</p>
                                    <p className="text-[#0A2E4C] mt-1">Dr. Sarah Johnson</p>
                                </div>

                            </div>
                        </div>

                    </div>

                    {/* Notification Preferences */}
                    <div className="bg-white shadow-lg rounded-xl p-6">

                        <h3 className="text-[#0A2E4C] text-lg font-semibold mb-4">
                            Notification Preferences
                        </h3>

                        <div className="bg-[#F8F9FA] rounded-lg p-6 space-y-6">

                            {/* Session Reminders */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[#0A2E4C]">Session Reminders</p>
                                    <p className="text-sm text-gray-600">
                                        Get notified before your therapy sessions
                                    </p>
                                </div>
                                <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#2DD4BF]" />
                            </div>

                            {/* Progress Updates */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[#0A2E4C]">Progress Updates</p>
                                    <p className="text-sm text-gray-600">
                                        Receive weekly progress summaries
                                    </p>
                                </div>
                                <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#2DD4BF]" />
                            </div>

                            {/* AI Messages */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[#0A2E4C]">AI Companion Messages</p>
                                    <p className="text-sm text-gray-600">
                                        Allow motivational AI messages
                                    </p>
                                </div>
                                <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#2DD4BF]" />
                            </div>

                            {/* Doctor Messages */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[#0A2E4C]">Doctor Messages</p>
                                    <p className="text-sm text-gray-600">
                                        Notify me of new doctor messages
                                    </p>
                                </div>
                                <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#2DD4BF]" />
                            </div>

                            {/* Email Notifications */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[#0A2E4C]">Email Notifications</p>
                                    <p className="text-sm text-gray-600">
                                        Send notifications to your email
                                    </p>
                                </div>
                                <input type="checkbox" className="w-5 h-5 accent-[#2DD4BF]" />
                            </div>

                            {/* Save Button */}
                            <div className="pt-4 border-t">
                                <button className="bg-[#2DD4BF] hover:bg-[#2DD4BF]/90 text-white px-6 py-2 rounded-lg">
                                    Save Preferences
                                </button>
                            </div>

                        </div>

                    </div>
                    {/* Privacy & Security */}
                    <div className="bg-white shadow-lg rounded-xl p-6">

                        <h3 className="text-[#0A2E4C] text-lg font-semibold mb-4">
                            Privacy & Security
                        </h3>

                        <div className="bg-[#F8F9FA] rounded-lg p-6 space-y-4">

                            <p className="text-sm text-gray-700 leading-relaxed">
                                Your therapy data is securely stored and protected.
                                Only you and your assigned clinician have access to your records.
                                ReviVeX complies with healthcare privacy standards to ensure your information remains confidential.
                            </p>

                            <button className="border border-[#0A2E4C] text-[#0A2E4C] px-4 py-2 rounded-lg hover:bg-[#0A2E4C]/5">
                                View Privacy Policy
                            </button>

                        </div>

                    </div>
                    {/* Support & Help */}
                    <div className="bg-white shadow-lg rounded-xl p-6">

                        <h3 className="text-[#0A2E4C] text-lg font-semibold mb-4">
                            Support & Help
                        </h3>

                        <div className="bg-[#F8F9FA] rounded-lg p-6 space-y-6">

                            <div>
                                <p className="text-[#0A2E4C] font-medium">
                                    Contact Support
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    support@revivex.com
                                </p>
                                <p className="text-sm text-gray-600">
                                    1-800-REVIVEX
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <button className="border border-[#0A2E4C] text-[#0A2E4C] py-2 rounded-lg hover:bg-[#0A2E4C]/5">
                                    Help Center
                                </button>
                                <button className="border border-[#0A2E4C] text-[#0A2E4C] py-2 rounded-lg hover:bg-[#0A2E4C]/5">
                                    Report an Issue
                                </button>
                            </div>

                        </div>

                    </div>


                </div>

            </div>
        </div>
    );
}