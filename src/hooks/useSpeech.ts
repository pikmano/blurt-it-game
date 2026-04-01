import { useState, useCallback, useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { Language } from '../types';

// ─── TTS ─────────────────────────────────────────────────────────────────────

const TTS_LOCALE: Record<Language, string> = {
  en: 'en-US',
  he: 'he-IL',
};

const STT_LOCALE: Record<Language, string> = {
  en: 'en-US',
  he: 'he-IL',
};

export type SpeakMood = 'normal' | 'excited' | 'sad';

export function speakText(text: string, language: Language, mood: SpeakMood = 'normal'): void {
  const options: Speech.SpeechOptions = {
    language: TTS_LOCALE[language],
    onError: () => {},
  };
  if (mood === 'excited') { options.pitch = 1.5; options.rate = 1.3; }
  else if (mood === 'sad') { options.pitch = 0.6; options.rate = 0.7; }
  else { options.pitch = 1.0; options.rate = 0.9; }
  Speech.speak(text, options);
}

export function stopSpeaking(): void {
  Speech.stop();
}

// ─── Speech Recognition Hook ──────────────────────────────────────────────────
// Uses iOS SFSpeechRecognizer / Android SpeechRecognizer — free, on-device.
// Requires a compiled app (EAS dev build). Falls back to text-only in Expo Go.

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
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [transcript, setTranscript] = useState('');
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  onResultRef.current = onResult;
  onErrorRef.current = onError;

  // Check if native STT is available (true in compiled build, false in Expo Go)
  useEffect(() => {
    try {
      const result = ExpoSpeechRecognitionModule.isRecognitionAvailable();
      // Handle both sync (boolean) and async (Promise) return values
      if (result && typeof (result as any).then === 'function') {
        (result as unknown as Promise<boolean>).then(setIsAvailable).catch(() => setIsAvailable(false));
      } else {
        setIsAvailable(Boolean(result));
      }
    } catch {
      setIsAvailable(false);
    }

    return () => {
      try { ExpoSpeechRecognitionModule.abort(); } catch {}
    };
  }, []);

  useSpeechRecognitionEvent('result', (event: any) => {
    const text: string = event.results?.[0]?.transcript ?? '';
    if (!text) return;
    setTranscript(text);
    if (event.isFinal) {
      setIsListening(false);
      onResultRef.current(text);
    }
  });

  useSpeechRecognitionEvent('error', (event: any) => {
    setIsListening(false);
    onErrorRef.current?.(event.error ?? 'unknown');
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  const startListening = useCallback(async () => {
    if (!isAvailable) return;
    try {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) return;
      setTranscript('');
      setIsListening(true);
      ExpoSpeechRecognitionModule.start({
        lang: STT_LOCALE[language],
        interimResults: true,
        continuous: false,
      });
    } catch {
      setIsListening(false);
    }
  }, [isAvailable, language]);

  const stopListening = useCallback(() => {
    try { ExpoSpeechRecognitionModule.stop(); } catch {}
    setIsListening(false);
  }, []);

  return { isListening, isAvailable, transcript, startListening, stopListening };
}
