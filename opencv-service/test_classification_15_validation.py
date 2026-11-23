import os
import sys
import math
import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.classification import (
    process_classification_pipeline,
    segment_and_extract_objects,
    build_feature_vector,
    CANONICAL_FEATURES,
    MODEL_FILE,
    SCALER_FILE
)
import joblib

def create_15_shapes_benchmark():
    # 800 x 600 canvas
    canvas = np.zeros((600, 800, 3), dtype=np.uint8)
    
    # Ground truth records: list of dicts {name, class, center}
    ground_truth = []

    # 1. CIRCLES (3 samples)
    # Circle 1: small r=22 at (100, 100)
    cv2.circle(canvas, (100, 100), 22, (255, 255, 255), -1)
    ground_truth.append({"expected": "circle", "pos": (100, 100), "desc": "Small Circle (r=22)"})

    # Circle 2: medium r=38 at (250, 100)
    cv2.circle(canvas, (250, 100), 38, (255, 255, 255), -1)
    ground_truth.append({"expected": "circle", "pos": (250, 100), "desc": "Medium Circle (r=38)"})

    # Circle 3: large r=50 at (430, 100)
    cv2.circle(canvas, (430, 100), 50, (255, 255, 255), -1)
    ground_truth.append({"expected": "circle", "pos": (430, 100), "desc": "Large Circle (r=50)"})

    # 2. TRIANGLES (3 samples)
    # Triangle 1: Equilateral at (620, 100)
    r1 = 45
    cx, cy = 620, 100
    pts1 = np.array([
        [cx, cy - r1],
        [cx - r1 * math.cos(math.pi/6), cy + r1 * math.sin(math.pi/6)],
        [cx + r1 * math.cos(math.pi/6), cy + r1 * math.sin(math.pi/6)]
    ], dtype=np.int32)
    cv2.drawContours(canvas, [pts1], 0, (255, 255, 255), -1)
    ground_truth.append({"expected": "triangle", "pos": (620, 100), "desc": "Equilateral Triangle"})

    # Triangle 2: Right-angled rotated 45 deg at (120, 260)
    cx, cy = 120, 260
    w, h = 60, 75
    pts2 = np.array([[cx - w/2, cy + h/2], [cx + w/2, cy + h/2], [cx - w/2, cy - h/2]], dtype=np.float32)
    M = cv2.getRotationMatrix2D((cx, cy), 45, 1.0)
    pts2 = cv2.transform(np.array([pts2]), M)[0].astype(np.int32)
    cv2.drawContours(canvas, [pts2], 0, (255, 255, 255), -1)
    ground_truth.append({"expected": "triangle", "pos": (120, 260), "desc": "Rotated Right Triangle (45 deg)"})

    # Triangle 3: Isosceles rotated 120 deg at (270, 260)
    cx, cy = 270, 260
    w, h = 65, 80
    pts3 = np.array([[cx, cy - h/2], [cx - w/2, cy + h/2], [cx + w/2, cy + h/2]], dtype=np.float32)
    M = cv2.getRotationMatrix2D((cx, cy), 120, 1.0)
    pts3 = cv2.transform(np.array([pts3]), M)[0].astype(np.int32)
    cv2.drawContours(canvas, [pts3], 0, (255, 255, 255), -1)
    ground_truth.append({"expected": "triangle", "pos": (270, 260), "desc": "Rotated Isosceles Triangle (120 deg)"})

    # 3. SQUARES (3 samples)
    # Square 1: Axis-aligned small (46x46) at (440, 260)
    rect1 = ((440, 260), (46, 46), 0)
    cv2.drawContours(canvas, [np.int32(cv2.boxPoints(rect1))], 0, (255, 255, 255), -1)
    ground_truth.append({"expected": "square", "pos": (440, 260), "desc": "Axis-Aligned Square (46x46)"})

    # Square 2: Rotated 45 deg diamond (65x65) at (620, 260)
    rect2 = ((620, 260), (65, 65), 45)
    cv2.drawContours(canvas, [np.int32(cv2.boxPoints(rect2))], 0, (255, 255, 255), -1)
    ground_truth.append({"expected": "square", "pos": (620, 260), "desc": "Rotated Diamond Square (45 deg)"})

    # Square 3: Rotated 25 deg medium (74x74) at (120, 420)
    rect3 = ((120, 420), (74, 74), 25)
    cv2.drawContours(canvas, [np.int32(cv2.boxPoints(rect3))], 0, (255, 255, 255), -1)
    ground_truth.append({"expected": "square", "pos": (120, 420), "desc": "Rotated Square (25 deg)"})

    # 4. RECTANGLES (3 samples)
    # Rectangle 1: Horizontal (115x45) at (290, 420)
    rect4 = ((290, 420), (115, 45), 0)
    cv2.drawContours(canvas, [np.int32(cv2.boxPoints(rect4))], 0, (255, 255, 255), -1)
    ground_truth.append({"expected": "rectangle", "pos": (290, 420), "desc": "Horizontal Rectangle (115x45)"})

    # Rectangle 2: Vertical (42x110) at (470, 420)
    rect5 = ((470, 420), (110, 42), 90)
    cv2.drawContours(canvas, [np.int32(cv2.boxPoints(rect5))], 0, (255, 255, 255), -1)
    ground_truth.append({"expected": "rectangle", "pos": (470, 420), "desc": "Vertical Rectangle (42x110)"})

    # Rectangle 3: Rotated 35 deg (120x42) at (650, 420)
    rect6 = ((650, 420), (120, 42), 35)
    cv2.drawContours(canvas, [np.int32(cv2.boxPoints(rect6))], 0, (255, 255, 255), -1)
    ground_truth.append({"expected": "rectangle", "pos": (650, 420), "desc": "Rotated Rectangle (35 deg)"})

    # 5. ELLIPSES (3 samples)
    # Ellipse 1: Horizontal major=50, minor=26 at (200, 530)
    cv2.ellipse(canvas, (200, 530), (50, 26), 0, 0, 360, (255, 255, 255), -1)
    ground_truth.append({"expected": "ellipse", "pos": (200, 530), "desc": "Horizontal Ellipse (50x26)"})

    # Ellipse 2: Vertical major=55, minor=25 at (400, 530)
    cv2.ellipse(canvas, (400, 530), (55, 25), 90, 0, 360, (255, 255, 255), -1)
    ground_truth.append({"expected": "ellipse", "pos": (400, 530), "desc": "Vertical Ellipse (55x25)"})

    # Ellipse 3: Rotated 45 deg major=54, minor=24 at (600, 530)
    cv2.ellipse(canvas, (600, 530), (54, 24), 45, 0, 360, (255, 255, 255), -1)
    ground_truth.append({"expected": "ellipse", "pos": (600, 530), "desc": "Rotated Ellipse (45 deg)"})

    return canvas, ground_truth

