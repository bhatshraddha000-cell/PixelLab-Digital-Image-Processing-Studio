# PixelLab – Digital Image Processing Studio

> **"Explore Images. Process Intelligence. Discover Results."**

PixelLab is a full-stack, scientific-grade Digital Image Processing web application engineered with modern computer vision capabilities. It combines an interactive React dashboard with an Express.js orchestration backend and a dedicated Python OpenCV microservice.

---

## 🏛️ System Architecture

```text
                                 [ Browser Client ]
                                (React 19 + Vite 8)
                                 http://localhost:5173
                                         │
                                         ▼ (HTTP / API Proxy)
                             [ Express.js Backend API ]
                                 http://localhost:5000
                                   │               │
                  (Multipart Proxy)│               │ (Mongoose ODM)
                                   ▼               ▼
                       [ Python OpenCV Service ]  [ MongoDB ]
                         FastAPI + NumPy + SciPy   localhost:27017/pixellab
                         http://127.0.0.1:8000
```

---

## 📁 Repository Structure

```text
PixelLab-Digital-Image-Processing-Studio/
├── .gitignore
├── package.json                         # Unified development scripts
├── run_dev.bat                          # One-click Windows development launcher (CMD)
├── run_dev.ps1                          # One-click Windows development launcher (PowerShell)
├── README.md                            # Comprehensive project guide
├── SAMPLE_IMAGES.md                     # Benchmark dataset documentation
│
├── frontend/                            # React.js + Vite Client
│   ├── index.html                       # HTML entry with aperture favicon & typography
│   ├── package.json                     # Frontend dependencies (React 19, Recharts, KaTeX, jsPDF)
│   ├── vite.config.js                   # Reverse proxy configuration to port 5000
│   ├── tailwind.config.js               # Scientific laboratory dark/light styling tokens
│   ├── postcss.config.js
│   ├── public/
│   │   └── samples/                     # Built-in benchmark PNG assets
│   └── src/
│       ├── main.jsx                     # Application entry point
│       ├── App.jsx                      # Router & ThemeProvider setup
│       ├── index.css                    # KaTeX stylesheet, global contrast rules, scrollbars
│       ├── context/
│       │   └── ThemeContext.jsx         # Persistent Light / Dark mode manager
│       ├── services/
│       │   └── api.js                   # Reusable API client (Express + OpenCV proxy)
│       ├── utils/
│       │   └── exportUtils.js           # CSV, JSON, and professional PDF generation (jsPDF)
│       ├── components/
│       │   ├── Navbar.jsx               # Navigation bar with multi-service health indicators
│       │   ├── Footer.jsx               # Scientific footer
│       │   ├── HeroSection.jsx          # Landing hero banner
│       │   ├── HeroPipeline.jsx         # 4-stage pipeline architectural diagram
│       │   ├── StatsSection.jsx         # Overview metric cards
│       │   ├── ModuleCard.jsx           # Clickable module card component
│       │   ├── AboutSection.jsx         # 4 core DIP domain summaries
│       │   ├── ThemeToggle.jsx          # Dark / Light theme toggle switch
│       │   ├── MathFormula.jsx          # Publication-grade KaTeX equation renderer
│       │   ├── ImageSplitSlider.jsx     # Interactive before/after split viewer
│       │   ├── HistogramViewer.jsx      # Recharts 256-bin dual histogram visualizer
│       │   └── illustrations/           # Custom SVG laboratory graphics
│       └── pages/
│           ├── Home.jsx                 # Studio homepage (/)
│           ├── EnhancementPage.jsx      # Full Module 01 workspace & theory (/modules/enhancement)
│           ├── MorphologyPage.jsx       # Module 02 theory & blueprint (/modules/morphology)
│           ├── WatershedPage.jsx        # Module 03 theory & blueprint (/modules/watershed)
│           ├── ClassificationPage.jsx   # Module 04 theory & blueprint (/modules/classification)
│           └── NotFound.jsx             # 404 Route handler (*)
│
├── backend/                             # Express.js Orchestration Backend
│   ├── server.js                        # Express server entry point (Port 5000)
│   ├── package.json                     # Backend dependencies (express, multer, mongoose, cors)
│   ├── .env                             # Environment configuration
│   ├── .env.example                     # Environment template
│   ├── uploads/                         # Local storage for experiment images
│   ├── samples/                         # Local benchmark sample images
│   ├── config/
│   │   └── db.js                        # Mongoose connector with non-blocking error handling
│   ├── models/
│   │   └── Experiment.js                # Mongoose schema for saved DIP experiments
│   ├── controllers/
│   │   └── enhancementController.js     # Upload validation, OpenCV proxy, history management
│   └── routes/
│       ├── healthRoutes.js              # Granular health monitor (Express, Mongo, OpenCV)
│       └── enhancementRoutes.js         # Enhancement processing & history endpoints
│
└── opencv-service/                      # Python OpenCV FastAPI Microservice
    ├── requirements.txt                 # Python dependencies (fastapi, opencv, numpy, skimage)
    ├── README.md                        # Microservice documentation
    ├── test_service.py                  # Integration test suite
    ├── samples/
    │   └── generate_samples.py          # Benchmark image generator script
    └── app/
        ├── __init__.py
        ├── main.py                      # FastAPI app entry with /health and /process/enhancement
        ├── enhancement.py               # Gaussian filter, Gamma LUT, Unsharp Mask, 256-bin hists
        ├── metrics.py                   # MSE, PSNR, SSIM, reference delta calculations
        └── utils.py                     # Buffer decoding, Base64 conversion, metadata validation
```

