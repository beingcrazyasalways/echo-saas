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
async def detect_emotion(file: UploadFile = File(...)):
    """
    Detect emotion from uploaded image file.
    
    Args:
        file: Image file (jpg, png, etc.)
        
    Returns:
        JSON with emotion label and confidence
    """
    print("Request received")
    
    # Validate input
    if file is None:
        return {"error": "No file provided"}
    
    try:
        print("Loading model...")
        
        # Read file content
        contents = await file.read()
        
        # Convert to numpy array
        nparr = np.frombuffer(contents, np.uint8)
        
        # Decode image
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Resize image to reduce processing load before inference
        image = cv2.resize(image, (48, 48))
        
        print("Running prediction...")
        
        # Predict emotion
        emotion, confidence = predict_emotion(image)
        
        return {
            "emotion": emotion,
            "confidence": confidence
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


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
