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
