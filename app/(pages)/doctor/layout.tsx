import { DoctorSidebar } from '@/components/doctor/DoctorSidebar';

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <DoctorSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
