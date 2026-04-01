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
    onDone: onDone,
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
// Continuous mode: auto-restarts after silence so recognition never drops
// during a turn. Call startContinuous() when turn begins, stopContinuous()
// when it ends.

interface UseSpeechRecognitionOptions {
  language: Language;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isAvailable: boolean;
  transcript: string;
  startListening: () => Promise<void>;   // alias for startContinuous
  stopListening: () => void;              // alias for stopContinuous
}

export function useSpeechRecognition({
  language,
  onResult,
  onError,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [transcript, setTranscript] = useState('');

  const activeRef      = useRef(false);   // whether we WANT to be listening
  const isAvailableRef = useRef(false);   // sync ref so startListening never reads stale state
  const langRef        = useRef(language);
  const onResultRef    = useRef(onResult);
  const onErrorRef     = useRef(onError);
  useEffect(() => { langRef.current = language; }, [language]);
  onResultRef.current = onResult;
  onErrorRef.current  = onError;

  // Check availability once — update both state and ref
  useEffect(() => {
    try {
      const result = ExpoSpeechRecognitionModule.isRecognitionAvailable();
      if (result && typeof (result as any).then === 'function') {
        (result as unknown as Promise<boolean>).then(v => {
          isAvailableRef.current = v;
          setIsAvailable(v);
        }).catch(() => setIsAvailable(false));
      } else {
        isAvailableRef.current = Boolean(result);
        setIsAvailable(Boolean(result));
      }
    } catch { setIsAvailable(false); }

    return () => {
      try { ExpoSpeechRecognitionModule.abort(); } catch {}
    };
  }, []);

  const doStart = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.start({
        lang: STT_LOCALE[langRef.current],
        interimResults: true,
        continuous: false, // we handle continuity ourselves via auto-restart
      });
    } catch {}
  }, []);

  // ─── Events ────────────────────────────────────────────────────────────────

  useSpeechRecognitionEvent('result', (event: any) => {
    const text: string = event.results?.[0]?.transcript ?? '';
    if (!text) return;
    setTranscript(text);
    // Fire on every result — caller decides what to do with interim vs final
    onResultRef.current(text, event.isFinal ?? true);
  });

  useSpeechRecognitionEvent('error', (event: any) => {
    onErrorRef.current?.(event.error ?? 'unknown');
    // auto-restart unless we deliberately stopped
    if (activeRef.current) {
      setTimeout(() => { if (activeRef.current) doStart(); }, 300);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    // auto-restart to keep continuous listening
    if (activeRef.current) {
      setTimeout(() => { if (activeRef.current) doStart(); }, 200);
    } else {
      setIsListening(false);
    }
  });

  // ─── Public API ────────────────────────────────────────────────────────────

  const startListening = useCallback(async () => {
    // Use ref — never miss first-run because state hasn't updated yet
    if (!isAvailableRef.current) return;
    try {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) return;
      setTranscript('');
      setIsListening(true);
      activeRef.current = true;
      doStart();
    } catch { setIsListening(false); }
  }, [doStart]);

  const stopListening = useCallback(() => {
    activeRef.current = false;
    setIsListening(false);
    setTranscript('');
    try { ExpoSpeechRecognitionModule.stop(); } catch {}
  }, []);

  return { isListening, isAvailable, transcript, startListening, stopListening };
}
