'use client';

import { useParams } from 'next/navigation';

export default function PatientProfilePage() {
  const { id } = useParams();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#0B1E33] mb-4">
        Patient Profile
      </h1>

      <p className="text-gray-600 mb-6">
        Patient ID: <span className="font-semibold">{id}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h3 className="font-bold mb-2">Session & Adherence</h3>
          <div className="h-40 flex items-center justify-center text-gray-400">
            Chart Loading...
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h3 className="font-bold mb-2">Clinical Notes</h3>
          <div className="h-40 flex items-center justify-center text-gray-400">
            Notes Loading...
          </div>
        </div>
      </div>
    </div>
  );
}
