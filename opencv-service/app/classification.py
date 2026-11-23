import time
import math
import os
import glob
from typing import Optional, Dict, Any, List, Tuple
import cv2
import numpy as np
import joblib

from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)

from .utils import (
    encode_image_to_base64,
    get_image_metadata,
)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
DATASETS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "datasets", "geometric_objects")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(DATASETS_DIR, exist_ok=True)

MODEL_FILE = os.path.join(MODELS_DIR, "knn_geometric_model.joblib")
SCALER_FILE = os.path.join(MODELS_DIR, "knn_geometric_scaler.joblib")

# Canonical feature ordering used across training, persistence, and inference
CANONICAL_FEATURES = [
    "circularity",
    "rectangularity",
    "aspect_ratio",
    "vertices",
    "compactness",
]

CATEGORY_COLORS = {
    "circle": (6, 182, 212),       # Cyan (RGB)
    "triangle": (239, 68, 68),     # Red
    "square": (16, 185, 129),      # Emerald
    "rectangle": (245, 158, 11),   # Amber
    "ellipse": (168, 85, 247),     # Purple
    "unknown": (148, 163, 184),    # Slate
}

def extract_contour_descriptors(contour: np.ndarray) -> Dict[str, Any]:
    """
    Extracts all 5 required academic descriptors plus supplemental geometrical properties:
    1. Area
    2. Perimeter
    3. Compactness: P^2 / (4 * pi * A)
    4. Circularity: (4 * pi * A) / P^2
    5. Rectangularity: Area / (minAreaRect area)
    Plus Aspect Ratio, Centroid, Bounding Box, Polygon Vertices, Extent, Solidity.
    """
    area = float(cv2.contourArea(contour))
    perimeter = float(cv2.arcLength(contour, True))

    if area <= 0 or perimeter <= 0:
        return {
            "area": max(0.0, area),
            "perimeter": max(0.0, perimeter),
            "compactness": 0.0,
            "circularity": 0.0,
            "rectangularity": 0.0,
            "aspect_ratio": 1.0,
            "vertices": 0,
            "extent": 0.0,
            "solidity": 0.0,
            "centroid": [0.0, 0.0],
            "bbox": [0, 0, 0, 0],
            "min_rect": [[0, 0], [0, 0], [0, 0], [0, 0]],
        }

    # 3. Compactness = P^2 / (4 * pi * A)
    # Ideal circle ~ 1.0; more elongated / irregular > 1.0
    compactness = round(float((perimeter ** 2) / (4.0 * math.pi * area)), 4)

    # 4. Circularity = (4 * pi * A) / P^2
    # Ideal circle ~ 1.0; less circular < 1.0 (inverse of compactness)
    circularity = round(float((4.0 * math.pi * area) / (perimeter ** 2)), 4)

    # 5. Rectangularity = Area / minAreaRect
    min_rect = cv2.minAreaRect(contour)
    rw, rh = min_rect[1]
    min_rect_area = max(1.0, float(rw * rh))
    rectangularity = round(float(area / min_rect_area), 4)

    # Aspect Ratio from minimum rotated rectangle
    major_side = max(rw, rh)
    minor_side = min(rw, rh)
    aspect_ratio = round(float(major_side / max(1.0, minor_side)), 3)

    # Axis-aligned bounding box
    bx, by, bw, bh = cv2.boundingRect(contour)

    # Extent = Area / (bw * bh)
    extent = round(float(area / max(1.0, float(bw * bh))), 4)

    # Solidity = Area / ConvexHullArea
    hull = cv2.convexHull(contour)
    hull_area = max(1.0, float(cv2.contourArea(hull)))
    solidity = round(float(area / hull_area), 4)

    # Centroid using cv2.moments
    M = cv2.moments(contour)
    if M["m00"] > 0:
        cx = round(float(M["m10"] / M["m00"]), 2)
        cy = round(float(M["m01"] / M["m00"]), 2)
    else:
        cx = round(float(bx + bw / 2), 2)
        cy = round(float(by + bh / 2), 2)

    # Polygon vertex count using approxPolyDP
    approx = cv2.approxPolyDP(contour, 0.04 * perimeter, True)
    vertices = len(approx)

    # Invariant Hu moments (log-transformed Hu moment 1 for scale/rotation invariance)
    if M["m00"] > 0:
        hu = cv2.HuMoments(M).flatten()
        hu_1 = round(float(-np.sign(hu[0]) * np.log10(abs(hu[0]) + 1e-12)), 4) if len(hu) > 0 else 0.0
    else:
        hu_1 = 0.0

    box_points = [list(map(lambda p: round(float(p), 1), pt)) for pt in cv2.boxPoints(min_rect)]

    return {
        "area": round(area, 2),
        "perimeter": round(perimeter, 2),
        "compactness": compactness,
        "circularity": circularity,
        "rectangularity": rectangularity,
        "aspect_ratio": aspect_ratio,
        "aspectRatio": aspect_ratio,
        "vertices": vertices,
        "extent": extent,
        "solidity": solidity,
        "hu_1": hu_1,
        "centroid": [cx, cy],
        "bbox": [bx, by, bw, bh],
        "min_rect": box_points,
    }

