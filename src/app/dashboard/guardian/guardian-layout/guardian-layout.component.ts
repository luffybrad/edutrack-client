import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-guardian-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './guardian-layout.component.html',
  styleUrl: './guardian-layout.component.css',
})
export class GuardianLayoutComponent {
  sidebarOpen = false;
  currentDate = new Date();
  currentYear = new Date().getFullYear();

  // Add these properties
  guardianName$!: Observable<string>;
  guardianEmail$!: Observable<string>;
  guardianInitials$!: Observable<string>;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Get guardian profile data
    this.guardianName$ = this.authService
      .getProfile$()
      .pipe(map((profile) => profile?.name || 'Guardian'));

    this.guardianEmail$ = this.authService
      .getProfile$()
      .pipe(map((profile) => profile?.email || ''));

    this.guardianInitials$ = this.authService.getProfile$().pipe(
      map((profile) => {
        if (!profile?.name) return 'G';
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

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout() {
    this.authService.logout();
  }
}
