import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-guardian-layout',
  imports: [CommonModule, RouterModule],
  templateUrl: './guardian-layout.component.html',
  styleUrl: './guardian-layout.component.css',
})
export class GuardianLayoutComponent {}
