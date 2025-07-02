import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../shared/utils/toast.service';

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

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  constructor(
    public auth: AuthService,
    public route: ActivatedRoute,
    public router: Router,
    private toast: ToastService
  ) {
    this.route.queryParams.subscribe((params) => {
      this.token = params['token'] || '';
    });
  }

  submitReset() {
    if (!this.newPassword) {
      this.toast.error('Validation Error', 'Please enter a new password.');
      return;
    }

    this.auth.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.toast.success('Password reset!', 'Redirecting to login...');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.toast.apiError('Reset failed', err);
      },
    });
  }
}
