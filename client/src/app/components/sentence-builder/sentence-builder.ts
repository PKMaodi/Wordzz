import { Component, computed, inject, model, output } from '@angular/core';

import { SENTENCE_MAX_WORDS, describeSentenceTimes, formatSentence } from '../../models/sentence';
import { WORD_TYPES, WordType } from '../../models/word';
import { SentenceDraft } from '../../services/sentence-draft';
import { Toast } from '../../services/toast';
import { WordStore } from '../../services/word-store';

@Component({
  selector: 'app-sentence-builder',
  imports: [],
  templateUrl: './sentence-builder.html',
  styleUrl: './sentence-builder.css',
})
export class SentenceBuilder {
  protected readonly draft = inject(SentenceDraft);
  protected readonly maxWords = SENTENCE_MAX_WORDS;
  protected readonly sentenceText = computed(() => formatSentence(this.draft.words()));
  protected readonly editMeta = computed(() => {
    const editing = this.draft.editing();
    return editing === null
      ? ''
      : `${describeSentenceTimes(editing)}. Your changes replace the saved words when you press Save changes.`;
  });
  protected readonly selectedWord = computed(() => {
    const index = this.draft.selectedIndex();
    return index === null ? '' : (this.draft.words()[index]?.text ?? '');
  });
  protected readonly wordTypes = WORD_TYPES;
  readonly wordType = model<WordType>('Noun');
  readonly addWordRequested = output<void>();
  protected readonly wordStore = inject(WordStore);
  protected readonly skeletonWidths = [64, 88, 56, 76, 96, 60];
  protected readonly typeWords = computed(() =>
    this.wordStore
      .words()
      .filter((word) => word.type === this.wordType())
      .sort((a, b) => a.text.localeCompare(b.text, undefined, { sensitivity: 'base' }))
  );
  protected readonly wordsLocked = computed(
    () => (this.draft.isFull() && this.draft.mode() !== 'replace') || this.draft.busy()
  );
  protected readonly modeText = computed(() => {
    const mode = this.draft.mode();
    if (mode === 'replace') {
      return `Tap a word to replace “${this.selectedWord()}”.`;
    }
    if (mode === 'before') {
      return `Tap a word to add it before “${this.selectedWord()}”.`;
    }
    return this.draft.isFull()
      ? `This sentence has ${SENTENCE_MAX_WORDS} words, the most allowed. Remove a word to add another.`
      : 'Tap a word to add it to the end.';
  });
  protected readonly saveDisabled = computed(
    () =>
      this.draft.words().length === 0 || this.draft.busy() || this.wordStore.status() !== 'ready'
  );
  protected readonly saveLabel = computed(() => {
    if (this.draft.saving()) {
      return 'Saving…';
    }
    return this.draft.editing() ? 'Save changes' : 'Save sentence';
  });
  private readonly toast = inject(Toast);

  protected async save(): Promise<void> {
    const message = this.draft.editing() ? 'Changes saved.' : 'Sentence saved.';
    if (await this.draft.save()) {
      this.toast.show(message);
    }
  }

  protected cancelEdit(): void {
    this.draft.guard(() => this.draft.reset());
  }
}
