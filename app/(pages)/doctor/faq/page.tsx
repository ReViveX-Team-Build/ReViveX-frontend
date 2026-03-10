"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function FAQPlaceholder() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080f1a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px",
      position: "relative",
      overflow: "hidden",
      color: "#ffffff",
      fontFamily: "'DM Sans', sans-serif"
    }}>
      {/* Subtle Background Grid & Glow */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.3, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(45,212,191,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,0.05) 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "60vw", height: "60vh",
        background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 60%)",
        pointerEvents: "none"
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: "600px" }}>
        
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <div style={{
            width: "50px", height: "50px", borderRadius: "16px",
            background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#2DD4BF"
          }}>
            <Loader2 size={24} className="animate-spin" style={{ animation: "spin 3s linear infinite" }} />
          </div>
        </div>

        <div style={{ 
          fontFamily: "'Space Mono', monospace", fontSize: "10px", color: "rgba(45,212,191,0.6)", 
          textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: "16px" 
        }}>
          Knowledge Base
        </div>

        <h1 style={{ 
          fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(3rem, 8vw, 5rem)", 
          lineHeight: "1", letterSpacing: "0.03em", marginBottom: "20px" 
        }}>
          FAQ <span style={{ color: "#2DD4BF" }}>IN PROGRESS.</span>
        </h1>

        <p style={{ 
          fontSize: "16px", color: "rgba(255,255,255,0.5)", lineHeight: "1.8", 
          fontWeight: 300, marginBottom: "40px" 
        }}>
          We are currently compiling the most common questions regarding the ReViveX AIoT hardware, clinical dashboard, and patient onboarding process. Check back shortly.
        </p>

        <button 
          onClick={() => router.back()}
          style={{
            display: "inline-flex", alignItems: "center", gap: "12px",
            padding: "16px 32px", borderRadius: "99px",
            background: "transparent", border: "1px solid rgba(45,212,191,0.3)",
            color: "#2DD4BF", fontFamily: "'Space Mono', monospace", fontSize: "12px",
            textTransform: "uppercase", letterSpacing: "0.15em", cursor: "pointer",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(45,212,191,0.1)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          <ArrowLeft size={16} /> Return
        </button>

      </div>
      
      {/* Inline Spin Animation for the Loader */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}