import time
import json
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
from .morphology import process_morphology_pipeline
from .watershed import process_watershed_pipeline
from .classification import (
    process_classification_pipeline,
    train_knn_model,
    get_dataset_statistics,
    segment_and_extract_objects,
)
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


@app.post("/process/morphology")
async def process_morphology(
    image: UploadFile = File(..., description="Target image containing touching objects/coins"),
    threshold_method: str = Form("otsu", description="Threshold algorithm: 'otsu', 'manual', or 'adaptive'"),
    threshold_value: int = Form(127, description="Intensity threshold value for manual binarization (0-255)"),
    polarity: str = Form("bright_on_dark", description="Object polarity: 'bright_on_dark' or 'dark_on_bright'"),
    structuring_element: str = Form("ellipse", description="Structuring element shape: 'rectangle', 'ellipse', or 'cross'"),
    kernel_width: int = Form(3, description="Structuring element kernel width (odd: 3-15)"),
    kernel_height: int = Form(3, description="Structuring element kernel height (odd: 3-15)"),
    erosion_iterations: int = Form(2, description="Erosion iteration count (1-10)"),
    dilation_iterations: int = Form(1, description="Dilation iteration count (0-10)"),
    operation_mode: str = Form("custom", description="Operation mode: 'custom', 'opening', or 'erosion_only'"),
    connectivity: int = Form(8, description="Connected components neighborhood connectivity (4 or 8)"),
    min_component_area: int = Form(50, description="Minimum component area in pixels to filter out noise"),
    manual_count: Optional[int] = Form(None, description="Known manual reference count for accuracy evaluation")
):
    """
    Executes morphological object separation pipeline to sever narrow contact necks
    and count isolated circular objects via connected-component labeling.
    """
    input_bytes = await image.read()
    if not input_bytes:
        raise HTTPException(status_code=400, detail="Uploaded input image is empty.")

    try:
        input_img = decode_image_bytes(input_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to decode input image: {str(e)}")

    try:
        result = process_morphology_pipeline(
            img=input_img,
            threshold_method=threshold_method,
            threshold_value=threshold_value,
            polarity=polarity,
            structuring_element=structuring_element,
            kernel_width=kernel_width,
            kernel_height=kernel_height,
            erosion_iterations=erosion_iterations,
            dilation_iterations=dilation_iterations,
            operation_mode=operation_mode,
            connectivity=connectivity,
            min_component_area=min_component_area,
            manual_count=manual_count
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Morphological processing pipeline execution failed: {str(e)}")


@app.post("/process/watershed")
async def process_watershed(
    image: UploadFile = File(..., description="Target image containing touching or overlapping coins"),
    ground_truth_mask: Optional[UploadFile] = File(None, description="Optional ground-truth binary reference mask for IoU/Dice evaluation"),
    blur_method: str = Form("gaussian", description="Noise filtering: 'gaussian', 'median', or 'none'"),
    blur_kernel: int = Form(5, description="Blur kernel size (odd: 3, 5, 7, 9)"),
    threshold_method: str = Form("otsu", description="Thresholding algorithm: 'otsu', 'manual', or 'adaptive'"),
    threshold_value: int = Form(127, description="Threshold cutoff value for manual binarization (0-255)"),
    polarity: str = Form("bright_on_dark", description="Object polarity: 'bright_on_dark' or 'dark_on_bright'"),
    structuring_element: str = Form("ellipse", description="Structuring element shape: 'rectangle', 'ellipse', or 'cross'"),
    opening_kernel_size: int = Form(3, description="Opening kernel size (odd: 3-11)"),
    opening_iterations: int = Form(2, description="Opening iterations (1-10)"),
    dist_mask_size: int = Form(5, description="Distance transform mask size (3 or 5)"),
    fg_threshold_factor: float = Form(0.50, description="Foreground distance threshold factor (0.10 to 0.95)"),
    bg_dilation_iterations: int = Form(3, description="Background dilation iterations (1-10)"),
    connectivity: int = Form(8, description="Connected-component connectivity (4 or 8)"),
    min_region_area: int = Form(50, description="Minimum region area in pixels to filter out noise"),
    manual_count: Optional[int] = Form(None, description="Known manual reference count for accuracy evaluation"),
    manual_markers: Optional[str] = Form(None, description="Optional JSON array of manual marker seeds [{x, y, type: 'fg'|'bg', radius}]")
):
    """
    Executes Marker-Controlled Watershed Segmentation to delineate boundaries
    between touching/overlapping circular coins and determine their total count.
    """
    input_bytes = await image.read()
    if not input_bytes:
        raise HTTPException(status_code=400, detail="Uploaded input image is empty.")

    try:
        input_img = decode_image_bytes(input_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to decode input image: {str(e)}")

    gt_mask_img = None
    if ground_truth_mask is not None and ground_truth_mask.filename:
        gt_bytes = await ground_truth_mask.read()
        if gt_bytes:
            try:
                decoded_gt = decode_image_bytes(gt_bytes)
                if len(decoded_gt.shape) == 3:
                    gt_mask_img = cv2.cvtColor(decoded_gt, cv2.COLOR_BGR2GRAY)
                else:
                    gt_mask_img = decoded_gt
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to decode ground truth mask: {str(e)}")

    markers_data = None
    if manual_markers:
        try:
            markers_data = json.loads(manual_markers)
        except Exception:
            pass

    try:
        result = process_watershed_pipeline(
            img=input_img,
            ground_truth_mask=gt_mask_img,
            blur_method=blur_method,
            blur_kernel=blur_kernel,
            threshold_method=threshold_method,
            threshold_value=threshold_value,
            polarity=polarity,
            structuring_element=structuring_element,
            opening_kernel_size=opening_kernel_size,
            opening_iterations=opening_iterations,
            dist_mask_size=dist_mask_size,
            fg_threshold_factor=fg_threshold_factor,
            bg_dilation_iterations=bg_dilation_iterations,
            connectivity=connectivity,
            min_region_area=min_region_area,
            manual_count=manual_count,
            manual_markers_data=markers_data
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Watershed segmentation pipeline execution failed: {str(e)}")


@app.post("/process/classification")
async def process_classification(
    image: UploadFile = File(..., description="Target image containing geometric shapes/objects"),
    threshold_method: str = Form("otsu", description="Thresholding algorithm: 'otsu', 'manual', or 'adaptive'"),
    threshold_value: int = Form(127, description="Threshold cutoff value for manual binarization (0-255)"),
    polarity: str = Form("bright_on_dark", description="Object polarity: 'bright_on_dark' or 'dark_on_bright'"),
    blur_kernel: int = Form(3, description="Gaussian blur smoothing kernel (1, 3, 5, 7)"),
    morph_operation: str = Form("none", description="Optional cleanup operation: 'none', 'opening', or 'closing'"),
    morph_kernel_size: int = Form(3, description="Morphology structuring element size (3, 5, 7)"),
    min_object_area: int = Form(80, description="Minimum object area in pixels to eliminate noise"),
    k_neighbors: int = Form(3, description="K-Nearest Neighbors parameter (1 to 15)"),
    feature_names: Optional[str] = Form(None, description="Optional JSON array or comma-separated list of active features")
):
    """
    Executes Module 04: Region-Based Object Classification pipeline.
    Segments objects, computes all 5 academic descriptors (Area, Perimeter, Compactness,
    Circularity, Rectangularity), scales features via StandardScaler, and predicts
    classes via K-Nearest Neighbors (KNN).
    """
    input_bytes = await image.read()
    if not input_bytes:
        raise HTTPException(status_code=400, detail="Uploaded input image is empty.")

    try:
        input_img = decode_image_bytes(input_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to decode input image: {str(e)}")

    parsed_features = None
    if feature_names:
        try:
            if feature_names.startswith("["):
                parsed_features = json.loads(feature_names)
            else:
                parsed_features = [f.strip() for f in feature_names.split(",") if f.strip()]
        except Exception:
            parsed_features = None

    try:
        result = process_classification_pipeline(
            img=input_img,
            threshold_method=threshold_method,
            threshold_value=threshold_value,
            polarity=polarity,
            blur_kernel=blur_kernel,
            morph_operation=morph_operation,
            morph_kernel_size=morph_kernel_size,
            min_object_area=min_object_area,
            k_neighbors=k_neighbors,
            feature_names=parsed_features
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification pipeline execution failed: {str(e)}")


@app.post("/classification/train")
async def train_classification_model(
    k: int = Form(3, description="Number of nearest neighbors (1 to 15)"),
    test_ratio: float = Form(0.25, description="Held-out test split ratio (0.15 to 0.40)"),
    feature_names: Optional[str] = Form(None, description="Optional JSON array or comma-separated list of features to train on")
):
    """
    Trains a real K-Nearest Neighbors (KNN) classifier with StandardScaler on the
    geometric shapes dataset. Evaluates performance on held-out test split and returns
    accuracy, classification error, precision, recall, F1, and confusion matrix.
    """
    parsed_features = None
    if feature_names:
        try:
            if feature_names.startswith("["):
                parsed_features = json.loads(feature_names)
            else:
                parsed_features = [f.strip() for f in feature_names.split(",") if f.strip()]
        except Exception:
            parsed_features = None

    try:
        train_results = train_knn_model(
            k=k,
            test_ratio=test_ratio,
            feature_names=parsed_features
        )
        total_cnt = train_results.get("total_samples", train_results.get("total_dataset_samples", 0))
        return {
            "status": "success",
            "message": f"Successfully trained KNN (k={k}) on {total_cnt} samples.",
            "results": train_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model training failed: {str(e)}")


@app.get("/classification/dataset-stats")
def get_dataset_stats():
    """Returns sample counts and category breakdown for geometric dataset."""
    try:
        stats = get_dataset_statistics()
        return {
            "status": "success",
            "dataset": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve dataset statistics: {str(e)}")




