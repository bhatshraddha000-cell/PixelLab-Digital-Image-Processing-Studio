import assert from 'assert';

const BASE_URL = 'http://127.0.0.1:5000';

async function testClassificationDescriptors() {
  console.log('🧪 Verifying Classification API descriptors, predictions, and contract...');

  const form = new FormData();
  form.append('sampleId', 'test_multi_shapes_5');

  const res = await fetch(`${BASE_URL}/api/classification/process`, {
    method: 'POST',
    body: form,
  });

  assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
  const json = await res.json();
  assert.strictEqual(json.status, 'success');
  const data = json.data;
  assert(data, 'Response missing data object');
  assert(Array.isArray(data.objects), 'data.objects should be an array');
  assert(data.objects.length >= 5, `Expected at least 5 objects, got ${data.objects.length}`);

  const requiredDescriptors = [
    'area',
    'perimeter',
    'compactness',
    'circularity',
    'rectangularity',
    'aspect_ratio',
    'vertices',
    'predictedClass',
    'predicted_class',
  ];

  for (const obj of data.objects) {
    for (const desc of requiredDescriptors) {
      assert(obj[desc] !== undefined && obj[desc] !== null, `Object #${obj.id} missing descriptor '${desc}'`);
    }

    // Verify mathematical bounds
    assert(obj.area > 0, `Object #${obj.id} area must be positive`);
    assert(obj.perimeter > 0, `Object #${obj.id} perimeter must be positive`);
    assert(obj.compactness > 0, `Object #${obj.id} compactness must be positive`);
    assert(obj.circularity > 0, `Object #${obj.id} circularity must be positive`);
    assert(obj.rectangularity > 0 && obj.rectangularity <= 1.2, `Object #${obj.id} rectangularity out of bounds: ${obj.rectangularity}`);

    // Verify circularity and compactness reciprocity within rounding
    const product = obj.circularity * obj.compactness;
    assert(Math.abs(product - 1.0) < 0.05, `Circularity (${obj.circularity}) * Compactness (${obj.compactness}) should equal ~1.0, got ${product}`);

    console.log(`✅ Object #${obj.id}: Class='${obj.predictedClass}' (${Math.round(obj.confidence * 100)}%), A=${obj.area}, P=${obj.perimeter}, C=${obj.circularity}, K=${obj.compactness}, R=${obj.rectangularity}`);
  }

  // Verify all 7 intermediate image layers are returned
  const requiredLayers = ['original', 'grayscale', 'binary', 'extracted_objects', 'contours', 'bounding_boxes', 'annotated'];
  for (const layer of requiredLayers) {
    assert(data.images[layer], `Image layer '${layer}' missing from classification response`);
  }

  console.log('\n🎉 ALL 5 MANDATORY GEOMETRICAL DESCRIPTORS AND 7 IMAGE LAYERS VERIFIED!\n');
}

testClassificationDescriptors().catch((err) => {
  console.error('❌ Classification descriptors test failed:', err);
  process.exit(1);
});

