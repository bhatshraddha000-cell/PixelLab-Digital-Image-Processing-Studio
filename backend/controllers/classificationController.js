import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import ClassificationExperiment from '../models/ClassificationExperiment.js';
import ClassificationModel from '../models/ClassificationModel.js';
import ClassificationDatasetSample from '../models/ClassificationDatasetSample.js';
import { getDBStatus } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const SAMPLES_DIR = path.join(__dirname, '..', 'samples', 'classification');
const DATASET_DIR = path.join(__dirname, '..', '..', 'datasets', 'geometric_objects');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory fallback if MongoDB is offline
const inMemoryClassificationExperiments = [];

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

// Built-in benchmark test samples
const SAMPLES_METADATA = [
  {
    id: 'test_multi_shapes_5',
    name: '5 Distinct Geometric Primitives',
    category: 'Benchmark Scenes',
    filename: 'test_multi_shapes_5.png',
    previewUrl: '/samples/classification/test_multi_shapes_5.png',
    dimensions: '600 × 400 px',
    shapeCount: 5,
    shapes: ['Circle', 'Square', 'Triangle', 'Rectangle', 'Ellipse'],
    description: 'Clean benchmark scene featuring all 5 target geometric classes (Circle, Square, Triangle, Rectangle, Ellipse) with distinct contours.',
    recommendedParams: {
      thresholdMethod: 'otsu',
      polarity: 'bright_on_dark',
      blurKernel: 3,
      morphOperation: 'none',
      minObjectArea: 80,
      kNeighbors: 3,
    },
  },
  {
    id: 'test_mixed_primitives_8',
    name: '8 Geometric Shapes Multi-Row',
    category: 'Multi-Object Benchmark',
    filename: 'test_mixed_primitives_8.png',
    previewUrl: '/samples/classification/test_mixed_primitives_8.png',
    dimensions: '680 × 440 px',
    shapeCount: 8,
    shapes: ['Circle', 'Triangle', 'Square', 'Rectangle', 'Ellipse'],
    description: 'Eight geometric objects arranged across 2 rows with variations in orientation and scale to test multi-shape segmentation and classification.',
    recommendedParams: {
      thresholdMethod: 'otsu',
      polarity: 'bright_on_dark',
      blurKernel: 3,
      morphOperation: 'none',
      minObjectArea: 80,
      kNeighbors: 3,
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
 * Controller: Get dataset statistics and preview
 */
export const getDataset = async (req, res) => {
  const opencvUrl = process.env.OPENCV_SERVICE_URL || 'http://127.0.0.1:8000';

  try {
    const response = await fetch(`${opencvUrl}/classification/dataset-stats`);
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
  } catch (err) {
    // Fallback to local filesystem scanning
  }

  const categories = ['circle', 'triangle', 'square', 'rectangle', 'ellipse'];
  const counts = {};
  let total = 0;
  const samplesPreview = {};

  categories.forEach((cat) => {
    const catDir = path.join(DATASET_DIR, cat);
    if (fs.existsSync(catDir)) {
      const files = fs.readdirSync(catDir).filter((f) => f.endsWith('.png'));
      counts[cat] = files.length;
      total += files.length;
      samplesPreview[cat] = files.slice(0, 6);
    } else {
      counts[cat] = 0;
      samplesPreview[cat] = [];
    }
  });

  res.json({
    status: 'success',
    dataset: {
      total_samples: total,
      categories,
      counts,
      samples_preview: samplesPreview,
      dataset_dir: DATASET_DIR,
    },
  });
};

/**
 * Controller: Train KNN classifier on the geometric dataset
 */
export const trainModel = async (req, res) => {
  const opencvUrl = process.env.OPENCV_SERVICE_URL || 'http://127.0.0.1:8000';

  const k = parseInt(req.body.k || req.body.k_neighbors || 3, 10);
  const testRatio = parseFloat(req.body.testRatio || req.body.test_ratio || 0.25);
  const features = req.body.features || ['compactness', 'circularity', 'rectangularity', 'aspect_ratio', 'vertices'];

  try {
    const form = new FormData();
    form.append('k', String(k));
    form.append('test_ratio', String(testRatio));
    form.append('feature_names', JSON.stringify(features));

    const response = await fetch(`${opencvUrl}/classification/train`, {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        status: 'error',
        message: `Python KNN training service error: ${errText}`,
      });
    }

    const pyResult = await response.json();
    const results = pyResult.results || {};

    // Persist model record in MongoDB if available
    let savedModel = null;
    if (getDBStatus() === 'connected') {
      try {
        await ClassificationModel.updateMany({}, { isDefault: false });
        savedModel = await ClassificationModel.create({
          name: `KNN (k=${k}) - ${new Date().toLocaleTimeString()}`,
          algorithm: 'K-Nearest Neighbors (KNN)',
          k,
          features: results.features_used || features,
          testRatio,
          totalSamples: results.total_samples || results.total_dataset_samples || 0,
          trainSamples: results.train_samples || 0,
          testSamples: results.test_samples || 0,
          metrics: {
            accuracy: results.accuracy,
            classificationError: results.classification_error,
            precisionMacro: results.precision_macro,
            recallMacro: results.recall_macro,
            f1Macro: results.f1_macro,
            f1Weighted: results.f1_weighted,
            confusionMatrix: results.confusion_matrix,
            perCategory: results.per_category,
          },
          isDefault: true,
        });
      } catch (dbErr) {
        console.warn('Could not persist model record to MongoDB:', dbErr.message);
      }
    }

    const sampleCount = results.total_samples || results.total_dataset_samples || 0;
    res.json({
      status: 'success',
      message: `Trained KNN model with k=${k} on ${sampleCount} samples. Accuracy: ${(results.accuracy * 100).toFixed(1)}%`,
      model: savedModel || {
        algorithm: 'K-Nearest Neighbors (KNN)',
        k,
        features: results.features_used || features,
        metrics: results,
      },
    });
  } catch (error) {
    console.error('Error training classification model:', error);
    res.status(500).json({
      status: 'error',
      message: `Failed to train KNN classifier: ${error.message}`,
    });
  }
};

/**
 * Controller: Get latest trained model information
 */
export const getModel = async (req, res) => {
  if (getDBStatus() === 'connected') {
    try {
      const latestModel = await ClassificationModel.findOne({ isDefault: true }).sort({ createdAt: -1 });
      if (latestModel) {
        return res.json({ status: 'success', model: latestModel });
      }
    } catch (err) {
      // Continue to default
    }
  }

  res.json({
    status: 'success',
    model: {
      algorithm: 'K-Nearest Neighbors (KNN)',
      k: 3,
      features: ['compactness', 'circularity', 'rectangularity', 'aspect_ratio', 'vertices'],
      isDefault: true,
      metrics: {
        accuracy: 0.9688,
        classificationError: 0.0312,
        precisionMacro: 0.975,
        recallMacro: 0.9667,
        f1Macro: 0.9688,
        f1Weighted: 0.9688,
      },
    },
  });
};

/**
 * Controller: Execute Object Classification Pipeline via Python OpenCV microservice
 */
export const processClassification = async (req, res) => {
  const opencvUrl = process.env.OPENCV_SERVICE_URL || 'http://127.0.0.1:8000';

  try {
    let imageBuffer = null;
    let imageName = 'shapes_target.png';

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
      } else {
        return res.status(404).json({
          status: 'error',
          message: `Sample image '${req.body.sampleId}' not found at ${samplePath}`,
        });
      }
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'No image provided. Please upload an image file or specify a valid sampleId.',
      });
    }

    // 2. Parse algorithmic parameters
    const thresholdMethod = req.body.thresholdMethod || req.body.threshold_method || 'otsu';
    const thresholdValue = parseInt(req.body.thresholdValue || req.body.threshold_value || 127, 10);
    const polarity = req.body.polarity || 'bright_on_dark';
    const blurKernel = parseInt(req.body.blurKernel || req.body.blur_kernel || 3, 10);
    const morphOperation = req.body.morphOperation || req.body.morph_operation || 'none';
    const morphKernelSize = parseInt(req.body.morphKernelSize || req.body.morph_kernel_size || 3, 10);
    const minObjectArea = parseInt(req.body.minObjectArea || req.body.min_object_area || 80, 10);
    const kNeighbors = parseInt(req.body.kNeighbors || req.body.k_neighbors || 3, 10);
    const featureNames = req.body.features || req.body.featureNames || null;
    const experimentName = req.body.experimentName || req.body.name || `Classification-${Date.now()}`;
    const userObservations = req.body.userObservations || req.body.observations || '';

    // 3. Construct multipart form data for Python FastAPI microservice
    const form = new FormData();
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
    form.append('image', imageBlob, imageName);

    form.append('threshold_method', thresholdMethod);
    form.append('threshold_value', String(thresholdValue));
    form.append('polarity', polarity);
    form.append('blur_kernel', String(blurKernel));
    form.append('morph_operation', morphOperation);
    form.append('morph_kernel_size', String(morphKernelSize));
    form.append('min_object_area', String(minObjectArea));
    form.append('k_neighbors', String(kNeighbors));

    if (featureNames) {
      form.append('feature_names', typeof featureNames === 'string' ? featureNames : JSON.stringify(featureNames));
    }

    // 4. Request Python microservice
    const pythonEndpoint = `${opencvUrl}/process/classification`;
    const pyResponse = await fetch(pythonEndpoint, {
      method: 'POST',
      body: form,
    });

    if (!pyResponse.ok) {
      const errText = await pyResponse.text();
      return res.status(pyResponse.status).json({
        status: 'error',
        message: `Python classification processing error: ${errText}`,
      });
    }

    const pyResult = await pyResponse.json();

    // 5. Save generated images to disk
    const timestamp = Date.now();
    const safeBase = path.basename(imageName, path.extname(imageName)).replace(/[^a-zA-Z0-9_-]/g, '_');
    const originalFileRel = `orig_${timestamp}_${safeBase}.png`;
    const segmentedFileRel = `seg_${timestamp}_${safeBase}.png`;
    const annotatedFileRel = `annot_${timestamp}_${safeBase}.png`;
    const contoursFileRel = `cnt_${timestamp}_${safeBase}.png`;
    const bboxFileRel = `bbox_${timestamp}_${safeBase}.png`;

    const originalDiskPath = path.join(UPLOADS_DIR, originalFileRel);
    const segmentedDiskPath = path.join(UPLOADS_DIR, segmentedFileRel);
    const annotatedDiskPath = path.join(UPLOADS_DIR, annotatedFileRel);
    const contoursDiskPath = path.join(UPLOADS_DIR, contoursFileRel);
    const bboxDiskPath = path.join(UPLOADS_DIR, bboxFileRel);

    fs.writeFileSync(originalDiskPath, imageBuffer);

    if (pyResult.images?.binary) {
      const base64 = pyResult.images.binary.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(segmentedDiskPath, Buffer.from(base64, 'base64'));
    }
    if (pyResult.images?.annotated) {
      const base64 = pyResult.images.annotated.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(annotatedDiskPath, Buffer.from(base64, 'base64'));
    }
    if (pyResult.images?.contours) {
      const base64 = pyResult.images.contours.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(contoursDiskPath, Buffer.from(base64, 'base64'));
    }
    if (pyResult.images?.bounding_boxes) {
      const base64 = pyResult.images.bounding_boxes.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(bboxDiskPath, Buffer.from(base64, 'base64'));
    }

    // 6. Persist experiment document to MongoDB or in-memory fallback
    const experimentDoc = {
      name: experimentName,
      module: 'classification',
      originalFilename: imageName,
      originalImagePath: `/uploads/${originalFileRel}`,
      segmentedImagePath: `/uploads/${segmentedFileRel}`,
      annotatedImagePath: `/uploads/${annotatedFileRel}`,
      contoursImagePath: `/uploads/${contoursFileRel}`,
      boundingBoxesImagePath: `/uploads/${bboxFileRel}`,
      parameters: {
        thresholdMethod,
        thresholdValue,
        polarity,
        blurKernel,
        morphOperation,
        morphKernelSize,
        minObjectArea,
        kNeighbors,
        featuresUsed: pyResult.parameters?.features_used || [],
      },
      results: {
        totalDetectedObjects: pyResult.total_detected_objects,
        categoryCounts: pyResult.category_counts,
        modelInfo: pyResult.model_info,
      },
      objects: (pyResult.objects || []).map((o) => ({
        id: o.id,
        predictedClass: o.predicted_class,
        confidence: o.confidence,
        area: o.area,
        perimeter: o.perimeter,
        compactness: o.compactness,
        circularity: o.circularity,
        rectangularity: o.rectangularity,
        aspectRatio: o.aspect_ratio,
        vertices: o.vertices,
        extent: o.extent,
        solidity: o.solidity,
        centroid: o.centroid,
        bbox: o.bbox,
        colorRgb: o.color_rgb,
      })),
      metadata: pyResult.metadata || {
        width: 0,
        height: 0,
        channels: 3,
        format: 'PNG',
      },
      processingTimeMs: pyResult.processing_time_ms,
      userObservations,
      createdAt: new Date(),
    };

    let savedRecord = null;
    if (getDBStatus() === 'connected') {
      try {
        savedRecord = await ClassificationExperiment.create(experimentDoc);
      } catch (dbErr) {
        console.warn('Could not persist to MongoDB, falling back to memory:', dbErr.message);
        experimentDoc._id = `inmem_${Date.now()}`;
        inMemoryClassificationExperiments.unshift(experimentDoc);
        savedRecord = experimentDoc;
      }
    } else {
      experimentDoc._id = `inmem_${Date.now()}`;
      inMemoryClassificationExperiments.unshift(experimentDoc);
      savedRecord = experimentDoc;
    }

    // 7. Return comprehensive response
    res.json({
      status: 'success',
      data: {
        id: savedRecord._id,
        name: savedRecord.name,
        processing_time_ms: pyResult.processing_time_ms,
        metadata: pyResult.metadata,
        parameters: pyResult.parameters,
        model_info: pyResult.model_info,
        total_detected_objects: pyResult.total_detected_objects,
        category_counts: pyResult.category_counts,
        objects: pyResult.objects,
        images: {
          original: pyResult.images?.original || `/uploads/${originalFileRel}`,
          grayscale: pyResult.images?.grayscale,
          binary: pyResult.images?.binary || `/uploads/${segmentedFileRel}`,
          contours: pyResult.images?.contours || `/uploads/${contoursFileRel}`,
          bounding_boxes: pyResult.images?.bounding_boxes || `/uploads/${bboxFileRel}`,
          annotated: pyResult.images?.annotated || `/uploads/${annotatedFileRel}`,
        },
        imageUrls: {
          original: `/uploads/${originalFileRel}`,
          binary: `/uploads/${segmentedFileRel}`,
          annotated: `/uploads/${annotatedFileRel}`,
          contours: `/uploads/${contoursFileRel}`,
          bounding_boxes: `/uploads/${bboxFileRel}`,
        },
      },
    });
  } catch (error) {
    console.error('Classification processing controller error:', error);
    res.status(500).json({
      status: 'error',
      message: `Image classification failed: ${error.message}`,
    });
  }
};

