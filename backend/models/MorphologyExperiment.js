import mongoose from 'mongoose';

const morphologyExperimentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: () => `Morphology-${new Date().toISOString().slice(0, 19).replace('T', ' ')}`,
    },
    module: {
      type: String,
      default: 'morphology',
    },
    originalFilename: {
      type: String,
      required: true,
    },
    originalImagePath: {
      type: String,
      required: true,
    },
    labeledImagePath: {
      type: String,
      required: true,
    },
    binaryImagePath: {
      type: String,
      default: null,
    },
    parameters: {
      thresholdMethod: { type: String, default: 'otsu' },
      thresholdValue: { type: Number, default: 127 },
      polarity: { type: String, default: 'bright_on_dark' },
      structuringElement: { type: String, default: 'ellipse' },
      kernelWidth: { type: Number, default: 3 },
      kernelHeight: { type: Number, default: 3 },
      erosionIterations: { type: Number, default: 2 },
      dilationIterations: { type: Number, default: 1 },
      operationMode: { type: String, default: 'custom' },
      connectivity: { type: Number, default: 8 },
      minComponentArea: { type: Number, default: 50 },
      manualCount: { type: Number, default: null },
    },
    results: {
      automaticCount: { type: Number, required: true },
      initialComponentsCount: { type: Number, default: 1 },
      separatedGain: { type: Number, default: 0 },
      manualCount: { type: Number, default: null },
      countError: { type: Number, default: null },
      countAgreementPercent: { type: Number, default: null },
      hasManualReference: { type: Boolean, default: false },
      accuracyVerdict: { type: String, default: '' },
      foregroundPixels: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
    metadata: {
      width: Number,
      height: Number,
      channels: Number,
      isColor: Boolean,
      aspectRatio: Number,
    },
    components: [
      {
        id: Number,
        area: Number,
        bbox: [Number],
        centroid: [Number],
      },
    ],
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

export const MorphologyExperiment = mongoose.model('MorphologyExperiment', morphologyExperimentSchema);
export default MorphologyExperiment;

