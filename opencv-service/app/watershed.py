import time
import math
from typing import Optional, Dict, Any, List, Tuple
import cv2
import numpy as np

from .utils import (
    encode_image_to_base64,
    get_image_metadata,
)

def get_structuring_element(shape_name: str, k_size: int) -> np.ndarray:
    shape_map = {
        "rectangle": cv2.MORPH_RECT,
        "rect": cv2.MORPH_RECT,
        "ellipse": cv2.MORPH_ELLIPSE,
        "disk": cv2.MORPH_ELLIPSE,
        "cross": cv2.MORPH_CROSS,
    }
    morph_shape = shape_map.get(shape_name.lower(), cv2.MORPH_ELLIPSE)
    k_size = max(3, k_size if k_size % 2 == 1 else k_size + 1)
    return cv2.getStructuringElement(morph_shape, (k_size, k_size))

def generate_distinct_colors(n: int) -> List[Tuple[int, int, int]]:
    """Generates n visually distinct colors using golden ratio HSV palette."""
    colors = []
    golden_ratio = 0.618033988749895
    hue = 0.15
    for _ in range(n):
        hue = (hue + golden_ratio) % 1.0
        h = int(hue * 180)
        s = 200
        v = 240
        bgr = cv2.cvtColor(np.uint8([[[h, s, v]]]), cv2.COLOR_HSV2BGR)[0][0]
        colors.append((int(bgr[0]), int(bgr[1]), int(bgr[2])))
    return colors

def compute_pixel_metrics(pred_binary: np.ndarray, gt_binary: np.ndarray) -> Dict[str, Any]:
    """Computes IoU, Dice coefficient, Precision, Recall, and F1."""
    if pred_binary.shape != gt_binary.shape:
        # Resize ground-truth to match if dimensions differ
        gt_binary = cv2.resize(gt_binary, (pred_binary.shape[1], pred_binary.shape[0]), interpolation=cv2.INTER_NEAREST)

    pred = pred_binary > 0
    gt = gt_binary > 0

    intersection = int(np.logical_and(pred, gt).sum())
    union = int(np.logical_or(pred, gt).sum())
    pred_sum = int(pred.sum())
    gt_sum = int(gt.sum())

    iou = round(float(intersection) / max(1, union), 4)
    dice = round(float(2 * intersection) / max(1, pred_sum + gt_sum), 4)
    precision = round(float(intersection) / max(1, pred_sum), 4)
    recall = round(float(intersection) / max(1, gt_sum), 4)
    f1 = dice

    return {
        "has_ground_truth": True,
        "iou": iou,
        "dice": dice,
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "intersection_pixels": intersection,
        "union_pixels": union,
        "gt_foreground_pixels": gt_sum,
        "pred_foreground_pixels": pred_sum,
    }

