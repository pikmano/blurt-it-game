import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
} from 'react';
import {
  GameState,
  GameAction,
  GameConfig,
  PlayerStats,
  TurnRecord,
  Category,
} from '../types';
import { getAliasLookup } from '../data/aliases';

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: GameState = {
  config: null,
  status: 'idle',
  currentPlayerIndex: 0,
  currentCycle: 1,
  currentCategory: null,
  currentLetter: null,
  turns: [],
  usedWords: [],
  playerStats: {},
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildInitialStats(config: GameConfig): Record<string, PlayerStats> {
  const stats: Record<string, PlayerStats> = {};
  for (const player of config.players) {
    stats[player.id] = {
      id: player.id,
      name: player.name,
      correct: 0,
      fouls: 0,
      totalResponseTime: 0,
      answerCount: 0,
      categoryCorrect: { animals: 0, countries: 0, cities: 0, plants: 0 },
      letterHistory: [],
      currentStreak: 0,
      maxStreak: 0,
    };
  }
  return stats;
}

/** Returns { nextPlayerIndex, nextCycle, isGameOver } after advancing one turn */
function advanceTurn(
  currentPlayerIndex: number,
  currentCycle: number,
  config: GameConfig
): { nextPlayerIndex: number; nextCycle: number; isGameOver: boolean } {
  const numPlayers = config.players.length;
  const nextPlayerIndex = (currentPlayerIndex + 1) % numPlayers;
  const nextCycle =
    nextPlayerIndex === 0 ? currentCycle + 1 : currentCycle;
  const isGameOver = nextCycle > config.numberOfCycles;

  return { nextPlayerIndex, nextCycle, isGameOver };
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const config = action.payload;
      return {
        ...initialState,
        config,
        status: 'playing',
        playerStats: buildInitialStats(config),
      };
    }

    case 'BEGIN_TURN': {
      const { category, letter } = action.payload;
      return {
        ...state,
        currentCategory: category,
        currentLetter: letter,
      };
    }

    case 'CORRECT_ANSWER': {
      const { answer, responseTime } = action.payload;
      const { config, currentPlayerIndex, currentCycle, currentCategory, currentLetter } = state;
      if (!config || !currentCategory || !currentLetter) return state;

      const playerId = config.players[currentPlayerIndex].id;
      const playerName = config.players[currentPlayerIndex].name;
      const normalized = answer.toLowerCase().trim();
      // Resolve canonical so aliases of the same word block each other
      const aliasLookup = config ? getAliasLookup(config.language, currentCategory) : new Map();
      const canonical = aliasLookup.get(normalized) ?? normalized;
      // Store both so neither the alias nor the canonical can score again
      const newUsedWords = canonical !== normalized
        ? [...state.usedWords, normalized, canonical]
        : [...state.usedWords, normalized];

      const turn: TurnRecord = {
        playerId,
        playerName,
        category: currentCategory,
        letter: currentLetter,
        answer: normalized,
        isCorrect: true,
        foulReason: null,
        responseTime,
        timestamp: Date.now(),
      };

      const updatedStats = { ...state.playerStats };
      const ps = { ...updatedStats[playerId] };
      ps.correct += 1;
      ps.totalResponseTime += responseTime;
      ps.answerCount += 1;
      ps.categoryCorrect = {
        ...ps.categoryCorrect,
        [currentCategory]: ps.categoryCorrect[currentCategory] + 1,
      };
      ps.letterHistory = [...ps.letterHistory, currentLetter];
      ps.currentStreak += 1;
      ps.maxStreak = Math.max(ps.maxStreak, ps.currentStreak);
      updatedStats[playerId] = ps;

      return {
        ...state,
        turns: [...state.turns, turn],
        usedWords: newUsedWords,
        playerStats: updatedStats,
      };
    }

    case 'FOUL': {
      const { reason, answer, responseTime } = action.payload;
      const { config, currentPlayerIndex, currentCategory, currentLetter } = state;
      if (!config || !currentCategory || !currentLetter) return state;

      const playerId = config.players[currentPlayerIndex].id;
      const playerName = config.players[currentPlayerIndex].name;

      const turn: TurnRecord = {
        playerId,
        playerName,
        category: currentCategory,
        letter: currentLetter,
        answer: answer ?? null,
        isCorrect: false,
        foulReason: reason,
        responseTime,
        timestamp: Date.now(),
      };

      const updatedStats = { ...state.playerStats };
      const ps = { ...updatedStats[playerId] };
      ps.fouls += 1;
      ps.totalResponseTime += responseTime;
      ps.answerCount += 1;
      ps.letterHistory = [...ps.letterHistory, currentLetter];
      ps.currentStreak = 0;
      updatedStats[playerId] = ps;

      return {
        ...state,
        turns: [...state.turns, turn],
        playerStats: updatedStats,
        // Foul → force a new letter/category for the next turn
        currentCategory: null,
        currentLetter: null,
      };
    }

    case 'ADVANCE_TURN': {
      const { config, currentPlayerIndex, currentCycle } = state;
      if (!config) return state;

      const { nextPlayerIndex, nextCycle, isGameOver } = advanceTurn(
        currentPlayerIndex,
        currentCycle,
        config
      );

      if (isGameOver) {
        return { ...state, status: 'finished' };
      }

      return {
        ...state,
        currentPlayerIndex: nextPlayerIndex,
        currentCycle: nextCycle,
        // Keep currentCategory/currentLetter — only FOUL resets them
      };
    }

    case 'END_GAME': {
      return { ...state, status: 'finished' };
    }

    case 'RESET': {
      return initialState;
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  /** Derived: current player object */
  currentPlayer: GameConfig['players'][number] | null;
  /** Derived: total number of turns in the full game */
  totalTurns: number;
  /** Derived: how many turns have been completed */
  completedTurns: number;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const currentPlayer = state.config
    ? state.config.players[state.currentPlayerIndex]
    : null;

  const totalTurns = state.config
    ? state.config.players.length * state.config.numberOfCycles
    : 0;

  const completedTurns = state.turns.length;

  return (
    <GameContext.Provider
      value={{ state, dispatch, currentPlayer, totalTurns, completedTurns }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
