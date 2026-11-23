import assert from 'assert';

const BASE_URL = 'http://127.0.0.1:5000';

async function testWatershedStages() {
  console.log('🧪 Verifying all 10 Watershed stages from API response...');

  const form = new FormData();
  form.append('sampleId', 'coins_lightly_touching');

  const res = await fetch(`${BASE_URL}/api/watershed/process`, {
    method: 'POST',
    body: form,
  });

  assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
  const data = await res.json();
  assert.strictEqual(data.status, 'success');
  assert(data.images, 'Response missing images map');

  const requiredStages = [
    { key: 'original', alias: 'originalImage', label: '1. Original Coin Image' },
    { key: 'grayscale', alias: 'grayscaleImage', label: '2. Grayscale Image' },
    { key: 'binary', alias: 'binaryImage', label: '3. Binary Threshold Image' },
    { key: 'opened', alias: 'openingImage', label: '4. Morphological Opening' },
    { key: 'distance_heatmap', alias: 'distanceTransformImage', label: '5. Distance Transform' },
    { key: 'sure_fg', alias: 'sureForegroundImage', label: '6. Sure Foreground' },
    { key: 'sure_bg', alias: 'sureBackgroundImage', label: '7. Sure Background' },
    { key: 'unknown', alias: 'unknownRegionImage', label: '8. Unknown Region' },
    { key: 'markers_vis', alias: 'markerVisualizationImage', label: '9. Marker Visualization' },
    { key: 'boundary_overlay', alias: 'segmentedImage', label: '10. Watershed Segmentation' },
  ];

  for (const stg of requiredStages) {
    const imgVal = data.images[stg.key] || data.images[stg.alias];
    assert(imgVal, `Stage ${stg.label} (${stg.key} / ${stg.alias}) is missing or falsy in response`);
    assert(typeof imgVal === 'string' && imgVal.length > 50, `Stage ${stg.label} image value is invalid`);
    console.log(`✅ Stage verified: ${stg.label} -> Present (Data length: ${imgVal.length} chars)`);
  }

  console.log('\n🎉 ALL 10 WATERSHED STAGE OUTPUTS VERIFIED AND ACCESSIBLE!\n');
}

testWatershedStages().catch((err) => {
  console.error('❌ Watershed stages test failed:', err);
  process.exit(1);
});

