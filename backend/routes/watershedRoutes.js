import express from 'express';
import {
  upload,
  processWatershed,
  getHistory,
  getHistoryById,
  deleteHistory,
  getSamples,
} from '../controllers/watershedController.js';

const router = express.Router();

// Route: Get built-in benchmark samples metadata
router.get('/samples', getSamples);

// Route: Process watershed segmentation with file uploads
router.post(
  '/process',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'ground_truth_mask', maxCount: 1 },
  ]),
  processWatershed
);

// Route: History endpoints
router.get('/history', getHistory);
router.get('/history/:id', getHistoryById);
router.delete('/history/:id', deleteHistory);

export default router;

