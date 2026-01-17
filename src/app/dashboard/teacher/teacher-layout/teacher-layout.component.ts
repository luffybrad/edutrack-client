import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-teacher-layout',
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './teacher-layout.component.html',
  styleUrl: './teacher-layout.component.css',
})
export class TeacherLayoutComponent {
  sidebarOpen = false;
  currentYear = new Date().getFullYear();
  currentDate = new Date();

  // Add these properties
  teacherName$!: Observable<string>;
  teacherEmail$!: Observable<string>;
  teacherInitials$!: Observable<string>;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Get teacher profile data
    this.teacherName$ = this.authService
      .getProfile$()
      .pipe(map((profile) => profile?.name || 'Teacher'));

    this.teacherEmail$ = this.authService
      .getProfile$()
      .pipe(map((profile) => profile?.email || ''));

    this.teacherInitials$ = this.authService.getProfile$().pipe(
      map((profile) => {
        if (!profile?.name) return 'T';
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
