import { Category, Language, ValidationResult, FoulReason } from '../types';
import { getAliasLookup } from '../data/aliases';

// ─── Word List Imports ────────────────────────────────────────────────────────

import animalsEn from '../data/animals_en.json';
import animalsHe from '../data/animals_he.json';
import countriesEn from '../data/countries_en.json';
import countriesHe from '../data/countries_he.json';
import citiesEn from '../data/cities_en.json';
import citiesHe from '../data/cities_he.json';
import plantsEn from '../data/plants_en.json';
import plantsHe from '../data/plants_he.json';

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
    plants: buildWordSet(plantsEn),
  },
  he: {
    animals: buildWordSet(animalsHe),
    countries: buildWordSet(countriesHe),
    cities: buildWordSet(citiesHe),
    plants: buildWordSet(plantsHe),
  },
};

const byLetterMaps: Record<Language, Record<Category, ByLetterMap>> = {
  en: {
    animals: buildByLetter(animalsEn),
    countries: buildByLetter(countriesEn),
    cities: buildByLetter(citiesEn),
    plants: buildByLetter(plantsEn),
  },
  he: {
    animals: buildByLetter(animalsHe),
    countries: buildByLetter(countriesHe),
    cities: buildByLetter(citiesHe),
    plants: buildByLetter(plantsHe),
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Validates a player's answer. Returns within 1ms (pure set/string ops).
 *
 * Alias resolution:
 *   - If the player says "usa" for letter U  → resolves to "united states" → valid ✓
 *   - If the player says "america" for A     → resolves to "united states" → valid ✓
 *   - The letter check always uses WHAT THE PLAYER SAID, not the canonical form.
 *   - usedWords tracks the canonical form so "usa" and "united states" can't both score.
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

  // 1. Check first letter of what the player said
  const expectedLetter = letter.toLowerCase();
  if (normalized[0] !== expectedLetter) {
    return { valid: false, reason: 'wrong_letter' };
  }

  const wordSet = wordSets[language][category];
  const aliasLookup = getAliasLookup(language, category);

  // 2a. Direct match in word list
  if (wordSet.has(normalized)) {
    // Check against canonical form so aliases of the same word block each other
    const canonical = aliasLookup.get(normalized) ?? normalized;
    if (usedWords.includes(normalized) || usedWords.includes(canonical)) {
      return { valid: false, reason: 'already_used' };
    }
    return { valid: true, reason: null };
  }

  // 2b. Alias match — player said a synonym
  const canonical = aliasLookup.get(normalized);
  if (canonical && wordSet.has(canonical)) {
    // Block if canonical or ANY alias of it was already used
    if (usedWords.includes(canonical) || usedWords.includes(normalized)) {
      return { valid: false, reason: 'already_used' };
    }
    return { valid: true, reason: null };
  }

  return { valid: false, reason: 'not_in_category' };
}

/**
 * Returns all letters that have at least one valid word for the given
 * category and language.
 */
export function getValidLetters(category: Category, language: Language): string[] {
  return Object.keys(byLetterMaps[language][category]);
}

/**
 * Returns all valid words for the given category, letter, and language
 * that haven't been used yet. Excludes alias-only entries (only canonical words).
 * Capped at maxResults to avoid overwhelming the UI.
 */
export function getRemainingWords(
  category: Category,
  letter: string,
  language: Language,
  usedWords: string[],
  maxResults = 20
): string[] {
  const map = byLetterMaps[language][category];
  const key = letter.toLowerCase();
  const candidates = map[key] ?? [];
  const usedSet = new Set(usedWords.map(w => w.toLowerCase()));
  const results: string[] = [];
  for (const word of candidates) {
    if (!usedSet.has(word) && results.length < maxResults) {
      results.push(word);
    }
  }
  return results;
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
