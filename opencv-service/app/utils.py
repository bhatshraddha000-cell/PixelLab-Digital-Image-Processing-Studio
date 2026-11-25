import cv2
import numpy as np
import base64
from typing import Tuple, Optional, Dict, Any

def decode_image_bytes(image_bytes: bytes) -> np.ndarray:
    """
    Decodes raw image bytes into an OpenCV BGR numpy array.
    Supports JPG, JPEG, PNG, WEBP, and TIFF.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError("Invalid or corrupted image format. Could not decode image.")
    return img

def encode_image_to_base64(img: np.ndarray, ext: str = ".png") -> str:
    """
    Encodes an OpenCV image array to a data URL base64 string.
    """
    success, encoded_buf = cv2.imencode(ext, img)
    if not success:
        raise ValueError("Could not encode image to PNG buffer.")
    b64_str = base64.b64encode(encoded_buf.tobytes()).decode("utf-8")
    mime = "image/png" if ext.lower() == ".png" else "image/jpeg"
    return f"data:{mime};base64,{b64_str}"

def encode_image_to_bytes(img: np.ndarray, ext: str = ".png") -> bytes:
    """
    Encodes an OpenCV image array to raw PNG bytes.
    """
    success, encoded_buf = cv2.imencode(ext, img)
    if not success:
        raise ValueError("Could not encode image to bytes.")
    return encoded_buf.tobytes()

def validate_reference_compatibility(noisy_img: np.ndarray, ref_img: np.ndarray) -> Tuple[bool, Optional[str]]:
    """
    Validates that a noisy input image and clean reference image have matching
    spatial dimensions (height, width) and compatible channel representations.
    """
    h_noisy, w_noisy = noisy_img.shape[:2]
    h_ref, w_ref = ref_img.shape[:2]

    if (h_noisy, w_noisy) != (h_ref, w_ref):
        return False, (
            f"Dimension mismatch: Input image is {w_noisy}x{h_noisy}px, "
            f"but clean reference image is {w_ref}x{h_ref}px. "
            "Clean reference must match the exact dimensions of the input image."
        )

    # Check channels
    c_noisy = 1 if len(noisy_img.shape) == 2 else noisy_img.shape[2]
    c_ref = 1 if len(ref_img.shape) == 2 else ref_img.shape[2]

    if c_noisy != c_ref:
        return False, (
            f"Color channel mismatch: Input image has {c_noisy} channel(s), "
            f"while reference image has {c_ref} channel(s)."
        )

    return True, None

def get_image_metadata(img: np.ndarray) -> Dict[str, Any]:
    """
    Returns image dimensions, aspect ratio, and channel structure.
    """
    h, w = img.shape[:2]
    channels = 1 if len(img.shape) == 2 else img.shape[2]
    is_color = channels >= 3
    return {
        "width": int(w),
        "height": int(h),
        "channels": int(channels),
        "is_color": bool(is_color),
        "aspect_ratio": round(float(w) / float(h), 3) if h > 0 else 1.0,
        "dtype": str(img.dtype),
        "total_pixels": int(w * h)
    }


def calculate_histogram_256(img: np.ndarray) -> Dict[str, Any]:
    """
    Calculates exact, unsmoothed 256-bin pixel intensity histograms using cv2.calcHist().
    Always returns all 256 bins (0..255), including zero-frequency bins.
    For color images (OpenCV BGR), maps channels accurately to R, G, B and Luminance.
    """
    if img is None or img.size == 0:
        empty_counts = [0] * 256
        return {
            "bins": list(range(256)),
            "counts": empty_counts,
            "luminance": empty_counts,
            "totalPixels": 0,
            "is_color": False,
        }

    bins = list(range(256))
    h, w = img.shape[:2]
    total_pixels = int(h * w)
    channels = 1 if len(img.shape) == 2 else img.shape[2]

    if channels == 1:
        hist = cv2.calcHist([img], [0], None, [256], [0, 256]).flatten()
        counts = [int(v) for v in hist]
        return {
            "bins": bins,
            "counts": counts,
            "luminance": counts,
            "totalPixels": total_pixels,
            "is_color": False,
        }
    else:
        # Handle BGRA by stripping alpha if present
        bgr = img[:, :, :3] if channels == 4 else img
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        hist_lum = cv2.calcHist([gray], [0], None, [256], [0, 256]).flatten()

        # OpenCV uses BGR ordering: 0=Blue, 1=Green, 2=Red
        hist_b = cv2.calcHist([bgr], [0], None, [256], [0, 256]).flatten()
        hist_g = cv2.calcHist([bgr], [1], None, [256], [0, 256]).flatten()
        hist_r = cv2.calcHist([bgr], [2], None, [256], [0, 256]).flatten()

        lum_counts = [int(v) for v in hist_lum]
        return {
            "bins": bins,
            "counts": lum_counts,
            "luminance": lum_counts,
            "r": [int(v) for v in hist_r],
            "g": [int(v) for v in hist_g],
            "b": [int(v) for v in hist_b],
            "totalPixels": total_pixels,
            "is_color": True,
        }


def calculate_binary_statistics(binary_img: np.ndarray) -> Dict[str, Any]:
    """
    Computes genuine two-level (0 and 255) pixel distribution statistics for a binary mask.
    Does not fabricate or interpolate intermediate grayscale bins.
    """
    if binary_img is None or binary_img.size == 0:
        return {
            "bins": [0, 255],
            "counts": [0, 0],
            "backgroundPixels": 0,
            "foregroundPixels": 0,
            "totalPixels": 0,
            "foregroundPercentage": 0.0,
            "backgroundPercentage": 0.0,
        }

    total_pixels = int(binary_img.size)
    fg_pixels = int(np.count_nonzero(binary_img))
    bg_pixels = int(total_pixels - fg_pixels)
    fg_pct = round((fg_pixels / max(1, total_pixels)) * 100.0, 2)
    bg_pct = round((bg_pixels / max(1, total_pixels)) * 100.0, 2)

    # Genuine 256-bin binary histogram: only bin 0 and bin 255 are populated
    hist_256 = [0] * 256
    hist_256[0] = bg_pixels
    hist_256[255] = fg_pixels

    return {
        "bins": [0, 255],
        "counts": [bg_pixels, fg_pixels],
        "histogram256": {
            "bins": list(range(256)),
            "counts": hist_256,
            "luminance": hist_256,
            "totalPixels": total_pixels,
            "is_color": False,
        },
        "backgroundPixels": bg_pixels,
        "foregroundPixels": fg_pixels,
        "totalPixels": total_pixels,
        "foregroundPercentage": fg_pct,
        "backgroundPercentage": bg_pct,
    }


def fill_small_holes(binary: np.ndarray, max_hole_ratio: float = 0.006) -> np.ndarray:
    """
    Fills small internal foreground holes (e.g., coin engravings, specular dark spots,
    or holed coins) without filling border-touching background or large enclosed inter-coin gaps.
    """
    if binary is None or binary.size == 0:
        return binary
    h, w = binary.shape[:2]
    max_hole_area = max(30, int(max_hole_ratio * h * w))
    inv = cv2.bitwise_not(binary)
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(inv, connectivity=8)
    filled = binary.copy()
    for i in range(1, num_labels):
        area = int(stats[i, cv2.CC_STAT_AREA])
        x = int(stats[i, cv2.CC_STAT_LEFT])
        y = int(stats[i, cv2.CC_STAT_TOP])
        bw = int(stats[i, cv2.CC_STAT_WIDTH])
        bh = int(stats[i, cv2.CC_STAT_HEIGHT])
        touches_border = (x == 0 or y == 0 or (x + bw) >= w or (y + bh) >= h)
        if not touches_border and area <= max_hole_area:
            filled[labels == i] = 255
    return filled


def compute_foreground_mask(
    img: np.ndarray,
    threshold_method: str = "otsu",
    threshold_value: int = 127,
    polarity: str = "bright_on_dark",
    blur_kernel: int = 3
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, Dict[str, Any]]:
    """
    Unified, polarity-aware foreground segmentation supporting:
    - Otsu, Manual, Adaptive grayscale thresholding
    - CIE LAB & HSV border-color distance segmentation for colored/textured backgrounds
    - Automatic border-connectivity polarity detection ('auto') and diagnostic warnings.
    Returns: (bgr_img, gray_img, blurred_gray, binary_mask, diagnostics) -> wait: returns (bgr, gray, blurred, binary, diagnostics)
    """
    if len(img.shape) == 2:
        gray = img.copy()
        bgr = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    else:
        bgr = img[:, :, :3].copy()
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    h, w = gray.shape[:2]
    k = max(3, int(blur_kernel) if int(blur_kernel) % 2 == 1 else int(blur_kernel) + 1)
    blurred = cv2.GaussianBlur(gray, (k, k), 0.5 if k == 3 else 0.8)

    method = (threshold_method or "otsu").lower()
    pol = (polarity or "bright_on_dark").lower()
    warnings: list = []
    auto_inverted = False

    if method == "lab":
        lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
        border_px = np.vstack([lab[0, :, :], lab[-1, :, :], lab[:, 0, :], lab[:, -1, :]])
        bg_med = np.median(border_px, axis=0)
        dl = (lab[:, :, 0] - bg_med[0]) * 0.40
        da = lab[:, :, 1] - bg_med[1]
        db = lab[:, :, 2] - bg_med[2]
        dist = np.sqrt(dl * dl + da * da + db * db)
        dist_u8 = cv2.normalize(dist, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        dist_u8 = cv2.GaussianBlur(dist_u8, (5, 5), 0.8)
        _, binary = cv2.threshold(dist_u8, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        effective_polarity = "color_distance_lab"
    elif method == "hsv":
        hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
        border_px = np.vstack([hsv[0, :, :], hsv[-1, :, :], hsv[:, 0, :], hsv[:, -1, :]])
        bg_med = np.median(border_px, axis=0)
        dh = np.minimum(np.abs(hsv[:, :, 0] - bg_med[0]), 180.0 - np.abs(hsv[:, :, 0] - bg_med[0])) * 1.5
        ds = (hsv[:, :, 1] - bg_med[1]) * 0.8
        dv = (hsv[:, :, 2] - bg_med[2]) * 0.4
        dist = np.sqrt(dh * dh + ds * ds + dv * dv)
        dist_u8 = cv2.normalize(dist, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        dist_u8 = cv2.GaussianBlur(dist_u8, (5, 5), 0.8)
        _, binary = cv2.threshold(dist_u8, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        effective_polarity = "color_distance_hsv"
    else:
        if method == "adaptive":
            block_sz = max(11, k * 4 + 3)
            if block_sz % 2 == 0:
                block_sz += 1
            binary = cv2.adaptiveThreshold(
                blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, block_sz, 2
            )
        elif method == "manual":
            t_val = max(1, min(254, int(threshold_value)))
            _, binary = cv2.threshold(blurred, t_val, 255, cv2.THRESH_BINARY)
        else:
            _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        border_fg_raw = float(
            np.concatenate([binary[0, :] > 0, binary[-1, :] > 0, binary[:, 0] > 0, binary[:, -1] > 0]).mean()
        )
        if pol == "auto":
            if border_fg_raw > 0.48:
                binary = cv2.bitwise_not(binary)
                auto_inverted = True
                effective_polarity = "dark_on_bright"
            else:
                effective_polarity = "bright_on_dark"
        elif pol in ["dark_on_bright", "dark_objects"]:
            binary = cv2.bitwise_not(binary)
            effective_polarity = "dark_on_bright"
        else:
            effective_polarity = "bright_on_dark"

    # Post-polarity border & occupancy diagnostics
    border_fg_ratio = round(
        float(np.concatenate([binary[0, :] > 0, binary[-1, :] > 0, binary[:, 0] > 0, binary[:, -1] > 0]).mean()),
        4,
    )
    fg_occupancy = round(float(np.count_nonzero(binary)) / max(1, h * w), 4)
    is_likely_inverted = bool(border_fg_ratio > 0.50 or fg_occupancy > 0.78)
    if is_likely_inverted:
        warnings.append(
            f"Foreground mask may be inverted ({round(border_fg_ratio * 100, 1)}% of border pixels and "
            f"{round(fg_occupancy * 100, 1)}% of frame classified as foreground). Try switching Polarity or using Auto/LAB."
        )

    diagnostics = {
        "threshold_method": method,
        "requested_polarity": pol,
        "effective_polarity": effective_polarity,
        "auto_inverted": auto_inverted,
        "border_fg_ratio": border_fg_ratio,
        "foreground_occupancy": fg_occupancy,
        "is_likely_inverted": is_likely_inverted,
        "warnings": warnings,
    }
    return bgr, gray, blurred, binary, diagnostics

