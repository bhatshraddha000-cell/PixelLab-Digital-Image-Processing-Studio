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

