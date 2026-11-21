import React from 'react';
import { Sliders, Shapes, SplitSquareVertical, BrainCircuit, CheckCircle2 } from 'lucide-react';

export const AboutSection = () => {
  const domains = [
    {
      title: 'Intensity Transformation & Spatial Filtering',
      icon: Sliders,
      tag: 'Domain 01',
      description: 'Manipulation of image pixels directly within their spatial coordinate space. Encompasses Gaussian smoothing convolution kernels to eradicate high-frequency noise and power-law gamma transformations for dynamic contrast correction.',
      color: 'text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/10',
    },
    {
      title: 'Morphological Image Processing',
      icon: Shapes,
      tag: 'Domain 02',
      description: 'Nonlinear operations related to the shape or morphology of features. Employs binary erosion, dilation, morphological opening and 8-connected component analysis to sever contact necks between touching circular structures.',
      color: 'text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/30 bg-teal-50 dark:bg-teal-500/10',
    },
    {
      title: 'Image Segmentation',
      icon: SplitSquareVertical,
      tag: 'Domain 03',
      description: 'Partitioning of digital images into multiple meaningful segments. Leverages Euclidean distance transforms and marker-controlled watershed flooding algorithms to isolate and enumerate touching and overlapping coin tokens.',
      color: 'text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10',
    },
    {
      title: 'Image Representation & Description',
      icon: BrainCircuit,
      tag: 'Domain 04',
      description: 'Feature extraction and quantitative characterization of isolated geometric regions. Computes topological invariant descriptors including area, perimeter, circularity, compactness and rectangularity for classification.',
      color: 'text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10',
    },
  ];

  return (
    <section id="about" className="py-16 sm:py-24 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header with high contrast */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/60 text-violet-800 dark:text-violet-300 text-xs font-mono font-semibold">
            <span>FOUNDATIONAL COMPUTER VISION</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            About PixelLab Project
          </h2>

          <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            PixelLab is an interactive Digital Image Processing application designed to demonstrate classical image-processing techniques through practical experiments, visual comparisons and quantitative analysis.
          </p>
        </div>

        {/* 4 Core Processing Domains Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {domains.map((domain, idx) => {
            const Icon = domain.icon;
            return (
              <div
                key={idx}
                className="relative rounded-2xl p-6 sm:p-8 bg-white dark:bg-navy-900/70 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 shadow-sm hover:shadow-md group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl border ${domain.color}`}>
                    <Icon className="w-6 h-6 text-current" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {domain.tag}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {domain.title}
                </h3>

                <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {domain.description}
                </p>

                <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/60 flex items-center space-x-2 text-xs font-mono font-semibold text-cyan-700 dark:text-cyan-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Academic CV Benchmark</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default AboutSection;
