// ─── Language & Category ────────────────────────────────────────────────────

export type Language = 'en' | 'he';
export type Category = 'animals' | 'countries' | 'cities' | 'plants';

// ─── Player & Config ────────────────────────────────────────────────────────

export interface PlayerConfig {
  id: string;
  name: string;
}

export interface GameConfig {
  language: Language;
  players: PlayerConfig[];
  secondsPerTurn: number; // 10–60
  numberOfCycles: number; // 1–10
  selectedCategories: Category[];
}

// ─── Stats ──────────────────────────────────────────────────────────────────

export interface PlayerStats {
  id: string;
  name: string;
  correct: number;
  fouls: number;
  totalResponseTime: number; // ms (sum of all turns)
  answerCount: number; // turns where player responded (for avg calc)
  categoryCorrect: Record<Category, number>;
  letterHistory: string[]; // letters faced per turn
  currentStreak: number; // consecutive correct answers
  maxStreak: number; // best streak this game
}

// ─── Turns ──────────────────────────────────────────────────────────────────

export type FoulReason = 'wrong_letter' | 'not_in_category' | 'already_used' | 'time_up';

export interface TurnRecord {
  playerId: string;
  playerName: string;
  category: Category;
  letter: string;
  answer: string | null;
  isCorrect: boolean;
  foulReason: FoulReason | null;
  responseTime: number; // ms
  timestamp: number; // unix ms
}

// ─── Validation ─────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  reason: FoulReason | null;
}

// ─── Game State ─────────────────────────────────────────────────────────────

export type GameStatus = 'idle' | 'playing' | 'finished';

export interface GameState {
  config: GameConfig | null;
  status: GameStatus;
  currentPlayerIndex: number;
  currentCycle: number; // 1-based
  currentCategory: Category | null;
  currentLetter: string | null;
  turns: TurnRecord[];
  usedWords: string[];
  playerStats: Record<string, PlayerStats>;
}

export type GameAction =
  | { type: 'START_GAME'; payload: GameConfig }
  | { type: 'BEGIN_TURN'; payload: { category: Category; letter: string } }
  | {
      type: 'CORRECT_ANSWER';
      payload: { answer: string; responseTime: number };
    }
  | {
      type: 'FOUL';
      payload: {
        reason: FoulReason;
        answer?: string;
        responseTime: number;
      };
    }
  | { type: 'ADVANCE_TURN' }
  | { type: 'END_GAME' }
  | { type: 'RESET' };

// ─── App Settings ────────────────────────────────────────────────────────────

export interface AppSettings {
  language: Language;
  soundEnabled: boolean;
  ttsEnabled: boolean;
}

// ─── History ─────────────────────────────────────────────────────────────────

export interface GameResult {
  id: string;
  date: number; // unix ms
  config: GameConfig;
  playerStats: Record<string, PlayerStats>;
  turns: TurnRecord[];
  winnerId: string | null; // null = tie
}

// ─── Navigation Params ───────────────────────────────────────────────────────

export type RootStackParamList = {
  Home: undefined;
  Setup: undefined;
  Game: undefined;
  Results: undefined;
  History: undefined;
};
