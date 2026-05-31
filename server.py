"""
server.py  –  Flask API for ASL sign language prediction using hand landmarks.

Uses a Random Forest classifier trained on MediaPipe hand landmark coordinates.
This approach is invariant to skin color, lighting, and background — 
it only uses hand joint geometry (21 points × 3 coords = 63 features).

Usage:
    pip install flask flask-cors numpy scikit-learn
    python server.py

Endpoints:
    POST /predict   — accepts { "landmarks": [[x,y,z], ...] }  (21 points)
                      returns  { "letter": "A", "confidence": 0.95 }
"""

import os, json, numpy as np, pickle
from flask import Flask, request, jsonify
from flask_cors import CORS

# ── Config ──────────────────────────────────────────────────
MODEL_PATH  = os.path.join(os.path.dirname(__file__), "landmark_classifier.pkl")
LABELS_PATH = os.path.join(os.path.dirname(__file__), "landmark_labels.json")
PORT        = 5000

# ── Load model + labels ────────────────────────────────────
print("Loading landmark classifier…")
with open(MODEL_PATH, "rb") as f:
    clf = pickle.load(f)
print("Model loaded ✓")

with open(LABELS_PATH) as f:
    class_names = json.load(f)
print(f"Classes ({len(class_names)}): {class_names}")

# ── Flask app ───────────────────────────────────────────────
app = Flask(__name__)
CORS(app)


def normalize_landmarks(landmarks_flat):
    """Normalize landmarks relative to wrist and scale by hand size."""
    coords = np.array(landmarks_flat, dtype=np.float32).reshape(21, 3)
    
    # Translate so wrist is at origin
    wrist = coords[0].copy()
    coords = coords - wrist
    
    # Scale by distance from wrist to middle finger MCP (landmark 9)
    scale = np.linalg.norm(coords[9])
    if scale > 0:
        coords = coords / scale
    
    return coords.flatten()


@app.route("/predict", methods=["POST"])
def predict():
    body = request.get_json(force=True)
    landmarks = body.get("landmarks", [])

    if not landmarks or len(landmarks) != 21:
        return jsonify({"letter": "", "confidence": 0, "error": "Need 21 landmarks"}), 400

    # Flatten [[x,y,z], [x,y,z], ...] → [x,y,z,x,y,z,...]
    flat = []
    for pt in landmarks:
        flat.extend([pt[0], pt[1], pt[2]])
    
    # Normalize
    features = normalize_landmarks(flat)
    features = features.reshape(1, -1)
    
    # Predict
    proba = clf.predict_proba(features)[0]
    idx   = int(np.argmax(proba))
    conf  = float(proba[idx])
    letter = class_names[idx].upper()

    return jsonify({"letter": letter, "confidence": round(conf, 4)})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "classes": len(class_names)})


if __name__ == "__main__":
    print(f"Starting SignSync AI server on http://127.0.0.1:{PORT}")
    app.run(host="127.0.0.1", port=PORT, debug=False)
