import { useCallback } from 'react';
import { Category, Language, ValidationResult } from '../types';
import { validateWord } from '../utils/validation';

interface UseValidationOptions {
  category: Category | null;
  letter: string | null;
  language: Language;
  usedWords: string[];
}

/**
 * Returns a `validate` function pre-bound to current game state.
 */
export function useValidation({
  category,
  letter,
  language,
  usedWords,
}: UseValidationOptions) {
  const validate = useCallback(
    (word: string): ValidationResult => {
      if (!category || !letter) {
        return { valid: false, reason: 'not_in_category' };
      }
      return validateWord(word, category, letter, language, usedWords);
    },
    [category, letter, language, usedWords]
  );

  return { validate };
}
