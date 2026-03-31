import { Category } from '../types';

const en = {
  // ─── Home ────────────────────────────────────────────────────────────────
  home: {
    title: 'AlphaBurst',
    subtitle: 'The Word Blitz Game',
    newGame: 'New Game',
    history: 'Game History',
    settings: 'Settings',
    language: 'Language',
  },

  // ─── Setup ───────────────────────────────────────────────────────────────
  setup: {
    title: 'Game Setup',
    numberOfPlayers: 'Number of Players',
    playerName: (n: number) => `Player ${n} Name`,
    secondsPerTurn: 'Seconds Per Turn',
    numberOfCycles: 'Number of Rounds',
    startGame: 'Start Game!',
    enterName: 'Enter name...',
    playersHeader: 'Players',
  },

  // ─── Game ────────────────────────────────────────────────────────────────
  game: {
    yourTurn: (name: string) => `${name}, your turn!`,
    category: 'Category',
    letter: 'Letter',
    speakOrType: 'Speak or type your answer...',
    submit: 'Submit',
    correct: 'Correct!',
    wrong: 'Wrong!',
    timeUp: "Time's Up!",
    alreadyUsed: 'Already used!',
    round: (c: number, total: number) => `Round ${c} of ${total}`,
    turn: (n: number, total: number) => `Turn ${n} of ${total}`,
    categories: {
      animals: 'Animals',
      countries: 'Countries',
      cities: 'Cities',
    } as Record<Category, string>,
    listening: 'Listening...',
    typeAnswer: 'Type your answer',
    tapToSpeak: 'Tap to Speak',
    stopListening: 'Stop',
    tapToType: 'Tap to Type',
    score: 'Score',
    fouls: 'Fouls',
  },

  // ─── Results ─────────────────────────────────────────────────────────────
  results: {
    title: 'Game Over!',
    winner: (name: string) => `${name} Wins!`,
    tie: "It's a Tie!",
    playAgain: 'Play Again',
    newGame: 'New Game',
    stats: {
      player: 'Player',
      correct: 'Correct',
      fouls: 'Fouls',
      avgTime: 'Avg Time',
      hardestLetter: 'Hardest Letter',
      bestCategory: 'Best Category',
      none: '—',
    },
    winningRule: 'Fewest fouls wins. Tiebreaker: most correct answers.',
  },

  // ─── History ─────────────────────────────────────────────────────────────
  history: {
    title: 'Game History',
    noHistory: 'No games played yet.\nStart a new game!',
    winner: 'Winner',
    date: 'Date',
    players: 'Players',
    correct: 'Correct',
    fouls: 'Fouls',
    deleteAll: 'Clear History',
    tie: 'Tie',
  },

  // ─── Settings ────────────────────────────────────────────────────────────
  settings: {
    title: 'Settings',
    sound: 'Sound Effects',
    tts: 'Text-to-Speech',
    language: 'Language',
    english: 'English',
    hebrew: 'Hebrew',
  },

  // ─── Common ──────────────────────────────────────────────────────────────
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    error: 'Error',
    loading: 'Loading...',
    back: 'Back',
    seconds: (s: number) => `${s}s`,
    ms: (ms: number) => `${(ms / 1000).toFixed(1)}s`,
  },

  // ─── TTS ─────────────────────────────────────────────────────────────────
  tts: {
    yourTurn: (name: string, category: string, letter: string) =>
      `${name}, your turn! Category: ${category}. Letter: ${letter}.`,
    correct: 'Correct!',
    wrong: 'Wrong!',
    timeUp: "Time's up!",
  },
};

export default en;
export type Strings = typeof en;
