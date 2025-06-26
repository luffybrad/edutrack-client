import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { RoleType } from '../auth.routes';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  password = '';
  uniqueId = '';
  showPassword = false;

  role: RoleType = RoleType.Admin;
  RoleType = RoleType;

  roles = [
    { key: RoleType.Admin, label: 'Admin' },
    { key: RoleType.Teacher, label: 'Teacher' },
    { key: RoleType.Guardian, label: 'Guardian' },
  ];

  classes: any[] = [];
  students: any[] = [];

  classSearch = '';
  studentSearch = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.fetchDropdownData();

    this.router.routerState.root.queryParams.subscribe((params) => {
      const role = params['role'] as RoleType;
      if (role) {
        this.role = role;
        this.auth.setRole(role); // sync into storage
      }
    });
  }

  onRoleChange(newRole: RoleType) {
    this.role = newRole;
    this.uniqueId = '';
  }

  get filteredClasses() {
    return this.classSearch && Array.isArray(this.classes)
      ? this.classes.filter((cls) =>
          `${cls.form}${cls.stream}${cls.year}`
            .toLowerCase()
            .includes(this.classSearch.toLowerCase())
        )
      : [];
  }

  get filteredStudents() {
    return this.studentSearch && Array.isArray(this.students)
      ? this.students.filter((s) =>
          `${s.admNo} ${s.name}`
            .toLowerCase()
            .includes(this.studentSearch.toLowerCase())
        )
      : [];
  }

  selectClass(cls: any) {
    this.uniqueId = cls.id;
    this.classSearch = `${cls.form}${cls.stream} - ${cls.year}`;
  }

  selectStudent(student: any) {
    this.uniqueId = student.admNo;
    this.studentSearch = `${student.admNo} - ${student.name}`;
  }

  fetchDropdownData() {
    this.http.get<any>(`${environment.apiUrl}/classes`).subscribe((res) => {
      this.classes = Array.isArray(res.data) ? res.data : [];
    });

    this.http.get<any>(`${environment.apiUrl}/students`).subscribe((res) => {
      this.students = Array.isArray(res.data) ? res.data : [];
    });
  }

  feedbackMessage: string = ''; // 👈 New: visible feedback message
  feedbackType: 'success' | 'error' = 'success'; // 👈 New: used to style

  // Replace toast.* calls in submitLogin()
  submitLogin() {
    this.feedbackMessage = ''; // Clear previous
    if (!this.email || !this.password) {
      this.feedbackType = 'error';
      this.feedbackMessage = 'Please enter both email and password';
      return;
    }

    const body: any = { email: this.email, password: this.password };
    if (this.role !== RoleType.Admin) {
      body.uniqueId = this.uniqueId;
    }

    this.auth.login(this.role, body).subscribe({
      next: () => {
        this.feedbackType = 'success';
        this.feedbackMessage = 'Login successful';

        this.router.navigate(['/dashboard/redirect']);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Login failed';
        this.feedbackType = 'error';
        this.feedbackMessage = msg;
      },
    });
  }

  goToSignup() {
    this.router.navigate(['/signup'], { queryParams: { role: this.role } });
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password'], {
      queryParams: { role: this.role },
    });
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
