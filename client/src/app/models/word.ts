export const WORD_TYPES = [
  'Noun',
  'Verb',
  'Adjective',
  'Adverb',
  'Pronoun',
  'Preposition',
  'Conjunction',
  'Determiner',
  'Exclamation'
] as const;

export type WordType = (typeof WORD_TYPES)[number];

export const WORD_TEXT_MAX_LENGTH = 30;

export const WORD_TEXT_PATTERN = /^[A-Za-z]+(?:['-][A-Za-z]+)*$/;

export interface Word {
  id: string;
  text: string;
  type: WordType;
}