def rule_based_fallback_classifier(descriptors: Dict[str, Any]) -> Tuple[str, float]:
    """
    Academic geometrical decision rule classifier used as a robust baseline
    or fallback when no trained model is loaded.
    """
    circ = descriptors.get("circularity", 0.0)
    rect = descriptors.get("rectangularity", 0.0)
    ar = descriptors.get("aspect_ratio", descriptors.get("aspectRatio", 1.0))
    v = descriptors.get("vertices", 0)

    if v == 3 or (rect < 0.62 and circ < 0.65 and ar < 1.45):
        return "triangle", 0.95
    elif rect >= 0.88:
        if ar <= 1.25:
            return "square", 0.94
        else:
            return "rectangle", 0.94
    elif rect < 0.85:
        if ar <= 1.25:
            return "circle", 0.95
        else:
            return "ellipse", 0.92
    elif circ >= 0.80:
        return "circle", 0.85
    else:
        return "unknown", 0.50
        return "unknown", 0.60

def segment_and_extract_objects(
    img: np.ndarray,
    threshold_method: str = "otsu",
    threshold_value: int = 127,
    polarity: str = "bright_on_dark",
    blur_kernel: int = 3,
    morph_operation: str = "none",
    morph_kernel_size: int = 3,
    min_object_area: int = 80
) -> Tuple[List[Dict[str, Any]], np.ndarray, np.ndarray]:
    """
    Segments image via contours and computes geometrical features for all detected objects.
    """
    if len(img.shape) == 2:
        bgr = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
        gray = img.copy()
    else:
        bgr = img.copy()
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 1. Blur
    if blur_kernel >= 3:
        k = blur_kernel if blur_kernel % 2 == 1 else blur_kernel + 1
        blurred = cv2.GaussianBlur(gray, (k, k), 0.6)
    else:
        blurred = gray.copy()

    # 2. Thresholding
    if threshold_method.lower() == "manual":
        _, binary = cv2.threshold(blurred, int(threshold_value), 255, cv2.THRESH_BINARY)
    elif threshold_method.lower() == "adaptive":
        binary = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    else:
        _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    if polarity.lower() in ["dark_on_bright", "dark_objects"]:
        binary = cv2.bitwise_not(binary)

    # 3. Optional Morphological Cleanup
    if morph_operation.lower() in ["opening", "closing"]:
        se = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (morph_kernel_size, morph_kernel_size))
        op = cv2.MORPH_OPEN if morph_operation.lower() == "opening" else cv2.MORPH_CLOSE
        binary = cv2.morphologyEx(binary, op, se, iterations=1)

    # 4. External Contours
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    objects = []
    min_area = max(10, int(min_object_area))

    for idx, c in enumerate(contours):
        raw_area = cv2.contourArea(c)
        if raw_area < min_area:
            continue

        feats = extract_contour_descriptors(c)
        feats["id"] = len(objects) + 1
        feats["contour_points"] = len(c)
        feats["contour_raw"] = c
        objects.append(feats)

    return objects, binary, bgr

def load_or_train_default_model(k: int = 3, feature_names: Optional[List[str]] = None) -> Tuple[Any, Any, List[str]]:
    """Loads existing trained model or trains a clean initial model on datasets."""
    desired_features = feature_names or CANONICAL_FEATURES

    if os.path.exists(MODEL_FILE) and os.path.exists(SCALER_FILE):
        try:
            model_data = joblib.load(MODEL_FILE)
            scaler = joblib.load(SCALER_FILE)
            # Verify feature names match
            if isinstance(model_data, dict) and "model" in model_data:
                saved_features = model_data.get("features", CANONICAL_FEATURES)
                if feature_names is None or feature_names == saved_features:
                    return model_data["model"], scaler, saved_features
            elif hasattr(model_data, "predict"):
                return model_data, scaler, desired_features
        except Exception:
            pass

    # Train default model from local dataset
    train_res = train_knn_model(k=k, feature_names=desired_features)
    scaler = joblib.load(SCALER_FILE)
    model_data = joblib.load(MODEL_FILE)
    saved_feats = model_data.get("features", desired_features) if isinstance(model_data, dict) else desired_features
    return model_data.get("model", model_data) if isinstance(model_data, dict) else model_data, scaler, saved_feats

