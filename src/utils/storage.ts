import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameResult, AppSettings } from '../types';

const HISTORY_KEY = '@alphaburst_history';
const SETTINGS_KEY = '@alphaburst_settings';

// ─── Game History ─────────────────────────────────────────────────────────────

export async function saveGameResult(result: GameResult): Promise<void> {
  try {
    const existing = await loadGameHistory();
    const updated = [result, ...existing].slice(0, 50); // keep last 50 games
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save game result:', e);
  }
}

export async function loadGameHistory(): Promise<GameResult[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GameResult[];
  } catch (e) {
    console.warn('Failed to load game history:', e);
    return [];
  }
}

export async function clearGameHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.warn('Failed to clear game history:', e);
  }
}

// ─── App Settings ─────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  soundEnabled: true,
  ttsEnabled: true,
};

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}
