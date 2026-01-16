import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';

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
  notifications = [
    { id: 1, title: 'New Student Enrolled', time: '2 hours ago', read: false },
    { id: 2, title: 'Exam Results Published', time: '1 day ago', read: false },
    { id: 3, title: 'Fee Payment Received', time: '2 days ago', read: true },
  ];

  constructor(private authService: AuthService) {}

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout() {
    this.authService.logout();
  }

  get unreadNotificationsCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }
}
