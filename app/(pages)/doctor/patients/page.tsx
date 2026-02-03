'use client';

import Link from 'next/link';

export default function DoctorPatientsPage() {
  const patients = [
    { id: '1', name: 'John Doe', adherence: '92%' },
    { id: '2', name: 'Sara K.', adherence: '61%' },
    { id: '3', name: 'Amal P.', adherence: '78%' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#0B1E33] mb-6">
        My Patients
      </h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className="flex justify-between items-center p-4 border-b last:border-b-0"
          >
            <div>
              <p className="font-semibold text-gray-800">
                {patient.name}
              </p>
              <p className="text-sm text-gray-500">
                Adherence: {patient.adherence}
              </p>
            </div>
            <Link href={`/doctor/patients/${patient.id}/messages`}>
                <button className="bg-teal-500 px-4 py-2 rounded-xl font-semibold">
                    Message Patient
                </button>
            </Link>


            <Link href={`/doctor/patients/${patient.id}`}>
              <button className="bg-teal-500 hover:bg-teal-400 text-[#0B1E33] px-4 py-2 rounded-xl font-semibold transition">
                View Profile
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
