import React, { useState } from 'react';
import { Eye, Sliders, Scissors, Cpu, ArrowRight, Sparkles } from 'lucide-react';

export const HeroPipeline = () => {
  const [activeStage, setActiveStage] = useState(0);

  const stages = [
    {
      title: 'Original Image',
      subtitle: 'Raw sensor acquisition',
      tag: 'Input Matrix',
      icon: Eye,
      color: 'from-blue-500 to-indigo-500',
      accent: 'border-blue-500/50 text-blue-400 bg-blue-500/10',
      description: 'Raw grayscale & RGB capture with sensor noise, uneven illumination and touching targets.',
      previewType: 'raw',
    },
    {
      title: 'Image Filtering',
      subtitle: 'Smoothing & γ-Contrast',
      tag: 'Spatial & Intensity',
      icon: Sliders,
      color: 'from-cyan-500 to-blue-500',
      accent: 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10',
      description: 'Gaussian kernel convolution suppresses high-frequency noise while gamma transformation expands dynamic range.',
      previewType: 'filtered',
    },
    {
      title: 'Segmentation',
      subtitle: 'Watershed & Morphology',
      tag: 'Object Isolation',
      icon: Scissors,
      color: 'from-violet-500 to-purple-500',
      accent: 'border-violet-500/50 text-violet-400 bg-violet-500/10',
      description: 'Distance transforms and topological ridge detection carve clean boundaries separating clustered objects.',
      previewType: 'segmented',
    },
    {
      title: 'Analysis',
      subtitle: 'Geometrical Descriptors',
      tag: 'Decision Matrix',
      icon: Cpu,
      color: 'from-amber-500 to-emerald-500',
      accent: 'border-amber-500/50 text-amber-400 bg-amber-500/10',
      description: 'Automatic feature extraction: Area, perimeter, circularity, compactness, and geometric classification.',
      previewType: 'analyzed',
    },
  ];

  return (
    <div className="relative rounded-2xl bg-slate-900/90 dark:bg-navy-900/95 border border-slate-700/60 dark:border-slate-800 shadow-2xl p-6 backdrop-blur-xl">
      {/* Decorative top header bar */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          <span className="ml-2 text-xs font-mono text-slate-400 tracking-wider">PIPELINE EXECUTION ARCHITECTURE</span>
        </div>
        <div className="flex items-center space-x-1.5 text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Model</span>
        </div>
      </div>

      {/* Interactive stage selector cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = activeStage === idx;
          return (
            <button
              key={stage.title}
              onClick={() => setActiveStage(idx)}
              className={`text-left p-3 rounded-xl transition-all duration-300 relative border ${
                isActive
                  ? `${stage.accent} shadow-lg ring-1 ring-cyan-500/30 scale-[1.02]`
                  : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono tracking-wider font-semibold opacity-70">
                  PHASE 0{idx + 1}
                </span>
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-current' : 'text-slate-500'}`} />
              </div>
              <div className="text-xs font-semibold truncate text-slate-200">{stage.title}</div>
              <div className="text-[10px] text-slate-400 truncate">{stage.subtitle}</div>
            </button>
          );
        })}
      </div>

      {/* Dynamic Graphic Pipeline Viewport */}
      <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 p-4 min-h-[220px] flex flex-col justify-between">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none"></div>

        {/* Dynamic Display based on activeStage */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-2">
          {activeStage === 0 && (
            <div className="w-full flex flex-col items-center">
              <svg viewBox="0 0 320 120" className="w-full max-w-xs h-28" fill="none">
                <circle cx="100" cy="60" r="34" fill="#334155" opacity="0.6" />
                <circle cx="140" cy="60" r="34" fill="#334155" opacity="0.6" />
                <circle cx="210" cy="60" r="28" fill="#1e293b" opacity="0.8" />
                {/* Simulated Noise overlay */}
                <g opacity="0.4" fill="#94a3b8">
                  {[...Array(60)].map((_, i) => (
                    <circle key={i} cx={(i * 19) % 310 + 5} cy={(i * 29) % 110 + 5} r={(i % 2 === 0 ? 1 : 1.5)} />
                  ))}
                </g>
                <text x="160" y="112" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">
                  Raw Sensor Grid with Salt-and-Pepper Artifacts
                </text>
              </svg>
            </div>
          )}

          {activeStage === 1 && (
            <div className="w-full flex flex-col items-center">
              <svg viewBox="0 0 320 120" className="w-full max-w-xs h-28" fill="none">
                {/* Filtered objects with smooth Gaussian gradient */}
                <circle cx="100" cy="60" r="34" fill="#0284c7" fillOpacity="0.35" stroke="#38bdf8" strokeWidth="1.5" />
                <circle cx="140" cy="60" r="34" fill="#0284c7" fillOpacity="0.35" stroke="#38bdf8" strokeWidth="1.5" />
                <circle cx="210" cy="60" r="28" fill="#0ea5e9" fillOpacity="0.5" stroke="#38bdf8" strokeWidth="1.5" />
                {/* 5x5 Kernel Convolution stencil representation */}
                <rect x="180" y="30" width="28" height="28" stroke="#22d3ee" strokeWidth="1.5" fill="#0891b2" fillOpacity="0.25" strokeDasharray="2 2" />
                <path d="M 40 100 Q 160 50 280 20" stroke="#06b6d4" strokeWidth="2" strokeDasharray="3 3" />
                <text x="160" y="112" fill="#22d3ee" fontSize="10" fontFamily="monospace" textAnchor="middle">
                  Gaussian Blur Convolution + Gamma Power-Law Stretch
                </text>
              </svg>
            </div>
          )}

          {activeStage === 2 && (
            <div className="w-full flex flex-col items-center">
              <svg viewBox="0 0 320 120" className="w-full max-w-xs h-28" fill="none">
                {/* Separated coin basins */}
                <circle cx="95" cy="60" r="30" fill="#6366f1" fillOpacity="0.3" stroke="#818cf8" strokeWidth="2" />
                <circle cx="145" cy="60" r="30" fill="#a855f7" fillOpacity="0.3" stroke="#c084fc" strokeWidth="2" />
                <circle cx="215" cy="60" r="28" fill="#10b981" fillOpacity="0.3" stroke="#34d399" strokeWidth="2" />
                {/* Watershed separating dam */}
                <line x1="120" y1="20" x2="120" y2="100" stroke="#f43f5e" strokeWidth="3" strokeDasharray="3 2" />
                <text x="120" y="15" fill="#fda4af" fontSize="8" fontFamily="monospace" textAnchor="middle">Dam Ridge</text>
                <text x="160" y="112" fill="#c084fc" fontSize="10" fontFamily="monospace" textAnchor="middle">
                  Morphological & Watershed Basin Partitioning
                </text>
              </svg>
            </div>
          )}

          {activeStage === 3 && (
            <div className="w-full flex flex-col items-center">
              <svg viewBox="0 0 320 120" className="w-full max-w-xs h-28" fill="none">
                {/* Labeled bounding boxes and metrics */}
                <rect x="65" y="30" width="60" height="60" stroke="#fbbf24" strokeWidth="1.2" strokeDasharray="2 2" />
                <circle cx="95" cy="60" r="28" fill="#f59e0b" fillOpacity="0.3" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="95" y="24" fill="#fbbf24" fontSize="8" fontFamily="monospace" textAnchor="middle">Coin [C:0.99]</text>

                <rect x="140" y="32" width="55" height="55" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="2 2" />
                <rect x="145" y="37" width="45" height="45" fill="#0284c7" fillOpacity="0.3" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="167" y="24" fill="#38bdf8" fontSize="8" fontFamily="monospace" textAnchor="middle">Square [R:1.0]</text>

                <text x="160" y="112" fill="#34d399" fontSize="10" fontFamily="monospace" textAnchor="middle">
                  Geometrical Feature Vectors (Area, Perimeter, Circularity)
                </text>
              </svg>
            </div>
          )}
        </div>

        {/* Informative stage caption */}
        <div className="relative z-10 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="font-mono text-cyan-400 font-medium">{stages[activeStage].tag}:</span>
            <span className="text-slate-400 hidden sm:inline">{stages[activeStage].description}</span>
          </div>
          <button
            onClick={() => setActiveStage((prev) => (prev + 1) % stages.length)}
            className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 font-mono text-xs pl-2 whitespace-nowrap"
          >
            <span>Next Stage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroPipeline;

