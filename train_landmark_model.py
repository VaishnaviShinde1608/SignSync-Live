"""
train_landmark_model.py  –  Train a Random Forest classifier on hand landmark features.

Uses the 63-dimensional landmark features extracted by extract_landmarks.py.
This approach is invariant to skin color, lighting, and background because
it only looks at hand geometry (joint positions).

Usage:
    python extract_landmarks.py   (run first to generate landmarks_data.npz)
    python train_landmark_model.py

Output:
    landmark_classifier.pkl   (trained Random Forest model)
    landmark_labels.json      (class name list)
"""

import os, json, numpy as np, pickle
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

DATA_PATH   = os.path.join(os.path.dirname(__file__), "landmarks_data.npz")
MODEL_PATH  = os.path.join(os.path.dirname(__file__), "landmark_classifier.pkl")
LABELS_PATH = os.path.join(os.path.dirname(__file__), "landmark_labels.json")


def main():
    # Load extracted landmarks
    data = np.load(DATA_PATH, allow_pickle=True)
    features    = data["features"]
    labels      = data["labels"]
    class_names = list(data["class_names"])

    print(f"Loaded {len(features)} samples, {len(class_names)} classes")
    print(f"Feature shape: {features.shape}")

    # Split
    X_train, X_val, y_train, y_val = train_test_split(
        features, labels, test_size=0.2, random_state=42, stratify=labels,
    )
    print(f"Train: {len(X_train)}  Val: {len(X_val)}")

    # Train Random Forest (fast, robust, handles 63 features well)
    print("\nTraining Random Forest...")
    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)

    # Evaluate
    y_pred = clf.predict(X_val)
    acc = accuracy_score(y_val, y_pred)
    print(f"\nValidation accuracy: {acc:.2%}")
    print("\nPer-class report:")
    print(classification_report(y_val, y_pred, target_names=class_names, zero_division=0))

    # Save model
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(clf, f)
    print(f"Model saved → {MODEL_PATH}")

    with open(LABELS_PATH, "w") as f:
        json.dump(class_names, f)
    print(f"Labels saved → {LABELS_PATH}")


if __name__ == "__main__":
    main()
