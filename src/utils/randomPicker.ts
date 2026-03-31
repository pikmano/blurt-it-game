import { Category, Language } from '../types';
import { getValidLetters } from './validation';

/**
 * Returns a random item from an array.
 */
export function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Returns a random game category.
 */
export function randomCategory(): Category {
  const categories: Category[] = ['animals', 'countries', 'cities'];
  return randomFrom(categories);
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
 * Picks a random category and a valid letter for it.
 */
export function randomTurn(language: Language): { category: Category; letter: string } {
  const category = randomCategory();
  const letter = randomLetter(category, language);
  return { category, letter };
}

/**
 * Generates a unique ID string.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
