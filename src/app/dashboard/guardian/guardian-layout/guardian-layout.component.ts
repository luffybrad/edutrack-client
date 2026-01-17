import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';

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

  constructor(private authService: AuthService) {}

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout() {
    this.authService.logout();
  }
}
