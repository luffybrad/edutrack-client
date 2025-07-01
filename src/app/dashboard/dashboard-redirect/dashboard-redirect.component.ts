// src/app/dashboard/dashboard-redirect/dashboard-redirect.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { RoleType } from '../../auth/auth.routes';

@Component({
  selector: 'app-dashboard-redirect',
  standalone: true,
  imports: [],
  template: '', // Assuming no UI — just logic
})
export class DashboardRedirectComponent implements OnInit {
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.auth.getProfile().subscribe({
      next: (res) => {
        const role = res?.data?.role;
        switch (role) {
          case RoleType.Admin:
            this.router.navigate(['/dashboard/admin']);
            break;
          case RoleType.Teacher:
            this.router.navigate(['/dashboard/teacher']);
            break;
          case RoleType.Guardian:
            this.router.navigate(['/dashboard/guardian']);
            break;
          default:
            this.router.navigate(['/login']);
        }
      },
      error: () => {
        this.router.navigate(['/unauthorized']);
      },
    });
  }
}
