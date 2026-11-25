import React, { useState } from 'react';
import { Check, Eye, X, Image as ImageIcon, Camera, Cpu, Info } from 'lucide-react';

/**
 * SampleGallery: Reusable, responsive sample image gallery component
 * Supports thumbnails, selection highlighting, verified ground-truth badges,
 * real-world vs synthetic distinction, loading/error states, and full preview modal.
 */
export const SampleGallery = ({
  samples = [],
  selectedId,
  onSelect,
  loading = false,
  accentColor = 'teal', // 'teal' | 'cyan' | 'amber' | 'blue'
  emptyMessage = 'No sample images available.',
}) => {
  const [previewSample, setPreviewSample] = useState(null);
  const [failedImages, setFailedImages] = useState({});

  const accentStyles = {
    teal: {
      selected: 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 ring-2 ring-teal-500/30',
      badge: 'bg-teal-600 text-white',
      icon: 'text-teal-600 dark:text-teal-400',
      hover: 'hover:border-teal-400 dark:hover:border-teal-600',
    },
    cyan: {
      selected: 'border-cyan-500 bg-cyan-50/70 dark:bg-cyan-950/40 ring-2 ring-cyan-500/30',
      badge: 'bg-cyan-600 text-white',
      icon: 'text-cyan-600 dark:text-cyan-400',
      hover: 'hover:border-cyan-400 dark:hover:border-cyan-600',
    },
    amber: {
      selected: 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 ring-2 ring-amber-500/30',
      badge: 'bg-amber-600 text-white',
      icon: 'text-amber-600 dark:text-amber-400',
      hover: 'hover:border-amber-400 dark:hover:border-amber-600',
    },
    blue: {
      selected: 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/30',
      badge: 'bg-blue-600 text-white',
      icon: 'text-blue-600 dark:text-blue-400',
      hover: 'hover:border-blue-400 dark:hover:border-blue-600',
    },
  };

  const theme = accentStyles[accentColor] || accentStyles.teal;

  if (loading) {
    return (
      <div className="space-y-2.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center space-x-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 animate-pulse"
          >
            <div className="w-16 h-12 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-2.5 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!samples || samples.length === 0) {
    return (
      <div className="p-6 text-center text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {samples.map((s) => {
          const isSelected = selectedId === s.id;
          const imgFailed = failedImages[s.id];
          const isRealPhoto = s.imageType === 'photograph' || s.isRealPhoto === true;

          return (
            <div
              key={s.id}
              onClick={() => onSelect && onSelect(s)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect && onSelect(s);
                }
              }}
              className={`group relative w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                isSelected
                  ? theme.selected
                  : `border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 ${theme.hover}`
              }`}
            >
              {/* Thumbnail */}
              <div className="relative w-16 h-14 rounded-lg overflow-hidden bg-slate-900 border border-slate-300 dark:border-slate-700 shrink-0 flex items-center justify-center">
                {imgFailed ? (
                  <div className="flex flex-col items-center justify-center text-slate-500 p-1">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-[8px] font-mono">Error</span>
                  </div>
                ) : (
                  <img
                    src={s.previewUrl}
                    alt={s.name}
                    loading="lazy"
                    onError={() => setFailedImages((prev) => ({ ...prev, [s.id]: true }))}
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  type="button"
                  title="Preview full image & metadata"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewSample(s);
                  }}
                  className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-1.5">
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-1">
                    {s.name}
                  </div>
                  {isSelected && <Check className={`w-4 h-4 shrink-0 ${theme.icon}`} />}
                </div>

                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono">
                  <span
                    className={`px-1.5 py-0.5 rounded font-semibold inline-flex items-center gap-1 ${
                      isRealPhoto
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isRealPhoto ? <Camera className="w-2.5 h-2.5" /> : <Cpu className="w-2.5 h-2.5" />}
                    <span>{isRealPhoto ? 'Real Photo' : 'Synthetic'}</span>
                  </span>

                  {s.dimensions && (
                    <span className="text-slate-500 dark:text-slate-400">
                      {s.dimensions}
                    </span>
                  )}

                  {s.manualCount !== undefined && s.manualCount !== null && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                      GT: {s.manualCount}
                    </span>
                  )}

                  {s.expectedCategory && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold uppercase">
                      {s.expectedCategory}
                    </span>
                  )}
                </div>

                {s.description && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-tight">
                    {s.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      {previewSample && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setPreviewSample(null)}
        >
          <div
            className="relative max-w-2xl w-full rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {previewSample.name}
                </h4>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {previewSample.filename} • {previewSample.dimensions}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSample(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 flex items-center justify-center p-4 max-h-[55vh] overflow-hidden">
              <img
                src={previewSample.previewUrl}
                alt={previewSample.name}
                className="max-h-[48vh] w-auto object-contain rounded-lg"
              />
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {previewSample.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 block">Source Type</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {previewSample.isRealPhoto || previewSample.imageType === 'photograph'
                      ? 'Real-World Photograph'
                      : 'Synthetic Benchmark'}
                  </span>
                </div>
                {previewSample.license && (
                  <div>
                    <span className="text-slate-500 block">License</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {previewSample.license}
                    </span>
                  </div>
                )}
                {previewSample.manualCount !== undefined && previewSample.manualCount !== null && (
                  <div>
                    <span className="text-slate-500 block">Verified Count</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {previewSample.manualCount} objects
                    </span>
                  </div>
                )}
                {previewSample.expectedCategory && (
                  <div>
                    <span className="text-slate-500 block">Verified Class</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 uppercase">
                      {previewSample.expectedCategory}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewSample(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelect && onSelect(previewSample);
                    setPreviewSample(null);
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold ${theme.badge}`}
                >
                  Select Sample
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SampleGallery;

