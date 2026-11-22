import mongoose from 'mongoose';

const watershedExperimentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: () => `Watershed-${new Date().toISOString().slice(0, 19).replace('T', ' ')}`,
    },
    module: {
      type: String,
      default: 'watershed',
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
    boundaryOverlayPath: {
      type: String,
      required: true,
    },
    markerVisualizationPath: {
      type: String,
      default: null,
    },
    distanceHeatmapPath: {
      type: String,
      default: null,
    },
    referenceMaskPath: {
      type: String,
      default: null,
    },
    parameters: {
      blurMethod: { type: String, default: 'gaussian' },
      blurKernel: { type: Number, default: 5 },
      thresholdMethod: { type: String, default: 'otsu' },
      thresholdValue: { type: Number, default: 127 },
      polarity: { type: String, default: 'bright_on_dark' },
      structuringElement: { type: String, default: 'ellipse' },
      openingKernelSize: { type: Number, default: 3 },
      openingIterations: { type: Number, default: 2 },
      distMaskSize: { type: Number, default: 5 },
      fgThresholdFactor: { type: Number, default: 0.50 },
      bgDilationIterations: { type: Number, default: 3 },
      connectivity: { type: Number, default: 8 },
      minRegionArea: { type: Number, default: 50 },
      manualCount: { type: Number, default: null },
      usedManualMarkers: { type: Boolean, default: false },
    },
    results: {
      automaticCount: { type: Number, required: true },
      totalWatershedRegions: { type: Number, default: 0 },
      filteredNoiseRegions: { type: Number, default: 0 },
      manualCount: { type: Number, default: null },
      countError: { type: Number, default: null },
      countAgreementPercent: { type: Number, default: null },
      hasManualReference: { type: Boolean, default: false },
      accuracyVerdict: { type: String, default: '' },
      iou: { type: Number, default: null },
      dice: { type: Number, default: null },
      precision: { type: Number, default: null },
      recall: { type: Number, default: null },
      f1Score: { type: Number, default: null },
      hasGroundTruth: { type: Boolean, default: false },
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
        label: Number,
        area: Number,
        perimeter: Number,
        centroid: [Number],
        bbox: [Number],
        color_rgb: [Number],
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

export const WatershedExperiment = mongoose.model('WatershedExperiment', watershedExperimentSchema);
export default WatershedExperiment;

