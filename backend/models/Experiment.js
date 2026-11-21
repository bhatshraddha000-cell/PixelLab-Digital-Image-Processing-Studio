import mongoose from 'mongoose';

const experimentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: () => `Experiment-${new Date().toISOString().slice(0, 19).replace('T', ' ')}`,
    },
    module: {
      type: String,
      default: 'enhancement',
    },
    originalFilename: {
      type: String,
      required: true,
    },
    originalImagePath: {
      type: String,
      required: true,
    },
    enhancedImagePath: {
      type: String,
      required: true,
    },
    referenceImagePath: {
      type: String,
      default: null,
    },
    parameters: {
      kernelSize: { type: Number, required: true },
      sigma: { type: mongoose.Schema.Types.Mixed, required: true },
      gamma: { type: Number, required: true },
      sharpening: { type: Number, default: 0 },
    },
    metrics: {
      hasReference: { type: Boolean, default: false },
      mse: { type: Number, default: 0 },
      psnr: { type: Number, default: 0 },
      ssim: { type: Number, default: 0 },
      delta: { type: mongoose.Schema.Types.Mixed, default: null },
      isImproved: { type: Boolean, default: null },
      explanation: { type: String, default: '' },
    },
    metadata: {
      width: Number,
      height: Number,
      channels: Number,
      isColor: Boolean,
      aspectRatio: Number,
    },
    histograms: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    processingTimeMs: {
      type: Number,
      default: 0,
    },
    userObservations: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Experiment = mongoose.model('Experiment', experimentSchema);
export default Experiment;

