from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from emotion_model import predict_emotion

app = FastAPI(title="Emotion Detection API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/detect-emotion")
async def detect_emotion(file: UploadFile = File(...)):
    """
    Detect emotion from uploaded image.
    Falls back to calm/0.5 if anything goes wrong.
    """
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            return {"emotion": "calm", "confidence": 0.5}

        # Resize to reduce processing load
        image = cv2.resize(image, (48, 48))

        # Try real model
        emotion, confidence = predict_emotion(image)

        # No face detected or model missing → fallback
        if emotion in ("no_face", "model_missing") or confidence == 0.0:
            return {"emotion": "calm", "confidence": 0.5}

        return {"emotion": emotion, "confidence": float(confidence)}

    except Exception as e:
        print("ERROR:", e)
        # Fallback (non-negotiable)
        return {"emotion": "calm", "confidence": 0.5}


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
