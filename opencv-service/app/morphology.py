import time
import cv2
import numpy as np
from typing import Dict, Any, List, Optional, Tuple

from .utils import (
    decode_image_bytes,
    encode_image_to_base64,
    get_image_metadata,
    calculate_histogram_256,
    calculate_binary_statistics,
    fill_small_holes,
    compute_foreground_mask,
)

def create_labeled_visualization(
    base_img: np.ndarray,
    labels: np.ndarray,
    valid_component_indices: List[int],
    stats: np.ndarray,
    centroids: np.ndarray
) -> np.ndarray:
    """
    Renders a colored labeled overlay image where each detected object
    receives a distinct hue, bounding box, centroid marker, and ID label.
    """
    h, w = labels.shape[:2]
    num_valid = len(valid_component_indices)

    # Convert base image to 3-channel BGR for color overlays
    if len(base_img.shape) == 2:
        vis_img = cv2.cvtColor(base_img, cv2.COLOR_GRAY2BGR)
    else:
        vis_img = base_img.copy()

    # Dim the background slightly to make objects and markers pop
    vis_img = cv2.addWeighted(vis_img, 0.45, np.zeros_like(vis_img), 0.55, 0)

    # Color overlay mask
    mask_colored = np.zeros((h, w, 3), dtype=np.uint8)

    # Golden ratio / equidistant hue distribution for maximum contrast
    for idx, comp_idx in enumerate(valid_component_indices):
        obj_id = idx + 1
        hue = int((idx * 179 / max(1, num_valid)) % 180)
        color_hsv = np.uint8([[[hue, 220, 240]]])
        color_bgr = cv2.cvtColor(color_hsv, cv2.COLOR_HSV2BGR)[0][0]
        color = (int(color_bgr[0]), int(color_bgr[1]), int(color_bgr[2]))

        # Fill component mask
        mask_colored[labels == comp_idx] = color

    # Blend colored components onto the darkened background
    has_foreground = np.any(mask_colored > 0, axis=-1)
    vis_img[has_foreground] = cv2.addWeighted(vis_img, 0.3, mask_colored, 0.7, 0)[has_foreground]

    # Draw bounding boxes, centroids, and IDs
    for idx, comp_idx in enumerate(valid_component_indices):
        obj_id = idx + 1
        x = int(stats[comp_idx, cv2.CC_STAT_LEFT])
        y = int(stats[comp_idx, cv2.CC_STAT_TOP])
        box_w = int(stats[comp_idx, cv2.CC_STAT_WIDTH])
        box_h = int(stats[comp_idx, cv2.CC_STAT_HEIGHT])
        area = int(stats[comp_idx, cv2.CC_STAT_AREA])
        cx = int(round(centroids[comp_idx][0]))
        cy = int(round(centroids[comp_idx][1]))

        # Draw Bounding Box (Cyan with dark shadow for readability)
        cv2.rectangle(vis_img, (x - 1, y - 1), (x + box_w + 1, y + box_h + 1), (0, 0, 0), 2)
        cv2.rectangle(vis_img, (x, y), (x + box_w, y + box_h), (255, 230, 0), 1)

        # Centroid Crosshair
        cv2.drawMarker(vis_img, (cx, cy), (0, 0, 255), cv2.MARKER_CROSS, 8, 2)
        cv2.circle(vis_img, (cx, cy), 2, (255, 255, 255), -1)

        # Object ID Label pill
        label_text = f"#{obj_id}"
        font_scale = 0.45
        thickness = 1
        font = cv2.FONT_HERSHEY_SIMPLEX
        (tw, th), _ = cv2.getTextSize(label_text, font, font_scale, thickness)

        badge_x1 = max(0, x)
        badge_y1 = max(0, y - th - 6)
        badge_x2 = min(w, badge_x1 + tw + 6)
        badge_y2 = max(0, y)

        # Dark pill background
        cv2.rectangle(vis_img, (badge_x1, badge_y1), (badge_x2, badge_y2), (15, 23, 42), -1)
        cv2.rectangle(vis_img, (badge_x1, badge_y1), (badge_x2, badge_y2), (6, 182, 212), 1)
        cv2.putText(vis_img, label_text, (badge_x1 + 3, badge_y2 - 3), font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)

    return vis_img

