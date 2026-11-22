import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Export experiment data as structured CSV
 */
export const exportExperimentCSV = (exp) => {
  if (!exp) return;

  const rows = [
    ['PixelLab Digital Image Processing Studio - Experiment Record'],
    ['Generated', new Date().toISOString()],
    ['Module', 'Image Enhancement (Gaussian Smoothing + Gamma Transformation)'],
    ['Experiment Name', exp.name || 'Untitled'],
    ['Input Filename', exp.originalFilename || 'input.png'],
    ['Image Dimensions', `${exp.metadata?.width || 0} x ${exp.metadata?.height || 0} px`],
    ['Processing Time', `${exp.processingTimeMs || 0} ms`],
    [],
    ['--- PARAMETERS ---'],
    ['Gaussian Kernel Size', exp.parameters?.kernelSize || 5],
    ['Gaussian Sigma', exp.parameters?.sigma || 'auto'],
    ['Gamma Exponent', exp.parameters?.gamma || 1.0],
    ['Sharpening Strength', exp.parameters?.sharpening || 0.0],
    [],
    ['--- QUANTITATIVE METRICS ---'],
    ['Reference Ground Truth Available', exp.metrics?.hasReference ? 'YES' : 'NO'],
    ['Mean Squared Error (MSE)', exp.metrics?.mse || 'N/A'],
    ['Peak Signal-to-Noise Ratio (PSNR dB)', exp.metrics?.psnr || 'N/A'],
    ['Structural Similarity Index (SSIM)', exp.metrics?.ssim || 'N/A'],
    ['PSNR Improvement Delta (dB)', exp.metrics?.delta?.psnr !== undefined ? exp.metrics.delta.psnr : 'N/A'],
    ['SSIM Improvement Delta', exp.metrics?.delta?.ssim !== undefined ? exp.metrics.delta.ssim : 'N/A'],
    [],
    ['--- USER OBSERVATIONS ---'],
    ['Observations', `"${(exp.userObservations || 'None recorded').replace(/"/g, '""')}"`],
    ['Algorithm Analysis', `"${(exp.metrics?.explanation || '').replace(/"/g, '""')}"`],
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${(exp.name || 'experiment').replace(/\s+/g, '_')}_metrics.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export experiment data as formatted JSON
 */
export const exportExperimentJSON = (exp) => {
  if (!exp) return;

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exp, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `${(exp.name || 'experiment').replace(/\s+/g, '_')}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate a professional academic PDF report
 */
export const generatePDFReport = async (exp, elementToCaptureId = null) => {
  if (!exp) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header Bar
  doc.setFillColor(10, 15, 29); // Dark navy
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(6, 182, 212); // Cyan
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PIXELLAB – DIGITAL IMAGE PROCESSING STUDIO', 14, 12);

  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.setFont('helvetica', 'normal');
  doc.text('Academic Computer Vision Experiment Report • Module 01: Image Enhancement', 14, 18);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 23);

  y = 36;

  // Experiment Summary Section
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`Experiment: ${exp.name || 'Image Enhancement Evaluation'}`, 14, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Input File: ${exp.originalFilename || 'input_matrix.png'}`, 14, y);
  doc.text(`Dimensions: ${exp.metadata?.width || 0} × ${exp.metadata?.height || 0} px`, 80, y);
  doc.text(`Execution Time: ${exp.processingTimeMs || 0} ms`, 140, y);
  y += 10;

  // Parameters Table Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Applied Algorithmic Parameters', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Gaussian Kernel: ${exp.parameters?.kernelSize || 5} × ${exp.parameters?.kernelSize || 5}`, 18, y + 12);
  doc.text(`Gaussian Sigma (σ): ${exp.parameters?.sigma || 'auto'}`, 75, y + 12);
  doc.text(`Gamma (γ): ${exp.parameters?.gamma || 1.0}`, 130, y + 12);
  doc.text(`Sharpening (Unsharp Mask): ${exp.parameters?.sharpening || 0.0}`, 18, y + 17);
  y += 28;

  // Quantitative Metrics Box
  doc.setFillColor(240, 249, 255); // Light cyan
  doc.setDrawColor(186, 230, 253);
  doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(3, 105, 161);
  doc.text(
    exp.metrics?.hasReference
      ? 'Quantitative Evaluation Metrics (Ground-Truth Reference Validated)'
      : 'Quantitative Evaluation Metrics (Input-to-Output Transformation Divergence)',
    18,
    y + 6
  );

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const mseStr = exp.metrics?.mse !== undefined ? String(exp.metrics.mse) : 'N/A';
  const psnrStr = exp.metrics?.psnr !== undefined ? `${exp.metrics.psnr} dB` : 'N/A';
  const ssimStr = exp.metrics?.ssim !== undefined ? String(exp.metrics.ssim) : 'N/A';

  doc.text(`MSE: ${mseStr}`, 18, y + 13);
  doc.text(`PSNR: ${psnrStr}`, 70, y + 13);
  doc.text(`SSIM: ${ssimStr}`, 125, y + 13);

  if (exp.metrics?.hasReference && exp.metrics?.delta) {
    const dPsnr = exp.metrics.delta.psnr !== undefined ? `${exp.metrics.delta.psnr > 0 ? '+' : ''}${exp.metrics.delta.psnr} dB` : '';
    const dSsim = exp.metrics.delta.ssim !== undefined ? `${exp.metrics.delta.ssim > 0 ? '+' : ''}${exp.metrics.delta.ssim}` : '';
    doc.setTextColor(16, 185, 129); // Green
    doc.text(`Δ PSNR: ${dPsnr}`, 70, y + 19);
    doc.text(`Δ SSIM: ${dSsim}`, 125, y + 19);
  }
  y += 32;

  // Embed Images (Original & Enhanced)
  if (exp.images && exp.images.original && exp.images.enhanced) {
    try {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Visual Inspection (Original Noisy vs. Enhanced Output)', 14, y);
      y += 4;

      const imgWidth = 85;
      const imgHeight = 65;

      doc.addImage(exp.images.original, 'PNG', 14, y, imgWidth, imgHeight);
      doc.addImage(exp.images.enhanced, 'PNG', 110, y, imgWidth, imgHeight);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Figure 1A: Input Noisy Image', 14, y + imgHeight + 4);
      doc.text('Figure 1B: Final Enhanced Output', 110, y + imgHeight + 4);

      y += imgHeight + 10;
    } catch (imgErr) {
      console.warn('Could not embed images in PDF:', imgErr.message);
    }
  }

  // Analysis & Observations
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Scientific Observations & Analysis', 14, y);
  y += 6;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const analysisText =
    exp.metrics?.explanation ||
    'The 2D Gaussian kernel convolution attenuates high-frequency noise variance while the power-law gamma transformation redistributes intensity levels across the dynamic range.';
  const splitAnalysis = doc.splitTextToSize(analysisText, pageWidth - 28);
  doc.text(splitAnalysis, 14, y);
  y += splitAnalysis.length * 4.5 + 4;

  if (exp.userObservations) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('User Experimental Notes:', 14, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const splitNotes = doc.splitTextToSize(exp.userObservations, pageWidth - 28);
    doc.text(splitNotes, 14, y);
    y += splitNotes.length * 4.5 + 4;
  }

  // Footer on all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`PixelLab CV Studio • Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
  }

  doc.save(`${(exp.name || 'PixelLab_Experiment').replace(/\s+/g, '_')}_Report.pdf`);
};

