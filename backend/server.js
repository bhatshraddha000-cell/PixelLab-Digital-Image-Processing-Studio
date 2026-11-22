import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import healthRoutes from './routes/healthRoutes.js';
import enhancementRoutes from './routes/enhancementRoutes.js';
import morphologyRoutes from './routes/morphologyRoutes.js';
import watershedRoutes from './routes/watershedRoutes.js';
import classificationRoutes from './routes/classificationRoutes.js';

// Resolve directory name and load environment variables reliably
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
app.use(
  cors({
    origin: [
      CLIENT_URL,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5000',
      'http://127.0.0.1:5000',
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Static storage serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/samples', express.static(path.join(__dirname, 'samples')));

// API Routes
app.use('/api', healthRoutes);
app.use('/api/enhancement', enhancementRoutes);
app.use('/api/morphology', morphologyRoutes);
app.use('/api/watershed', watershedRoutes);
app.use('/api/classification', classificationRoutes);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'PixelLab – Digital Image Processing Studio API',
    tagline: 'Explore Images. Process Intelligence. Discover Results.',
    status: 'online',
    phase: 'Module 04 - Region-Based Object Classification Using Geometrical Descriptors',
    endpoints: {
      health: '/api/health',
      enhancement: '/api/enhancement/process',
      morphology: '/api/morphology/process',
      watershed: '/api/watershed/process',
      classification: '/api/classification/process',
      classificationSamples: '/api/classification/samples',
      classificationDataset: '/api/classification/dataset',
      classificationTrain: '/api/classification/train',
      watershedHistory: '/api/watershed/history',
    },
  });
});

// 404 handler for unknown API routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `API route ${req.method} ${req.originalUrl} does not exist.`,
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.',
  });
});

// Start server
const startServer = async () => {
  await connectDB();

  const listen = (portToTry) => {
    const server = app.listen(portToTry, () => {
      console.log(`🚀 PixelLab Express API listening on http://localhost:${portToTry}`);
      console.log(`🩺 Health check available at: http://localhost:${portToTry}/api/health`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`⚠️ Port ${portToTry} is in use, attempting port ${portToTry + 1}...`);
        listen(portToTry + 1);
      } else {
        console.error('Server error:', err);
      }
    });
  };

  listen(PORT);
};

startServer();
