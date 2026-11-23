import sys
sys.path.insert(0, 'opencv-service')
import os, cv2, joblib, numpy as np
from app.classification import process_classification_pipeline, MODEL_FILE, SCALER_FILE

for sample_name in ['test_multi_shapes_5.png', 'test_mixed_primitives_8.png']:
    sample_path = os.path.join('backend', 'samples', 'classification', sample_name)
    if not os.path.exists(sample_path):
        print(f'Sample {sample_path} not found!')
        continue
    img = cv2.imread(sample_path)
    res = process_classification_pipeline(img)
    print(f'=== Results for {sample_name} ===')
    for o in res['objects']:
        print(f"  ID {o['id']}: pred={o['predicted_class']} ({o['confidence']}), area={o['area']}, P={o['perimeter']}, circ={o['circularity']}, comp={o['compactness']}, rect={o['rectangularity']}, AR={o['aspect_ratio']}, V={o['vertices']}")

