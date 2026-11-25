# PixelLab – Sample Images & Licensing Documentation

All real-world photographic sample images in PixelLab are stored locally under `backend/samples/`, `frontend/public/samples/`, and `opencv-service/samples/` so the application operates reliably without external network dependencies. Synthetic benchmark images are explicitly labeled as synthetic and never disguised as real-world photographs.

---

## Module 02: Morphological Object Separation & Counting (7 Benchmarks)

| Filename | Type | Dimensions | Verified Count | Description | Creator | Source URL | License & Attribution |
|---|---|---|---|---|---|---|---|
| `coins_touching_8.png` | Synthetic | 560 × 320 px | 8 | Eight circular metallic coins touching at tangential neck contacts | PixelLab Studio | Local generated benchmark | MIT (Project Internal) |
| `coins_touching_12.png` | Synthetic | 520 × 360 px | 12 | Twelve coins in two staggered rows with tangential contacts | PixelLab Studio | Local generated benchmark | MIT (Project Internal) |
| `coins_standard_24.png` | Real Photograph | 384 × 303 px | 24 | Classic scikit-image `data.coins()` photographic Greek coins | scikit-image contributors | https://scikit-image.org/docs/stable/api/skimage.data.html | Public Domain / BSD-3-Clause |
| `real_euro_coins_8.jpg` | Real Photograph | 720 × 710 px | 8 | Eight Euro coins (1c to €2) arranged on a white surface with small gaps | Vander | https://commons.wikimedia.org/wiki/File:Euro_coins_line.jpg | CC0 1.0 Universal (Public Domain Dedication) |
| `real_jpy_coins_6.png` | Real Photograph | 565 × 386 px | 6 | Six Japanese Yen coins (500, 100, 50, 10, 5, 1 Yen) on black background | Misogi | https://commons.wikimedia.org/wiki/File:JPY_coin3.png | CC BY-SA 3.0 (Attribution: Misogi, Wikimedia Commons) |
| `real_swiss_coins_5.jpg` | Real Photograph | 720 × 537 px | 5 | Five Swiss Franc coins arranged in a close horizontal row on dark slate | Exploratorium efimeros | https://commons.wikimedia.org/wiki/File:Swiss_coins.jpg | CC BY-SA 4.0 (Attribution: Exploratorium efimeros) |
| `real_indian_coins_4.png` | Real Photograph | 720 × 720 px | 4 | Four Indian Rupee coins (₹1, ₹2, ₹5, ₹10) on clean white background | ChiK | https://commons.wikimedia.org/wiki/File:Coins_of_the_Indian_rupee.png | CC BY-SA 4.0 (Attribution: ChiK, Wikimedia Commons) |

---

## Module 03: Watershed Segmentation & Touching Coin Counting (4 Benchmarks)

| Filename | Type | Dimensions | Verified Count | Difficulty | Description | Creator | Source URL | License & Attribution |
|---|---|---|---|---|---|---|---|---|
| `coins_lightly_touching.png` | Synthetic | 560 × 360 px | 8 | Easy | Eight circular coins touching tangentially with ground-truth mask | PixelLab Studio | Local generated benchmark | MIT (Project Internal) |
| `coins_closely_arranged.png` | Synthetic | 520 × 420 px | 12 | Medium | Twelve closely packed coins in dense grid cluster with GT mask | PixelLab Studio | Local generated benchmark | MIT (Project Internal) |
| `coins_slightly_overlapping.png` | Synthetic | 540 × 380 px | 10 | Hard | Ten coins with 6–8 px physical overlap and GT mask | PixelLab Studio | Local generated benchmark | MIT (Project Internal) |
| `real_croatian_euro_9.jpg` | Real Photograph | 720 × 480 px | 9 | Hard | Nine Croatian Euro coins touching at multiple boundary points on EU flag | European Commission | https://commons.wikimedia.org/wiki/File:Croatian_euro_coins_(10).jpg | CC BY 4.0 (Attribution: European Commission) |

---

## Module 04: Region-Based Object Classification (5 Benchmarks)

*Note: Real-world photographs below are kept strictly separated from the 150-sample synthetic KNN training dataset (`datasets/geometric_objects/`) and are never automatically added to training data without explicit user selection.*

| Filename | Type | Category | Dimensions | Description | Creator | Source URL | License & Attribution |
|---|---|---|---|---|---|---|---|
| `test_multi_shapes_5.png` | Synthetic | Multi-Class (5) | 560 × 360 px | Benchmark scene with 1 Circle, 1 Triangle, 1 Square, 1 Rectangle, 1 Ellipse | PixelLab Studio | Local generated benchmark | MIT (Project Internal) |
| `test_mixed_primitives_8.png` | Synthetic | Multi-Class (8) | 680 × 440 px | Eight geometric primitives across 2 rows with scale/rotation variations | PixelLab Studio | Local generated benchmark | MIT (Project Internal) |
| `test_validation_15_shapes.png` | Synthetic | Multi-Class (15) | 800 × 600 px | Controlled 15-shape validation suite (3 per class across rotations & scales) | PixelLab Studio | Local generated benchmark | MIT (Project Internal) |
| `real_circle_dime.jpg` | Real Photograph | Circle | 720 × 719 px | Top-down museum photograph of a circular 1834 US Liberty Cap dime | National Museum of American History | https://commons.wikimedia.org/wiki/File:1834_10C_PR_(large_4)_(obv).jpg | Public Domain |
| `real_ellipse_plate.jpg` | Real Photograph | Ellipse | 720 × 531 px | Top-down studio photograph of an oval yellow ceramic plate on blue background | Crown Lynn Potteries Ltd / Auckland Museum | https://commons.wikimedia.org/wiki/File:Plate,_oval_(AM_2212-1).jpg | CC BY 4.0 (Attribution: Auckland Museum) |
