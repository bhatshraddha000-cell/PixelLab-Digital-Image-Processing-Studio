import React, { useState, useRef, useCallback } from 'react';

/**
 * ImageSplitSlider: Interactive before/after split comparison slider
 */
export const ImageSplitSlider = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Original Noisy',
  afterLabel = 'Enhanced Output',
  className = '',
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

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
      style={{ touchAction: 'none' }}
    >
      {/* Background (After / Enhanced Image) */}
      <img
        src={afterImage}
        alt={afterLabel}
        className="w-full h-full object-contain pointer-events-none"
      />
      <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-slate-900/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold backdrop-blur-md">
        {afterLabel}
      </div>

      {/* Foreground (Before / Original Image) with dynamic clip-path */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="w-full h-full object-contain pointer-events-none"
        />
        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-700 text-slate-300 text-xs font-mono font-semibold backdrop-blur-md">
          {beforeLabel}
        </div>
      </div>

      {/* Divider Line & Handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 pointer-events-none shadow-[0_0_10px_rgba(6,182,212,0.8)]"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-cyan-400 text-slate-950 border-2 border-white flex items-center justify-center shadow-lg font-bold text-xs">
          ↔
        </div>
      </div>
    </div>
  );
};

export default ImageSplitSlider;

