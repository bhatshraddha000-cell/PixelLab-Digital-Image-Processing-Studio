import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

/**
 * HistogramViewer: Renders 256-bin intensity histograms for original and enhanced images.
 */
export const HistogramViewer = ({
  originalHist,
  enhancedHist,
  title = '256-Bin Intensity Histograms',
}) => {
  const [selectedChannel, setSelectedChannel] = useState('luminance'); // 'luminance' | 'r' | 'g' | 'b'

  const isColor = originalHist?.is_color || enhancedHist?.is_color || false;

  // Transform 256 bins into chart array
  const chartData = useMemo(() => {
    if (!originalHist || !originalHist.bins) return [];

    return originalHist.bins.map((bin) => {
      const origVal =
        selectedChannel === 'r'
          ? originalHist.r?.[bin] || 0
          : selectedChannel === 'g'
          ? originalHist.g?.[bin] || 0
          : selectedChannel === 'b'
          ? originalHist.b?.[bin] || 0
          : originalHist.luminance?.[bin] || 0;

      const enhVal =
        enhancedHist
          ? selectedChannel === 'r'
            ? enhancedHist.r?.[bin] || 0
            : selectedChannel === 'g'
            ? enhancedHist.g?.[bin] || 0
            : selectedChannel === 'b'
            ? enhancedHist.b?.[bin] || 0
            : enhancedHist.luminance?.[bin] || 0
          : 0;

      return {
        bin,
        original: origVal,
        enhanced: enhVal,
      };
    });
  }, [originalHist, enhancedHist, selectedChannel]);

  const channelColors = {
    luminance: {
      orig: '#64748b',
      enh: '#06b6d4',
      label: 'Luminance / Intensity',
    },
    r: {
      orig: '#f87171',
      enh: '#ef4444',
      label: 'Red Channel',
    },
    g: {
      orig: '#4ade80',
      enh: '#10b981',
      label: 'Green Channel',
    },
    b: {
      orig: '#60a5fa',
      enh: '#3b82f6',
      label: 'Blue Channel',
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
              onClick={() => setSelectedChannel('r')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                selectedChannel === 'r'
                  ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-red-600'
              }`}
            >
              R
            </button>
            <button
              onClick={() => setSelectedChannel('g')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                selectedChannel === 'g'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              G
            </button>
            <button
              onClick={() => setSelectedChannel('b')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                selectedChannel === 'b'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
              }`}
            >
              B
            </button>
          </div>
        )}
      </div>

      {/* Side-by-side or Dual Histograms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Original Histogram */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Original Noisy Histogram
            </span>
            <span className="text-slate-500 font-medium">Input Matrix</span>
          </div>

          <div className="h-52 w-full bg-slate-50 dark:bg-slate-950/80 rounded-xl p-2 border border-slate-200 dark:border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="origGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeTheme.orig} stopOpacity={0.6} />
                    <stop offset="95%" stopColor={activeTheme.orig} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="bin" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={31} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-2 rounded-lg bg-slate-900 text-white text-xs font-mono shadow-md border border-slate-700">
                          <div>Intensity Level: {payload[0].payload.bin}</div>
                          <div className="text-slate-300">Pixel Count: {payload[0].value}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="original"
                  stroke={activeTheme.orig}
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#origGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Enhanced Histogram */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-cyan-800 dark:text-cyan-400">
              Enhanced Output Histogram
            </span>
            <span className="text-cyan-700 dark:text-cyan-400 font-medium">Gaussian + Gamma</span>
          </div>

          <div className="h-52 w-full bg-slate-50 dark:bg-slate-950/80 rounded-xl p-2 border border-slate-200 dark:border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="enhGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeTheme.enh} stopOpacity={0.7} />
                    <stop offset="95%" stopColor={activeTheme.enh} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="bin" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={31} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-2 rounded-lg bg-slate-900 text-white text-xs font-mono shadow-md border border-cyan-700">
                          <div>Intensity Level: {payload[0].payload.bin}</div>
                          <div className="text-cyan-300">Pixel Count: {payload[0].value}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="enhanced"
                  stroke={activeTheme.enh}
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#enhGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HistogramViewer;

