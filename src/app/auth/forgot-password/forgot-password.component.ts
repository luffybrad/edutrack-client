import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { RoleType } from '../auth.routes';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastService } from '../../shared/utils/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  email = '';
  role: RoleType = RoleType.Admin;
  RoleType = RoleType;

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {
    this.route.queryParams.subscribe((params) => {
      if (params['role']) this.role = params['role'];
    });
  }

  submitRequest() {
    if (!this.email) {
      this.toast.error('Validation Error', 'Please enter your email.');
      return;
    }

    this.auth.forgotPassword(this.email, this.role).subscribe({
      next: () => {
        this.toast.success(
          'Reset link sent',
          'Check your email for instructions.'
        );
      },
      error: (err) => {
        const msg =
          err?.error?.message ||
          (typeof err === 'string' ? err : 'Failed to send reset link');
        this.toast.apiError('Request failed', err);
      },
    });
  }

  goToLogin() {
    this.router.navigate(['/login'], { queryParams: { role: this.role } });
  }
}
