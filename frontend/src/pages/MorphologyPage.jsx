import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shapes, CheckCircle2, AlertTriangle, Layers, Clock, Cpu, BarChart3, Image as ImageIcon } from 'lucide-react';
import MorphologyIllustration from '../components/illustrations/MorphologyIllustration';
import MathFormula from '../components/MathFormula';

export const MorphologyPage = () => {
  const techniques = [
    {
      name: 'Binary Erosion (Shrinking)',
      symbol: 'A \\ominus B = \\{z \\mid (B)_z \\subseteq A\\}',
      fallback: 'A ⊖ B = {z | (B)_z ⊆ A}',
      description: 'Translates structuring element B across binary foreground A. Strips outer pixel layers to sever narrow overlap bridges between touching circular objects.',
      role: 'Bridge Severance',
    },
    {
      name: 'Binary Dilation (Expansion)',
      symbol: 'A \\oplus B = \\{z \\mid (\\hat{B})_z \\cap A \\neq \\emptyset\\}',
      fallback: 'A ⊕ B = {z | (B̂)_z ∩ A ≠ ∅}',
      description: 'Expands the eroded boundaries back to their true geometric proportions while maintaining the newly opened separation gaps.',
      role: 'Geometry Restoration',
    },
    {
      name: 'Connected Component Analysis (8-Connected)',
      symbol: 'L(p) = \\min_{q \\in N_8(p)} \\{L(q)\\}',
      fallback: 'L(p) = min_{q ∈ N8(p)} {L(q)}',
      description: 'Scans non-zero pixel adjacency to assign unique discrete integer labels to each isolated object and output total object counts.',
      role: 'Automated Counting',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Binarization & Thresholding',
      detail: 'Convert input grayscale image into a high-contrast binary mask via Otsu automated global thresholding.',
    },
    {
      step: '02',
      title: 'Morphological Opening Filter',
      detail: 'Apply erosion followed by dilation using a tailored disk or cross structuring element of radius r to disconnect touching contacts.',
    },
    {
      step: '03',
      title: 'Connected Component Labeling',
      detail: 'Execute 8-connectivity raster flood-fill to assign unique chromatic indices and identify distinct objects.',
    },
    {
      step: '04',
      title: 'Object Enumeration & Area Extraction',
      detail: 'Compute aggregate count, centroid coordinates, and pixel area distribution for each separated coin or disk.',
    },
  ];

  const objectives = [
    'Understand structuring element geometry (disk, cross, square) and its effect on object boundary topology.',
    'Systematically eliminate spurious pixel bridges without disintegrating small foreground particles.',
    'Recover true object dimensions through disciplined morphological opening (erosion followed by dilation).',
    'Demonstrate automated 8-connected component labeling and accurate object enumeration.',
    'Compare counting accuracy before and after morphological neck severance.',
  ];

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-700 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Studio Overview</span>
        </Link>
        <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60 px-3 py-1 rounded-full">
          <span>MODULE 02 • MATHEMATICAL MORPHOLOGY</span>
        </div>
      </div>

      {/* Module Hero Banner with High Contrast */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800/90 p-6 sm:p-10 shadow-lg dark:shadow-2xl">
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
            <Shapes className="w-4 h-4" />
            <span>MORPHOLOGICAL IMAGE PROCESSING</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Morphological Object Separation
          </h1>
          <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            Separate lightly touching circular objects using morphological operations and automatically calculate their count. Isolate connected particles into independently indexed entities.
          </p>

          <div className="pt-2 flex flex-wrap gap-2">
            {['Erosion (⊖)', 'Dilation (⊕)', 'Connected Components', 'Structuring Element', 'Automated Counting'].map((tag, i) => (
              <span key={i} className="text-xs font-mono font-medium px-3 py-1 rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <MorphologyIllustration className="w-full h-auto max-h-72 drop-shadow-xl" />
        </div>
      </div>

      {/* Notice Banner */}
      <div className="rounded-2xl border border-teal-300 dark:border-teal-500/30 bg-gradient-to-r from-teal-50 via-white to-emerald-50 dark:from-teal-950/30 dark:via-slate-900/50 dark:to-emerald-950/30 p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-xl bg-teal-100 dark:bg-teal-500/10 border border-teal-300 dark:border-teal-500/30 text-teal-700 dark:text-teal-400 flex-shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-teal-200 text-teal-900 dark:bg-teal-400/10 dark:text-teal-300 border border-teal-300 dark:border-teal-400/20 font-bold">
                Upcoming Module
              </span>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400 font-medium">• Algorithmic workspace scheduled for Phase 3</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Morphological Laboratory Architecture Blueprint
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              This module is strictly separate from Watershed Segmentation. It investigates erosion-dilation structuring elements for lightly touching disks, leaving overlapping topological basining to Module 03.
            </p>
          </div>
        </div>

        {/* Mock Workspace Visual Wireframe */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <div className="text-slate-900 dark:text-slate-300 flex items-center space-x-1.5 font-bold">
              <ImageIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Touching Coins Input</span>
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-[11px] font-sans font-medium">
              Preset test benchmarks: Lightly touching coins, overlapping beads, and binary synthetic disks.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <div className="text-slate-900 dark:text-slate-300 flex items-center space-x-1.5 font-bold">
              <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Structuring Element Tuner</span>
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-[11px] font-sans font-medium">
              Selectable Kernel: Disk, Cross, Diamond with variable radius (1 to 10 iterations).
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <div className="text-slate-900 dark:text-slate-300 flex items-center space-x-1.5 font-bold">
              <BarChart3 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Object Counting Dashboard</span>
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-[11px] font-sans font-medium">
              Connected components tally, centroid heatmaps, and individual particle area distributions.
            </div>
          </div>
        </div>
      </div>

      {/* Problem Statement Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>TOPOLOGICAL FUSION PROBLEM</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Problem Statement Summary
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            When adjacent objects in digital imagery make physical or optical contact, standard global thresholding fuses them into a singular merged blob. A connected-component algorithm naively counts such pairs as a single entity, producing major undercounting errors in automated counting systems.
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            By carefully executing mathematical morphology with an appropriately sized structuring element, we can selectively dissolve the contact isthmus (via erosion) and then rebuild the perimeter (via dilation) without re-fusing the separated items.
          </p>
        </div>

        {/* Main Objectives Checklist */}
        <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-teal-700 dark:text-teal-400 font-mono text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>EXPERIMENTAL OUTCOMES</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Key Learning Objectives
          </h2>
          <ul className="space-y-3">
            {objectives.map((obj, i) => (
              <li key={i} className="flex items-start space-x-3 text-sm text-slate-700 dark:text-slate-300 font-medium">
                <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-500/10 border border-teal-300 dark:border-teal-500/30 text-teal-700 dark:text-teal-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5 font-bold">
                  ✓
                </span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Techniques Involved & Mathematical Formulations with KaTeX */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-teal-700 dark:text-teal-400 font-mono text-xs font-bold">
          <Layers className="w-4 h-4" />
          <span>ALGORITHMIC FOUNDATIONS</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Techniques & Mathematical Formulations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {techniques.map((tech, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800/60">
                  {tech.role}
                </span>
                <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">{tech.name}</h3>
                <div className="my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-teal-900 dark:text-teal-300 text-center">
                  <MathFormula tex={tech.symbol} fallback={tech.fallback} display={true} />
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{tech.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expected 4-Step Processing Workflow */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-teal-700 dark:text-teal-400 font-mono text-xs font-bold">
          <Cpu className="w-4 h-4" />
          <span>EXECUTION PIPELINE</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Expected Processing Workflow
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((ws, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white dark:bg-navy-900/70 border border-slate-200 dark:border-slate-800 relative group hover:border-slate-400 dark:hover:border-slate-700 shadow-sm transition-colors">
              <span className="text-2xl font-extrabold font-mono text-teal-600/40 dark:text-teal-400/40 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                {ws.step}
              </span>
              <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white">{ws.title}</h3>
              <p className="mt-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{ws.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Return Link */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-600 dark:hover:text-teal-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Studio Home</span>
        </Link>
        <Link
          to="/modules/watershed"
          className="text-sm font-semibold text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          Next: Module 03 – Watershed Segmentation →
        </Link>
      </div>

    </div>
  );
};

export default MorphologyPage;
