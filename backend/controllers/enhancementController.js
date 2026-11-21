import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import Experiment from '../models/Experiment.js';
import { getDBStatus } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const SAMPLES_DIR = path.join(__dirname, '..', 'samples');

// Ensure storage directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory fallback for experiment history if MongoDB is offline
const inMemoryExperiments = [];

// Multer storage setup for clean file uploads
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

/**
 * Controller: Execute Image Enhancement pipeline via Python OpenCV service
 */
export const processEnhancement = async (req, res) => {
  const opencvUrl = process.env.OPENCV_SERVICE_URL || 'http://127.0.0.1:8000';

  try {
    let imageBuffer = null;
    let imageName = 'input_image.png';
    let refBuffer = null;
    let refName = null;

    // 1. Check if files were uploaded via multipart form
    if (req.files && req.files.image && req.files.image.length > 0) {
      imageBuffer = req.files.image[0].buffer;
      imageName = req.files.image[0].originalname;
    } else if (req.body.sampleId) {
      // Load from local samples directory
      const samplePath = path.join(SAMPLES_DIR, `noisy_${req.body.sampleId}.png`);
      if (fs.existsSync(samplePath)) {
        imageBuffer = fs.readFileSync(samplePath);
        imageName = `noisy_${req.body.sampleId}.png`;

        // Load corresponding clean reference if available
        const refPath = path.join(SAMPLES_DIR, `clean_${req.body.sampleId}.png`);
        if (fs.existsSync(refPath)) {
          refBuffer = fs.readFileSync(refPath);
          refName = `clean_${req.body.sampleId}.png`;
        }
      } else {
        return res.status(404).json({ error: 'Sample image not found', message: `Sample ${req.body.sampleId} does not exist.` });
      }
    }

    // Check custom reference image upload
    if (req.files && req.files.reference_image && req.files.reference_image.length > 0) {
      refBuffer = req.files.reference_image[0].buffer;
      refName = req.files.reference_image[0].originalname;
    }

    if (!imageBuffer) {
      return res.status(400).json({ error: 'No image provided', message: 'Please upload an image file or choose a valid sample.' });
    }

    // 2. Prepare payload for Python FastAPI service using native FormData
    const formData = new FormData();
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('image', imageBlob, imageName);

    if (refBuffer) {
      const refBlob = new Blob([refBuffer], { type: 'image/png' });
      formData.append('reference_image', refBlob, refName || 'reference.png');
    }

    const kernelSize = req.body.kernel_size || req.body.kernelSize || 5;
    const sigma = req.body.sigma !== undefined ? req.body.sigma : 0.0;
    const gamma = req.body.gamma !== undefined ? req.body.gamma : 1.0;
    const sharpening = req.body.sharpening !== undefined ? req.body.sharpening : 0.0;

    formData.append('kernel_size', String(kernelSize));
    formData.append('sigma', String(sigma));
    formData.append('gamma', String(gamma));
    formData.append('sharpening', String(sharpening));

    // 3. Dispatch HTTP request to Python OpenCV service
    let pythonRes;
    try {
      pythonRes = await fetch(`${opencvUrl}/process/enhancement`, {
        method: 'POST',
        body: formData,
      });
    } catch (netErr) {
      return res.status(503).json({
        error: 'OpenCV Service Unavailable',
        message: `Could not connect to Python image processing service at ${opencvUrl}. Please ensure uvicorn is running.`,
      });
    }

    if (!pythonRes.ok) {
      const errData = await pythonRes.json().catch(() => ({}));
      return res.status(pythonRes.status).json({
        error: errData.detail || 'Image processing failed in Python OpenCV service.',
        status: pythonRes.status,
      });
    }

    const result = await pythonRes.json();

    // 4. Save processed output images to disk with unique ID
    const expId = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const originalDiskPath = path.join(UPLOADS_DIR, `${expId}_original.png`);
    const enhancedDiskPath = path.join(UPLOADS_DIR, `${expId}_enhanced.png`);
    let refDiskPath = null;

    // Convert base64 data to disk buffer
    if (result.images && result.images.original) {
      const b64Data = result.images.original.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(originalDiskPath, Buffer.from(b64Data, 'base64'));
    }
    if (result.images && result.images.enhanced) {
      const b64Data = result.images.enhanced.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(enhancedDiskPath, Buffer.from(b64Data, 'base64'));
    }
    if (result.images && result.images.reference) {
      refDiskPath = path.join(UPLOADS_DIR, `${expId}_reference.png`);
      const b64Data = result.images.reference.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(refDiskPath, Buffer.from(b64Data, 'base64'));
    }

    // 5. Save Experiment record in MongoDB or in-memory cache
    const experimentDoc = {
      name: req.body.experimentName || `Enhance-${imageName.slice(0, 15)}-k${kernelSize}-g${gamma}`,
      module: 'enhancement',
      originalFilename: imageName,
      originalImagePath: `/uploads/${path.basename(originalDiskPath)}`,
      enhancedImagePath: `/uploads/${path.basename(enhancedDiskPath)}`,
      referenceImagePath: refDiskPath ? `/uploads/${path.basename(refDiskPath)}` : null,
      parameters: {
        kernelSize: Number(kernelSize),
        sigma: sigma === 'auto' || Number(sigma) === 0 ? 'auto' : Number(sigma),
        gamma: Number(gamma),
        sharpening: Number(sharpening),
      },
      metrics: {
        hasReference: Boolean(result.evaluation?.has_reference),
        mse: Number(result.evaluation?.metrics?.mse || 0),
        psnr: Number(result.evaluation?.metrics?.psnr || 0),
        ssim: Number(result.evaluation?.metrics?.ssim || 0),
        delta: result.evaluation?.delta || null,
        isImproved: result.evaluation?.is_improved ?? null,
        explanation: result.evaluation?.explanation || '',
      },
      metadata: result.metadata,
      histograms: result.histograms,
      processingTimeMs: result.processing_time_ms,
      userObservations: req.body.userObservations || '',
    };

    let savedRecord = null;
    if (getDBStatus() === 'connected') {
      try {
        savedRecord = await Experiment.create(experimentDoc);
      } catch (dbErr) {
        console.warn('MongoDB save warning:', dbErr.message);
      }
    }

    if (!savedRecord) {
      savedRecord = { ...experimentDoc, _id: expId, createdAt: new Date() };
      inMemoryExperiments.unshift(savedRecord);
    }

    return res.status(200).json({
      status: 'success',
      experimentId: savedRecord._id,
      experiment: savedRecord,
      processingTimeMs: result.processing_time_ms,
      metadata: result.metadata,
      parameters: result.parameters,
      images: result.images,
      histograms: result.histograms,
      evaluation: result.evaluation,
    });
  } catch (err) {
    console.error('Enhancement processing error:', err);
    return res.status(500).json({
      error: 'Internal Processing Error',
      message: err.message,
    });
  }
};

