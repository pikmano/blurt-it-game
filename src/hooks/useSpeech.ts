import { useState, useCallback, useRef } from 'react';
import * as Speech from 'expo-speech';
import { Language } from '../types';

// ─── TTS ─────────────────────────────────────────────────────────────────────

const TTS_LOCALE: Record<Language, string> = {
  en: 'en-US',
  he: 'he-IL',
};

export function speakText(text: string, language: Language): void {
  Speech.speak(text, {
    language: TTS_LOCALE[language],
    rate: 0.9,
    onError: () => {},
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}

// ─── Speech Recognition Hook ──────────────────────────────────────────────────
// Voice input via expo-speech-recognition requires a custom dev build and
// is not available in Expo Go. This hook always reports isAvailable=false,
// causing AnswerInput to render the text-only fallback.

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

export function useSpeechRecognition({
  language,
  onResult,
  onError,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isListening] = useState(false);
  const [transcript] = useState('');

  const startListening = useCallback(async () => {
    // Not available in Expo Go — use text input instead
  }, []);

  const stopListening = useCallback(() => {}, []);

  return {
    isListening,
    isAvailable: false, // text-only mode in Expo Go
    transcript,
    startListening,
    stopListening,
  };
}
