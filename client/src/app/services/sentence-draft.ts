import { Injectable, computed, signal } from '@angular/core';

import { SENTENCE_MAX_WORDS } from '../models/sentence';
import { Word } from '../models/word';

const HISTORY_LIMIT = 100;

export type DraftMode = 'end' | 'replace' | 'before';

@Injectable({ providedIn: 'root' })
export class SentenceDraft {
  private readonly draftWords = signal<Word[]>([]);
  private readonly history = signal<Word[][]>([]);
  private readonly selection = signal<number | null>(null);
  private readonly addMode = signal<DraftMode>('end');

  readonly words = this.draftWords.asReadonly();
  readonly selectedIndex = this.selection.asReadonly();
  readonly mode = this.addMode.asReadonly();
  readonly canUndo = computed(() => this.history().length > 0);
  readonly isFull = computed(() => this.draftWords().length >= SENTENCE_MAX_WORDS);

  addWord(word: Word): void {
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
    if (selected === null) {
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
    if (selected === null) {
      return;
    }
    this.commit(this.draftWords().filter((_, index) => index !== selected));
    this.clearSelection();
  }

  undo(): void {
    const history = this.history();
    if (history.length === 0) {
      return;
    }
    this.draftWords.set(history[history.length - 1]);
    this.history.set(history.slice(0, -1));
    this.clearSelection();
  }

  clear(): void {
    if (this.draftWords().length === 0) {
      return;
    }
    this.commit([]);
    this.clearSelection();
  }

  private commit(words: Word[]): void {
    this.history.update((history) => [...history, this.draftWords()].slice(-HISTORY_LIMIT));
    this.draftWords.set(words);
  }
}
