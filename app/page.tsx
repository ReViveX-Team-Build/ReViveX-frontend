import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white text-black">
      
      <h1 className="text-4xl font-bold text-teal-600 mb-2">
        Welcome to ReViveX
      </h1>

      <p className="text-lg mb-10">
        System Status: <span className="text-green-600 font-semibold">Online</span>
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Link href="/patients/home">
          <button className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-lg shadow transition">
            Patient Dashboard
          </button>
        </Link>

        {/* for now im adding this to go to the doctors page 😀*/}
        <Link href="/doctor/home">
          <button className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-lg shadow transition">
            Doctor Portal
          </button>
        </Link>
      </div>

    </div>
  );
}
