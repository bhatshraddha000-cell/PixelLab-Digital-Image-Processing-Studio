import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  SplitSquareVertical,
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
  Paintbrush,
  Eraser,
  Undo2,
  Bookmark,
  Target,
} from 'lucide-react';
import ImageSplitSlider from '../components/ImageSplitSlider';
import MathFormula from '../components/MathFormula';
import apiService from '../services/api';
import {
  exportWatershedCSV,
  exportWatershedJSON,
  generateWatershedPDFReport,
} from '../utils/exportUtils';

export const WatershedPage = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('workspace'); // 'workspace' | 'theory' | 'history'

  // Benchmark datasets
  const [samples, setSamples] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState('coins_lightly_touching');

  // Input image state
  const [sourceType, setSourceType] = useState('sample'); // 'sample' | 'custom'
  const [inputImageFile, setInputImageFile] = useState(null);
  const [inputPreviewUrl, setInputPreviewUrl] = useState('/samples/watershed/coins_lightly_touching.png');
  const [imageMeta, setImageMeta] = useState({ width: 560, height: 360, name: 'coins_lightly_touching.png' });

  // Optional ground-truth mask state
  const [gtMaskFile, setGtMaskFile] = useState(null);
  const [gtMaskPreviewUrl, setGtMaskPreviewUrl] = useState('/samples/watershed/mask_coins_lightly_touching.png');

  // Preprocessing and Algorithmic Parameters
  const [blurMethod, setBlurMethod] = useState('gaussian'); // 'gaussian' | 'median' | 'none'
  const [blurKernel, setBlurKernel] = useState(5);
  const [thresholdMethod, setThresholdMethod] = useState('otsu'); // 'otsu' | 'manual' | 'adaptive'
  const [thresholdValue, setThresholdValue] = useState(127);
  const [polarity, setPolarity] = useState('bright_on_dark'); // 'bright_on_dark' | 'dark_on_bright'
  const [structuringElement, setStructuringElement] = useState('ellipse'); // 'ellipse' | 'rectangle' | 'cross'
  const [openingKernelSize, setOpeningKernelSize] = useState(3);
  const [openingIterations, setOpeningIterations] = useState(2);
  const [distMaskSize, setDistMaskSize] = useState(5); // 3 | 5
  const [fgThresholdFactor, setFgThresholdFactor] = useState(0.50); // 0.10 - 0.95
  const [bgDilationIterations, setBgDilationIterations] = useState(3);
  const [connectivity, setConnectivity] = useState(8); // 4 | 8
  const [minRegionArea, setMinRegionArea] = useState(50);
  const [manualCount, setManualCount] = useState(8);
  const [experimentName, setExperimentName] = useState('Watershed-Coins-Trial');
  const [userObservations, setUserObservations] = useState('');

  // Manual Marker Refinement state
  const [manualMarkerMode, setManualMarkerMode] = useState(false);
  const [brushType, setBrushType] = useState('fg'); // 'fg' | 'bg'
  const [brushRadius, setBrushRadius] = useState(5);
  const [manualPoints, setManualPoints] = useState([]); // Array of { x, y, type, radius }

  // Visualizer & Canvas states
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [currentResult, setCurrentResult] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'single' | 'sideBySide'
  const [activeStage, setActiveStage] = useState('boundary_overlay');
  const [showOverlays, setShowOverlays] = useState(true);
  const [selectedComponentId, setSelectedComponentId] = useState(null);

  // Parameter Comparison state
  const [isRunningComparison, setIsRunningComparison] = useState(false);
  const [comparisonResults, setComparisonResults] = useState(null);

  // History state
  const [historyList, setHistoryList] = useState([]);

  const fileInputRef = useRef(null);
  const maskInputRef = useRef(null);
  const canvasRef = useRef(null);

  // Load benchmark samples & history on mount
  useEffect(() => {
    apiService.watershed
      .getSamples()
      .then((data) => {
        if (data && data.samples) {
          setSamples(data.samples);
        }
      })
      .catch((err) => console.warn('Could not load watershed samples:', err.message));

    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await apiService.watershed.getHistory();
      if (res && res.history) {
        setHistoryList(res.history);
      }
    } catch (err) {
      console.warn('Could not load history:', err.message);
    }
  };

  // Select built-in benchmark dataset
  const handleSelectSample = (sample) => {
    setSelectedSampleId(sample.id);
    setSourceType('sample');
    setInputImageFile(null);
    setInputPreviewUrl(sample.previewUrl);
    setGtMaskFile(null);
    setGtMaskPreviewUrl(sample.maskUrl || null);
    setManualCount(sample.manualCount || null);
    setManualPoints([]);
    setImageMeta({
      width: parseInt(sample.dimensions.split('×')[0], 10) || 500,
      height: parseInt(sample.dimensions.split('×')[1], 10) || 400,
      name: sample.filename,
    });

    if (sample.recommendedParams) {
      setBlurMethod(sample.recommendedParams.blurMethod || 'gaussian');
      setBlurKernel(sample.recommendedParams.blurKernel || 5);
      setThresholdMethod(sample.recommendedParams.thresholdMethod || 'otsu');
      setPolarity(sample.recommendedParams.polarity || 'bright_on_dark');
      setStructuringElement(sample.recommendedParams.structuringElement || 'ellipse');
      setOpeningKernelSize(sample.recommendedParams.openingKernelSize || 3);
      setOpeningIterations(sample.recommendedParams.openingIterations || 2);
      setDistMaskSize(sample.recommendedParams.distMaskSize || 5);
      setFgThresholdFactor(sample.recommendedParams.fgThresholdFactor || 0.50);
      setBgDilationIterations(sample.recommendedParams.bgDilationIterations || 3);
      setConnectivity(sample.recommendedParams.connectivity || 8);
      setMinRegionArea(sample.recommendedParams.minRegionArea || 50);
      if (sample.recommendedParams.manualCount !== undefined) {
        setManualCount(sample.recommendedParams.manualCount);
      }
    }
  };

  // Custom image file upload
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
    setManualPoints([]);

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

  // Custom ground truth mask upload
  const handleMaskUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGtMaskFile(file);
    setGtMaskPreviewUrl(URL.createObjectURL(file));
  };

  // Apply Parameter Preset
  const handleApplyPreset = (presetName) => {
    if (presetName === 'light_touch') {
      setBlurMethod('gaussian');
      setBlurKernel(5);
      setThresholdMethod('otsu');
      setOpeningKernelSize(3);
      setOpeningIterations(2);
      setDistMaskSize(5);
      setFgThresholdFactor(0.50);
      setBgDilationIterations(3);
    } else if (presetName === 'closely_arranged') {
      setBlurMethod('gaussian');
      setBlurKernel(5);
      setThresholdMethod('otsu');
      setOpeningKernelSize(3);
      setOpeningIterations(2);
      setDistMaskSize(5);
      setFgThresholdFactor(0.50);
      setBgDilationIterations(3);
    } else if (presetName === 'overlapping') {
      setBlurMethod('gaussian');
      setBlurKernel(5);
      setThresholdMethod('otsu');
      setOpeningKernelSize(3);
      setOpeningIterations(2);
      setDistMaskSize(5);
      setFgThresholdFactor(0.65); // Higher saddle threshold isolates overlapping centers
      setBgDilationIterations(3);
    } else if (presetName === 'strong_separation') {
      setBlurMethod('median');
      setBlurKernel(5);
      setThresholdMethod('otsu');
      setOpeningKernelSize(5);
      setOpeningIterations(3);
      setDistMaskSize(5);
      setFgThresholdFactor(0.70);
      setBgDilationIterations(4);
    }
  };

  // Interactive canvas click for manual marker seed placement
  const handleCanvasClick = (e) => {
    if (!manualMarkerMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    setManualPoints((prev) => [
      ...prev,
      { x, y, type: brushType, radius: brushRadius },
    ]);
  };

  // Redraw manual markers on overlay canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (manualMarkerMode && manualPoints.length > 0) {
      manualPoints.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, 2 * Math.PI);
        ctx.fillStyle = pt.type === 'fg' ? 'rgba(6, 182, 212, 0.85)' : 'rgba(239, 68, 68, 0.85)';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
  }, [manualPoints, manualMarkerMode]);

  // Execute Marker-Controlled Watershed pipeline
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

      if (gtMaskFile) {
        formData.append('ground_truth_mask', gtMaskFile);
      }

      formData.append('blur_method', blurMethod);
      formData.append('blur_kernel', String(blurKernel));
      formData.append('threshold_method', thresholdMethod);
      formData.append('threshold_value', String(thresholdValue));
      formData.append('polarity', polarity);
      formData.append('structuring_element', structuringElement);
      formData.append('opening_kernel_size', String(openingKernelSize));
      formData.append('opening_iterations', String(openingIterations));
      formData.append('dist_mask_size', String(distMaskSize));
      formData.append('fg_threshold_factor', String(fgThresholdFactor));
      formData.append('bg_dilation_iterations', String(bgDilationIterations));
      formData.append('connectivity', String(connectivity));
      formData.append('min_region_area', String(minRegionArea));

      if (manualCount !== null && manualCount !== '' && !isNaN(manualCount)) {
        formData.append('manual_count', String(manualCount));
      }

      if (manualPoints.length > 0) {
        formData.append('manual_markers', JSON.stringify(manualPoints));
      }

      formData.append('experimentName', experimentName);
      formData.append('userObservations', userObservations);

      const result = await apiService.watershed.process(formData);
      setCurrentResult(result);
      loadHistory();
    } catch (err) {
      console.error('Watershed execution error:', err);
      setErrorMessage(err.message || 'Processing failed. Please check backend connection.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Run 3-Way Parameter Comparison Workspace
  const handleRunComparison = async () => {
    setIsRunningComparison(true);
    try {
      const configs = [
        { name: 'Standard Peak (θ=0.50)', fg: 0.50, bg: 3, openK: 3 },
        { name: 'Saddle Separation (θ=0.65)', fg: 0.65, bg: 3, openK: 3 },
        { name: 'Aggressive Basin (θ=0.75, Dilation 4)', fg: 0.75, bg: 4, openK: 5 },
      ];

      const results = [];
      for (const cfg of configs) {
        const formData = new FormData();
        if (sourceType === 'custom' && inputImageFile) {
          formData.append('image', inputImageFile);
        } else {
          formData.append('sampleId', selectedSampleId);
        }
        if (gtMaskFile) {
          formData.append('ground_truth_mask', gtMaskFile);
        }
        formData.append('blur_method', blurMethod);
        formData.append('blur_kernel', String(blurKernel));
        formData.append('threshold_method', thresholdMethod);
        formData.append('threshold_value', String(thresholdValue));
        formData.append('polarity', polarity);
        formData.append('structuring_element', structuringElement);
        formData.append('opening_kernel_size', String(cfg.openK));
        formData.append('opening_iterations', String(openingIterations));
        formData.append('dist_mask_size', String(distMaskSize));
        formData.append('fg_threshold_factor', String(cfg.fg));
        formData.append('bg_dilation_iterations', String(cfg.bg));
        formData.append('connectivity', String(connectivity));
        formData.append('min_region_area', String(minRegionArea));
        if (manualCount !== null && manualCount !== '' && !isNaN(manualCount)) {
          formData.append('manual_count', String(manualCount));
        }

        const res = await apiService.watershed.process(formData);
        results.push({
          configName: cfg.name,
          fgFactor: cfg.fg,
          bgDilation: cfg.bg,
          count: res.automaticCount,
          totalBasins: res.evaluation?.total_watershed_regions ?? res.automaticCount,
          agreement: res.evaluation?.count_agreement_percent ?? null,
          iou: res.evaluation?.iou ?? null,
          dice: res.evaluation?.dice ?? null,
          timeMs: res.processingTimeMs,
          boundaryImg: res.images?.boundary_overlay,
          heatmapImg: res.images?.distance_heatmap,
        });
      }

      setComparisonResults(results);
    } catch (err) {
      console.warn('Comparison error:', err.message);
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

  // Available image pipeline stages
  const stages = [
    { id: 'original', label: '1. Original' },
    { id: 'grayscale', label: '2. Grayscale' },
    { id: 'binary', label: '3. Binary Mask' },
    { id: 'opened', label: '4. Morph Opening' },
    { id: 'distance_heatmap', label: '5. Distance Heatmap' },
    { id: 'sure_fg', label: '6. Sure Foreground' },
    { id: 'sure_bg', label: '7. Sure Background' },
    { id: 'unknown', label: '8. Unknown Region' },
    { id: 'markers_vis', label: '9. Marker Seeds' },
    { id: 'segmented', label: '10. Color Segments' },
    { id: 'boundary_overlay', label: '11. Boundary Dams' },
  ];

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">
            <Link
              to="/"
              className="inline-flex items-center space-x-1 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Studio</span>
            </Link>
            <span>/</span>
            <span>MODULE 03</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2 mt-1">
            <SplitSquareVertical className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
            <span>Watershed Segmentation & Coin Counting</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Separate tightly clustered and overlapping circular coins using marker-controlled morphological watershed segmentation.
          </p>
        </div>

        {/* Tab navigation pills */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'workspace'
                ? 'bg-white dark:bg-navy-800 text-cyan-700 dark:text-cyan-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Segmentation Studio
          </button>
          <button
            onClick={() => setActiveTab('theory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'theory'
                ? 'bg-white dark:bg-navy-800 text-cyan-700 dark:text-cyan-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Theory & Formulations
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-navy-800 text-cyan-700 dark:text-cyan-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            History ({historyList.length})
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
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
      {/* TAB 1: WATERSHED SEGMENTATION WORKSPACE */}
      {/* ========================================================== */}
      {activeTab === 'workspace' && (
        <div className="space-y-8">
          
          {/* Main 3-Column Studio Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ---------------------------------------------------- */}
            {/* COLUMN 1: CONTROLS & TUNING PANELS (lg:col-span-4) */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* Image Input Selection Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">
                    <ImageIcon className="w-4 h-4" />
                    <span>COIN TARGET SELECTION</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {imageMeta.width}×{imageMeta.height} px
                  </span>
                </div>

                {/* Input source toggle */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSourceType('sample')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      sourceType === 'sample'
                        ? 'bg-white dark:bg-navy-800 text-cyan-700 dark:text-cyan-300 shadow-sm'
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
                        ? 'bg-white dark:bg-navy-800 text-cyan-700 dark:text-cyan-300 shadow-sm'
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

                {/* Benchmark selector gallery */}
                {sourceType === 'sample' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Select Photographic Benchmark:
                    </label>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {samples.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSelectSample(s)}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                            selectedSampleId === s.id
                              ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-950 dark:text-cyan-200 font-semibold'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="font-bold">{s.name}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Ground Truth: {s.manualCount} coins • {s.dimensions}
                            </div>
                          </div>
                          {selectedSampleId === s.id && <Check className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preset parameter shortcuts */}
                <div className="pt-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1.5">
                    <span>Algorithmic Presets</span>
                    <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">Quick Tuning</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('light_touch')}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-cyan-500 text-left font-medium text-slate-700 dark:text-slate-300"
                    >
                      Lightly Touching
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('closely_arranged')}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-cyan-500 text-left font-medium text-slate-700 dark:text-slate-300"
                    >
                      Dense Cluster
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('overlapping')}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-cyan-500 text-left font-medium text-slate-700 dark:text-slate-300"
                    >
                      Overlapping (θ=0.65)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('strong_separation')}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-cyan-500 text-left font-medium text-slate-700 dark:text-slate-300"
                    >
                      Strong Separation
                    </button>
                  </div>
                </div>

                {/* Ground-Truth Evaluation Inputs */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Manual Count Ref
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="500"
                      value={manualCount ?? ''}
                      onChange={(e) => setManualCount(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                      placeholder="e.g. 8, 12, 10"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Reference Mask
                    </label>
                    <button
                      type="button"
                      onClick={() => maskInputRef.current?.click()}
                      className="w-full py-1.5 px-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 text-xs text-slate-600 dark:text-slate-400 font-medium truncate text-center"
                    >
                      {gtMaskFile ? gtMaskFile.name : gtMaskPreviewUrl ? 'Mask Loaded' : '+ Add Mask'}
                    </button>
                    <input
                      ref={maskInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={handleMaskUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Algorithmic Pipeline Parameter Controls Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">
                    <Sliders className="w-4 h-4" />
                    <span>WATERSHED PARAMETERS</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('light_touch')}
                    className="text-[11px] font-mono text-slate-500 dark:text-slate-400 hover:text-cyan-600 flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Defaults</span>
                  </button>
                </div>

                {/* Noise Removal Filter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Noise Removal Filter</span>
                    <span className="font-mono text-cyan-600 capitalize">{blurMethod} ({blurKernel}×{blurKernel})</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['gaussian', 'median', 'none'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setBlurMethod(m)}
                        className={`py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                          blurMethod === m
                            ? 'bg-cyan-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Binarization & Polarity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Thresholding Algorithm</span>
                    <span className="font-mono text-cyan-600 uppercase">{thresholdMethod}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['otsu', 'manual', 'adaptive'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setThresholdMethod(t)}
                        className={`py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                          thresholdMethod === t
                            ? 'bg-cyan-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Morphological Opening Kernel */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span>Opening Kernel:</span>
                    <span className="font-mono font-bold text-cyan-600">{openingKernelSize}×{openingKernelSize} px ({openingIterations} iters)</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="11"
                    step="2"
                    value={openingKernelSize}
                    onChange={(e) => setOpeningKernelSize(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                </div>

                {/* Foreground Threshold Factor (Key Parameter!) */}
                <div className="space-y-1 p-2.5 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/50">
                  <div className="flex justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <span>Sure Foreground Factor (θ):</span>
                    <span className="font-mono text-cyan-700 dark:text-cyan-300 font-extrabold">{fgThresholdFactor.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.20"
                    max="0.85"
                    step="0.05"
                    value={fgThresholdFactor}
                    onChange={(e) => setFgThresholdFactor(parseFloat(e.target.value))}
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0.20 (Dense Seeds)</span>
                    <span>0.50 (Standard)</span>
                    <span>0.85 (Overlaps)</span>
                  </div>
                </div>

                {/* Background Dilation Iterations */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span>Background Dilation:</span>
                    <span className="font-mono font-bold text-cyan-600">{bgDilationIterations} iterations</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    step="1"
                    value={bgDilationIterations}
                    onChange={(e) => setBgDilationIterations(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                </div>

                {/* Connectivity & Min Region Area */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Connectivity:
                    </label>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {[4, 8].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setConnectivity(c)}
                          className={`py-1 rounded-lg font-semibold border text-center transition-all ${
                            connectivity === c
                              ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {c}-Conn
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                      <span>Min Area:</span>
                      <span className="font-mono font-bold text-cyan-600">{minRegionArea} px</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="300"
                      step="10"
                      value={minRegionArea}
                      onChange={(e) => setMinRegionArea(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Optional Manual Marker Refinement Tool */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                      <Paintbrush className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Manual Marker Refinement</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setManualMarkerMode(!manualMarkerMode)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all font-bold ${
                        manualMarkerMode
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {manualMarkerMode ? 'ACTIVE' : 'OFF'}
                    </button>
                  </div>

                  {manualMarkerMode && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setBrushType('fg')}
                          className={`py-1 rounded-lg font-bold border transition-all ${
                            brushType === 'fg'
                              ? 'border-cyan-500 bg-cyan-100 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-200'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Foreground Seed (Cyan)
                        </button>
                        <button
                          type="button"
                          onClick={() => setBrushType('bg')}
                          className={`py-1 rounded-lg font-bold border transition-all ${
                            brushType === 'bg'
                              ? 'border-rose-500 bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Background Seed (Red)
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-500">Seeds Placed: {manualPoints.length}</span>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setManualPoints((prev) => prev.slice(0, -1))}
                            disabled={manualPoints.length === 0}
                            className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30"
                            title="Undo Seed"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setManualPoints([])}
                            disabled={manualPoints.length === 0}
                            className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30"
                            title="Clear All Seeds"
                          >
                            <Eraser className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 italic">
                        Click on the center inspection canvas to add seed markers.
                      </p>
                    </div>
                  )}
                </div>

                {/* Primary Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleRunProcessing}
                    disabled={isProcessing}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.99] transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Constructing Watershed Dams...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Run Watershed Segmentation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>

            {/* ---------------------------------------------------- */}
            {/* COLUMN 2: CENTER INSPECTION CANVAS (lg:col-span-5) */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-5 space-y-4">
              
              <div className="p-5 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                
                {/* Visualizer Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">
                    <Eye className="w-4 h-4" />
                    <span>WATERSHED STAGE VIEWER</span>
                  </div>

                  <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => setViewMode('split')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        viewMode === 'split'
                          ? 'bg-white dark:bg-navy-800 text-cyan-700 dark:text-cyan-300 shadow-sm'
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
                          ? 'bg-white dark:bg-navy-800 text-cyan-700 dark:text-cyan-300 shadow-sm'
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
                          ? 'bg-white dark:bg-navy-800 text-cyan-700 dark:text-cyan-300 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Dual View
                    </button>
                  </div>
                </div>

                {/* Pipeline Stages Pills */}
                <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px] scrollbar-thin">
                  {stages.map((stg) => (
                    <button
                      key={stg.id}
                      type="button"
                      onClick={() => setActiveStage(stg.id)}
                      disabled={!currentResult && stg.id !== 'original'}
                      className={`px-2 py-1 rounded-lg whitespace-nowrap font-medium transition-all ${
                        activeStage === stg.id
                          ? 'bg-cyan-600 text-white font-bold shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40'
                      }`}
                    >
                      {stg.label}
                    </button>
                  ))}
                </div>

                {/* Interactive Inspection Canvas */}
                <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[350px] flex items-center justify-center">
                  
                  {/* View Mode: Split Slider */}
                  {viewMode === 'split' && (
                    <div className="w-full">
                      <ImageSplitSlider
                        leftImage={
                          currentResult?.images?.boundary_overlay ||
                          currentResult?.images?.segmented ||
                          inputPreviewUrl
                        }
                        rightImage={inputPreviewUrl}
                        leftLabel={currentResult ? 'Watershed Boundary Dams' : 'Input Target'}
                        rightLabel="Touching Coins Target"
                        className="w-full h-80 sm:h-96"
                      />
                    </div>
                  )}

                  {/* View Mode: Single Stage View */}
                  {viewMode === 'single' && (
                    <div
                      className="relative w-full h-80 sm:h-96 flex items-center justify-center p-2 cursor-crosshair"
                      onClick={handleCanvasClick}
                    >
                      <img
                        src={
                          currentResult?.images?.[activeStage] ||
                          (activeStage === 'original' ? inputPreviewUrl : null) ||
                          inputPreviewUrl
                        }
                        alt={`Stage: ${activeStage}`}
                        className="max-h-full max-w-full object-contain rounded-lg pointer-events-none"
                      />
                      {/* Manual Marker Overlay Canvas */}
                      <canvas
                        ref={canvasRef}
                        width={imageMeta.width}
                        height={imageMeta.height}
                        className="absolute inset-0 w-full h-full object-contain pointer-events-auto"
                      />
                    </div>
                  )}

                  {/* View Mode: Dual View Side-by-Side */}
                  {viewMode === 'sideBySide' && (
                    <div className="w-full grid grid-cols-2 gap-2 p-2 h-80 sm:h-96">
                      <div className="flex flex-col items-center justify-center bg-slate-900 rounded-lg p-2 border border-slate-800">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 mb-1">
                          DISTANCE TRANSFORM HEATMAP
                        </span>
                        {currentResult?.images?.distance_heatmap ? (
                          <img
                            src={currentResult.images.distance_heatmap}
                            alt="Distance Heatmap"
                            className="max-h-64 object-contain rounded"
                          />
                        ) : (
                          <div className="text-xs text-slate-500 font-mono text-center p-4">
                            Run watershed to view distance elevation map
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center justify-center bg-slate-900 rounded-lg p-2 border border-slate-800">
                        <span className="text-[10px] font-mono font-bold text-teal-400 mb-1">
                          SEGMENTED BOUNDARIES OVERLAY
                        </span>
                        {currentResult?.images?.boundary_overlay ? (
                          <img
                            src={currentResult.images.boundary_overlay}
                            alt="Watershed Boundaries"
                            className="max-h-64 object-contain rounded"
                          />
                        ) : (
                          <div className="text-xs text-slate-500 font-mono text-center p-4">
                            Run watershed to view segmented coin dams
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Image Downloads Toolbar */}
                {currentResult?.images && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-500 font-mono">
                      Export Visuals:
                    </span>
                    <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => downloadImage(currentResult.images.boundary_overlay, 'watershed_boundaries.png')}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 transition-colors flex items-center space-x-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Boundaries</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadImage(currentResult.images.segmented, 'segmented_coins.png')}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors flex items-center space-x-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Colored</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadImage(currentResult.images.distance_heatmap, 'distance_heatmap.png')}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors flex items-center space-x-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Heatmap</span>
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
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">
                    <BarChart3 className="w-4 h-4" />
                    <span>WATERSHED COIN ENUMERATION</span>
                  </div>
                  {currentResult?.processingTimeMs && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {currentResult.processingTimeMs} ms
                    </span>
                  )}
                </div>

                {/* Big Count Badge */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-blue-500/10 dark:from-cyan-950/40 dark:via-navy-900 dark:to-blue-950/40 border border-cyan-200 dark:border-cyan-800/60 text-center space-y-1">
                  <div className="text-4xl sm:text-5xl font-extrabold font-mono text-cyan-600 dark:text-cyan-400">
                    {currentResult ? currentResult.automaticCount : '--'}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Segmented Coin Entities
                  </div>
                  {currentResult?.evaluation && (
                    <div className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400 font-semibold pt-1">
                      Catchment Basins: {currentResult.evaluation.total_watershed_regions} • Filtered Noise: {currentResult.evaluation.filtered_noise_regions}
                    </div>
                  )}
                </div>

                {/* Ground Truth Count Agreement Card */}
                {currentResult?.evaluation?.has_manual_reference && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Manual Ground Truth:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {currentResult.evaluation.manual_count} coins
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Count Disparity (Error):</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {currentResult.evaluation.absolute_count_error}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-slate-900 dark:text-white">Count Agreement:</span>
                      <span className={`font-mono font-extrabold text-sm ${
                        currentResult.evaluation.count_agreement_percent === 100
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-cyan-600 dark:text-cyan-400'
                      }`}>
                        {currentResult.evaluation.count_agreement_percent}%
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 italic pt-1">
                      {currentResult.evaluation.accuracy_verdict}
                    </div>
                  </div>
                )}

                {/* Pixel-Level Metrics (IoU, Dice, Precision, Recall, F1) */}
                {currentResult?.evaluation?.has_ground_truth && (
                  <div className="p-3 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 space-y-2 text-xs">
                    <div className="font-bold text-cyan-800 dark:text-cyan-300 text-[11px] uppercase font-mono">
                      Pixel-Level Segmentation Quality
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                      <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="text-slate-500">IoU Metric</div>
                        <div className="font-bold text-cyan-600">{currentResult.evaluation.iou}</div>
                      </div>
                      <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="text-slate-500">Dice Coeff</div>
                        <div className="font-bold text-emerald-600">{currentResult.evaluation.dice}</div>
                      </div>
                      <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="text-slate-500">Precision</div>
                        <div className="font-bold text-slate-900 dark:text-white">{currentResult.evaluation.precision}</div>
                      </div>
                      <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="text-slate-500">Recall</div>
                        <div className="font-bold text-slate-900 dark:text-white">{currentResult.evaluation.recall}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Segmented Coins Entity Table */}
              <div className="p-5 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">
                  <div className="flex items-center space-x-1.5">
                    <Cpu className="w-4 h-4" />
                    <span>DETECTED COINS</span>
                  </div>
                  <span>{currentResult?.components?.length || 0} objects</span>
                </div>

                <div className="max-h-52 overflow-y-auto pr-1 text-xs">
                  {currentResult?.components && currentResult.components.length > 0 ? (
                    <table className="w-full text-left font-mono">
                      <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-1">ID</th>
                          <th className="py-1">Area</th>
                          <th className="py-1">Perimeter</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {currentResult.components.map((c) => (
                          <tr
                            key={c.id}
                            onClick={() => setSelectedComponentId(c.id)}
                            className={`cursor-pointer transition-colors ${
                              selectedComponentId === c.id
                                ? 'bg-cyan-100 dark:bg-cyan-950 font-bold'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="py-1.5 text-cyan-600 dark:text-cyan-400">#{c.id}</td>
                            <td className="py-1.5 text-slate-700 dark:text-slate-300">{c.area} px</td>
                            <td className="py-1.5 text-slate-500 text-[11px]">{c.perimeter} px</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs italic">
                      Execute segmentation to inspect detected coins
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* ========================================================== */}
          {/* PARAMETER EXPERIMENTATION & 3-WAY COMPARISON TOOL */}
          {/* ========================================================== */}
          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">
                  <Scale className="w-4 h-4" />
                  <span>PARAMETER COMPARISON HARNESS</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  Distance Transform & Foreground Threshold Side-by-Side Comparison
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  Evaluate three distinct foreground threshold factors (θ = 0.50, θ = 0.65, θ = 0.75) side by side to identify optimal boundary dam delineation.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunComparison}
                disabled={isRunningComparison}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-cyan-900 dark:text-cyan-200 bg-cyan-100 dark:bg-cyan-950/60 hover:bg-cyan-200 dark:hover:bg-cyan-900/60 border border-cyan-300 dark:border-cyan-800 transition-all flex items-center space-x-2 self-start sm:self-auto disabled:opacity-50"
              >
                {isRunningComparison ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                    <span>Executing 3-Way Comparison...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Run 3-Way Parameter Benchmark</span>
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
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-bold">
                        {item.count} Coins
                      </span>
                    </div>

                    {item.boundaryImg && (
                      <div className="rounded-xl overflow-hidden bg-slate-900 h-44 flex items-center justify-center p-2 border border-slate-800">
                        <img
                          src={item.boundaryImg}
                          alt={item.configName}
                          className="max-h-full max-w-full object-contain rounded"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-1.5 rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-center">
                        <div className="text-[10px] text-slate-500">Catchment Basins</div>
                        <div className="font-bold text-cyan-600">{item.totalBasins}</div>
                      </div>
                      <div className="p-1.5 rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-center">
                        <div className="text-[10px] text-slate-500">Agreement %</div>
                        <div className="font-bold text-emerald-600">
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
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">
                <Info className="w-4 h-4" />
                <span>SCIENTIFIC OBSERVATIONS & EXPERIMENT LOG</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Record qualitative remarks regarding Euclidean distance transform topography, seed marker confidence factor, and watershed barrier dam delineation along touching coin borders:
              </p>
              <textarea
                rows={3}
                value={userObservations}
                onChange={(e) => setUserObservations(e.target.value)}
                placeholder="Example: Distance transform factor θ=0.65 cleanly separated overlapping coin contact regions without inducing spurious over-segmentation seeds."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            {/* Export Actions Card */}
            <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">
                <Download className="w-4 h-4" />
                <span>REPORT & DATA EXPORT</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Generate professional academic experiment documents and export structured metric records:
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => generateWatershedPDFReport(currentResult?.experiment || currentResult)}
                  disabled={!currentResult}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors flex items-center justify-center space-x-2 disabled:opacity-40"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Generate PDF Report</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => exportWatershedCSV(currentResult?.experiment || currentResult)}
                    disabled={!currentResult}
                    className="py-2 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-40"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportWatershedJSON(currentResult?.experiment || currentResult)}
                    disabled={!currentResult}
                    className="py-2 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-40"
                  >
                    <FileCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 2: THEORY & FORMULATIONS */}
      {/* ========================================================== */}
      {activeTab === 'theory' && (
        <div className="space-y-8">
          
          {/* Theory Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">
              <Layers className="w-4 h-4" />
              <span>TOPOLOGICAL IMAGE SEGMENTATION</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Mathematical Formulations & Watershed Principles
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 max-w-4xl font-medium leading-relaxed">
              When objects in digital imagery make physical contact or partially overlap, simple morphological erosion cannot separate them without destroying the outer perimeter. Marker-controlled watershed treats the inverted distance transform as a topographical elevation landscape, rising flood waters from definitive seed markers, and constructing barrier dams where catchment basins meet.
            </p>
          </div>

          {/* Mathematical Formulations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. Distance Transform */}
            <div className="p-6 rounded-2xl bg-white dark:bg-navy-900/70 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-200 dark:border-cyan-800/60">
                Topographical Elevation
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Euclidean Distance Transform
              </h3>
              <div className="my-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-cyan-900 dark:text-cyan-300 text-center">
                <MathFormula
                  tex="D(p) = \min_{q \in \text{BG}} \|p - q\|_2"
                  fallback="D(p) = min_{q ∈ BG} ||p - q||_2"
                  display={true}
                />
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Measures the shortest Euclidean distance from each foreground pixel to the nearest background pixel. The geometric centers of circular coins attain local maximum elevation peaks.
              </p>
            </div>

            {/* 2. Marker Regional Maxima */}
            <div className="p-6 rounded-2xl bg-white dark:bg-navy-900/70 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-200 dark:border-cyan-800/60">
                Seed Extraction
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Sure Foreground Markers
              </h3>
              <div className="my-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-cyan-900 dark:text-cyan-300 text-center">
                <MathFormula
                  tex="M_{\text{fg}} = \{p \mid D(p) \ge \theta \cdot \max(D)\}"
                  fallback="M_fg = {p | D(p) >= θ · max(D)}"
                  display={true}
                />
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Applies a threshold factor θ (typically 0.40 to 0.70) to distance peaks to generate isolated seed markers for each individual coin entity, eradicating over-segmentation.
              </p>
            </div>

            {/* 3. Watershed Dam Delineation */}
            <div className="p-6 rounded-2xl bg-white dark:bg-navy-900/70 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-200 dark:border-cyan-800/60">
                Boundary Flooding
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Watershed Dam Flooding
              </h3>
              <div className="my-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-cyan-900 dark:text-cyan-300 text-center">
                <MathFormula
                  tex="W = \{p \mid \exists i \neq j: p \in \partial B_i \cap \partial B_j\}"
                  fallback="W = {p | p in ∂Bi ∩ ∂Bj}"
                  display={true}
                />
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Simulates water rising from marker seeds. Where floodwaters from distinct catchment basins B_i and B_j meet, watershed boundary dams (marked with -1) are erected to sever the connection.
              </p>
            </div>

          </div>

          {/* Educational Limitations Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Algorithmic Limitations & Robustness Considerations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <span className="text-amber-500">⚠</span>
                  <span>Over-Segmentation Vulnerability</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Surface texture, coin engravings, or specular highlights can generate spurious local distance peaks. A pre-filtering blur and appropriate foreground threshold factor θ are essential to eliminate false seeds.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <span className="text-amber-500">⚠</span>
                  <span>Non-Uniform Illumination & Shadows</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Directional lighting creates shadows along coin edges that merge adjacent coin silhouettes. Adaptive binarization or manual cutoff tuning helps isolate authentic coin contours.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 3: SAVED EXPERIMENT HISTORY */}
      {/* ========================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Saved Watershed Experiments
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Persistent database records stored in MongoDB with segmentation parameters and counting evaluations.
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
              No saved watershed experiments recorded yet. Execute a segmentation experiment to persist records here.
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
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 font-bold">
                        {exp.results?.automaticCount ?? exp.automaticCount ?? 0} Coins
                      </span>
                      {exp.results?.hasGroundTruth && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
                          IoU: {exp.results.iou}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      Target: {exp.originalFilename} • θ={exp.parameters?.fgThresholdFactor} • Filter: {exp.parameters?.blurMethod} • Dilation: {exp.parameters?.bgDilationIterations}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Executed: {new Date(exp.createdAt).toLocaleString()} • Duration: {exp.processingTimeMs || 0} ms
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => generateWatershedPDFReport(exp)}
                      className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Download PDF"
                    >
                      <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => exportWatershedCSV(exp)}
                      className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Download CSV"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Delete experiment "${exp.name}"?`)) {
                          await apiService.watershed.deleteHistory(exp._id);
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

      {/* Footer Return Link */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-cyan-700 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Studio Home</span>
        </Link>
        <Link
          to="/modules/morphology"
          className="text-sm font-semibold text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          ← Previous: Module 02 – Morphological Separation
        </Link>
      </div>

    </div>
  );
};

export default WatershedPage;
