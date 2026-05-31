"""
train_model.py  –  Train a CNN on the ASL alphabet dataset.

Usage:
    pip install tensorflow opencv-python scikit-learn
    python train_model.py

Reads images from  archive/asl_dataset/<class>/  (a-z, 0-9)
Saves the trained model to  asl_model.keras
Saves the class labels to   asl_labels.json
"""

import os, json, cv2, numpy as np
from sklearn.model_selection import train_test_split
from tensorflow import keras
from tensorflow.keras import layers

# ── Config ──────────────────────────────────────────────────
DATASET_DIR = os.path.join(os.path.dirname(__file__), "archive", "asl_dataset")
IMG_SIZE    = 64          # resize every image to 64×64
BATCH_SIZE  = 32
EPOCHS      = 20
MODEL_PATH  = os.path.join(os.path.dirname(__file__), "asl_model.keras")
LABELS_PATH = os.path.join(os.path.dirname(__file__), "asl_labels.json")


def load_dataset():
    """Load images + labels from the dataset directory."""
    images, labels = [], []
    class_names = sorted([
        d for d in os.listdir(DATASET_DIR)
        if os.path.isdir(os.path.join(DATASET_DIR, d)) and d != "asl_dataset"
    ])

    print(f"Found {len(class_names)} classes: {class_names}")

    for idx, cls in enumerate(class_names):
        cls_dir = os.path.join(DATASET_DIR, cls)
        files = [f for f in os.listdir(cls_dir)
                 if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"  {cls}: {len(files)} images")

        for fname in files:
            img = cv2.imread(os.path.join(cls_dir, fname))
            if img is None:
                continue
            img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            images.append(img)
            labels.append(idx)

    images = np.array(images, dtype="float32") / 255.0
    labels = np.array(labels)
    print(f"\nTotal samples: {len(images)}")
    return images, labels, class_names


def build_model(num_classes):
    """CNN for ASL letter classification."""
    model = keras.Sequential([
        layers.Input(shape=(IMG_SIZE, IMG_SIZE, 3)),

        layers.Conv2D(32, 3, activation="relu", padding="same"),
        layers.BatchNormalization(),
        layers.MaxPooling2D(),

        layers.Conv2D(64, 3, activation="relu", padding="same"),
        layers.BatchNormalization(),
        layers.MaxPooling2D(),

        layers.Conv2D(128, 3, activation="relu", padding="same"),
        layers.BatchNormalization(),
        layers.MaxPooling2D(),

        layers.GlobalAveragePooling2D(),
        layers.Dense(128, activation="relu"),
        layers.Dropout(0.4),
        layers.Dense(num_classes, activation="softmax"),
    ])

    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def main():
    images, labels, class_names = load_dataset()

    X_train, X_val, y_train, y_val = train_test_split(
        images, labels, test_size=0.2, random_state=42, stratify=labels,
    )
    print(f"Train: {len(X_train)}  Val: {len(X_val)}")

    model = build_model(len(class_names))
    model.summary()

    model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
    )

    loss, acc = model.evaluate(X_val, y_val, verbose=0)
    print(f"\nValidation accuracy: {acc:.2%}")

    model.save(MODEL_PATH)
    print(f"Model saved → {MODEL_PATH}")

    with open(LABELS_PATH, "w") as f:
        json.dump(class_names, f)
    print(f"Labels saved → {LABELS_PATH}")


if __name__ == "__main__":
    main()
