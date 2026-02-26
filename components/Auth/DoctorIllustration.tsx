"use client";
import { useRef } from "react";
import { useCursorTracking } from "@/hooks/useCursorTracking";

interface DoctorIllustrationProps {
  isError?: boolean;
  isPasswordFocused?: boolean;
}

export default function DoctorIllustration({ 
  isError = false, 
  isPasswordFocused = false 
}: DoctorIllustrationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { cursorPos } = useCursorTracking(svgRef);

  // Calculate eye pupil movement based on cursor
  const maxPupilMove = 4;
  const pupilLeftX = 130 + (cursorPos.x / 100) * maxPupilMove;
  const pupilLeftY = 118 + (cursorPos.y / 100) * maxPupilMove;
  const pupilRightX = 170 + (cursorPos.x / 100) * maxPupilMove;
  const pupilRightY = 118 + (cursorPos.y / 100) * maxPupilMove;

  // Skin color changes to red on error
  const skinColor = isError ? "#FF6B6B" : "#FCD6B8";
  const skinColorDark = isError ? "#E74C3C" : "#F4A688";

  return (
    <svg
      ref={svgRef}
      width="300"
      height="400"
      viewBox="0 0 300 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-sm transition-all duration-300"
    >
      {/* Neck */}
      <rect x="135" y="155" width="30" height="25" fill={skinColor} rx="5" className="transition-colors duration-300" />

      {/* Head */}
      <ellipse cx="150" cy="120" rx="50" ry="60" fill={skinColor} className="transition-colors duration-300" />

      {/* Hair */}
      <path
        d="M100 110 Q100 60, 150 60 Q200 60, 200 110 L200 130 Q180 120, 150 120 Q120 120, 100 130 Z"
        fill="#2D3748"
      />

      {/* Ears */}
      <ellipse cx="100" cy="120" rx="12" ry="18" fill={skinColor} className="transition-colors duration-300" />
      <ellipse cx="200" cy="120" rx="12" ry="18" fill={skinColor} className="transition-colors duration-300" />

      {/* Eyes - Closed when typing password */}
      {isPasswordFocused ? (
        <>
          {/* Closed eyes */}
          <path 
            d="M118 115 Q130 118, 142 115" 
            stroke="#2D3748" 
            strokeWidth="3" 
            fill="none" 
            strokeLinecap="round"
          />
          <path 
            d="M158 115 Q170 118, 182 115" 
            stroke="#2D3748" 
            strokeWidth="3" 
            fill="none" 
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          {/* Open eyes with animated pupils */}
          <g id="left-eye">
            <ellipse cx="130" cy="115" rx="12" ry="16" fill="white" stroke="#2D3748" strokeWidth="2" />
            <circle 
              cx={pupilLeftX} 
              cy={pupilLeftY} 
              r="6" 
              fill="#2D3748"
              className="transition-all duration-100"
            />
            <circle 
              cx={pupilLeftX + 2} 
              cy={pupilLeftY - 2} 
              r="3" 
              fill="white"
              className="transition-all duration-100"
            />
          </g>

          <g id="right-eye">
            <ellipse cx="170" cy="115" rx="12" ry="16" fill="white" stroke="#2D3748" strokeWidth="2" />
            <circle 
              cx={pupilRightX} 
              cy={pupilRightY} 
              r="6" 
              fill="#2D3748"
              className="transition-all duration-100"
            />
            <circle 
              cx={pupilRightX + 2} 
              cy={pupilRightY - 2} 
              r="3" 
              fill="white"
              className="transition-all duration-100"
            />
          </g>
        </>
      )}

      {/* Eyebrows - Angry when error */}
      <path 
        d={isError ? "M118 105 Q130 98, 142 105" : "M118 100 Q130 95, 142 100"} 
        stroke="#2D3748" 
        strokeWidth="3" 
        fill="none" 
        strokeLinecap="round"
        className="transition-all duration-300"
      />
      <path 
        d={isError ? "M158 105 Q170 98, 182 105" : "M158 100 Q170 95, 182 100"} 
        stroke="#2D3748" 
        strokeWidth="3" 
        fill="none" 
        strokeLinecap="round"
        className="transition-all duration-300"
      />

      {/* Nose */}
      <path d="M150 125 L145 135 L150 137 L155 135 Z" fill={skinColorDark} className="transition-colors duration-300" />

      {/* Mouth - frown when error, smile otherwise */}
      <path 
        d={isError ? "M135 150 Q150 145, 165 150" : "M135 145 Q150 155, 165 145"} 
        stroke="#D97D6F" 
        strokeWidth="2" 
        fill="none" 
        strokeLinecap="round"
        className="transition-all duration-300"
      />

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