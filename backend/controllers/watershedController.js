import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import WatershedExperiment from '../models/WatershedExperiment.js';
import { getDBStatus } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const SAMPLES_DIR = path.join(__dirname, '..', 'samples', 'watershed');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory fallback if MongoDB is offline
const inMemoryWatershedExperiments = [];

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'];
  if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(jpg|jpeg|png|webp|tif|tiff)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only JPG, JPEG, PNG, and WEBP formats are supported.'), false);
  }
};

const maxUploadMB = parseInt(process.env.MAX_UPLOAD_MB, 10) || 10;
export const upload = multer({
  storage,
  limits: { fileSize: maxUploadMB * 1024 * 1024 },
  fileFilter,
});

// Built-in benchmark coin datasets with documented ground truth counts
const SAMPLES_METADATA = [
  {
    id: 'coins_lightly_touching',
    name: '8 Lightly Touching Coins (Linear & Perpendicular)',
    category: 'Tangent Touch Benchmarks',
    filename: 'coins_lightly_touching.png',
    previewUrl: '/samples/watershed/coins_lightly_touching.png',
    maskUrl: '/samples/watershed/mask_coins_lightly_touching.png',
    manualCount: 8,
    dimensions: '560 × 360 px',
    description: 'Eight circular metallic coins touching tangentially at single contact points. Demonstrates baseline Euclidean distance transform peak extraction.',
    recommendedParams: {
      blurMethod: 'gaussian',
      blurKernel: 5,
      thresholdMethod: 'otsu',
      polarity: 'bright_on_dark',
      structuringElement: 'ellipse',
      openingKernelSize: 3,
      openingIterations: 2,
      distMaskSize: 5,
      fgThresholdFactor: 0.50,
      bgDilationIterations: 3,
      connectivity: 8,
      minRegionArea: 50,
      manualCount: 8,
    },
  },
  {
    id: 'coins_closely_arranged',
    name: '12 Closely Arranged Coins (Dense Grid Cluster)',
    category: 'Dense Contact Benchmarks',
    filename: 'coins_closely_arranged.png',
    previewUrl: '/samples/watershed/coins_closely_arranged.png',
    maskUrl: '/samples/watershed/mask_coins_closely_arranged.png',
    manualCount: 12,
    dimensions: '520 × 420 px',
    description: 'Twelve closely packed circular coins with multiple contiguous neighbors. Tests multi-basin topological dam construction and prevents cluster over-merging.',
    recommendedParams: {
      blurMethod: 'gaussian',
      blurKernel: 5,
      thresholdMethod: 'otsu',
      polarity: 'bright_on_dark',
      structuringElement: 'ellipse',
      openingKernelSize: 3,
      openingIterations: 2,
      distMaskSize: 5,
      fgThresholdFactor: 0.50,
      bgDilationIterations: 3,
      connectivity: 8,
      minRegionArea: 50,
      manualCount: 12,
    },
  },
  {
    id: 'coins_slightly_overlapping',
    name: '10 Partially Overlapping Coins (Physical Overlap)',
    category: 'Overlapping Coins Benchmarks',
    filename: 'coins_slightly_overlapping.png',
    previewUrl: '/samples/watershed/coins_slightly_overlapping.png',
    maskUrl: '/samples/watershed/mask_coins_slightly_overlapping.png',
    manualCount: 10,
    dimensions: '540 × 380 px',
    description: 'Ten coins with physical overlap (6–8 px overlap) where pure erosion fails by over-shrinking. Evaluates distance transform saddle peak thresholding at factor 0.65.',
    recommendedParams: {
      blurMethod: 'gaussian',
      blurKernel: 5,
      thresholdMethod: 'otsu',
      polarity: 'bright_on_dark',
      structuringElement: 'ellipse',
      openingKernelSize: 3,
      openingIterations: 2,
      distMaskSize: 5,
      fgThresholdFactor: 0.65,
      bgDilationIterations: 3,
      connectivity: 8,
      minRegionArea: 50,
      manualCount: 10,
    },
  },
];

/**
 * Controller: Get built-in benchmark samples
 */
export const getSamples = (req, res) => {
  res.json({
    status: 'success',
    samples: SAMPLES_METADATA,
  });
};

/**
 * Controller: Execute Watershed Segmentation pipeline via Python OpenCV microservice
 */
