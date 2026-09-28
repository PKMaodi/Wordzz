import { Word } from './word';

export const SENTENCE_MAX_WORDS = 50;

export interface Sentence {
  id: string;
  createdAt: string;
  updatedAt: string;
  words: Word[];
}

export interface SentencePage {
  items: Sentence[];
  total: number;
  page: number;
  pageSize: number;
}

export function formatSentence(words: Word[]): string {
  if (words.length === 0) {
    return '';
  }
  const [first, ...rest] = words.map((word) => word.text);
  return [first.charAt(0).toUpperCase() + first.slice(1), ...rest].join(' ') + '.';
}
