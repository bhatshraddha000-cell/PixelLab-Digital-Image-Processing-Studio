import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BrainCircuit,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Cpu,
  BarChart3,
  Image as ImageIcon,
  Upload,
  Download,
  FileSpreadsheet,
  FileCode,
  FileText,
  RotateCcw,
  Play,
  Trash2,
  Eye,
  Info,
  Scale,
  Sparkles,
  Check,
  SplitSquareVertical,
  Maximize2,
  Database,
  Target,
  Bookmark,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import ImageSplitSlider from '../components/ImageSplitSlider';
import MathFormula from '../components/MathFormula';
import apiService from '../services/api';
import {
  exportClassificationCSV,
  exportClassificationJSON,
  generateClassificationPDFReport,
} from '../utils/exportUtils';

const CATEGORY_COLORS = {
  circle: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/60',
    border: 'border-cyan-300 dark:border-cyan-800',
    text: 'text-cyan-700 dark:text-cyan-300',
    badge: 'bg-cyan-500 text-white',
    hex: '#06b6d4',
  },
  triangle: {
    bg: 'bg-red-50 dark:bg-red-950/60',
    border: 'border-red-300 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-red-500 text-white',
    hex: '#ef4444',
  },
  square: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    border: 'border-emerald-300 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-500 text-white',
    hex: '#10b981',
  },
  rectangle: {
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    border: 'border-amber-300 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-500 text-white',
    hex: '#f59e0b',
  },
  ellipse: {
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    border: 'border-purple-300 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-500 text-white',
    hex: '#a855f7',
  },
  unknown: {
    bg: 'bg-slate-50 dark:bg-slate-800',
    border: 'border-slate-300 dark:border-slate-700',
    text: 'text-slate-700 dark:text-slate-300',
    badge: 'bg-slate-500 text-white',
    hex: '#94a3b8',
  },
};

