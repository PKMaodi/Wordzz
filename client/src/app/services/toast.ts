import { Injectable, signal } from '@angular/core';

const TOAST_DURATION_MS = 4500;

@Injectable({ providedIn: 'root' })
export class Toast {
  private readonly currentMessage = signal<string | null>(null);
  private hideTimer: ReturnType<typeof setTimeout> | undefined;

  readonly message = this.currentMessage.asReadonly();

  show(message: string): void {
    clearTimeout(this.hideTimer);
    this.currentMessage.set(message);
    this.hideTimer = setTimeout(() => this.currentMessage.set(null), TOAST_DURATION_MS);
  }
}
