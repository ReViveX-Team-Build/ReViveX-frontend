"use client";

export default function DoctorIllustration() {
  return (
    <svg
      width="300"
      height="400"
      viewBox="0 0 300 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-sm"
    >
      {/* Doctor's coat/body */}
      <path
        d="M150 180 C120 180, 100 200, 100 240 L100 380 C100 390, 110 400, 120 400 L180 400 C190 400, 200 390, 200 380 L200 240 C200 200, 180 180, 150 180 Z"
        fill="#E0F2FE"
        stroke="#0891B2"
        strokeWidth="2"
      />
      
      {/* Coat collar */}
      <path
        d="M130 180 L120 200 L130 210"
        fill="#CFFAFE"
        stroke="#0891B2"
        strokeWidth="2"
      />
      <path
        d="M170 180 L180 200 L170 210"
        fill="#CFFAFE"
        stroke="#0891B2"
        strokeWidth="2"
      />

      {/* Stethoscope */}
      <circle cx="150" cy="280" r="15" fill="none" stroke="#0891B2" strokeWidth="3" />
      <path
        d="M150 265 Q130 250, 120 240"
        stroke="#0891B2"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M150 265 Q170 250, 180 240"
        stroke="#0891B2"
        strokeWidth="3"
        fill="none"
      />
    </svg>
  );
}