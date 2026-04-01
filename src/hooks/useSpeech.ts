import { useCallback, useRef } from 'react';
import * as Speech from 'expo-speech';
import { Language } from '../types';

// ─── TTS ─────────────────────────────────────────────────────────────────────

const TTS_LOCALE: Record<Language, string> = {
  en: 'en-US',
  he: 'he-IL',
};

export type SpeakMood = 'normal' | 'excited' | 'sad';

export function speakText(text: string, language: Language, mood: SpeakMood = 'normal'): void {
  const options: Speech.SpeechOptions = {
    language: TTS_LOCALE[language],
    onError: () => {},
  };

  if (mood === 'excited') {
    options.pitch = 1.5;
    options.rate = 1.3;
  } else if (mood === 'sad') {
    options.pitch = 0.6;
    options.rate = 0.7;
  } else {
    options.pitch = 1.0;
    options.rate = 0.9;
  }

  Speech.speak(text, options);
}

export function stopSpeaking(): void {
  Speech.stop();
}

// ─── Speech Recognition Hook ──────────────────────────────────────────────────
// Voice input via webkitSpeechRecognition requires HTTPS and a native build.
// In Expo Go, this always returns isAvailable: false → text-only input.

interface UseSpeechRecognitionOptions {
  language: Language;
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isAvailable: boolean;
  transcript: string;
  startListening: () => Promise<void>;
  stopListening: () => void;
}

export function useSpeechRecognition(_opts: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const startListening = useCallback(async () => {}, []);
  const stopListening = useCallback(() => {}, []);

  return {
    isListening: false,
    isAvailable: false,
    transcript: '',
    startListening,
    stopListening,
  };
}
