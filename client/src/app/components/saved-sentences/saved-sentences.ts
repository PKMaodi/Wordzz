import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject } from '@angular/core';

import { describeSentenceTimes, formatSentence } from '../../models/sentence';
import { describeApiError } from '../../services/api';
import { SentenceDraft } from '../../services/sentence-draft';
import { PAGE_SIZE, SentenceStore } from '../../services/sentence-store';
import { Toast } from '../../services/toast';

const NOT_FOUND_MESSAGE =
  'This sentence could not be found. Reload your saved sentences and try again.';

@Component({
  selector: 'app-saved-sentences',
  imports: [],
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
      const notFound = error instanceof HttpErrorResponse && error.status === 404;
      this.toast.show(notFound ? NOT_FOUND_MESSAGE : describeApiError(error).message);
    }
  }
}
