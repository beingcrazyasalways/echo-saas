export const CORE_EMOTIONS = ['stressed', 'calm', 'focused'];
export const STORED_EMOTIONS = [
  'stressed',
  'calm',
  'focused',
  'happy',
  'sad',
  'angry',
  'neutral',
  'surprised',
  'fearful',
  'disgusted',
];

export function createEmotionCounts(initialValue = 0) {
  return {
    stressed: initialValue,
    calm: initialValue,
    focused: initialValue,
  };
}

export function normalizeEmotion(emotion) {
  const value = emotion?.toLowerCase() || '';

  switch (value) {
    case 'stressed':
    case 'angry':
    case 'fearful':
    case 'disgusted':
    case 'sad':
      return 'stressed';
    case 'focused':
      return 'focused';
    case 'happy':
    case 'neutral':
    case 'surprised':
    case 'no_face':
    case 'model_missing':
    case 'calm':
    default:
      return 'calm';
  }
}

export function toStoredEmotion(emotion) {
  const value = emotion?.toLowerCase() || '';

  if (STORED_EMOTIONS.includes(value)) {
    return value;
  }

  return normalizeEmotion(value);
}

export function mapEmotionToStressScore(emotion) {
  const value = emotion?.toLowerCase() || '';
  const stressMap = {
    stressed: 80,
    angry: 75,
    fearful: 70,
    disgusted: 60,
    sad: 65,
    surprised: 50,
    happy: 30,
    neutral: 25,
    calm: 20,
    focused: 25,
    no_face: 30,
    model_missing: 30,
  };

  return stressMap[value] || 30;
}
