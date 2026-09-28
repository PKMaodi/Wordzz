import { Component } from '@angular/core';

import { SavedSentences } from './components/saved-sentences/saved-sentences';
import { SentenceBuilder } from './components/sentence-builder/sentence-builder';

@Component({
  selector: 'app-root',
  imports: [SentenceBuilder, SavedSentences],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
