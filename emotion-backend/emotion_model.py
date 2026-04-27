from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
import torch
from torch import nn


IMAGE_SIZE = 48
DEFAULT_LABELS = ["angry", "disgusted", "fearful", "happy", "neutral", "sad", "surprised"]
DISPLAY_LABEL_ALIASES = {
    "disgust": "disgusted",
    "fear": "fearful",
    "surprise": "surprised",
}


def display_label(label: str) -> str:
    return DISPLAY_LABEL_ALIASES.get(label, label)


class EmotionCNN(nn.Module):
    """Small CNN for grayscale facial-expression classification."""

    def __init__(self, num_classes: int) -> None:
        super().__init__()
        self.features = nn.Sequential(
            self._conv_block(1, 32),
            self._conv_block(32, 64),
            self._conv_block(64, 128),
            nn.AdaptiveAvgPool2d((6, 6)),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 6 * 6, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.4),
            nn.Linear(256, num_classes),
        )

    @staticmethod
    def _conv_block(in_channels: int, out_channels: int) -> nn.Sequential:
        return nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2),
            nn.Dropout(0.2),
        )

    def forward(self, inputs: torch.Tensor) -> torch.Tensor:
        return self.classifier(self.features(inputs))


def preprocess_face(face_bgr_or_gray: np.ndarray) -> torch.Tensor:
    """Convert a cropped face into the tensor shape expected by EmotionCNN."""

    if face_bgr_or_gray.ndim == 3:
        gray = cv2.cvtColor(face_bgr_or_gray, cv2.COLOR_BGR2GRAY)
    else:
        gray = face_bgr_or_gray

    gray = cv2.resize(gray, (IMAGE_SIZE, IMAGE_SIZE), interpolation=cv2.INTER_AREA)
    normalized = gray.astype(np.float32) / 255.0
    normalized = (normalized - 0.5) / 0.5
    return torch.from_numpy(normalized).unsqueeze(0).unsqueeze(0)


@dataclass
class EmotionPrediction:
    label: str
    confidence: float


class EmotionRecognizer:
    def __init__(
        self,
        model_path: str | Path = "models/emotion_model.pt",
        label_path: str | Path = "models/emotion_labels.json",
        device: str | None = None,
    ) -> None:
        BASE_DIR = os.path.dirname(__file__)
        self.model_path = Path(os.path.join(BASE_DIR, model_path))
        self.label_path = Path(os.path.join(BASE_DIR, label_path))
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))
        self.labels = self._load_labels()
        self.model = EmotionCNN(num_classes=len(self.labels)).to(self.device)
        self.available = False
        self.status = "Emotion model not loaded. Train it first."
        self._load_weights()
        
        # Load face detector
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )

    def _load_labels(self) -> list[str]:
        if self.label_path.exists():
            with self.label_path.open("r", encoding="utf-8") as label_file:
                labels = json.load(label_file)
            if not isinstance(labels, list) or not all(isinstance(label, str) for label in labels):
                raise ValueError(f"Invalid label file: {self.label_path}")
            return [display_label(label) for label in labels]
        return DEFAULT_LABELS

    def _load_weights(self) -> None:
        try:
            if not self.model_path.exists():
                return

            checkpoint = torch.load(self.model_path, map_location=self.device)
            state_dict = checkpoint.get("model_state", checkpoint)

            if "labels" in checkpoint:
                self.labels = [display_label(label) for label in checkpoint["labels"]]
                self.model = EmotionCNN(num_classes=len(self.labels)).to(self.device)

            self.model.load_state_dict(state_dict)
            self.model.eval()
            self.available = True
            self.status = f"Emotion model loaded on {self.device}."
        except Exception as e:
            print("Model load failed:", e)
            self.available = False
            self.status = f"Model load failed: {str(e)}"

    def detect_face(self, image: np.ndarray) -> np.ndarray | None:
        """Detect face in image and return cropped face, or None if no face detected."""
        if image.ndim == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        if len(faces) == 0:
            return None
        
        # Return the largest face
        largest_face = max(faces, key=lambda x: x[2] * x[3])
        x, y, w, h = largest_face
        
        # Add padding
        padding = int(0.2 * w)
        x = max(0, x - padding)
        y = max(0, y - padding)
        w = min(image.shape[1] - x, w + 2 * padding)
        h = min(image.shape[0] - y, h + 2 * padding)
        
        return image[y:y+h, x:x+w]

    @torch.inference_mode()
    def predict(self, face_bgr_or_gray: np.ndarray) -> EmotionPrediction:
        if not self.available:
            return EmotionPrediction("model missing", 0.0)

        tensor = preprocess_face(face_bgr_or_gray).to(self.device)
        logits = self.model(tensor)
        probabilities = torch.softmax(logits, dim=1).squeeze(0)
        confidence, index = torch.max(probabilities, dim=0)
        return EmotionPrediction(self.labels[int(index.item())], float(confidence.item()))


# Global recognizer instance
_recognizer: EmotionRecognizer | None = None


def get_recognizer() -> EmotionRecognizer | None:
    """Get or create the global emotion recognizer instance. Returns None if model fails."""
    global _recognizer
    if _recognizer is None:
        try:
            _recognizer = EmotionRecognizer()
            print("Model loaded")
        except Exception as e:
            print("Model failed:", e)
            _recognizer = None
    return _recognizer


def predict_emotion(image: np.ndarray) -> tuple[str, float]:
    """
    Predict emotion from an OpenCV image.
    
    Args:
        image: OpenCV image (BGR or grayscale)
        
    Returns:
        Tuple of (emotion_label, confidence)
        Returns actual status instead of silent fallbacks
    """
    recognizer = get_recognizer()
    
    # Model not loaded → return actual status
    if recognizer is None:
        print("[ERROR] Model recognizer is None")
        return "model_missing", 0.0

    try:
        # Detect face
        face = recognizer.detect_face(image)
        if face is None:
            print("[WARNING] No face detected in image")
            return "no_face", 0.0
        
        # Predict emotion
        prediction = recognizer.predict(face)
        print(f"[INFO] Model prediction: {prediction.label} (confidence: {prediction.confidence})")
        return prediction.label, prediction.confidence
    except Exception as e:
        print(f"[ERROR] Exception in predict_emotion: {str(e)}")
        import traceback
        traceback.print_exc()
        return "error", 0.0