def process_watershed_pipeline(
    img: np.ndarray,
    ground_truth_mask: Optional[np.ndarray] = None,
    blur_method: str = "gaussian",
    blur_kernel: int = 5,
    threshold_method: str = "otsu",
    threshold_value: int = 127,
    polarity: str = "bright_on_dark",
    structuring_element: str = "ellipse",
    opening_kernel_size: int = 3,
    opening_iterations: int = 2,
    dist_mask_size: int = 5,
    fg_threshold_factor: float = 0.50,
    bg_dilation_iterations: int = 3,
    connectivity: int = 8,
    min_region_area: int = 50,
    manual_count: Optional[int] = None,
    manual_markers_data: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    start_time = time.perf_counter()

    # Stage 1: Preserve original & prepare 3-channel 8-bit BGR for watershed
    if len(img.shape) == 2:
        bgr_img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
        gray = img.copy()
    else:
        bgr_img = img.copy()
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    h, w = gray.shape

    # Stage 2: Noise removal / Preprocessing filter
    blur_k = max(3, blur_kernel if blur_kernel % 2 == 1 else blur_kernel + 1)
    if blur_method.lower() == "median":
        blurred = cv2.medianBlur(gray, blur_k)
    elif blur_method.lower() == "gaussian":
        blurred = cv2.GaussianBlur(gray, (blur_k, blur_k), 0.8)
    else:
        blurred = gray.copy()

    # Stage 3: Image Thresholding
    thresh_val = max(0, min(255, int(threshold_value)))
    if threshold_method.lower() == "manual":
        _, binary = cv2.threshold(blurred, thresh_val, 255, cv2.THRESH_BINARY)
    elif threshold_method.lower() == "adaptive":
        adaptive_block = max(3, blur_k if blur_k % 2 == 1 else blur_k + 1)
        if adaptive_block < 7:
            adaptive_block = 11
        binary = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, adaptive_block, 2
        )
    else:
        # Default Otsu thresholding
        _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Invert binary image if dark objects on bright background
    if polarity.lower() in ["dark_on_bright", "dark_objects"]:
        binary = cv2.bitwise_not(binary)

    # Stage 4: Morphological Opening (Remove small noise pixels)
    se_opening = get_structuring_element(structuring_element, opening_kernel_size)
    open_iters = max(1, min(10, int(opening_iterations)))
    opened = cv2.morphologyEx(binary, cv2.MORPH_OPEN, se_opening, iterations=open_iters)

    # Stage 5: Sure Background via Morphological Dilation
    bg_iters = max(1, min(10, int(bg_dilation_iterations)))
    sure_bg = cv2.dilate(opened, se_opening, iterations=bg_iters)

    # Stage 6: Euclidean Distance Transform
    mask_sz = 5 if dist_mask_size == 5 else 3
    dist_transform = cv2.distanceTransform(opened, cv2.DIST_L2, mask_sz)

    max_dist = float(dist_transform.max())
    if max_dist > 0:
        norm_dist = np.uint8(cv2.normalize(dist_transform, None, 0, 255, cv2.NORM_MINMAX))
    else:
        norm_dist = np.zeros((h, w), dtype=np.uint8)

    dist_heatmap = cv2.applyColorMap(norm_dist, cv2.COLORMAP_JET)

    # Stage 7: Sure Foreground Markers
    fg_factor = max(0.10, min(0.95, float(fg_threshold_factor)))
    cutoff_val = fg_factor * max_dist
    _, sure_fg = cv2.threshold(dist_transform, cutoff_val, 255, cv2.THRESH_BINARY)
    sure_fg = np.uint8(sure_fg)

    # Stage 8: Unknown Region (Unknown = Sure BG - Sure FG)
    unknown = cv2.subtract(sure_bg, sure_fg)

    # Stage 9: Connected-Component Marker Labeling
    conn = 4 if connectivity == 4 else 8
    num_markers, markers = cv2.connectedComponents(sure_fg, connectivity=conn)

    # Add 1 to all labels so that background is 1 instead of 0
    markers = markers + 1

    # Mark the unknown region with zero
    markers[unknown == 255] = 0

    used_manual_markers = False
    # Stage 10: Optional Manual Marker Refinement
    if manual_markers_data and isinstance(manual_markers_data, list):
        current_max_marker = int(markers.max())
        for pt in manual_markers_data:
            px = int(pt.get("x", 0))
            py = int(pt.get("y", 0))
            pt_type = pt.get("type", "fg")
            radius = int(pt.get("radius", 4))
            if 0 <= px < w and 0 <= py < h:
                used_manual_markers = True
                if pt_type == "bg":
                    cv2.circle(markers, (px, py), radius, 1, -1)
                else:
                    current_max_marker += 1
                    cv2.circle(markers, (px, py), radius, current_max_marker, -1)

    # Prepare marker array with int32 data type for cv2.watershed
    markers_int32 = np.int32(markers)

    # Stage 11: Marker-Controlled Watershed Flooding
    bgr_for_ws = bgr_img.copy()
    cv2.watershed(bgr_for_ws, markers_int32)

    # Stage 12: Extract Segmented Objects and Compute Visual Overlays
    # Distinct positive labels (> 1) correspond to segmented coin entities
    all_positive_labels = [l for l in np.unique(markers_int32) if l > 1]
    palette = generate_distinct_colors(max(len(all_positive_labels), 16))

    segmented_colored = np.zeros_like(bgr_img)
    valid_components = []
    min_area = max(5, int(min_region_area))

    for idx, label in enumerate(all_positive_labels):
        comp_mask = (markers_int32 == label).astype(np.uint8) * 255
        area = int(np.count_nonzero(comp_mask))

        # Filter out tiny noise artifacts
        if area < min_area:
            continue

        color = palette[idx % len(palette)]
        segmented_colored[comp_mask > 0] = color

        # Compute contours, bounding box, centroid, and perimeter
        contours, _ = cv2.findContours(comp_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if contours:
            c = max(contours, key=cv2.contourArea)
            perimeter = round(float(cv2.arcLength(c, True)), 2)
            bx, by, bw, bh = cv2.boundingRect(c)
            M = cv2.moments(c)
            if M["m00"] > 0:
                cx = round(float(M["m10"] / M["m00"]), 2)
                cy = round(float(M["m01"] / M["m00"]), 2)
            else:
                cx = round(float(bx + bw / 2), 2)
                cy = round(float(by + bh / 2), 2)

            valid_components.append({
                "id": len(valid_components) + 1,
                "label": int(label),
                "area": area,
                "perimeter": perimeter,
                "centroid": [cx, cy],
                "bbox": [bx, by, bw, bh],
                "color_rgb": [color[2], color[1], color[0]], # Return RGB for UI
            })

    total_coins_detected = len(valid_components)

    # Generate Boundary Overlay on Original Image
    # Watershed boundaries are marked with -1
    boundary_overlay = bgr_img.copy()
    boundary_mask = (markers_int32 == -1).astype(np.uint8) * 255
    # Thicken boundary lines slightly for crisp visual presentation
    thick_boundary = cv2.dilate(boundary_mask, np.ones((2, 2), np.uint8), iterations=1)
    # Bright contrasting cyan/red boundary lines
    boundary_overlay[thick_boundary > 0] = [0, 255, 255] # Yellow-Cyan accent

    # Draw centroids, bounding boxes, and ID badges on boundary overlay
    for comp in valid_components:
        bx, by, bw, bh = comp["bbox"]
        cx, cy = int(comp["centroid"][0]), int(comp["centroid"][1])
        cv2.rectangle(boundary_overlay, (bx, by), (bx + bw, by + bh), (0, 200, 255), 1)
        cv2.drawMarker(boundary_overlay, (cx, cy), (0, 255, 0), cv2.MARKER_CROSS, 6, 1)
        # ID tag
        tag = f"#{comp['id']}"
        cv2.putText(boundary_overlay, tag, (bx + 2, max(12, by - 4)), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (255, 255, 255), 1, cv2.LINE_AA)

    # Generate Marker Visualization (colored representation of markers array)
    markers_norm = np.zeros((h, w, 3), dtype=np.uint8)
    for idx, label in enumerate(np.unique(markers)):
        if label == 0:
            markers_norm[markers == 0] = [60, 60, 60] # Gray for unknown
        elif label == 1:
            markers_norm[markers == 1] = [20, 20, 20] # Dark background
        else:
            col = palette[(idx - 2) % len(palette)]
            markers_norm[markers == label] = col

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    # Stage 13: Evaluation & Accuracy Statistics
    evaluation: Dict[str, Any] = {
        "automatic_count": total_coins_detected,
        "total_watershed_regions": len(all_positive_labels),
        "filtered_noise_regions": len(all_positive_labels) - total_coins_detected,
        "foreground_threshold_value": round(cutoff_val, 2),
        "max_distance_transform": round(max_dist, 2),
        "used_manual_markers": used_manual_markers,
    }

    # Count agreement evaluation
    if manual_count is not None and int(manual_count) > 0:
        man_val = int(manual_count)
        abs_err = abs(total_coins_detected - man_val)
        agreement_pct = round(max(0.0, 1.0 - (abs_err / max(1, man_val))) * 100.0, 1)
        evaluation["manual_count"] = man_val
        evaluation["absolute_count_error"] = abs_err
        evaluation["count_agreement_percent"] = agreement_pct
        evaluation["has_manual_reference"] = True
        evaluation["accuracy_verdict"] = (
            "100% Exact Coin Count Agreement!" if abs_err == 0
            else f"Disparity of {abs_err} coin(s) ({agreement_pct}% count agreement)."
        )
    else:
        evaluation["has_manual_reference"] = False
        evaluation["accuracy_verdict"] = "Manual coin count not provided. Enter known reference count to evaluate accuracy %."

    # Pixel-level ground-truth evaluation
    if ground_truth_mask is not None:
        pred_fg = (markers_int32 > 1).astype(np.uint8) * 255
        pixel_metrics = compute_pixel_metrics(pred_fg, ground_truth_mask)
        evaluation.update(pixel_metrics)
    else:
        evaluation["has_ground_truth"] = False
        evaluation["pixel_metrics_notice"] = "Ground-truth reference mask not provided. Pixel-level IoU and Dice evaluation disabled."

    # Stage 14: Encode all multi-stage visualizations to Base64
    images = {
        "original": encode_image_to_base64(bgr_img),
        "grayscale": encode_image_to_base64(gray),
        "binary": encode_image_to_base64(binary),
        "opened": encode_image_to_base64(opened),
        "distance_transform": encode_image_to_base64(norm_dist),
        "distance_heatmap": encode_image_to_base64(dist_heatmap),
        "sure_fg": encode_image_to_base64(sure_fg),
        "sure_bg": encode_image_to_base64(sure_bg),
        "unknown": encode_image_to_base64(unknown),
        "markers_vis": encode_image_to_base64(markers_norm),
        "segmented": encode_image_to_base64(segmented_colored),
        "boundary_overlay": encode_image_to_base64(boundary_overlay),
    }

    metadata = get_image_metadata(img)

    return {
        "status": "success",
        "processing_time_ms": elapsed_ms,
        "metadata": metadata,
        "parameters": {
            "blur_method": blur_method,
            "blur_kernel": blur_k,
            "threshold_method": threshold_method,
            "threshold_value": thresh_val,
            "polarity": polarity,
            "structuring_element": structuring_element,
            "opening_kernel_size": opening_kernel_size,
            "opening_iterations": open_iters,
            "dist_mask_size": mask_sz,
            "fg_threshold_factor": fg_factor,
            "bg_dilation_iterations": bg_iters,
            "connectivity": conn,
            "min_region_area": min_area,
            "manual_count": manual_count,
            "used_manual_markers": used_manual_markers,
        },
        "automatic_count": total_coins_detected,
        "components": valid_components,
        "evaluation": evaluation,
        "images": images,
    }

