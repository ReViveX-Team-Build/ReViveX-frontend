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
      {/* Neck */}
      <rect x="135" y="155" width="30" height="25" fill="#FCD6B8" rx="5" />

      {/* Head */}
      <ellipse cx="150" cy="120" rx="50" ry="60" fill="#FCD6B8" />

      {/* Hair */}
      <path
        d="M100 110 Q100 60, 150 60 Q200 60, 200 110 L200 130 Q180 120, 150 120 Q120 120, 100 130 Z"
        fill="#2D3748"
      />

      {/* Ears */}
      <ellipse cx="100" cy="120" rx="12" ry="18" fill="#FCD6B8" />
      <ellipse cx="200" cy="120" rx="12" ry="18" fill="#FCD6B8" />

      {/* Eyes - We'll animate these next! */}
      <g id="left-eye">
        <ellipse cx="130" cy="115" rx="12" ry="16" fill="white" stroke="#2D3748" strokeWidth="2" />
        <circle cx="130" cy="118" r="6" fill="#2D3748" />
        <circle cx="132" cy="116" r="3" fill="white" />
      </g>

      <g id="right-eye">
        <ellipse cx="170" cy="115" rx="12" ry="16" fill="white" stroke="#2D3748" strokeWidth="2" />
        <circle cx="170" cy="118" r="6" fill="#2D3748" />
        <circle cx="172" cy="116" r="3" fill="white" />
      </g>

      {/* Eyebrows */}
      <path d="M118 100 Q130 95, 142 100" stroke="#2D3748" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M158 100 Q170 95, 182 100" stroke="#2D3748" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Nose */}
      <path d="M150 125 L145 135 L150 137 L155 135 Z" fill="#F4A688" />

      {/* Mouth - smile */}
      <path d="M135 145 Q150 155, 165 145" stroke="#D97D6F" strokeWidth="2" fill="none" strokeLinecap="round" />

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