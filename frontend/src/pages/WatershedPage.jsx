import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, SplitSquareVertical, CheckCircle2, AlertTriangle, Layers, Clock, Cpu, BarChart3, Image as ImageIcon } from 'lucide-react';
import WatershedIllustration from '../components/illustrations/WatershedIllustration';
import MathFormula from '../components/MathFormula';

export const WatershedPage = () => {
  const techniques = [
    {
      name: 'Euclidean Distance Transformation',
      symbol: 'D(p) = \\min_{q \\in \\text{Background}} \\|p - q\\|_2',
      fallback: 'D(p) = min_{q ∈ Background} ||p - q||_2',
      description: 'Calculates the Euclidean distance from every foreground pixel to the nearest background pixel, forming topological mountain peaks at coin centers.',
      role: 'Topological Elevation',
    },
    {
      name: 'Marker-Controlled Regional Maxima',
      symbol: 'M = \\{p \\mid D(p) > \\theta \\cdot \\max(D)\\}',
      fallback: 'M = {p | D(p) > θ · max(D)}',
      description: 'Identifies robust internal seed markers for each coin to prevent over-segmentation and eradicate false boundary fragments.',
      role: 'Seed Marker Isolation',
    },
    {
      name: 'Topological Watershed Flooding',
      symbol: 'W(I) = \\text{Basin Partitioning Dams}',
      fallback: 'W(I) = Basin Partitioning',
      description: 'Simulates progressive water rising from marker seeds. Constructing watershed dam lines along ridge lines where rising waters from separate basins touch.',
      role: 'Boundary Delineation',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Binarization & Noise Cleaning',
      detail: 'Otsu automated thresholding and morphological closing to fill interior coin reflections and generate a solid binary mask.',
    },
    {
      step: '02',
      title: 'Distance Transform Calculation',
      detail: 'Compute 2D Euclidean distance transform to convert the binary silhouette into a continuous topological altitude map.',
    },
    {
      step: '03',
      title: 'Marker Extraction & Peak Detection',
      detail: 'Threshold distance peaks to identify definitive coin centers, generating distinct labeled seed markers for each entity.',
    },
    {
      step: '04',
      title: 'Watershed Flooding & Boundary Colorization',
      detail: 'Propagate catchment basins, build watershed barrier dams along contact lines, and render false-color segmented regions.',
    },
  ];

  const objectives = [
    'Resolve heavily touching or partially overlapping circular coins where simple erosion fails.',
    'Formulate the Euclidean distance transform as a topographical elevation landscape.',
    'Eliminate severe over-segmentation using marker-controlled watershed techniques.',
    'Delineate unambiguous false-color boundary lines between touching coin peripheries.',
    'Achieve 100% automated counting and enumeration of overlapping coin tokens.',
  ];

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-700 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Studio Overview</span>
        </Link>
        <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-violet-800 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/60 px-3 py-1 rounded-full">
          <span>MODULE 03 • IMAGE SEGMENTATION</span>
        </div>
      </div>

      {/* Module Hero Banner with High Contrast */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800/90 p-6 sm:p-10 shadow-lg dark:shadow-2xl">
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-violet-700 dark:text-violet-400">
            <SplitSquareVertical className="w-4 h-4" />
            <span>MARKER-CONTROLLED TOPOLOGY</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Watershed Segmentation
          </h1>
          <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            Identify and separate touching or overlapping coins using marker-controlled watershed segmentation. Carve ridge dams along topological elevation lines.
          </p>

          <div className="pt-2 flex flex-wrap gap-2">
            {['Distance Transform', 'Catchment Basins', 'Watershed Dams', 'Marker-Controlled', 'Coin Segmentation'].map((tag, i) => (
              <span key={i} className="text-xs font-mono font-medium px-3 py-1 rounded-md bg-violet-50 dark:bg-violet-950/50 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-800/50">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <WatershedIllustration className="w-full h-auto max-h-72 drop-shadow-xl" />
        </div>
      </div>

      {/* Notice Banner */}
      <div className="rounded-2xl border border-violet-300 dark:border-violet-500/30 bg-gradient-to-r from-violet-50 via-white to-indigo-50 dark:from-violet-950/30 dark:via-slate-900/50 dark:to-indigo-950/30 p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-500/10 border border-violet-300 dark:border-violet-500/30 text-violet-700 dark:text-violet-400 flex-shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-violet-200 text-violet-900 dark:bg-violet-400/10 dark:text-violet-300 border border-violet-300 dark:border-violet-400/20 font-bold">
                Upcoming Module
              </span>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400 font-medium">• Algorithmic workspace scheduled for Phase 4</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Watershed Segmentation Architecture Blueprint
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              This module operates on topological distance transforms for heavily overlapping coin tokens, distinct from the binary morphological opening implemented in Module 02.
            </p>
          </div>
        </div>

        {/* Mock Workspace Visual Wireframe */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <div className="text-slate-900 dark:text-slate-300 flex items-center space-x-1.5 font-bold">
              <ImageIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span>Overlapping Coins Dataset</span>
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-[11px] font-sans font-medium">
              Multi-coin clusters, overlapping currency disks, and high-density circular token imagery.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <div className="text-slate-900 dark:text-slate-300 flex items-center space-x-1.5 font-bold">
              <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Marker Threshold Slider</span>
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-[11px] font-sans font-medium">
              Tunable Distance Threshold coefficient (0.2 to 0.9 × Max Distance) to prevent over-segmentation.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <div className="text-slate-900 dark:text-slate-300 flex items-center space-x-1.5 font-bold">
              <BarChart3 className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
              <span>False-Color Basins & Dam Lines</span>
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-[11px] font-sans font-medium">
              Chromatic segmentation map with boundary dam ridges and segmented coin inventory table.
            </div>
          </div>
        </div>
      </div>

      {/* Problem Statement Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>OVERLAPPING COIN DILEMMA</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Problem Statement Summary
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            While basic morphological erosion can separate lightly touching objects with narrow necks, it fails when coins heavily overlap or share substantial contact boundaries. Severe erosion shrinks the objects so much that smaller coins vanish entirely before the neck breaks.
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            Marker-controlled watershed segmentation solves this fundamental limitation. By treating the Euclidean distance transform as a topological height map, each coin's center forms a regional peak. By flooding downward from these peaks, watershed ridge dams form exactly along the contact saddles, perfectly separating overlapping coins without altering their physical perimeters.
          </p>
        </div>

        {/* Main Objectives Checklist */}
        <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-violet-700 dark:text-violet-400 font-mono text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>EXPERIMENTAL OUTCOMES</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Key Learning Objectives
          </h2>
          <ul className="space-y-3">
            {objectives.map((obj, i) => (
              <li key={i} className="flex items-start space-x-3 text-sm text-slate-700 dark:text-slate-300 font-medium">
                <span className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-500/10 border border-violet-300 dark:border-violet-500/30 text-violet-700 dark:text-violet-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5 font-bold">
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
        <div className="flex items-center space-x-2 text-violet-700 dark:text-violet-400 font-mono text-xs font-bold">
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
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-800 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded border border-violet-200 dark:border-violet-800/60">
                  {tech.role}
                </span>
                <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">{tech.name}</h3>
                <div className="my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-violet-900 dark:text-violet-300 text-center">
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
        <div className="flex items-center space-x-2 text-violet-700 dark:text-violet-400 font-mono text-xs font-bold">
          <Cpu className="w-4 h-4" />
          <span>EXECUTION PIPELINE</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Expected Processing Workflow
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((ws, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white dark:bg-navy-900/70 border border-slate-200 dark:border-slate-800 relative group hover:border-slate-400 dark:hover:border-slate-700 shadow-sm transition-colors">
              <span className="text-2xl font-extrabold font-mono text-violet-600/40 dark:text-violet-400/40 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
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
          className="inline-flex items-center space-x-2 text-sm font-semibold text-violet-700 dark:text-violet-400 hover:text-violet-600 dark:hover:text-violet-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Studio Home</span>
        </Link>
        <Link
          to="/modules/classification"
          className="text-sm font-semibold text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          Next: Module 04 – Geometrical Object Classification →
        </Link>
      </div>

    </div>
  );
};

export default WatershedPage;
