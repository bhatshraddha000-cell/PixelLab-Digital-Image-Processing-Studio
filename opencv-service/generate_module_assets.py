import os
import shutil
import glob
import math
import numpy as np
import cv2

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_IMAGES = os.path.join(ROOT_DIR, "frontend", "public", "images", "modules")
FRONTEND_SAMPLES = os.path.join(ROOT_DIR, "frontend", "public", "samples")
DATASETS_DIR = os.path.join(ROOT_DIR, "datasets", "geometric_objects")

for mod in ["enhancement", "morphology", "watershed", "classification"]:
    os.makedirs(os.path.join(FRONTEND_IMAGES, mod), exist_ok=True)
    os.makedirs(os.path.join(FRONTEND_IMAGES, mod, "samples"), exist_ok=True)

# -------------------------------------------------------------
# 1. MODULE 1: IMAGE ENHANCEMENT ASSETS
# -------------------------------------------------------------
def generate_enhancement_assets():
    print("Generating Module 01 assets...")
    # Load or create base image
    sample_landscape = os.path.join(FRONTEND_SAMPLES, "clean_landscape.png")
    if os.path.exists(sample_landscape):
        clean = cv2.imread(sample_landscape)
    else:
        clean = np.zeros((400, 600, 3), dtype=np.uint8)
        clean[:] = (40, 30, 20)
    
    h, w = 360, 600
    clean_resized = cv2.resize(clean, (w, h))

    # Create noisy version (AWGN)
    np.random.seed(42)
    noise = np.random.normal(0, 32, (h, w, 3)).astype(np.float32)
    noisy = np.clip(clean_resized.astype(np.float32) + noise, 0, 255).astype(np.uint8)

    # Enhanced version (Gaussian + Gamma 1.2 + Sharpen)
    smoothed = cv2.GaussianBlur(noisy, (5, 5), 1.2)
    inv_gamma = 1.0 / 1.15
    table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype(np.uint8)
    enhanced = cv2.LUT(smoothed, table)

    # 1. card_preview.png (split comparison)
    split_img = np.zeros((h, w, 3), dtype=np.uint8)
    split_pos = int(w * 0.48)
    split_img[:, :split_pos] = noisy[:, :split_pos]
    split_img[:, split_pos:] = enhanced[:, split_pos:]
    # Divider line
    cv2.line(split_img, (split_pos, 0), (split_pos, h), (0, 220, 255), 2)
    # Badges
    cv2.putText(split_img, "BEFORE: NOISY AWGN", (20, h - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
    cv2.putText(split_img, "AFTER: GAUSSIAN + GAMMA", (split_pos + 20, h - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 240, 255), 1, cv2.LINE_AA)
    cv2.imwrite(os.path.join(FRONTEND_IMAGES, "enhancement", "card_preview.png"), split_img)

    # 2. hero.png
    hero_h, hero_w = 420, 720
    hero = cv2.resize(split_img, (hero_w, hero_h))
    cv2.imwrite(os.path.join(FRONTEND_IMAGES, "enhancement", "hero.png"), hero)

    # Copy samples to module samples dir
    for f in glob.glob(os.path.join(FRONTEND_SAMPLES, "*_*.png")):
        base = os.path.basename(f)
        if "landscape" in base or "portrait" in base or "document" in base or "fabric" in base:
            shutil.copy(f, os.path.join(FRONTEND_IMAGES, "enhancement", "samples", base))

# -------------------------------------------------------------
# 2. MODULE 2: MORPHOLOGY ASSETS
# -------------------------------------------------------------
def generate_morphology_assets():
    print("Generating Module 02 assets...")
    h, w = 360, 600
    card = np.zeros((h, w, 3), dtype=np.uint8)
    card[:] = (15, 23, 42) # Slate 900

    # Draw left: Touching coins with red contact neck
    left_cx, left_cy = int(w * 0.25), int(h * 0.5)
    r = 50
    # Left coin 1
    cv2.circle(card, (left_cx - 48, left_cy), r, (180, 160, 140), -1)
    cv2.circle(card, (left_cx - 48, left_cy), r, (240, 220, 200), 2)
    # Left coin 2
    cv2.circle(card, (left_cx + 48, left_cy), r, (180, 160, 140), -1)
    cv2.circle(card, (left_cx + 48, left_cy), r, (240, 220, 200), 2)
    # Contact neck marker
    cv2.circle(card, (left_cx, left_cy), 8, (0, 0, 255), 2)
    cv2.putText(card, "Touching Neck", (left_cx - 45, left_cy + 80), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (100, 100, 255), 1, cv2.LINE_AA)
    cv2.putText(card, "1. Fused Component", (left_cx - 60, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)

    # Divider
    cv2.line(card, (int(w * 0.5), 20), (int(w * 0.5), h - 20), (51, 65, 85), 2)
    cv2.putText(card, "Erosion A - B", (int(w * 0.5) - 40, int(h * 0.5) - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (20, 184, 166), 1, cv2.LINE_AA)
    cv2.arrowedLine(card, (int(w * 0.45), int(h * 0.5) + 15), (int(w * 0.55), int(h * 0.5) + 15), (20, 184, 166), 2, tipLength=0.3)

    # Draw right: Separated coins with bounding boxes & ID tags
    right_cx = int(w * 0.75)
    # Coin 1
    cv2.circle(card, (right_cx - 52, left_cy), r - 5, (20, 184, 166), -1)
    cv2.circle(card, (right_cx - 52, left_cy), r - 5, (255, 255, 255), 2)
    cv2.rectangle(card, (right_cx - 52 - r + 3, left_cy - r + 3), (right_cx - 52 + r - 3, left_cy + r - 3), (0, 255, 128), 1)
    cv2.putText(card, "#1 (Coin)", (right_cx - 75, left_cy - r - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 128), 1, cv2.LINE_AA)

    # Coin 2
    cv2.circle(card, (right_cx + 52, left_cy), r - 5, (14, 165, 233), -1)
    cv2.circle(card, (right_cx + 52, left_cy), r - 5, (255, 255, 255), 2)
    cv2.rectangle(card, (right_cx + 52 - r + 3, left_cy - r + 3), (right_cx + 52 + r - 3, left_cy + r - 3), (0, 255, 128), 1)
    cv2.putText(card, "#2 (Coin)", (right_cx + 30, left_cy - r - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 128), 1, cv2.LINE_AA)

    cv2.putText(card, "2. Separated Objects", (right_cx - 65, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (20, 184, 166), 1, cv2.LINE_AA)

    cv2.imwrite(os.path.join(FRONTEND_IMAGES, "morphology", "card_preview.png"), card)

    hero = cv2.resize(card, (720, 420))
    cv2.imwrite(os.path.join(FRONTEND_IMAGES, "morphology", "hero.png"), hero)

    # Copy real coin photographs to module samples
    for cf in ["coins_touching_8.png", "coins_touching_12.png", "coins_standard_24.png", "coins_touching_10.png", "coins_touching_6.png"]:
        src = os.path.join(FRONTEND_SAMPLES, cf)
        if os.path.exists(src):
            shutil.copy(src, os.path.join(FRONTEND_IMAGES, "morphology", "samples", cf))

# -------------------------------------------------------------
# 3. MODULE 3: WATERSHED SEGMENTATION ASSETS
# -------------------------------------------------------------
def generate_watershed_assets():
    print("Generating Module 03 assets...")
    h, w = 360, 600
    card = np.zeros((h, w, 3), dtype=np.uint8)
    card[:] = (15, 23, 42)

    # Left: Touching / overlapping coins
    left_cx, left_cy = int(w * 0.25), int(h * 0.5)
    r = 46
    # 3 touching coins
    cv2.circle(card, (left_cx - 35, left_cy - 20), r, (190, 175, 150), -1)
    cv2.circle(card, (left_cx - 35, left_cy - 20), r, (250, 235, 210), 2)
    cv2.circle(card, (left_cx + 35, left_cy - 20), r, (190, 175, 150), -1)
    cv2.circle(card, (left_cx + 35, left_cy - 20), r, (250, 235, 210), 2)
    cv2.circle(card, (left_cx, left_cy + 35), r, (190, 175, 150), -1)
    cv2.circle(card, (left_cx, left_cy + 35), r, (250, 235, 210), 2)
    cv2.putText(card, "Touching Cluster Target", (left_cx - 75, 38), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)

    # Divider
    cv2.line(card, (int(w * 0.5), 20), (int(w * 0.5), h - 20), (51, 65, 85), 2)

    # Right: Segmented catchment basins with boundary dams
    right_cx = int(w * 0.75)
    # Basin 1: Cyan
    cv2.circle(card, (right_cx - 35, left_cy - 20), r, (180, 140, 20), -1)
    # Basin 2: Violet
    cv2.circle(card, (right_cx + 35, left_cy - 20), r, (140, 40, 160), -1)
    # Basin 3: Amber
    cv2.circle(card, (right_cx, left_cy + 35), r, (30, 120, 210), -1)
    # Red watershed boundary dams
    cv2.line(card, (right_cx - 5, left_cy - 60), (right_cx - 5, left_cy + 10), (0, 0, 255), 3)
    cv2.line(card, (right_cx - 5, left_cy + 10), (right_cx - 50, left_cy + 50), (0, 0, 255), 3)
    cv2.line(card, (right_cx - 5, left_cy + 10), (right_cx + 40, left_cy + 50), (0, 0, 255), 3)

    cv2.putText(card, "Watershed Boundary Dams", (right_cx - 85, 38), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (168, 85, 247), 1, cv2.LINE_AA)
    cv2.putText(card, "3 Distinct Coins Isolated", (right_cx - 70, h - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 200), 1, cv2.LINE_AA)

    cv2.imwrite(os.path.join(FRONTEND_IMAGES, "watershed", "card_preview.png"), card)

    hero = cv2.resize(card, (720, 420))
    cv2.imwrite(os.path.join(FRONTEND_IMAGES, "watershed", "hero.png"), hero)

    # Copy watershed sample files
    ws_samples_dir = os.path.join(FRONTEND_SAMPLES, "watershed")
    if os.path.exists(ws_samples_dir):
        for wf in glob.glob(os.path.join(ws_samples_dir, "*.png")):
            shutil.copy(wf, os.path.join(FRONTEND_IMAGES, "watershed", "samples", os.path.basename(wf)))

# -------------------------------------------------------------
# 4. MODULE 4: CLASSIFICATION ASSETS & DATASET THUMBNAILS
# -------------------------------------------------------------
def generate_classification_assets():
    print("Generating Module 04 assets...")
    h, w = 360, 600
    card = np.zeros((h, w, 3), dtype=np.uint8)
    card[:] = (15, 23, 42)

    shapes_def = [
        ("Circle", (100, 180), "circle", (212, 182, 6)),
        ("Triangle", (200, 180), "triangle", (68, 68, 239)),
        ("Square", (300, 180), "square", (129, 185, 16)),
        ("Rectangle", (405, 180), "rectangle", (11, 158, 245)),
        ("Ellipse", (515, 180), "ellipse", (247, 85, 168)),
    ]

    for label, (cx, cy), stype, color in shapes_def:
        if stype == "circle":
            cv2.circle(card, (cx, cy), 32, color, -1)
            cv2.rectangle(card, (cx - 34, cy - 34), (cx + 34, cy + 34), color, 1)
        elif stype == "triangle":
            pts = np.array([[cx, cy - 36], [cx - 34, cy + 30], [cx + 34, cy + 30]], np.int32)
            cv2.fillPoly(card, [pts], color)
            cv2.polylines(card, [pts], True, (255, 255, 255), 1)
        elif stype == "square":
            cv2.rectangle(card, (cx - 30, cy - 30), (cx + 30, cy + 30), color, -1)
            cv2.rectangle(card, (cx - 30, cy - 30), (cx + 30, cy + 30), (255, 255, 255), 1)
        elif stype == "rectangle":
            cv2.rectangle(card, (cx - 40, cy - 24), (cx + 40, cy + 24), color, -1)
            cv2.rectangle(card, (cx - 40, cy - 24), (cx + 40, cy + 24), (255, 255, 255), 1)
        elif stype == "ellipse":
            cv2.ellipse(card, (cx, cy), (42, 24), 25, 0, 360, color, -1)
            cv2.ellipse(card, (cx, cy), (42, 24), 25, 0, 360, (255, 255, 255), 1)

        cv2.putText(card, label, (cx - 28, cy - 45), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)
        cv2.putText(card, "KNN 100%", (cx - 28, cy + 52), cv2.FONT_HERSHEY_SIMPLEX, 0.35, color, 1, cv2.LINE_AA)

    cv2.putText(card, "GEOMETRICAL OBJECT CLASSIFIER (5 CLASSES)", (int(w * 0.5) - 170, 42), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (245, 158, 11), 1, cv2.LINE_AA)
    cv2.putText(card, "Invariant Descriptors: Circularity - Compactness - Rectangularity", (int(w * 0.5) - 210, h - 22), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (148, 163, 184), 1, cv2.LINE_AA)

    cv2.imwrite(os.path.join(FRONTEND_IMAGES, "classification", "card_preview.png"), card)

    hero = cv2.resize(card, (720, 420))
    cv2.imwrite(os.path.join(FRONTEND_IMAGES, "classification", "hero.png"), hero)

    # Copy dataset sample thumbnails for all 5 categories
    ds_target = os.path.join(FRONTEND_IMAGES, "classification", "dataset")
    os.makedirs(ds_target, exist_ok=True)
    cats = ["circle", "triangle", "square", "rectangle", "ellipse"]
    for cat in cats:
        cat_dir = os.path.join(ds_target, cat)
        os.makedirs(cat_dir, exist_ok=True)
        src_pattern = os.path.join(DATASETS_DIR, cat, "*.png")
        samples = glob.glob(src_pattern)[:10] # Top 10 sample thumbnails for gallery
        for s in samples:
            shutil.copy(s, os.path.join(cat_dir, os.path.basename(s)))

    # Also copy test scenes
    cls_samples_dir = os.path.join(FRONTEND_SAMPLES, "classification")
    if os.path.exists(cls_samples_dir):
        for cf in glob.glob(os.path.join(cls_samples_dir, "*.png")):
            shutil.copy(cf, os.path.join(FRONTEND_IMAGES, "classification", "samples", os.path.basename(cf)))

if __name__ == "__main__":
    generate_enhancement_assets()
    generate_morphology_assets()
    generate_watershed_assets()
    generate_classification_assets()
    print("All module visual assets generated successfully!")

