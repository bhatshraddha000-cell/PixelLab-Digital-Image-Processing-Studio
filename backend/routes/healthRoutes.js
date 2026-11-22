import express from 'express';
import { getDBStatus } from '../config/db.js';

const router = express.Router();

/**
 * GET /api/health
 * Returns granular status for Express API, MongoDB, and Python OpenCV Service.
 */
router.get('/health', async (req, res) => {
  const dbStatus = getDBStatus();
  const opencvUrl = process.env.OPENCV_SERVICE_URL || 'http://127.0.0.1:8000';

  let opencvHealth = {
    status: 'offline',
    ready: false,
    message: 'Could not connect to Python OpenCV service',
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const response = await fetch(`${opencvUrl}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      opencvHealth = {
        status: 'online',
        ready: true,
        version: data.version || '1.0.0',
        backend: data.backend || 'OpenCV + NumPy',
      };
    }
  } catch (err) {
    opencvHealth = {
      status: 'offline',
      ready: false,
      message: `OpenCV service unreachable at ${opencvUrl} (${err.name === 'AbortError' ? 'timed out' : err.message})`,
    };
  }

  const allReady = dbStatus === 'connected' && opencvHealth.ready;

  res.status(200).json({
    status: 'ok',
    service: 'PixelLab Studio API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    services: {
      api: {
        status: 'online',
        ready: true,
        port: process.env.PORT || 5000,
      },
      database: {
        status: dbStatus,
        ready: dbStatus === 'connected',
        type: 'MongoDB',
      },
      opencv: opencvHealth,
    },
    modules: [
      { id: 'enhancement', name: 'Image Enhancement (Gaussian & Gamma)', ready: opencvHealth.ready },
      { id: 'morphology', name: 'Morphological Object Separation & Counting', ready: opencvHealth.ready },
      { id: 'watershed', name: 'Watershed Segmentation & Coin Counting', ready: opencvHealth.ready },
      { id: 'classification', name: 'Geometrical Object Classification', ready: opencvHealth.ready },
    ],
  });
});

export default router;
