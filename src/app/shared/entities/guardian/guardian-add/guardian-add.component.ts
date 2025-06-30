import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GuardianService } from '../../../../services/guardian.service';
import { Student, StudentService } from '../../../../services/student.service';
import { ToastService } from '../../../utils/toast.service';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

@Component({
  standalone: true,
  selector: 'app-guardian-add',
  templateUrl: './guardian-add.component.html',
  imports: [CommonModule, FormsModule, NgxMaskDirective],
  providers: [provideNgxMask()],
})
export class GuardianAddComponent implements OnInit {
  name = '';
  email = '';
  phone = '';

  students: Student[] = [];
  studentSearch = '';
  selectedStudentIds: string[] = [];

  constructor(
    private studentService: StudentService,
    private guardianService: GuardianService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchStudents();
  }

  fetchStudents(): void {
    this.studentService.getAll().subscribe({
      next: (res) => (this.students = res.data),
      error: () => this.toast.error('Failed to load students'),
    });
  }

  get filteredStudents(): Student[] {
    const term = this.studentSearch.toLowerCase();
    return this.students.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.admNo.toLowerCase().includes(term)
    );
  }

  toggleStudent(studentId: string): void {
    const i = this.selectedStudentIds.indexOf(studentId);
    if (i === -1) {
      this.selectedStudentIds.push(studentId);
    } else {
      this.selectedStudentIds.splice(i, 1);
    }
  }

  goBack(): void {
    this.router.navigate(['dashboard/admin/guardians']); // adjust your route
  }

  saveGuardian(): void {
    if (this.selectedStudentIds.length === 0) {
      this.toast.error('Select at least one student');
      return;
    }

    this.guardianService
      .create({
        name: this.name,
        email: this.email,
        phone: this.phone,
        studentIds: this.selectedStudentIds,
      })
      .subscribe({
        next: () => {
          this.toast.success('Guardian created');
          this.router.navigate(['dashboard/admin/guardians']); // adjust your route
        },
        error: (err) =>
          this.toast.error('Failed to create guardian', err.error?.message),
      });
  }
}
