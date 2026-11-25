import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const pyExe = path.join(root, 'opencv-service', 'venv', 'Scripts', 'python.exe');

async function runBenchmarkSuite() {
  const py = spawn(pyExe, ['-u', '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8030', '--app-dir', path.join(root, 'opencv-service')], { stdio: 'pipe' });
  const node = spawn('node', ['server.js'], { cwd: __dirname, env: { ...process.env, PORT: '5030', OPENCV_SERVICE_URL: 'http://127.0.0.1:8030' }, stdio: 'pipe' });

  await new Promise((r) => setTimeout(r, 3500));
  const BASE = 'http://127.0.0.1:5030/api';

  try {
    console.log('================================================================================');
    console.log('MODULE 02: MORPHOLOGICAL OBJECT SEPARATION – BENCHMARK VALIDATION SUITE');
    console.log('================================================================================');
    const s2Res = await fetch(`${BASE}/morphology/samples`);
    const s2 = await s2Res.json();

    const m2Rows = [];
    for (const samp of s2.samples) {
      const p = samp.recommendedParams || {};
      const fm = new FormData();
      fm.append('sampleId', samp.id);
      fm.append('thresholdMethod', p.thresholdMethod || 'otsu');
      fm.append('polarity', p.polarity || 'bright_on_dark');
      fm.append('structuringElement', p.structuringElement || 'ellipse');
      fm.append('kernelWidth', String(p.kernelWidth || 3));
      fm.append('kernelHeight', String(p.kernelHeight || 3));
      fm.append('erosionIterations', String(p.erosionIterations || 2));
      fm.append('dilationIterations', String(p.dilationIterations || 2));
      fm.append('operationMode', p.operationMode || 'custom');
      fm.append('minComponentArea', String(p.minComponentArea || 50));
      if (samp.manualCount != null) fm.append('manualCount', String(samp.manualCount));

      const res = await fetch(`${BASE}/morphology/process`, { method: 'POST', body: fm });
      const data = await res.json();
      const gt = samp.manualCount;
      const pred = data.automaticCount;
      const err = gt != null ? Math.abs(pred - gt) : null;
      const agree = gt != null ? Math.max(0, (1 - err / Math.max(gt, 1)) * 100).toFixed(1) : 'N/A';
      m2Rows.push({
        id: samp.id,
        dims: samp.dimensions,
        gt: gt ?? 'N/A',
        pred,
        err: err ?? 'N/A',
        agree: agree === 'N/A' ? 'N/A' : `${agree}%`,
        method: data.parameters?.threshold_method,
        pol: data.diagnostics?.effective_polarity || data.parameters?.polarity,
        fg: `${data.histograms?.binary_stats?.foregroundPercentage ?? 0}%`,
        ms: `${data.processingTimeMs}ms`,
        status: gt == null ? 'PROCESSED' : err === 0 ? 'EXACT' : 'DISPARITY',
      });
    }
    console.table(m2Rows);

    console.log('\n================================================================================');
    console.log('MODULE 03: WATERSHED SEGMENTATION – BENCHMARK VALIDATION SUITE');
    console.log('================================================================================');
    const s3Res = await fetch(`${BASE}/watershed/samples`);
    const s3 = await s3Res.json();

    const m3Rows = [];
    for (const samp of s3.samples) {
      const p = samp.recommendedParams || {};
      const fw = new FormData();
      fw.append('sampleId', samp.id);
      fw.append('blurMethod', p.blurMethod || 'gaussian');
      fw.append('blurKernel', String(p.blurKernel || 5));
      fw.append('thresholdMethod', p.thresholdMethod || 'otsu');
      fw.append('polarity', p.polarity || 'bright_on_dark');
      fw.append('structuringElement', p.structuringElement || 'ellipse');
      fw.append('openingKernelSize', String(p.openingKernelSize || 3));
      fw.append('openingIterations', String(p.openingIterations || 2));
      fw.append('distMaskSize', String(p.distMaskSize || 5));
      fw.append('fgThresholdFactor', String(p.fgThresholdFactor || 0.5));
      fw.append('bgDilationIterations', String(p.bgDilationIterations || 3));
      fw.append('connectivity', String(p.connectivity || 8));
      fw.append('minRegionArea', String(p.minRegionArea || 50));
      if (samp.manualCount != null) fw.append('manualCount', String(samp.manualCount));

      const res = await fetch(`${BASE}/watershed/process`, { method: 'POST', body: fw });
      const data = await res.json();
      const gt = samp.manualCount;
      const pred = data.automaticCount;
      const err = gt != null ? Math.abs(pred - gt) : null;
      const agree = gt != null ? Math.max(0, (1 - err / Math.max(gt, 1)) * 100).toFixed(1) : 'N/A';
      m3Rows.push({
        id: samp.id,
        dims: samp.dimensions,
        gt: gt ?? 'N/A',
        seeds: data.diagnostics?.markers_generated ?? '?',
        pred,
        err: err ?? 'N/A',
        agree: agree === 'N/A' ? 'N/A' : `${agree}%`,
        method: data.parameters?.threshold_method,
        pol: data.diagnostics?.effective_polarity || data.parameters?.polarity,
        fg: `${data.histograms?.binary_stats?.foregroundPercentage ?? 0}%`,
        ms: `${data.processingTimeMs}ms`,
        status: gt == null ? 'PROCESSED' : err === 0 ? 'EXACT' : 'DISPARITY',
      });
    }
    console.table(m3Rows);
  } finally {
    try { py.kill(); } catch {}
    try { node.kill(); } catch {}
  }
}

runBenchmarkSuite().catch((e) => {
  console.error(e);
  process.exit(1);
});