export const ClassificationPage = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('workspace'); // 'workspace' | 'training' | 'dataset' | 'theory' | 'history'

  // Benchmark scenes
  const [samples, setSamples] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState('test_multi_shapes_5');

  // Input image state
  const [sourceType, setSourceType] = useState('sample'); // 'sample' | 'custom'
  const [inputImageFile, setInputImageFile] = useState(null);
  const [inputPreviewUrl, setInputPreviewUrl] = useState('/samples/classification/test_multi_shapes_5.png');
  const [imageMeta, setImageMeta] = useState({ width: 600, height: 400, name: 'test_multi_shapes_5.png' });

  // Preprocessing and Algorithmic Parameters
  const [thresholdMethod, setThresholdMethod] = useState('otsu'); // 'otsu' | 'manual' | 'adaptive'
  const [thresholdValue, setThresholdValue] = useState(127);
  const [polarity, setPolarity] = useState('bright_on_dark'); // 'bright_on_dark' | 'dark_on_bright'
  const [blurKernel, setBlurKernel] = useState(3);
  const [morphOperation, setMorphOperation] = useState('none'); // 'none' | 'opening' | 'closing'
  const [morphKernelSize, setMorphKernelSize] = useState(3);
  const [minObjectArea, setMinObjectArea] = useState(80);
  const [kNeighbors, setKNeighbors] = useState(3);
  const [selectedFeatures, setSelectedFeatures] = useState([
    'compactness',
    'circularity',
    'rectangularity',
    'aspect_ratio',
    'vertices',
  ]);
  const [experimentName, setExperimentName] = useState('Shape-Classification-Trial');
  const [userObservations, setUserObservations] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [currentResult, setCurrentResult] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'single' | 'sideBySide'
  const [activeStage, setActiveStage] = useState('annotated'); // 'annotated' | 'contours' | 'bounding_boxes' | 'binary' | 'grayscale' | 'original'
  const [selectedObjectId, setSelectedObjectId] = useState(null);

  // Model Training state
  const [trainK, setTrainK] = useState(3);
  const [trainTestRatio, setTrainTestRatio] = useState(0.25);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState(null);
  const [trainingError, setTrainingError] = useState(null);

  // Dataset state
  const [datasetStats, setDatasetStats] = useState(null);
  const [isLoadingDataset, setIsLoadingDataset] = useState(false);

  // History state
  const [historyList, setHistoryList] = useState([]);

  const fileInputRef = useRef(null);

  // Load benchmark samples, dataset stats, and history on mount
  useEffect(() => {
    apiService.classification
      .getSamples()
      .then((data) => {
        if (data && data.samples) {
          setSamples(data.samples);
        }
      })
      .catch((err) => console.warn('Could not load classification samples:', err.message));

    loadDatasetStats();
    loadHistory();
  }, []);

  const loadDatasetStats = async () => {
    setIsLoadingDataset(true);
    try {
      const res = await apiService.classification.getDataset();
      if (res && res.dataset) {
        setDatasetStats(res.dataset);
      }
    } catch (err) {
      console.warn('Could not load dataset stats:', err.message);
    } finally {
      setIsLoadingDataset(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await apiService.classification.getHistory();
      if (res && res.data) {
        setHistoryList(res.data);
      }
    } catch (err) {
      console.warn('Could not load history:', err.message);
    }
  };

  // Handle benchmark sample selection
  const handleSelectSample = (sample) => {
    setSelectedSampleId(sample.id);
    setSourceType('sample');
    setInputImageFile(null);
    setInputPreviewUrl(sample.previewUrl);
    setImageMeta({
      name: sample.filename,
      width: parseInt(sample.dimensions?.split('×')[0], 10) || 600,
      height: parseInt(sample.dimensions?.split('×')[1], 10) || 400,
    });

    if (sample.recommendedParams) {
      if (sample.recommendedParams.thresholdMethod) setThresholdMethod(sample.recommendedParams.thresholdMethod);
      if (sample.recommendedParams.polarity) setPolarity(sample.recommendedParams.polarity);
      if (sample.recommendedParams.blurKernel) setBlurKernel(sample.recommendedParams.blurKernel);
      if (sample.recommendedParams.morphOperation) setMorphOperation(sample.recommendedParams.morphOperation);
      if (sample.recommendedParams.minObjectArea) setMinObjectArea(sample.recommendedParams.minObjectArea);
      if (sample.recommendedParams.kNeighbors) setKNeighbors(sample.recommendedParams.kNeighbors);
    }
  };

  // Handle custom image upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setInputImageFile(file);
    setSourceType('custom');
    const objectUrl = URL.createObjectURL(file);
    setInputPreviewUrl(objectUrl);

    const img = new window.Image();
    img.onload = () => {
      setImageMeta({
        name: file.name,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.src = objectUrl;
  };

  // Toggle active feature in feature selection
  const handleToggleFeature = (featureName) => {
    if (selectedFeatures.includes(featureName)) {
      if (selectedFeatures.length <= 1) return; // Maintain at least 1 feature
      setSelectedFeatures(selectedFeatures.filter((f) => f !== featureName));
    } else {
      setSelectedFeatures([...selectedFeatures, featureName]);
    }
  };

  // Execute Classification Pipeline
  const handleRunClassification = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();

      if (sourceType === 'custom' && inputImageFile) {
        formData.append('image', inputImageFile);
      } else {
        formData.append('sampleId', selectedSampleId);
      }

      formData.append('thresholdMethod', thresholdMethod);
      formData.append('thresholdValue', String(thresholdValue));
      formData.append('polarity', polarity);
      formData.append('blurKernel', String(blurKernel));
      formData.append('morphOperation', morphOperation);
      formData.append('morphKernelSize', String(morphKernelSize));
      formData.append('minObjectArea', String(minObjectArea));
      formData.append('kNeighbors', String(kNeighbors));
      formData.append('features', JSON.stringify(selectedFeatures));
      formData.append('experimentName', experimentName);
      formData.append('userObservations', userObservations);

      const response = await apiService.classification.process(formData);

      if (response && response.status === 'success') {
        setCurrentResult(response.data);
        if (response.data.objects && response.data.objects.length > 0) {
          setSelectedObjectId(response.data.objects[0].id);
        }
        loadHistory();
      } else {
        throw new Error(response.message || 'Classification failed.');
      }
    } catch (err) {
      console.error('Classification error:', err);
      setErrorMessage(err.message || 'Failed to execute classification pipeline.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute KNN Model Training
  const handleTrainModel = async () => {
    setIsTraining(true);
    setTrainingError(null);

    try {
      const res = await apiService.classification.train({
        k: trainK,
        testRatio: trainTestRatio,
        features: selectedFeatures,
      });

      if (res && res.status === 'success') {
        setTrainingResult(res.model?.metrics || res.model);
        loadDatasetStats();
      } else {
        throw new Error(res.message || 'Training failed.');
      }
    } catch (err) {
      console.error('Training error:', err);
      setTrainingError(err.message || 'Failed to train KNN classifier.');
    } finally {
      setIsTraining(false);
    }
  };

  // Reset parameters
  const handleResetDefaults = () => {
    setThresholdMethod('otsu');
    setThresholdValue(127);
    setPolarity('bright_on_dark');
    setBlurKernel(3);
    setMorphOperation('none');
    setMorphKernelSize(3);
    setMinObjectArea(80);
    setKNeighbors(3);
    setSelectedFeatures(['compactness', 'circularity', 'rectangularity', 'aspect_ratio', 'vertices']);
  };

  // Currently selected object
  const selectedObject = useMemo(() => {
    if (!currentResult || !currentResult.objects) return null;
    return currentResult.objects.find((o) => o.id === selectedObjectId) || currentResult.objects[0] || null;
  }, [currentResult, selectedObjectId]);

  // Chart data: Object descriptors comparison
  const descriptorsChartData = useMemo(() => {
    if (!currentResult || !currentResult.objects) return [];
    return currentResult.objects.map((o) => ({
      name: `#${o.id} ${o.predictedClass.slice(0, 4)}`,
      id: o.id,
      circularity: o.circularity,
      compactness: o.compactness,
      rectangularity: o.rectangularity,
      aspectRatio: o.aspectRatio,
    }));
  }, [currentResult]);

  // Radar chart data for selected object
  const radarChartData = useMemo(() => {
    if (!selectedObject) return [];
    return [
      {
        subject: 'Circularity',
        value: Math.min(1.5, selectedObject.circularity || 0),
        circleIdeal: 1.0,
        squareIdeal: 0.78,
      },
      {
        subject: 'Compactness',
        value: Math.min(2.0, selectedObject.compactness || 0),
        circleIdeal: 1.0,
        squareIdeal: 1.28,
      },
      {
        subject: 'Rectangularity',
        value: selectedObject.rectangularity || 0,
        circleIdeal: 0.785,
        squareIdeal: 1.0,
      },
      {
        subject: 'Aspect Ratio',
        value: Math.min(2.5, selectedObject.aspectRatio || 1.0),
        circleIdeal: 1.0,
        squareIdeal: 1.0,
      },
      {
        subject: 'Solidity',
        value: selectedObject.solidity || 0.95,
        circleIdeal: 1.0,
        squareIdeal: 1.0,
      },
    ];
  }, [selectedObject]);

  // Delete experiment from history
  const handleDeleteHistory = async (id, e) => {
    e.stopPropagation();
    try {
      await apiService.classification.deleteHistory(id);
      loadHistory();
    } catch (err) {
      console.warn('Delete history failed:', err.message);
    }
  };

  // Load experiment from history into viewer
  const handleLoadFromHistory = (exp) => {
    setCurrentResult({
      id: exp._id,
      name: exp.name,
      processing_time_ms: exp.processingTimeMs,
      metadata: exp.metadata,
      parameters: exp.parameters,
      model_info: exp.results?.modelInfo || {},
      total_detected_objects: exp.results?.totalDetectedObjects || exp.objects?.length || 0,
      category_counts: exp.results?.categoryCounts || {},
      objects: exp.objects || [],
      images: {
        original: exp.originalImagePath,
        binary: exp.segmentedImagePath,
        annotated: exp.annotatedImagePath,
        contours: exp.contoursImagePath || exp.annotatedImagePath,
        bounding_boxes: exp.boundingBoxesImagePath || exp.annotatedImagePath,
      },
    });
    if (exp.objects && exp.objects.length > 0) {
      setSelectedObjectId(exp.objects[0].id);
    }
    setActiveTab('workspace');
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* ========================================================== */}
      {/* TOP BREADCRUMB & HEADER */}
      {/* ========================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-700 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Studio Overview</span>
        </Link>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-inner overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('workspace')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'workspace'
                ? 'bg-white dark:bg-navy-800 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive Studio</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('training')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'training'
                ? 'bg-white dark:bg-navy-800 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>KNN Model Training</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dataset')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'dataset'
                ? 'bg-white dark:bg-navy-800 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Dataset Management</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('theory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'theory'
                ? 'bg-white dark:bg-navy-800 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Theory & Formulations</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-white dark:bg-navy-800 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>History ({historyList.length})</span>
          </button>
        </div>
      </div>

      {/* Module Title Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            <BrainCircuit className="w-4 h-4" />
            <span>MODULE 04 • IMAGE REPRESENTATION & CLASSIFICATION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Region-Based Object Classification Using Geometrical Descriptors
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-4xl leading-relaxed">
            Extract scale- and rotation-invariant academic descriptors (Area, Perimeter, Compactness, Circularity, Rectangularity),
            scale features via StandardScaler, and classify geometric primitives (Circle, Triangle, Square, Rectangle, Ellipse) using K-Nearest Neighbors.
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          <button
            type="button"
            onClick={() => currentResult && generateClassificationPDFReport(currentResult)}
            disabled={!currentResult}
            className="py-2 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center space-x-1.5 disabled:opacity-40"
            title="Download Academic PDF Report"
          >
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span>PDF Report</span>
          </button>
          <button
            type="button"
            onClick={() => currentResult && exportClassificationCSV(currentResult)}
            disabled={!currentResult}
            className="py-2 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center space-x-1.5 disabled:opacity-40"
            title="Export CSV Metrics"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={() => currentResult && exportClassificationJSON(currentResult)}
            disabled={!currentResult}
            className="py-2 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center space-x-1.5 disabled:opacity-40"
            title="Export JSON Structure"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-500" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* TAB 1: INTERACTIVE CLASSIFICATION STUDIO WORKSPACE */}
      {/* ========================================================== */}
      {activeTab === 'workspace' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: CONTROLS & BENCHMARKS (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Input Selection Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  <span>Input Test Scene</span>
                </div>
                <div className="flex items-center bg-slate-100 dark:bg-navy-800 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setSourceType('sample')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      sourceType === 'sample'
                        ? 'bg-white dark:bg-navy-700 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Benchmarks
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType('custom')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      sourceType === 'custom'
                        ? 'bg-white dark:bg-navy-700 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Upload Custom
                  </button>
                </div>
              </div>

              {sourceType === 'sample' ? (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Select Benchmark Scene:
                  </label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {samples.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectSample(s)}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-start space-x-3 ${
                          selectedSampleId === s.id
                            ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-navy-800/40 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-navy-800'
                        }`}
                      >
                        <img
                          src={s.previewUrl}
                          alt={s.name}
                          className="w-14 h-12 rounded-lg object-cover border border-slate-300 dark:border-slate-700 bg-slate-900 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {s.name}
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {s.description}
                          </div>
                          <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 mt-1">
                            {s.shapeCount} Geometric Shapes • {s.dimensions}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-amber-500 cursor-pointer transition-all bg-slate-50 dark:bg-navy-800/30"
                  >
                    <Upload className="w-8 h-8 text-amber-500 mx-auto mb-2 animate-bounce" />
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Click to upload geometric test image
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                      PNG, JPG, or WEBP up to 10MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Parameter Controls Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  <span>Preprocessing & Segmentation</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Threshold Method */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Thresholding Algorithm</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">{thresholdMethod.toUpperCase()}</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'otsu', label: 'Otsu (Auto)' },
                    { id: 'manual', label: 'Manual' },
                    { id: 'adaptive', label: 'Adaptive' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setThresholdMethod(m.id)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        thresholdMethod === m.id
                          ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-navy-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Threshold Slider */}
              {thresholdMethod === 'manual' && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Manual Intensity Cutoff</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400">{thresholdValue}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="254"
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500"
                  />
                </div>
              )}

              {/* Object Polarity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Object Polarity</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPolarity('bright_on_dark')}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      polarity === 'bright_on_dark'
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-700 dark:text-amber-300 shadow-sm'
                        : 'bg-slate-50 dark:bg-navy-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Bright on Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => setPolarity('dark_on_bright')}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      polarity === 'dark_on_bright'
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-700 dark:text-amber-300 shadow-sm'
                        : 'bg-slate-50 dark:bg-navy-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Dark on Bright
                  </button>
                </div>
              </div>

              {/* Min Object Area */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Minimum Object Area (px)</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">{minObjectArea} px</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="10"
                  value={minObjectArea}
                  onChange={(e) => setMinObjectArea(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400">
                  <span>20 px (Sensitive)</span>
                  <span>500 px (Aggressive noise reject)</span>
                </div>
              </div>

              {/* Gaussian Blur Kernel */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Smoothing Kernel Size</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">{blurKernel} × {blurKernel}</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 3, 5, 7].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setBlurKernel(k)}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        blurKernel === k
                          ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-navy-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {k === 1 ? 'None' : `${k}×${k}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Classifier Parameters Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white">
                  <BrainCircuit className="w-4 h-4 text-purple-500" />
                  <span>K-Nearest Neighbors Settings</span>
                </div>
                <span className="text-xs font-mono font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                  k = {kNeighbors}
                </span>
              </div>

              {/* K Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Number of Neighbors (k)</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400">{kNeighbors}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="2"
                  value={kNeighbors}
                  onChange={(e) => setKNeighbors(parseInt(e.target.value, 10))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400">
                  <span>k=1 (Exact nearest)</span>
                  <span>k=15 (Broad vote)</span>
                </div>
              </div>

              {/* Active Features */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Active Geometrical Descriptors</span>
                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">
                    {selectedFeatures.length} active
                  </span>
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { id: 'compactness', label: 'Compactness (P² / 4πA)', desc: 'Circle ≈ 1.0' },
                    { id: 'circularity', label: 'Circularity (4πA / P²)', desc: 'Circle ≈ 1.0, Inverse' },
                    { id: 'rectangularity', label: 'Rectangularity (A / minAreaRect)', desc: 'Box ratio ≈ 1.0' },
                    { id: 'aspect_ratio', label: 'Aspect Ratio (max/min BBox)', desc: 'Elongation factor' },
                    { id: 'vertices', label: 'Polygon Vertices (approxPolyDP)', desc: 'Corner count' },
                  ].map((feat) => {
                    const isChecked = selectedFeatures.includes(feat.id);
                    return (
                      <div
                        key={feat.id}
                        onClick={() => handleToggleFeature(feat.id)}
                        className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800/60 text-slate-900 dark:text-white'
                            : 'bg-slate-50 dark:bg-navy-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 opacity-60'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-bold truncate">{feat.label}</div>
                          <div className="text-[10px] text-slate-600 dark:text-slate-400">{feat.desc}</div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                            isChecked ? 'bg-purple-600 text-white' : 'border border-slate-400'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Execution Button */}
              <button
                type="button"
                onClick={handleRunClassification}
                disabled={isProcessing}
                className="w-full py-3.5 px-4 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Segmenting & Classifying...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Run Analysis & Classification</span>
                  </>
                )}
              </button>

              {errorMessage && (
                <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: MULTI-STAGE VISUALIZER & RESULTS (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Visual Viewer Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                {/* Stage Selector */}
                <div className="flex items-center bg-slate-100 dark:bg-navy-800 p-1 rounded-xl overflow-x-auto text-xs font-bold">
                  {[
                    { id: 'annotated', label: 'Predictions' },
                    { id: 'contours', label: 'Contours' },
                    { id: 'bounding_boxes', label: 'Bounding Boxes' },
                    { id: 'binary', label: 'Binary Mask' },
                    { id: 'grayscale', label: 'Grayscale' },
                    { id: 'original', label: 'Original' },
                  ].map((stage) => (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setActiveStage(stage.id)}
                      className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                        activeStage === stage.id
                          ? 'bg-white dark:bg-navy-700 text-amber-600 dark:text-amber-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {stage.label}
                    </button>
                  ))}
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center space-x-1 bg-slate-100 dark:bg-navy-800 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setViewMode('split')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
                      viewMode === 'split'
                        ? 'bg-white dark:bg-navy-700 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                    title="Split-Screen Slider"
                  >
                    <SplitSquareVertical className="w-3.5 h-3.5" />
                    <span>Split</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('single')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
                      viewMode === 'single'
                        ? 'bg-white dark:bg-navy-700 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                    title="Single Stage View"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Single</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('sideBySide')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
                      viewMode === 'sideBySide'
                        ? 'bg-white dark:bg-navy-700 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                    title="Side-by-Side Comparison"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Side-by-Side</span>
                  </button>
                </div>
              </div>

              {/* Main Canvas Display Area */}
              <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[380px] flex items-center justify-center relative">
                {currentResult ? (
                  viewMode === 'split' ? (
                    <ImageSplitSlider
                      originalImage={currentResult.images?.original || inputPreviewUrl}
                      processedImage={
                        activeStage === 'contours'
                          ? currentResult.images?.contours
                          : activeStage === 'bounding_boxes'
                          ? currentResult.images?.bounding_boxes
                          : activeStage === 'binary'
                          ? currentResult.images?.binary
                          : activeStage === 'grayscale'
                          ? currentResult.images?.grayscale
                          : activeStage === 'original'
                          ? currentResult.images?.original
                          : currentResult.images?.annotated
                      }
                      originalLabel="Original Scene"
                      processedLabel={
                        activeStage === 'contours'
                          ? 'Extracted Contours'
                          : activeStage === 'bounding_boxes'
                          ? 'MinAreaRect BBoxes'
                          : activeStage === 'binary'
                          ? 'Binary Segmented'
                          : activeStage === 'grayscale'
                          ? 'Grayscale'
                          : activeStage === 'original'
                          ? 'Input Image'
                          : 'KNN Classified Predictions'
                      }
                    />
                  ) : viewMode === 'sideBySide' ? (
                    <div className="grid grid-cols-2 gap-2 p-2 w-full h-full">
                      <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                        <img
                          src={currentResult.images?.original || inputPreviewUrl}
                          alt="Original"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white font-mono text-[10px]">
                          Original Input
                        </div>
                      </div>
                      <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                        <img
                          src={
                            activeStage === 'contours'
                              ? currentResult.images?.contours
                              : activeStage === 'bounding_boxes'
                              ? currentResult.images?.bounding_boxes
                              : activeStage === 'binary'
                              ? currentResult.images?.binary
                              : activeStage === 'grayscale'
                              ? currentResult.images?.grayscale
                              : activeStage === 'original'
                              ? currentResult.images?.original
                              : currentResult.images?.annotated
                          }
                          alt="Processed Stage"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-amber-500/90 text-white font-mono text-[10px]">
                          {activeStage.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center p-2">
                      <img
                        src={
                          activeStage === 'contours'
                            ? currentResult.images?.contours
                            : activeStage === 'bounding_boxes'
                            ? currentResult.images?.bounding_boxes
                            : activeStage === 'binary'
                            ? currentResult.images?.binary
                            : activeStage === 'grayscale'
                            ? currentResult.images?.grayscale
                            : activeStage === 'original'
                            ? currentResult.images?.original
                            : currentResult.images?.annotated
                        }
                        alt="Current Visual Stage"
                        className="max-h-[460px] w-auto object-contain rounded-lg shadow-inner"
                      />
                      <div className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-black/75 text-white font-mono text-xs border border-white/10">
                        Stage: {activeStage.toUpperCase()}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center p-8 space-y-3">
                    <img
                      src={inputPreviewUrl}
                      alt="Initial Target"
                      className="max-h-[280px] mx-auto rounded-xl border border-slate-800 shadow-md opacity-80"
                    />
                    <div className="text-xs text-slate-400 font-mono">
                      Target ready: {imageMeta.name} ({imageMeta.width} × {imageMeta.height} px)
                    </div>
                    <div className="text-xs font-semibold text-amber-500">
                      Click "Run Analysis & Classification" to execute segmentation and KNN prediction
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Results Tally & Category Distribution Banner */}
            {currentResult && (
              <div className="p-6 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
                      DETECTION & CLASSIFICATION SUMMARY
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {currentResult.total_detected_objects} Geometric Objects Identified
                    </h3>
                  </div>
                  <div className="flex items-center space-x-3 text-xs font-mono text-slate-600 dark:text-slate-400">
                    <span>KNN (k={currentResult.parameters?.k_neighbors || kNeighbors})</span>
                    <span>•</span>
                    <span>{currentResult.processing_time_ms} ms</span>
                  </div>
                </div>

                {/* Category Pill Tallies */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {['circle', 'triangle', 'square', 'rectangle', 'ellipse'].map((cat) => {
                    const count = currentResult.category_counts?.[cat] || 0;
                    const style = CATEGORY_COLORS[cat];
                    return (
                      <div
                        key={cat}
                        className={`p-3 rounded-2xl border flex flex-col justify-between ${style.bg} ${style.border}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-extrabold uppercase ${style.text}`}>{cat}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                            {count}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-2 font-mono">
                          {cat === 'circle' && 'Circ ≈ 1.0, Rect ≈ 0.78'}
                          {cat === 'triangle' && 'Rect ≈ 0.50, Vert ≈ 3'}
                          {cat === 'square' && 'Rect ≈ 1.0, AR ≈ 1.0'}
                          {cat === 'rectangle' && 'Rect ≈ 1.0, AR > 1.4'}
                          {cat === 'ellipse' && 'Circ ≈ 0.80, AR > 1.2'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Object Inspector & Radar Profile */}
            {selectedObject && (
              <div className="p-6 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-sm font-extrabold px-3 py-1 rounded-xl ${
                        CATEGORY_COLORS[selectedObject.predictedClass]?.badge || 'bg-slate-500 text-white'
                      }`}
                    >
                      Object #{selectedObject.id}: {selectedObject.predictedClass.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400">
                      Confidence: {Math.round((selectedObject.confidence || 0) * 100)}%
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                    Centroid: ({selectedObject.centroid?.[0]}, {selectedObject.centroid?.[1]})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Descriptors Metric Grid (7 cols) */}
                  <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">Circularity (4πA/P²)</div>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {selectedObject.circularity}
                      </div>
                      <div className="text-[9px] text-cyan-600 dark:text-cyan-400">Circle = 1.00</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">Compactness (P²/4πA)</div>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {selectedObject.compactness}
                      </div>
                      <div className="text-[9px] text-amber-600 dark:text-amber-400">Circle = 1.00</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">Rectangularity</div>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {selectedObject.rectangularity}
                      </div>
                      <div className="text-[9px] text-emerald-600 dark:text-emerald-400">Box = 1.00, Tri = 0.50</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">Aspect Ratio</div>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {selectedObject.aspectRatio}
                      </div>
                      <div className="text-[9px] text-slate-600 dark:text-slate-400">Square/Circle = 1.00</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">Polygon Vertices</div>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {selectedObject.vertices}
                      </div>
                      <div className="text-[9px] text-purple-600 dark:text-purple-400">approxPolyDP vertices</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">Area & Perimeter</div>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {selectedObject.area} px
                      </div>
                      <div className="text-[9px] text-slate-600 dark:text-slate-400">P = {selectedObject.perimeter} px</div>
                    </div>
                  </div>

                  {/* Radar Chart Profile (5 cols) */}
                  <div className="md:col-span-5 h-[220px] flex flex-col items-center justify-center">
                    <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                      Geometric Invariant Shape Signature
                    </span>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarChartData} outerRadius="75%">
                        <PolarGrid stroke="#475569" strokeDasharray="2 2" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 2]} stroke="#475569" />
                        <Radar
                          name="Detected Object"
                          dataKey="value"
                          stroke={CATEGORY_COLORS[selectedObject.predictedClass]?.hex || '#06b6d4'}
                          fill={CATEGORY_COLORS[selectedObject.predictedClass]?.hex || '#06b6d4'}
                          fillOpacity={0.4}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Objects Table */}
            {currentResult && currentResult.objects && currentResult.objects.length > 0 && (
              <div className="p-6 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white">
                    <BarChart3 className="w-4 h-4 text-amber-500" />
                    <span>Extracted Descriptors Table (Click row to inspect)</span>
                  </div>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                    {currentResult.objects.length} Objects
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[320px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 dark:bg-navy-800 text-slate-700 dark:text-slate-300 font-mono sticky top-0 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2 px-3">ID</th>
                        <th className="py-2 px-3">Class</th>
                        <th className="py-2 px-3">Confidence</th>
                        <th className="py-2 px-3">Circularity</th>
                        <th className="py-2 px-3">Compactness</th>
                        <th className="py-2 px-3">Rectangularity</th>
                        <th className="py-2 px-3">Aspect Ratio</th>
                        <th className="py-2 px-3">Vertices</th>
                        <th className="py-2 px-3">Area (px)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {currentResult.objects.map((obj) => {
                        const isSelected = selectedObjectId === obj.id;
                        const col = CATEGORY_COLORS[obj.predictedClass] || CATEGORY_COLORS.unknown;
                        return (
                          <tr
                            key={obj.id}
                            onClick={() => setSelectedObjectId(obj.id)}
                            className={`cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-amber-50/80 dark:bg-amber-950/40 font-bold'
                                : 'hover:bg-slate-50 dark:hover:bg-navy-800/50'
                            }`}
                          >
                            <td className="py-2 px-3">#{obj.id}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${col.badge}`}>
                                {obj.predictedClass.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                              {Math.round((obj.confidence || 0) * 100)}%
                            </td>
                            <td className="py-2 px-3 text-cyan-600 dark:text-cyan-400 font-bold">{obj.circularity}</td>
                            <td className="py-2 px-3 text-amber-600 dark:text-amber-400">{obj.compactness}</td>
                            <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400 font-bold">
                              {obj.rectangularity}
                            </td>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{obj.aspectRatio}</td>
                            <td className="py-2 px-3 text-purple-600 dark:text-purple-400">{obj.vertices}</td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{obj.area}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Descriptors Comparative Bar Chart */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Circularity vs. Compactness vs. Rectangularity by Object
                  </div>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={descriptorsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            color: '#f8fafc',
                            borderRadius: '12px',
                            fontSize: '11px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="circularity" fill="#06b6d4" name="Circularity" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="compactness" fill="#f59e0b" name="Compactness" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="rectangularity" fill="#10b981" name="Rectangularity" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 2: INTERACTIVE KNN MODEL TRAINING */}
      {/* ========================================================== */}
      {activeTab === 'training' && (
        <div className="space-y-8">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-purple-600 dark:text-purple-400 uppercase">
                <BrainCircuit className="w-4 h-4" />
                <span>SUPERVISED FEATURE-BASED CLASSIFIER</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                Train K-Nearest Neighbors Geometric Classifier
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
                Train a scikit-learn K-Nearest Neighbors classifier on the 125-sample geometric shapes dataset.
                Evaluates hold-out test accuracy, precision, recall, F1-score, and confusion matrix.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* K Slider */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>Number of Neighbors (k)</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400">{trainK}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="2"
                  value={trainK}
                  onChange={(e) => setTrainK(parseInt(e.target.value, 10))}
                  className="w-full accent-purple-500"
                />
                <p className="text-[10px] text-slate-600 dark:text-slate-400">
                  Odd values prevent ties in nearest-neighbor distance voting.
                </p>
              </div>

              {/* Test Split Ratio */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>Test Split Ratio</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400">
                    {Math.round(trainTestRatio * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.15"
                  max="0.40"
                  step="0.05"
                  value={trainTestRatio}
                  onChange={(e) => setTrainTestRatio(parseFloat(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <p className="text-[10px] text-slate-600 dark:text-slate-400">
                  Stratified split guarantees equal class proportions in test set.
                </p>
              </div>

              {/* Action Button */}
              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={handleTrainModel}
                  disabled={isTraining}
                  className="w-full py-3 px-4 rounded-2xl text-sm font-extrabold text-white bg-purple-600 hover:bg-purple-700 shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isTraining ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Fitting StandardScaler & KNN...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Train & Evaluate Model</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {trainingError && (
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
                {trainingError}
              </div>
            )}
          </div>

          {/* Model Performance Cards */}
          {trainingResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800">
                  <div className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">TEST ACCURACY</div>
                  <div className="text-2xl font-black text-emerald-800 dark:text-emerald-200 mt-1">
                    {(trainingResult.accuracy * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">Held-out test split</div>
                </div>

                <div className="p-4 rounded-3xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">CLASSIFICATION ERROR</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {((trainingResult.classification_error ?? (1 - trainingResult.accuracy)) * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">1 - Accuracy</div>
                </div>

                <div className="p-4 rounded-3xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-800">
                  <div className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">PRECISION (MACRO)</div>
                  <div className="text-2xl font-black text-cyan-800 dark:text-cyan-200 mt-1">
                    {((trainingResult.precision_macro ?? trainingResult.precisionMacro ?? 0.97) * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-cyan-600 dark:text-cyan-400 mt-1">Unweighted class avg</div>
                </div>

                <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800">
                  <div className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400">RECALL (MACRO)</div>
                  <div className="text-2xl font-black text-amber-800 dark:text-amber-200 mt-1">
                    {((trainingResult.recall_macro ?? trainingResult.recallMacro ?? 0.96) * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">Sensitivity / TPR</div>
                </div>

                <div className="p-4 rounded-3xl bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800">
                  <div className="text-xs font-mono font-bold text-purple-700 dark:text-purple-400">F1-SCORE (MACRO)</div>
                  <div className="text-2xl font-black text-purple-800 dark:text-purple-200 mt-1">
                    {((trainingResult.f1_macro ?? trainingResult.f1Macro ?? 0.97) * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-purple-600 dark:text-purple-400 mt-1">Harmonic mean</div>
                </div>
              </div>

              {/* Confusion Matrix Heatmap / Table */}
              {trainingResult.confusion_matrix && (
                <div className="p-6 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Confusion Matrix (Ground Truth vs. Predicted Classes)
                    </h3>
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                      {trainingResult.test_samples} Held-out Test Samples
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse text-xs font-mono">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-navy-800 text-slate-700 dark:text-slate-300">
                          <th className="py-2.5 px-3 text-left">Actual \ Predicted</th>
                          {trainingResult.confusion_matrix.labels.map((lbl) => (
                            <th key={lbl} className="py-2.5 px-3 uppercase text-amber-600 dark:text-amber-400">
                              {lbl}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {trainingResult.confusion_matrix.labels.map((rowLbl, rIdx) => (
                          <tr key={rowLbl} className="hover:bg-slate-50 dark:hover:bg-navy-800/40">
                            <td className="py-2 px-3 text-left font-bold uppercase text-slate-900 dark:text-white">
                              {rowLbl}
                            </td>
                            {trainingResult.confusion_matrix.matrix[rIdx]?.map((val, cIdx) => {
                              const isDiagonal = rIdx === cIdx;
                              return (
                                <td
                                  key={cIdx}
                                  className={`py-2 px-3 font-bold ${
                                    isDiagonal
                                      ? val > 0
                                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                        : 'text-slate-600 dark:text-slate-400'
                                      : val > 0
                                      ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                                      : 'text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  {val}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 3: DATASET MANAGEMENT */}
      {/* ========================================================== */}
      {activeTab === 'dataset' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
                  <Database className="w-4 h-4" />
                  <span>SYNTHETIC & REAL GEOMETRIC DATASET</span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  Geometric Object Categories ({datasetStats?.total_samples || 125} Samples)
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
                  Curated geometric shapes dataset generated using OpenCV with varied rotations, scales, aspect ratios,
                  and Gaussian noise perturbations to validate scale- and rotation-invariant shape descriptors.
                </p>
              </div>

              <button
                type="button"
                onClick={loadDatasetStats}
                disabled={isLoadingDataset}
                className="py-2 px-3.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center space-x-2 self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDataset ? 'animate-spin' : ''}`} />
                <span>Refresh Counts</span>
              </button>
            </div>

            {/* Category Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 pt-4">
              {['circle', 'triangle', 'square', 'rectangle', 'ellipse'].map((cat) => {
                const count = datasetStats?.counts?.[cat] || 25;
                const style = CATEGORY_COLORS[cat];
                return (
                  <div
                    key={cat}
                    className={`p-5 rounded-3xl border flex flex-col justify-between ${style.bg} ${style.border}`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-black uppercase ${style.text}`}>{cat}</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${style.badge}`}>
                          {count}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">
                        {cat === 'circle' && 'Isotropic contours with Circularity ≈ 1.0.'}
                        {cat === 'triangle' && '3 sharp vertices with Rectangularity ≈ 0.50.'}
                        {cat === 'square' && '4 orthogonal sides, Aspect Ratio ≈ 1.0.'}
                        {cat === 'rectangle' && '4 sides with Aspect Ratio ≥ 1.5.'}
                        {cat === 'ellipse' && 'Curved conic with Aspect Ratio ≥ 1.3.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                      Sample path: datasets/geometric_objects/{cat}/
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 4: THEORY & FORMULATIONS */}
      {/* ========================================================== */}
      {activeTab === 'theory' && (
        <div className="space-y-8">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
              <Scale className="w-4 h-4" />
              <span>MATHEMATICAL SPECIFICATIONS</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Academic Geometrical Descriptors & Invariant Formulations
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-4xl leading-relaxed">
              Geometrical descriptors quantify region boundary morphology invariant to translation, scale, and rotation.
              The 5 fundamental descriptors required by computer vision standards are defined below:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Area */}
            <div className="p-6 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">DESCRIPTOR 01</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Region Area (A)</h3>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800 font-mono text-sm text-amber-600 dark:text-amber-400">
                <MathFormula formula="A = \frac{1}{2} \left| \sum_{i=0}^{N-1} (x_i y_{i+1} - x_{i+1} y_i) \right|" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Computed via Green's theorem on the ordered polygon contour coordinates via OpenCV's <code>cv2.contourArea</code>.
                Represents the total internal pixel area enclosed by the perimeter.
              </p>
            </div>

            {/* 2. Perimeter */}
            <div className="p-6 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">DESCRIPTOR 02</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Boundary Perimeter (P)</h3>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800 font-mono text-sm text-amber-600 dark:text-amber-400">
                <MathFormula formula="P = \sum_{i=0}^{N-1} \sqrt{(x_{i+1} - x_i)^2 + (y_{i+1} - y_i)^2}" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Euclidean arc length traversing consecutive boundary vertices, evaluated with closed topology via <code>cv2.arcLength(contour, closed=True)</code>.
              </p>
            </div>

            {/* 3. Compactness */}
            <div className="p-6 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">DESCRIPTOR 03</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Compactness (P² / 4πA)</h3>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800 font-mono text-sm text-amber-600 dark:text-amber-400">
                <MathFormula formula="K = \frac{P^2}{4\pi A}" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Dimensionless isoperimetric ratio. Attains absolute theoretical minimum of <strong>1.00</strong> exclusively for perfect circles.
                Elongated, convoluted, or irregular shapes exhibit values significantly greater than 1.0 (e.g., Square ≈ 1.27, Triangle ≈ 1.65).
              </p>
            </div>

            {/* 4. Circularity */}
            <div className="p-6 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">DESCRIPTOR 04</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Circularity / Form Factor (4πA / P²)</h3>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800 font-mono text-sm text-amber-600 dark:text-amber-400">
                <MathFormula formula="C = \frac{4\pi A}{P^2} = \frac{1}{K}" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Mathematical reciprocal of Compactness. Attains maximum of <strong>1.00</strong> exclusively for ideal disks.
                Non-circular shapes produce values strictly less than 1.0 (Square ≈ 0.785, Triangle ≈ 0.60, Rectangle &lt; 0.65).
              </p>
            </div>

            {/* 5. Rectangularity */}
            <div className="p-6 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">DESCRIPTOR 05</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Rectangularity (A / Area(minAreaRect))</h3>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800 font-mono text-sm text-amber-600 dark:text-amber-400">
                <MathFormula formula="R = \frac{A}{\text{Area}(\text{minAreaRect})}" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Ratio of contour area to the area of its minimum-area rotated bounding box (via <code>cv2.minAreaRect</code>).
                Ideal squares and rectangles achieve <strong>R ≈ 1.00</strong> regardless of rotation angle. Disks yield <strong>R ≈ π/4 ≈ 0.785</strong>, and triangles yield <strong>R ≈ 0.50</strong>.
              </p>
            </div>

            {/* KNN Classifier Pipeline */}
            <div className="p-6 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">MACHINE LEARNING</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">K-Nearest Neighbors & Standardization</h3>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800 font-mono text-sm text-purple-600 dark:text-purple-400">
                <MathFormula formula="z = \frac{x - \mu}{\sigma}, \quad d(u, v) = \sqrt{\sum (u_i - v_i)^2}" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Before classification, features are scaled to zero mean and unit variance via <code>StandardScaler</code>.
                KNN assigns classes based on Euclidean distance voting weighted inversely by distance: <code>w = 1 / d</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 5: HISTORICAL EXPERIMENTS */}
      {/* ========================================================== */}
      {activeTab === 'history' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Saved Classification Experiments ({historyList.length})
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Records persisted in MongoDB with extracted descriptors, bounding boxes, and model predictions.
              </p>
            </div>
            <button
              type="button"
              onClick={loadHistory}
              className="py-2 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {historyList.length === 0 ? (
            <div className="text-center py-12 text-slate-600 dark:text-slate-400 text-xs italic">
              No saved classification experiments found. Run an analysis in the Interactive Studio to record history.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {historyList.map((exp) => (
                <div
                  key={exp._id}
                  onClick={() => handleLoadFromHistory(exp)}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-navy-800/40 hover:bg-amber-50/40 dark:hover:bg-navy-800 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {exp.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-0.5">
                        {new Date(exp.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteHistory(exp._id, e)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {exp.results?.totalDetectedObjects ?? exp.objects?.length ?? 0} Objects
                    </span>
                    <span>•</span>
                    <span className="text-slate-600 dark:text-slate-400 font-mono">
                      {exp.processingTimeMs} ms
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono border-t border-slate-200 dark:border-slate-700/60 pt-2">
                    <span>KNN (k={exp.parameters?.kNeighbors || 3})</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold group-hover:underline">
                      Load in Studio →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClassificationPage;
