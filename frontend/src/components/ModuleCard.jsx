import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const ModuleCard = ({
  id,
  number,
  title,
  description,
  tags,
  route,
  illustration: Illustration,
  themeColor = 'cyan',
}) => {
  const colorThemes = {
    cyan: {
      tag: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/40',
      borderHover: 'hover:border-cyan-400 dark:hover:border-cyan-500/50',
      btn: 'text-cyan-700 dark:text-cyan-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-300',
      num: 'text-cyan-600 dark:text-cyan-400',
    },
    teal: {
      tag: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/40',
      borderHover: 'hover:border-teal-400 dark:hover:border-teal-500/50',
      btn: 'text-teal-700 dark:text-teal-400 group-hover:text-teal-600 dark:group-hover:text-teal-300',
      num: 'text-teal-600 dark:text-teal-400',
    },
    violet: {
      tag: 'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/40',
      borderHover: 'hover:border-violet-400 dark:hover:border-violet-500/50',
      btn: 'text-violet-700 dark:text-violet-400 group-hover:text-violet-600 dark:group-hover:text-violet-300',
      num: 'text-violet-600 dark:text-violet-400',
    },
    amber: {
      tag: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40',
      borderHover: 'hover:border-amber-400 dark:hover:border-amber-500/50',
      btn: 'text-amber-700 dark:text-amber-400 group-hover:text-amber-600 dark:group-hover:text-amber-300',
      num: 'text-amber-600 dark:text-amber-400',
    },
  };

  const theme = colorThemes[themeColor] || colorThemes.cyan;

  return (
    <Link
      to={route}
      className={`group relative flex flex-col rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800/90 ${theme.borderHover} transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl cursor-pointer transform hover:-translate-y-1`}
    >
      {/* Top Illustration Showcase Header */}
      <div className="relative w-full overflow-hidden bg-slate-100 dark:bg-slate-950/80 p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800/80">
        <div className="w-full transition-transform duration-500 group-hover:scale-[1.02]">
          {Illustration && <Illustration className="w-full h-48 sm:h-52 object-contain" />}
        </div>

        {/* Module Number Floating Pill */}
        <div className="absolute top-4 left-4 flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border backdrop-blur-md bg-white/90 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-slate-600 dark:text-slate-400">MODULE</span>
          <span className={theme.num}>{number}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div>
          {/* Title with guaranteed dark & light visibility */}
          <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
            {title}
          </h3>

          {/* Description */}
          <p className="mt-2.5 text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            {description}
          </p>

          {/* Tech / Algorithm Tags */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className={`text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-md border ${theme.tag}`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Card Footer CTA Button */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
          <span className={`text-sm font-bold flex items-center space-x-2 ${theme.btn}`}>
            <span>Explore Module</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
          </span>

          <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
            {id === 'enhancement' ? 'Active Lab' : 'Module Guide'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ModuleCard;
