import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.TEST_PORT || process.env.PORT || 5000;
const API_BASE = process.env.API_BASE_URL || `http://127.0.0.1:${PORT}/api`;

const GROUND_TRUTH_15 = [
  { expected: 'circle', pos: [100, 100], desc: 'Small Circle (r=22)' },
  { expected: 'circle', pos: [250, 100], desc: 'Medium Circle (r=38)' },
  { expected: 'circle', pos: [430, 100], desc: 'Large Circle (r=50)' },
  { expected: 'triangle', pos: [620, 100], desc: 'Equilateral Triangle' },
  { expected: 'triangle', pos: [120, 260], desc: 'Rotated Right Triangle (45 deg)' },
  { expected: 'triangle', pos: [270, 260], desc: 'Rotated Isosceles Triangle (120 deg)' },
  { expected: 'square', pos: [440, 260], desc: 'Axis-Aligned Square (46x46)' },
  { expected: 'square', pos: [620, 260], desc: 'Rotated Diamond Square (45 deg)' },
  { expected: 'square', pos: [120, 420], desc: 'Rotated Square (25 deg)' },
  { expected: 'rectangle', pos: [290, 420], desc: 'Horizontal Rectangle (115x45)' },
  { expected: 'rectangle', pos: [470, 420], desc: 'Vertical Rectangle (42x110)' },
  { expected: 'rectangle', pos: [650, 420], desc: 'Rotated Rectangle (35 deg)' },
  { expected: 'ellipse', pos: [200, 530], desc: 'Horizontal Ellipse (50x26)' },
  { expected: 'ellipse', pos: [400, 530], desc: 'Vertical Ellipse (55x25)' },
  { expected: 'ellipse', pos: [600, 530], desc: 'Rotated Ellipse (45 deg)' },
];

async function runValidation() {
  console.log('='.repeat(70));
  console.log('PIXELLAB E2E API VALIDATION: 15 INDEPENDENT SHAPES BENCHMARK');
  console.log('='.repeat(70));

  const form = new FormData();
  form.append('sampleId', 'test_validation_15_shapes');
  form.append('thresholdMethod', 'otsu');
  form.append('polarity', 'bright_on_dark');
  form.append('blurKernel', '3');
  form.append('morphOperation', 'none');
  form.append('minObjectArea', '80');
  form.append('kNeighbors', '3');

  console.log(`Sending POST request to: ${API_BASE}/classification/process ...`);
  const res = await fetch(`${API_BASE}/classification/process`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`API Error (${res.status}): ${err}`);
    process.exit(1);
  }

  const data = await res.json();
  const objects = data.data?.objects || data.results?.objects || data.objects || [];

  console.log(`Response received! Total detected objects: ${objects.length} / 15 expected\n`);

  let correctCount = 0;
  const categories = ['circle', 'triangle', 'square', 'rectangle', 'ellipse'];
  const cm = {
    circle: { circle: 0, triangle: 0, square: 0, rectangle: 0, ellipse: 0 },
    triangle: { circle: 0, triangle: 0, square: 0, rectangle: 0, ellipse: 0 },
    square: { circle: 0, triangle: 0, square: 0, rectangle: 0, ellipse: 0 },
    rectangle: { circle: 0, triangle: 0, square: 0, rectangle: 0, ellipse: 0 },
    ellipse: { circle: 0, triangle: 0, square: 0, rectangle: 0, ellipse: 0 },
  };

  const results = [];

  for (const gt of GROUND_TRUTH_15) {
    const [gx, gy] = gt.pos;
    let closest = null;
    let minDist = Infinity;

    for (const obj of objects) {
      const [cx, cy] = obj.centroid;
      const dist = Math.hypot(cx - gx, cy - gy);
      if (dist < minDist) {
        minDist = dist;
        closest = obj;
      }
    }

    const pred = closest ? (closest.predictedClass || closest.predicted_class) : 'none';
    const conf = closest ? Math.round((closest.neighborAgreement || closest.confidence || 0) * 100) : 0;
    const isMatch = pred === gt.expected;

    if (isMatch) correctCount++;
    if (cm[gt.expected] && cm[gt.expected][pred] !== undefined) {
      cm[gt.expected][pred]++;
    }

    results.push({
      desc: gt.desc,
      expected: gt.expected,
      predicted: pred,
      status: isMatch ? 'PASS' : 'FAIL',
      vote: `${conf}%`,
      circ: closest ? closest.circularity : 0,
      rect: closest ? closest.rectangularity : 0,
      ar: closest ? (closest.aspectRatio || closest.aspect_ratio) : 0,
      v: closest ? closest.vertices : 0,
    });
  }

  console.log(
    'Shape Description'.padEnd(32) +
    'Expected'.padEnd(12) +
    'Predicted'.padEnd(12) +
    'Status'.padEnd(8) +
    'Agreement'.padEnd(10) +
    'Circ'.padEnd(8) +
    'Rect'.padEnd(8) +
    'AR'.padEnd(8) +
    'V'
  );
  console.log('-'.repeat(96));

  for (const r of results) {
    console.log(
      r.desc.padEnd(32) +
      r.expected.padEnd(12) +
      r.predicted.padEnd(12) +
      r.status.padEnd(8) +
      r.vote.padEnd(10) +
      String(r.circ).padEnd(8) +
      String(r.rect).padEnd(8) +
      String(r.ar).padEnd(8) +
      String(r.v)
    );
  }

  console.log('-'.repeat(96));
  const accuracy = ((correctCount / GROUND_TRUTH_15.length) * 100).toFixed(1);
  console.log(`\nOverall E2E Validation Accuracy: ${correctCount} / ${GROUND_TRUTH_15.length} (${accuracy}%)\n`);

  console.log('Confusion Matrix (Expected rows x Predicted columns):');
  console.log('            ' + categories.map((c) => c.slice(0, 4).padStart(7)).join(''));
  for (const cat of categories) {
    const row = categories.map((c) => String(cm[cat][c]).padStart(7)).join('');
    console.log(`${cat.padEnd(12)}${row}`);
  }

  if (correctCount === GROUND_TRUTH_15.length) {
    console.log('\nSUCCESS: All 15 validation shapes classified correctly with 100% precision!');
    process.exit(0);
  } else {
    console.error(`\nFAILED: ${GROUND_TRUTH_15.length - correctCount} shapes misclassified.`);
    process.exit(1);
  }
}

runValidation().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
