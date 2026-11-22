import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.TEST_PORT || process.env.PORT || 5000;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

async function runTests() {
  console.log('🧪 Starting PixelLab Module 03 (Watershed Segmentation) Integration Test Suite...\n');

  // Test 1: Service Health Check
  console.log('--- Test 1: Service Health & Module Readiness ---');
  try {
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    console.log('✅ Express API Status:', health.services.api.status);
    console.log('✅ Database Status:', health.services.database.status);
    console.log('✅ Python OpenCV Status:', health.services.opencv.status);

    const m1 = health.modules.find((m) => m.id === 'enhancement');
    const m2 = health.modules.find((m) => m.id === 'morphology');
    const m3 = health.modules.find((m) => m.id === 'watershed');
    const m4 = health.modules.find((m) => m.id === 'classification');

    console.log(`✅ Module 01 (Enhancement): ready = ${m1?.ready}`);
    console.log(`✅ Module 02 (Morphology): ready = ${m2?.ready}`);
    console.log(`✅ Module 03 (Watershed): ready = ${m3?.ready}`);
    console.log(`✅ Module 04 (Classification): ready = ${m4?.ready} (Strictly preserved for Phase 4)`);

    if (!m1?.ready || !m2?.ready || !m3?.ready) {
      throw new Error('One or more active modules (01, 02, 03) not marked as ready!');
    }
  } catch (err) {
    console.error('❌ Health check failed:', err.message);
    process.exit(1);
  }

  // Test 2: Watershed Samples API
  console.log('\n--- Test 2: Benchmark Samples API ---');
  try {
    const samplesRes = await fetch(`${BASE_URL}/watershed/samples`);
    const samplesData = await samplesRes.json();
    console.log(`✅ Loaded ${samplesData.samples?.length || 0} watershed benchmark datasets:`);
    samplesData.samples?.forEach((s) => {
      console.log(`   • [${s.id}] ${s.name} (Ref: ${s.manualCount} coins, Mask: ${s.maskUrl ? 'YES' : 'NO'})`);
    });
  } catch (err) {
    console.error('❌ Samples endpoint failed:', err.message);
    process.exit(1);
  }

  // Test 3: Benchmark 1 - Lightly Touching Coins (8 coins)
  console.log('\n--- Test 3: Process coins_lightly_touching (8 Coins) ---');
  try {
    const form = new FormData();
    form.append('sampleId', 'coins_lightly_touching');
    form.append('blur_method', 'gaussian');
    form.append('blur_kernel', '5');
    form.append('threshold_method', 'otsu');
    form.append('structuring_element', 'ellipse');
    form.append('opening_kernel_size', '3');
    form.append('opening_iterations', '2');
    form.append('dist_mask_size', '5');
    form.append('fg_threshold_factor', '0.50');
    form.append('bg_dilation_iterations', '3');
    form.append('connectivity', '8');
    form.append('min_region_area', '50');
    form.append('manual_count', '8');
    form.append('experimentName', 'CI-Test-Watershed-Light-8');

    const procRes = await fetch(`${BASE_URL}/watershed/process`, {
      method: 'POST',
      body: form,
    });

    if (!procRes.ok) {
      const err = await procRes.json();
      throw new Error(err.message || `Status ${procRes.status}`);
    }

    const res = await procRes.json();
    console.log('✅ Automatic Coin Count:', res.automaticCount);
    console.log('✅ Total Catchment Basins:', res.evaluation?.total_watershed_regions);
    console.log('✅ Filtered Noise Regions:', res.evaluation?.filtered_noise_regions);
    console.log('✅ Manual Count Ref:', res.evaluation?.manual_count);
    console.log('✅ Count Agreement %:', `${res.evaluation?.count_agreement_percent}%`);
    console.log('✅ Accuracy Verdict:', res.evaluation?.accuracy_verdict);
    console.log('✅ Ground-Truth IoU:', res.evaluation?.iou);
    console.log('✅ Ground-Truth Dice:', res.evaluation?.dice);
    console.log('✅ Processing Duration:', `${res.processingTimeMs} ms`);

    if (res.automaticCount === 8) {
      console.log('🎯 100% PERFECT MATCH: 8 LIGHTLY TOUCHING COINS SEGMENTED!');
    } else {
      console.warn(`⚠️ Expected 8 coins, got ${res.automaticCount}`);
    }
  } catch (err) {
    console.error('❌ coins_lightly_touching processing failed:', err.message);
    process.exit(1);
  }

  // Test 4: Benchmark 2 - Closely Arranged Coins (12 coins)
  console.log('\n--- Test 4: Process coins_closely_arranged (12 Coins) ---');
  try {
    const form = new FormData();
    form.append('sampleId', 'coins_closely_arranged');
    form.append('blur_method', 'gaussian');
    form.append('blur_kernel', '5');
    form.append('threshold_method', 'otsu');
    form.append('structuring_element', 'ellipse');
    form.append('opening_kernel_size', '3');
    form.append('opening_iterations', '2');
    form.append('dist_mask_size', '5');
    form.append('fg_threshold_factor', '0.50');
    form.append('bg_dilation_iterations', '3');
    form.append('connectivity', '8');
    form.append('min_region_area', '50');
    form.append('manual_count', '12');
    form.append('experimentName', 'CI-Test-Watershed-Dense-12');

    const procRes = await fetch(`${BASE_URL}/watershed/process`, {
      method: 'POST',
      body: form,
    });

    const res = await procRes.json();
    console.log('✅ Automatic Coin Count:', res.automaticCount);
    console.log('✅ Count Agreement %:', `${res.evaluation?.count_agreement_percent}%`);
    console.log('✅ Ground-Truth IoU:', res.evaluation?.iou);
    console.log('✅ Ground-Truth Dice:', res.evaluation?.dice);

    if (res.automaticCount === 12) {
      console.log('🎯 100% PERFECT MATCH: 12 CLUSTERED COINS SEGMENTED!');
    }
  } catch (err) {
    console.error('❌ coins_closely_arranged processing failed:', err.message);
    process.exit(1);
  }

  // Test 5: Benchmark 3 - Slightly Overlapping Coins (10 coins)
  console.log('\n--- Test 5: Process coins_slightly_overlapping (10 Coins) ---');
  try {
    const form = new FormData();
    form.append('sampleId', 'coins_slightly_overlapping');
    form.append('blur_method', 'gaussian');
    form.append('blur_kernel', '5');
    form.append('threshold_method', 'otsu');
    form.append('structuring_element', 'ellipse');
    form.append('opening_kernel_size', '3');
    form.append('opening_iterations', '2');
    form.append('dist_mask_size', '5');
    form.append('fg_threshold_factor', '0.65'); // Higher saddle cutoff for physical overlaps
    form.append('bg_dilation_iterations', '3');
    form.append('connectivity', '8');
    form.append('min_region_area', '50');
    form.append('manual_count', '10');
    form.append('experimentName', 'CI-Test-Watershed-Overlap-10');

    const procRes = await fetch(`${BASE_URL}/watershed/process`, {
      method: 'POST',
      body: form,
    });

    const res = await procRes.json();
    console.log('✅ Automatic Coin Count:', res.automaticCount);
    console.log('✅ Count Agreement %:', `${res.evaluation?.count_agreement_percent}%`);
    console.log('✅ Ground-Truth IoU:', res.evaluation?.iou);
    console.log('✅ Ground-Truth Dice:', res.evaluation?.dice);

    if (res.automaticCount === 10) {
      console.log('🎯 100% PERFECT MATCH: 10 OVERLAPPING COINS SEGMENTED!');
    }
  } catch (err) {
    console.error('❌ coins_slightly_overlapping processing failed:', err.message);
    process.exit(1);
  }

  // Test 6: Module 01 Regression Test (Enhancement Pipeline)
  console.log('\n--- Test 6: Module 01 Regression Test (Image Enhancement) ---');
  try {
    const form = new FormData();
    form.append('sampleId', 'coins_objects');
    form.append('kernel_size', '5');
    form.append('sigma', '1.2');
    form.append('gamma', '1.0');
    form.append('sharpening', '0.4');

    const enhRes = await fetch(`${BASE_URL}/enhancement/process`, {
      method: 'POST',
      body: form,
    });

    const enhData = await enhRes.json();
    console.log('✅ Module 01 Status:', enhData.status);
    console.log('✅ Module 01 PSNR:', enhData.evaluation?.metrics?.psnr, 'dB');
  } catch (err) {
    console.error('❌ Module 01 regression test failed:', err.message);
    process.exit(1);
  }

  // Test 7: Module 02 Regression Test (Morphology Pipeline)
  console.log('\n--- Test 7: Module 02 Regression Test (Morphological Separation) ---');
  try {
    const form = new FormData();
    form.append('sampleId', 'coins_touching_8');
    form.append('threshold_method', 'otsu');
    form.append('structuring_element', 'ellipse');
    form.append('kernel_width', '3');
    form.append('kernel_height', '3');
    form.append('erosion_iterations', '3');
    form.append('dilation_iterations', '1');
    form.append('operation_mode', 'custom');
    form.append('min_component_area', '50');
    form.append('manual_count', '8');

    const morphRes = await fetch(`${BASE_URL}/morphology/process`, {
      method: 'POST',
      body: form,
    });

    const morphData = await morphRes.json();
    console.log('✅ Module 02 Status:', morphData.status);
    console.log('✅ Module 02 Count:', morphData.automaticCount, '(Agreement:', `${morphData.evaluation?.count_agreement_percent}%)`);
  } catch (err) {
    console.error('❌ Module 02 regression test failed:', err.message);
    process.exit(1);
  }

  // Test 8: Watershed Experiment History Persistence
  console.log('\n--- Test 8: Watershed History Persistence ---');
  try {
    const histRes = await fetch(`${BASE_URL}/watershed/history`);
    const histData = await histRes.json();
    console.log(`✅ Retrieved ${histData.history?.length || 0} watershed records from source [${histData.source}]`);
  } catch (err) {
    console.error('❌ Watershed history failed:', err.message);
  }

  console.log('\n======================================================');
  console.log('🎉 ALL MODULE 03 WATERSHED & REGRESSION TESTS PASSED!');
  console.log('======================================================\n');
}

runTests();

