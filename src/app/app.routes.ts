// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { RoleGuard } from './auth/role.guard';
import { DashboardLayoutComponent } from './dashboard/dashboard-layout/dashboard-layout.component';
import { DashboardRedirectComponent } from './dashboard/dashboard-redirect/dashboard-redirect.component';
import { DashboardUnauthorizedComponent } from './dashboard/dashboard-unauthorized/dashboard-unauthorized.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  {
    path: 'dashboard',
    component: DashboardLayoutComponent,
    canActivate: [RoleGuard],
    children: [
      { path: '', redirectTo: 'redirect', pathMatch: 'full' },
      { path: 'redirect', component: DashboardRedirectComponent },
      {
        path: 'admin',
        loadChildren: () =>
          import('./dashboard/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
        canActivate: [RoleGuard],
        data: { roles: ['admin'] },
      },
      {
        path: 'teacher',
        loadChildren: () =>
          import('./dashboard/teacher/teacher.routes').then(
            (m) => m.TEACHER_ROUTES
          ),
        canActivate: [RoleGuard],
        data: { roles: ['teacher'] },
      },
      {
        path: 'guardian',
        loadChildren: () =>
          import('./dashboard/guardian/guardian.routes').then(
            (m) => m.GUARDIAN_ROUTES
          ),
        canActivate: [RoleGuard],
        data: { roles: ['guardian'] },
      },
    ],
  },

  { path: 'unauthorized', component: DashboardUnauthorizedComponent },

  // fallback
  { path: '**', redirectTo: '' },
];