/**
 * Controller: Retrieve experiment history
 */
export const getHistory = async (req, res) => {
  try {
    if (getDBStatus() === 'connected') {
      const history = await Experiment.find({ module: 'enhancement' }).sort({ createdAt: -1 }).limit(50);
      return res.status(200).json({ status: 'success', count: history.length, history });
    }
    return res.status(200).json({ status: 'success', count: inMemoryExperiments.length, history: inMemoryExperiments });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve history', message: err.message });
  }
};

/**
 * Controller: Retrieve single experiment by ID
 */
export const getHistoryById = async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus() === 'connected') {
      const exp = await Experiment.findById(id);
      if (!exp) return res.status(404).json({ error: 'Not found', message: 'Experiment does not exist.' });
      return res.status(200).json({ status: 'success', experiment: exp });
    }
    const memExp = inMemoryExperiments.find((e) => String(e._id) === String(id));
    if (!memExp) return res.status(404).json({ error: 'Not found', message: 'Experiment does not exist.' });
    return res.status(200).json({ status: 'success', experiment: memExp });
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching experiment', message: err.message });
  }
};

/**
 * Controller: Delete experiment and unlink stored files
 */
export const deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;
    let expToDelete = null;

    if (getDBStatus() === 'connected') {
      expToDelete = await Experiment.findByIdAndDelete(id);
    } else {
      const idx = inMemoryExperiments.findIndex((e) => String(e._id) === String(id));
      if (idx !== -1) {
        expToDelete = inMemoryExperiments.splice(idx, 1)[0];
      }
    }

    if (!expToDelete) {
      return res.status(404).json({ error: 'Not found', message: 'Experiment not found.' });
    }

    // Safely delete associated disk files
    const filesToUnlink = [
      expToDelete.originalImagePath,
      expToDelete.enhancedImagePath,
      expToDelete.referenceImagePath,
    ].filter(Boolean);

    filesToUnlink.forEach((relPath) => {
      const fullPath = path.join(__dirname, '..', relPath);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (e) {
          console.warn('Could not unlink file:', fullPath, e.message);
        }
      }
    });

    return res.status(200).json({ status: 'success', message: 'Experiment and associated files deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete experiment', message: err.message });
  }
};

