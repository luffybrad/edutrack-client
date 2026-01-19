// src/app/shared/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../../auth/auth.service';
import { ToastService } from '../../../utils/toast.service';
import { RoleType } from '../../../../auth/auth.routes';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-profile-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile-management.component.html',
})
export class ProfileManagementComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  loading = false;
  updatingProfile = false;
  updatingPassword = false;
  profile: any = null;
  roleType = RoleType;

  // For password visibility toggle
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  // Activity logs (mock data)
  activityLogs = [
    {
      id: 1,
      action: 'Logged in',
      timestamp: new Date(Date.now() - 3600000),
      ip: '192.168.1.1',
    },
    {
      id: 2,
      action: 'Updated profile',
      timestamp: new Date(Date.now() - 86400000),
      ip: '192.168.1.1',
    },
    {
      id: 3,
      action: 'Changed password',
      timestamp: new Date(Date.now() - 172800000),
      ip: '192.168.1.1',
    },
    {
      id: 4,
      action: 'Viewed dashboard',
      timestamp: new Date(Date.now() - 259200000),
      ip: '192.168.1.1',
    },
  ];

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadProfile();
  }

  private initForms(): void {
    // Profile form
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    });

    // Password form
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required, Validators.minLength(6)]],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            ),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validator: this.passwordMatchValidator },
    );
  }

  private passwordMatchValidator(
    g: FormGroup,
  ): { [key: string]: boolean } | null {
    const newPassword = g.get('newPassword')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  private loadProfile(): void {
    this.loading = true;
    this.authService
      .getProfile()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          if (res?.data) {
            this.profile = res.data;
            this.profileForm.patchValue({
              name: this.profile.name,
              email: this.profile.email,
              phone: this.profile.phone || '',
            });
          }
        },
        error: (err) => {
          this.toast.apiError('Failed to load profile', err);
        },
      });
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.updatingProfile = true;
    this.authService
      .updateProfile(this.profileForm.value)
      .pipe(finalize(() => (this.updatingProfile = false)))
      .subscribe({
        next: (res) => {
          this.profile = { ...this.profile, ...this.profileForm.value };
          this.toast.success('Profile updated successfully!');
        },
        error: (err) => {
          this.toast.apiError('Failed to update profile', err);
        },
      });
  }

  // Replace the existing changePassword() method with:

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    // Check if passwords match
    const newPassword = this.passwordForm.get('newPassword')?.value;
    const confirmPassword = this.passwordForm.get('confirmPassword')?.value;

    if (newPassword !== confirmPassword) {
      this.toast.error('New password and confirmation do not match');
      return;
    }

    this.updatingPassword = true;

    // Get current user info
    const currentProfile = this.authService.getProfileSync();
    if (!currentProfile) {
      this.toast.error('Please login again');
      this.updatingPassword = false;
      return;
    }

    const passwordData = {
      currentPassword: this.passwordForm.get('currentPassword')?.value,
      newPassword: this.passwordForm.get('newPassword')?.value,
    };

    this.authService
      .changePassword(passwordData)
      .pipe(finalize(() => (this.updatingPassword = false)))
      .subscribe({
        next: () => {
          this.passwordForm.reset();
          this.toast.success('Password changed successfully!');
        },
        error: (err) => {
          const errorMessage =
            err.error?.message || 'Failed to change password';
          this.toast.error(errorMessage);

          // Clear current password field on error
          this.passwordForm.get('currentPassword')?.reset();
        },
      });
  }

  togglePasswordVisibility(
    field: 'currentPassword' | 'newPassword' | 'confirmPassword',
  ): void {
    if (field === 'currentPassword')
      this.showCurrentPassword = !this.showCurrentPassword;
    if (field === 'newPassword') this.showNewPassword = !this.showNewPassword;
    if (field === 'confirmPassword')
      this.showConfirmPassword = !this.showConfirmPassword;
  }

  getRoleDisplayName(role: string): string {
    const roleMap: { [key: string]: string } = {
      admin: 'Administrator',
      teacher: 'Teacher',
      guardian: 'Guardian',
      student: 'Student',
    };
    return roleMap[role] || role;
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getRoleColor(role: string): string {
    const colors: { [key: string]: string } = {
      admin: 'from-blue-500 to-blue-600',
      teacher: 'from-emerald-500 to-emerald-600',
      guardian: 'from-violet-500 to-violet-600',
      student: 'from-amber-500 to-amber-600',
    };
    return colors[role] || 'from-blue-500 to-blue-600';
  }
}