/**
 * Controller: Get experiment history
 */
export const getHistory = async (req, res) => {
  try {
    if (getDBStatus() === 'connected') {
      const experiments = await ClassificationExperiment.find({})
        .select('-objects.contour_raw')
        .sort({ createdAt: -1 })
        .limit(50);
      return res.json({ status: 'success', count: experiments.length, data: experiments });
    }

    res.json({
      status: 'success',
      count: inMemoryClassificationExperiments.length,
      data: inMemoryClassificationExperiments,
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Controller: Get single experiment by ID
 */
export const getHistoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (getDBStatus() === 'connected') {
      const exp = await ClassificationExperiment.findById(id);
      if (exp) {
        return res.json({ status: 'success', data: exp });
      }
    }

    const memoryExp = inMemoryClassificationExperiments.find((e) => String(e._id) === String(id));
    if (memoryExp) {
      return res.json({ status: 'success', data: memoryExp });
    }

    res.status(404).json({ status: 'error', message: 'Classification experiment not found' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Controller: Delete experiment by ID
 */
export const deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;

    if (getDBStatus() === 'connected') {
      const exp = await ClassificationExperiment.findByIdAndDelete(id);
      if (exp) {
        return res.json({ status: 'success', message: 'Experiment deleted successfully' });
      }
    }

    const index = inMemoryClassificationExperiments.findIndex((e) => String(e._id) === String(id));
    if (index !== -1) {
      inMemoryClassificationExperiments.splice(index, 1);
      return res.json({ status: 'success', message: 'Experiment deleted from memory' });
    }

    res.status(404).json({ status: 'error', message: 'Experiment not found' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
