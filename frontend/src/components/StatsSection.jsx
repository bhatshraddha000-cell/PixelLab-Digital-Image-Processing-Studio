import React from 'react';
import { Layers, Grid3X3, LayoutDashboard, Cpu } from 'lucide-react';

export const StatsSection = () => {
  const stats = [
    {
      value: '04',
      label: 'Processing Modules',
      detail: 'Independent algorithmic laboratories',
      icon: Layers,
      accent: 'text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/10',
    },
    {
      value: '04',
      label: 'Image Processing Domains',
      detail: 'From spatial filtering to geometric inference',
      icon: Grid3X3,
      accent: 'text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10',
    },
    {
      value: '01',
      label: 'Unified Workspace',
      detail: 'Consistent interactive experimentation canvas',
      icon: LayoutDashboard,
      accent: 'text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10',
    },
    {
      value: 'Multiple',
      label: 'Experimental Techniques',
      detail: 'Gaussian, Gamma, Watershed & Descriptors',
      icon: Cpu,
      accent: 'text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10',
    },
  ];

  return (
    <section className="py-10 border-y border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-navy-950/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative p-5 rounded-2xl bg-white dark:bg-navy-900/50 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl border ${item.accent}`}>
                    <Icon className="w-5 h-5 text-current" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">
                    METRIC 0{idx + 1}
                  </span>
                </div>

                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {item.value}
                </div>

                <div className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                  {item.label}
                </div>

                <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-1 font-medium">
                  {item.detail}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