def process_morphology_pipeline(
    img: np.ndarray,
    threshold_method: str = "otsu",
    threshold_value: int = 127,
    polarity: str = "bright_on_dark",
    structuring_element: str = "ellipse",
    kernel_width: int = 5,
    kernel_height: int = 5,
    erosion_iterations: int = 2,
    dilation_iterations: int = 2,
    operation_mode: str = "custom",  # 'custom' (erode then dilate), 'opening', 'erosion_only'
    connectivity: int = 8,
    min_component_area: int = 50,
    manual_count: Optional[int] = None
) -> Dict[str, Any]:
    """
    Executes the full Morphological Object Separation and Counting Pipeline:
    1. Grayscale conversion
    2. Thresholding (Otsu, Manual, Adaptive) with Polarity Handling
    3. Structuring element construction (Ellipse, Rectangle, Cross)
    4. Erosion, Dilation, and Morphological Opening
    5. Connected-component labeling (4 or 8-connectivity)
    6. Minimum component area filtration
    7. Colored labeled visualization with centroids & bounding boxes
    8. Quantitative evaluation metrics and error rates against manual count
    """
    start_time = time.perf_counter()

    # Stage 1, 2 & 3: Polarity-aware foreground segmentation (Otsu, Manual, Adaptive, LAB, HSV)
    bgr, gray, smoothed_gray, binary_raw, mask_diag = compute_foreground_mask(
        img=img,
        threshold_method=threshold_method,
        threshold_value=threshold_value,
        polarity=polarity,
        blur_kernel=3,
    )

    # Fill small internal coin relief/engraving holes without filling inter-coin gaps
    binary = fill_small_holes(binary_raw, max_hole_ratio=0.006)

    initial_fg_pixels = int(np.count_nonzero(binary))

    # Measure initial connected components count before morphological separation
    initial_num_labels, _, _, _ = cv2.connectedComponentsWithStats(binary, connectivity=connectivity)
    initial_components_count = max(0, int(initial_num_labels - 1))

    # Stage 4: Structuring Element Construction
    structuring_element = structuring_element.lower()
    if structuring_element == "rectangle":
        se_shape = cv2.MORPH_RECT
    elif structuring_element == "cross":
        se_shape = cv2.MORPH_CROSS
    else:
        se_shape = cv2.MORPH_ELLIPSE

    kw = max(3, int(kernel_width if kernel_width % 2 == 1 else kernel_width + 1))
    kh = max(3, int(kernel_height if kernel_height % 2 == 1 else kernel_height + 1))
    se = cv2.getStructuringElement(se_shape, (kw, kh))

    # Stage 5: Morphological Operations
    e_iters = max(1, min(15, int(erosion_iterations)))
    d_iters = max(1, min(15, int(dilation_iterations)))

    # A. Erosion
    eroded = cv2.erode(binary, se, iterations=e_iters)
    eroded_fg_pixels = int(np.count_nonzero(eroded))

    # B. Dilation (applied to the eroded image to restore object boundaries)
    dilated = cv2.dilate(eroded, se, iterations=d_iters)
    dilated_fg_pixels = int(np.count_nonzero(dilated))

    # C. Standard Morphological Opening (Erosion followed by Dilation with same SE)
    opening = cv2.morphologyEx(binary, cv2.MORPH_OPEN, se, iterations=e_iters)
    opening_fg_pixels = int(np.count_nonzero(opening))

    # Select active final binary mask based on operation_mode
    if operation_mode == "opening":
        final_binary = opening
        final_fg_pixels = opening_fg_pixels
    elif operation_mode == "erosion_only":
        final_binary = eroded
        final_fg_pixels = eroded_fg_pixels
    else:
        # custom: erode by e_iters, dilate by d_iters
        final_binary = dilated
        final_fg_pixels = dilated_fg_pixels

    # Stage 6: Connected-Component Labeling
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
        final_binary, connectivity=connectivity
    )

    # Filter components by minimum area, excluding background (label 0)
    valid_component_indices = []
    components_info = []

    for i in range(1, num_labels):
        area = int(stats[i, cv2.CC_STAT_AREA])
        if area >= min_component_area:
            valid_component_indices.append(i)
            components_info.append({
                "id": len(valid_component_indices),
                "area": area,
                "bbox": [
                    int(stats[i, cv2.CC_STAT_LEFT]),
                    int(stats[i, cv2.CC_STAT_TOP]),
                    int(stats[i, cv2.CC_STAT_WIDTH]),
                    int(stats[i, cv2.CC_STAT_HEIGHT])
                ],
                "centroid": [
                    round(float(centroids[i][0]), 2),
                    round(float(centroids[i][1]), 2)
                ]
            })

    automatic_count = len(valid_component_indices)

    # Stage 7: Generate Colored Labeled Visualization
    labeled_img = create_labeled_visualization(
        base_img=img,
        labels=labels,
        valid_component_indices=valid_component_indices,
        stats=stats,
        centroids=centroids
    )

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    # Stage 8: Quantitative Evaluation & Count Agreement
    evaluation: Dict[str, Any] = {
        "automatic_count": automatic_count,
        "initial_components_before_morphology": initial_components_count,
        "separated_gain": automatic_count - initial_components_count,
        "foreground_pixels": {
            "initial_binary": initial_fg_pixels,
            "eroded": eroded_fg_pixels,
            "dilated": dilated_fg_pixels,
            "final": final_fg_pixels,
            "area_retention_ratio": round(float(final_fg_pixels) / max(1, initial_fg_pixels), 3)
        }
    }

    if manual_count is not None and manual_count > 0:
        manual_val = int(manual_count)
        abs_error = abs(automatic_count - manual_val)
        agreement_pct = round(max(0.0, 1.0 - (abs_error / max(1, manual_val))) * 100.0, 1)

        evaluation["manual_count"] = manual_val
        evaluation["absolute_count_error"] = abs_error
        evaluation["count_agreement_percent"] = agreement_pct
        evaluation["has_manual_reference"] = True
        evaluation["accuracy_verdict"] = (
            "100% Exact Count Agreement!" if abs_error == 0
            else f"Count disparity of {abs_error} object(s) ({agreement_pct}% agreement)."
        )
    else:
        evaluation["has_manual_reference"] = False
        evaluation["accuracy_verdict"] = "Manual reference count not supplied. Enter known count to compute agreement %."

    # Stage 9: Base64 Image Encodings
    images = {
        "original": encode_image_to_base64(img),
        "grayscale": encode_image_to_base64(gray),
        "binary": encode_image_to_base64(binary),
        "eroded": encode_image_to_base64(eroded),
        "dilated": encode_image_to_base64(dilated),
        "opened": encode_image_to_base64(opening),
        "labeled": encode_image_to_base64(labeled_img)
    }

    metadata = get_image_metadata(img)

    # Calculate genuine 256-bin histograms and two-level binary statistics
    histograms: Dict[str, Any] = {
        "original_grayscale": calculate_histogram_256(gray),
        "preprocessed_grayscale": calculate_histogram_256(smoothed_gray),
        "binary_stats": calculate_binary_statistics(final_binary),
        "initial_binary_stats": calculate_binary_statistics(binary),
    }
    if len(img.shape) == 3 and img.shape[2] >= 3:
        histograms["original_color"] = calculate_histogram_256(img)

    return {
        "status": "success",
        "processing_time_ms": elapsed_ms,
        "metadata": metadata,
        "parameters": {
            "threshold_method": threshold_method,
            "threshold_value": threshold_value,
            "polarity": polarity,
            "effective_polarity": mask_diag.get("effective_polarity", polarity),
            "structuring_element": structuring_element,
            "kernel_width": kw,
            "kernel_height": kh,
            "erosion_iterations": e_iters,
            "dilation_iterations": d_iters,
            "operation_mode": operation_mode,
            "connectivity": connectivity,
            "min_component_area": min_component_area,
            "manual_count": manual_count
        },
        "automatic_count": automatic_count,
        "components": components_info,
        "evaluation": evaluation,
        "diagnostics": {
            **mask_diag,
            "initial_components": initial_components_count,
            "final_components": automatic_count,
        },
        "histograms": histograms,
        "images": images
    }

