import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./global.css";
import SeedButton from "../components/DevTools/seedButton";
import { HardwareProvider } from "@/app/lib/context/HardwareContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReViveX - Rehab Application",
  description:
    "ReViveX is a cutting-edge rehabilitation application designed to empower patients and healthcare professionals. Our platform offers personalized therapy protocols, interactive exercises, and real-time progress tracking to enhance recovery outcomes. With an intuitive interface and AI-driven insights, ReViveX revolutionizes the rehabilitation experience, making it more engaging and effective for everyone involved.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeInitScript = `
    (function () {
      try {
        var saved = localStorage.getItem('darkMode');
        var isDark = saved === 'true';
        document.documentElement.classList.toggle('dark', isDark);
      } catch (e) {
        document.documentElement.classList.remove('dark');
      }
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning={true}>
          <HardwareProvider>
              {children}
              {process.env.NODE_ENV === "development" && <SeedButton />}
          </HardwareProvider>
      </body>
    </html>
  );
}
