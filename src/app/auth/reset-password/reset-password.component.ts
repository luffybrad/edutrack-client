import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent {
  newPassword = '';
  token = '';
  showPassword = false;
  feedbackMessage: string = '';
  feedbackType: 'success' | 'error' = 'success';

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  constructor(
    public auth: AuthService,
    public route: ActivatedRoute,
    public router: Router
  ) {
    this.route.queryParams.subscribe((params) => {
      this.token = params['token'] || '';
    });
  }

  submitReset() {
    this.feedbackMessage = '';

    this.auth.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.feedbackType = 'success';
        this.feedbackMessage = '✅ Password reset! Redirecting to login...';

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000); // ⏳ Delay to let user see the message
      },
      error: (err) => {
        const msg =
          err?.error?.message ||
          (typeof err === 'string' ? err : 'Failed to reset password');
        this.feedbackType = 'error';
        this.feedbackMessage = msg;
      },
    });
  }
}
