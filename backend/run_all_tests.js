import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const pythonExe = path.join(rootDir, 'opencv-service', 'venv', 'Scripts', 'python.exe');

console.log('🚀 Launching Python OpenCV microservice & Express backend...');

// 1. Spawn Python uvicorn
const pyProcess = spawn(
  pythonExe,
  ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'],
  {
    cwd: path.join(rootDir, 'opencv-service'),
    stdio: 'pipe',
  }
);

pyProcess.stdout.on('data', (d) => {
  console.log('[Python stdout]:', d.toString().trim());
});

pyProcess.stderr.on('data', (d) => {
  console.log('[Python stderr]:', d.toString().trim());
});

// 2. Spawn Express backend
const nodeProcess = spawn('node', ['server.js'], {
  cwd: __dirname,
  env: { ...process.env, PORT: '5000' },
  stdio: 'pipe',
});

nodeProcess.stdout.on('data', (d) => {
  console.log('[Node stdout]:', d.toString().trim());
});

nodeProcess.stderr.on('data', (d) => {
  console.log('[Node stderr]:', d.toString().trim());
});

function cleanup() {
  console.log('\n🧹 Cleaning up test processes...');
  try {
    pyProcess.kill('SIGTERM');
  } catch { }
  try {
    nodeProcess.kill('SIGTERM');
  } catch { }
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

// Poll for health
let ready = false;
for (let i = 0; i < 20; i++) {
  await new Promise((r) => setTimeout(r, 800));
  try {
    const pyRes = await fetch('http://127.0.0.1:8000/health');
    const nodeRes = await fetch('http://127.0.0.1:5000/api/health');
    if (pyRes.ok && nodeRes.ok) {
      ready = true;
      break;
    }
  } catch { }
}

if (!ready) {
  console.error('❌ Failed to connect to services within 16s.');
  cleanup();
  process.exit(1);
}

console.log('✅ Both microservices online! Running Module 02 & Module 03 test suites...\n');

try {
  const { spawnSync } = await import('child_process');

  console.log('▶️ Running Module 02 (Morphology) Suite...');
  const testRun2 = spawnSync('node', ['test_morphology_integration.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, TEST_PORT: '5000' },
  });

  if (testRun2.status !== 0) {
    console.error('❌ Module 02 test suite failed!');
    cleanup();
    process.exit(testRun2.status || 1);
  }

  console.log('\n▶️ Running Module 03 (Watershed) Suite...');
  const testRun3 = spawnSync('node', ['test_watershed_integration.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, TEST_PORT: '5000' },
  });

  if (testRun3.status !== 0) {
    console.error('❌ Module 03 test suite failed!');
    cleanup();
    process.exit(testRun3.status || 1);
  }

  console.log('\n▶️ Running Module 04 (Classification) Suite...');
  const testRun4 = spawnSync('node', ['test_classification_integration.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, TEST_PORT: '5000' },
  });

  cleanup();
  process.exit(testRun4.status || 0);
} catch (err) {
  console.error('Test execution error:', err);
  cleanup();
  process.exit(1);
}
