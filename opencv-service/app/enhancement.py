import cv2
import numpy as np
from typing import Dict, Any, List

def calculate_histogram_256(img: np.ndarray) -> Dict[str, Any]:
    """
    Calculates exact 256-bin intensity histograms for an OpenCV image.
    Returns intensity bins (0-255) and frequency distributions for:
    - Luminance / Grayscale
    - Red channel (if color)
    - Green channel (if color)
    - Blue channel (if color)
    """
    bins = list(range(256))
    channels = 1 if len(img.shape) == 2 else img.shape[2]

    if channels == 1:
        # Grayscale
        hist = cv2.calcHist([img], [0], None, [256], [0, 256]).flatten()
        return {
            "bins": bins,
            "luminance": [int(v) for v in hist],
            "is_color": False
        }
    else:
        # Color image (OpenCV stores BGR)
        # Convert BGR to standard Grayscale for Luminance histogram
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        hist_lum = cv2.calcHist([gray], [0], None, [256], [0, 256]).flatten()

        # BGR channels
        hist_b = cv2.calcHist([img], [0], None, [256], [0, 256]).flatten()
        hist_g = cv2.calcHist([img], [1], None, [256], [0, 256]).flatten()
        hist_r = cv2.calcHist([img], [2], None, [256], [0, 256]).flatten()

        return {
            "bins": bins,
            "luminance": [int(v) for v in hist_lum],
            "r": [int(v) for v in hist_r],
            "g": [int(v) for v in hist_g],
            "b": [int(v) for v in hist_b],
            "is_color": True
        }

def apply_gaussian_filter(img: np.ndarray, kernel_size: int = 5, sigma: float = 0.0) -> np.ndarray:
    """
    Applies 2D Gaussian spatial smoothing.
    - kernel_size must be an odd positive integer: 3, 5, 7, 9, 11, 15, 21, 31.
    - sigma >= 0. If 0, OpenCV computes sigma = 0.3 * ((ksize - 1) * 0.5 - 1) + 0.8.
    """
    if kernel_size % 2 == 0 or kernel_size < 3:
        kernel_size = 5

    sigma_val = float(sigma) if sigma > 0 else 0.0
    smoothed = cv2.GaussianBlur(img, (kernel_size, kernel_size), sigmaX=sigma_val, sigmaY=sigma_val)
    return smoothed

def apply_gamma_transformation(img: np.ndarray, gamma: float = 1.0) -> np.ndarray:
    """
    Applies power-law gamma intensity transformation:
    Output = 255 * (Input / 255) ** gamma
    Clamped to [0, 255] and optimized via a 256-element uint8 lookup table.
    - gamma < 1.0 brightens darker midtones
    - gamma > 1.0 darkens washed-out regions
    - gamma == 1.0 preserves original dynamic range
    """
    gamma_val = float(gamma)
    if gamma_val <= 0:
        gamma_val = 1.0

    # Build 256-entry lookup table
    inv_gamma = gamma_val
    table = np.array([
        np.clip(round(255.0 * ((i / 255.0) ** inv_gamma)), 0, 255)
        for i in range(256)
    ], dtype=np.uint8)

    # Fast pixel transformation via LUT
    enhanced = cv2.LUT(img, table)
    return enhanced

def apply_unsharp_masking(img: np.ndarray, strength: float = 0.0) -> np.ndarray:
    """
    Applies unsharp masking for edge sharpening:
    Sharpened = Original + strength * (Original - Blurred)
    Only executed if strength > 0.
    """
    if strength <= 0.0:
        return img

    # Use a mild 5x5 Gaussian blur for the unsharp mask
    blurred = cv2.GaussianBlur(img, (5, 5), sigmaX=1.0, sigmaY=1.0)
    
    # Calculate high-frequency difference mask
    # To prevent underflow/overflow, use float32
    orig_f = img.astype(np.float32)
    blur_f = blurred.astype(np.float32)
    high_freq = orig_f - blur_f

    # Add weighted high-frequency detail
    sharpened_f = orig_f + (float(strength) * high_freq)
    sharpened = np.clip(sharpened_f, 0, 255).astype(np.uint8)
    return sharpened

def process_enhancement_pipeline(
    img: np.ndarray,
    kernel_size: int = 5,
    sigma: float = 0.0,
    gamma: float = 1.0,
    sharpening: float = 0.0
) -> Dict[str, Any]:
    """
    Full Image Enhancement Pipeline:
    Step 1: Read & validate image
    Step 2: Gaussian smoothing
    Step 3: Gamma transformation
    Step 4: Optional Unsharp Masking
    Step 5: Compute histograms for each stage
    """
    # Step 1: Baseline raw image histogram
    original_hist = calculate_histogram_256(img)

    # Step 2: Gaussian filter
    smoothed_img = apply_gaussian_filter(img, kernel_size=kernel_size, sigma=sigma)
    smoothed_hist = calculate_histogram_256(smoothed_img)

    # Step 3: Gamma transformation
    gamma_img = apply_gamma_transformation(smoothed_img, gamma=gamma)

    # Step 4: Optional sharpening (Unsharp Masking)
    if sharpening > 0:
        final_img = apply_unsharp_masking(gamma_img, strength=sharpening)
    else:
        final_img = gamma_img

    # Step 5: Enhanced histogram
    enhanced_hist = calculate_histogram_256(final_img)

    return {
        "original_img": img,
        "smoothed_img": smoothed_img,
        "final_img": final_img,
        "original_hist": original_hist,
        "smoothed_hist": smoothed_hist,
        "enhanced_hist": enhanced_hist,
        "applied_params": {
            "kernel_size": kernel_size,
            "sigma": sigma if sigma > 0 else "auto",
            "gamma": gamma,
            "sharpening": sharpening
        }
    }

