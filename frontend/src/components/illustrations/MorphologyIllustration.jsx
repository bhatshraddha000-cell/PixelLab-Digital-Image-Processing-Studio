import React from 'react';

export const MorphologyIllustration = ({ className = "w-full h-48" }) => {
  return (
    <svg viewBox="0 0 400 220" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="morph-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#042f2e" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="disk-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        <filter id="glow-teal">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Background card */}
      <rect width="400" height="220" rx="12" fill="url(#morph-bg)" stroke="#134e4a" strokeWidth="1" />

      {/* Grid markings */}
      <g stroke="#115e59" strokeWidth="0.75" opacity="0.3" strokeDasharray="3 3">
        <line x1="20" y1="110" x2="380" y2="110" />
        <line x1="130" y1="20" x2="130" y2="200" />
        <line x1="270" y1="20" x2="270" y2="200" />
      </g>

      {/* SECTION 1: TOUCHING OBJECTS (Before) */}
      <g transform="translate(15, 25)">
        <rect x="0" y="0" width="105" height="135" rx="8" fill="#041b1d" stroke="#134e4a" strokeWidth="1" />
        <text x="52" y="20" fill="#99f6e4" fontSize="9" fontFamily="monospace" textAnchor="middle">TOUCHING (COUNT=1?)</text>
        
        {/* Two touching disks with an overlap neck */}
        <g transform="translate(15, 45)">
          {/* Overlap bridge */}
          <path d="M 24 38 Q 38 32 52 38 Q 38 46 24 38 Z" fill="#2dd4bf" opacity="0.8" />
          {/* Disk 1 */}
          <circle cx="24" cy="38" r="22" fill="#0d9488" stroke="#2dd4bf" strokeWidth="1.5" />
          {/* Disk 2 */}
          <circle cx="52" cy="38" r="22" fill="#0d9488" stroke="#2dd4bf" strokeWidth="1.5" />
          {/* Touch point marker */}
          <circle cx="38" cy="38" r="4" fill="#f43f5e" />
          <line x1="38" y1="38" x2="38" y2="68" stroke="#f43f5e" strokeWidth="1" strokeDasharray="2 2" />
          <text x="38" y="77" fill="#fda4af" fontSize="7.5" fontFamily="monospace" textAnchor="middle">Overlap Neck</text>
        </g>
      </g>

      {/* ARROW 1 & STRUCTURING ELEMENT (Erosion: A ⊖ B) */}
      <g transform="translate(125, 65)">
        {/* 3x3 Structuring Element B */}
        <g transform="translate(2, -15)">
          <rect x="0" y="0" width="24" height="24" rx="3" fill="#042f2e" stroke="#2dd4bf" strokeWidth="1" />
          {/* 3x3 cells */}
          <line x1="8" y1="0" x2="8" y2="24" stroke="#134e4a" strokeWidth="0.75" />
          <line x1="16" y1="0" x2="16" y2="24" stroke="#134e4a" strokeWidth="0.75" />
          <line x1="0" y1="8" x2="24" y2="8" stroke="#134e4a" strokeWidth="0.75" />
          <line x1="0" y1="16" x2="24" y2="16" stroke="#134e4a" strokeWidth="0.75" />
          {/* Cross SE pattern */}
          <circle cx="12" cy="4" r="2" fill="#2dd4bf" />
          <circle cx="4" cy="12" r="2" fill="#2dd4bf" />
          <circle cx="12" cy="12" r="2" fill="#5eead4" />
          <circle cx="20" cy="12" r="2" fill="#2dd4bf" />
          <circle cx="12" cy="20" r="2" fill="#2dd4bf" />
        </g>
        <path d="M 5 22 L 24 22 M 18 17 L 24 22 L 18 27" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="14" y="38" fill="#5eead4" fontSize="8" fontFamily="monospace" textAnchor="middle">EROSION ⊖</text>
      </g>

      {/* SECTION 2: ERODED (Neck Broken) */}
      <g transform="translate(160, 25)">
        <rect x="0" y="0" width="95" height="135" rx="8" fill="#041b1d" stroke="#134e4a" strokeWidth="1" />
        <text x="47" y="20" fill="#99f6e4" fontSize="9" fontFamily="monospace" textAnchor="middle">NECK SEVERED</text>
        <g transform="translate(10, 45)">
          {/* Shrinked disks, bridge completely removed */}
          <circle cx="22" cy="38" r="14" fill="#0f766e" stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="2 2" />
          <circle cx="54" cy="38" r="14" fill="#0f766e" stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="2 2" />
          {/* Clear gap indicator */}
          <line x1="38" y1="20" x2="38" y2="56" stroke="#10b981" strokeWidth="1.5" />
          <text x="38" y="70" fill="#6ee7b7" fontSize="7.5" fontFamily="monospace" textAnchor="middle">Gap Opened</text>
        </g>
      </g>

      {/* ARROW 2: DILATION & LABELING */}
      <g transform="translate(260, 75)">
        <path d="M 2 12 L 16 12 M 11 7 L 16 12 L 11 17" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="9" y="28" fill="#5eead4" fontSize="8" fontFamily="monospace" textAnchor="middle">DILATE ⊕</text>
      </g>

      {/* SECTION 3: SEPARATED & COUNTED OBJECTS (Result) */}
      <g transform="translate(285, 25)">
        <rect x="0" y="0" width="105" height="135" rx="8" fill="#042022" stroke="#14b8a6" strokeWidth="1.5" />
        <text x="52" y="20" fill="#5eead4" fontSize="9" fontFamily="monospace" textAnchor="middle">COUNT = 2 DISKS</text>
        
        <g transform="translate(10, 40)">
          {/* Object #1 fully restored and labeled */}
          <circle cx="24" cy="38" r="20" fill="url(#disk-grad)" stroke="#2dd4bf" strokeWidth="2" filter="url(#glow-teal)" />
          <circle cx="24" cy="38" r="6" fill="#042f2e" />
          <text x="24" y="41" fill="#5eead4" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">#1</text>
          
          {/* Object #2 fully restored and labeled */}
          <circle cx="62" cy="38" r="20" fill="url(#disk-grad)" stroke="#2dd4bf" strokeWidth="2" filter="url(#glow-teal)" />
          <circle cx="62" cy="38" r="6" fill="#042f2e" />
          <text x="62" y="41" fill="#5eead4" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">#2</text>
        </g>
      </g>

      {/* BOTTOM SUMMARY FOOTER */}
      <g transform="translate(20, 175)">
        <rect x="0" y="0" width="360" height="32" rx="6" fill="#041b1d" stroke="#115e59" strokeWidth="1" />
        <text x="180" y="20" fill="#99f6e4" fontSize="10" fontFamily="monospace" textAnchor="middle">
          Algorithm: Binary Inversion → Morphological Opening (A ∘ B) → 8-Connected Component Labeling
        </text>
      </g>
    </svg>
  );
};

export default MorphologyIllustration;

