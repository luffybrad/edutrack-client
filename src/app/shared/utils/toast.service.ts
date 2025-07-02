import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { extractErrorMessage } from './extractErrorMessage'; // 👈 import your helper!

export interface ToastMessage {
  text: string; // Title
  type: 'success' | 'error' | 'info';
  description?: string; // Backend detail
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toast$ = new BehaviorSubject<ToastMessage | null>(null);

  private timeout: any;

  show(toast: ToastMessage) {
    this.toast$.next(toast);
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.toast$.next(null);
    }, 5000);
  }

  success(text: string, description?: string) {
    this.show({ text, type: 'success', description });
  }

  error(text: string, description?: string) {
    this.show({ text, type: 'error', description });
  }

  info(text: string, description?: string) {
    this.show({ text, type: 'info', description });
  }

  apiError(title: string, error: unknown) {
    this.error(title, extractErrorMessage(error));
  }

  clear() {
    this.toast$.next(null);
  }
}
