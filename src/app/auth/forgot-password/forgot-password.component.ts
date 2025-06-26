import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { RoleType } from '../auth.routes';
import { Router, ActivatedRoute } from '@angular/router';

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

  feedbackMessage: string = '';
  feedbackType: 'success' | 'error' = 'success';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe((params) => {
      if (params['role']) this.role = params['role'];
    });
  }

  submitRequest() {
    this.feedbackMessage = '';

    this.auth.forgotPassword(this.email, this.role).subscribe({
      next: () => {
        this.feedbackType = 'success';
        this.feedbackMessage = '✅ Reset link sent. Check your email.';
      },
      error: (err) => {
        const msg =
          err?.error?.message ||
          (typeof err === 'string' ? err : 'Failed to send reset link');
        this.feedbackType = 'error';
        this.feedbackMessage = msg;
      },
    });
  }

  goToLogin() {
    this.router.navigate(['/login'], { queryParams: { role: this.role } });
  }
}
