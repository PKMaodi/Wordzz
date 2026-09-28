import { Injectable, computed, inject, signal } from '@angular/core';

import { SENTENCE_MAX_WORDS } from '../models/sentence';
import { Word } from '../models/word';
import { ApiErrorDetails, describeApiError } from './api';
import { SentenceStore } from './sentence-store';

const HISTORY_LIMIT = 100;

export type DraftMode = 'end' | 'replace' | 'before';

@Injectable({ providedIn: 'root' })
export class SentenceDraft {
  private readonly sentenceStore = inject(SentenceStore);

  private readonly draftWords = signal<Word[]>([]);
  private readonly history = signal<Word[][]>([]);
  private readonly selection = signal<number | null>(null);
  private readonly addMode = signal<DraftMode>('end');
  private readonly savingSentence = signal(false);
  private readonly lastSaveError = signal<ApiErrorDetails | null>(null);

  readonly words = this.draftWords.asReadonly();
  readonly selectedIndex = this.selection.asReadonly();
  readonly mode = this.addMode.asReadonly();
  readonly saving = this.savingSentence.asReadonly();
  readonly saveError = this.lastSaveError.asReadonly();
  readonly busy = computed(() => this.savingSentence());
  readonly canUndo = computed(() => this.history().length > 0);
  readonly isFull = computed(() => this.draftWords().length >= SENTENCE_MAX_WORDS);

  addWord(word: Word): void {
    if (this.busy()) {
      return;
    }
    const words = this.draftWords();
    const selected = this.selection();

    if (this.addMode() === 'replace' && selected !== null) {
      this.commit(words.map((existing, index) => (index === selected ? word : existing)));
      this.clearSelection();
      return;
    }
    if (this.isFull()) {
      return;
    }
    if (this.addMode() === 'before' && selected !== null) {
      this.commit([...words.slice(0, selected), word, ...words.slice(selected)]);
      this.selection.set(selected + 1);
      return;
    }
    this.commit([...words, word]);
  }

  select(index: number): void {
    this.selection.set(this.selection() === index ? null : index);
    this.addMode.set('end');
  }

  clearSelection(): void {
    this.selection.set(null);
    this.addMode.set('end');
  }

  move(offset: -1 | 1): void {
    const selected = this.selection();
    const words = this.draftWords();
    if (this.busy() || selected === null) {
      return;
    }
    const target = selected + offset;
    if (target < 0 || target >= words.length) {
      return;
    }
    const moved = [...words];
    [moved[selected], moved[target]] = [moved[target], moved[selected]];
    this.commit(moved);
    this.selection.set(target);
  }

  toggleReplace(): void {
    this.addMode.update((mode) => (mode === 'replace' ? 'end' : 'replace'));
  }

  toggleAddBefore(): void {
    this.addMode.update((mode) => (mode === 'before' ? 'end' : 'before'));
  }

  removeSelected(): void {
    const selected = this.selection();
    if (this.busy() || selected === null) {
      return;
    }
    this.commit(this.draftWords().filter((_, index) => index !== selected));
    this.clearSelection();
  }

  undo(): void {
    const history = this.history();
    if (this.busy() || history.length === 0) {
      return;
    }
    this.draftWords.set(history[history.length - 1]);
    this.history.set(history.slice(0, -1));
    this.clearSelection();
  }

  clear(): void {
    if (this.busy() || this.draftWords().length === 0) {
      return;
    }
    this.commit([]);
    this.clearSelection();
  }

  async save(): Promise<boolean> {
    const words = this.draftWords();
    if (this.busy() || words.length === 0) {
      return false;
    }
    this.savingSentence.set(true);
    this.lastSaveError.set(null);
    this.clearSelection();

    try {
      await this.sentenceStore.create(wordIdsOf(words));
      this.savingSentence.set(false);
      this.reset();
      return true;
    } catch (error) {
      this.savingSentence.set(false);
      this.lastSaveError.set(describeApiError(error));
      return false;
    }
  }

  reset(): void {
    this.draftWords.set([]);
    this.history.set([]);
    this.clearSelection();
    this.lastSaveError.set(null);
  }

  private commit(words: Word[]): void {
    this.history.update((history) => [...history, this.draftWords()].slice(-HISTORY_LIMIT));
    this.draftWords.set(words);
    this.lastSaveError.set(null);
  }
}

function wordIdsOf(words: Word[]): string[] {
  return words.map((word) => word.id);
}
