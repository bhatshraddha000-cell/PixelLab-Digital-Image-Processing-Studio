import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  const backendUrl = 'http://127.0.0.1:5000';
  const opencvUrl = 'http://127.0.0.1:8000';

  console.log('Testing End-to-End Integration...');

  // 1. Health check Express
  try {
    const healthRes = await fetch(`${backendUrl}/api/health`);
    const healthData = await healthRes.json();
    console.log('HEALTH CHECK RESULT:', JSON.stringify(healthData, null, 2));
  } catch (e) {
    console.error('Express health check failed:', e.message);
  }

  // 2. Process sample enhancement through Express
  try {
    const formData = new FormData();
    formData.append('sampleId', 'coins_objects');
    formData.append('kernel_size', '5');
    formData.append('sigma', '1.2');
    formData.append('gamma', '1.1');
    formData.append('sharpening', '0.4');
    formData.append('experimentName', 'Integration-Test-Coins');

    const procRes = await fetch(`${backendUrl}/api/enhancement/process`, {
      method: 'POST',
      body: formData,
    });

    console.log('ENHANCEMENT PROCESS STATUS:', procRes.status);
    const procData = await procRes.json();
    console.log('EVALUATION:', procData.evaluation);
    console.log('PROCESSING TIME:', procData.processingTimeMs, 'ms');
    console.log('HISTOGRAM BINS:', procData.histograms?.enhanced?.bins?.length);
  } catch (e) {
    console.error('Enhancement process failed:', e.message);
  }
}

runTest();

