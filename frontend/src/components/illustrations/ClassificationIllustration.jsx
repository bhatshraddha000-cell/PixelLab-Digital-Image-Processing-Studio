import React from 'react';

export const ClassificationIllustration = ({ className = "w-full h-48" }) => {
  return (
    <svg viewBox="0 0 400 220" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="geom-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1e24" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="circ-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="rect-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="tri-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
      </defs>

      {/* Card Background */}
      <rect width="400" height="220" rx="12" fill="url(#geom-bg)" stroke="#374151" strokeWidth="1" />

      {/* Technical Grid overlay */}
      <g stroke="#374151" strokeWidth="0.75" opacity="0.3" strokeDasharray="3 3">
        <line x1="135" y1="20" x2="135" y2="175" />
        <line x1="265" y1="20" x2="265" y2="175" />
      </g>

      {/* OBJECT 1: CIRCLE */}
      <g transform="translate(20, 20)">
        {/* Bounding box */}
        <rect x="10" y="15" width="80" height="80" fill="#18181b" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" rx="4" />
        {/* Shape */}
        <circle cx="50" cy="55" r="32" fill="url(#circ-grad)" fillOpacity="0.85" stroke="#fbbf24" strokeWidth="2" />
        {/* Centroid & radius */}
        <circle cx="50" cy="55" r="3" fill="#ffffff" />
        <line x1="50" y1="55" x2="82" y2="55" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="2 2" />
        <text x="66" y="50" fill="#fef3c7" fontSize="8" fontFamily="monospace">r</text>
        
        {/* Classification Card */}
        <g transform="translate(5, 105)">
          <rect x="0" y="0" width="90" height="48" rx="6" fill="#1c1917" stroke="#f59e0b" strokeWidth="1" />
          <text x="45" y="14" fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">CIRCLE</text>
          <text x="8" y="28" fill="#d6d3d1" fontSize="7.5" fontFamily="monospace">Circ: 0.99</text>
          <text x="8" y="40" fill="#a8a29e" fontSize="7.5" fontFamily="monospace">Rect: 0.78</text>
        </g>
      </g>

      {/* OBJECT 2: RECTANGLE */}
      <g transform="translate(150, 20)">
        {/* Bounding box */}
        <rect x="10" y="25" width="80" height="60" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" rx="4" />
        {/* Shape */}
        <rect x="10" y="25" width="80" height="60" fill="url(#rect-grad)" fillOpacity="0.85" stroke="#38bdf8" strokeWidth="2" rx="2" />
        {/* Dimension ticks */}
        <line x1="10" y1="90" x2="90" y2="90" stroke="#7dd3fc" strokeWidth="1" />
        <text x="50" y="100" fill="#7dd3fc" fontSize="8" fontFamily="monospace" textAnchor="middle">w=80</text>
        
        {/* Classification Card */}
        <g transform="translate(5, 105)">
          <rect x="0" y="0" width="90" height="48" rx="6" fill="#082f49" stroke="#0284c7" strokeWidth="1" />
          <text x="45" y="14" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">RECTANGLE</text>
          <text x="8" y="28" fill="#bae6fd" fontSize="7.5" fontFamily="monospace">Circ: 0.75</text>
          <text x="8" y="40" fill="#7dd3fc" fontSize="7.5" fontFamily="monospace">Rect: 1.00</text>
        </g>
      </g>

      {/* OBJECT 3: TRIANGLE */}
      <g transform="translate(280, 20)">
        {/* Bounding box */}
        <rect x="10" y="18" width="80" height="74" fill="#1e1b2e" stroke="#f472b6" strokeWidth="1" strokeDasharray="2 2" rx="4" />
        {/* Shape */}
        <polygon points="50,22 15,88 85,88" fill="url(#tri-grad)" fillOpacity="0.85" stroke="#f472b6" strokeWidth="2" strokeLinejoin="round" />
        {/* Centroid */}
        <circle cx="50" cy="66" r="3" fill="#ffffff" />
        
        {/* Classification Card */}
        <g transform="translate(5, 105)">
          <rect x="0" y="0" width="90" height="48" rx="6" fill="#4c0519" stroke="#db2777" strokeWidth="1" />
          <text x="45" y="14" fill="#f472b6" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">TRIANGLE</text>
          <text x="8" y="28" fill="#fbcfe8" fontSize="7.5" fontFamily="monospace">Circ: 0.60</text>
          <text x="8" y="40" fill="#f472b6" fontSize="7.5" fontFamily="monospace">Comp: 0.55</text>
        </g>
      </g>

      {/* BOTTOM DESCRIPTORS BANNER */}
      <g transform="translate(20, 180)">
        <rect x="0" y="0" width="360" height="28" rx="6" fill="#111827" stroke="#374151" strokeWidth="1" />
        <text x="180" y="18" fill="#cbd5e1" fontSize="9.5" fontFamily="monospace" textAnchor="middle">
          Formula: Circularity = (4π × Area) / Perimeter²  |  Compactness = Area / (Perimeter)²
        </text>
      </g>
    </svg>
  );
};

export default ClassificationIllustration;

