import React from 'react';

interface DimabinEmblemProps {
  size?: number | string;
  className?: string;
  variant?: 'light' | 'dark' | 'gold';
}

/**
 * Divine Mandate Bible Institute (DIMABIN) Official Seal / Emblem
 * Vector SVG with Bible, Cross, and Kingdom Mandate Motif
 */
export const DimabinEmblem: React.FC<DimabinEmblemProps> = ({
  size = 48,
  className = '',
  variant = 'light',
}) => {
  const primaryColor = variant === 'dark' ? '#FFFFFF' : '#1F3C82';
  const navyColor = variant === 'dark' ? '#EEF3FD' : '#122452';
  const goldColor = '#F5B800';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="Divine Mandate Bible Institute Crest"
      role="img"
    >
      <title>DIMABIN Official Emblem</title>
      {/* Outer Golden Crest Ring */}
      <circle cx="50" cy="50" r="46" stroke={goldColor} strokeWidth="3" strokeDasharray="4 2" />
      <circle cx="50" cy="50" r="41" fill={navyColor} />

      {/* Decorative Starburst Rays */}
      <g opacity="0.25">
        <path d="M50 14L50 20M50 80L50 86M14 50L20 50M80 50L86 50" stroke={goldColor} strokeWidth="2" strokeLinecap="round" />
        <path d="M25 25L29 29M71 71L75 75M75 25L71 29M25 75L29 71" stroke={goldColor} strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Open Holy Bible Shield */}
      <path
        d="M26 62C34 60 44 60 50 63C56 60 66 60 74 62V38C66 36 56 36 50 39C44 36 34 36 26 38V62Z"
        fill="#FFFFFF"
        stroke={goldColor}
        strokeWidth="1.5"
      />
      {/* Bible Spine & Pages */}
      <path d="M50 39V63" stroke={primaryColor} strokeWidth="2" />
      <path d="M31 44C37 43 43 43 47 45M31 50C37 49 43 49 47 51M31 56C37 55 43 55 47 57" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M69 44C63 43 57 43 53 45M69 50C63 49 57 49 53 51M69 56C63 55 57 55 53 57" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />

      {/* Radiant Golden Cross */}
      <path d="M50 23V46" stroke={goldColor} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M43 31H57" stroke={goldColor} strokeWidth="3.5" strokeLinecap="round" />

      {/* Divine Mandate Arch Banner */}
      <path
        d="M32 75C37 73 43 72 50 72C57 72 63 73 68 75"
        stroke={goldColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};
