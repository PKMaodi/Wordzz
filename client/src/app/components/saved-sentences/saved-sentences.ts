import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';

import { describeSentenceTimes, formatSentence } from '../../models/sentence';
import { describeApiError } from '../../services/api';
import { SentenceDraft } from '../../services/sentence-draft';
import { PAGE_SIZE, SentenceStore } from '../../services/sentence-store';
import { Toast } from '../../services/toast';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';

const NOT_FOUND_MESSAGE =
  'This sentence could not be found. Reload your saved sentences and try again.';

@Component({
  selector: 'app-saved-sentences',
  imports: [ConfirmDialog],
  templateUrl: './saved-sentences.html',
  styleUrl: './saved-sentences.css',
})
export class SavedSentences {
  protected readonly store = inject(SentenceStore);
  protected readonly draft = inject(SentenceDraft);
  protected readonly skeletonWidths = [80, 65, 72];
  protected readonly items = computed(() =>
    this.store.sentences().map((sentence) => ({
      id: sentence.id,
      text: formatSentence(sentence.words),
      times: describeSentenceTimes(sentence),
      editing: sentence.id === this.draft.editing()?.id,
      fresh: sentence.id === this.store.lastSavedId() && sentence.id !== this.draft.editing()?.id
    }))
  );
  protected readonly pageSize = PAGE_SIZE;
  protected readonly shownCount = computed(() =>
    Math.min(this.store.sentences().length, this.store.total())
  );
  protected readonly moreCount = computed(() =>
    Math.min(PAGE_SIZE, this.store.total() - this.store.sentences().length)
  );
  protected readonly toDelete = signal<{ id: string; text: string } | null>(null);
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);
  private readonly toast = inject(Toast);

  protected async showMore(): Promise<void> {
    try {
      await this.store.loadMore();
    } catch (error) {
      this.toast.show(describeApiError(error).message);
    }
  }

  protected edit(id: string): void {
    this.draft.guard(() => void this.openForEditing(id));
  }

  private async openForEditing(id: string): Promise<void> {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      await this.draft.open(id);
    } catch (error) {
      this.toast.show(isNotFound(error) ? NOT_FOUND_MESSAGE : describeApiError(error).message);
    }
  }

  protected askToDelete(target: { id: string; text: string }): void {
    this.deleteError.set(null);
    this.toDelete.set(target);
  }

  protected closeDelete(): void {
    if (!this.deleting()) {
      this.toDelete.set(null);
    }
  }

  protected async confirmDelete(): Promise<void> {
    const target = this.toDelete();
    if (target === null || this.deleting()) {
      return;
    }
    this.deleting.set(true);
    this.deleteError.set(null);
    try {
      await this.store.remove(target.id);
    } catch (error) {
      if (!isNotFound(error)) {
        this.deleteError.set(describeApiError(error).message);
        return;
      }
    } finally {
      this.deleting.set(false);
    }
    if (this.draft.editing()?.id === target.id) {
      this.draft.reset();
    }
    this.toDelete.set(null);
    this.toast.show('Sentence deleted.');
  }
}

function isNotFound(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 404;
}
