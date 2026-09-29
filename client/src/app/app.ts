import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AddWordDialog } from './components/add-word-dialog/add-word-dialog';
import { ConfirmDialog } from './components/confirm-dialog/confirm-dialog';
import { SavedSentences } from './components/saved-sentences/saved-sentences';
import { SentenceBuilder } from './components/sentence-builder/sentence-builder';
import { Word, WordType } from './models/word';
import { SentenceDraft } from './services/sentence-draft';
import { SentenceStore } from './services/sentence-store';
import { Toast } from './services/toast';
import { WordStore } from './services/word-store';

@Component({
  selector: 'app-root',
  imports: [SentenceBuilder, SavedSentences, ConfirmDialog, AddWordDialog],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: { '(window:beforeunload)': 'warnBeforeLeaving($event)' }
})
export class App implements OnInit {
  protected readonly toast = inject(Toast);
  protected readonly draft = inject(SentenceDraft);
  protected readonly leaveText = computed(() =>
    this.draft.editing()
      ? 'Your changes to this sentence have not been saved. If you leave now, they will be lost.'
      : 'Your new sentence has not been saved. If you leave now, it will be lost.'
  );
  protected readonly wordStore = inject(WordStore);
  protected readonly addingWord = signal(false);
  protected readonly wordType = signal<WordType>('Noun');
  protected readonly loadProblem = signal<string | null>(null);
  protected readonly retrying = signal(false);
  private readonly sentenceStore = inject(SentenceStore);

  ngOnInit(): void {
    void this.loadAll();
  }

  protected async retry(): Promise<void> {
    this.retrying.set(true);
    await this.loadAll();
    this.retrying.set(false);
    if (this.loadProblem() === null) {
      this.toast.show('Connected. Your words and sentences are back.');
    }
  }

  protected wordAdded(word: Word): void {
    this.addingWord.set(false);
    this.wordType.set(word.type);
    this.toast.show(`“${word.text}” was added to the ${word.type} list.`);
  }

  protected warnBeforeLeaving(event: BeforeUnloadEvent): void {
    if (this.draft.isDirty()) {
      event.preventDefault();
    }
  }

  private async loadAll(): Promise<void> {
    await Promise.all([this.wordStore.load(), this.sentenceStore.load()]);
    this.loadProblem.set((this.wordStore.error() ?? this.sentenceStore.error())?.message ?? null);
  }
}
