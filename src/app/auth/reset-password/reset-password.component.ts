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

  // public router: Router;

  // constructor(router: Router) {
  //   this.router = router;
  // }

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
    this.auth.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        alert('✅ Password reset! Please login.');
        this.router.navigate(['/login']);
      },
      error: (err) => console.error('❌ Error:', err),
    });
  }
}
