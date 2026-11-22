import express from 'express';
import {
  upload,
  processMorphology,
  getHistory,
  getHistoryById,
  deleteHistory,
  getSamples,
} from '../controllers/morphologyController.js';

const router = express.Router();

// Route: Get benchmark samples metadata
router.get('/samples', getSamples);

// Route: Process morphology with image upload support
router.post('/process', upload.single('image'), processMorphology);

// Route: History endpoints
router.get('/history', getHistory);
router.get('/history/:id', getHistoryById);
router.delete('/history/:id', deleteHistory);

export default router;

