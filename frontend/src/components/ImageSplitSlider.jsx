import React, { useState, useRef, useCallback } from 'react';
import { SplitSquareVertical, AlertTriangle, ImageIcon, Sparkles } from 'lucide-react';

/**
 * ImageSplitSlider: Universal interactive before/after split comparison slider.
 * Fully compatible with before/after, left/right, and original/processed prop conventions.
 * Features graceful empty states, single-image preview, and broken image recovery.
 */
export const ImageSplitSlider = ({
  // Image sources (supports multiple prop conventions)
  beforeImage,
  afterImage,
  leftImage,
  rightImage,
  originalImage,
  processedImage,

  // Labels (supports multiple prop conventions)
  beforeLabel,
  afterLabel,
  leftLabel,
  rightLabel,
  originalLabel,
  processedLabel,

  // Theming and styling
  theme = 'cyan', // 'cyan' | 'teal' | 'violet' | 'amber' | 'emerald'
  className = '',
  aspectRatio = 'auto',
  emptyMessage = 'Select a sample or upload an image to begin comparison',
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [beforeImgError, setBeforeImgError] = useState(false);
  const [afterImgError, setAfterImgError] = useState(false);
  const containerRef = useRef(null);

  // Normalize image sources across prop conventions
  const sourceBefore = beforeImage || leftImage || originalImage || null;
  const sourceAfter = afterImage || rightImage || processedImage || null;

  // Normalize labels across prop conventions
  const resolvedBeforeLabel = beforeLabel || leftLabel || originalLabel || 'Original Image';
  const resolvedAfterLabel = afterLabel || rightLabel || processedLabel || 'Processed Result';

  // Theme configuration
  const themeStyles = {
    cyan: {
      line: 'bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]',
      handle: 'bg-cyan-400 text-slate-950 border-white shadow-cyan-500/50',
      badge: 'border-cyan-500/40 text-cyan-300',
    },
    teal: {
      line: 'bg-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.8)]',
      handle: 'bg-teal-400 text-slate-950 border-white shadow-teal-500/50',
      badge: 'border-teal-500/40 text-teal-300',
    },
    violet: {
      line: 'bg-violet-400 shadow-[0_0_12px_rgba(168,85,247,0.8)]',
      handle: 'bg-violet-400 text-slate-950 border-white shadow-violet-500/50',
      badge: 'border-violet-500/40 text-violet-300',
    },
    amber: {
      line: 'bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.8)]',
      handle: 'bg-amber-400 text-slate-950 border-white shadow-amber-500/50',
      badge: 'border-amber-500/40 text-amber-300',
    },
    emerald: {
      line: 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]',
      handle: 'bg-emerald-400 text-slate-950 border-white shadow-emerald-500/50',
      badge: 'border-emerald-500/40 text-emerald-300',
    },
  };

  const activeTheme = themeStyles[theme] || themeStyles.cyan;

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  }, []);

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => setIsDragging(false);

  // CASE 1: Completely empty state (neither image provided)
  if (!sourceBefore && !sourceAfter) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-900/60 dark:bg-slate-950 border-2 border-dashed border-slate-700/60 text-center select-none ${className}`}
        style={{ minHeight: '300px' }}
      >
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-3 text-slate-400">
          <SplitSquareVertical className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-200">Comparison Workspace Awaiting Image</h4>
        <p className="text-xs text-slate-400 max-w-sm mt-1">{emptyMessage}</p>
      </div>
    );
  }

  // CASE 2: Single image state (only original is provided, awaiting processing)
  const isSingleView = (sourceBefore && !sourceAfter) || (!sourceBefore && sourceAfter);
  const singleImageSrc = sourceBefore || sourceAfter;
  const singleImageLabel = sourceBefore ? resolvedBeforeLabel : resolvedAfterLabel;

  if (isSingleView) {
    return (
      <div
        className={`relative select-none overflow-hidden rounded-2xl bg-slate-950 border border-slate-700/80 flex items-center justify-center ${className}`}
        style={{ minHeight: '320px' }}
      >
        {beforeImgError || afterImgError ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
            <p className="text-xs font-bold text-slate-300">Image Asset Unreachable</p>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">{singleImageSrc}</p>
          </div>
        ) : (
          <>
            <img
              src={singleImageSrc}
              alt={singleImageLabel}
              onError={() => setBeforeImgError(true)}
              className="max-h-full max-w-full w-auto h-auto object-contain rounded-lg"
            />
            {/* Badges */}
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-slate-900/85 border border-slate-700 text-slate-200 text-xs font-mono font-semibold backdrop-blur-md">
              {singleImageLabel}
            </div>
            <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-slate-900/90 border border-amber-500/50 text-amber-300 text-[11px] font-mono flex items-center space-x-1.5 backdrop-blur-md shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Awaiting algorithm execution</span>
            </div>
          </>
        )}
      </div>
    );
  }

  // CASE 3: Dual Image interactive split slider
  return (
    <div
      ref={containerRef}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={handleMouseUp}
      onTouchMove={handleTouchMove}
      className={`relative select-none overflow-hidden rounded-2xl bg-slate-950 border border-slate-700/80 cursor-ew-resize ${className}`}
      style={{ touchAction: 'none', minHeight: '320px' }}
    >
      {/* Background Layer: After / Processed Image */}
      {afterImgError ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-400 bg-slate-900">
          <AlertTriangle className="w-6 h-6 text-amber-400 mb-1" />
          <span className="text-xs font-mono">Processed Output Unavailable</span>
        </div>
      ) : (
        <img
          src={sourceAfter}
          alt={resolvedAfterLabel}
          onError={() => setAfterImgError(true)}
          className="w-full h-full object-contain pointer-events-none"
        />
      )}
      <div
        className={`absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-slate-900/85 border ${activeTheme.badge} text-xs font-mono font-semibold backdrop-blur-md z-10`}
      >
        {resolvedAfterLabel}
      </div>

      {/* Foreground Layer: Before / Original Image with dynamic clip-path */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        {beforeImgError ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-400 bg-slate-950">
            <AlertTriangle className="w-6 h-6 text-amber-400 mb-1" />
            <span className="text-xs font-mono">Original Image Unavailable</span>
          </div>
        ) : (
          <img
            src={sourceBefore}
            alt={resolvedBeforeLabel}
            onError={() => setBeforeImgError(true)}
            className="w-full h-full object-contain pointer-events-none"
          />
        )}
        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-slate-900/85 border border-slate-700 text-slate-300 text-xs font-mono font-semibold backdrop-blur-md z-10">
          {resolvedBeforeLabel}
        </div>
      </div>

      {/* Divider Line & Interactive Handle */}
      <div
        className={`absolute top-0 bottom-0 w-0.5 ${activeTheme.line} pointer-events-none z-20`}
        style={{ left: `${sliderPosition}%` }}
      >
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full ${activeTheme.handle} border-2 flex items-center justify-center shadow-lg font-bold text-xs select-none`}
        >
          ↔
        </div>
      </div>
    </div>
  );
};

export default ImageSplitSlider;
