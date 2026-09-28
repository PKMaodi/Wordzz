import { Word } from './word';

export const SENTENCE_MAX_WORDS = 50;

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit'
};

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

export function describeSentenceTimes(sentence: Sentence): string {
  const saved = `Saved ${formatTime(sentence.createdAt)}`;
  if (sentence.updatedAt === sentence.createdAt) {
    return saved;
  }
  return `${saved} · Changed ${formatTime(sentence.updatedAt)}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, TIME_FORMAT);
}
