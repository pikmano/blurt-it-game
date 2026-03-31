import { Category, Language, ValidationResult, FoulReason } from '../types';

// ─── Word List Imports ────────────────────────────────────────────────────────

import animalsEn from '../data/animals_en.json';
import animalsHe from '../data/animals_he.json';
import countriesEn from '../data/countries_en.json';
import countriesHe from '../data/countries_he.json';
import citiesEn from '../data/cities_en.json';
import citiesHe from '../data/cities_he.json';

// ─── Types ────────────────────────────────────────────────────────────────────

type WordSet = Set<string>;
type ByLetterMap = Record<string, string[]>;

// ─── Build Indexes (runs once at module load) ─────────────────────────────────

function buildWordSet(words: string[]): WordSet {
  return new Set(words.map(w => w.toLowerCase().trim()));
}

function buildByLetter(words: string[]): ByLetterMap {
  const map: ByLetterMap = {};
  for (const word of words) {
    const normalized = word.toLowerCase().trim();
    // For Hebrew, characters are multi-byte but charAt/[0] works correctly
    const letter = normalized[0];
    if (!letter) continue;
    if (!map[letter]) map[letter] = [];
    map[letter].push(normalized);
  }
  return map;
}

// Pre-built structures for fast runtime lookup
const wordSets: Record<Language, Record<Category, WordSet>> = {
  en: {
    animals: buildWordSet(animalsEn),
    countries: buildWordSet(countriesEn),
    cities: buildWordSet(citiesEn),
  },
  he: {
    animals: buildWordSet(animalsHe),
    countries: buildWordSet(countriesHe),
    cities: buildWordSet(citiesHe),
  },
};

const byLetterMaps: Record<Language, Record<Category, ByLetterMap>> = {
  en: {
    animals: buildByLetter(animalsEn),
    countries: buildByLetter(countriesEn),
    cities: buildByLetter(citiesEn),
  },
  he: {
    animals: buildByLetter(animalsHe),
    countries: buildByLetter(countriesHe),
    cities: buildByLetter(citiesHe),
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Validates a player's answer. Returns within 1ms (pure set/string ops).
 */
export function validateWord(
  word: string,
  category: Category,
  letter: string,
  language: Language,
  usedWords: string[]
): ValidationResult {
  const normalized = word.toLowerCase().trim();

  if (!normalized) {
    return { valid: false, reason: 'not_in_category' };
  }

  // 1. Check first letter matches
  const expectedLetter = letter.toLowerCase();
  if (normalized[0] !== expectedLetter) {
    return { valid: false, reason: 'wrong_letter' };
  }

  // 2. Check word exists in category
  const wordSet = wordSets[language][category];
  if (!wordSet.has(normalized)) {
    return { valid: false, reason: 'not_in_category' };
  }

  // 3. Check word hasn't been used already
  if (usedWords.includes(normalized)) {
    return { valid: false, reason: 'already_used' };
  }

  return { valid: true, reason: null };
}

/**
 * Returns all letters that have at least one valid word for the given
 * category and language.
 */
export function getValidLetters(category: Category, language: Language): string[] {
  return Object.keys(byLetterMaps[language][category]);
}

/**
 * Returns a human-readable label for a foul reason.
 */
export function foulLabel(reason: FoulReason): string {
  switch (reason) {
    case 'wrong_letter':
      return 'Wrong letter';
    case 'not_in_category':
      return 'Not in category';
    case 'already_used':
      return 'Already used';
    case 'time_up':
      return "Time's up";
  }
}