/**
 * Controller: List available sample benchmark images
 */
export const getSamples = (req, res) => {
  const samples = [
    {
      id: 'landscape',
      title: 'Landscape & Mountain Horizon',
      category: 'Natural Scene',
      description: 'Sunset gradients, distant peaks, and high-frequency pine tree needles.',
      noisyUrl: '/samples/noisy_landscape.png',
      cleanUrl: '/samples/clean_landscape.png',
      hasCleanReference: true,
      defaultParams: { kernel_size: 5, sigma: 1.0, gamma: 1.1, sharpening: 0.3 },
    },
    {
      id: 'coins_objects',
      title: 'Metallic Coins & Circular Objects',
      category: 'Industrial & Currency',
      description: 'Specular highlights, circular metallic boundaries, and light object touch points.',
      noisyUrl: '/samples/noisy_coins_objects.png',
      cleanUrl: '/samples/clean_coins_objects.png',
      hasCleanReference: true,
      defaultParams: { kernel_size: 5, sigma: 1.2, gamma: 1.0, sharpening: 0.5 },
    },
    {
      id: 'portrait',
      title: 'Human Portrait Silhouette',
      category: 'Biometric & Studio',
      description: 'Soft skin tone transitions, eye geometry, and head contours.',
      noisyUrl: '/samples/noisy_portrait.png',
      cleanUrl: '/samples/clean_portrait.png',
      hasCleanReference: true,
      defaultParams: { kernel_size: 5, sigma: 0.8, gamma: 0.9, sharpening: 0.2 },
    },
    {
      id: 'document_text',
      title: 'Scientific Document & Equations',
      category: 'Document & OCR',
      description: 'Fine typographical characters, formulas, and ruled document lines.',
      noisyUrl: '/samples/noisy_document_text.png',
      cleanUrl: '/samples/clean_document_text.png',
      hasCleanReference: true,
      defaultParams: { kernel_size: 3, sigma: 0.6, gamma: 1.2, sharpening: 0.8 },
    },
    {
      id: 'textured_fabric',
      title: 'High-Frequency Woven Fabric',
      category: 'Textured Surface',
      description: 'Dense repetitive cross-hatch threads and complex spatial frequencies.',
      noisyUrl: '/samples/noisy_textured_fabric.png',
      cleanUrl: '/samples/clean_textured_fabric.png',
      hasCleanReference: true,
      defaultParams: { kernel_size: 5, sigma: 1.5, gamma: 1.0, sharpening: 0.4 },
    },
  ];

  return res.status(200).json({ status: 'success', samples });
};

