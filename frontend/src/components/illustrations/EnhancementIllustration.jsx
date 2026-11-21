import React from 'react';

export const EnhancementIllustration = ({ className = "w-full h-48" }) => {
  return (
    <svg viewBox="0 0 400 220" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Gradients */}
        <linearGradient id="enh-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="gamma-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
        <filter id="noise-effect">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.45 0"/>
        </filter>
        <clipPath id="left-clip">
          <rect x="20" y="20" width="175" height="180" rx="8" />
        </clipPath>
        <clipPath id="right-clip">
          <rect x="205" y="20" width="175" height="180" rx="8" />
        </clipPath>
      </defs>

      {/* Background card */}
      <rect width="400" height="220" rx="12" fill="url(#enh-bg)" stroke="#334155" strokeWidth="1" />

      {/* Grid lines */}
      <g stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4">
        <line x1="20" y1="65" x2="380" y2="65" />
        <line x1="20" y1="110" x2="380" y2="110" />
        <line x1="20" y1="155" x2="380" y2="155" />
      </g>

      {/* LEFT PANEL: Raw / Noisy image */}
      <g clipPath="url(#left-clip)">
        <rect x="20" y="20" width="175" height="180" fill="#090d16" />
        {/* Dim low-contrast object */}
        <circle cx="105" cy="100" r="42" fill="#334155" opacity="0.8" />
        <circle cx="105" cy="100" r="26" fill="#1e293b" />
        {/* Noise overlay */}
        <rect x="20" y="20" width="175" height="180" filter="url(#noise-effect)" opacity="0.75" />
        {/* Badge */}
        <rect x="30" y="30" width="68" height="18" rx="4" fill="#0f172a" fillOpacity="0.9" stroke="#475569" strokeWidth="1" />
        <text x="64" y="42" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle">NOISY RAW</text>
      </g>

      {/* CENTER SEPARATOR SCAN LINE */}
      <line x1="200" y1="20" x2="200" y2="200" stroke="#06b6d4" strokeWidth="2" strokeDasharray="3 3" opacity="0.9" />
      <circle cx="200" cy="110" r="9" fill="#06b6d4" fillOpacity="0.2" stroke="#22d3ee" strokeWidth="1.5" />
      <path d="M197 110L203 110M200 107L200 113" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />

      {/* RIGHT PANEL: Filtered + Gamma Enhanced image */}
      <g clipPath="url(#right-clip)">
        <rect x="205" y="20" width="175" height="180" fill="#0c1322" />
        {/* Crisp enhanced object with vibrant contrast */}
        <circle cx="295" cy="100" r="42" fill="#0284c7" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="2" />
        <circle cx="295" cy="100" r="26" fill="#0ea5e9" fillOpacity="0.7" />
        {/* Gaussian kernel indicator grid */}
        <g stroke="#38bdf8" strokeWidth="1" opacity="0.4">
          <circle cx="295" cy="100" r="54" strokeDasharray="3 3" />
        </g>
        {/* Badge */}
        <rect x="285" y="30" width="85" height="18" rx="4" fill="#0c4a6e" fillOpacity="0.8" stroke="#0284c7" strokeWidth="1" />
        <text x="327" y="42" fill="#38bdf8" fontSize="9" fontFamily="monospace" textAnchor="middle">GAUSSIAN + γ</text>
      </g>

      {/* BOTTOM HISTOGRAM & TRANSFER CURVE OVERLAYS */}
      {/* Left histogram (compressed, low contrast) */}
      <g transform="translate(30, 160)">
        <rect x="0" y="0" width="150" height="32" rx="4" fill="#0a0f1d" fillOpacity="0.9" stroke="#334155" strokeWidth="1" />
        <rect x="55" y="18" width="6" height="10" fill="#64748b" />
        <rect x="64" y="10" width="6" height="18" fill="#64748b" />
        <rect x="73" y="6" width="6" height="22" fill="#64748b" />
        <rect x="82" y="12" width="6" height="16" fill="#64748b" />
        <rect x="91" y="20" width="6" height="8" fill="#64748b" />
        <text x="8" y="20" fill="#64748b" fontSize="8" fontFamily="monospace">f(x,y)</text>
      </g>

      {/* Right histogram (expanded dynamic range with gamma curve) */}
      <g transform="translate(220, 160)">
        <rect x="0" y="0" width="150" height="32" rx="4" fill="#0a0f1d" fillOpacity="0.9" stroke="#0284c7" strokeWidth="1" />
        {/* Balanced spread histogram */}
        <rect x="20" y="20" width="5" height="8" fill="#0284c7" />
        <rect x="35" y="14" width="5" height="14" fill="#0ea5e9" />
        <rect x="50" y="8" width="5" height="20" fill="#38bdf8" />
        <rect x="75" y="12" width="5" height="16" fill="#38bdf8" />
        <rect x="100" y="16" width="5" height="12" fill="#0ea5e9" />
        <rect x="120" y="10" width="5" height="18" fill="#0284c7" />
        {/* Gamma curve s = c * r^gamma */}
        <path d="M10 26 Q 60 22 135 6" stroke="url(#gamma-grad)" strokeWidth="2" fill="none" />
        <text x="100" y="28" fill="#22d3ee" fontSize="8" fontFamily="monospace">s = c·r^γ</text>
      </g>
    </svg>
  );
};

export default EnhancementIllustration;

