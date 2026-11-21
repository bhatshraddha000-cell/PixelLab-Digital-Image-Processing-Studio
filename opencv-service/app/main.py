import time
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from .utils import (
    decode_image_bytes,
    encode_image_to_base64,
    validate_reference_compatibility,
    get_image_metadata
)
from .enhancement import process_enhancement_pipeline
from .metrics import compute_quality_evaluation

app = FastAPI(
    title="PixelLab OpenCV Processing Service",
    description="Python FastAPI service providing OpenCV algorithms for digital image processing experiments.",
    version="1.0.0"
)

# Enable CORS for Express backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "PixelLab OpenCV Processing Service",
        "version": "1.0.0",
        "backend": "FastAPI + OpenCV + NumPy + scikit-image"
    }

@app.post("/process/enhancement")
async def enhance_image(
    image: UploadFile = File(..., description="Target noisy or low-quality input image"),
    reference_image: Optional[UploadFile] = File(None, description="Optional clean ground-truth reference image"),
    kernel_size: int = Form(5, description="Gaussian kernel size (odd: 3, 5, 7, 9, 11, 15, 21, 31)"),
    sigma: float = Form(0.0, description="Gaussian sigma standard deviation (0 for auto)"),
    gamma: float = Form(1.0, description="Gamma power-law exponent (0.1 to 3.0)"),
    sharpening: float = Form(0.0, description="Unsharp masking strength (0.0 to 2.0)")
):
    start_time = time.perf_counter()

    # 1. Read input image bytes
    input_bytes = await image.read()
    if not input_bytes:
        raise HTTPException(status_code=400, detail="Uploaded input image is empty.")

    try:
        noisy_img = decode_image_bytes(input_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to decode input image: {str(e)}")

    # 2. Read optional reference image if provided
    ref_img = None
    if reference_image is not None and reference_image.filename:
        ref_bytes = await reference_image.read()
        if ref_bytes:
            try:
                ref_img = decode_image_bytes(ref_bytes)
                is_valid, err_msg = validate_reference_compatibility(noisy_img, ref_img)
                if not is_valid:
                    raise HTTPException(status_code=422, detail=err_msg)
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to decode reference image: {str(e)}")

    # 3. Parameter validation
    allowed_kernels = [3, 5, 7, 9, 11, 15, 21, 31]
    if kernel_size not in allowed_kernels:
        # Snap to nearest valid odd kernel
        kernel_size = 5 if kernel_size < 3 else (kernel_size if kernel_size % 2 == 1 else kernel_size + 1)

    sigma = max(0.0, min(5.0, float(sigma)))
    gamma = max(0.1, min(3.0, float(gamma)))
    sharpening = max(0.0, min(2.0, float(sharpening)))

    # 4. Execute OpenCV Processing Pipeline
    try:
        pipeline_result = process_enhancement_pipeline(
            img=noisy_img,
            kernel_size=kernel_size,
            sigma=sigma,
            gamma=gamma,
            sharpening=sharpening
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image enhancement pipeline execution failed: {str(e)}")

    # 5. Calculate Quantitative Quality Metrics
    evaluation = compute_quality_evaluation(
        noisy_img=noisy_img,
        enhanced_img=pipeline_result["final_img"],
        reference_img=ref_img
    )

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    # 6. Encode resulting images to Base64 data URLs for seamless transmission
    original_b64 = encode_image_to_base64(noisy_img)
    smoothed_b64 = encode_image_to_base64(pipeline_result["smoothed_img"])
    enhanced_b64 = encode_image_to_base64(pipeline_result["final_img"])
    reference_b64 = encode_image_to_base64(ref_img) if ref_img is not None else None

    metadata = get_image_metadata(noisy_img)

    return {
        "status": "success",
        "processing_time_ms": elapsed_ms,
        "metadata": metadata,
        "parameters": pipeline_result["applied_params"],
        "images": {
            "original": original_b64,
            "smoothed": smoothed_b64,
            "enhanced": enhanced_b64,
            "reference": reference_b64
        },
        "histograms": {
            "original": pipeline_result["original_hist"],
            "smoothed": pipeline_result["smoothed_hist"],
            "enhanced": pipeline_result["enhanced_hist"]
        },
        "evaluation": evaluation
    }

