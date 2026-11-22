import mongoose from 'mongoose';

const classificationModelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: () => `KNN-Model-${new Date().toISOString().slice(0, 19).replace('T', ' ')}`,
    },
    algorithm: {
      type: String,
      default: 'K-Nearest Neighbors (KNN)',
    },
    k: {
      type: Number,
      required: true,
      default: 3,
    },
    features: {
      type: [String],
      default: ['compactness', 'circularity', 'rectangularity', 'aspect_ratio', 'vertices'],
    },
    testRatio: {
      type: Number,
      default: 0.25,
    },
    totalSamples: {
      type: Number,
      required: true,
    },
    trainSamples: {
      type: Number,
      required: true,
    },
    testSamples: {
      type: Number,
      required: true,
    },
    metrics: {
      accuracy: { type: Number, required: true },
      classificationError: { type: Number, required: true },
      precisionMacro: { type: Number, required: true },
      recallMacro: { type: Number, required: true },
      f1Macro: { type: Number, required: true },
      f1Weighted: { type: Number, required: true },
      confusionMatrix: {
        labels: [String],
        matrix: [[Number]],
      },
      perCategory: mongoose.Schema.Types.Mixed,
    },
    isDefault: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const ClassificationModel =
  mongoose.models.ClassificationModel ||
  mongoose.model('ClassificationModel', classificationModelSchema);

export default ClassificationModel;

