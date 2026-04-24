from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from io import BytesIO
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
async def detect_emotion():
    """
    Stub endpoint for testing - returns fixed emotion response.
    """
    return {"emotion": "calm", "confidence": 0.8}


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