/**
 * Export Morphology experiment data as structured CSV
 */
export const exportMorphologyCSV = (exp) => {
  if (!exp) return;

  const rows = [
    ['PixelLab Digital Image Processing Studio - Module 02: Morphological Object Separation Record'],
    ['Generated', new Date().toISOString()],
    ['Experiment Name', exp.name || 'Untitled'],
    ['Input Filename', exp.originalFilename || 'coins.png'],
    ['Image Dimensions', `${exp.metadata?.width || 0} x ${exp.metadata?.height || 0} px`],
    ['Processing Time', `${exp.processingTimeMs || 0} ms`],
    [],
    ['--- PARAMETERS ---'],
    ['Threshold Method', exp.parameters?.thresholdMethod || 'otsu'],
    ['Threshold Value', exp.parameters?.thresholdValue || 127],
    ['Polarity', exp.parameters?.polarity || 'bright_on_dark'],
    ['Structuring Element Shape', exp.parameters?.structuringElement || 'ellipse'],
    ['Kernel Size', `${exp.parameters?.kernelWidth || 3} x ${exp.parameters?.kernelHeight || 3}`],
    ['Erosion Iterations', exp.parameters?.erosionIterations || 2],
    ['Dilation Iterations', exp.parameters?.dilationIterations || 1],
    ['Operation Mode', exp.parameters?.operationMode || 'custom'],
    ['Connectivity', exp.parameters?.connectivity || 8],
    ['Minimum Component Area (px)', exp.parameters?.minComponentArea || 50],
    ['Manual Reference Count', exp.parameters?.manualCount !== null && exp.parameters?.manualCount !== undefined ? exp.parameters.manualCount : 'N/A'],
    [],
    ['--- COUNTING RESULTS & METRICS ---'],
    ['Automatic Count Detected', exp.results?.automaticCount ?? exp.automaticCount ?? 0],
    ['Initial Connected Components Before Morphology', exp.results?.initialComponentsCount ?? 1],
    ['Separation Gain (Additional Objects Resolved)', exp.results?.separatedGain ?? 0],
    ['Manual Ground-Truth Reference Count', exp.results?.manualCount ?? 'N/A'],
    ['Count Disparity (Absolute Error)', exp.results?.countError ?? 'N/A'],
    ['Count Agreement Percentage (%)', exp.results?.countAgreementPercent !== null && exp.results?.countAgreementPercent !== undefined ? `${exp.results.countAgreementPercent}%` : 'N/A'],
    ['Accuracy Verdict', `"${(exp.results?.accuracyVerdict || '').replace(/"/g, '""')}"`],
    [],
    ['--- FOREGROUND PIXEL EVOLUTION ---'],
    ['Initial Binary Mask Pixels', exp.results?.foregroundPixels?.initial_binary ?? 'N/A'],
    ['Eroded Mask Pixels', exp.results?.foregroundPixels?.eroded ?? 'N/A'],
    ['Dilated/Final Mask Pixels', exp.results?.foregroundPixels?.final ?? 'N/A'],
    ['Area Retention Ratio', exp.results?.foregroundPixels?.area_retention_ratio ?? 'N/A'],
    [],
    ['--- DETECTED COMPONENTS BREAKDOWN ---'],
    ['Component ID', 'Area (px)', 'Centroid X', 'Centroid Y', 'BBox X', 'BBox Y', 'BBox W', 'BBox H'],
  ];

  if (Array.isArray(exp.components)) {
    exp.components.forEach((c) => {
      rows.push([
        c.id,
        c.area,
        c.centroid?.[0] ?? '',
        c.centroid?.[1] ?? '',
        c.bbox?.[0] ?? '',
        c.bbox?.[1] ?? '',
        c.bbox?.[2] ?? '',
        c.bbox?.[3] ?? '',
      ]);
    });
  }

  rows.push([]);
  rows.push(['--- USER OBSERVATIONS ---']);
  rows.push(['User Observations', `"${(exp.userObservations || 'None recorded').replace(/"/g, '""')}"`]);

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${(exp.name || 'morphology_experiment').replace(/\s+/g, '_')}_metrics.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export Morphology experiment as JSON
 */
export const exportMorphologyJSON = (exp) => {
  if (!exp) return;

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exp, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `${(exp.name || 'morphology_experiment').replace(/\s+/g, '_')}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate PDF report for Morphology Experiment
 */
export const generateMorphologyPDFReport = async (exp) => {
  if (!exp) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header Bar
  doc.setFillColor(10, 15, 29); // Dark navy
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(14, 165, 233); // Cyan / Sky
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PIXELLAB – DIGITAL IMAGE PROCESSING STUDIO', 14, 12);

  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.text('Academic Experiment Report • Module 02: Morphological Object Separation & Counting', 14, 18);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 23);

  y = 36;

  // Experiment Summary Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`Experiment: ${exp.name || 'Morphological Coin Counting'}`, 14, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Input File: ${exp.originalFilename || 'coins.png'}`, 14, y);
  doc.text(`Dimensions: ${exp.metadata?.width || 0} × ${exp.metadata?.height || 0} px`, 80, y);
  doc.text(`Execution Time: ${exp.processingTimeMs || 0} ms`, 140, y);
  y += 10;

  // Parameters Table Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 25, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Applied Algorithmic & Morphological Parameters', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Structuring Element: ${exp.parameters?.structuringElement?.toUpperCase() || 'ELLIPSE'} (${exp.parameters?.kernelWidth || 3}×${exp.parameters?.kernelHeight || 3})`, 18, y + 12);
  doc.text(`Erosion Iterations: ${exp.parameters?.erosionIterations || 2}`, 110, y + 12);
  doc.text(`Dilation Iterations: ${exp.parameters?.dilationIterations || 1}`, 155, y + 12);
  doc.text(`Threshold: ${exp.parameters?.thresholdMethod?.toUpperCase() || 'OTSU'} (Val: ${exp.parameters?.thresholdValue ?? 127})`, 18, y + 18);
  doc.text(`Mode: ${exp.parameters?.operationMode || 'custom'} | Connectivity: ${exp.parameters?.connectivity || 8}-Connected`, 110, y + 18);
  y += 31;

  // Counting Results Highlight Box
  doc.setFillColor(240, 253, 250); // Light teal/emerald
  doc.setDrawColor(153, 246, 228);
  doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 148, 136);
  doc.text('Object Counting & Bridge Severance Evaluation', 18, y + 6);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const autoCount = exp.results?.automaticCount ?? exp.automaticCount ?? 0;
  doc.text(`Detected Count: ${autoCount} Objects`, 18, y + 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const initialCount = exp.results?.initialComponentsCount ?? 1;
  const gain = exp.results?.separatedGain ?? 0;
  doc.text(`Initial Components: ${initialCount} (Bridge Severance Gain: +${gain})`, 18, y + 21);

  if (exp.results?.manualCount) {
    const agr = exp.results?.countAgreementPercent ?? 100;
    doc.setTextColor(16, 185, 129);
    doc.text(`Manual Ref: ${exp.results.manualCount} | Agreement: ${agr}%`, 110, y + 14);
  }
  y += 34;

  // Visual Inspection Images (Original vs. Labeled)
  if (exp.images && exp.images.original && exp.images.labeled) {
    try {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Visual Inspection (Input Image vs. Morphologically Labeled & Segmented)', 14, y);
      y += 4;

      const imgWidth = 85;
      const imgHeight = 60;

      doc.addImage(exp.images.original, 'PNG', 14, y, imgWidth, imgHeight);
      doc.addImage(exp.images.labeled, 'PNG', 110, y, imgWidth, imgHeight);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Figure 1A: Input Image (Touching Objects)', 14, y + imgHeight + 4);
      doc.text('Figure 1B: Final 8-Connected Labeled Output', 110, y + imgHeight + 4);

      y += imgHeight + 10;
    } catch (imgErr) {
      console.warn('Could not embed images in morphology PDF:', imgErr.message);
    }
  }

  // Component Distribution Breakdown
  if (y > 215) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Detected Object Components Summary', 14, y);
  y += 6;

  if (Array.isArray(exp.components) && exp.components.length > 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const summary = exp.components.slice(0, 12).map((c) => `#${c.id}: Area=${c.area}px Centroid=(${c.centroid[0]}, ${c.centroid[1]})`).join('  •  ');
    const splitSummary = doc.splitTextToSize(summary, pageWidth - 28);
    doc.text(splitSummary, 14, y);
    y += splitSummary.length * 4 + 4;
  }

  if (exp.userObservations) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Experimental Observations & Analysis:', 14, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const splitNotes = doc.splitTextToSize(exp.userObservations, pageWidth - 28);
    doc.text(splitNotes, 14, y);
    y += splitNotes.length * 4.5 + 4;
  }

  // Footer on all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`PixelLab CV Studio • Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
  }

  doc.save(`${(exp.name || 'Morphology_Experiment').replace(/\s+/g, '_')}_Report.pdf`);
};

