import { Injectable, computed, signal } from '@angular/core';

import { SENTENCE_MAX_WORDS } from '../models/sentence';
import { Word } from '../models/word';

const HISTORY_LIMIT = 100;

@Injectable({ providedIn: 'root' })
export class SentenceDraft {
  private readonly draftWords = signal<Word[]>([]);
  private readonly history = signal<Word[][]>([]);

  readonly words = this.draftWords.asReadonly();
  readonly canUndo = computed(() => this.history().length > 0);
  readonly isFull = computed(() => this.draftWords().length >= SENTENCE_MAX_WORDS);

  addWord(word: Word): void {
    if (this.isFull()) {
      return;
    }
    this.commit([...this.draftWords(), word]);
  }

  undo(): void {
    const history = this.history();
    if (history.length === 0) {
      return;
    }
    this.draftWords.set(history[history.length - 1]);
    this.history.set(history.slice(0, -1));
  }

  clear(): void {
    if (this.draftWords().length === 0) {
      return;
    }
    this.commit([]);
  }

  private commit(words: Word[]): void {
    this.history.update((history) => [...history, this.draftWords()].slice(-HISTORY_LIMIT));
    this.draftWords.set(words);
  }
}
