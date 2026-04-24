/**
 * Emotion Detection API
 * Connects to FastAPI backend for emotion analysis
 */

const API_BASE_URL = 'https://echo-saas.onrender.com';

/**
 * Detect emotion from image blob
 * 
 * @param {Blob} blob - Image blob to analyze
 * @returns {Promise<{emotion: string, confidence: number}>} Emotion detection result
 * @throws {Error} If API call fails
 */
export async function detectEmotion(blob) {
  try {
    const formData = new FormData();
    formData.append('file', blob, 'capture.jpg');

    const response = await fetch(`${API_BASE_URL}/detect-emotion`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `API error: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Emotion detection API error:', error);
    throw new Error(`Failed to detect emotion: ${error.message}`);
  }
}

/**
 * Check if emotion detection API is healthy
 * 
 * @returns {Promise<boolean>} True if API is healthy
 */
export async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}
