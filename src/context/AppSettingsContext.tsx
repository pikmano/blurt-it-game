import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { I18nManager } from 'react-native';
import { AppSettings, Language } from '../types';
import { loadSettings, saveSettings } from '../utils/storage';
import { getStrings } from '../i18n';
import type { Strings } from '../i18n';

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AppSettingsContextValue {
  settings: AppSettings;
  strings: Strings;
  setLanguage: (lang: Language) => void;
  setSoundEnabled: (v: boolean) => void;
  setTtsEnabled: (v: boolean) => void;
  isRTL: boolean;
  isLoaded: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({
    language: 'en',
    soundEnabled: true,
    ttsEnabled: true,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted settings on mount
  useEffect(() => {
    loadSettings().then(saved => {
      setSettings(saved);
      setIsLoaded(true);
    });
  }, []);

  // Persist on every change
  useEffect(() => {
    if (isLoaded) {
      saveSettings(settings);
    }
  }, [settings, isLoaded]);

  const setLanguage = (lang: Language) => {
    setSettings(s => ({ ...s, language: lang }));
  };

  const setSoundEnabled = (v: boolean) => {
    setSettings(s => ({ ...s, soundEnabled: v }));
  };

  const setTtsEnabled = (v: boolean) => {
    setSettings(s => ({ ...s, ttsEnabled: v }));
  };

  const isRTL = settings.language === 'he';
  const strings = getStrings(settings.language);

  return (
    <AppSettingsContext.Provider
      value={{
        settings,
        strings,
        setLanguage,
        setSoundEnabled,
        setTtsEnabled,
        isRTL,
        isLoaded,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAppSettings(): AppSettingsContextValue {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used inside AppSettingsProvider');
  return ctx;
}
