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

export function speakText(
  text: string,
  language: Language,
  mood: SpeakMood = 'normal',
  onDone?: () => void,
): void {
  const options: Speech.SpeechOptions = {
    language: TTS_LOCALE[language],
    onError: () => { onDone?.(); },
    onDone,
  };
  if (mood === 'excited') { options.pitch = 1.5; options.rate = 1.3; }
  else if (mood === 'sad')    { options.pitch = 0.6; options.rate = 0.7; }
  else                        { options.pitch = 1.0; options.rate = 0.9; }
  Speech.speak(text, options);
}

export function stopSpeaking(): void {
  Speech.stop();
}

// ─── Speech Recognition Hook ──────────────────────────────────────────────────

interface UseSpeechRecognitionOptions {
  language: Language;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isAvailable: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  preparePermissions: () => Promise<void>; // call once at game start
}

export function useSpeechRecognition({
  language,
  onResult,
  onError,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [transcript, setTranscript] = useState('');

  const activeRef      = useRef(false);
  const permGranted    = useRef(false);
  const langRef        = useRef(language);
  const onResultRef    = useRef(onResult);
  const onErrorRef     = useRef(onError);
  useEffect(() => { langRef.current = language; }, [language]);
  onResultRef.current = onResult;
  onErrorRef.current  = onError;

  // Check availability on mount
  useEffect(() => {
    try {
      const result = ExpoSpeechRecognitionModule.isRecognitionAvailable();
      const setValue = (v: boolean) => setIsAvailable(v);
      if (result && typeof (result as any).then === 'function') {
        (result as unknown as Promise<boolean>).then(setValue).catch(() => setValue(false));
      } else {
        setValue(Boolean(result));
      }
    } catch { /* not available */ }

    return () => { try { ExpoSpeechRecognitionModule.abort(); } catch {} };
  }, []);

  const doStart = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.start({
        lang: STT_LOCALE[langRef.current],
        interimResults: true,
        continuous: false,
      });
    } catch {}
  }, []);

  // ─── Events ────────────────────────────────────────────────────────────────

  useSpeechRecognitionEvent('result', (event: any) => {
    const text: string = event.results?.[0]?.transcript ?? '';
    if (!text) return;
    setTranscript(text);
    onResultRef.current(text, event.isFinal ?? true);
  });

  useSpeechRecognitionEvent('error', (_event: any) => {
    if (activeRef.current) {
      setTimeout(() => { if (activeRef.current) doStart(); }, 300);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    if (activeRef.current) {
      setTimeout(() => { if (activeRef.current) doStart(); }, 200);
    } else {
      setIsListening(false);
    }
  });

  // ─── Public API ────────────────────────────────────────────────────────────

  /** Request permissions upfront so they're ready when the first turn starts */
  const preparePermissions = useCallback(async () => {
    try {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      permGranted.current = granted;
    } catch {}
  }, []);

  /** Start continuous listening — skips permission dialog if already granted */
  const startListening = useCallback(() => {
    if (activeRef.current) return; // already listening
    setTranscript('');
    setIsListening(true);
    activeRef.current = true;
    if (permGranted.current) {
      // Permissions already granted — start immediately, no async needed
      doStart();
    } else {
      // First time — request and then start
      ExpoSpeechRecognitionModule.requestPermissionsAsync()
        .then(({ granted }: { granted: boolean }) => {
          permGranted.current = granted;
          if (granted && activeRef.current) doStart();
        })
        .catch(() => {});
    }
  }, [doStart]);

  const stopListening = useCallback(() => {
    activeRef.current = false;
    setIsListening(false);
    setTranscript('');
    try { ExpoSpeechRecognitionModule.stop(); } catch {}
  }, []);

  return { isListening, isAvailable, transcript, startListening, stopListening, preparePermissions };
}
