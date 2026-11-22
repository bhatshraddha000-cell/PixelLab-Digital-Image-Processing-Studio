import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.TEST_PORT || process.env.PORT || 5000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`🧪 PIXELLAB - MODULE 04 CLASSIFICATION INTEGRATION TESTS`);
  console.log(`Target Express Server: ${BASE_URL}`);
  console.log(`======================================================\n`);

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      process.stdout.write(`TEST ${total}: ${name}... `);
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log('❌ FAILED');
      console.error(err);
      process.exit(1);
    }
  }

  // TEST 1: Health check verifying all 4 modules are ready
  await test('GET /api/health returns ready: true for all 4 modules', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.services.api.status, 'online');
    assert.strictEqual(data.services.opencv.status, 'online');

    const mod4 = data.modules.find((m) => m.id === 'classification');
    assert(mod4, 'Classification module not found in health check');
    assert.strictEqual(mod4.ready, true, 'Classification module should be marked ready: true');
  });

  // TEST 2: GET /api/classification/samples
  await test('GET /api/classification/samples returns benchmark scenes', async () => {
    const res = await fetch(`${BASE_URL}/api/classification/samples`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'success');
    assert(Array.isArray(data.samples));
    assert(data.samples.length >= 2, 'Expected at least 2 benchmark scenes');

    const s1 = data.samples.find((s) => s.id === 'test_multi_shapes_5');
    assert(s1, 'test_multi_shapes_5 not found');
    assert.strictEqual(s1.shapeCount, 5);

    const s2 = data.samples.find((s) => s.id === 'test_mixed_primitives_8');
    assert(s2, 'test_mixed_primitives_8 not found');
    assert.strictEqual(s2.shapeCount, 8);
  });

  // TEST 3: GET /api/classification/dataset
  await test('GET /api/classification/dataset returns category sample breakdown', async () => {
    const res = await fetch(`${BASE_URL}/api/classification/dataset`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'success');
    assert(data.dataset, 'dataset property missing');
    assert(data.dataset.total_samples >= 100, `Expected at least 100 samples, got ${data.dataset.total_samples}`);

    const expectedCats = ['circle', 'triangle', 'square', 'rectangle', 'ellipse'];
    for (const cat of expectedCats) {
      assert(data.dataset.counts[cat] >= 20, `Category ${cat} count too low: ${data.dataset.counts[cat]}`);
    }
  });

  // TEST 4: POST /api/classification/train
  await test('POST /api/classification/train trains genuine KNN model with hold-out evaluation', async () => {
    const res = await fetch(`${BASE_URL}/api/classification/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        k: 3,
        testRatio: 0.25,
        features: ['compactness', 'circularity', 'rectangularity', 'aspect_ratio', 'vertices'],
      }),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'success');
    assert(data.model, 'Missing model info');
    const metrics = data.model.metrics || {};
    assert(metrics.accuracy >= 0.85, `Accuracy too low: ${metrics.accuracy}`);
    assert(metrics.confusion_matrix || metrics.confusionMatrix, 'Confusion matrix missing');
    const errVal = metrics.classification_error ?? metrics.classificationError ?? (1.0 - metrics.accuracy);
    console.log(`(Trained Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%, Error: ${(errVal * 100).toFixed(1)}%)`);
  });

  // TEST 5: POST /api/classification/process on test_multi_shapes_5 (5 Shapes Benchmark)
  let expId = null;
  await test('POST /api/classification/process on test_multi_shapes_5 segments 5 distinct objects', async () => {
    const formData = new FormData();
    formData.append('sampleId', 'test_multi_shapes_5');
    formData.append('thresholdMethod', 'otsu');
    formData.append('polarity', 'bright_on_dark');
    formData.append('blurKernel', '3');
    formData.append('minObjectArea', '80');
    formData.append('kNeighbors', '3');
    formData.append('experimentName', 'Integration-Test-5-Shapes');

    const res = await fetch(`${BASE_URL}/api/classification/process`, {
      method: 'POST',
      body: formData,
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'success');
    assert(data.data, 'Missing result data');

    expId = data.data.id;
    assert.strictEqual(data.data.total_detected_objects, 5, `Expected 5 objects, detected ${data.data.total_detected_objects}`);
    assert(Array.isArray(data.data.objects), 'objects should be an array');
    assert.strictEqual(data.data.objects.length, 5);

    // Verify all 5 academic descriptors for each object
    for (const obj of data.data.objects) {
      assert(typeof obj.id === 'number', 'Missing id');
      assert(obj.area > 50, `Area must be positive, got ${obj.area}`);
      assert(obj.perimeter > 20, `Perimeter must be positive, got ${obj.perimeter}`);
      assert(obj.compactness > 0, `Compactness must be > 0, got ${obj.compactness}`);
      assert(obj.circularity > 0, `Circularity must be > 0, got ${obj.circularity}`);
      assert(obj.rectangularity > 0, `Rectangularity must be > 0, got ${obj.rectangularity}`);
      assert(obj.aspect_ratio > 0, `Aspect ratio must be > 0, got ${obj.aspect_ratio}`);
      assert(typeof obj.predicted_class === 'string', 'predicted_class missing');
      assert(['circle', 'triangle', 'square', 'rectangle', 'ellipse'].includes(obj.predicted_class), `Unknown class: ${obj.predicted_class}`);
    }

    // Verify multi-stage images
    assert(data.data.images.annotated, 'Missing annotated image');
    assert(data.data.images.contours, 'Missing contours image');
    assert(data.data.images.bounding_boxes, 'Missing bounding_boxes image');
    assert(data.data.images.binary, 'Missing binary image');
    assert(data.data.images.original, 'Missing original image');

    console.log(`(Detected classes: ${JSON.stringify(data.data.category_counts)})`);
  });

  // TEST 6: POST /api/classification/process on test_mixed_primitives_8 (8 Shapes Benchmark)
  await test('POST /api/classification/process on test_mixed_primitives_8 segments 8 objects', async () => {
    const formData = new FormData();
    formData.append('sampleId', 'test_mixed_primitives_8');
    formData.append('thresholdMethod', 'otsu');
    formData.append('polarity', 'bright_on_dark');
    formData.append('minObjectArea', '80');
    formData.append('kNeighbors', '3');

    const res = await fetch(`${BASE_URL}/api/classification/process`, {
      method: 'POST',
      body: formData,
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'success');
    assert.strictEqual(data.data.total_detected_objects, 8, `Expected 8 objects, detected ${data.data.total_detected_objects}`);
    console.log(`(Detected 8 shapes successfully: ${JSON.stringify(data.data.category_counts)})`);
  });

  // TEST 7: GET /api/classification/history and GET by ID
  await test('GET /api/classification/history retrieves saved experiment record', async () => {
    const res = await fetch(`${BASE_URL}/api/classification/history`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'success');
    assert(data.data.length >= 1, 'Expected at least 1 historical experiment');

    if (expId) {
      const getRes = await fetch(`${BASE_URL}/api/classification/history/${expId}`);
      assert.strictEqual(getRes.status, 200);
      const single = await getRes.json();
      assert.strictEqual(single.status, 'success');
      assert.strictEqual(single.data.name, 'Integration-Test-5-Shapes');
    }
  });

  console.log(`\n======================================================`);
  console.log(`🎉 ALL ${passed}/${total} MODULE 04 INTEGRATION TESTS PASSED!`);
  console.log(`======================================================\n`);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
