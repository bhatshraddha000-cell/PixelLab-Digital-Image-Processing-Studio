import os
import cv2
import numpy as np

def create_sample_datasets():
    samples_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(samples_dir, exist_ok=True)
    np.random.seed(42)

    width, height = 512, 512

    def add_gaussian_noise(image: np.ndarray, sigma: float = 25.0) -> np.ndarray:
        noise = np.random.normal(0, sigma, image.shape)
        noisy = np.clip(image.astype(np.float32) + noise, 0, 255).astype(np.uint8)
        return noisy

    # 1. LANDSCAPE SAMPLE
    # Gradient sunset sky, mountain peaks, sun, and foreground pine trees
    landscape = np.zeros((height, width, 3), dtype=np.uint8)
    for y in range(height):
        # Sky gradient: deep blue at top to orange at horizon
        ratio = y / (height * 0.65)
        if ratio <= 1.0:
            r = int(240 * ratio + 30 * (1 - ratio))
            g = int(120 * ratio + 50 * (1 - ratio))
            b = int(40 * ratio + 140 * (1 - ratio))
            landscape[y, :] = [b, g, r]
        else:
            # Lake water reflection
            water_ratio = (y - height * 0.65) / (height * 0.35)
            r = int(40 + 20 * water_ratio)
            g = int(60 + 30 * water_ratio)
            b = int(90 + 40 * water_ratio)
            landscape[y, :] = [b, g, r]

    # Glowing Sun
    cv2.circle(landscape, (360, 160), 45, (120, 240, 255), -1)
    cv2.circle(landscape, (360, 160), 55, (100, 220, 255), 3)

    # Distant Mountains (Dark purple)
    mountains1 = np.array([[0, 340], [100, 220], [190, 280], [310, 190], [420, 270], [512, 230], [512, 340], [0, 340]])
    cv2.fillPoly(landscape, [mountains1], (80, 50, 70))

    # Midground Mountains (Dark navy slate)
    mountains2 = np.array([[0, 340], [80, 270], [210, 310], [330, 250], [460, 320], [512, 290], [512, 340], [0, 340]])
    cv2.fillPoly(landscape, [mountains2], (50, 40, 45))

    # Pine trees in foreground
    for tx in [40, 90, 140, 440, 480]:
        th = np.random.randint(70, 120)
        cv2.line(landscape, (tx, 340), (tx, 340 - th), (20, 30, 20), 4)
        for layer in range(4):
            pts = np.array([
                [tx, 340 - th + layer * 20],
                [tx - 20 + layer * 3, 340 - th + layer * 20 + 25],
                [tx + 20 - layer * 3, 340 - th + layer * 20 + 25]
            ])
            cv2.fillPoly(landscape, [pts], (25, 45, 25))

    # 2. COINS & OBJECTS SAMPLE
    # Dark felt background with metallic coins of various shades (gold, silver, bronze)
    coins = np.zeros((height, width, 3), dtype=np.uint8)
    coins[:] = [24, 20, 18] # Dark felt

    coin_specs = [
        # (x, y, r, bgr, label)
        (160, 170, 65, (70, 175, 225), "$1"),    # Gold Coin
        (280, 175, 60, (190, 190, 200), "50c"), # Silver Coin (slightly touching coin 1)
        (390, 230, 55, (50, 110, 180), "10c"),  # Bronze Coin
        (180, 330, 70, (200, 205, 210), "$2"),  # Large Silver Coin
        (310, 345, 65, (60, 160, 215), "25c"),  # Gold Coin (touching coin 4)
    ]

    for (cx, cy, cr, color, text) in coin_specs:
        # Outer ring shadow
        cv2.circle(coins, (cx + 4, cy + 4), cr, (10, 8, 8), -1)
        # Coin body
        cv2.circle(coins, (cx, cy), cr, color, -1)
        # Outer ridge
        cv2.circle(coins, (cx, cy), cr - 4, (int(color[0]*0.8), int(color[1]*0.8), int(color[2]*0.8)), 3)
        # Inner decorative circle
        cv2.circle(coins, (cx, cy), cr - 14, (int(color[0]*1.1), int(color[1]*1.1), int(color[2]*1.1)), 1)
        # Embossed Label
        cv2.putText(coins, text, (cx - 24, cy + 8), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (20, 20, 20), 2, cv2.LINE_AA)

    # 3. PORTRAIT / HUMAN BIOMETRIC SILHOUETTE
    portrait = np.zeros((height, width, 3), dtype=np.uint8)
    # Studio lighting backdrop gradient
    for y in range(height):
        for x in range(width):
            dist = np.sqrt((x - 256)**2 + (y - 220)**2)
            val = int(max(20, min(140, 140 - dist * 0.25)))
            portrait[y, x] = [int(val * 0.9), int(val * 0.7), int(val * 0.6)]

    # Head and shoulders
    cv2.ellipse(portrait, (256, 460), (160, 100), 0, 0, 360, (35, 30, 30), -1) # Shoulders
    cv2.ellipse(portrait, (256, 260), (45, 65), 0, 0, 360, (140, 170, 210), -1) # Neck
    cv2.ellipse(portrait, (256, 190), (75, 95), 0, 0, 360, (150, 185, 225), -1) # Face
    # Hair
    cv2.ellipse(portrait, (256, 170), (85, 105), 0, 170, 370, (25, 20, 20), -1)
    # Eyes & Eyebrows
    cv2.ellipse(portrait, (225, 180), (12, 6), 0, 0, 360, (255, 255, 255), -1)
    cv2.circle(portrait, (225, 180), 5, (60, 40, 30), -1)
    cv2.ellipse(portrait, (287, 180), (12, 6), 0, 0, 360, (255, 255, 255), -1)
    cv2.circle(portrait, (287, 180), 5, (60, 40, 30), -1)
    # Nose
    cv2.line(portrait, (256, 180), (253, 210), (120, 150, 190), 2)
    cv2.line(portrait, (253, 210), (262, 214), (120, 150, 190), 2)
    # Lips
    cv2.ellipse(portrait, (256, 235), (20, 8), 0, 0, 360, (90, 100, 180), -1)

    # 4. DOCUMENT / TEXT SAMPLE (Grayscale high resolution)
    document = np.ones((height, width), dtype=np.uint8) * 248 # White parchment
    # Header bar
    cv2.rectangle(document, (40, 35), (472, 70), 30, -1)
    cv2.putText(document, "DIGITAL IMAGE PROCESSING LABORATORY", (55, 58), cv2.FONT_HERSHEY_SIMPLEX, 0.55, 255, 2, cv2.LINE_AA)
    
    # Text lines simulation
    lines_text = [
        "1.0 THEORETICAL PRINCIPLES OF SPATIAL FILTERING",
        "Linear spatial filtering convolves an input image f(x,y) with a kernel h(x,y).",
        "The 2D continuous isotropic Gaussian smoothing function is expressed as:",
        "    G(x,y) = (1 / (2 * pi * sigma^2)) * exp( -(x^2 + y^2) / (2 * sigma^2) )",
        "Power-law intensity transformation (Gamma Correction) follows the relation:",
        "    s = c * r^gamma, where r in [0, 1] represents normalized input pixel intensity.",
        "When gamma < 1, shadowed midtones are expanded, unveiling underexposed details.",
        "When gamma > 1, saturated highlights are compressed toward darker distributions.",
        "Quantitative verification uses Peak Signal-to-Noise Ratio (PSNR) in dB:",
        "    PSNR = 20 * log10( MAX_I / sqrt(MSE) ), with MAX_I = 255 for 8-bit images.",
        "Structural Similarity (SSIM) evaluates luminance, contrast, and structural metrics."
    ]
    for idx, line in enumerate(lines_text):
        y_pos = 110 + idx * 30
        cv2.putText(document, line, (45, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.38, 30, 1, cv2.LINE_AA)
        # Decorative ruled line
        if idx in [0, 4, 8]:
            cv2.line(document, (45, y_pos + 6), (465, y_pos + 6), 180, 1)

    # 5. TEXTURED FABRIC / REPETITIVE MESH
    fabric = np.zeros((height, width, 3), dtype=np.uint8)
    for y in range(height):
        for x in range(width):
            # High-frequency crosshatch interference pattern
            v1 = np.sin(x * 0.18) * np.cos(y * 0.18)
            v2 = np.sin((x + y) * 0.08)
            intensity = int(128 + 60 * v1 + 45 * v2)
            r = int(np.clip(intensity * 0.85, 0, 255))
            g = int(np.clip(intensity * 1.1, 0, 255))
            b = int(np.clip(intensity * 1.25, 0, 255))
            fabric[y, x] = [b, g, r]

    # Save Clean and Noisy versions
    dataset = {
        "landscape": landscape,
        "coins_objects": coins,
        "portrait": portrait,
        "document_text": document,
        "textured_fabric": fabric
    }

    for name, clean_img in dataset.items():
        clean_path = os.path.join(samples_dir, f"clean_{name}.png")
        noisy_path = os.path.join(samples_dir, f"noisy_{name}.png")

        # Save Clean Ground Truth
        cv2.imwrite(clean_path, clean_img)

        # Add Gaussian Noise (sigma=25.0)
        noisy_img = add_gaussian_noise(clean_img, sigma=25.0)
        cv2.imwrite(noisy_path, noisy_img)

        print(f"Generated sample: {name} (clean: {clean_path}, noisy: {noisy_path})")

if __name__ == "__main__":
    create_sample_datasets()

