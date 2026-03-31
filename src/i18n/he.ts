import { Category } from '../types';
import { Strings } from './en';

const he: Strings = {
  // ─── Home ────────────────────────────────────────────────────────────────
  home: {
    title: 'אלפאברסט',
    subtitle: 'משחק המילים המטורף',
    newGame: 'משחק חדש',
    history: 'היסטוריית משחקים',
    settings: 'הגדרות',
    language: 'שפה',
  },

  // ─── Setup ───────────────────────────────────────────────────────────────
  setup: {
    title: 'הגדרת משחק',
    numberOfPlayers: 'מספר שחקנים',
    playerName: (n: number) => `שם שחקן ${n}`,
    secondsPerTurn: 'שניות לתור',
    numberOfCycles: 'מספר סיבובים',
    startGame: '!התחל משחק',
    enterName: '...הכנס שם',
    playersHeader: 'שחקנים',
  },

  // ─── Game ────────────────────────────────────────────────────────────────
  game: {
    yourTurn: (name: string) => `!${name}, התור שלך`,
    category: 'קטגוריה',
    letter: 'אות',
    speakOrType: '...דבר או הקלד את תשובתך',
    submit: 'שלח',
    correct: '!נכון',
    wrong: '!לא נכון',
    timeUp: '!הזמן נגמר',
    alreadyUsed: '!כבר נאמר',
    round: (c: number, total: number) => `סיבוב ${c} מתוך ${total}`,
    turn: (n: number, total: number) => `תור ${n} מתוך ${total}`,
    categories: {
      animals: 'בעלי חיים',
      countries: 'מדינות',
      cities: 'ערים',
    } as Record<Category, string>,
    listening: '...מאזין',
    typeAnswer: 'הקלד תשובה',
    tapToSpeak: 'לחץ לדיבור',
    stopListening: 'עצור',
    tapToType: 'לחץ להקלדה',
    score: 'ניקוד',
    fouls: 'עבירות',
  },

  // ─── Results ─────────────────────────────────────────────────────────────
  results: {
    title: '!המשחק נגמר',
    winner: (name: string) => `!${name} מנצח`,
    tie: '!תיקו',
    playAgain: 'שחק שוב',
    newGame: 'משחק חדש',
    stats: {
      player: 'שחקן',
      correct: 'נכון',
      fouls: 'עבירות',
      avgTime: 'זמן ממוצע',
      hardestLetter: 'אות הכי קשה',
      bestCategory: 'קטגוריה הכי טובה',
      none: '—',
    },
    winningRule: 'הכי פחות עבירות מנצח. שיקוף: הכי הרבה תשובות נכונות.',
  },

  // ─── History ─────────────────────────────────────────────────────────────
  history: {
    title: 'היסטוריית משחקים',
    noHistory: '.לא שוחק עדיין\n!התחל משחק חדש',
    winner: 'מנצח',
    date: 'תאריך',
    players: 'שחקנים',
    correct: 'נכון',
    fouls: 'עבירות',
    deleteAll: 'נקה היסטוריה',
    tie: 'תיקו',
  },

  // ─── Settings ────────────────────────────────────────────────────────────
  settings: {
    title: 'הגדרות',
    sound: 'אפקטי קול',
    tts: 'המרת טקסט לדיבור',
    language: 'שפה',
    english: 'אנגלית',
    hebrew: 'עברית',
  },

  // ─── Common ──────────────────────────────────────────────────────────────
  common: {
    ok: 'אישור',
    cancel: 'ביטול',
    error: 'שגיאה',
    loading: '...טוען',
    back: 'חזרה',
    seconds: (s: number) => `${s} שנ'`,
    ms: (ms: number) => `${(ms / 1000).toFixed(1)} שנ'`,
  },

  // ─── TTS ─────────────────────────────────────────────────────────────────
  tts: {
    yourTurn: (name: string, category: string, letter: string) =>
      `${name}, התור שלך! קטגוריה: ${category}. אות: ${letter}.`,
    correct: 'נכון!',
    wrong: 'לא נכון!',
    timeUp: 'הזמן נגמר!',
  },
};

export default he;