def build_feature_vector(descriptors: Dict[str, Any], feature_names: List[str]) -> List[float]:
    """Extracts ordered feature vector based on selected feature names."""
    vec = []
    for f in feature_names:
        val = descriptors.get(f)
        if val is None and f == "aspect_ratio":
            val = descriptors.get("aspectRatio", 1.0)
        elif val is None and f == "hu_1":
            val = descriptors.get("hu1", 0.0)
        vec.append(float(val if val is not None else 0.0))
    return vec

def train_knn_model(
    k: int = 3,
    test_ratio: float = 0.20,
    feature_names: Optional[List[str]] = None,
    dataset_dir: Optional[str] = None
) -> Dict[str, Any]:
    """
    Trains a K-Nearest Neighbors classifier on the geometric shapes dataset.
    Computes genuine hold-out evaluation metrics: Accuracy, Precision, Recall, F1, Confusion Matrix.
    """
    d_dir = dataset_dir or DATASETS_DIR
    selected_features = feature_names or CANONICAL_FEATURES

    categories = ["circle", "triangle", "square", "rectangle", "ellipse"]
    X, y = [], []

    for cat in categories:
        pattern = os.path.join(d_dir, cat, "*.png")
        files = glob.glob(pattern)
        for filepath in files:
            img = cv2.imread(filepath, cv2.IMREAD_GRAYSCALE)
            if img is None:
                continue
            _, thresh = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            cnts, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if not cnts:
                continue
            c = max(cnts, key=cv2.contourArea)
            feats = extract_contour_descriptors(c)
            if feats["area"] > 20:
                vec = build_feature_vector(feats, selected_features)
                X.append(vec)
                y.append(cat)

    if len(X) < 10:
        raise ValueError(f"Insufficient training samples ({len(X)} found). At least 10 samples are required to train.")

    X = np.array(X, dtype=np.float32)
    y = np.array(y)

    total_samples = len(X)
    classes_present = sorted(list(set(y)))

    # Stratified Train/Test Split
    stratify = y if min([list(y).count(c) for c in classes_present]) >= 2 else None
    t_ratio = max(0.15, min(0.40, float(test_ratio)))
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=t_ratio, random_state=42, stratify=stratify
    )

    # Fit StandardScaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Fit KNN
    k_val = max(1, min(15, int(k)))
    knn = KNeighborsClassifier(n_neighbors=k_val, weights="distance")
    knn.fit(X_train_scaled, y_train)

    # Evaluate on held-out test split
    y_pred = knn.predict(X_test_scaled)

    acc = round(float(accuracy_score(y_test, y_pred)), 4)
    cls_err = round(1.0 - acc, 4)
    prec_macro = round(float(precision_score(y_test, y_pred, average="macro", zero_division=0)), 4)
    rec_macro = round(float(recall_score(y_test, y_pred, average="macro", zero_division=0)), 4)
    f1_macro = round(float(f1_score(y_test, y_pred, average="macro", zero_division=0)), 4)

    prec_weighted = round(float(precision_score(y_test, y_pred, average="weighted", zero_division=0)), 4)
    rec_weighted = round(float(recall_score(y_test, y_pred, average="weighted", zero_division=0)), 4)
    f1_weighted = round(float(f1_score(y_test, y_pred, average="weighted", zero_division=0)), 4)

    # Confusion matrix
    labels_order = categories
    cm = confusion_matrix(y_test, y_pred, labels=labels_order).tolist()

    # Per-category metrics breakdown
    class_report_dict = classification_report(y_test, y_pred, labels=labels_order, output_dict=True, zero_division=0)
    per_category = {}
    for cat in categories:
        stats = class_report_dict.get(cat, {})
        per_category[cat] = {
            "precision": round(float(stats.get("precision", 0.0)), 3),
            "recall": round(float(stats.get("recall", 0.0)), 3),
            "f1": round(float(stats.get("f1-score", 0.0)), 3),
            "support": int(stats.get("support", 0)),
        }

    # Save model and scaler to disk
    joblib.dump({
        "model": knn,
        "features": selected_features,
        "categories": categories,
        "version": "2.0.0",
        "k": k_val,
    }, MODEL_FILE)
    joblib.dump(scaler, SCALER_FILE)

    return {
        "status": "success",
        "algorithm": "K-Nearest Neighbors (KNN)",
        "k": k_val,
        "selected_features": selected_features,
        "features_used": selected_features,
        "total_samples": total_samples,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "categories": categories,
        "accuracy": acc,
        "classification_error": cls_err,
        "precision_macro": prec_macro,
        "recall_macro": rec_macro,
        "f1_macro": f1_macro,
        "precision_weighted": prec_weighted,
        "recall_weighted": rec_weighted,
        "f1_weighted": f1_weighted,
        "confusion_matrix": {
            "labels": labels_order,
            "matrix": cm,
        },
        "per_category": per_category,
    }

    return {
        "status": "success",
        "algorithm": "K-Nearest Neighbors (KNN)",
        "k": k_val,
        "selected_features": selected_features,
        "total_samples": total_samples,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "categories": categories,
        "accuracy": acc,
        "classification_error": cls_err,
        "precision_macro": prec_macro,
        "recall_macro": rec_macro,
        "f1_macro": f1_macro,
        "precision_weighted": prec_weighted,
        "recall_weighted": rec_weighted,
        "f1_weighted": f1_weighted,
        "confusion_matrix": {
            "labels": labels_order,
            "matrix": cm,
        },
        "per_category": per_category,
    }

