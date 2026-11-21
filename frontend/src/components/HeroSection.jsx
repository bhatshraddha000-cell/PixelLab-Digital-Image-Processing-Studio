import React from 'react';
import { Layers, ArrowDownCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import HeroPipeline from './HeroPipeline';

export const HeroSection = () => {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-6 pb-16 lg:pt-14 lg:pb-24 overflow-hidden">
      {/* Background glowing ambiance */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-radial-glow pointer-events-none opacity-40 dark:opacity-60"></div>
      <div className="absolute top-20 right-10 w-96 h-96 bg-radial-violet pointer-events-none opacity-20 dark:opacity-40"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Column: Heading, Supporting text, CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">

            {/* Tagline Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800/60 text-cyan-800 dark:text-cyan-300 text-xs font-mono tracking-wide font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
              <span>Explore Images. Process Intelligence. Discover Results.</span>
            </div>

            {/* Main Heading with Guaranteed High Contrast */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Digital Image <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 dark:from-cyan-400 dark:via-blue-400 dark:to-violet-500">
                Processing Studio
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Transform raw images into meaningful insights through interactive computer vision experiments. Explore enhancement, morphological processing, segmentation and intelligent object classification.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => scrollTo('modules')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-200 flex items-center justify-center space-x-2 group cursor-pointer"
              >
                <span>Explore Modules</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => scrollTo('about')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 shadow-sm transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>About Project</span>
                <ArrowDownCircle className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </button>
            </div>

            {/* Feature tags */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Deterministic OpenCV Algorithms</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span>Modern Scientific Workspace</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Conceptual Pipeline Graphic */}
          <div className="lg:col-span-5">
            <HeroPipeline />
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
