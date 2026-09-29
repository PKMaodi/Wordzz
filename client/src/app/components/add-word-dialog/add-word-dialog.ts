import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';

import {
  WORD_TEXT_MAX_LENGTH,
  WORD_TEXT_PATTERN,
  WORD_TYPES,
  Word,
  WordType
} from '../../models/word';
import { describeApiError } from '../../services/api';
import { WordStore } from '../../services/word-store';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-add-word-dialog',
  imports: [ConfirmDialog],
  templateUrl: './add-word-dialog.html',
  styleUrl: './add-word-dialog.css',
})
export class AddWordDialog {
  readonly open = input(false);
  readonly initialType = input<WordType>('Noun');
  readonly closed = output<void>();
  readonly added = output<Word>();

  protected readonly wordTypes = WORD_TYPES;
  protected readonly text = signal('');
  protected readonly type = signal<WordType>('Noun');
  protected readonly adding = signal(false);
  protected readonly errors = signal<string[]>([]);
  protected readonly tried = signal(false);
  protected readonly problems = computed(() => this.checkWord(this.text().trim(), this.type()));
  protected readonly shownErrors = computed(() =>
    this.tried() && this.problems().length > 0 ? this.problems() : this.errors()
  );
  private readonly wordStore = inject(WordStore);
  private readonly textInput = viewChild.required<ElementRef<HTMLInputElement>>('textInput');

  constructor() {
    effect(() => {
      if (this.open()) {
        this.text.set('');
        this.type.set(this.initialType());
        this.errors.set([]);
        this.tried.set(false);
      }
    });
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.adding()) {
      return;
    }
    this.tried.set(true);
    if (this.problems().length > 0) {
      this.textInput().nativeElement.focus();
      return;
    }
    this.adding.set(true);
    this.errors.set([]);
    try {
      this.added.emit(await this.wordStore.add(this.text().trim(), this.type()));
    } catch (error) {
      const details = describeApiError(error);
      this.errors.set([details.message, ...details.errors]);
    } finally {
      this.adding.set(false);
    }
  }

  protected chooseType(value: string): void {
    const type = WORD_TYPES.find((name) => name === value);
    if (type) {
      this.type.set(type);
    }
  }

  private checkWord(text: string, type: WordType): string[] {
    if (text.length < 1 || text.length > WORD_TEXT_MAX_LENGTH) {
      return [`The word must be 1 to ${WORD_TEXT_MAX_LENGTH} letters long.`];
    }
    if (!WORD_TEXT_PATTERN.test(text)) {
      return ['The word can contain only letters, apostrophes or hyphens.'];
    }
    const lower = text.toLowerCase();
    const taken = this.wordStore
      .words()
      .some((word) => word.type === type && word.text.toLowerCase() === lower);
    return taken ? [`“${text}” is already in the ${type} list. Choose another word or type.`] : [];
  }
}
