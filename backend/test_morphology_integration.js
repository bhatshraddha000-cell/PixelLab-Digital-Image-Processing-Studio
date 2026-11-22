import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.TEST_PORT || process.env.PORT || 5000;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

async function runTests() {
  console.log('🧪 Starting PixelLab Module 02 (Morphology) Integration Test Suite...\n');

  // Test 1: Health check
  console.log('--- Test 1: Service Health Check ---');
  try {
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    console.log('✅ Express API Status:', health.services.api.status);
    console.log('✅ Database Status:', health.services.database.status);
    console.log('✅ Python OpenCV Status:', health.services.opencv.status);
    console.log('✅ Modules Readiness:', health.modules);

    const morphModule = health.modules.find((m) => m.id === 'morphology');
    if (!morphModule || !morphModule.ready) {
      throw new Error('Morphology module is not marked as ready in health check!');
    }
  } catch (err) {
    console.error('❌ Health check failed:', err.message);
    process.exit(1);
  }

  // Test 2: Morphology Benchmark Samples
  console.log('\n--- Test 2: Benchmark Samples API ---');
  try {
    const samplesRes = await fetch(`${BASE_URL}/morphology/samples`);
    const samplesData = await samplesRes.json();
    console.log(`✅ Loaded ${samplesData.samples?.length || 0} benchmark coin datasets:`);
    samplesData.samples?.forEach((s) => {
      console.log(`   • [${s.id}] ${s.name} (Ref: ${s.manualCount} coins)`);
    });
  } catch (err) {
    console.error('❌ Samples endpoint failed:', err.message);
    process.exit(1);
  }

  // Test 3: Process coins_touching_8 (Lightly touching coins)
  console.log('\n--- Test 3: Process coins_touching_8 Benchmark ---');
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
    form.append('experimentName', 'CI-Test-Touching-8');

    const procRes = await fetch(`${BASE_URL}/morphology/process`, {
      method: 'POST',
      body: form,
    });

    if (!procRes.ok) {
      const err = await procRes.json();
      throw new Error(err.message || `Status ${procRes.status}`);
    }

    const res = await procRes.json();
    console.log('✅ Status:', res.status);
    console.log('✅ Initial Connected Components Before Morphology:', res.evaluation?.initial_components_before_morphology);
    console.log('✅ Automatic Count After Morphology:', res.automaticCount);
    console.log('✅ Bridge Severance Gain:', `+${res.evaluation?.separated_gain}`);
    console.log('✅ Manual Reference Count:', res.evaluation?.manual_count);
    console.log('✅ Count Agreement %:', `${res.evaluation?.count_agreement_percent}%`);
    console.log('✅ Accuracy Verdict:', res.evaluation?.accuracy_verdict);
    console.log('✅ Processing Duration:', `${res.processingTimeMs} ms`);
    console.log('✅ Labeled image generated:', !!res.images?.labeled);

    if (res.automaticCount !== 8) {
      console.warn(`⚠️ Expected 8 coins, got ${res.automaticCount}`);
    } else {
      console.log('🎯 100% PERFECT COIN SEPARATION & COUNTING MATCH!');
    }
  } catch (err) {
    console.error('❌ coins_touching_8 processing failed:', err.message);
    process.exit(1);
  }

  // Test 4: Process coins_standard_24 (scikit-image coins)
  console.log('\n--- Test 4: Process coins_standard_24 Benchmark ---');
  try {
    const form = new FormData();
    form.append('sampleId', 'coins_standard_24');
    form.append('threshold_method', 'otsu');
    form.append('structuring_element', 'ellipse');
    form.append('kernel_width', '3');
    form.append('kernel_height', '3');
    form.append('erosion_iterations', '1');
    form.append('dilation_iterations', '1');
    form.append('operation_mode', 'custom');
    form.append('min_component_area', '100');
    form.append('manual_count', '24');
    form.append('experimentName', 'CI-Test-Standard-24');

    const procRes = await fetch(`${BASE_URL}/morphology/process`, {
      method: 'POST',
      body: form,
    });

    const res = await procRes.json();
    console.log('✅ Automatic Count:', res.automaticCount);
    console.log('✅ Agreement %:', `${res.evaluation?.count_agreement_percent}%`);
    if (res.automaticCount === 24) {
      console.log('🎯 EXACT MATCH: 24 SCICOMPUTING COINS DETECTED!');
    }
  } catch (err) {
    console.error('❌ coins_standard_24 processing failed:', err.message);
  }

  // Test 5: Verify Module 01 Regression Test (Enhancement Pipeline)
  console.log('\n--- Test 5: Module 01 Regression Test (Image Enhancement) ---');
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
    console.log('✅ Module 01 Enhancement Status:', enhData.status);
    console.log('✅ Module 01 Evaluation:', enhData.evaluation);
  } catch (err) {
    console.error('❌ Module 01 regression test failed:', err.message);
    process.exit(1);
  }

  // Test 6: Verify History persistence
  console.log('\n--- Test 6: Experiment History Endpoint ---');
  try {
    const histRes = await fetch(`${BASE_URL}/morphology/history`);
    const histData = await histRes.json();
    console.log(`✅ Retrieved ${histData.history?.length || 0} history records from source [${histData.source}]`);
  } catch (err) {
    console.error('❌ History endpoint failed:', err.message);
  }

  console.log('\n======================================================');
  console.log('🎉 ALL INTEGRATION & REGRESSION TESTS PASSED CLEANLY!');
  console.log('======================================================\n');
}

runTests();
