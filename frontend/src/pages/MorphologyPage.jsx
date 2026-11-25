import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Shapes,
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
  Minimize2,
} from 'lucide-react';
import ImageSplitSlider from '../components/ImageSplitSlider';
import MathFormula from '../components/MathFormula';
import HistogramChart from '../components/HistogramChart';
import SampleGallery from '../components/SampleGallery';
import apiService from '../services/api';
import {
  exportMorphologyCSV,
  exportMorphologyJSON,
  generateMorphologyPDFReport,
} from '../utils/exportUtils';

export const MorphologyPage = () => {
  // Navigation / Tab state
  const [activeTab, setActiveTab] = useState('workspace'); // 'workspace' | 'theory' | 'history'

  // Benchmark datasets
  const [samples, setSamples] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState('coins_touching_8');

  // Input image state
  const [sourceType, setSourceType] = useState('sample'); // 'sample' | 'custom'
  const [inputImageFile, setInputImageFile] = useState(null);
  const [inputPreviewUrl, setInputPreviewUrl] = useState('/samples/coins_touching_8.png');
  const [imageMeta, setImageMeta] = useState({ width: 560, height: 320, name: 'coins_touching_8.png' });

  // Parameter states
  const [thresholdMethod, setThresholdMethod] = useState('otsu'); // 'otsu' | 'manual' | 'adaptive'
  const [thresholdValue, setThresholdValue] = useState(127);
  const [polarity, setPolarity] = useState('bright_on_dark'); // 'bright_on_dark' | 'dark_on_bright'
  const [structuringElement, setStructuringElement] = useState('ellipse'); // 'ellipse' | 'rectangle' | 'cross'
  const [kernelSize, setKernelSize] = useState(3);
  const [erosionIterations, setErosionIterations] = useState(3);
  const [dilationIterations, setDilationIterations] = useState(1);

  // Histogram UI state (independent from algorithm execution)
  const [histViewMode, setHistViewMode] = useState('both'); // 'both' | 'original' | 'preprocessed' | 'color'
  const [histChannel, setHistChannel] = useState('luminance'); // 'luminance' | 'r' | 'g' | 'b'
  const [operationMode, setOperationMode] = useState('custom'); // 'custom' | 'opening' | 'erosion_only'
  const [connectivity, setConnectivity] = useState(8); // 4 | 8
  const [minComponentArea, setMinComponentArea] = useState(50);
  const [manualCount, setManualCount] = useState(8);
  const [experimentName, setExperimentName] = useState('Coin-Separation-Trial');
  const [userObservations, setUserObservations] = useState('');

  // Processing execution states
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [currentResult, setCurrentResult] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'single' | 'sideBySide'
  const [selectedStage, setSelectedStage] = useState('separatedObjects'); // 'original' | 'grayscale' | 'binary' | 'erosion' | 'dilation' | 'opening' | 'separatedObjects'
  const [leftStage, setLeftStage] = useState('original');
  const [rightStage, setRightStage] = useState('separatedObjects');
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const stageButtonRefs = useRef({});

  // Structuring element comparison experiment state
  const [isRunningComparison, setIsRunningComparison] = useState(false);
  const [comparisonResults, setComparisonResults] = useState(null);

  // History states
  const [historyList, setHistoryList] = useState([]);

  const fileInputRef = useRef(null);

  // Load benchmark samples and experiment history on mount
  useEffect(() => {
    apiService.morphology
      .getSamples()
      .then((data) => {
        if (data && data.samples) {
          setSamples(data.samples);
        }
      })
      .catch((err) => console.warn('Could not load morphology samples:', err.message));

    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await apiService.morphology.getHistory();
      if (res && res.history) {
        setHistoryList(res.history);
      }
    } catch (err) {
      console.warn('Could not load history:', err.message);
    }
  };

  // Handle sample selection
  const handleSelectSample = (sample) => {
    setSelectedSampleId(sample.id);
    setSourceType('sample');
    setInputImageFile(null);
    setInputPreviewUrl(sample.previewUrl);
    setCurrentResult(null);
    setErrorMessage(null);
    setSelectedStage('original');
    setLeftStage('original');
    setRightStage('separatedObjects');
    setManualCount(sample.manualCount || null);
    setImageMeta({
      width: parseInt(sample.dimensions.split('×')[0], 10) || 500,
      height: parseInt(sample.dimensions.split('×')[1], 10) || 400,
      name: sample.filename,
    });

    if (sample.recommendedParams) {
      setThresholdMethod(sample.recommendedParams.thresholdMethod || 'otsu');
      setPolarity(sample.recommendedParams.polarity || 'auto');
      setStructuringElement(sample.recommendedParams.structuringElement || 'ellipse');
      setKernelSize(sample.recommendedParams.kernelWidth || 3);
      setErosionIterations(sample.recommendedParams.erosionIterations || 3);
      setDilationIterations(sample.recommendedParams.dilationIterations || 1);
      setOperationMode(sample.recommendedParams.operationMode || 'custom');
      setMinComponentArea(sample.recommendedParams.minComponentArea || 50);
      if (sample.recommendedParams.manualCount !== undefined) {
        setManualCount(sample.recommendedParams.manualCount);
      }
    }
  };

  // Handle custom file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp|tiff)$/)) {
      setErrorMessage('Unsupported file format. Please upload JPG, PNG, WEBP, or TIFF.');
      return;
    }

    setSourceType('custom');
    setInputImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setInputPreviewUrl(objectUrl);
    setCurrentResult(null);
    setSelectedStage('original');
    setLeftStage('original');
    setRightStage('separatedObjects');

    const img = new Image();
    img.onload = () => {
      setImageMeta({
        width: img.naturalWidth,
        height: img.naturalHeight,
        name: file.name,
      });
    };
    img.src = objectUrl;

    setErrorMessage(null);
  };

  // Execute processing pipeline
  const handleRunProcessing = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();

      if (sourceType === 'custom' && inputImageFile) {
        formData.append('image', inputImageFile);
      } else {
        formData.append('sampleId', selectedSampleId);
      }

      formData.append('threshold_method', thresholdMethod);
      formData.append('threshold_value', String(thresholdValue));
      formData.append('polarity', polarity);
      formData.append('structuring_element', structuringElement);
      formData.append('kernel_width', String(kernelSize));
      formData.append('kernel_height', String(kernelSize));
      formData.append('erosion_iterations', String(erosionIterations));
      formData.append('dilation_iterations', String(dilationIterations));
      formData.append('operation_mode', operationMode);
      formData.append('connectivity', String(connectivity));
      formData.append('min_component_area', String(minComponentArea));
      if (manualCount !== null && manualCount !== '' && !isNaN(manualCount)) {
        formData.append('manual_count', String(manualCount));
      }
      formData.append('experimentName', experimentName);
      formData.append('userObservations', userObservations);

      const result = await apiService.morphology.process(formData);
      setCurrentResult(result);
      if (selectedStage === 'original') {
        setSelectedStage('separatedObjects');
      }
      loadHistory();
    } catch (err) {
      console.error('Morphology execution error:', err);
      setErrorMessage(err.message || 'Processing failed. Please check backend connection.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset parameters to defaults
  const handleResetParameters = () => {
    setThresholdMethod('otsu');
    setThresholdValue(127);
    setPolarity('bright_on_dark');
    setStructuringElement('ellipse');
    setKernelSize(3);
    setErosionIterations(3);
    setDilationIterations(1);
    setOperationMode('custom');
    setConnectivity(8);
    setMinComponentArea(50);
    setErrorMessage(null);
  };

  // Run 3-Way Structuring Element Comparison
  const handleRunComparison = async () => {
    setIsRunningComparison(true);
    try {
      const configs = [
        { name: '3×3 Ellipse (Isotropic)', se: 'ellipse', k: 3, e: 3, d: 1 },
        { name: '5×5 Rectangle (Aggressive)', se: 'rectangle', k: 5, e: 2, d: 1 },
        { name: '7×7 Cross (Orthogonal)', se: 'cross', k: 7, e: 2, d: 1 },
      ];

      const results = [];
      for (const cfg of configs) {
        const formData = new FormData();
        if (sourceType === 'custom' && inputImageFile) {
          formData.append('image', inputImageFile);
        } else {
          formData.append('sampleId', selectedSampleId);
        }
        formData.append('threshold_method', thresholdMethod);
        formData.append('threshold_value', String(thresholdValue));
        formData.append('polarity', polarity);
        formData.append('structuring_element', cfg.se);
        formData.append('kernel_width', String(cfg.k));
        formData.append('kernel_height', String(cfg.k));
        formData.append('erosion_iterations', String(cfg.e));
        formData.append('dilation_iterations', String(cfg.d));
        formData.append('operation_mode', operationMode);
        formData.append('connectivity', String(connectivity));
        formData.append('min_component_area', String(minComponentArea));
        if (manualCount !== null && manualCount !== '' && !isNaN(manualCount)) {
          formData.append('manual_count', String(manualCount));
        }

        const res = await apiService.morphology.process(formData);
        results.push({
          configName: cfg.name,
          shape: cfg.se,
          kernel: `${cfg.k}×${cfg.k}`,
          erosion: cfg.e,
          dilation: cfg.d,
          count: res.automaticCount,
          gain: res.evaluation?.separated_gain ?? 0,
          agreement: res.evaluation?.count_agreement_percent ?? null,
          timeMs: res.processingTimeMs,
          labeledImg: res.images?.labeled,
        });
      }

      setComparisonResults(results);
    } catch (err) {
      console.warn('Comparison run error:', err.message);
    } finally {
      setIsRunningComparison(false);
    }
  };

  // Helper to trigger direct image download
  const downloadImage = (dataUrl, filename) => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Canonical 7-stage configuration mapping stable IDs to OpenCV/Express image keys
  const stages = [
    {
      id: 'original',
      label: '1. Original Coin Image',
      imageKey: 'original',
      aliasKey: 'originalImage',
      description: 'Original uploaded or selected benchmark photograph prior to grayscale conversion.',
    },
    {
      id: 'grayscale',
      label: '2. Grayscale Image',
      imageKey: 'grayscale',
      aliasKey: 'grayscaleImage',
      description: 'Single-channel luminance representation converted via cv2.cvtColor().',
    },
    {
      id: 'binary',
      label: '3. Binary Mask',
      imageKey: 'binary',
      aliasKey: 'binaryImage',
      description: 'Thresholded foreground mask (white coins on black background) before morphological operations.',
    },
    {
      id: 'erosion',
      label: '4. Erosion Result',
      imageKey: 'eroded',
      aliasKey: 'erodedImage',
      description: 'Output of cv2.erode() severing narrow touching bridges between adjacent coins.',
    },
    {
      id: 'dilation',
      label: '5. Dilation Result',
      imageKey: 'dilated',
      aliasKey: 'dilatedImage',
      description: 'Output of cv2.dilate() restoring object boundaries after erosion.',
    },
    {
      id: 'opening',
      label: '6. Morphological Opening',
      imageKey: 'opened',
      aliasKey: 'openingImage',
      description: 'Output of cv2.morphologyEx(MORPH_OPEN) removing small foreground noise while preserving shape.',
    },
    {
      id: 'separatedObjects',
      label: '7. Final Separated Objects',
      imageKey: 'labeled',
      aliasKey: 'labeledImage',
      description: 'Connected-component labeled visualization with distinct object hues, bounding boxes, and IDs.',
    },
  ];

  const getStageMeta = (stageId) => stages.find((s) => s.id === stageId) || stages[0];

  const getStageImage = (stageId) => {
    const meta = getStageMeta(stageId);
    if (stageId === 'original') {
      return currentResult?.images?.originalImage || currentResult?.images?.original || inputPreviewUrl || null;
    }
    if (!currentResult?.images) return null;
    return currentResult.images[meta.aliasKey] || currentResult.images[meta.imageKey] || null;
  };

  const handleSelectStage = (stageId) => {
    setSelectedStage(stageId);
    if (viewMode === 'split' && stageId !== leftStage) {
      setRightStage(stageId);
    }
    const btnEl = stageButtonRefs.current?.[stageId];
    if (btnEl && typeof btnEl.scrollIntoView === 'function') {
      btnEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
            <Link
              to="/"
              className="inline-flex items-center space-x-1 hover:text-teal-600 dark:hover:text-teal-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Studio</span>
            </Link>
            <span>/</span>
            <span>MODULE 02</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2 mt-1">
            <Shapes className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            <span>Morphological Object Separation & Counting</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Sever narrow topological bridges between lightly touching circular objects and count them using connected-component analysis.
          </p>
        </div>

        {/* Tab navigation pills */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'workspace'
                ? 'bg-white dark:bg-navy-800 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Processing Studio
          </button>
          <button
            onClick={() => setActiveTab('theory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'theory'
                ? 'bg-white dark:bg-navy-800 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Theory & Formulas
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-navy-800 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            History ({historyList.length})
          </button>
        </div>
      </div>

      {/* Error alert banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200 flex items-start space-x-3 text-xs sm:text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Execution Error: </span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================== */}
      {/* WORKSPACE TAB */}
      {/* ========================================================== */}
      {activeTab === 'workspace' && (
        <div className="space-y-8">
          {/* Main 3-Column Layout: Left Controls, Center Visualizer, Right Results */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ---------------------------------------------------- */}
            {/* COLUMN 1: CONTROLS & PARAMETERS (lg:col-span-4) */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* Image Input Selection Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
                    <ImageIcon className="w-4 h-4" />
                    <span>INPUT OBJECT TARGET</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {imageMeta.width}×{imageMeta.height} px
                  </span>
                </div>

                {/* Source toggle */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSourceType('sample')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      sourceType === 'sample'
                        ? 'bg-white dark:bg-navy-800 text-teal-700 dark:text-teal-300 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Benchmark Datasets
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSourceType('custom');
                      fileInputRef.current?.click();
                    }}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                      sourceType === 'custom'
                        ? 'bg-white dark:bg-navy-800 text-teal-700 dark:text-teal-300 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/tiff"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Sample selector gallery */}
                {sourceType === 'sample' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Select Photographic Benchmark:
                    </label>
                    <SampleGallery
                      samples={samples}
                      selectedId={selectedSampleId}
                      onSelect={handleSelectSample}
                      accentColor="teal"
                    />
                  </div>
                )}

                {/* Manual Reference Count input */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1.5">
                    <span>Manual Reference Count (Ground Truth)</span>
                    <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400">For Accuracy Evaluation</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={manualCount ?? ''}
                    onChange={(e) => setManualCount(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                    placeholder="Enter known count (e.g. 8, 12, 24)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Algorithmic Parameters Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
                    <Sliders className="w-4 h-4" />
                    <span>MORPHOLOGICAL CONTROLS</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetParameters}
                    className="text-[11px] font-mono text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Thresholding Method */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                    <span>Binarization Algorithm</span>
                    <span className="font-mono text-teal-600 dark:text-teal-400 uppercase">{thresholdMethod}</span>
                  </label>
                  <div className="grid grid-cols-5 gap-1">
                    {['otsu', 'manual', 'adaptive', 'lab', 'hsv'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setThresholdMethod(method)}
                        className={`py-1.5 text-[11px] font-semibold rounded-lg uppercase transition-all ${
                          thresholdMethod === method
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual Threshold Value Slider */}
                {thresholdMethod === 'manual' && (
                  <div className="space-y-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                      <span>Cutoff Threshold:</span>
                      <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{thresholdValue}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      step="1"
                      value={thresholdValue}
                      onChange={(e) => setThresholdValue(parseInt(e.target.value, 10))}
                      className="w-full accent-teal-600 cursor-pointer"
                    />
                  </div>
                )}

                {/* Polarity Toggle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Object Polarity:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPolarity('auto')}
                      className={`py-1.5 px-1.5 rounded-lg font-medium border text-center transition-all ${
                        polarity === 'auto'
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Auto Polarity
                    </button>
                    <button
                      type="button"
                      onClick={() => setPolarity('bright_on_dark')}
                      className={`py-1.5 px-1.5 rounded-lg font-medium border text-center transition-all ${
                        polarity === 'bright_on_dark'
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Bright / Dark BG
                    </button>
                    <button
                      type="button"
                      onClick={() => setPolarity('dark_on_bright')}
                      className={`py-1.5 px-1.5 rounded-lg font-medium border text-center transition-all ${
                        polarity === 'dark_on_bright'
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Dark / Light BG
                    </button>
                  </div>
                </div>

                {/* Structuring Element Shape */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                    <span>Structuring Element Kernel Shape</span>
                    <span className="font-mono text-teal-600 dark:text-teal-400 capitalize">{structuringElement}</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'ellipse', label: 'Ellipse / Disk' },
                      { id: 'rectangle', label: 'Rectangle' },
                      { id: 'cross', label: 'Cross' },
                    ].map((shape) => (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() => setStructuringElement(shape.id)}
                        className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          structuringElement === shape.id
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {shape.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kernel Size Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span>Kernel Matrix Dimension:</span>
                    <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{kernelSize} × {kernelSize} px</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="15"
                    step="2"
                    value={kernelSize}
                    onChange={(e) => setKernelSize(parseInt(e.target.value, 10))}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                </div>

                {/* Erosion & Dilation Iterations */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                      <span>Erosion:</span>
                      <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{erosionIterations}×</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={erosionIterations}
                      onChange={(e) => setErosionIterations(parseInt(e.target.value, 10))}
                      className="w-full accent-teal-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                      <span>Dilation:</span>
                      <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{dilationIterations}×</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={dilationIterations}
                      onChange={(e) => setDilationIterations(parseInt(e.target.value, 10))}
                      className="w-full accent-teal-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Operation Mode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Execution Mode:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                    {[
                      { id: 'custom', label: 'Erode & Dilate' },
                      { id: 'opening', label: 'Opening (A∘B)' },
                      { id: 'erosion_only', label: 'Erosion Only' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setOperationMode(mode.id)}
                        className={`py-1.5 px-1 rounded-lg font-semibold border transition-all text-center ${
                          operationMode === mode.id
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Connectivity & Min Component Area */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Neighborhood:
                    </label>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {[4, 8].map((conn) => (
                        <button
                          key={conn}
                          type="button"
                          onClick={() => setConnectivity(conn)}
                          className={`py-1.5 rounded-lg font-semibold border transition-all text-center ${
                            connectivity === conn
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {conn}-Conn
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                      <span>Min Area:</span>
                      <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{minComponentArea} px</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="300"
                      step="10"
                      value={minComponentArea}
                      onChange={(e) => setMinComponentArea(parseInt(e.target.value, 10))}
                      className="w-full accent-teal-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Experiment Run Buttons */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleRunProcessing}
                    disabled={isProcessing}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 active:scale-[0.99] transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Severing Touching Bridges...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Run Morphological Separation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* COLUMN 2: MULTI-STAGE VISUALIZATION (lg:col-span-5) */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-5 space-y-4">
              
              <div className="p-5 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                
                {/* Visualizer Header with View Mode Toggles */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
                    <Eye className="w-4 h-4" />
                    <span>INSPECTION CANVAS</span>
                  </div>

                  <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => setViewMode('split')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        viewMode === 'split'
                          ? 'bg-white dark:bg-navy-800 text-teal-700 dark:text-teal-300 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Split Slider
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('single')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        viewMode === 'single'
                          ? 'bg-white dark:bg-navy-800 text-teal-700 dark:text-teal-300 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Single Stage
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('sideBySide')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        viewMode === 'sideBySide'
                          ? 'bg-white dark:bg-navy-800 text-teal-700 dark:text-teal-300 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Dual View
                    </button>
                  </div>
                </div>

                {/* Stage Selector Pills (Accessible, Horizontally Scrollable) */}
                <div
                  role="tablist"
                  aria-label="Morphological Processing Stages"
                  className="flex items-center space-x-1.5 overflow-x-auto pb-2 pt-0.5 text-[11px] scrollbar-thin"
                >
                  {stages.map((stg) => {
                    const isSelected = selectedStage === stg.id;
                    const isDisabled = !currentResult && stg.id !== 'original';
                    return (
                      <button
                        key={stg.id}
                        ref={(el) => {
                          stageButtonRefs.current[stg.id] = el;
                        }}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => handleSelectStage(stg.id)}
                        disabled={isDisabled}
                        className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                          isSelected
                            ? 'bg-teal-600 text-white font-bold shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
                        }`}
                      >
                        {stg.label}
                      </button>
                    );
                  })}
                </div>

                {/* Active Stage Title & Description */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {getStageMeta(selectedStage).label}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 ml-2 text-[11px]">
                      {getStageMeta(selectedStage).description}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      {currentResult?.metadata?.width || imageMeta.width} × {currentResult?.metadata?.height || imageMeta.height} px
                    </span>
                    {getStageImage(selectedStage) && (
                      <button
                        type="button"
                        onClick={() => setIsZoomModalOpen(true)}
                        title="Zoom / Preview Stage"
                        className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-teal-600 dark:text-teal-400"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Display Canvas Area */}
                <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[340px] flex flex-col justify-center">
                  
                  {/* View Mode: Split Slider */}
                  {viewMode === 'split' && (
                    <div className="w-full space-y-2">
                      <div className="grid grid-cols-2 gap-2 px-2.5 pt-2.5 text-[11px] font-mono">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-400 shrink-0">Left:</span>
                          <select
                            value={leftStage}
                            onChange={(e) => setLeftStage(e.target.value)}
                            className="w-full px-2 py-1 rounded-lg bg-slate-900 text-slate-200 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          >
                            {stages.map((s) => (
                              <option key={s.id} value={s.id} disabled={!currentResult && s.id !== 'original'}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-teal-400 shrink-0">Right:</span>
                          <select
                            value={rightStage}
                            onChange={(e) => {
                              setRightStage(e.target.value);
                              setSelectedStage(e.target.value);
                            }}
                            className="w-full px-2 py-1 rounded-lg bg-slate-900 text-teal-300 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          >
                            {stages.map((s) => (
                              <option key={s.id} value={s.id} disabled={!currentResult && s.id !== 'original'}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <ImageSplitSlider
                        beforeImage={getStageImage(leftStage)}
                        afterImage={getStageImage(rightStage)}
                        beforeLabel={getStageMeta(leftStage).label}
                        afterLabel={currentResult ? getStageMeta(rightStage).label : 'Awaiting Processing'}
                        theme="teal"
                        className="w-full h-80 sm:h-96"
                      />
                    </div>
                  )}

                  {/* View Mode: Single Stage View */}
                  {viewMode === 'single' && (
                    <div className="w-full h-80 sm:h-96 flex items-center justify-center p-2 relative">
                      {getStageImage(selectedStage) ? (
                        <img
                          src={getStageImage(selectedStage)}
                          alt={getStageMeta(selectedStage).label}
                          className="max-h-full max-w-full object-contain rounded-lg shadow-inner"
                        />
                      ) : (
                        <div className="text-center space-y-1.5 p-6">
                          <div className="text-xs font-mono font-bold text-slate-300">
                            {currentResult ? 'Stage unavailable' : 'Awaiting Processing'}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {currentResult
                              ? `No output generated for ${getStageMeta(selectedStage).label}.`
                              : `Click "Apply Processing" to generate ${getStageMeta(selectedStage).label}.`}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* View Mode: Dual View Side-by-Side */}
                  {viewMode === 'sideBySide' && (
                    <div className="w-full p-2.5 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[
                          { label: 'LEFT PANEL', value: leftStage, onChange: setLeftStage, accent: 'text-slate-300' },
                          {
                            label: 'RIGHT PANEL',
                            value: rightStage,
                            onChange: (val) => {
                              setRightStage(val);
                              setSelectedStage(val);
                            },
                            accent: 'text-teal-300',
                          },
                        ].map((panel) => {
                          const panelImg = getStageImage(panel.value);
                          const panelMeta = getStageMeta(panel.value);
                          return (
                            <div
                              key={panel.label}
                              className="flex flex-col bg-slate-900 rounded-lg p-2.5 border border-slate-800 space-y-2 min-h-[290px]"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-[10px] font-mono font-bold ${panel.accent}`}>
                                  {panel.label}
                                </span>
                                <select
                                  value={panel.value}
                                  onChange={(e) => panel.onChange(e.target.value)}
                                  className="text-[11px] font-mono px-2 py-1 rounded bg-slate-950 text-slate-200 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 max-w-[190px]"
                                >
                                  {stages.map((s) => (
                                    <option key={s.id} value={s.id} disabled={!currentResult && s.id !== 'original'}>
                                      {s.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex-1 flex items-center justify-center bg-slate-950/60 rounded border border-slate-800/80 p-1.5 min-h-[220px]">
                                {panelImg ? (
                                  <img
                                    src={panelImg}
                                    alt={panelMeta.label}
                                    className="max-h-60 max-w-full object-contain rounded"
                                  />
                                ) : (
                                  <div className="text-xs text-slate-500 font-mono text-center p-4">
                                    {currentResult ? 'Stage unavailable' : `Run processing to view ${panelMeta.label}`}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Zoom / Preview Modal for Active Stage */}
                {isZoomModalOpen && getStageImage(selectedStage) && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
                    onClick={() => setIsZoomModalOpen(false)}
                  >
                    <div
                      className="max-w-4xl w-full rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {getStageMeta(selectedStage).label}
                          </h4>
                          <p className="text-[11px] font-mono text-slate-500">
                            {currentResult?.metadata?.width || imageMeta.width} × {currentResult?.metadata?.height || imageMeta.height} px
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsZoomModalOpen(false)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                        >
                          Close
                        </button>
                      </div>
                      <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[75vh]">
                        <img
                          src={getStageImage(selectedStage)}
                          alt={getStageMeta(selectedStage).label}
                          className="max-h-[68vh] w-auto object-contain rounded"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Direct Image Downloads */}
                {currentResult?.images && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-500 font-mono">
                      Export Visuals:
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => downloadImage(currentResult.images.labeled, 'labeled_objects.png')}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Labeled PNG</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadImage(currentResult.images.binary, 'binary_mask.png')}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Binary PNG</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* COLUMN 3: QUANTITATIVE RESULTS & METRICS (lg:col-span-3) */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-3 space-y-4">
              
              {/* Primary Count Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
                    <BarChart3 className="w-4 h-4" />
                    <span>AUTOMATIC COUNT TALLY</span>
                  </div>
                  {currentResult?.processingTimeMs && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {currentResult.processingTimeMs} ms
                    </span>
                  )}
                </div>

                {/* Big Count Badge */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-cyan-500/10 dark:from-teal-950/40 dark:via-navy-900 dark:to-cyan-950/40 border border-teal-200 dark:border-teal-800/60 text-center space-y-1">
                  <div className="text-4xl sm:text-5xl font-extrabold font-mono text-teal-600 dark:text-teal-400">
                    {currentResult ? currentResult.automaticCount : '--'}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Detected Circular Objects
                  </div>
                  {currentResult?.evaluation?.separated_gain !== undefined && (
                    <div className="text-[11px] font-mono text-teal-700 dark:text-teal-400 font-semibold pt-1">
                      Initial: {currentResult.evaluation.initial_components_before_morphology} → Gain: +{currentResult.evaluation.separated_gain}
                    </div>
                  )}
                </div>

                {/* Diagnostic Warnings & Polarity Status */}
                {currentResult?.diagnostics && (
                  <div className="space-y-2">
                    {currentResult.diagnostics.warnings?.length > 0 && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <span>{currentResult.diagnostics.warnings[0]}</span>
                      </div>
                    )}
                    {currentResult.automaticCount === 0 && (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>No foreground components detected. Adjust threshold method, polarity, or minimum area.</span>
                      </div>
                    )}
                    <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400 flex justify-between">
                      <span>Polarity: <strong className="text-slate-800 dark:text-slate-200">{currentResult.diagnostics.effective_polarity}</strong></span>
                      <span>Border FG: <strong className="text-slate-800 dark:text-slate-200">{(currentResult.diagnostics.border_fg_ratio * 100).toFixed(1)}%</strong></span>
                    </div>
                  </div>
                )}

                {/* Accuracy Comparison Card */}
                {currentResult?.evaluation?.has_manual_reference && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Ground Truth Ref:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {currentResult.evaluation.manual_count}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Count Disparity (Error):</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {currentResult.evaluation.absolute_count_error}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-slate-900 dark:text-white">Agreement %:</span>
                      <span className={`font-mono font-extrabold text-sm ${
                        currentResult.evaluation.count_agreement_percent === 100
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-teal-600 dark:text-teal-400'
                      }`}>
                        {currentResult.evaluation.count_agreement_percent}%
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1">
                      {currentResult.evaluation.accuracy_verdict}
                    </div>
                  </div>
                )}

                {/* Pixel Evolution Statistics */}
                {currentResult?.evaluation?.foreground_pixels && (
                  <div className="space-y-1.5 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">
                      Foreground Area Evolution:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <div className="text-slate-500">Initial Binary</div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {currentResult.evaluation.foreground_pixels.initial_binary} px
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <div className="text-slate-500">Eroded Mask</div>
                        <div className="font-bold text-teal-600 dark:text-teal-400">
                          {currentResult.evaluation.foreground_pixels.eroded} px
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <div className="text-slate-500">Dilated Final</div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {currentResult.evaluation.foreground_pixels.final} px
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <div className="text-slate-500">Area Retained</div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          {(currentResult.evaluation.foreground_pixels.area_retention_ratio * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Detected Components Table */}
              <div className="p-5 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
                  <div className="flex items-center space-x-1.5">
                    <Cpu className="w-4 h-4" />
                    <span>OBJECT ENTITIES</span>
                  </div>
                  <span>{currentResult?.components?.length || 0} items</span>
                </div>

                <div className="max-h-48 overflow-y-auto pr-1 text-xs">
                  {currentResult?.components && currentResult.components.length > 0 ? (
                    <table className="w-full text-left font-mono">
                      <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-1">ID</th>
                          <th className="py-1">Area</th>
                          <th className="py-1">Centroid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {currentResult.components.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-1.5 font-bold text-teal-600 dark:text-teal-400">#{c.id}</td>
                            <td className="py-1.5 text-slate-700 dark:text-slate-300">{c.area} px</td>
                            <td className="py-1.5 text-slate-500 text-[11px]">
                              ({c.centroid[0]}, {c.centroid[1]})
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs italic">
                      Run processing to inspect segmented objects
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* ========================================================== */}
          {/* STRUCTURING ELEMENT EXPERIMENTATION TOOL (BOTTOM SECTION) */}
          {/* ========================================================== */}
          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
                  <Scale className="w-4 h-4" />
                  <span>EXPERIMENTAL BENCHMARK HARNESS</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  Structuring Element Shape Comparative Analysis
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  Execute 3 distinct structuring element topologies (Disk/Ellipse, Rectangle, Cross) side-by-side to observe contact bridge severance.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunComparison}
                disabled={isRunningComparison}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-teal-900 dark:text-teal-200 bg-teal-100 dark:bg-teal-950/60 hover:bg-teal-200 dark:hover:bg-teal-900/60 border border-teal-300 dark:border-teal-800 transition-all flex items-center space-x-2 self-start sm:self-auto disabled:opacity-50"
              >
                {isRunningComparison ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    <span>Evaluating Structuring Elements...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Run 3-Way Comparative Benchmark</span>
                  </>
                )}
              </button>
            </div>

            {/* Comparison Results Grid */}
            {comparisonResults && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {comparisonResults.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.configName}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold">
                        {item.count} Coins
                      </span>
                    </div>

                    {item.labeledImg && (
                      <div className="rounded-xl overflow-hidden bg-slate-900 h-44 flex items-center justify-center p-2 border border-slate-800">
                        <img
                          src={item.labeledImg}
                          alt={item.configName}
                          className="max-h-full max-w-full object-contain rounded"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-1.5 rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-center">
                        <div className="text-[10px] text-slate-500">Severance Gain</div>
                        <div className="font-bold text-teal-600 dark:text-teal-400">+{item.gain}</div>
                      </div>
                      <div className="p-1.5 rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-center">
                        <div className="text-[10px] text-slate-500">Agreement %</div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          {item.agreement !== null ? `${item.agreement}%` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================== */}
          {/* USER OBSERVATIONS & EXPORT ACTIONS */}
          {/* ========================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Scientific Observations Notes */}
            <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
                <Info className="w-4 h-4" />
                <span>SCIENTIFIC OBSERVATIONS & EXPERIMENT LOG</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Record qualitative remarks regarding structuring element radius, neck dissolution characteristics, and connected component boundary integrity:
              </p>
              <textarea
                rows={3}
                value={userObservations}
                onChange={(e) => setUserObservations(e.target.value)}
                placeholder="Example: Structuring element (3x3 ellipse) with 3 iterations cleanly severed tangential contact necks between adjacent coins while preserving circular perimeter boundaries."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 font-sans"
              />
            </div>

            {/* Export Actions Card */}
            <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
                <Download className="w-4 h-4" />
                <span>REPORT & DATA EXPORT</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Export quantitative metrics, coordinates, and visual segmentation results:
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => generateMorphologyPDFReport(currentResult?.experiment || currentResult)}
                  disabled={!currentResult}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 transition-colors flex items-center justify-center space-x-2 disabled:opacity-40"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Generate PDF Report</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => exportMorphologyCSV(currentResult?.experiment || currentResult)}
                    disabled={!currentResult}
                    className="py-2 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-40"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportMorphologyJSON(currentResult?.experiment || currentResult)}
                    disabled={!currentResult}
                    className="py-2 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-40"
                  >
                    <FileCode className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* ========================================================== */}
          {/* PIXEL INTENSITY HISTOGRAM ANALYSIS SECTION */}
          {/* ========================================================== */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>Pixel Intensity Histogram Analysis</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Actual 256-bin intensity distributions calculated from the current coin image before binary thresholding.
                </p>
              </div>

              {/* Source Switcher */}
              <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono">
                {[
                  { id: 'both', label: 'Comparison' },
                  { id: 'original', label: 'Original Gray' },
                  { id: 'preprocessed', label: 'Preprocessed Gray' },
                  { id: 'binary', label: 'Binary (0 & 255)' },
                  ...(currentResult?.histograms?.original_color ? [{ id: 'color', label: 'Color Channels' }] : []),
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setHistViewMode(tab.id)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                      histViewMode === tab.id
                        ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {!currentResult?.histograms ? (
              <div className="p-8 text-center text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                Run morphological processing on any coin image to inspect genuine 256-bin grayscale histograms and binary foreground/background statistics.
              </div>
            ) : (
              <div className="space-y-6">
                {histViewMode === 'both' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <HistogramChart
                      histogram={currentResult.histograms.original_grayscale}
                      title="Original Grayscale Histogram"
                      subtitle="Raw pixel intensity frequencies after grayscale conversion"
                      primaryLabel="Original Gray"
                      loading={isProcessing}
                    />
                    <HistogramChart
                      histogram={currentResult.histograms.preprocessed_grayscale}
                      title="Preprocessed Grayscale Histogram"
                      subtitle="Filtered grayscale image (3×3 Gaussian) prior to thresholding"
                      primaryLabel="Preprocessed Gray"
                      loading={isProcessing}
                    />
                  </div>
                )}

                {histViewMode === 'original' && (
                  <HistogramChart
                    histogram={currentResult.histograms.original_grayscale}
                    title="Original Grayscale Histogram"
                    subtitle="Raw pixel intensity frequencies (0–255) after grayscale conversion"
                    primaryLabel="Original Gray"
                    loading={isProcessing}
                  />
                )}

                {histViewMode === 'preprocessed' && (
                  <HistogramChart
                    histogram={currentResult.histograms.preprocessed_grayscale}
                    title="Preprocessed Grayscale Histogram"
                    subtitle="Filtered grayscale intensity distribution before binary thresholding"
                    primaryLabel="Preprocessed Gray"
                    loading={isProcessing}
                  />
                )}

                {histViewMode === 'binary' && currentResult.histograms.binary_stats?.histogram256 && (
                  <HistogramChart
                    histogram={currentResult.histograms.binary_stats.histogram256}
                    title="Binary Mask 256-Bin Histogram (Levels 0 & 255)"
                    subtitle="Genuine binary intensity distribution: only Background (0) and Foreground (255) bins are populated"
                    primaryLabel="Binary Pixel Count"
                    loading={isProcessing}
                  />
                )}

                {histViewMode === 'color' && currentResult.histograms.original_color && (
                  <HistogramChart
                    histogram={currentResult.histograms.original_color}
                    title="Original Image Color Channel Histogram"
                    subtitle="Select Luminance, Red, Green, or Blue channel from the original RGB image"
                    lineColor="#06b6d4"
                    primaryLabel="Channel Count"
                    showChannelSelector={true}
                    channel={histChannel}
                    onChannelChange={setHistChannel}
                    loading={isProcessing}
                  />
                )}

                {/* Genuine Binary Foreground / Background Distribution (0 and 255 only) */}
                {currentResult.histograms.binary_stats && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono">
                          Binary Output Intensity Distribution (Two-Level: 0 &amp; 255)
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          Morphological binary masks contain strictly two intensity levels (0 = Background, 255 = Foreground).
                        </p>
                      </div>
                      <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 font-semibold">
                        2 Non-Zero Bins (0, 255)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800">
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">Background Pixels (0)</div>
                        <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                          {currentResult.histograms.binary_stats.backgroundPixels.toLocaleString()} px
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {currentResult.histograms.binary_stats.backgroundPercentage}% of image
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800">
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">Foreground Pixels (255)</div>
                        <div className="text-base font-extrabold text-teal-600 dark:text-teal-400 mt-0.5">
                          {currentResult.histograms.binary_stats.foregroundPixels.toLocaleString()} px
                        </div>
                        <div className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
                          Total Foreground: {currentResult.histograms.binary_stats.foregroundPercentage}%
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-center space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-600 dark:text-slate-400">FG vs BG Ratio</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {currentResult.histograms.binary_stats.foregroundPercentage}% / {currentResult.histograms.binary_stats.backgroundPercentage}%
                          </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                          <div
                            className="h-full bg-teal-500"
                            style={{ width: `${currentResult.histograms.binary_stats.foregroundPercentage}%` }}
                            title={`Foreground (255): ${currentResult.histograms.binary_stats.foregroundPercentage}%`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================== */}
      {/* THEORY & FORMULAS TAB */}
      {/* ========================================================== */}
      {activeTab === 'theory' && (
        <div className="space-y-8">
          
          {/* Theory Header */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
              <Layers className="w-4 h-4" />
              <span>MATHEMATICAL MORPHOLOGY FOUNDATIONS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Mathematical Formulations & Bridge Severance Principles
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 max-w-4xl font-medium leading-relaxed">
              Mathematical morphology is a set-theoretic framework for analyzing geometric structures in digital images. When circular objects lightly touch, the narrow contact bridge acts as a topological bottleneck whose width is smaller than the diameter of the primary objects. By tuning structuring element geometry and iteration depth, we can selectively dissolve these bridges without destroying the primary coin bodies.
            </p>
          </div>

          {/* Core Formulas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. Erosion */}
            <div className="p-6 rounded-2xl bg-white dark:bg-navy-900/70 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded border border-teal-200 dark:border-teal-800/60">
                Bridge Severance
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Binary Erosion (⊖)
              </h3>
              <div className="my-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-teal-900 dark:text-teal-300 text-center">
                <MathFormula
                  tex="A \ominus B = \{z \mid (B)_z \subseteq A\}"
                  fallback="A ⊖ B = {z | (B)_z ⊆ A}"
                  display={true}
                />
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Translates structuring element $B$ across binary set $A$. The eroded image contains only those coordinates where $B$ fits entirely within $A$. This peels boundary layers and completely severs narrow contact isthmuses.
              </p>
            </div>

            {/* 2. Dilation */}
            <div className="p-6 rounded-2xl bg-white dark:bg-navy-900/70 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded border border-teal-200 dark:border-teal-800/60">
                Boundary Restoration
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Binary Dilation (⊕)
              </h3>
              <div className="my-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-teal-900 dark:text-teal-300 text-center">
                <MathFormula
                  tex="A \oplus B = \{z \mid (\hat{B})_z \cap A \neq \emptyset\}"
                  fallback="A ⊕ B = {z | (B̂)_z ∩ A ≠ ∅}"
                  display={true}
                />
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Expands the boundary of set $A$ by the structuring element $B$. Dilation restores the eroded object boundaries back toward their original scale, but because the gap severed during erosion exceeds $B$, the separated entities remain detached.
              </p>
            </div>

            {/* 3. Opening */}
            <div className="p-6 rounded-2xl bg-white dark:bg-navy-900/70 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded border border-teal-200 dark:border-teal-800/60">
                Filter Compound
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Morphological Opening (∘)
              </h3>
              <div className="my-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-teal-900 dark:text-teal-300 text-center">
                <MathFormula
                  tex="A \circ B = (A \ominus B) \oplus B"
                  fallback="A ∘ B = (A ⊖ B) ⊕ B"
                  display={true}
                />
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                An erosion followed by a dilation using the identical structuring element. It acts as an idempotent geometric filter: it eliminates narrow peninsulas, thin protrusions, and bridge necks while preserving overall object geometry.
              </p>
            </div>

          </div>

          {/* Connected Component Formulation Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Connected-Component Labeling & Area Filtering
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              After bridge severance, the binary matrix is parsed using 8-connectivity raster traversal:
            </p>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
              <MathFormula
                tex="N_8(p) = \{q \in \mathbb{Z}^2 \mid \max(|x_p - x_q|, |y_p - y_q|) = 1\}"
                fallback="N8(p) = {q ∈ Z^2 | max(|xp - xq|, |yp - yq|) = 1}"
                display={true}
              />
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              Each connected cluster receives a unique positive integer label. Spurious single-pixel noise or artifact debris is eliminated using minimum component area thresholding, ensuring reliable, robust object counts.
            </p>
          </div>

        </div>
      )}

      {/* ========================================================== */}
      {/* HISTORY TAB */}
      {/* ========================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Saved Experiment History
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Experiments persisted to MongoDB database with parameters and counting evaluations.
              </p>
            </div>
            <button
              type="button"
              onClick={loadHistory}
              className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {historyList.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
              No saved experiments recorded yet. Run a morphological separation experiment to persist records here.
            </div>
          ) : (
            <div className="space-y-3">
              {historyList.map((exp) => (
                <div
                  key={exp._id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {exp.name}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold">
                        {exp.results?.automaticCount ?? exp.automaticCount ?? 0} Coins
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      File: {exp.originalFilename} • SE: {exp.parameters?.structuringElement} ({exp.parameters?.kernelWidth}×{exp.parameters?.kernelHeight}) • Mode: {exp.parameters?.operationMode}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Executed: {new Date(exp.createdAt).toLocaleString()} • Duration: {exp.processingTimeMs || 0} ms
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => generateMorphologyPDFReport(exp)}
                      className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Download PDF"
                    >
                      <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => exportMorphologyCSV(exp)}
                      className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Download CSV"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Delete experiment "${exp.name}"?`)) {
                          await apiService.morphology.deleteHistory(exp._id);
                          loadHistory();
                        }
                      }}
                      className="p-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Return Link & Footer Navigation */}
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
