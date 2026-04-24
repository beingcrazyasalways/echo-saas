'use client';

import EmotionCamera from '@/components/EmotionCamera';

export default function EmotionV2Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900/30 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Emotion Detection V2</h1>
          <p className="text-sm sm:text-base text-gray-400">Isolated emotion detection module</p>
        </div>

        <div className="glass-card p-4 sm:p-6 rounded-2xl">
          <EmotionCamera />
        </div>

        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-xs sm:text-sm text-gray-500">
            This is an isolated v2 module. No existing components were modified.
          </p>
        </div>
      </div>
    </div>
  );
}
