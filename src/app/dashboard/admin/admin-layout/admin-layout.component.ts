import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { Observable, map } from 'rxjs';
import { RoleType } from '../../../auth/auth.routes';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent {
  sidebarOpen = false;
  currentYear = new Date().getFullYear();
  currentDate = new Date();

  // Add these properties
  adminName$!: Observable<string>;
  adminEmail$!: Observable<string>;
  adminInitials$!: Observable<string>;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Get guardian profile data
    this.adminName$ = this.authService
      .getProfile$()
      .pipe(map((profile) => profile?.name || 'Admin'));

    this.adminEmail$ = this.authService
      .getProfile$()
      .pipe(map((profile) => profile?.email || ''));

    this.adminInitials$ = this.authService.getProfile$().pipe(
      map((profile) => {
        if (!profile?.name) return 'A';
        const names = profile.name.split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (
          names[0].charAt(0) + names[names.length - 1].charAt(0)
        ).toUpperCase();
      }),
    );

    // Fetch profile on initialization
    this.authService.getProfile().subscribe();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout() {
    this.authService.logout();
  }
}
