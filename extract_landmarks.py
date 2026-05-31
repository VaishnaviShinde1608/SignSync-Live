"""
extract_landmarks.py  –  Extract MediaPipe hand landmarks from ASL dataset images.

This processes every image through MediaPipe Hands to get 21 landmark points (x, y, z).
These 63 features are then used to train a geometry-based classifier — which is 
invariant to skin color, lighting, and background.

Usage:
    pip install mediapipe opencv-python numpy
    python extract_landmarks.py

Output:
    landmarks_data.npz  (features + labels + class_names)
"""

import os, cv2, numpy as np, urllib.request
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions, vision
from mediapipe.tasks.python.vision import HandLandmarker, HandLandmarkerOptions

DATASET_DIR = os.path.join(os.path.dirname(__file__), "archive", "asl_dataset")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "landmarks_data.npz")
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
MODEL_PATH = os.path.join(os.path.dirname(__file__), "hand_landmarker.task")


def download_model():
    """Download the MediaPipe hand landmarker model if not present."""
    if not os.path.exists(MODEL_PATH):
        print("Downloading hand_landmarker model...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        print("Downloaded ✓")


def normalize_landmarks(landmarks):
    """Normalize landmarks relative to wrist (landmark 0) and scale by hand size."""
    coords = landmarks.reshape(21, 3)
    
    # Translate so wrist is at origin
    wrist = coords[0].copy()
    coords = coords - wrist
    
    # Scale by distance from wrist to middle finger MCP (landmark 9)
    scale = np.linalg.norm(coords[9])
    if scale > 0:
        coords = coords / scale
    
    return coords.flatten()


def main():
    download_model()
    
    class_names = sorted([
        d for d in os.listdir(DATASET_DIR)
        if os.path.isdir(os.path.join(DATASET_DIR, d)) and d != "asl_dataset"
    ])
    
    print(f"Found {len(class_names)} classes: {class_names}")
    
    all_features = []
    all_labels = []
    
    # Create hand landmarker
    options = HandLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=MODEL_PATH),
        num_hands=1,
        min_hand_detection_confidence=0.1,
        min_hand_presence_confidence=0.1,
    )
    
    with HandLandmarker.create_from_options(options) as detector:
        for idx, cls in enumerate(class_names):
            cls_dir = os.path.join(DATASET_DIR, cls)
            files = [f for f in os.listdir(cls_dir)
                     if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            
            success = 0
            for fname in files:
                filepath = os.path.join(cls_dir, fname)
                img_cv = cv2.imread(filepath)
                if img_cv is None:
                    continue

                # Try original image first
                img = mp.Image.create_from_file(filepath)
                result = detector.detect(img)
                
                # If no detection, try flipped image
                if not result.hand_landmarks:
                    flipped = cv2.flip(img_cv, 1)
                    tmp_path = os.path.join(cls_dir, "_tmp_flip.jpg")
                    cv2.imwrite(tmp_path, flipped)
                    img2 = mp.Image.create_from_file(tmp_path)
                    result = detector.detect(img2)
                    os.remove(tmp_path)
                
                # If still no detection, try with contrast enhancement
                if not result.hand_landmarks:
                    lab = cv2.cvtColor(img_cv, cv2.COLOR_BGR2LAB)
                    l, a_ch, b_ch = cv2.split(lab)
                    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
                    l = clahe.apply(l)
                    enhanced = cv2.merge([l, a_ch, b_ch])
                    enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
                    tmp_path = os.path.join(cls_dir, "_tmp_enh.jpg")
                    cv2.imwrite(tmp_path, enhanced)
                    img3 = mp.Image.create_from_file(tmp_path)
                    result = detector.detect(img3)
                    os.remove(tmp_path)
                
                if not result.hand_landmarks:
                    continue
                
                hand = result.hand_landmarks[0]
                landmarks = []
                for lm in hand:
                    landmarks.extend([lm.x, lm.y, lm.z])
                
                landmarks = np.array(landmarks, dtype=np.float32)
                normalized = normalize_landmarks(landmarks)
                all_features.append(normalized)
                all_labels.append(idx)
                success += 1
                
                # Data augmentation: add slightly perturbed versions for low-sample classes
                if cls in ('a', 'e', 'm', 'n', 's', 't', 'j', 'o', 'q'):
                    for _ in range(3):
                        noise = np.random.normal(0, 0.01, normalized.shape).astype(np.float32)
                        all_features.append(normalized + noise)
                        all_labels.append(idx)
            
            print(f"  {cls}: {success}/{len(files)} images had detectable hands")
    
    features = np.array(all_features, dtype=np.float32)
    labels = np.array(all_labels, dtype=np.int32)
    
    print(f"\nTotal samples with landmarks: {len(features)}")
    print(f"Feature shape: {features.shape}")
    
    np.savez(OUTPUT_PATH, features=features, labels=labels, class_names=class_names)
    print(f"Saved → {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
