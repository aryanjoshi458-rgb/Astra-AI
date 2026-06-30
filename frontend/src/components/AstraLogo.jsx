import React from "react";

export const AstraLogo = ({ className = "w-6 h-6", size = 24, animated = false }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      shapeRendering="geometricPrecision"
    >
      {/* Outer Stylized futuristic letter A */}
      <path
        d="M50 15L15 85H32L50 48L68 85H85L50 15Z"
        fill="currentColor"
      />
      {/* Central Star shard element (Astra theme) */}
      <path
        d="M50 32L53 42H63L55 48L58 58L50 52L42 58L45 48L37 42H47L50 32Z"
        fill="currentColor"
      />

      {/* Animated glowing snake stroke along the A edges */}
      {animated && (
        <>
          <path
            d="M50 15L15 85H32L50 48L68 85H85L50 15Z"
            fill="none"
            stroke="url(#snakeGlow)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="animate-stroke-snake"
          />
          <defs>
            <linearGradient id="snakeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
        </>
      )}
    </svg>
  );
};

export default AstraLogo;
