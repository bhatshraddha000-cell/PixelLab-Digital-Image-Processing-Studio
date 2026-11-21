import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BrainCircuit, CheckCircle2, AlertTriangle, Layers, Clock, Cpu, BarChart3, Image as ImageIcon } from 'lucide-react';
import ClassificationIllustration from '../components/illustrations/ClassificationIllustration';
import MathFormula from '../components/MathFormula';

export const ClassificationPage = () => {
  const techniques = [
    {
      name: 'Circularity (Form Factor / Compactness)',
      symbol: 'C = \\frac{4\\pi \\cdot \\text{Area}}{\\text{Perimeter}^2}',
      fallback: 'C = (4π × Area) / Perimeter²',
      description: 'Dimensionless shape metric. Attains maximum C = 1.0 exclusively for perfect circles; drops significantly for polygons and elongated rectangles.',
      role: 'Circular Identification',
    },
    {
      name: 'Rectangularity (Bounding Box Ratio)',
      symbol: 'R = \\frac{\\text{Area}}{\\text{Width}_{\\text{bbox}} \\cdot \\text{Height}_{\\text{bbox}}}',
      fallback: 'R = Area / (Width × Height)',
      description: 'Ratio of region area to its minimum-area bounding bounding box. Attains R ≈ 1.0 for orthogonal rectangles and R ≈ π/4 (0.785) for circles.',
      role: 'Quadrilateral Discrimination',
    },
    {
      name: 'Compactness & Aspect Ratio',
      symbol: 'K = \\frac{\\text{Perimeter}^2}{\\text{Area}}, \\quad \\text{AR} = \\frac{W}{H}',
      fallback: 'K = Perimeter² / Area, AR = Width / Height',
      description: 'Discriminates acute convex polygons (such as triangles and stars) from isotropic regular polyhedra based on perimeter-to-area proportions.',
      role: 'Polygonal Partitioning',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Image Segmentation & Contour Extraction',
      detail: 'Extract closed boundary contours for all non-touching foreground geometric shapes in the scene.',
    },
    {
      step: '02',
      title: 'Geometric Property Computation',
      detail: 'Calculate Green-theorem polygonal area (A), Euclidean arc perimeter (P), centroid coordinates, and minimal oriented bounding boxes.',
    },
    {
      step: '03',
      title: 'Feature Vector Calculation',
      detail: 'Derive scale, translation, and rotation invariant descriptors: Circularity, Rectangularity, Compactness, and Aspect Ratio.',
    },
    {
      step: '04',
      title: 'Decision Tree / Rule-Based Classification',
      detail: 'Classify each detected object into categories (Circle, Square, Rectangle, Triangle, Polygon) and render vector bounding annotations.',
    },
  ];

  const objectives = [
    'Compute scale-, rotation-, and translation-invariant geometric shape descriptors.',
    'Differentiate between geometric primitives using automated decision threshold rules.',
    'Render labeled bounding boxes, centroid crosshairs, and live classification statistics.',
    'Evaluate descriptor sensitivity to edge quantization and polygonal rasterization.',
    'Export structured JSON classification metrics for all identified objects in the scene.',
  ];

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-700 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Studio Overview</span>
        </Link>
        <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-3 py-1 rounded-full">
          <span>MODULE 04 • OBJECT DESCRIPTION & CLASSIFICATION</span>
        </div>
      </div>

      {/* Module Hero Banner with High Contrast */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800/90 p-6 sm:p-10 shadow-lg dark:shadow-2xl">
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
            <BrainCircuit className="w-4 h-4" />
            <span>IMAGE REPRESENTATION & DESCRIPTION</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Geometrical Object Classification
          </h1>
          <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            Recognize and classify geometric objects using their area, perimeter, circularity, compactness and rectangularity. Transform pixel shapes into quantified semantic classes.
          </p>

          <div className="pt-2 flex flex-wrap gap-2">
            {['Area & Perimeter', 'Circularity (4πA/P²)', 'Rectangularity', 'Compactness', 'Rule-Based Classifier'].map((tag, i) => (
              <span key={i} className="text-xs font-mono font-medium px-3 py-1 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <ClassificationIllustration className="w-full h-auto max-h-72 drop-shadow-xl" />
        </div>
      </div>

      {/* Notice Banner */}
      <div className="rounded-2xl border border-amber-300 dark:border-amber-500/30 bg-gradient-to-r from-amber-50 via-white to-orange-50 dark:from-amber-950/30 dark:via-slate-900/50 dark:to-orange-950/30 p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 flex-shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200 text-amber-900 dark:bg-amber-400/10 dark:text-amber-300 border border-amber-300 dark:border-amber-400/20 font-bold">
                Upcoming Module
              </span>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400 font-medium">• Algorithmic workspace scheduled for Phase 5</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Geometrical Classification Architecture Blueprint
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              Computes scale, rotation, and translation invariant descriptors to parse closed polygon contours into semantic classes (Circle, Rectangle, Triangle, Polygon).
            </p>
          </div>
        </div>

        {/* Mock Workspace Visual Wireframe */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <div className="text-slate-900 dark:text-slate-300 flex items-center space-x-1.5 font-bold">
              <ImageIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Geometric Shapes Scene</span>
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-[11px] font-sans font-medium">
              Multi-shape test benches featuring rotated circles, triangles, rectangles, squares, and stars.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <div className="text-slate-900 dark:text-slate-300 flex items-center space-x-1.5 font-bold">
              <Cpu className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>Decision Threshold Configurator</span>
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-[11px] font-sans font-medium">
              Adjustable circularity threshold (e.g. C &gt; 0.90 = Circle) and rectangularity cutoff bounds.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <div className="text-slate-900 dark:text-slate-300 flex items-center space-x-1.5 font-bold">
              <BarChart3 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Feature Classification Table</span>
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-[11px] font-sans font-medium">
              Object-by-object feature inventory with live bounding-box overlays and CSV/JSON export.
            </div>
          </div>
        </div>
      </div>

      {/* Problem Statement Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>SEMANTIC GAP IN VISION</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Problem Statement Summary
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            In raw digital images, objects exist merely as arbitrary clusters of pixel intensities without intrinsic semantic meaning. An autonomous system cannot inherently distinguish between a circular industrial washer, a rectangular conveyor box, or a triangular hazard icon without extracting quantifiable shape descriptors.
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            Simple pixel counts (area) alone are insufficient because two distinct shapes can have identical areas. By combining multiple invariant mathematical descriptors (Circularity, Rectangularity, Aspect Ratio, and Compactness), we construct an unambiguous feature vector that uniquely categorizes each shape regardless of its orientation or scale.
          </p>
        </div>

        {/* Main Objectives Checklist */}
        <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>EXPERIMENTAL OUTCOMES</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Key Learning Objectives
          </h2>
          <ul className="space-y-3">
            {objectives.map((obj, i) => (
              <li key={i} className="flex items-start space-x-3 text-sm text-slate-700 dark:text-slate-300 font-medium">
                <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5 font-bold">
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
        <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold">
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
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                  {tech.role}
                </span>
                <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">{tech.name}</h3>
                <div className="my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-amber-900 dark:text-amber-300 text-center">
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
        <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold">
          <Cpu className="w-4 h-4" />
          <span>EXECUTION PIPELINE</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Expected Processing Workflow
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((ws, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white dark:bg-navy-900/70 border border-slate-200 dark:border-slate-800 relative group hover:border-slate-400 dark:hover:border-slate-700 shadow-sm transition-colors">
              <span className="text-2xl font-extrabold font-mono text-amber-600/40 dark:text-amber-400/40 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
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
          className="inline-flex items-center space-x-2 text-sm font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Studio Home</span>
        </Link>
        <Link
          to="/modules/enhancement"
          className="text-sm font-semibold text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          Back to Module 01 – Image Enhancement →
        </Link>
      </div>

    </div>
  );
};

export default ClassificationPage;
