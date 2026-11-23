import sys
sys.path.insert(0, 'opencv-service')
import os, cv2, joblib, numpy as np
from app.classification import extract_contour_descriptors, build_feature_vector, MODEL_FILE, SCALER_FILE

m_data = joblib.load(MODEL_FILE)
scaler = joblib.load(SCALER_FILE)
model = m_data['model']
features = m_data.get('features', [])
print("Trained features list:", features)
print("Model classes_:", model.classes_)

# Test circle from test_multi_shapes_5
img = cv2.imread('backend/samples/classification/test_multi_shapes_5.png')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
_, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
cnts, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

for c in cnts:
    d = extract_contour_descriptors(c)
    if d['area'] > 100:
        vec = build_feature_vector(d, features)
        vec_scaled = scaler.transform([vec])
        pred = model.predict(vec_scaled)[0]
        distances, indices = model.kneighbors(vec_scaled, n_neighbors=5)
        neighbor_classes = [model._y[i] for i in indices[0]]
        print(f"\nContour at bbox {d['bbox']}:")
        print(f"  area={d['area']}, circ={d['circularity']}, comp={d['compactness']}, rect={d['rectangularity']}, AR={d['aspect_ratio']}, V={d['vertices']}")
        print(f"  Raw vector: {dict(zip(features, vec))}")
        print(f"  Scaled vector: {vec_scaled[0]}")
        print(f"  Predicted: {pred}")
        print(f"  5 Nearest Neighbor classes: {neighbor_classes}")
        print(f"  Distances: {distances[0]}")

