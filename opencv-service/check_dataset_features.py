import sys
sys.path.insert(0, 'opencv-service')
import os, glob, cv2, numpy as np
from app.classification import extract_contour_descriptors

DATASETS_DIR = r'datasets/geometric_objects'
categories = ['circle', 'triangle', 'square', 'rectangle', 'ellipse']

for cat in categories:
    files = glob.glob(os.path.join(DATASETS_DIR, cat, '*.png'))
    print(f"\n================ CATEGORY: {cat} ================")
    circs, comps, rects, ars, verts = [], [], [], [], []
    for f in files[:10]:
        img = cv2.imread(f, cv2.IMREAD_GRAYSCALE)
        _, thresh = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        cnts, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        c = max(cnts, key=cv2.contourArea)
        d = extract_contour_descriptors(c)
        circs.append(d['circularity'])
        comps.append(d['compactness'])
        rects.append(d['rectangularity'])
        ars.append(d['aspect_ratio'])
        verts.append(d['vertices'])
        print(f"  {os.path.basename(f)}: area={d['area']}, circ={d['circularity']}, comp={d['compactness']}, rect={d['rectangularity']}, AR={d['aspect_ratio']}, V={d['vertices']}")
    print(f"  --> MEAN: circ={np.mean(circs):.3f}, comp={np.mean(comps):.3f}, rect={np.mean(rects):.3f}, AR={np.mean(ars):.3f}, V={np.mean(verts):.1f}")

