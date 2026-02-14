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

                </div>

            </div>
        </div>
    );
}