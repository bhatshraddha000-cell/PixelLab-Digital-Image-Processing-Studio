import os
import sys

# Ensure opencv-service is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)

# Test 1: Health check
res = client.get('/health')
print("HEALTH CHECK:", res.json())
assert res.status_code == 200

# Test 2: Process enhancement with clean reference
sample_noisy = os.path.join(os.path.dirname(__file__), "samples", "noisy_coins_objects.png")
sample_clean = os.path.join(os.path.dirname(__file__), "samples", "clean_coins_objects.png")

with open(sample_noisy, "rb") as f_noisy, open(sample_clean, "rb") as f_clean:
    files = {
        "image": ("noisy_coins.png", f_noisy, "image/png"),
        "reference_image": ("clean_coins.png", f_clean, "image/png")
    }
    data = {
        "kernel_size": 5,
        "sigma": 1.2,
        "gamma": 1.1,
        "sharpening": 0.5
    }
    res_proc = client.post("/process/enhancement", files=files, data=data)
    print("ENHANCE STATUS:", res_proc.status_code)
    assert res_proc.status_code == 200
    res_data = res_proc.json()
    print("PROCESSING TIME (ms):", res_data["processing_time_ms"])
    print("METADATA:", res_data["metadata"])
    print("EVALUATION:", res_data["evaluation"])
    print("ORIGINAL HIST BINS:", len(res_data["histograms"]["original"]["bins"]))
    print("TEST PASSED SUCCESSFULLY!")

