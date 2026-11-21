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

