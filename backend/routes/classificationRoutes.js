import express from 'express';
import {
  upload,
  getSamples,
  getDataset,
  trainModel,
  getModel,
  processClassification,
  getHistory,
  getHistoryById,
  deleteHistory,
} from '../controllers/classificationController.js';

const router = express.Router();

/**
 * Route: GET /api/classification/samples
 * Retrieve built-in multi-shape benchmark test samples
 */
router.get('/samples', getSamples);

/**
 * Route: GET /api/classification/dataset
 * Retrieve dataset category counts and thumbnails
 */
router.get('/dataset', getDataset);

/**
 * Route: POST /api/classification/train
 * Train real KNN model with StandardScaler and hold-out evaluation
 */
router.post('/train', trainModel);

/**
 * Route: GET /api/classification/model
 * Retrieve latest/default trained model metadata
 */
router.get('/model', getModel);

/**
 * Route: POST /api/classification/process
 * Execute multi-stage object segmentation, descriptor extraction & classification
 */
router.post(
  '/process',
  upload.fields([{ name: 'image', maxCount: 1 }]),
  processClassification
);

/**
 * Route: GET /api/classification/history
 * List historical classification experiments
 */
router.get('/history', getHistory);

/**
 * Route: GET /api/classification/history/:id
 * Retrieve details for a single experiment
 */
router.get('/history/:id', getHistoryById);

/**
 * Route: DELETE /api/classification/history/:id
 * Remove a classification experiment record
 */
router.delete('/history/:id', deleteHistory);

export default router;

