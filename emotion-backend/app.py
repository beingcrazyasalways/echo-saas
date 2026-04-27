import os

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from emotion_model import predict_emotion

app = FastAPI(title="Emotion Detection API")


def get_allowed_origins():
    configured_origins = os.getenv("ALLOWED_ORIGINS")
    if configured_origins:
        return [origin.strip() for origin in configured_origins.split(",") if origin.strip()]

    return [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://echowebai.vercel.app",
    ]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/detect-emotion")
async def detect_emotion(file: UploadFile = File(...)):
    """
    Detect emotion from uploaded image.
    Returns detailed error information instead of silent fallbacks.
    """
    try:
        print(f"[INFO] Received file: {file.filename}, size: {file.size if hasattr(file, 'size') else 'unknown'}")
        contents = await file.read()
        print(f"[INFO] Read {len(contents)} bytes")
        
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            print("[ERROR] Failed to decode image")
            return {"emotion": "error", "confidence": 0.0, "error": "Failed to decode image"}

        print(f"[INFO] Image decoded successfully, shape: {image.shape}")

        # Try real model
        emotion, confidence = predict_emotion(image)
        print(f"[INFO] Prediction result: emotion={emotion}, confidence={confidence}")

        # No face detected or model missing → return actual status
        if emotion in ("no_face", "model_missing"):
            print(f"[WARNING] {emotion} detected")
            return {"emotion": emotion, "confidence": confidence, "status": emotion}

        return {"emotion": emotion, "confidence": float(confidence), "status": "success"}

    except Exception as e:
        print(f"[ERROR] Exception in detect_emotion: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return actual error instead of fallback
        return {"emotion": "error", "confidence": 0.0, "error": str(e), "status": "error"}


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "message": "Emotion Detection API",
        "endpoints": {
            "POST /detect-emotion": "Upload image to detect emotion"
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