export const processWatershed = async (req, res) => {
  const opencvUrl = process.env.OPENCV_SERVICE_URL || 'http://127.0.0.1:8000';

  try {
    let imageBuffer = null;
    let imageName = 'coins_target.png';
    let gtMaskBuffer = null;
    let gtMaskName = null;

    // 1. Resolve uploaded or sample image
    if (req.files && req.files.image && req.files.image.length > 0) {
      imageBuffer = req.files.image[0].buffer;
      imageName = req.files.image[0].originalname;
    } else if (req.body.sampleId) {
      const sampleMeta = SAMPLES_METADATA.find((s) => s.id === req.body.sampleId);
      const filename = sampleMeta ? sampleMeta.filename : `${req.body.sampleId}.png`;
      const samplePath = path.join(SAMPLES_DIR, filename);

      if (fs.existsSync(samplePath)) {
        imageBuffer = fs.readFileSync(samplePath);
        imageName = filename;

        // Load ground truth reference mask if available
        if (sampleMeta && sampleMeta.maskUrl) {
          const maskFilename = path.basename(sampleMeta.maskUrl);
          const maskPath = path.join(SAMPLES_DIR, maskFilename);
          if (fs.existsSync(maskPath)) {
            gtMaskBuffer = fs.readFileSync(maskPath);
            gtMaskName = maskFilename;
          }
        }
      } else {
        return res.status(404).json({
          error: 'Sample image not found',
          message: `Sample image file ${filename} does not exist in sample repository.`,
        });
      }
    }

    if (!imageBuffer) {
      return res.status(400).json({
        error: 'Missing input image',
        message: 'Please upload an image file or specify a valid sampleId.',
      });
    }

    // Check custom ground-truth mask upload
    if (req.files && req.files.ground_truth_mask && req.files.ground_truth_mask.length > 0) {
      gtMaskBuffer = req.files.ground_truth_mask[0].buffer;
      gtMaskName = req.files.ground_truth_mask[0].originalname;
    }

    // 2. Extract and validate parameters
    const blurMethod = req.body.blurMethod || req.body.blur_method || 'gaussian';
    const blurKernel = parseInt(req.body.blurKernel || req.body.blur_kernel || 5, 10);
    const thresholdMethod = req.body.thresholdMethod || req.body.threshold_method || 'otsu';
    const thresholdValue = parseInt(req.body.thresholdValue || req.body.threshold_value || 127, 10);
    const polarity = req.body.polarity || 'bright_on_dark';
    const structuringElement = req.body.structuringElement || req.body.structuring_element || 'ellipse';
    const openingKernelSize = parseInt(req.body.openingKernelSize || req.body.opening_kernel_size || 3, 10);
    const openingIterations = parseInt(req.body.openingIterations || req.body.opening_iterations || 2, 10);
    const distMaskSize = parseInt(req.body.distMaskSize || req.body.dist_mask_size || 5, 10);
    const fgThresholdFactor = parseFloat(req.body.fgThresholdFactor || req.body.fg_threshold_factor || 0.50);
    const bgDilationIterations = parseInt(req.body.bgDilationIterations || req.body.bg_dilation_iterations || 3, 10);
    const connectivity = parseInt(req.body.connectivity || 8, 10);
    const minRegionArea = parseInt(req.body.minRegionArea || req.body.min_region_area || 50, 10);
    const manualCount = req.body.manualCount || req.body.manual_count ? parseInt(req.body.manualCount || req.body.manual_count, 10) : null;
    const manualMarkers = req.body.manualMarkers || req.body.manual_markers || null;
    const experimentName = req.body.experimentName || req.body.name || `Watershed-${Date.now()}`;
    const userObservations = req.body.userObservations || req.body.observations || '';

    // 3. Construct multipart form data for Python FastAPI microservice
    const form = new FormData();
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
    form.append('image', imageBlob, imageName);

    if (gtMaskBuffer) {
      const maskBlob = new Blob([gtMaskBuffer], { type: 'image/png' });
      form.append('ground_truth_mask', maskBlob, gtMaskName || 'gt_mask.png');
    }

    form.append('blur_method', blurMethod);
    form.append('blur_kernel', String(blurKernel));
    form.append('threshold_method', thresholdMethod);
    form.append('threshold_value', String(thresholdValue));
    form.append('polarity', polarity);
    form.append('structuring_element', structuringElement);
    form.append('opening_kernel_size', String(openingKernelSize));
    form.append('opening_iterations', String(openingIterations));
    form.append('dist_mask_size', String(distMaskSize));
    form.append('fg_threshold_factor', String(fgThresholdFactor));
    form.append('bg_dilation_iterations', String(bgDilationIterations));
    form.append('connectivity', String(connectivity));
    form.append('min_region_area', String(minRegionArea));

    if (manualCount !== null && !isNaN(manualCount)) {
      form.append('manual_count', String(manualCount));
    }
    if (manualMarkers) {
      form.append('manual_markers', typeof manualMarkers === 'string' ? manualMarkers : JSON.stringify(manualMarkers));
    }

    // 4. Request Python microservice
    const pythonEndpoint = `${opencvUrl}/process/watershed`;
    const pythonResponse = await fetch(pythonEndpoint, {
      method: 'POST',
      body: form,
    });

    if (!pythonResponse.ok) {
      const errData = await pythonResponse.json().catch(() => ({}));
      const errMsg = errData.detail || `OpenCV watershed service failed with status ${pythonResponse.status}`;
      return res.status(pythonResponse.status).json({
        error: 'Python OpenCV Service Error',
        message: errMsg,
      });
    }

    const pyResult = await pythonResponse.json();

    // 5. Save generated images to disk in backend/uploads
    const timestamp = Date.now();
    const safeBaseName = imageName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const originalFileRel = `orig_ws_${timestamp}_${safeBaseName}`;
    const segmentedFileRel = `segmented_ws_${timestamp}.png`;
    const boundaryFileRel = `boundary_ws_${timestamp}.png`;
    const markerFileRel = `marker_ws_${timestamp}.png`;
    const distanceFileRel = `dist_ws_${timestamp}.png`;

    const originalDiskPath = path.join(UPLOADS_DIR, originalFileRel);
    const segmentedDiskPath = path.join(UPLOADS_DIR, segmentedFileRel);
    const boundaryDiskPath = path.join(UPLOADS_DIR, boundaryFileRel);
    const markerDiskPath = path.join(UPLOADS_DIR, markerFileRel);
    const distanceDiskPath = path.join(UPLOADS_DIR, distanceFileRel);

    fs.writeFileSync(originalDiskPath, imageBuffer);

    if (pyResult.images?.segmented) {
      const base64 = pyResult.images.segmented.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(segmentedDiskPath, Buffer.from(base64, 'base64'));
    }
    if (pyResult.images?.boundary_overlay) {
      const base64 = pyResult.images.boundary_overlay.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(boundaryDiskPath, Buffer.from(base64, 'base64'));
    }
    if (pyResult.images?.markers_vis) {
      const base64 = pyResult.images.markers_vis.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(markerDiskPath, Buffer.from(base64, 'base64'));
    }
    if (pyResult.images?.distance_heatmap) {
      const base64 = pyResult.images.distance_heatmap.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(distanceDiskPath, Buffer.from(base64, 'base64'));
    }

    // 6. Persist experiment document to MongoDB or in-memory cache
    const experimentDoc = {
      name: experimentName,
      module: 'watershed',
      originalFilename: imageName,
      originalImagePath: `/uploads/${originalFileRel}`,
      segmentedImagePath: `/uploads/${segmentedFileRel}`,
      boundaryOverlayPath: `/uploads/${boundaryFileRel}`,
      markerVisualizationPath: `/uploads/${markerFileRel}`,
      distanceHeatmapPath: `/uploads/${distanceFileRel}`,
      parameters: {
        blurMethod,
        blurKernel,
        thresholdMethod,
        thresholdValue,
        polarity,
        structuringElement,
        openingKernelSize,
        openingIterations,
        distMaskSize,
        fgThresholdFactor,
        bgDilationIterations,
        connectivity,
        minRegionArea,
        manualCount,
        usedManualMarkers: pyResult.evaluation?.used_manual_markers ?? false,
      },
      results: {
        automaticCount: pyResult.automatic_count,
        totalWatershedRegions: pyResult.evaluation?.total_watershed_regions ?? 0,
        filteredNoiseRegions: pyResult.evaluation?.filtered_noise_regions ?? 0,
        manualCount: pyResult.evaluation?.manual_count ?? null,
        countError: pyResult.evaluation?.absolute_count_error ?? null,
        countAgreementPercent: pyResult.evaluation?.count_agreement_percent ?? null,
        hasManualReference: pyResult.evaluation?.has_manual_reference ?? false,
        accuracyVerdict: pyResult.evaluation?.accuracy_verdict ?? '',
        iou: pyResult.evaluation?.iou ?? null,
        dice: pyResult.evaluation?.dice ?? null,
        precision: pyResult.evaluation?.precision ?? null,
        recall: pyResult.evaluation?.recall ?? null,
        f1Score: pyResult.evaluation?.f1_score ?? null,
        hasGroundTruth: pyResult.evaluation?.has_ground_truth ?? false,
      },
      metadata: pyResult.metadata,
      components: pyResult.components || [],
      processingTimeMs: pyResult.processing_time_ms,
      userObservations,
    };

    let savedId = `ws_mem_${timestamp}`;
    const dbStatus = getDBStatus();

    if (dbStatus.isConnected) {
      try {
        const created = await WatershedExperiment.create(experimentDoc);
        savedId = created._id.toString();
        experimentDoc._id = savedId;
        experimentDoc.createdAt = created.createdAt;
      } catch (dbErr) {
        console.warn('MongoDB save warning, falling back to memory:', dbErr.message);
        experimentDoc._id = savedId;
        experimentDoc.createdAt = new Date().toISOString();
        inMemoryWatershedExperiments.unshift(experimentDoc);
      }
    } else {
      experimentDoc._id = savedId;
      experimentDoc.createdAt = new Date().toISOString();
      inMemoryWatershedExperiments.unshift(experimentDoc);
      if (inMemoryWatershedExperiments.length > 50) {
        inMemoryWatershedExperiments.pop();
      }
    }

    // 7. Return comprehensive response to frontend
    res.json({
      status: 'success',
      id: savedId,
      experiment: experimentDoc,
      automaticCount: pyResult.automatic_count,
      components: pyResult.components,
      evaluation: pyResult.evaluation,
      parameters: pyResult.parameters,
      metadata: pyResult.metadata,
      images: pyResult.images,
      processingTimeMs: pyResult.processing_time_ms,
    });
  } catch (error) {
    console.error('Watershed pipeline controller error:', error);
    res.status(500).json({
      error: 'Watershed Pipeline Execution Error',
      message: error.message || 'An unexpected error occurred during watershed segmentation.',
    });
  }
};

