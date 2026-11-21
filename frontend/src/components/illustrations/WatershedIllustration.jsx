import React from 'react';

export const WatershedIllustration = ({ className = "w-full h-48" }) => {
  return (
    <svg viewBox="0 0 400 220" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ws-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <radialGradient id="basin-1" cx="45%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#0284c7" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0369a1" stopOpacity="0.1" />
        </radialGradient>
        <radialGradient id="basin-2" cx="45%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#9333ea" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#6b21a8" stopOpacity="0.1" />
        </radialGradient>
        <radialGradient id="basin-3" cx="45%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#059669" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#047857" stopOpacity="0.1" />
        </radialGradient>
        <filter id="neon-dam">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Card Background */}
      <rect width="400" height="220" rx="12" fill="url(#ws-bg)" stroke="#4338ca" strokeWidth="1" />

      {/* Concentric Distance Transform Contours (topological elevation) */}
      <g opacity="0.35" stroke="#818cf8" strokeWidth="1" strokeDasharray="3 3">
        {/* Coin 1 distance rings */}
        <circle cx="120" cy="100" r="48" />
        <circle cx="120" cy="100" r="36" />
        <circle cx="120" cy="100" r="24" />
        <circle cx="120" cy="100" r="12" />

        {/* Coin 2 distance rings */}
        <circle cx="205" cy="85" r="48" />
        <circle cx="205" cy="85" r="36" />
        <circle cx="205" cy="85" r="24" />
        <circle cx="205" cy="85" r="12" />

        {/* Coin 3 distance rings */}
        <circle cx="280" cy="115" r="44" />
        <circle cx="280" cy="115" r="32" />
        <circle cx="280" cy="115" r="20" />
      </g>

      {/* SEGMENTED BASINS (Catchment basins) */}
      {/* Coin 1 Catchment */}
      <circle cx="120" cy="100" r="44" fill="url(#basin-1)" />
      {/* Coin 2 Catchment */}
      <circle cx="205" cy="85" r="44" fill="url(#basin-2)" />
      {/* Coin 3 Catchment */}
      <circle cx="280" cy="115" r="40" fill="url(#basin-3)" />

      {/* MARKER SEEDS (Local distance transform peaks) */}
      {/* Marker 1 */}
      <g transform="translate(120, 100)">
        <circle cx="0" cy="0" r="8" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
        <text x="0" y="3" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">M1</text>
        <path d="M -14 0 L 14 0 M 0 -14 L 0 14" stroke="#38bdf8" strokeWidth="1.2" opacity="0.8" />
      </g>

      {/* Marker 2 */}
      <g transform="translate(205, 85)">
        <circle cx="0" cy="0" r="8" fill="#7e22ce" stroke="#c084fc" strokeWidth="1.5" />
        <text x="0" y="3" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">M2</text>
        <path d="M -14 0 L 14 0 M 0 -14 L 0 14" stroke="#c084fc" strokeWidth="1.2" opacity="0.8" />
      </g>

      {/* Marker 3 */}
      <g transform="translate(280, 115)">
        <circle cx="0" cy="0" r="8" fill="#047857" stroke="#34d399" strokeWidth="1.5" />
        <text x="0" y="3" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">M3</text>
        <path d="M -14 0 L 14 0 M 0 -14 L 0 14" stroke="#34d399" strokeWidth="1.2" opacity="0.8" />
      </g>

      {/* WATERSHED DAM LINES (Segmentation boundary separating touching coins) */}
      {/* Dam between Coin 1 & 2 */}
      <path 
        d="M 160 48 Q 164 92 161 140" 
        stroke="#f43f5e" 
        strokeWidth="3" 
        strokeLinecap="round" 
        filter="url(#neon-dam)" 
      />
      
      {/* Dam between Coin 2 & 3 */}
      <path 
        d="M 242 60 Q 244 100 240 148" 
        stroke="#f43f5e" 
        strokeWidth="3" 
        strokeLinecap="round" 
        filter="url(#neon-dam)" 
      />

      {/* Callout tags */}
      <g transform="translate(25, 30)">
        <rect x="0" y="0" width="85" height="22" rx="4" fill="#0f172a" fillOpacity="0.9" stroke="#6366f1" strokeWidth="1" />
        <text x="42" y="14" fill="#a5b4fc" fontSize="8.5" fontFamily="monospace" textAnchor="middle">Distance Transform</text>
      </g>

      <g transform="translate(118, 160)">
        <rect x="0" y="0" width="164" height="24" rx="4" fill="#0f172a" fillOpacity="0.95" stroke="#f43f5e" strokeWidth="1" />
        <circle cx="14" cy="12" r="4" fill="#f43f5e" />
        <text x="24" y="16" fill="#fda4af" fontSize="9" fontFamily="monospace">Watershed Ridge Dams</text>
      </g>

      {/* Top right count badge */}
      <g transform="translate(300, 25)">
        <rect x="0" y="0" width="80" height="28" rx="6" fill="#312e81" stroke="#818cf8" strokeWidth="1" />
        <text x="40" y="18" fill="#e0e7ff" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">3 COINS</text>
      </g>
    </svg>
  );
};

export default WatershedIllustration;

