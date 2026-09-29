import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';

let nextId = 0;

@Component({
  selector: 'app-confirm-dialog',
  imports: [],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
  host: { '(click)': 'onClick($event)' },
})
export class ConfirmDialog {
  readonly heading = input.required<string>();
  readonly open = input(false);
  readonly busy = input(false);
  readonly dialogRole = input<'dialog' | 'alertdialog'>('alertdialog');
  readonly dismiss = output<void>();

  protected readonly titleId = `dialog-title-${++nextId}`;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.open() && !dialog.open) {
        dialog.showModal();
        dialog.querySelector<HTMLElement>('[data-initial-focus]')?.focus();
      } else if (!this.open() && dialog.open) {
        dialog.close();
      }
    });
  }

  protected onCancel(event: Event): void {
    if (!event.cancelable) {
      return;
    }
    event.preventDefault();
    if (!this.busy()) {
      this.dismiss.emit();
    }
  }

  protected onClose(): void {
    if (!this.open() || this.dialog().nativeElement.open) {
      return;
    }
    if (this.busy()) {
      this.dialog().nativeElement.showModal();
    } else {
      this.dismiss.emit();
    }
  }

  protected onClick(event: MouseEvent): void {
    const dialog = this.dialog().nativeElement;
    const box = dialog.getBoundingClientRect();
    const outside =
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom;
    if (event.target === dialog && outside && !this.busy()) {
      this.dismiss.emit();
    }
  }
}
