import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const pythonExe = path.join(rootDir, 'opencv-service', 'venv', 'Scripts', 'python.exe');

console.log('🚀 Checking status of microservices...');

// Check if services are already running
let pyAlreadyRunning = false;
let nodeAlreadyRunning = false;
try {
  const pyRes = await fetch('http://127.0.0.1:8000/health');
  if (pyRes.ok) pyAlreadyRunning = true;
} catch { }

try {
  const nodeRes = await fetch('http://127.0.0.1:5000/api/health');
  if (nodeRes.ok) nodeAlreadyRunning = true;
} catch { }

let pyProcess = null;
let nodeProcess = null;

if (!pyAlreadyRunning) {
  console.log('Spawning Python uvicorn microservice...');
  pyProcess = spawn(
    pythonExe,
    ['-u', '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000', '--app-dir', path.join(rootDir, 'opencv-service')],
    {
      cwd: path.join(rootDir, 'opencv-service'),
      env: { ...process.env, PYTHONUNBUFFERED: '1', PYTHONPATH: path.join(rootDir, 'opencv-service') },
      stdio: 'pipe',
    }
  );
  pyProcess.stdout.on('data', (d) => console.log('[Python stdout]:', d.toString().trim()));
  pyProcess.stderr.on('data', (d) => console.log('[Python stderr]:', d.toString().trim()));
} else {
  console.log('⚡ Python OpenCV service already running on port 8000');
}

if (!nodeAlreadyRunning) {
  console.log('Spawning Express backend...');
  nodeProcess = spawn('node', ['server.js'], {
    cwd: __dirname,
    env: { ...process.env, PORT: '5000' },
    stdio: 'pipe',
  });
  nodeProcess.stdout.on('data', (d) => console.log('[Node stdout]:', d.toString().trim()));
  nodeProcess.stderr.on('data', (d) => console.log('[Node stderr]:', d.toString().trim()));
} else {
  console.log('⚡ Express backend already running on port 5000');
}

let cleanedUp = false;
function cleanup() {
  if (cleanedUp) return;
  cleanedUp = true;
  console.log('\n🧹 Cleaning up test processes...');
  if (pyProcess) {
    try { pyProcess.kill(); } catch { }
    pyProcess = null;
  }
  if (nodeProcess) {
    try { nodeProcess.kill(); } catch { }
    nodeProcess = null;
  }
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Poll for health
let ready = false;
let activePort = 5000;

for (let i = 0; i < 25; i++) {
  if (i > 0) await new Promise((r) => setTimeout(r, 800));
  try {
    const pyRes = await fetch('http://127.0.0.1:8000/health');
    let nodeRes = null;
    try {
      nodeRes = await fetch('http://127.0.0.1:5000/api/health');
      if (nodeRes.ok) activePort = 5000;
    } catch {
      try {
        nodeRes = await fetch('http://127.0.0.1:5001/api/health');
        if (nodeRes.ok) activePort = 5001;
      } catch { }
    }

    if (pyRes.ok && nodeRes && nodeRes.ok) {
      ready = true;
      break;
    }
  } catch { }
}

if (!ready) {
  console.error('❌ Failed to connect to services within 20s.');
  cleanup();
  process.exit(1);
}

console.log(`✅ Both microservices online! (Express on port ${activePort}, FastAPI on 8000)`);
console.log('Running all integration and validation test suites...\n');

try {
  const { spawnSync } = await import('child_process');

  console.log('▶️ Running Module 02 (Morphology) Suite...');
  const testRun2 = spawnSync('node', ['test_morphology_integration.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, TEST_PORT: String(activePort) },
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
    env: { ...process.env, TEST_PORT: String(activePort) },
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
    env: { ...process.env, TEST_PORT: String(activePort) },
  });

  if (testRun4.status !== 0) {
    console.error('❌ Module 04 integration test suite failed!');
    cleanup();
    process.exit(testRun4.status || 1);
  }

  console.log('\n▶️ Running Module 04 (15 Shapes Validation) Suite...');
  const testRun5 = spawnSync('node', ['test_classification_15_validation.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, TEST_PORT: String(activePort), API_BASE_URL: `http://127.0.0.1:${activePort}/api` },
  });

  cleanup();
  process.exit(testRun5.status || 0);
} catch (err) {
  console.error('Test execution error:', err);
  cleanup();
  process.exit(1);
}
