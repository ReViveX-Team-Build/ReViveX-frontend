import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-white text-black">
      <h1 className="text-4xl font-bold mb-4 text-teal-600">Welcome to ReViveX</h1>
      <p className="mt-2 text-xl mb-8">System Status: Online 🟢</p>
      
      <Link href="/patient-home">
        <button className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all">
          Go to Patient Dashboard
        </button>
      </Link>
    </div>
  );
}