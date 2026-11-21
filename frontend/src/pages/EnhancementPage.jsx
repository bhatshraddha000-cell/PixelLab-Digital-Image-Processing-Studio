import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Cpu,
  BarChart3,
  Image as ImageIcon,
  Upload,
  Download,
  FileText,
  FileSpreadsheet,
  FileCode,
  RotateCcw,
  Play,
  Trash2,
  Eye,
  Info,
  Scale,
  X,
  Check,
} from 'lucide-react';
import EnhancementIllustration from '../components/illustrations/EnhancementIllustration';
import ImageSplitSlider from '../components/ImageSplitSlider';
import HistogramViewer from '../components/HistogramViewer';
import MathFormula from '../components/MathFormula';
import apiService from '../services/api';
import { exportExperimentCSV, exportExperimentJSON, generatePDFReport } from '../utils/exportUtils';

export const EnhancementPage = () => {
  // Navigation / Tab state
  const [activeTab, setActiveTab] = useState('workspace'); // 'workspace' | 'theory' | 'history'

  // Sample benchmark datasets
  const [samples, setSamples] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState('coins_objects');

  // Input & Reference image states
  const [sourceType, setSourceType] = useState('sample'); // 'sample' | 'custom'
  const [inputImageFile, setInputImageFile] = useState(null);
  const [inputPreviewUrl, setInputPreviewUrl] = useState('/samples/noisy_coins_objects.png');
  const [refImageFile, setRefImageFile] = useState(null);
  const [refPreviewUrl, setRefPreviewUrl] = useState('/samples/clean_coins_objects.png');
  const [hasReference, setHasReference] = useState(true);
  const [imageMeta, setImageMeta] = useState({ width: 512, height: 512, name: 'noisy_coins_objects.png' });

  // Parameter states
  const [kernelSize, setKernelSize] = useState(5);
  const [sigma, setSigma] = useState(1.2);
  const [autoSigma, setAutoSigma] = useState(false);
  const [gamma, setGamma] = useState(1.0);
  const [sharpening, setSharpening] = useState(0.4);
  const [experimentName, setExperimentName] = useState('Coins-Denoise-Trial');
  const [userObservations, setUserObservations] = useState('');

  // Processing execution states
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [currentResult, setCurrentResult] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'sideBySide' | 'enhancedOnly'

  // History & Comparison states
  const [historyList, setHistoryList] = useState([]);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  const fileInputRef = useRef(null);
  const refFileInputRef = useRef(null);

  // Load sample gallery metadata and past experiment history on mount
  useEffect(() => {
    apiService.enhancement
      .getSamples()
      .then((data) => {
        if (data && data.samples) {
          setSamples(data.samples);
        }
      })
      .catch((err) => console.warn('Could not load samples list:', err.message));

    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await apiService.enhancement.getHistory();
      if (res && res.history) {
        setHistoryList(res.history);
      }
    } catch (err) {
      console.warn('Could not load history:', err.message);
    }
  };

  // Select a built-in sample
  const handleSelectSample = (sample) => {
    setSelectedSampleId(sample.id);
    setSourceType('sample');
    setInputImageFile(null);
    setRefImageFile(null);
    setInputPreviewUrl(sample.noisyUrl);
    setRefPreviewUrl(sample.cleanUrl);
    setHasReference(Boolean(sample.hasCleanReference));
    setImageMeta({ width: 512, height: 512, name: `${sample.id}.png` });

    if (sample.defaultParams) {
      setKernelSize(sample.defaultParams.kernel_size || 5);
      setSigma(sample.defaultParams.sigma || 1.0);
      setGamma(sample.defaultParams.gamma || 1.0);
      setSharpening(sample.defaultParams.sharpening || 0.0);
    }
    setExperimentName(`Enhance-${sample.id}`);
  };

  // Custom image file upload handler
  const handleCustomUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image exceeds maximum permitted size of 10 MB.');
      return;
    }

    setErrorMessage(null);
    setSourceType('custom');
    setSelectedSampleId(null);
    setInputImageFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImageMeta({ width: img.width, height: img.height, name: file.name });
      };
      img.src = event.target.result;
      setInputPreviewUrl(event.target.result);
    };
    reader.readAsDataURL(file);

    setExperimentName(`Upload-${file.name.slice(0, 12)}`);
  };

  // Custom reference ground truth upload handler
  const handleReferenceUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setRefImageFile(file);
      setRefPreviewUrl(event.target.result);
      setHasReference(true);
    };
    reader.readAsDataURL(file);
  };

  // Apply Parameter Presets
  const applyPreset = (presetType) => {
    if (presetType === 'mild') {
      setKernelSize(3);
      setSigma(0.8);
      setAutoSigma(false);
      setGamma(1.0);
      setSharpening(0.2);
    } else if (presetType === 'balanced') {
      setKernelSize(5);
      setSigma(1.2);
      setAutoSigma(false);
      setGamma(1.05);
      setSharpening(0.4);
    } else if (presetType === 'strong') {
      setKernelSize(9);
      setSigma(2.2);
      setAutoSigma(false);
      setGamma(1.0);
      setSharpening(0.0);
    } else if (presetType === 'brightness') {
      setKernelSize(5);
      setSigma(1.0);
      setAutoSigma(false);
      setGamma(0.75); // <1 expands dark midtones
      setSharpening(0.3);
    }
  };

  // Execute actual OpenCV processing pipeline
  const handleApplyEnhancement = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    const formData = new FormData();

    if (sourceType === 'sample' && selectedSampleId) {
      formData.append('sampleId', selectedSampleId);
    } else if (inputImageFile) {
      formData.append('image', inputImageFile);
    } else {
      setErrorMessage('Please select a sample benchmark image or upload a custom image file.');
      setIsProcessing(false);
      return;
    }

    if (refImageFile) {
      formData.append('reference_image', refImageFile);
    }

    formData.append('kernel_size', String(kernelSize));
    formData.append('sigma', String(autoSigma ? 0 : sigma));
    formData.append('gamma', String(gamma));
    formData.append('sharpening', String(sharpening));
    formData.append('experimentName', experimentName);
    formData.append('userObservations', userObservations);

    try {
      const data = await apiService.enhancement.process(formData);
      setCurrentResult(data);
      loadHistory();
    } catch (err) {
      setErrorMessage(err.message || 'Image processing failed in OpenCV pipeline.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete an experiment
  const handleDeleteExperiment = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this experiment and its stored files?')) return;
    try {
      await apiService.enhancement.deleteHistory(id);
      setHistoryList((prev) => prev.filter((item) => String(item._id) !== String(id)));
    } catch (err) {
      alert(`Could not delete experiment: ${err.message}`);
    }
  };

  // Toggle selection for comparison
  const toggleComparisonSelection = (id) => {
    setSelectedForComparison((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Quick download enhanced image as PNG
  const handleDownloadEnhanced = () => {
    if (!currentResult?.images?.enhanced) return;
    const link = document.createElement('a');
    link.href = currentResult.images.enhanced;
    link.download = `${experimentName.replace(/\s+/g, '_')}_enhanced.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-700 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Studio Overview</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Image Enhancement Studio
            </h1>
            <span className="text-xs font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/60">
              Module 01 • Active OpenCV Engine
            </span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mt-1">
            Gaussian spatial smoothing convolution and power-law gamma intensity transformation with quantitative quality metrics.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'workspace'
                ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Interactive Lab</span>
          </button>

          <button
            onClick={() => setActiveTab('theory')}
            className={`px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'theory'
                ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Theory & Formulas</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>History ({historyList.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE LABORATORY WORKSPACE */}
      {activeTab === 'workspace' && (
        <div className="space-y-8">
          
          {/* Main 3-Column Studio Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Image Selection, Upload & Parameter Sliders (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Card 1: Image Source (Samples vs Upload) */}
              <div className="p-5 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Select Input Image</span>
                  </h3>
                  <div className="flex items-center space-x-1 text-xs font-mono">
                    <button
                      onClick={() => setSourceType('sample')}
                      className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                        sourceType === 'sample'
                          ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-400'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Samples (5)
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <button
                      onClick={() => setSourceType('custom')}
                      className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                        sourceType === 'custom'
                          ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-400'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Upload
                    </button>
                  </div>
                </div>

                {/* Built-in Sample Benchmark Gallery */}
                {sourceType === 'sample' ? (
                  <div className="space-y-2">
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      Select natural benchmark with paired clean ground-truth:
                    </span>
                    <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                      {samples.map((s) => {
                        const isSelected = selectedSampleId === s.id;
                        return (
                          <div
                            key={s.id}
                            onClick={() => handleSelectSample(s)}
                            className={`p-2.5 rounded-xl border flex items-center space-x-3 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-400 dark:border-cyan-500 ring-1 ring-cyan-400'
                                : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                          >
                            <img
                              src={s.noisyUrl}
                              alt={s.title}
                              className="w-12 h-12 rounded-lg object-cover border border-slate-300 dark:border-slate-700 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {s.title}
                              </div>
                              <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium line-clamp-1">
                                {s.description}
                              </div>
                              <span className="inline-block mt-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                Paired Reference Ready
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Custom Drag & Drop / File Upload */
                  <div className="space-y-3">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-950/40"
                    >
                      <Upload className="w-6 h-6 mx-auto text-cyan-600 dark:text-cyan-400 mb-1" />
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {inputImageFile ? inputImageFile.name : 'Click to Browse or Drag & Drop'}
                      </div>
                      <div className="text-[10px] text-slate-500">JPG, PNG, WEBP up to 10 MB</div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleCustomUpload}
                        className="hidden"
                      />
                    </div>

                    {/* Optional Clean Reference Upload */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                        <span className="text-slate-800 dark:text-slate-200">Optional Clean Reference:</span>
                        {refImageFile ? (
                          <span className="text-emerald-600 text-[10px] font-mono">Loaded</span>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-mono">None</span>
                        )}
                      </div>
                      <button
                        onClick={() => refFileInputRef.current?.click()}
                        className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{refImageFile ? 'Replace Reference' : 'Upload Clean Reference Image'}</span>
                      </button>
                      <input
                        ref={refFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleReferenceUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}

                {/* Dimensions metadata pill */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400">
                  <span>Dimensions: {imageMeta.width} × {imageMeta.height} px</span>
                  <span className={hasReference ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400'}>
                    {hasReference ? 'Reference Paired' : 'No Reference'}
                  </span>
                </div>
              </div>

              {/* Card 2: Parameter Controls */}
              <div className="p-5 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Processing Parameters</span>
                  </h3>
                  <button
                    onClick={() => {
                      setKernelSize(5);
                      setSigma(1.0);
                      setAutoSigma(false);
                      setGamma(1.0);
                      setSharpening(0.0);
                    }}
                    className="text-[11px] font-mono font-semibold text-slate-500 hover:text-cyan-600 flex items-center space-x-1 cursor-pointer"
                    title="Reset parameters to standard defaults"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Preset Fast-Picks */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Quick Presets:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
                    <button
                      onClick={() => applyPreset('mild')}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      Mild Denoise
                    </button>
                    <button
                      onClick={() => applyPreset('balanced')}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      Balanced
                    </button>
                    <button
                      onClick={() => applyPreset('strong')}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      Strong Smoothing
                    </button>
                    <button
                      onClick={() => applyPreset('brightness')}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      Brightness Boost
                    </button>
                  </div>
                </div>

                {/* 1. Gaussian Kernel Size */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-900 dark:text-white">
                      1. Gaussian Kernel Size:
                    </label>
                    <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400">
                      {kernelSize} × {kernelSize} px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="7"
                    step="1"
                    value={[3, 5, 7, 9, 11, 15, 21, 31].indexOf(kernelSize)}
                    onChange={(e) => {
                      const kernels = [3, 5, 7, 9, 11, 15, 21, 31];
                      setKernelSize(kernels[parseInt(e.target.value, 10)]);
                    }}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>3 (Subtle)</span>
                    <span>5</span>
                    <span>9</span>
                    <span>15</span>
                    <span>31 (Dense)</span>
                  </div>
                </div>

                {/* 2. Gaussian Sigma (Standard Deviation) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-900 dark:text-white">
                      2. Gaussian Sigma (σ):
                    </label>
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-1 text-[11px] text-slate-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoSigma}
                          onChange={(e) => setAutoSigma(e.target.checked)}
                          className="accent-cyan-500"
                        />
                        <span>Auto</span>
                      </label>
                      <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400">
                        {autoSigma ? 'Auto' : sigma.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    disabled={autoSigma}
                    value={sigma}
                    onChange={(e) => setSigma(parseFloat(e.target.value))}
                    className={`w-full accent-cyan-500 cursor-pointer ${autoSigma ? 'opacity-40' : ''}`}
                  />
                  <div className="text-[10px] text-slate-500 font-medium">
                    Controls spatial spread of the Gaussian bell curve.
                  </div>
                </div>

                {/* 3. Gamma Transformation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-900 dark:text-white">
                      3. Gamma Exponent (γ):
                    </label>
                    <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400">
                      {gamma.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.05"
                    value={gamma}
                    onChange={(e) => setGamma(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    {gamma < 0.95 && 'γ < 1: Brightens shadows & expands dark midtones'}
                    {gamma > 1.05 && 'γ > 1: Darkens highlights & compresses exposure'}
                    {gamma >= 0.95 && gamma <= 1.05 && 'γ ≈ 1: Preserves original intensity mapping'}
                  </div>
                </div>

                {/* 4. Sharpening Strength (Unsharp Masking) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-900 dark:text-white">
                      4. Sharpening Strength (Unsharp Mask):
                    </label>
                    <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400">
                      {sharpening.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="2.0"
                    step="0.1"
                    value={sharpening}
                    onChange={(e) => setSharpening(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-500 font-medium">
                    {sharpening === 0 ? 'Disabled (Strict Gaussian + Gamma)' : 'Post-gamma unsharp masking for edge restoration'}
                  </div>
                </div>

                {/* Action: Apply Enhancement Button */}
                <div className="pt-2">
                  <button
                    onClick={handleApplyEnhancement}
                    disabled={isProcessing}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Executing OpenCV Pipeline...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Apply Enhancement</span>
                      </>
                    )}
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

            </div>

            {/* CENTER COLUMN: Visual Image Inspection & Comparison Slider (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Image View Mode Controls */}
              <div className="p-4 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-semibold">
                  <button
                    onClick={() => setViewMode('split')}
                    className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                      viewMode === 'split'
                        ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Split Slider
                  </button>
                  <button
                    onClick={() => setViewMode('sideBySide')}
                    className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                      viewMode === 'sideBySide'
                        ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    3-Stage Pipeline
                  </button>
                  <button
                    onClick={() => setViewMode('enhancedOnly')}
                    className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                      viewMode === 'enhancedOnly'
                        ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Enhanced Only
                  </button>
                </div>

                {currentResult?.images?.enhanced && (
                  <button
                    onClick={handleDownloadEnhanced}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center space-x-1 text-xs font-semibold cursor-pointer"
                    title="Download Enhanced Image as PNG"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download PNG</span>
                  </button>
                )}
              </div>

              {/* View 1: Draggable Split Slider */}
              {viewMode === 'split' && (
                <div className="space-y-2">
                  <ImageSplitSlider
                    beforeImage={currentResult?.images?.original || inputPreviewUrl}
                    afterImage={currentResult?.images?.enhanced || inputPreviewUrl}
                    beforeLabel="Input Noisy Image"
                    afterLabel={currentResult ? "Enhanced Output" : "Original (Press Apply)"}
                    className="w-full h-80 sm:h-96 shadow-lg"
                  />
                  <div className="text-center text-[11px] font-mono text-slate-500">
                    Drag the central cyan line left and right to inspect pixel changes before and after enhancement.
                  </div>
                </div>
              )}

              {/* View 2: 3-Stage Pipeline Side-by-Side */}
              {viewMode === 'sideBySide' && (
                <div className="space-y-4">
                  {/* Stage 1: Input Noisy */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-xs font-mono font-bold text-slate-300 mb-2">Stage 1: Input Noisy Image</div>
                    <img
                      src={currentResult?.images?.original || inputPreviewUrl}
                      alt="Input"
                      className="w-full h-44 object-contain rounded-lg"
                    />
                  </div>

                  {/* Stage 2: Gaussian Smoothed */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-xs font-mono font-bold text-blue-400 mb-2">Stage 2: Gaussian Smoothed (k={kernelSize})</div>
                    <img
                      src={currentResult?.images?.smoothed || inputPreviewUrl}
                      alt="Smoothed"
                      className="w-full h-44 object-contain rounded-lg"
                    />
                  </div>

                  {/* Stage 3: Final Enhanced */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/40 text-center">
                    <div className="text-xs font-mono font-bold text-cyan-400 mb-2">Stage 3: Final Enhanced (γ={gamma.toFixed(2)})</div>
                    <img
                      src={currentResult?.images?.enhanced || inputPreviewUrl}
                      alt="Enhanced"
                      className="w-full h-44 object-contain rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* View 3: Enhanced Only */}
              {viewMode === 'enhancedOnly' && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 shadow-lg text-center">
                  <img
                    src={currentResult?.images?.enhanced || inputPreviewUrl}
                    alt="Final Output"
                    className="w-full h-80 sm:h-96 object-contain rounded-xl"
                  />
                  <div className="mt-2 text-xs font-mono text-cyan-400 font-bold">
                    Enhanced Image Output • {imageMeta.width} × {imageMeta.height} px
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: Quantitative Evaluation Metrics & Observations (3 cols) */}
            <div className="lg:col-span-3 space-y-4">
              
              {/* Metric Cards Header */}
              <div className="p-4 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <BarChart3 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Quality Metrics</span>
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold">
                    {currentResult ? `${currentResult.processingTimeMs} ms` : 'Standby'}
                  </span>
                </div>

                {/* Ground Truth Status Badge */}
                <div
                  className={`p-2.5 rounded-xl border text-xs font-medium ${
                    currentResult?.evaluation?.has_reference || hasReference
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  <div className="font-bold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {currentResult?.evaluation?.has_reference || hasReference
                        ? 'Ground-Truth Reference Validated'
                        : 'No Clean Reference Supplied'}
                    </span>
                  </div>
                  <div className="text-[10px] mt-1 leading-snug">
                    {currentResult?.evaluation?.has_reference || hasReference
                      ? 'Metrics calculate absolute reconstruction fidelity against clean reference ground-truth.'
                      : 'Values represent transformation difference from input. Reference image needed for true PSNR/SSIM.'}
                  </div>
                </div>

                {/* 1. MSE Card */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">MSE</span>
                    <span className="text-[10px] font-mono text-slate-500">Mean Squared Error</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-mono font-extrabold text-slate-900 dark:text-white">
                      {currentResult?.evaluation?.metrics?.mse !== undefined
                        ? currentResult.evaluation.metrics.mse
                        : '—'}
                    </span>
                    {currentResult?.evaluation?.delta?.mse !== undefined && (
                      <span
                        className={`text-xs font-mono font-bold ${
                          currentResult.evaluation.delta.mse_improved
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {currentResult.evaluation.delta.mse > 0 ? '+' : ''}
                        {currentResult.evaluation.delta.mse}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. PSNR Card */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">PSNR (dB)</span>
                    <span className="text-[10px] font-mono text-slate-500">Peak Signal-to-Noise</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-mono font-extrabold text-cyan-700 dark:text-cyan-400">
                      {currentResult?.evaluation?.metrics?.psnr !== undefined
                        ? `${currentResult.evaluation.metrics.psnr} dB`
                        : '—'}
                    </span>
                    {currentResult?.evaluation?.delta?.psnr !== undefined && (
                      <span
                        className={`text-xs font-mono font-bold ${
                          currentResult.evaluation.delta.psnr_improved
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {currentResult.evaluation.delta.psnr > 0 ? '+' : ''}
                        {currentResult.evaluation.delta.psnr} dB
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. SSIM Card */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">SSIM</span>
                    <span className="text-[10px] font-mono text-slate-500">Structural Similarity</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-mono font-extrabold text-violet-700 dark:text-violet-400">
                      {currentResult?.evaluation?.metrics?.ssim !== undefined
                        ? currentResult.evaluation.metrics.ssim
                        : '—'}
                    </span>
                    {currentResult?.evaluation?.delta?.ssim !== undefined && (
                      <span
                        className={`text-xs font-mono font-bold ${
                          currentResult.evaluation.delta.ssim_improved
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {currentResult.evaluation.delta.ssim > 0 ? '+' : ''}
                        {currentResult.evaluation.delta.ssim}
                      </span>
                    )}
                  </div>
                </div>

                {/* Export Toolkit */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                    Export Experiment
                  </span>
                  <div className="grid grid-cols-3 gap-1 text-xs font-semibold">
                    <button
                      onClick={() =>
                        exportExperimentCSV({
                          name: experimentName,
                          originalFilename: imageMeta.name,
                          parameters: { kernelSize, sigma: autoSigma ? 'auto' : sigma, gamma, sharpening },
                          metrics: currentResult?.evaluation?.metrics,
                          processingTimeMs: currentResult?.processingTimeMs,
                          metadata: imageMeta,
                          userObservations,
                        })
                      }
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 flex items-center justify-center space-x-1 cursor-pointer"
                      title="Export CSV"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>CSV</span>
                    </button>

                    <button
                      onClick={() =>
                        exportExperimentJSON({
                          name: experimentName,
                          originalFilename: imageMeta.name,
                          parameters: { kernelSize, sigma: autoSigma ? 'auto' : sigma, gamma, sharpening },
                          metrics: currentResult?.evaluation,
                          processingTimeMs: currentResult?.processingTimeMs,
                          metadata: imageMeta,
                          userObservations,
                        })
                      }
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 flex items-center justify-center space-x-1 cursor-pointer"
                      title="Export JSON"
                    >
                      <FileCode className="w-3.5 h-3.5 text-blue-600" />
                      <span>JSON</span>
                    </button>

                    <button
                      onClick={() =>
                        generatePDFReport({
                          name: experimentName,
                          originalFilename: imageMeta.name,
                          parameters: { kernelSize, sigma: autoSigma ? 'auto' : sigma, gamma, sharpening },
                          metrics: currentResult?.evaluation,
                          processingTimeMs: currentResult?.processingTimeMs,
                          metadata: imageMeta,
                          images: currentResult?.images,
                          userObservations,
                        })
                      }
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 flex items-center justify-center space-x-1 cursor-pointer"
                      title="Generate Academic PDF Report"
                    >
                      <FileText className="w-3.5 h-3.5 text-rose-600" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* BOTTOM SECTION: 256-Bin Histograms & Scientific Analysis */}
          <div className="space-y-6">
            
            {/* Recharts Histograms */}
            <HistogramViewer
              originalHist={currentResult?.histograms?.original}
              enhancedHist={currentResult?.histograms?.enhanced}
              title="256-Bin Frequency Intensity Histograms (Actual Pixel Densities)"
            />

            {/* Analysis and Observations Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Info className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span>Analysis and Observations</span>
              </h3>

              {/* Automated CV Analysis Breakdown */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                <div className="font-bold text-slate-900 dark:text-white">
                  Algorithmic Behavior Summary:
                </div>
                <p>
                  • <strong>Gaussian Smoothing:</strong> The {kernelSize}×{kernelSize} convolution kernel suppresses high-frequency noise variance. Larger kernels smooth more aggressively at the cost of blurring sharp boundary gradients.
                </p>
                <p>
                  • <strong>Gamma Transformation:</strong> Applying γ = {gamma.toFixed(2)} shifts pixel intensities nonlinearly. {gamma < 1 ? 'Because γ < 1, shadowed regions expand into higher luminance without clipping.' : gamma > 1 ? 'Because γ > 1, saturated highlights are compressed.' : 'Dynamic range is maintained.'}
                </p>
                {sharpening > 0 && (
                  <p>
                    • <strong>Unsharp Masking:</strong> High-pass difference amplification (strength = {sharpening.toFixed(1)}) partially restored high-frequency edge gradients post-smoothing.
                  </p>
                )}
                <p className="text-cyan-800 dark:text-cyan-400 font-semibold pt-1">
                  {currentResult?.evaluation?.explanation ||
                    'Run an enhancement experiment above to generate quantitative observation insights.'}
                </p>
              </div>

              {/* User Observations Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  User Experimental Findings & Notes:
                </label>
                <textarea
                  value={userObservations}
                  onChange={(e) => setUserObservations(e.target.value)}
                  placeholder="Record your experimental observations here (e.g., impact of σ=1.5 on edge preservation, texture blurring notes, PSNR gain)..."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: THEORETICAL FOUNDATIONS & MATHEMATICAL FORMULATIONS */}
      {activeTab === 'theory' && (
        <div className="space-y-10">
          
          {/* Module Hero Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl bg-white dark:bg-navy-900/80 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-lg">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">
                <Sliders className="w-4 h-4" />
                <span>INTENSITY & SPATIAL TRANSFORMATION</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Theoretical Foundations
              </h2>
              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Mathematical modeling of 2D Gaussian isotropic spatial kernels, power-law gamma curves, and quantitative objective error functions (MSE, PSNR, SSIM).
              </p>
            </div>
            <div className="lg:col-span-5">
              <EnhancementIllustration className="w-full h-auto max-h-72 drop-shadow-xl" />
            </div>
          </div>

          {/* Mathematical Formulations rendered with KaTeX */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 1. Gaussian Kernel */}
            <div className="p-5 rounded-2xl bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <span className="text-[10px] font-mono font-bold uppercase text-cyan-800 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800/60">
                Spatial Denoising
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Gaussian Kernel</h3>
              <div className="my-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-cyan-900 dark:text-cyan-300 text-center">
                <MathFormula
                  tex="G(x,y) = \frac{1}{2\pi\sigma^2} e^{-\frac{x^2+y^2}{2\sigma^2}}"
                  fallback="G(x,y) = 1/(2πσ²) × exp(-(x²+y²)/(2σ²))"
                  display={true}
                />
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Suppresses additive white Gaussian noise by computing distance-weighted neighborhood averages.
              </p>
            </div>

            {/* 2. Gamma Transformation */}
            <div className="p-5 rounded-2xl bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <span className="text-[10px] font-mono font-bold uppercase text-blue-800 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/60">
                Contrast Correction
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Gamma Power-Law</h3>
              <div className="my-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-blue-900 dark:text-blue-300 text-center">
                <MathFormula
                  tex="s = 255 \times \left(\frac{r}{255}\right)^\gamma"
                  fallback="s = 255 × (r / 255)^γ"
                  display={true}
                />
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Nonlinear intensity scaling. Expands underexposed shadows when γ &lt; 1; compresses highlights when γ &gt; 1.
              </p>
            </div>

            {/* 3. MSE */}
            <div className="p-5 rounded-2xl bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                Error Metric
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Mean Squared Error</h3>
              <div className="my-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-emerald-900 dark:text-emerald-300 text-center">
                <MathFormula
                  tex="\text{MSE} = \frac{1}{MN}\sum_{x,y}[I(x,y) - R(x,y)]^2"
                  fallback="MSE = (1/N) × Σ(I - R)²"
                  display={true}
                />
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Cumulative squared difference between reconstructed image I and clean ground-truth reference R.
              </p>
            </div>

            {/* 4. PSNR */}
            <div className="p-5 rounded-2xl bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <span className="text-[10px] font-mono font-bold uppercase text-violet-800 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded border border-violet-200 dark:border-violet-800/60">
                Fidelity Metric
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Peak SNR</h3>
              <div className="my-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-violet-900 dark:text-violet-300 text-center">
                <MathFormula
                  tex="\text{PSNR} = 10 \cdot \log_{10}\left(\frac{255^2}{\text{MSE}}\right)"
                  fallback="PSNR = 10 × log10(255² / MSE)"
                  display={true}
                />
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Logarithmic ratio in decibels (dB) between maximum potential pixel power and noise power. Higher is better.
              </p>
            </div>

          </div>

          {/* Problem Statement & Objectives */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Problem Statement</h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                In real-world optical sensors, thermal variance, low photon counts, and transmission noise degrade signal fidelity. Simple linear contrast scaling uniformly pushes the entire histogram, causing saturated blowout without attenuating noise. This module couples Gaussian convolution for localized denoising with power-law gamma transformation for targeted contrast expansion.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Key Experimental Objectives</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                  <span>Attenuate high-frequency AWGN sensor noise while preserving structural contours.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                  <span>Tune Gaussian kernel radius and standard deviation σ dynamically.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                  <span>Verify real-time 256-bin intensity histogram redistribution.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                  <span>Quantify objective reconstruction fidelity via MSE, PSNR (dB), and SSIM.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: EXPERIMENT HISTORY & MULTI-CONFIG COMPARISON */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Saved Experiment History
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Select 2 or more experiments to compare parameter configurations and quantitative metrics.
              </p>
            </div>

            {selectedForComparison.length >= 2 && (
              <button
                onClick={() => setShowComparisonModal(true)}
                className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md hover:bg-cyan-500 transition-colors cursor-pointer"
              >
                <Scale className="w-4 h-4" />
                <span>Compare Selected ({selectedForComparison.length})</span>
              </button>
            )}
          </div>

          {/* History Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900/80 shadow-sm">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-3 w-10 text-center">Select</th>
                  <th className="p-3">Experiment Name</th>
                  <th className="p-3">Input File</th>
                  <th className="p-3">Kernel</th>
                  <th className="p-3">Sigma</th>
                  <th className="p-3">Gamma</th>
                  <th className="p-3">Sharpen</th>
                  <th className="p-3">MSE</th>
                  <th className="p-3">PSNR (dB)</th>
                  <th className="p-3">SSIM</th>
                  <th className="p-3">Time</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                {historyList.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-500 font-sans">
                      No experiments saved yet. Run an enhancement trial in the interactive lab to record results.
                    </td>
                  </tr>
                ) : (
                  historyList.map((item) => {
                    const isSelected = selectedForComparison.includes(item._id);
                    return (
                      <tr
                        key={item._id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                          isSelected ? 'bg-cyan-50/60 dark:bg-cyan-950/30' : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleComparisonSelection(item._id)}
                            className="accent-cyan-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                          {item.name}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                          {item.originalFilename}
                        </td>
                        <td className="p-3 font-bold text-cyan-700 dark:text-cyan-400">
                          {item.parameters?.kernelSize}×{item.parameters?.kernelSize}
                        </td>
                        <td className="p-3">{item.parameters?.sigma}</td>
                        <td className="p-3">{item.parameters?.gamma}</td>
                        <td className="p-3">{item.parameters?.sharpening}</td>
                        <td className="p-3">{item.metrics?.mse !== undefined ? item.metrics.mse : '—'}</td>
                        <td className="p-3 font-bold text-cyan-700 dark:text-cyan-400">
                          {item.metrics?.psnr !== undefined ? `${item.metrics.psnr} dB` : '—'}
                        </td>
                        <td className="p-3">{item.metrics?.ssim !== undefined ? item.metrics.ssim : '—'}</td>
                        <td className="p-3 text-slate-500">{item.processingTimeMs || 0} ms</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={(e) => handleDeleteExperiment(item._id, e)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Delete experiment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Comparison Modal */}
          {showComparisonModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Scale className="w-5 h-5 text-cyan-500" />
                    <span>Multi-Experiment Configuration Comparison</span>
                  </h3>
                  <button
                    onClick={() => setShowComparisonModal(false)}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {historyList
                    .filter((item) => selectedForComparison.includes(item._id))
                    .map((item) => (
                      <div
                        key={item._id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3"
                      >
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </div>
                        <div className="space-y-1 text-xs font-mono">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Kernel:</span>
                            <span className="font-bold text-cyan-600">{item.parameters?.kernelSize}×{item.parameters?.kernelSize}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Sigma:</span>
                            <span>{item.parameters?.sigma}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Gamma:</span>
                            <span>{item.parameters?.gamma}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Sharpening:</span>
                            <span>{item.parameters?.sharpening}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 text-xs font-mono">
                          <div className="flex justify-between">
                            <span className="text-slate-500">MSE:</span>
                            <span>{item.metrics?.mse}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">PSNR:</span>
                            <span className="font-bold text-cyan-600">{item.metrics?.psnr} dB</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">SSIM:</span>
                            <span className="font-bold text-violet-600">{item.metrics?.ssim}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => setShowComparisonModal(false)}
                    className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                  >
                    Close Comparison
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default EnhancementPage;
