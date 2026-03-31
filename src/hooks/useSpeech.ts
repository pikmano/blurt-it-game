import { useState, useCallback, useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';
import { Language } from '../types';

// Speech recognition is optional — gracefully degrade if unavailable
let ExpoSpeechRecognition: any = null;
let useSpeechRecognitionEvent: any = null;
try {
  const mod = require('expo-speech-recognition');
  ExpoSpeechRecognition = mod.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = mod.useSpeechRecognitionEvent;
} catch {
  // expo-speech-recognition not available — text-only mode
}

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

/**
 * Wraps expo-speech-recognition with a clean API and graceful fallback.
 */
export function useSpeechRecognition({
  language,
  onResult,
  onError,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  // Check availability on mount
  useEffect(() => {
    if (!ExpoSpeechRecognition) return;
    ExpoSpeechRecognition.isAvailableAsync?.()
      .then((available: boolean) => setIsAvailable(available))
      .catch(() => setIsAvailable(false));
  }, []);

  // Wire up recognition events if the module is loaded
  // We call the hook unconditionally (rules of hooks), but guard the callback
  const safeUseSpeechRecognitionEvent = useSpeechRecognitionEvent ?? (() => {});

  safeUseSpeechRecognitionEvent('result', (event: any) => {
    if (!event?.results?.[0]) return;
    const text: string = event.results[0].transcript ?? '';
    setTranscript(text);
    if (!event.isFinal) return;
    setIsListening(false);
    onResultRef.current(text);
  });

  safeUseSpeechRecognitionEvent('error', (event: any) => {
    setIsListening(false);
    onErrorRef.current?.(event?.error ?? 'unknown error');
  });

  safeUseSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  const locale = language === 'he' ? 'he-IL' : 'en-US';

  const startListening = useCallback(async () => {
    if (!ExpoSpeechRecognition || !isAvailable) return;
    try {
      const { status } = await ExpoSpeechRecognition.requestPermissionsAsync();
      if (status !== 'granted') {
        onErrorRef.current?.('Microphone permission denied');
        return;
      }
      setTranscript('');
      setIsListening(true);
      ExpoSpeechRecognition.start({
        lang: locale,
        interimResults: true,
        maxAlternatives: 1,
      });
    } catch (e: any) {
      setIsListening(false);
      onErrorRef.current?.(e?.message ?? 'Failed to start recognition');
    }
  }, [isAvailable, locale]);

  const stopListening = useCallback(() => {
    if (!ExpoSpeechRecognition || !isListening) return;
    try {
      ExpoSpeechRecognition.stop();
    } catch {}
    setIsListening(false);
  }, [isListening]);

  return { isListening, isAvailable, transcript, startListening, stopListening };
}
