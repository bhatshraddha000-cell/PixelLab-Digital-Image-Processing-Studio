import React, { useState } from 'react';
import HistogramChart from './HistogramChart';

/**
 * HistogramViewer: Renders 256-bin continuous unfilled line histograms
 * for original and enhanced images using the shared HistogramChart component.
 */
export const HistogramViewer = ({
  originalHist,
  enhancedHist,
  title = '256-Bin Intensity Histograms',
}) => {
  const [selectedChannel, setSelectedChannel] = useState('luminance'); // 'luminance' | 'r' | 'g' | 'b'

  const isColor = originalHist?.is_color || enhancedHist?.is_color || false;

  const channelColors = {
    luminance: {
      orig: '#f59e0b', // Amber for input noisy
      enh: '#06b6d4',  // Cyan for enhanced output
    },
    r: {
      orig: '#fb7185',
      enh: '#dc2626',
    },
    g: {
      orig: '#34d399',
      enh: '#059669',
    },
    b: {
      orig: '#60a5fa',
      enh: '#2563eb',
    },
  };

  const activeTheme = channelColors[selectedChannel] || channelColors.luminance;

  if (!originalHist || !originalHist.bins) {
    return (
      <div className="p-8 text-center text-xs font-mono text-slate-500 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        Run an enhancement experiment to view 256-bin intensity histograms.
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
      {/* Header and Channel Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            {title}
          </h4>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Comparing discrete pixel distributions across 256 quantization levels (0–255)
          </span>
        </div>

        {/* Channel Selector Buttons */}
        {isColor && (
          <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setSelectedChannel('luminance')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                selectedChannel === 'luminance'
                  ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Luminance
            </button>
            <button
              type="button"
              onClick={() => setSelectedChannel('r')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                selectedChannel === 'r'
                  ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-red-600'
              }`}
            >
              Red
            </button>
            <button
              type="button"
              onClick={() => setSelectedChannel('g')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                selectedChannel === 'g'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              Green
            </button>
            <button
              type="button"
              onClick={() => setSelectedChannel('b')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                selectedChannel === 'b'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
              }`}
            >
              Blue
            </button>
          </div>
        )}
      </div>

      {/* Dual 256-Bin Vertical Bar Histograms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HistogramChart
          histogram={originalHist}
          title="Original Noisy Histogram"
          subtitle="Input Matrix — Raw Pixel Intensities"
          xLabel="Gray Level"
          yLabel="Pixel Count"
          primaryLabel="Original"
          channel={selectedChannel}
        />

        <HistogramChart
          histogram={enhancedHist}
          title="Enhanced Output Histogram"
          subtitle="Gaussian Smoothing + Gamma Transformation"
          xLabel="Gray Level"
          yLabel="Pixel Count"
          primaryLabel="Enhanced"
          channel={selectedChannel}
        />
      </div>
    </div>
  );
};

export default HistogramViewer;