/**
 * Export Watershed experiment data as structured CSV
 */
export const exportWatershedCSV = (exp) => {
  if (!exp) return;

  const rows = [
    ['PixelLab Digital Image Processing Studio - Module 03: Marker-Controlled Watershed Segmentation Record'],
    ['Generated', new Date().toISOString()],
    ['Experiment Name', exp.name || 'Untitled'],
    ['Input Filename', exp.originalFilename || 'coins.png'],
    ['Image Dimensions', `${exp.metadata?.width || 0} x ${exp.metadata?.height || 0} px`],
    ['Processing Time', `${exp.processingTimeMs || 0} ms`],
    [],
    ['--- PARAMETERS ---'],
    ['Noise Removal Filter', exp.parameters?.blurMethod || 'gaussian'],
    ['Filter Kernel Size', `${exp.parameters?.blurKernel || 5} x ${exp.parameters?.blurKernel || 5}`],
    ['Thresholding Method', exp.parameters?.thresholdMethod || 'otsu'],
    ['Threshold Cutoff Value', exp.parameters?.thresholdValue ?? 127],
    ['Object Polarity', exp.parameters?.polarity || 'bright_on_dark'],
    ['Opening Structuring Element', exp.parameters?.structuringElement || 'ellipse'],
    ['Opening Kernel Size', `${exp.parameters?.openingKernelSize || 3} x ${exp.parameters?.openingKernelSize || 3}`],
    ['Opening Iterations', exp.parameters?.openingIterations || 2],
    ['Distance Transform Metric', 'Euclidean L2'],
    ['Distance Mask Size', exp.parameters?.distMaskSize || 5],
    ['Foreground Threshold Factor (θ)', exp.parameters?.fgThresholdFactor || 0.50],
    ['Background Dilation Iterations', exp.parameters?.bgDilationIterations || 3],
    ['Neighborhood Connectivity', `${exp.parameters?.connectivity || 8}-Connected`],
    ['Minimum Region Area (px)', exp.parameters?.minRegionArea || 50],
    ['Manual Seed Markers Applied', exp.parameters?.usedManualMarkers ? 'YES' : 'NO'],
    ['Manual Ground-Truth Count', exp.parameters?.manualCount ?? 'N/A'],
    [],
    ['--- COUNTING RESULTS & EVALUATION ---'],
    ['Total Detected Coins', exp.results?.automaticCount ?? exp.automaticCount ?? 0],
    ['Total Watershed Catchment Basins', exp.results?.totalWatershedRegions ?? 'N/A'],
    ['Filtered Noise Regions', exp.results?.filteredNoiseRegions ?? 'N/A'],
    ['Manual Reference Count', exp.results?.manualCount ?? 'N/A'],
    ['Count Disparity (Absolute Error)', exp.results?.countError ?? 'N/A'],
    ['Count Agreement Percentage (%)', exp.results?.countAgreementPercent !== null && exp.results?.countAgreementPercent !== undefined ? `${exp.results.countAgreementPercent}%` : 'N/A'],
    ['Accuracy Verdict', `"${(exp.results?.accuracyVerdict || '').replace(/"/g, '""')}"`],
    [],
    ['--- PIXEL-LEVEL GROUND-TRUTH EVALUATION ---'],
    ['Ground-Truth Mask Available', exp.results?.hasGroundTruth ? 'YES' : 'NO'],
    ['Intersection over Union (IoU)', exp.results?.iou !== null && exp.results?.iou !== undefined ? exp.results.iou : 'N/A'],
    ['Dice Similarity Coefficient', exp.results?.dice !== null && exp.results?.dice !== undefined ? exp.results.dice : 'N/A'],
    ['Precision', exp.results?.precision !== null && exp.results?.precision !== undefined ? exp.results.precision : 'N/A'],
    ['Recall', exp.results?.recall !== null && exp.results?.recall !== undefined ? exp.results.recall : 'N/A'],
    ['F1-Score', exp.results?.f1Score !== null && exp.results?.f1Score !== undefined ? exp.results.f1Score : 'N/A'],
    [],
    ['--- INDIVIDUAL DETECTED COINS BREAKDOWN ---'],
    ['Coin ID', 'Label', 'Area (px)', 'Perimeter (px)', 'Centroid X', 'Centroid Y', 'BBox X', 'BBox Y', 'BBox W', 'BBox H'],
  ];

  if (Array.isArray(exp.components)) {
    exp.components.forEach((c) => {
      rows.push([
        c.id,
        c.label,
        c.area,
        c.perimeter,
        c.centroid?.[0] ?? '',
        c.centroid?.[1] ?? '',
        c.bbox?.[0] ?? '',
        c.bbox?.[1] ?? '',
        c.bbox?.[2] ?? '',
        c.bbox?.[3] ?? '',
      ]);
    });
  }

  rows.push([]);
  rows.push(['--- SCIENTIFIC OBSERVATIONS ---']);
  rows.push(['User Observations', `"${(exp.userObservations || 'None recorded').replace(/"/g, '""')}"`]);

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${(exp.name || 'watershed_experiment').replace(/\s+/g, '_')}_metrics.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export Watershed experiment as formatted JSON
 */
export const exportWatershedJSON = (exp) => {
  if (!exp) return;

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exp, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `${(exp.name || 'watershed_experiment').replace(/\s+/g, '_')}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate academic PDF report for Watershed Experiment
 */
export const generateWatershedPDFReport = async (exp) => {
  if (!exp) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header Banner
  doc.setFillColor(10, 15, 29); // Dark navy
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(6, 182, 212); // Cyan accent
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PIXELLAB – DIGITAL IMAGE PROCESSING STUDIO', 14, 12);

  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.text('Academic Experiment Report • Module 03: Marker-Controlled Watershed Segmentation', 14, 18);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 23);

  y = 36;

  // Experiment Summary Title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`Experiment: ${exp.name || 'Touching Coins Watershed Segmentation'}`, 14, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Input Target: ${exp.originalFilename || 'coins.png'}`, 14, y);
  doc.text(`Dimensions: ${exp.metadata?.width || 0} × ${exp.metadata?.height || 0} px`, 80, y);
  doc.text(`Execution Time: ${exp.processingTimeMs || 0} ms`, 140, y);
  y += 10;

  // Parameters Table Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Applied Algorithmic & Watershed Parameters', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Filter: ${exp.parameters?.blurMethod?.toUpperCase() || 'GAUSSIAN'} (${exp.parameters?.blurKernel || 5}×${exp.parameters?.blurKernel || 5})`, 18, y + 12);
  doc.text(`Threshold: ${exp.parameters?.thresholdMethod?.toUpperCase() || 'OTSU'} (Cutoff: ${exp.parameters?.thresholdValue ?? 127})`, 85, y + 12);
  doc.text(`Opening SE: ${exp.parameters?.structuringElement?.toUpperCase() || 'ELLIPSE'} (${exp.parameters?.openingKernelSize || 3}×${exp.parameters?.openingKernelSize || 3})`, 140, y + 12);

  doc.text(`FG Factor (θ): ${exp.parameters?.fgThresholdFactor ?? 0.50}`, 18, y + 19);
  doc.text(`BG Dilation: ${exp.parameters?.bgDilationIterations ?? 3} iters`, 85, y + 19);
  doc.text(`Connectivity: ${exp.parameters?.connectivity ?? 8}-Conn | Min Area: ${exp.parameters?.minRegionArea ?? 50}px`, 140, y + 19);
  y += 34;

  // Counting & Segmentation Results Card
  doc.setFillColor(240, 253, 250); // Mint / Cyan
  doc.setDrawColor(153, 246, 228);
  doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 148, 136);
  doc.text('Coin Counting & Segmentation Accuracy Metrics', 18, y + 6);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const autoCount = exp.results?.automaticCount ?? exp.automaticCount ?? 0;
  doc.text(`Total Detected Coins: ${autoCount}`, 18, y + 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Total Basins: ${exp.results?.totalWatershedRegions ?? autoCount}  •  Noise Filtered: ${exp.results?.filteredNoiseRegions ?? 0}`, 18, y + 21);

  if (exp.results?.hasManualReference) {
    const agr = exp.results?.countAgreementPercent ?? 100;
    doc.setTextColor(16, 185, 129);
    doc.text(`Manual Ref: ${exp.results.manualCount} coins  |  Count Agreement: ${agr}%`, 110, y + 14);
  }

  if (exp.results?.hasGroundTruth) {
    doc.setTextColor(3, 105, 161);
    doc.text(`IoU: ${exp.results.iou}  |  Dice: ${exp.results.dice}  |  F1: ${exp.results.f1Score}`, 110, y + 21);
  }
  y += 34;

  // Visual Inspection Panels (Original, Distance Heatmap, Final Segmented)
  if (exp.images && exp.images.original && exp.images.boundary_overlay) {
    try {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Visual Pipeline Inspection (Original vs. Distance Heatmap vs. Segmented Boundaries)', 14, y);
      y += 4;

      const imgWidth = 55;
      const imgHeight = 42;

      doc.addImage(exp.images.original, 'PNG', 14, y, imgWidth, imgHeight);
      if (exp.images.distance_heatmap) {
        doc.addImage(exp.images.distance_heatmap, 'PNG', 75, y, imgWidth, imgHeight);
      }
      doc.addImage(exp.images.boundary_overlay, 'PNG', 136, y, imgWidth, imgHeight);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Figure 1A: Input Target', 14, y + imgHeight + 4);
      doc.text('Figure 1B: Distance Transform Heatmap', 75, y + imgHeight + 4);
      doc.text('Figure 1C: Watershed Boundary Overlay', 136, y + imgHeight + 4);

      y += imgHeight + 10;
    } catch (imgErr) {
      console.warn('Could not embed images in watershed PDF:', imgErr.message);
    }
  }

  // Component Summary
  if (y > 215) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Segmented Coin Components Breakdown', 14, y);
  y += 6;

  if (Array.isArray(exp.components) && exp.components.length > 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const summary = exp.components.slice(0, 14).map((c) => `#${c.id}: Area=${c.area}px Perim=${c.perimeter}px (${c.centroid[0]}, ${c.centroid[1]})`).join('  •  ');
    const splitSummary = doc.splitTextToSize(summary, pageWidth - 28);
    doc.text(splitSummary, 14, y);
    y += splitSummary.length * 4 + 4;
  }

  if (exp.userObservations) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Scientific Observations & Analysis:', 14, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const splitNotes = doc.splitTextToSize(exp.userObservations, pageWidth - 28);
    doc.text(splitNotes, 14, y);
    y += splitNotes.length * 4.5 + 4;
  }

  // Educational Conclusion
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Algorithmic Analysis & Discussion:', 14, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const analysisText =
    'Marker-controlled watershed segmentation resolves topological bottlenecks between contiguous or partially overlapping circular coins. By formulating the Euclidean distance transform as an elevation landscape, local maxima serve as seed markers for flooding, constructing barrier dam boundaries where rising catchment basins meet.';
  const splitAnalysis = doc.splitTextToSize(analysisText, pageWidth - 28);
  doc.text(splitAnalysis, 14, y);

  // Footer on all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`PixelLab CV Studio • Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
  }

  doc.save(`${(exp.name || 'Watershed_Experiment').replace(/\s+/g, '_')}_Report.pdf`);
};

