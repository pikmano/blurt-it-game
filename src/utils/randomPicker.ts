import { Category, Language } from '../types';
import { getValidLetters } from './validation';

/**
 * Returns a random item from an array.
 */
export function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Returns a random game category from the given pool (defaults to all categories).
 */
export function randomCategory(categories?: Category[]): Category {
  const pool: Category[] = categories && categories.length > 0
    ? categories
    : ['animals', 'countries', 'cities', 'plants'];
  return randomFrom(pool);
}

/**
 * Returns a random letter that is guaranteed to have at least one valid word
 * for the given category and language.
 */
export function randomLetter(category: Category, language: Language): string {
  const letters = getValidLetters(category, language);
  return randomFrom(letters);
}

/**
 * Picks a random category (from the optional restricted pool) and a valid letter for it.
 */
export function randomTurn(
  language: Language,
  categories?: Category[]
): { category: Category; letter: string } {
  const category = randomCategory(categories);
  const letter = randomLetter(category, language);
  return { category, letter };
}

/**
 * Generates a unique ID string.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
