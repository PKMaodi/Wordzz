import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Word, WordType } from '../models/word';
import { Api, ApiErrorDetails, LoadStatus, describeApiError } from './api';

@Injectable({ providedIn: 'root' })
export class WordStore {
  private readonly api = inject(Api);

  private readonly wordList = signal<Word[]>([]);
  private readonly loadStatus = signal<LoadStatus>('loading');
  private readonly loadError = signal<ApiErrorDetails | null>(null);

  readonly words = this.wordList.asReadonly();
  readonly status = this.loadStatus.asReadonly();
  readonly error = this.loadError.asReadonly();

  async load(): Promise<void> {
    this.loadStatus.set('loading');
    this.loadError.set(null);

    try {
      this.wordList.set(await firstValueFrom(this.api.getWords()));
      this.loadStatus.set('ready');
    } catch (error) {
      this.loadError.set(describeApiError(error));
      this.loadStatus.set('error');
    }
  }

  async add(text: string, type: WordType): Promise<Word> {
    const word = await firstValueFrom(this.api.createWord(text, type));
    this.wordList.update((words) => [...words, word]);
    return word;
  }
}