def run_15_shape_validation():
    print("=" * 70)
    print("PIXELLAB - 15 INDEPENDENT SHAPES VALIDATION TEST SUITE")
    print("=" * 70)

    canvas, ground_truth = create_15_shapes_benchmark()
    
    # Save image for benchmark samples
    out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "samples", "classification")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "test_validation_15_shapes.png")
    cv2.imwrite(out_path, canvas)
    print(f"Saved 15-shape benchmark scene to: {out_path}")

    # Also save to frontend samples
    fe_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "public", "samples", "classification")
    os.makedirs(fe_dir, exist_ok=True)
    cv2.imwrite(os.path.join(fe_dir, "test_validation_15_shapes.png"), canvas)

    # Process through pipeline
    res = process_classification_pipeline(canvas)
    detected_objects = res["objects"]

    print(f"Total Detected Objects: {len(detected_objects)} / {len(ground_truth)} expected\n")

    correct = 0
    results_table = []

    # Match each ground truth to the closest detected object by centroid distance
    for gt in ground_truth:
        gx, gy = gt["pos"]
        best_obj = None
        min_dist = float("inf")
        for obj in detected_objects:
            cx, cy = obj["centroid"]
            dist = math.hypot(cx - gx, cy - gy)
            if dist < min_dist:
                min_dist = dist
                best_obj = obj

        pred = best_obj["predicted_class"] if best_obj else "none"
        conf = best_obj["confidence"] if best_obj else 0.0
        circ = best_obj["circularity"] if best_obj else 0.0
        rect = best_obj["rectangularity"] if best_obj else 0.0
        ar = best_obj["aspect_ratio"] if best_obj else 0.0
        v = best_obj["vertices"] if best_obj else 0

        is_match = (pred == gt["expected"])
        if is_match:
            correct += 1

        results_table.append({
            "desc": gt["desc"],
            "expected": gt["expected"],
            "predicted": pred,
            "match": "PASS" if is_match else "FAIL",
            "confidence": f"{int(conf * 100)}%",
            "circ": circ,
            "rect": rect,
            "ar": ar,
            "v": v
        })

    # Print Table
    header = f"{'Shape Description':<32} {'Expected':<10} {'Predicted':<10} {'Status':<6} {'Vote %':<7} {'Circ':<6} {'Rect':<6} {'AR':<6} {'V':<3}"
    print(header)
    print("-" * len(header))
    for r in results_table:
        print(f"{r['desc']:<32} {r['expected']:<10} {r['predicted']:<10} {r['match']:<6} {r['confidence']:<7} {r['circ']:<6.3f} {r['rect']:<6.3f} {r['ar']:<6.3f} {r['v']:<3}")

    accuracy = (correct / len(ground_truth)) * 100.0
    print("-" * len(header))
    print(f"\nFinal Validation Summary: {correct} / {len(ground_truth)} shapes correctly classified ({accuracy:.1f}%)")

    # Confusion matrix across categories
    categories = ["circle", "triangle", "square", "rectangle", "ellipse"]
    cm = {c1: {c2: 0 for c2 in categories} for c1 in categories}
    for r in results_table:
        cm[r["expected"]][r["predicted"]] += 1

    print("\nConfusion Matrix (Expected vs Predicted):")
    print(f"{'':<12} " + " ".join([f"{c[:4]:>6}" for c in categories]))
    for c1 in categories:
        row_str = " ".join([f"{cm[c1][c2]:>6}" for c2 in categories])
        print(f"{c1:<12} {row_str}")

    assert correct == len(ground_truth), f"Validation failed! Only {correct}/{len(ground_truth)} passed."
    print("\nALL 15 INDEPENDENT VALIDATION SHAPES PASSED WITH 100% ACCURACY!")

if __name__ == "__main__":
    run_15_shape_validation()