---

## 🚀 Windows Setup & Execution Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (Installed: v24.x)
- **Python**: v3.10 or v3.11 (Installed: v3.11.9)
- **MongoDB**: Optional for development (runs with automatic in-memory fallback if MongoDB is not running locally).

---

### Step 1: Install Dependencies

#### Frontend (React):
```powershell
cd frontend
npm install
cd ..
```

#### Backend (Node.js / Express):
```powershell
cd backend
npm install
cd ..
```

#### OpenCV Service (Python):
```powershell
cd opencv-service
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

---

### Step 2: Running All Three Services

#### Method A: One-Click Windows Launcher (Recommended)
Simply double-click `run_dev.bat` in the project root, or execute via PowerShell:
```powershell
.\run_dev.ps1
```

#### Method B: Individual Terminals

**Terminal 1 — Python OpenCV Service:**
```powershell
cd opencv-service
.\venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — Express Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 3 — Vite Frontend:**
```powershell
cd frontend
npm run dev
```

---

## 🩺 Service Endpoints

| Service | Port | Base URL | Health Check |
| :--- | :--- | :--- | :--- |
| **Frontend Client** | `5173` | `http://localhost:5173` | Application UI |
| **Express Backend** | `5000` | `http://localhost:5000` | `http://localhost:5000/api/health` |
| **OpenCV Microservice** | `8000` | `http://127.0.0.1:8000` | `http://127.0.0.1:8000/health` |

---

## 🔬 Image Enhancement Module Specifications

- **Location**: Accessible via `/modules/enhancement`.
- **Core Pipeline**:
  1. **Gaussian Convolution**: Isotropic 2D smoothing ($3\times3$ to $31\times31$), adjustable $\sigma$ ($0.0–5.0$ or Auto).
  2. **Gamma Transformation**: Power-law mapping ($s = 255 \cdot (r/255)^\gamma$), pre-computed 256-element uint8 LUT.
  3. **Optional Unsharp Masking**: High-pass difference amplification ($0.0–2.0$).
- **Sample Datasets**: 5 benchmark pairs with ground-truth clean images documented in `SAMPLE_IMAGES.md`.
- **Quantitative Metrics**: MSE, PSNR (dB), SSIM computed using NumPy and scikit-image against paired reference ground-truth.
- **Histograms**: Real 256-bin intensity frequency graphs with RGB and Luminance channel isolation.
- **Exports**: Instant PNG download, structured CSV metrics, JSON configurations, and academic PDF reports with visual charts.