/**
 * Controller: Get experiment history
 */
export const getHistory = async (req, res) => {
  const dbStatus = getDBStatus();

  try {
    if (dbStatus.isConnected) {
      const records = await WatershedExperiment.find()
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();
      return res.json({ status: 'success', source: 'mongodb', history: records });
    }
  } catch (err) {
    console.warn('Failed to query MongoDB watershed history, falling back to in-memory:', err.message);
  }

  res.json({
    status: 'success',
    source: 'in-memory',
    history: inMemoryWatershedExperiments.slice(0, 30),
  });
};

/**
 * Controller: Get single experiment by ID
 */
export const getHistoryById = async (req, res) => {
  const { id } = req.params;
  const dbStatus = getDBStatus();

  try {
    if (dbStatus.isConnected && !id.startsWith('ws_mem_')) {
      const exp = await WatershedExperiment.findById(id).lean();
      if (exp) {
        return res.json({ status: 'success', experiment: exp });
      }
    }
  } catch (err) {
    console.warn('MongoDB query by ID failed:', err.message);
  }

  const memExp = inMemoryWatershedExperiments.find((e) => e._id === id);
  if (memExp) {
    return res.json({ status: 'success', experiment: memExp });
  }

  res.status(404).json({ error: 'Not Found', message: `Watershed experiment with ID ${id} not found.` });
};

/**
 * Controller: Delete experiment by ID
 */
export const deleteHistory = async (req, res) => {
  const { id } = req.params;
  const dbStatus = getDBStatus();

  try {
    if (dbStatus.isConnected && !id.startsWith('ws_mem_')) {
      await WatershedExperiment.findByIdAndDelete(id);
    }
  } catch (err) {
    console.warn('MongoDB delete failed:', err.message);
  }

  const idx = inMemoryWatershedExperiments.findIndex((e) => e._id === id);
  if (idx !== -1) {
    inMemoryWatershedExperiments.splice(idx, 1);
  }

  res.json({ status: 'success', message: `Experiment ${id} deleted successfully.` });
};

