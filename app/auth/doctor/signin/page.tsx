"use client";
import { useRef, useState, useEffect } from "react";

interface DoctorIllustrationProps {
  isError?: boolean;
  isPasswordFocused?: boolean;
}

export default function DoctorIllustration({ 
  isError = false, 
  isPasswordFocused = false 
}: DoctorIllustrationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [breatheOffset, setBreatheOffset] = useState(0);

  // Cursor tracking effect
  useEffect(() => {
    const element = svgRef.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      setCursorPos({ x, y });
    };

    const handleMouseLeave = () => {
      setCursorPos({ x: 0, y: 0 });
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Breathing animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBreatheOffset((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const breatheY = Math.sin(breatheOffset * 0.05) * 2;

  // Calculate eye pupil movement based on cursor
  const maxPupilMove = 5;
  const pupilLeftX = 130 + (cursorPos.x / 100) * maxPupilMove;
  const pupilLeftY = 115 + (cursorPos.y / 100) * maxPupilMove;
  const pupilRightX = 170 + (cursorPos.x / 100) * maxPupilMove;
  const pupilRightY = 115 + (cursorPos.y / 100) * maxPupilMove;

  // Stethoscope movement
  const stethoscopeY = 265 + breatheY;

  // Colors - more realistic skin tones
  const skinColor = isError ? "#FF8A80" : "#FDBCB4";
  const skinShadow = isError ? "#E74C3C" : "#F4A688";
  const coatColor = "#E8F5F5";
  const coatShadow = "#C8E0E0";

  return (
    <svg
      ref={svgRef}
      width="280"
      height="380"
      viewBox="0 0 280 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-sm transition-all duration-300 drop-shadow-xl"
    >
      {/* Definitions for gradients and shadows */}
      <defs>
        {/* Skin gradient */}
        <linearGradient id="skinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={skinColor} />
          <stop offset="100%" stopColor={skinShadow} />
        </linearGradient>
        
        {/* Coat gradient */}
        <linearGradient id="coatGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor={coatColor} />
          <stop offset="100%" stopColor={coatShadow} />
        </linearGradient>

        {/* Hair gradient */}
        <linearGradient id="hairGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3A4A5A" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>

        {/* Shadow filter */}
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
        </filter>
      </defs>

      {/* Neck with shadow */}
      <rect 
        x="135" 
        y="155" 
        width="30" 
        height="30" 
        fill="url(#skinGradient)" 
        rx="5"
        className="transition-all duration-300"
        filter="url(#shadow)"
      />

      {/* Head with gradient */}
      <ellipse 
        cx="150" 
        cy="115" 
        rx="48" 
        ry="58" 
        fill="url(#skinGradient)" 
        className="transition-all duration-300"
        filter="url(#shadow)"
      />

      {/* Hair - More professional style */}
      <path
        d="M102 105 Q102 55, 150 55 Q198 55, 198 105 L198 120 Q190 115, 180 113 Q170 111, 160 110 Q150 109, 140 110 Q130 111, 120 113 Q110 115, 102 120 Z"
        fill="url(#hairGradient)"
        filter="url(#shadow)"
      />
      {/* Hair shine */}
      <ellipse cx="130" cy="75" rx="15" ry="8" fill="white" opacity="0.15" />

      {/* Ears with detail */}
      <g filter="url(#shadow)">
        <ellipse cx="102" cy="115" rx="11" ry="17" fill="url(#skinGradient)" />
        <ellipse cx="102" cy="115" rx="6" ry="10" fill={skinShadow} opacity="0.3" />
      </g>
      <g filter="url(#shadow)">
        <ellipse cx="198" cy="115" rx="11" ry="17" fill="url(#skinGradient)" />
        <ellipse cx="198" cy="115" rx="6" ry="10" fill={skinShadow} opacity="0.3" />
      </g>

      {/* Face shadow for depth */}
      <ellipse cx="150" cy="130" rx="35" ry="15" fill={skinShadow} opacity="0.1" />

      {/* Eyes - Open or closed */}
      {isPasswordFocused ? (
        <>
          {/* Closed eyes */}
          <path 
            d="M118 115 Q130 119, 142 115" 
            stroke="#2D3748" 
            strokeWidth="3" 
            fill="none" 
            strokeLinecap="round"
          />
          <path 
            d="M158 115 Q170 119, 182 115" 
            stroke="#2D3748" 
            strokeWidth="3" 
            fill="none" 
            strokeLinecap="round"
          />
          {/* Eyelashes */}
          <path d="M118 115 L116 112 M130 119 L130 122 M142 115 L144 112" stroke="#2D3748" strokeWidth="1" strokeLinecap="round" />
          <path d="M158 115 L156 112 M170 119 L170 122 M182 115 L184 112" stroke="#2D3748" strokeWidth="1" strokeLinecap="round" />
        </>
      ) : (
        <>
          {/* Open eyes with detail */}
          <g id="left-eye">
            {/* Eye white */}
            <ellipse cx="130" cy="115" rx="13" ry="17" fill="white" />
            {/* Eye outline */}
            <ellipse cx="130" cy="115" rx="13" ry="17" fill="none" stroke="#2D3748" strokeWidth="2" />
            {/* Iris */}
            <circle cx={pupilLeftX} cy={pupilLeftY} r="8" fill="#4A90E2" opacity="0.9" className="transition-all duration-100" />
            {/* Pupil */}
            <circle cx={pupilLeftX} cy={pupilLeftY} r="5" fill="#1E293B" className="transition-all duration-100" />
            {/* Eye shine */}
            <circle cx={pupilLeftX + 2} cy={pupilLeftY - 2} r="2.5" fill="white" className="transition-all duration-100" />
            {/* Subtle eyelid shadow */}
            <ellipse cx="130" cy="107" rx="13" ry="5" fill="#2D3748" opacity="0.05" />
          </g>

          <g id="right-eye">
            {/* Eye white */}
            <ellipse cx="170" cy="115" rx="13" ry="17" fill="white" />
            {/* Eye outline */}
            <ellipse cx="170" cy="115" rx="13" ry="17" fill="none" stroke="#2D3748" strokeWidth="2" />
            {/* Iris */}
            <circle cx={pupilRightX} cy={pupilRightY} r="8" fill="#4A90E2" opacity="0.9" className="transition-all duration-100" />
            {/* Pupil */}
            <circle cx={pupilRightX} cy={pupilRightY} r="5" fill="#1E293B" className="transition-all duration-100" />
            {/* Eye shine */}
            <circle cx={pupilRightX + 2} cy={pupilRightY - 2} r="2.5" fill="white" className="transition-all duration-100" />
            {/* Subtle eyelid shadow */}
            <ellipse cx="170" cy="107" rx="13" ry="5" fill="#2D3748" opacity="0.05" />
          </g>
        </>
      )}

      {/* Eyebrows - More defined */}
      <path 
        d={isError ? "M116 103 Q130 97, 144 103" : "M116 100 Q130 96, 144 100"} 
        stroke="#2D3748" 
        strokeWidth="3.5" 
        fill="none" 
        strokeLinecap="round"
        className="transition-all duration-300"
        opacity="0.8"
      />
      <path 
        d={isError ? "M156 103 Q170 97, 184 103" : "M156 100 Q170 96, 184 100"} 
        stroke="#2D3748" 
        strokeWidth="3.5" 
        fill="none" 
        strokeLinecap="round"
        className="transition-all duration-300"
        opacity="0.8"
      />

      {/* Nose with shadow */}
      <g filter="url(#shadow)">
        <path d="M150 120 L147 132 L150 135 L153 132 Z" fill={skinShadow} />
        <ellipse cx="147" cy="134" rx="2" ry="3" fill={skinShadow} opacity="0.4" />
        <ellipse cx="153" cy="134" rx="2" ry="3" fill={skinShadow} opacity="0.4" />
      </g>

      {/* Mouth - More detail */}
      <g>
        <path 
          d={isError ? "M135 148 Q150 143, 165 148" : "M135 145 Q150 153, 165 145"} 
          stroke="#D97D6F" 
          strokeWidth="2.5" 
          fill="none" 
          strokeLinecap="round"
          className="transition-all duration-300"
        />
        {!isError && (
          <path d="M142 149 Q150 152, 158 149" fill="#FFB3BA" opacity="0.3" />
        )}
      </g>

      {/* Facial structure lines for realism */}
      <line x1="130" y1="140" x2="128" y2="145" stroke={skinShadow} strokeWidth="1" opacity="0.2" />
      <line x1="170" y1="140" x2="172" y2="145" stroke={skinShadow} strokeWidth="1" opacity="0.2" />

      {/* Doctor's coat - Professional with details */}
      <g style={{ transform: `translateY(${breatheY}px)` }} className="transition-transform duration-1000">
        {/* Main coat body with gradient */}
        <path
          d="M150 185 C122 185, 100 205, 100 245 L100 370 C100 375, 103 378, 108 378 L192 378 C197 378, 200 375, 200 370 L200 245 C200 205, 178 185, 150 185 Z"
          fill="url(#coatGradient)"
          stroke="#A0D8D8"
          strokeWidth="1.5"
          filter="url(#shadow)"
        />

        {/* Coat shadows for depth */}
        <path
          d="M120 220 Q150 215, 180 220"
          stroke={coatShadow}
          strokeWidth="2"
          fill="none"
          opacity="0.3"
        />

        {/* Coat collar - More defined */}
        <g filter="url(#shadow)">
          <path
            d="M130 185 L122 200 L128 210 L135 205 Z"
            fill="white"
            stroke="#0891B2"
            strokeWidth="1.5"
          />
          <path
            d="M170 185 L178 200 L172 210 L165 205 Z"
            fill="white"
            stroke="#0891B2"
            strokeWidth="1.5"
          />
        </g>

        {/* Coat buttons */}
        <circle cx="150" cy="220" r="4" fill="#0891B2" stroke="white" strokeWidth="1" filter="url(#shadow)" />
        <circle cx="150" cy="250" r="4" fill="#0891B2" stroke="white" strokeWidth="1" filter="url(#shadow)" />
        <circle cx="150" cy="280" r="4" fill="#0891B2" stroke="white" strokeWidth="1" filter="url(#shadow)" />
        <circle cx="150" cy="310" r="4" fill="#0891B2" stroke="white" strokeWidth="1" filter="url(#shadow)" />

        {/* Coat pockets */}
        <g opacity="0.6">
          <rect x="110" y="300" width="35" height="30" rx="3" fill="none" stroke="#0891B2" strokeWidth="1.5" />
          <rect x="155" y="300" width="35" height="30" rx="3" fill="none" stroke="#0891B2" strokeWidth="1.5" />
          {/* Pocket details */}
          <line x1="115" y1="305" x2="140" y2="305" stroke="#0891B2" strokeWidth="1" />
          <line x1="160" y1="305" x2="185" y2="305" stroke="#0891B2" strokeWidth="1" />
        </g>

        {/* Name badge */}
        <g filter="url(#shadow)">
          <rect x="105" y="345" width="40" height="22" rx="2" fill="white" stroke="#0891B2" strokeWidth="1.5" />
          <text x="125" y="357" fontSize="8" fill="#0891B2" textAnchor="middle" fontWeight="600">Dr.</text>
          <rect x="108" y="348" width="6" height="8" rx="1" fill="#0891B2" opacity="0.3" />
        </g>
      </g>

      {/* Stethoscope - Animated */}
      <g style={{ transform: `translateY(${stethoscopeY - 265}px)` }} className="transition-transform duration-1000">
        {/* Stethoscope chest piece */}
        <circle cx="150" cy={stethoscopeY + 10} r="12" fill="none" stroke="#0891B2" strokeWidth="3" filter="url(#shadow)" />
        <circle cx="150" cy={stethoscopeY + 10} r="8" fill="#E0F2FE" stroke="#0891B2" strokeWidth="1.5" />
        <circle cx="150" cy={stethoscopeY + 10} r="4" fill="#0891B2" />
        
        {/* Stethoscope tubes */}
        <path
          d={`M150 ${stethoscopeY - 5} Q132 ${stethoscopeY - 15}, 125 ${stethoscopeY - 25}`}
          stroke="#0891B2"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          filter="url(#shadow)"
        />
        <path
          d={`M150 ${stethoscopeY - 5} Q168 ${stethoscopeY - 15}, 175 ${stethoscopeY - 25}`}
          stroke="#0891B2"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          filter="url(#shadow)"
        />
        
        {/* Ear pieces */}
        <circle cx="125" cy={stethoscopeY - 25} r="5" fill="#0891B2" filter="url(#shadow)" />
        <circle cx="175" cy={stethoscopeY - 25} r="5" fill="#0891B2" filter="url(#shadow)" />
      </g>

      {/* Subtle highlights for 3D effect */}
      <ellipse cx="135" cy="105" rx="8" ry="5" fill="white" opacity="0.1" />
      <ellipse cx="165" cy="105" rx="8" ry="5" fill="white" opacity="0.1" />
    </svg>
  );
}