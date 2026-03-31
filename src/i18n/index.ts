import { Language } from '../types';
import en from './en';
import he from './he';

export type { Strings } from './en';

const strings = { en, he };

export function getStrings(language: Language) {
  return strings[language];
}

export { en, he };
export default strings;
