import { useState, useCallback, useRef } from 'react';
import * as Speech from 'expo-speech';
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

// ─── WebView Speech HTML ──────────────────────────────────────────────────────

export function buildSpeechHtml(locale: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body>
<script>
(function() {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'unavailable' }));
    return;
  }
  var r = new SR();
  r.lang = '${locale}';
  r.interimResults = true;
  r.continuous = false;
  r.maxAlternatives = 1;

  r.onresult = function(e) {
    var t = e.results[e.results.length - 1];
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'result',
      transcript: t[0].transcript,
      isFinal: t.isFinal
    }));
  };
  r.onerror = function(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: e.error }));
  };
  r.onend = function() {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'end' }));
  };

  window.startListening = function() { r.start(); };
  window.stopListening  = function() { r.stop(); };

  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
})();
</script>
</body>
</html>`;
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
  startListening: () => void;
  stopListening: () => void;
  locale: string;
  onWebViewMessage: (event: { nativeEvent: { data: string } }) => void;
  webViewRef: React.RefObject<any>;
  webViewReady: boolean;
}

export function useSpeechRecognition({
  language,
  onResult,
  onError,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [webViewReady, setWebViewReady] = useState(false);
  const [transcript, setTranscript] = useState('');
  const webViewRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  onResultRef.current = onResult;
  onErrorRef.current = onError;

  const locale = STT_LOCALE[language];

  const onWebViewMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      switch (msg.type) {
        case 'ready':
          setWebViewReady(true);
          setIsAvailable(true);
          break;
        case 'unavailable':
          setIsAvailable(false);
          break;
        case 'result':
          setTranscript(msg.transcript);
          if (msg.isFinal) {
            setIsListening(false);
            onResultRef.current(msg.transcript);
          }
          break;
        case 'error':
          setIsListening(false);
          onErrorRef.current?.(msg.error);
          break;
        case 'end':
          setIsListening(false);
          break;
      }
    } catch {}
  }, []);

  const startListening = useCallback(() => {
    if (!webViewReady || !webViewRef.current) return;
    setTranscript('');
    setIsListening(true);
    webViewRef.current.injectJavaScript('window.startListening(); true;');
  }, [webViewReady]);

  const stopListening = useCallback(() => {
    if (!webViewReady || !webViewRef.current) return;
    webViewRef.current.injectJavaScript('window.stopListening(); true;');
    setIsListening(false);
  }, [webViewReady]);

  return {
    isListening,
    isAvailable,
    transcript,
    startListening,
    stopListening,
    locale,
    onWebViewMessage,
    webViewRef,
    webViewReady,
  };
}
