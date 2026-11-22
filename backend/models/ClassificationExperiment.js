import mongoose from 'mongoose';

const classificationExperimentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: () => `Classification-${new Date().toISOString().slice(0, 19).replace('T', ' ')}`,
    },
    module: {
      type: String,
      default: 'classification',
    },
    originalFilename: {
      type: String,
      required: true,
    },
    originalImagePath: {
      type: String,
      required: true,
    },
    segmentedImagePath: {
      type: String,
      required: true,
    },
    annotatedImagePath: {
      type: String,
      required: true,
    },
    contoursImagePath: {
      type: String,
      default: null,
    },
    boundingBoxesImagePath: {
      type: String,
      default: null,
    },
    parameters: {
      thresholdMethod: { type: String, default: 'otsu' },
      thresholdValue: { type: Number, default: 127 },
      polarity: { type: String, default: 'bright_on_dark' },
      blurKernel: { type: Number, default: 3 },
      morphOperation: { type: String, default: 'none' },
      morphKernelSize: { type: Number, default: 3 },
      minObjectArea: { type: Number, default: 80 },
      kNeighbors: { type: Number, default: 3 },
      featuresUsed: { type: [String], default: [] },
    },
    results: {
      totalDetectedObjects: { type: Number, required: true },
      categoryCounts: { type: mongoose.Schema.Types.Mixed, default: {} },
      modelInfo: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    objects: [
      {
        id: { type: Number, required: true },
        predictedClass: { type: String, required: true },
        confidence: { type: Number, default: 0 },
        area: { type: Number, default: 0 },
        perimeter: { type: Number, default: 0 },
        compactness: { type: Number, default: 0 },
        circularity: { type: Number, default: 0 },
        rectangularity: { type: Number, default: 0 },
        aspectRatio: { type: Number, default: 1.0 },
        vertices: { type: Number, default: 0 },
        extent: { type: Number, default: 0 },
        solidity: { type: Number, default: 0 },
        centroid: { type: [Number], default: [0, 0] },
        bbox: { type: [Number], default: [0, 0, 0, 0] },
        colorRgb: { type: [Number], default: [148, 163, 184] },
      },
    ],
    metadata: {
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      channels: { type: Number, default: 3 },
      format: { type: String, default: 'PNG' },
    },
    processingTimeMs: {
      type: Number,
      default: 0,
    },
    userObservations: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const ClassificationExperiment =
  mongoose.models.ClassificationExperiment ||
  mongoose.model('ClassificationExperiment', classificationExperimentSchema);

export default ClassificationExperiment;

