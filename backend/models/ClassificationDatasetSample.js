import mongoose from 'mongoose';

const classificationDatasetSampleSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ['circle', 'triangle', 'square', 'rectangle', 'ellipse'],
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    sourceType: {
      type: String,
      enum: ['synthetic', 'uploaded', 'benchmark'],
      default: 'synthetic',
    },
    dimensions: {
      width: { type: Number, default: 128 },
      height: { type: Number, default: 128 },
    },
    features: {
      area: { type: Number, default: 0 },
      perimeter: { type: Number, default: 0 },
      compactness: { type: Number, default: 0 },
      circularity: { type: Number, default: 0 },
      rectangularity: { type: Number, default: 0 },
      aspectRatio: { type: Number, default: 1.0 },
      vertices: { type: Number, default: 0 },
      extent: { type: Number, default: 0 },
      solidity: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

const ClassificationDatasetSample =
  mongoose.models.ClassificationDatasetSample ||
  mongoose.model('ClassificationDatasetSample', classificationDatasetSampleSchema);

export default ClassificationDatasetSample;

