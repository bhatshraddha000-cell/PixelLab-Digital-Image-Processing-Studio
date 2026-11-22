import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import MorphologyExperiment from '../models/MorphologyExperiment.js';
import { getDBStatus } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const SAMPLES_DIR = path.join(__dirname, '..', 'samples');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory fallback if MongoDB is offline
const inMemoryMorphologyExperiments = [];

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'];
  if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(jpg|jpeg|png|webp|tif|tiff)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WEBP formats are supported.'), false);
  }
};

const maxUploadMB = parseInt(process.env.MAX_UPLOAD_MB, 10) || 10;
export const upload = multer({
  storage,
  limits: { fileSize: maxUploadMB * 1024 * 1024 },
  fileFilter,
});

// Built-in benchmark coin datasets
const SAMPLES_METADATA = [
  {
    id: 'coins_touching_8',
    name: '8 Lightly Touching Coins (Linear Chain)',
    category: 'Tangent Touch Benchmarks',
    filename: 'coins_touching_8.png',
    previewUrl: '/samples/coins_touching_8.png',
    manualCount: 8,
    dimensions: '560 × 320 px',
    description: '8 circular metallic coins touching at single tangential neck contacts. Demonstrates bridge severance from 1 fused component into 8 distinct objects.',
    recommendedParams: {
      thresholdMethod: 'otsu',
      structuringElement: 'ellipse',
      kernelWidth: 3,
      kernelHeight: 3,
      erosionIterations: 3,
      dilationIterations: 1,
      operationMode: 'custom',
      minComponentArea: 50,
      manualCount: 8,
    },
  },
  {
    id: 'coins_touching_12',
    name: '12 Touching Coins (Dual Staggered Rows)',
    category: 'Multi-Object Touching Grid',
    filename: 'coins_touching_12.png',
    previewUrl: '/samples/coins_touching_12.png',
    manualCount: 12,
    dimensions: '520 × 360 px',
    description: '12 coins arranged in two staggered rows of 6 with tangential touching points. Demonstrates robust multi-cluster morphological object separation.',
    recommendedParams: {
      thresholdMethod: 'otsu',
      structuringElement: 'ellipse',
      kernelWidth: 3,
      kernelHeight: 3,
      erosionIterations: 3,
      dilationIterations: 1,
      operationMode: 'custom',
      minComponentArea: 50,
      manualCount: 12,
    },
  },
  {
    id: 'coins_standard_24',
    name: '24 Photographic Coins (scikit-image Classic)',
    category: 'Real Photographic Coins',
    filename: 'coins_standard_24.png',
    previewUrl: '/samples/coins_standard_24.png',
    manualCount: 24,
    dimensions: '384 × 303 px',
    description: 'Standard classic computer vision coins dataset from scikit-image. Real photographic coins with surface relief textures, shadows, and varying reflectance.',
    recommendedParams: {
      thresholdMethod: 'otsu',
      structuringElement: 'ellipse',
      kernelWidth: 3,
      kernelHeight: 3,
      erosionIterations: 1,
      dilationIterations: 1,
      operationMode: 'custom',
      minComponentArea: 100,
      manualCount: 24,
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
 * Controller: Execute Morphological Object Separation & Counting pipeline
 */
export const processMorphology = async (req, res) => {
  const opencvUrl = process.env.OPENCV_SERVICE_URL || 'http://127.0.0.1:8000';

  try {
    let imageBuffer = null;
    let imageName = 'coins_input.png';

    // 1. Check if file was uploaded or sample was selected
    if (req.file) {
      imageBuffer = req.file.buffer;
      imageName = req.file.originalname;
    } else if (req.body.sampleId) {
      const sampleMeta = SAMPLES_METADATA.find((s) => s.id === req.body.sampleId);
      const filename = sampleMeta ? sampleMeta.filename : `${req.body.sampleId}.png`;
      const samplePath = path.join(SAMPLES_DIR, filename);

      if (fs.existsSync(samplePath)) {
        imageBuffer = fs.readFileSync(samplePath);
        imageName = filename;
      } else {
        return res.status(404).json({
          error: 'Sample image not found',
          message: `Sample image file ${filename} does not exist on disk.`,
        });
      }
    }

    if (!imageBuffer) {
      return res.status(400).json({
        error: 'Missing input image',
        message: 'Please upload an image file or specify a valid sampleId.',
      });
    }

    // 2. Prepare parameters
    const thresholdMethod = req.body.thresholdMethod || req.body.threshold_method || 'otsu';
    const thresholdValue = parseInt(req.body.thresholdValue || req.body.threshold_value || 127, 10);
    const polarity = req.body.polarity || 'bright_on_dark';
    const structuringElement = req.body.structuringElement || req.body.structuring_element || 'ellipse';
    const kernelWidth = parseInt(req.body.kernelWidth || req.body.kernel_width || 3, 10);
    const kernelHeight = parseInt(req.body.kernelHeight || req.body.kernel_height || 3, 10);
    const erosionIterations = parseInt(req.body.erosionIterations || req.body.erosion_iterations || 2, 10);
    const dilationIterations = parseInt(req.body.dilationIterations || req.body.dilation_iterations || 1, 10);
    const operationMode = req.body.operationMode || req.body.operation_mode || 'custom';
    const connectivity = parseInt(req.body.connectivity || 8, 10);
    const minComponentArea = parseInt(req.body.minComponentArea || req.body.min_component_area || 50, 10);
    const manualCount = req.body.manualCount || req.body.manual_count ? parseInt(req.body.manualCount || req.body.manual_count, 10) : null;
    const experimentName = req.body.experimentName || req.body.name || `Coins-Morphology-${Date.now()}`;
    const userObservations = req.body.userObservations || req.body.observations || '';

    // 3. Construct multipart form data for Python FastAPI service
    const form = new FormData();
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
    form.append('image', imageBlob, imageName);
    form.append('threshold_method', thresholdMethod);
    form.append('threshold_value', String(thresholdValue));
    form.append('polarity', polarity);
    form.append('structuring_element', structuringElement);
    form.append('kernel_width', String(kernelWidth));
    form.append('kernel_height', String(kernelHeight));
    form.append('erosion_iterations', String(erosionIterations));
    form.append('dilation_iterations', String(dilationIterations));
    form.append('operation_mode', operationMode);
    form.append('connectivity', String(connectivity));
    form.append('min_component_area', String(minComponentArea));
    if (manualCount !== null && !isNaN(manualCount)) {
      form.append('manual_count', String(manualCount));
    }

    // 4. Request Python processing service
    const pythonEndpoint = `${opencvUrl}/process/morphology`;
    const pythonResponse = await fetch(pythonEndpoint, {
      method: 'POST',
      body: form,
    });

    if (!pythonResponse.ok) {
      const errData = await pythonResponse.json().catch(() => ({}));
      const errMsg = errData.detail || `OpenCV morphology service failed with status ${pythonResponse.status}`;
      return res.status(pythonResponse.status).json({
        error: 'Python OpenCV Service Error',
        message: errMsg,
      });
    }

    const pyResult = await pythonResponse.json();

    // 5. Save generated images to disk in backend/uploads
    const timestamp = Date.now();
    const originalFileRel = `orig_morph_${timestamp}_${imageName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const labeledFileRel = `labeled_morph_${timestamp}.png`;
    const binaryFileRel = `binary_morph_${timestamp}.png`;

    const originalDiskPath = path.join(UPLOADS_DIR, originalFileRel);
    const labeledDiskPath = path.join(UPLOADS_DIR, labeledFileRel);
    const binaryDiskPath = path.join(UPLOADS_DIR, binaryFileRel);

    fs.writeFileSync(originalDiskPath, imageBuffer);

    if (pyResult.images && pyResult.images.labeled) {
      const labeledBase64 = pyResult.images.labeled.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(labeledDiskPath, Buffer.from(labeledBase64, 'base64'));
    }

    if (pyResult.images && pyResult.images.binary) {
      const binaryBase64 = pyResult.images.binary.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(binaryDiskPath, Buffer.from(binaryBase64, 'base64'));
    }

    // 6. Persist experiment record in MongoDB or in-memory cache
    const experimentDoc = {
      name: experimentName,
      module: 'morphology',
      originalFilename: imageName,
      originalImagePath: `/uploads/${originalFileRel}`,
      labeledImagePath: `/uploads/${labeledFileRel}`,
      binaryImagePath: `/uploads/${binaryFileRel}`,
      parameters: {
        thresholdMethod,
        thresholdValue,
        polarity,
        structuringElement,
        kernelWidth,
        kernelHeight,
        erosionIterations,
        dilationIterations,
        operationMode,
        connectivity,
        minComponentArea,
        manualCount,
      },
      results: {
        automaticCount: pyResult.automatic_count,
        initialComponentsCount: pyResult.evaluation?.initial_components_before_morphology ?? 1,
        separatedGain: pyResult.evaluation?.separated_gain ?? 0,
        manualCount: pyResult.evaluation?.manual_count ?? null,
        countError: pyResult.evaluation?.absolute_count_error ?? null,
        countAgreementPercent: pyResult.evaluation?.count_agreement_percent ?? null,
        hasManualReference: pyResult.evaluation?.has_manual_reference ?? false,
        accuracyVerdict: pyResult.evaluation?.accuracy_verdict ?? '',
        foregroundPixels: pyResult.evaluation?.foreground_pixels ?? {},
      },
      metadata: pyResult.metadata,
      components: pyResult.components || [],
      processingTimeMs: pyResult.processing_time_ms,
      userObservations,
    };

    let savedId = `mem_${timestamp}`;
    const dbStatus = getDBStatus();

    if (dbStatus.isConnected) {
      try {
        const created = await MorphologyExperiment.create(experimentDoc);
        savedId = created._id.toString();
        experimentDoc._id = savedId;
        experimentDoc.createdAt = created.createdAt;
      } catch (dbErr) {
        console.warn('MongoDB save error, falling back to memory:', dbErr.message);
        experimentDoc._id = savedId;
        experimentDoc.createdAt = new Date().toISOString();
        inMemoryMorphologyExperiments.unshift(experimentDoc);
      }
    } else {
      experimentDoc._id = savedId;
      experimentDoc.createdAt = new Date().toISOString();
      inMemoryMorphologyExperiments.unshift(experimentDoc);
      if (inMemoryMorphologyExperiments.length > 50) {
        inMemoryMorphologyExperiments.pop();
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
    console.error('Morphology pipeline controller error:', error);
    res.status(500).json({
      error: 'Processing Pipeline Execution Error',
      message: error.message || 'An error occurred during morphological object separation.',
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
      const records = await MorphologyExperiment.find()
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();
      return res.json({ status: 'success', source: 'mongodb', history: records });
    }
  } catch (err) {
    console.warn('Failed to query MongoDB history, falling back to in-memory:', err.message);
  }

  res.json({
    status: 'success',
    source: 'in-memory',
    history: inMemoryMorphologyExperiments.slice(0, 30),
  });
};

/**
 * Controller: Get single experiment by ID
 */
export const getHistoryById = async (req, res) => {
  const { id } = req.params;
  const dbStatus = getDBStatus();

  try {
    if (dbStatus.isConnected && !id.startsWith('mem_')) {
      const exp = await MorphologyExperiment.findById(id).lean();
      if (exp) {
        return res.json({ status: 'success', experiment: exp });
      }
    }
  } catch (err) {
    console.warn('MongoDB query by ID failed:', err.message);
  }

  const memExp = inMemoryMorphologyExperiments.find((e) => e._id === id);
  if (memExp) {
    return res.json({ status: 'success', experiment: memExp });
  }

  res.status(404).json({ error: 'Not Found', message: `Experiment with ID ${id} not found.` });
};

/**
 * Controller: Delete experiment by ID
 */
export const deleteHistory = async (req, res) => {
  const { id } = req.params;
  const dbStatus = getDBStatus();

  try {
    if (dbStatus.isConnected && !id.startsWith('mem_')) {
      await MorphologyExperiment.findByIdAndDelete(id);
    }
  } catch (err) {
    console.warn('MongoDB delete failed:', err.message);
  }

  const idx = inMemoryMorphologyExperiments.findIndex((e) => e._id === id);
  if (idx !== -1) {
    inMemoryMorphologyExperiments.splice(idx, 1);
  }

  res.json({ status: 'success', message: `Experiment ${id} deleted successfully.` });
};

