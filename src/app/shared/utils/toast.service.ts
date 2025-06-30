// src/app/shared/utils/toast.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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
    }, 4000);
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

  clear() {
    this.toast$.next(null);
  }
}