/**
 * Export Classification experiment data as structured CSV
 */
export const exportClassificationCSV = (exp) => {
  if (!exp) return;

  const rows = [
    ['PixelLab Digital Image Processing Studio - Module 04: Object Classification Record'],
    ['Generated', new Date().toISOString()],
    ['Experiment Name', exp.name || 'Untitled'],
    ['Input Filename', exp.originalFilename || 'shapes.png'],
    ['Image Dimensions', `${exp.metadata?.width || 0} x ${exp.metadata?.height || 0} px`],
    ['Processing Time', `${exp.processingTimeMs || 0} ms`],
    [],
    ['--- MODEL & PARAMETERS ---'],
    ['Classification Model', exp.parameters?.modelInfo?.algorithm || 'K-Nearest Neighbors (KNN)'],
    ['K Neighbors', exp.parameters?.kNeighbors || 3],
    ['Features Used', (exp.parameters?.featuresUsed || []).join('; ')],
    ['Threshold Method', exp.parameters?.thresholdMethod || 'otsu'],
    ['Threshold Cutoff Value', exp.parameters?.thresholdValue ?? 127],
    ['Min Object Area (px)', exp.parameters?.minObjectArea || 80],
    [],
    ['--- CLASSIFICATION TALLY ---'],
    ['Total Detected Objects', exp.results?.totalDetectedObjects ?? exp.objects?.length ?? 0],
  ];

  if (exp.results?.categoryCounts) {
    Object.entries(exp.results.categoryCounts).forEach(([cat, count]) => {
      rows.push([`Category: ${cat.toUpperCase()}`, count]);
    });
  }

  rows.push([]);
  rows.push([
    '--- EXTRACTED GEOMETRICAL DESCRIPTORS (ACADEMIC SPECS) ---',
  ]);
  rows.push([
    'Object ID',
    'Predicted Class',
    'Confidence (%)',
    'Area (px)',
    'Perimeter (px)',
    'Compactness [P^2/(4*pi*A)]',
    'Circularity [4*pi*A/P^2]',
    'Rectangularity [A/minAreaRect]',
    'Aspect Ratio',
    'Vertices',
    'Extent',
    'Solidity',
    'Centroid X',
    'Centroid Y',
  ]);

  if (Array.isArray(exp.objects)) {
    exp.objects.forEach((o) => {
      rows.push([
        o.id,
        o.predictedClass,
        Math.round((o.confidence || 0) * 100),
        o.area,
        o.perimeter,
        o.compactness,
        o.circularity,
        o.rectangularity,
        o.aspectRatio,
        o.vertices,
        o.extent,
        o.solidity,
        o.centroid?.[0] ?? '',
        o.centroid?.[1] ?? '',
      ]);
    });
  }

  rows.push([]);
  rows.push(['--- SCIENTIFIC OBSERVATIONS ---']);
  rows.push(['User Observations', `"${(exp.userObservations || 'None recorded').replace(/"/g, '""')}"`]);

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${(exp.name || 'classification_experiment').replace(/\s+/g, '_')}_descriptors.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export Classification experiment as formatted JSON
 */
export const exportClassificationJSON = (exp) => {
  if (!exp) return;

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exp, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `${(exp.name || 'classification_experiment').replace(/\s+/g, '_')}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate academic PDF report for Classification Experiment
 */
export const generateClassificationPDFReport = async (exp) => {
  if (!exp) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header Banner
  doc.setFillColor(10, 15, 29); // Dark navy
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(6, 182, 212); // Cyan accent
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PIXELLAB – DIGITAL IMAGE PROCESSING STUDIO', 14, 12);

  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.text('Academic Experiment Report • Module 04: Geometrical Object Classification', 14, 18);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 23);

  y = 36;

  // Title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`Experiment: ${exp.name || 'Geometrical Object Classification'}`, 14, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Input Target: ${exp.originalFilename || 'shapes.png'}`, 14, y);
  doc.text(`Dimensions: ${exp.metadata?.width || 0} × ${exp.metadata?.height || 0} px`, 80, y);
  doc.text(`Execution Time: ${exp.processingTimeMs || 0} ms`, 140, y);
  y += 10;

  // Parameters Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Algorithm & Classifier Parameters', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Classifier: K-Nearest Neighbors (k = ${exp.parameters?.kNeighbors || 3}) with StandardScaler`, 18, y + 12);
  doc.text(`Threshold: ${exp.parameters?.thresholdMethod?.toUpperCase() || 'OTSU'} (Cutoff: ${exp.parameters?.thresholdValue ?? 127})`, 18, y + 18);
  doc.text(`Min Area: ${exp.parameters?.minObjectArea || 80} px  |  Morphology: ${exp.parameters?.morphOperation?.toUpperCase() || 'NONE'}`, 110, y + 18);
  y += 32;

  // Results Box
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(153, 246, 228);
  doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 148, 136);
  doc.text('Classification & Detection Summary', 18, y + 6);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const totalObjs = exp.results?.totalDetectedObjects ?? exp.objects?.length ?? 0;
  doc.text(`Total Detected Objects: ${totalObjs}`, 18, y + 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const countsStr = Object.entries(exp.results?.categoryCounts || {})
    .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
    .join('  •  ');
  doc.text(`Category Breakdown: ${countsStr || 'None'}`, 18, y + 20);
  y += 32;

  // Visual Inspection Panels (Original vs. Annotated)
  if (exp.images && exp.images.original && exp.images.annotated) {
    try {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Visual Inspection (Input Image vs. Classified & Annotated Bounding Boxes)', 14, y);
      y += 4;

      const imgWidth = 85;
      const imgHeight = 58;

      doc.addImage(exp.images.original, 'PNG', 14, y, imgWidth, imgHeight);
      doc.addImage(exp.images.annotated, 'PNG', 110, y, imgWidth, imgHeight);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Figure 1A: Input Target Image', 14, y + imgHeight + 4);
      doc.text('Figure 1B: Segmented & Classified Objects with Predictions', 110, y + imgHeight + 4);

      y += imgHeight + 10;
    } catch (imgErr) {
      console.warn('Could not embed images in classification PDF:', imgErr.message);
    }
  }

  // Descriptors Table Summary
  if (y > 215) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Detected Geometrical Descriptors Summary (Top Objects)', 14, y);
  y += 6;

  if (Array.isArray(exp.objects) && exp.objects.length > 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const summary = exp.objects
      .slice(0, 10)
      .map((o) => `#${o.id} ${o.predictedClass}: Circ=${o.circularity} Comp=${o.compactness} Rect=${o.rectangularity} AR=${o.aspectRatio}`)
      .join('  •  ');
    const splitSummary = doc.splitTextToSize(summary, pageWidth - 28);
    doc.text(splitSummary, 14, y);
    y += splitSummary.length * 4 + 4;
  }

  if (exp.userObservations) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Scientific Observations & Analysis:', 14, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const splitNotes = doc.splitTextToSize(exp.userObservations, pageWidth - 28);
    doc.text(splitNotes, 14, y);
    y += splitNotes.length * 4.5 + 4;
  }

  // Educational Formulation Box
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Academic Mathematical Invariants Formulations:', 14, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const mathText =
    'Geometrical descriptors measure morphology invariant to scale, translation, and rotation: Compactness = P^2 / (4*pi*A) (Circle ~ 1, others > 1), Circularity = (4*pi*A) / P^2 (Circle ~ 1, non-circular < 1), and Rectangularity = Area / minAreaRect (Square/Rectangle ~ 1, Circle ~ pi/4 = 0.785, Triangle ~ 0.50). Feature vectors are normalized via StandardScaler before KNN classification.';
  const splitMath = doc.splitTextToSize(mathText, pageWidth - 28);
  doc.text(splitMath, 14, y);

  // Footer on all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`PixelLab CV Studio • Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
  }

  doc.save(`${(exp.name || 'Classification_Experiment').replace(/\s+/g, '_')}_Report.pdf`);
};




