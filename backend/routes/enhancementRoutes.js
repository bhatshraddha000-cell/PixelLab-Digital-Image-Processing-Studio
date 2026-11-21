import express from 'express';
import {
  upload,
  processEnhancement,
  getHistory,
  getHistoryById,
  deleteHistory,
  getSamples,
} from '../controllers/enhancementController.js';

const router = express.Router();

// Route: Get sample benchmark image definitions
router.get('/samples', getSamples);

// Route: Process enhancement with file upload support
router.post(
  '/process',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'reference_image', maxCount: 1 },
  ]),
  processEnhancement
);

// Route: History endpoints
router.get('/history', getHistory);
router.get('/history/:id', getHistoryById);
router.delete('/history/:id', deleteHistory);

export default router;

