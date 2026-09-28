import { Component, computed, inject, signal } from '@angular/core';

import { SENTENCE_MAX_WORDS, formatSentence } from '../../models/sentence';
import { WORD_TYPES, WordType } from '../../models/word';
import { SentenceDraft } from '../../services/sentence-draft';

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
  protected readonly wordTypes = WORD_TYPES;
  protected readonly wordType = signal<WordType>('Noun');
}
