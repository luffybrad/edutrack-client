import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-unauthorized',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-unauthorized.component.html',
  styleUrl: './dashboard-unauthorized.component.css',
})
export class DashboardUnauthorizedComponent {}
