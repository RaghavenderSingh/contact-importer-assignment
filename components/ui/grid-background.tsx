import React from "react";

interface GridBackgroundProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function GridBackground({
  className = "",
  style = {},
}: GridBackgroundProps) {
  return (
    <div className={`relative w-full h-full ${className}`} style={style}>
      {/* Grid with radial fade effect */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 678 323"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
      >
        <defs>
          {/* Radial gradient mask */}
          <radialGradient id="gridMask" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="50%" stopColor="white" stopOpacity="0.8" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>

          <filter
            id="filter0_f_222_370"
            x="110.035"
            y="16.367"
            width="457.929"
            height="290.265"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur
              stdDeviation="35.3982"
              result="effect1_foregroundBlur_222_370"
            />
          </filter>
        </defs>

        {/* Centered ellipse with blur effect */}
        <g filter="url(#filter0_f_222_370)">
          <ellipse
            cx="339"
            cy="161.5"
            rx="157.1681365966797"
            ry="74.3362808227539"
            fill="rgba(148, 163, 184, 0.2)"
          />
        </g>

        {/* Grid lines with radial mask */}
        <g mask="url(#gridMask)">
          {/* Vertical lines */}
          {Array.from({ length: 20 }, (_, i) => (
            <line
              key={`v-${i}`}
              x1={1.42476 + i * 35.547}
              y1="0.254532"
              x2={1.42476 + i * 35.547}
              y2="322.719"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="0.5"
            />
          ))}
          {/* Horizontal lines */}
          {Array.from({ length: 10 }, (_, i) => (
            <line
              key={`h-${i}`}
              x1="1.14014"
              y1={0.816099 + i * 35.547}
              x2="675.692"
              y2={0.816099 + i * 35.547}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="0.5"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
