import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Sentence } from '../models/sentence';
import { Api, ApiErrorDetails, LoadStatus, describeApiError } from './api';

const PAGE_SIZE = 20;

@Injectable({ providedIn: 'root' })
export class SentenceStore {
  private readonly api = inject(Api);

  private readonly sentenceList = signal<Sentence[]>([]);
  private readonly totalCount = signal(0);
  private readonly loadStatus = signal<LoadStatus>('loading');
  private readonly loadError = signal<ApiErrorDetails | null>(null);
  private readonly moreLoading = signal(false);
  private readonly endReached = signal(false);

  readonly sentences = this.sentenceList.asReadonly();
  readonly total = this.totalCount.asReadonly();
  readonly status = this.loadStatus.asReadonly();
  readonly error = this.loadError.asReadonly();
  readonly loadingMore = this.moreLoading.asReadonly();
  readonly hasMore = computed(
    () => !this.endReached() && this.sentenceList().length < this.totalCount()
  );

  async load(): Promise<void> {
    this.loadStatus.set('loading');
    this.loadError.set(null);

    try {
      const page = await firstValueFrom(this.api.getSentences(1, PAGE_SIZE));
      this.sentenceList.set(page.items);
      this.totalCount.set(page.total);
      this.endReached.set(page.items.length < PAGE_SIZE);
      this.loadStatus.set('ready');
    } catch (error) {
      this.loadError.set(describeApiError(error));
      this.loadStatus.set('error');
    }
  }

  async loadMore(): Promise<void> {
    if (this.moreLoading()) {
      return;
    }
    this.moreLoading.set(true);

    try {
      const target = this.sentenceList().length + PAGE_SIZE;
      let page = Math.floor(this.sentenceList().length / PAGE_SIZE) + 1;

      while (this.hasMore() && this.sentenceList().length < target) {
        const reply = await firstValueFrom(this.api.getSentences(page, PAGE_SIZE));
        const known = new Set(this.sentenceList().map((sentence) => sentence.id));
        const unseen = reply.items.filter((sentence) => !known.has(sentence.id));
        this.sentenceList.update((sentences) => [...sentences, ...unseen]);
        this.totalCount.set(reply.total);
        this.endReached.set(reply.items.length < PAGE_SIZE);
        page += 1;
      }
    } finally {
      this.moreLoading.set(false);
    }
  }
}
