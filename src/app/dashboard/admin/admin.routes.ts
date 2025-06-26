import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { AdminHomeComponent } from './admin-home/admin-home.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', component: AdminHomeComponent },
      // Add more admin pages here like 'students', 'results', etc.
    ],
  },
];