def get_dataset_statistics(dataset_dir: Optional[str] = None) -> Dict[str, Any]:
    """Returns sample counts and category breakdown for geometric dataset."""
    d_dir = dataset_dir or DATASETS_DIR
    categories = ["circle", "triangle", "square", "rectangle", "ellipse"]
    counts = {}
    total = 0
    samples_preview = {}
    for cat in categories:
        pattern = os.path.join(d_dir, cat, "*.png")
        files = glob.glob(pattern)
        counts[cat] = len(files)
        total += len(files)
        samples_preview[cat] = [os.path.basename(f) for f in sorted(files)[:6]]
    return {
        "total_samples": total,
        "categories": categories,
        "counts": counts,
        "samples_preview": samples_preview,
        "dataset_dir": d_dir
    }

def process_classification_pipeline(
    img: np.ndarray,
    threshold_method: str = "otsu",
    threshold_value: int = 127,
    polarity: str = "bright_on_dark",
    blur_kernel: int = 3,
    morph_operation: str = "none",
    morph_kernel_size: int = 3,
    min_object_area: int = 80,
    k_neighbors: int = 3,
    feature_names: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Complete execution pipeline for Module 04:
    1. Preprocesses image
    2. Segments external object contours
    3. Extracts all 5 geometrical descriptors (+ supplemental properties)
    4. Applies fitted StandardScaler and KNN model for classification
    5. Renders multi-layer visual annotations
    """
    start_time = time.perf_counter()

    # 1. Segment objects
    objects, binary, bgr = segment_and_extract_objects(
        img=img,
        threshold_method=threshold_method,
        threshold_value=threshold_value,
        polarity=polarity,
        blur_kernel=blur_kernel,
        morph_operation=morph_operation,
        morph_kernel_size=morph_kernel_size,
        min_object_area=min_object_area
    )

    # 2. Load model & scaler
    knn_model = None
    scaler = None
    active_features = CANONICAL_FEATURES

    try:
        knn_model, scaler, active_features = load_or_train_default_model(k=k_neighbors, feature_names=feature_names)
    except Exception as e:
        print("Warning: could not load/train KNN model, using fallback:", e)

    # 3. Classify detected objects
    classified_objects = []
    category_counts: Dict[str, int] = {}

    for obj in objects:
        c_raw = obj.pop("contour_raw", None) # remove raw contour from json payload

        pred_class = "unknown"
        neighbor_agreement = 0.50
        is_uncertain = False

        if knn_model is not None and scaler is not None:
            # Strictly use active_features associated with the fitted scaler and model
            vec = build_feature_vector(obj, active_features)
            vec_scaled = scaler.transform([vec])
            pred_class = str(knn_model.predict(vec_scaled)[0])

            # Compute neighbor-vote proportion
            probs = knn_model.predict_proba(vec_scaled)[0]
            class_idx = list(knn_model.classes_).index(pred_class)
            neighbor_agreement = round(float(probs[class_idx]), 2)

            # Flag uncertainty if vote agreement < 0.60 (e.g. split votes among neighbors)
            if neighbor_agreement < 0.60:
                is_uncertain = True
        else:
            # Academic fallback
            pred_class, neighbor_agreement = rule_based_fallback_classifier(obj)

        obj["predicted_class"] = pred_class
        obj["predictedClass"] = pred_class
        obj["confidence"] = neighbor_agreement
        obj["neighbor_agreement"] = neighbor_agreement
        obj["neighborAgreement"] = neighbor_agreement
        obj["is_uncertain"] = is_uncertain
        obj["isUncertain"] = is_uncertain
        obj["color_rgb"] = CATEGORY_COLORS.get(pred_class, (148, 163, 184))

        category_counts[pred_class] = category_counts.get(pred_class, 0) + 1
        classified_objects.append(obj)

    # 4. Generate Visualizations
    h, w = binary.shape
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    # A. Contours image
    contours_img = bgr.copy()
    # B. Bounding Boxes image
    bbox_img = bgr.copy()
    # C. Annotated prediction image
    annotated_img = bgr.copy()
    # D. Extracted Objects isolated mask
    extracted_img = cv2.bitwise_and(bgr, bgr, mask=binary)

    # Palette
    for obj in classified_objects:
        bx, by, bw, bh = obj["bbox"]
        cx, cy = int(obj["centroid"][0]), int(obj["centroid"][1])
        c_name = obj["predicted_class"]
        vote_agr = obj["neighbor_agreement"]
        rgb_col = obj["color_rgb"]
        bgr_col = (rgb_col[2], rgb_col[1], rgb_col[0])

        # Individual crop
        pad = 6
        y1, y2 = max(0, by - pad), min(h, by + bh + pad)
        x1, x2 = max(0, bx - pad), min(w, bx + bw + pad)
        crop = bgr[y1:y2, x1:x2].copy()
        if crop.size > 0:
            obj["crop"] = encode_image_to_base64(crop)
        else:
            obj["crop"] = None

        # BBox image
        cv2.rectangle(bbox_img, (bx, by), (bx + bw, by + bh), (0, 220, 255), 1)
        # Rotated minAreaRect
        pts = np.int32(obj["min_rect"])
        cv2.polylines(bbox_img, [pts], True, (255, 0, 255), 1)

        # Annotated image
        cv2.rectangle(annotated_img, (bx, by), (bx + bw, by + bh), bgr_col, 2)
        cv2.drawMarker(annotated_img, (cx, cy), (0, 255, 0), cv2.MARKER_CROSS, 8, 1)

        # Label tag
        pct = int(vote_agr * 100)
        tag = f"#{obj['id']} {c_name.capitalize()} ({pct}%)"
        if obj["is_uncertain"]:
            tag += " [?]"
        cv2.putText(
            annotated_img,
            tag,
            (bx, max(14, by - 6)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.42,
            (255, 255, 255),
            1,
            cv2.LINE_AA,
        )

    # Contours on contours_img
    cnts_all, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(contours_img, cnts_all, -1, (0, 255, 128), 2)

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    images = {
        "original": encode_image_to_base64(bgr),
        "grayscale": encode_image_to_base64(gray),
        "binary": encode_image_to_base64(binary),
        "extracted_objects": encode_image_to_base64(extracted_img),
        "contours": encode_image_to_base64(contours_img),
        "bounding_boxes": encode_image_to_base64(bbox_img),
        "annotated": encode_image_to_base64(annotated_img),
    }

    metadata = get_image_metadata(img)

    return {
        "status": "success",
        "processing_time_ms": elapsed_ms,
        "metadata": metadata,
        "total_detected_objects": len(classified_objects),
        "category_counts": category_counts,
        "parameters": {
            "threshold_method": threshold_method,
            "threshold_value": threshold_value,
            "polarity": polarity,
            "blur_kernel": blur_kernel,
            "morph_operation": morph_operation,
            "min_object_area": min_object_area,
            "k_neighbors": k_neighbors,
            "features_used": active_features,
        },
        "model_info": {
            "algorithm": "K-Nearest Neighbors (KNN)",
            "k": k_neighbors,
            "features": active_features,
            "scaler": "StandardScaler",
            "version": "2.0.0",
        },
        "objects": classified_objects,
        "images": images,
    }
