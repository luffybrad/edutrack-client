import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { RoleType } from '../auth.routes';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../shared/utils/toast.service';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxMaskDirective],
  providers: [NgxMaskDirective],
  templateUrl: './signup.component.html',
})
export class SignupComponent {
  role: RoleType = RoleType.Admin;
  form: any = {
    name: '',
    phone: '',
    email: '',
    password: '',
    admNo: '',
    classId: '',
  };
  RoleType = RoleType;

  classes: any[] = [];
  students: any[] = [];

  showPassword: boolean = false; // 👁️ Eye icon toggle

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private toast: ToastService
  ) {
    this.route.queryParams.subscribe((params) => {
      if (params['role']) this.role = params['role'];
    });

    // fetch both datasets
    this.http.get<any>(`${environment.apiUrl}/classes`).subscribe((res) => {
      this.classes = Array.isArray(res) ? res : res.data ?? [];
    });

    this.http.get<any>(`${environment.apiUrl}/students`).subscribe((res) => {
      this.students = Array.isArray(res) ? res : res.data ?? [];
    });
  }

  submitSignup() {
    const body: any = { email: this.form.email, password: this.form.password };

    if (this.role === RoleType.Admin) {
      body.name = this.form.name;
      body.phone = this.form.phone;
    }
    if (this.role === RoleType.Guardian) {
      body.admNo = this.form.admNo;
    }
    if (this.role === RoleType.Teacher) {
      body.classId = this.form.classId;
    }

    this.auth.signup(this.role, body).subscribe({
      next: () => {
        this.toast.success('Signup successful', 'You can now login.');
        this.goToLogin();
      },
      error: (err) => {
        this.toast.apiError('Signup failed', err);
      },
    });
  }

  goToLogin() {
    this.router.navigate(['/login'], { queryParams: { role: this.role } });
  }

  goHome() {
    this.router.navigate(['/']);
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password'], {
      queryParams: { role: this.role },
    });
  }
}
