'use client';

import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { getEmotionConfig } from '@/lib/emotionConfig';

export default function FloatingButton({ currentEmotion }) {
  const router = useRouter();
  const config = getEmotionConfig(currentEmotion);

  return (
    <button
      onClick={() => router.push('/chat')}
      className={`fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br ${config.gradient} ${config.glow} flex items-center justify-center hover:scale-110 transition-transform duration-200 z-50`}
      title="Open AI Chat"
    >
      <MessageSquare size={28} className="text-white" />
    </button>
  );
}
