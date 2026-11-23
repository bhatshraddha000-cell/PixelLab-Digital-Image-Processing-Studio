import os
import math
import cv2
import numpy as np
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.classification import extract_contour_descriptors, train_knn_model

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, "datasets", "geometric_objects")

def create_circle_image(radius: int, offset=(0, 0), size=200):
    img = np.zeros((size, size), dtype=np.uint8)
    cx, cy = size // 2 + offset[0], size // 2 + offset[1]
    cv2.circle(img, (cx, cy), radius, 255, -1)
    return img

def create_square_image(side: int, angle: float, offset=(0, 0), size=200):
    img = np.zeros((size, size), dtype=np.uint8)
    cx, cy = size // 2 + offset[0], size // 2 + offset[1]
    rect = ((cx, cy), (side, side), angle)
    box = np.int32(cv2.boxPoints(rect))
    cv2.drawContours(img, [box], 0, 255, -1)
    return img

def create_rectangle_image(w: int, h: int, angle: float, offset=(0, 0), size=200):
    img = np.zeros((size, size), dtype=np.uint8)
    cx, cy = size // 2 + offset[0], size // 2 + offset[1]
    rect = ((cx, cy), (w, h), angle)
    box = np.int32(cv2.boxPoints(rect))
    cv2.drawContours(img, [box], 0, 255, -1)
    return img

def create_ellipse_image(major_r: int, minor_r: int, angle: float, offset=(0, 0), size=200):
    img = np.zeros((size, size), dtype=np.uint8)
    cx, cy = size // 2 + offset[0], size // 2 + offset[1]
    cv2.ellipse(img, (cx, cy), (major_r, minor_r), angle, 0, 360, 255, -1)
    return img

def create_triangle_image(tri_type: str, scale: float, angle: float, offset=(0, 0), size=200):
    img = np.zeros((size, size), dtype=np.uint8)
    cx, cy = size // 2 + offset[0], size // 2 + offset[1]
    
    if tri_type == "equilateral":
        r = 50 * scale
        pts = np.array([
            [cx, cy - r],
            [cx - r * math.cos(math.pi / 6), cy + r * math.sin(math.pi / 6)],
            [cx + r * math.cos(math.pi / 6), cy + r * math.sin(math.pi / 6)]
        ], dtype=np.float32)
    elif tri_type == "right":
        w, h = 70 * scale, 85 * scale
        pts = np.array([
            [cx - w/2, cy + h/2],
            [cx + w/2, cy + h/2],
            [cx - w/2, cy - h/2]
        ], dtype=np.float32)
    elif tri_type == "isosceles":
        w, h = 75 * scale, 95 * scale
        pts = np.array([
            [cx, cy - h/2],
            [cx - w/2, cy + h/2],
            [cx + w/2, cy + h/2]
        ], dtype=np.float32)
    else: # scalene / acute
        pts = np.array([
            [cx - 30 * scale, cy - 40 * scale],
            [cx - 45 * scale, cy + 45 * scale],
            [cx + 50 * scale, cy + 30 * scale]
        ], dtype=np.float32)

    if angle != 0:
        M = cv2.getRotationMatrix2D((cx, cy), angle, 1.0)
        pts = cv2.transform(np.array([pts]), M)[0]

    pts = pts.astype(np.int32)
    cv2.drawContours(img, [pts], 0, 255, -1)
    return img

