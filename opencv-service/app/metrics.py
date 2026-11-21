import numpy as np
from skimage.metrics import structural_similarity as ssim_fn
from typing import Dict, Any, Optional

def calculate_mse(img1: np.ndarray, img2: np.ndarray) -> float:
    """
    Computes Mean Squared Error (MSE) between two identical-dimension images:
    MSE = (1 / MN) * sum( (I1(x,y) - I2(x,y))^2 )
    """
    diff = img1.astype(np.float64) - img2.astype(np.float64)
    mse = np.mean(diff ** 2)
    return float(mse)

def calculate_psnr(img1: np.ndarray, img2: np.ndarray, mse: Optional[float] = None) -> float:
    """
    Computes Peak Signal-to-Noise Ratio (PSNR) in decibels (dB):
    PSNR = 20 * log10( 255 / sqrt(MSE) )
    If MSE == 0 (identical images), returns 100.0 dB.
    """
    if mse is None:
        mse = calculate_mse(img1, img2)

    if mse <= 1e-10:
        return 100.0

    psnr = 20.0 * np.log10(255.0 / np.sqrt(mse))
    return float(round(psnr, 3))

def calculate_ssim(img1: np.ndarray, img2: np.ndarray) -> float:
    """
    Computes Structural Similarity Index (SSIM) in range [-1, 1].
    Values closer to 1.0 indicate high structural, luminance, and contrast similarity.
    """
    is_color = (len(img1.shape) == 3 and img1.shape[2] >= 3)

    if is_color:
        score = ssim_fn(
            img1,
            img2,
            channel_axis=2,
            data_range=255.0
        )
    else:
        # Grayscale
        g1 = img1 if len(img1.shape) == 2 else img1[:, :, 0]
        g2 = img2 if len(img2.shape) == 2 else img2[:, :, 0]
        score = ssim_fn(
            g1,
            g2,
            data_range=255.0
        )

    return float(round(score, 4))

def compute_quality_evaluation(
    noisy_img: np.ndarray,
    enhanced_img: np.ndarray,
    reference_img: Optional[np.ndarray] = None
) -> Dict[str, Any]:
    """
    Comprehensive quantitative evaluation.
    
    Case A: Clean reference image provided
    - Evaluates Noisy vs. Reference (baseline degradation)
    - Evaluates Enhanced vs. Reference (reconstructed quality)
    - Computes absolute and percentage improvement across MSE, PSNR, and SSIM.
    
    Case B: No clean reference image
    - Computes Input-to-Output transformation divergence
    - Clearly annotates that reference-free metrics represent modification magnitude,
      not objective restoration quality.
    """
    if reference_img is not None:
        # Baseline noisy metrics vs clean ground truth
        noisy_mse = calculate_mse(noisy_img, reference_img)
        noisy_psnr = calculate_psnr(noisy_img, reference_img, mse=noisy_mse)
        noisy_ssim = calculate_ssim(noisy_img, reference_img)

        # Enhanced metrics vs clean ground truth
        enh_mse = calculate_mse(enhanced_img, reference_img)
        enh_psnr = calculate_psnr(enhanced_img, reference_img, mse=enh_mse)
        enh_ssim = calculate_ssim(enhanced_img, reference_img)

        # Delta metrics
        delta_mse = round(enh_mse - noisy_mse, 3) # negative is better
        delta_psnr = round(enh_psnr - noisy_psnr, 3) # positive is better
        delta_ssim = round(enh_ssim - noisy_ssim, 4) # positive is better

        # Overall improvement decision
        is_improved = (enh_psnr > noisy_psnr) or (enh_ssim > noisy_ssim and enh_mse < noisy_mse)

        return {
            "has_reference": True,
            "reference_based": True,
            "metrics": {
                "mse": round(enh_mse, 3),
                "psnr": enh_psnr,
                "ssim": enh_ssim
            },
            "baseline_noisy": {
                "mse": round(noisy_mse, 3),
                "psnr": noisy_psnr,
                "ssim": noisy_ssim
            },
            "delta": {
                "mse": delta_mse,
                "psnr": delta_psnr,
                "ssim": delta_ssim,
                "mse_improved": delta_mse < 0,
                "psnr_improved": delta_psnr > 0,
                "ssim_improved": delta_ssim > 0,
            },
            "is_improved": bool(is_improved),
            "explanation": (
                f"Peak SNR shifted from {noisy_psnr} dB to {enh_psnr} dB (Δ {delta_psnr:+} dB). "
                f"SSIM changed from {noisy_ssim} to {enh_ssim} (Δ {delta_ssim:+}). "
                + ("Image quality successfully improved against reference ground-truth." if is_improved
                   else "Parameters caused excessive smoothing or intensity drift against reference.")
            )
        }
    else:
        # Case B: Input-to-output difference measurement
        io_mse = calculate_mse(noisy_img, enhanced_img)
        io_psnr = calculate_psnr(noisy_img, enhanced_img, mse=io_mse)
        io_ssim = calculate_ssim(noisy_img, enhanced_img)

        return {
            "has_reference": False,
            "reference_based": False,
            "metrics": {
                "mse": round(io_mse, 3),
                "psnr": io_psnr,
                "ssim": io_ssim
            },
            "transformation_diff": {
                "pixel_mse": round(io_mse, 3),
                "psnr_divergence": io_psnr,
                "structural_retention": io_ssim
            },
            "explanation": (
                "Clean reference image is not supplied. The displayed metrics quantify "
                "the mathematical divergence between the input and the enhanced output, "
                "rather than objective reconstruction fidelity. Upload a corresponding "
                "clean reference image to evaluate true PSNR and SSIM restoration."
            )
        }

