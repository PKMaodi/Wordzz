import { Component, OnInit, inject } from '@angular/core';

import { SavedSentences } from './components/saved-sentences/saved-sentences';
import { SentenceBuilder } from './components/sentence-builder/sentence-builder';
import { SentenceStore } from './services/sentence-store';
import { Toast } from './services/toast';
import { WordStore } from './services/word-store';

@Component({
  selector: 'app-root',
  imports: [SentenceBuilder, SavedSentences],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly toast = inject(Toast);
  private readonly wordStore = inject(WordStore);
  private readonly sentenceStore = inject(SentenceStore);

  ngOnInit(): void {
    void this.wordStore.load();
    void this.sentenceStore.load();
  }
}