def generate_balanced_dataset():
    print(f"Generating balanced dataset in: {DATASET_DIR}")
    
    categories = ["circle", "triangle", "square", "rectangle", "ellipse"]
    for cat in categories:
        cat_dir = os.path.join(DATASET_DIR, cat)
        os.makedirs(cat_dir, exist_ok=True)
        # Clear old files
        for f in os.listdir(cat_dir):
            if f.endswith(".png"):
                os.remove(os.path.join(cat_dir, f))

    np.random.seed(42)
    counts = {c: 0 for c in categories}

    # 1. CIRCLES (30 samples: radii 18 to 72, various offsets)
    radii = np.linspace(18, 72, 30)
    for i, r in enumerate(radii):
        ox = int((i % 5 - 2) * 4)
        oy = int(((i // 5) % 5 - 2) * 4)
        img = create_circle_image(int(r), offset=(ox, oy))
        fn = f"circle_{i+1:02d}.png"
        cv2.imwrite(os.path.join(DATASET_DIR, "circle", fn), img)
        counts["circle"] += 1

    # 2. SQUARES (30 samples: sides 32 to 96, rotation angles 0 to 85 degrees)
    sides = np.linspace(34, 96, 30)
    angles = np.linspace(0, 85, 30)
    for i in range(30):
        s = int(sides[i])
        ang = float(angles[i])
        ox = int((i % 4 - 2) * 3)
        oy = int(((i // 4) % 4 - 2) * 3)
        img = create_square_image(s, ang, offset=(ox, oy))
        fn = f"square_{i+1:02d}.png"
        cv2.imwrite(os.path.join(DATASET_DIR, "square", fn), img)
        counts["square"] += 1

    # 3. RECTANGLES (30 samples: aspect ratios 1.5 to 3.6, rotations 0 to 170 degrees)
    aspect_ratios = np.linspace(1.5, 3.5, 30)
    rect_angles = np.linspace(0, 170, 30)
    for i in range(30):
        ar = aspect_ratios[i]
        short_side = int(28 + (i % 5) * 5)
        long_side = int(short_side * ar)
        ang = float(rect_angles[i])
        ox = int((i % 4 - 2) * 3)
        oy = int(((i // 4) % 4 - 2) * 3)
        img = create_rectangle_image(long_side, short_side, ang, offset=(ox, oy), size=240)
        fn = f"rectangle_{i+1:02d}.png"
        cv2.imwrite(os.path.join(DATASET_DIR, "rectangle", fn), img)
        counts["rectangle"] += 1

    # 4. ELLIPSES (30 samples: axis ratios 1.45 to 2.8, rotations 0 to 170 degrees)
    ellipse_ratios = np.linspace(1.45, 2.8, 30)
    ellipse_angles = np.linspace(0, 170, 30)
    for i in range(30):
        er = ellipse_ratios[i]
        minor = int(22 + (i % 6) * 4)
        major = int(minor * er)
        ang = float(ellipse_angles[i])
        ox = int((i % 4 - 2) * 3)
        oy = int(((i // 4) % 4 - 2) * 3)
        img = create_ellipse_image(major, minor, ang, offset=(ox, oy), size=240)
        fn = f"ellipse_{i+1:02d}.png"
        cv2.imwrite(os.path.join(DATASET_DIR, "ellipse", fn), img)
        counts["ellipse"] += 1

    # 5. TRIANGLES (30 samples: equilateral, isosceles, right, scalene with rotations 0 to 330 deg)
    tri_types = ["equilateral", "isosceles", "right", "scalene"]
    tri_angles = np.linspace(0, 330, 30)
    scales = np.linspace(0.7, 1.3, 30)
    for i in range(30):
        ttype = tri_types[i % len(tri_types)]
        sc = float(scales[i])
        ang = float(tri_angles[i])
        ox = int((i % 4 - 2) * 4)
        oy = int(((i // 4) % 4 - 2) * 4)
        img = create_triangle_image(ttype, sc, ang, offset=(ox, oy), size=220)
        fn = f"triangle_{i+1:02d}.png"
        cv2.imwrite(os.path.join(DATASET_DIR, "triangle", fn), img)
        counts["triangle"] += 1

    print(f"Generated samples: {counts} (Total: {sum(counts.values())})")

if __name__ == "__main__":
    generate_balanced_dataset()
    print("\nRetraining model on new balanced dataset...")
    res = train_knn_model(k=3, test_ratio=0.20)
    print("Training Results:")
    print(f"  Accuracy: {res['accuracy'] * 100:.2f}%")
    print(f"  Macro Precision: {res['precision_macro'] * 100:.2f}%")
    print(f"  Macro Recall:    {res['recall_macro'] * 100:.2f}%")
    print(f"  Macro F1:        {res['f1_macro'] * 100:.2f}%")
    print("  Confusion Matrix:")
    print("    Labels:", res["confusion_matrix"]["labels"])
    for row in res["confusion_matrix"]["matrix"]:
        print("   ", row)

