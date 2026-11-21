# PixelLab OpenCV Processing Service

FastAPI-powered Python computer vision microservice for PixelLab Digital Image Processing Studio.

## Architecture

- **FastAPI**: Asynchronous high-performance REST API.
- **OpenCV (`opencv-python-headless`)**: Gaussian smoothing convolution, gamma lookup tables (LUT), unsharp masking, and 256-bin channel histograms.
- **scikit-image (`skimage.metrics`)**: High-accuracy Structural Similarity Index (SSIM).
- **NumPy**: Mean Squared Error (MSE), Peak Signal-to-Noise Ratio (PSNR), matrix transformations.

## Setup & Running Locally

```bash
# 1. Create Python virtual environment
python -m venv venv

# 2. Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 3. Install requirements
pip install -r requirements.txt

# 4. Start the service
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

## API Endpoints

- `GET /health`: Health-check endpoint verifying service status.
- `POST /process/enhancement`: Executes the Gaussian + Gamma + Unsharp Masking enhancement pipeline, calculates 256-bin histograms, and evaluates reference-based or differential MSE, PSNR, and SSIM metrics.

