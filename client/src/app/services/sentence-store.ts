import { HttpErrorResponse } from '@angular/common/http';
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
  private readonly lastSaved = signal<string | null>(null);

  readonly sentences = this.sentenceList.asReadonly();
  readonly total = this.totalCount.asReadonly();
  readonly status = this.loadStatus.asReadonly();
  readonly error = this.loadError.asReadonly();
  readonly loadingMore = this.moreLoading.asReadonly();
  readonly lastSavedId = this.lastSaved.asReadonly();
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

  async get(id: string): Promise<Sentence> {
    try {
      const sentence = await firstValueFrom(this.api.getSentence(id));
      this.replace(sentence);
      return sentence;
    } catch (error) {
      this.dropIfGone(id, error);
      throw error;
    }
  }

  async create(wordIds: string[]): Promise<Sentence> {
    const sentence = await firstValueFrom(this.api.createSentence(wordIds));
    this.sentenceList.update((sentences) => [sentence, ...sentences]);
    this.totalCount.update((total) => total + 1);
    this.lastSaved.set(sentence.id);
    return sentence;
  }

  async update(id: string, wordIds: string[]): Promise<Sentence> {
    try {
      const sentence = await firstValueFrom(this.api.updateSentence(id, wordIds));
      this.replace(sentence);
      this.lastSaved.set(sentence.id);
      return sentence;
    } catch (error) {
      this.dropIfGone(id, error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await firstValueFrom(this.api.deleteSentence(id));
      this.drop(id);
    } catch (error) {
      this.dropIfGone(id, error);
      throw error;
    }
  }

  private replace(sentence: Sentence): void {
    this.sentenceList.update((sentences) =>
      sentences.map((existing) => (existing.id === sentence.id ? sentence : existing))
    );
  }

  private drop(id: string): void {
    if (!this.sentenceList().some((sentence) => sentence.id === id)) {
      return;
    }
    this.sentenceList.update((sentences) => sentences.filter((sentence) => sentence.id !== id));
    this.totalCount.update((total) => Math.max(total - 1, 0));
  }

  private dropIfGone(id: string, error: unknown): void {
    if (error instanceof HttpErrorResponse && error.status === 404) {
      this.drop(id);
    }
  }
}
