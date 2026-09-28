import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/env.live';
import { Sentence, SentencePage } from '../models/sentence';
import { Word, WordType } from '../models/word';

const SERVER_UNREACHABLE =
  "Wordzz can't reach its server. Check that the Wordzz server is running, then try again.";
const SERVER_FAILED = 'Something went wrong on the server. Try again in a moment.';

export interface ApiErrorDetails {
  message: string;
  errors: string[];
}

export type LoadStatus = 'loading' | 'ready' | 'error';

@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getWords(): Observable<Word[]> {
    return this.http.get<Word[]>(`${this.baseUrl}/words`);
  }

  createWord(text: string, type: WordType): Observable<Word> {
    return this.http.post<Word>(`${this.baseUrl}/words`, { text, type });
  }

  getSentences(page: number, pageSize: number): Observable<SentencePage> {
    return this.http.get<SentencePage>(`${this.baseUrl}/sentences`, {
      params: { page, pageSize }
    });
  }

  getSentence(id: string): Observable<Sentence> {
    return this.http.get<Sentence>(this.sentenceUrl(id));
  }

  createSentence(wordIds: string[]): Observable<Sentence> {
    return this.http.post<Sentence>(`${this.baseUrl}/sentences`, { wordIds });
  }

  updateSentence(id: string, wordIds: string[]): Observable<Sentence> {
    return this.http.put<Sentence>(this.sentenceUrl(id), { wordIds });
  }

  deleteSentence(id: string): Observable<void> {
    return this.http.delete<void>(this.sentenceUrl(id));
  }

  private sentenceUrl(id: string): string {
    return `${this.baseUrl}/sentences/${encodeURIComponent(id)}`;
  }
}

export function describeApiError(error: unknown): ApiErrorDetails {
  if (!(error instanceof HttpErrorResponse) || error.status >= 500) {
    return { message: SERVER_FAILED, errors: [] };
  }
  if (error.status === 0) {
    return { message: SERVER_UNREACHABLE, errors: [] };
  }

  const reply: unknown = error.error;
  if (
    typeof reply !== 'object' ||
    reply === null ||
    !('message' in reply) ||
    typeof reply.message !== 'string' ||
    reply.message.trim() === ''
  ) {
    return { message: SERVER_FAILED, errors: [] };
  }

  const errors = 'errors' in reply && Array.isArray(reply.errors) ? reply.errors : [];
  return {
    message: reply.message,
    errors: errors.filter((item): item is string => typeof item === 'string')
  };
}
