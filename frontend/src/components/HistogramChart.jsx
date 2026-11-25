import React, { useMemo, useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

/**
 * HistogramChart: Traditional MATLAB/OpenCV-style 256-bin vertical bar histogram.
 * Uses Recharts BarChart & Bar across all 256 intensity levels (0-255),
 * preserving zero-frequency bins without smoothing, rounding, or area fills.
 */
export const HistogramChart = ({
  histogram,
  title = 'Pixel Intensity Histogram',
  subtitle = '256 quantization levels (0–255)',
  xLabel = 'Gray Level',
  yLabel = 'Pixel Count',
  barColor,
  primaryLabel = 'Pixel Count',
  channel: controlledChannel,
  onChannelChange,
  showChannelSelector = false,
  loading = false,
  emptyMessage = 'Process an image to compute 256-bin pixel intensity histogram.',
  heightClass = 'h-56',
}) => {
  const [internalChannel, setInternalChannel] = useState('luminance');
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const activeChannel = controlledChannel ?? internalChannel;

  const handleChannelSelect = (ch) => {
    if (onChannelChange) {
      onChannelChange(ch);
    } else {
      setInternalChannel(ch);
    }
  };

  const isColor = Boolean(histogram?.is_color);

  const extractChannelArray = (histObj, ch) => {
    if (!histObj) return null;
    if (ch === 'r' && Array.isArray(histObj.r)) return histObj.r;
    if (ch === 'g' && Array.isArray(histObj.g)) return histObj.g;
    if (ch === 'b' && Array.isArray(histObj.b)) return histObj.b;
    if (Array.isArray(histObj.luminance)) return histObj.luminance;
    if (Array.isArray(histObj.counts)) return histObj.counts;
    return null;
  };

  // Build exact 256-bin array (0..255), preserving every zero-frequency bin
  const { chartData, maxCount } = useMemo(() => {
    const primaryArr = extractChannelArray(histogram, activeChannel);
    if (!primaryArr || primaryArr.length === 0) {
      return { chartData: [], maxCount: 0 };
    }

    const bins =
      Array.isArray(histogram?.bins) && histogram.bins.length === 256
        ? histogram.bins
        : Array.from({ length: 256 }, (_, idx) => idx);

    let peak = 0;
    const rows = bins.map((bin, idx) => {
      const val = Number(primaryArr[idx] ?? 0);
      if (val > peak) peak = val;
      return {
        bin,
        value: val,
      };
    });

    return { chartData: rows, maxCount: peak };
  }, [histogram, activeChannel]);

  const effectiveBarColor = useMemo(() => {
    if (activeChannel === 'r') return isDark ? '#f87171' : '#dc2626';
    if (activeChannel === 'g') return isDark ? '#34d399' : '#059669';
    if (activeChannel === 'b') return isDark ? '#60a5fa' : '#2563eb';
    if (barColor) return barColor;
    return isDark ? '#22d3ee' : '#1e3a8a'; // Bright cyan in dark mode, dark navy in light mode
  }, [activeChannel, barColor, isDark]);

  const axisTickColor = isDark ? '#cbd5e1' : '#334155';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.20)' : 'rgba(100, 116, 139, 0.25)';

  const totalPixels = histogram?.totalPixels ?? histogram?.total_pixels ?? null;
  const yDomainMax = maxCount > 0 ? Math.ceil(maxCount * 1.08) : 100;

  if (loading) {
    return (
      <div className="p-5 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-44 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className={`${heightClass} w-full bg-slate-100 dark:bg-slate-900/60 rounded-lg animate-pulse flex items-center justify-center text-xs font-mono text-slate-400`}>
          Calculating 256-bin histogram...
        </div>
      </div>
    );
  }

  if (!histogram || chartData.length === 0) {
    return (
      <div className="p-6 text-center text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h5 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
            {title}
          </h5>
          {subtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showChannelSelector && isColor && (
            <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono">
              {[
                { id: 'luminance', label: 'Lum', activeClass: 'text-cyan-700 dark:text-cyan-400' },
                { id: 'r', label: 'R', activeClass: 'text-red-600 dark:text-red-400' },
                { id: 'g', label: 'G', activeClass: 'text-emerald-600 dark:text-emerald-400' },
                { id: 'b', label: 'B', activeClass: 'text-blue-600 dark:text-blue-400' },
              ].map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleChannelSelect(ch.id)}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                    activeChannel === ch.id
                      ? `bg-white dark:bg-slate-800 shadow-sm ${ch.activeClass}`
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          )}

          {totalPixels !== null && (
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              N={totalPixels.toLocaleString()} px
            </span>
          )}
        </div>
      </div>

      {/* Traditional 256-Bin Vertical Bar Chart */}
      <div className={`${heightClass} w-full bg-white dark:bg-slate-950 rounded-xl p-2 sm:p-3 border border-slate-200 dark:border-slate-800`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 12, left: 0, bottom: 16 }}
            barCategoryGap={0}
            barGap={0}
          >
            <CartesianGrid
              strokeDasharray="2 3"
              stroke={gridColor}
              vertical={false}
            />
            <XAxis
              dataKey="bin"
              type="number"
              domain={[0, 255]}
              ticks={[0, 50, 100, 150, 200, 250]}
              tick={{ fontSize: 10, fill: axisTickColor, fontFamily: 'monospace' }}
              stroke={axisTickColor}
              label={{
                value: xLabel,
                position: 'insideBottom',
                offset: -10,
                fontSize: 10,
                fill: axisTickColor,
                fontFamily: 'monospace',
              }}
            />
            <YAxis
              domain={[0, yDomainMax]}
              tick={{ fontSize: 10, fill: axisTickColor, fontFamily: 'monospace' }}
              stroke={axisTickColor}
              width={52}
              label={{
                value: yLabel,
                angle: -90,
                position: 'insideLeft',
                offset: 12,
                fontSize: 10,
                fill: axisTickColor,
                fontFamily: 'monospace',
                style: { textAnchor: 'middle' },
              }}
            />
            <Tooltip
              cursor={{ fill: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(30, 58, 138, 0.08)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const bin = payload[0]?.payload?.bin;
                  const val = Number(payload[0]?.value ?? 0);
                  const pct = totalPixels
                    ? ` (${((val / totalPixels) * 100).toFixed(2)}%)`
                    : '';
                  return (
                    <div className="p-2.5 rounded-lg bg-slate-900/95 text-white text-xs font-mono shadow-lg border border-slate-700 space-y-1">
                      <div className="font-bold text-slate-200">
                        Gray Level: {bin}
                      </div>
                      <div className="flex items-center justify-between gap-3 text-cyan-300">
                        <span>{primaryLabel}:</span>
                        <span className="font-semibold">
                          {val.toLocaleString()} px{pct}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="value"
              name={primaryLabel}
              fill={effectiveBarColor}
              radius={[0, 0, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HistogramChart;
