import { Routes } from '@angular/router';
import { GuardianHomeComponent } from './guardian-home/guardian-home.component';
// Optional layout
import { GuardianLayoutComponent } from './guardian-layout/guardian-layout.component';

export const GUARDIAN_ROUTES: Routes = [
  {
    path: '',
    component: GuardianLayoutComponent,
    children: [
      {
        path: '',
        component: GuardianHomeComponent,
      },
      // Add more child routes here as needed
    ],
  },
];
