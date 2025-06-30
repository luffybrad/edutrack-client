import { RoleType } from './../../../../auth/auth.routes';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { StudentService, Student } from '../../../../services/student.service';
import { AuthService } from '../../../../auth/auth.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../utils/toast.service';
import { debounceTime } from 'rxjs/operators';
import { LoadingOverlayComponent } from '../../../components/loading-overlay/loading-overlay.component';

import {
  Guardian,
  GuardianService,
} from '../../../../services/guardian.server';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-student-list',
  imports: [CommonModule, FormsModule, LoadingOverlayComponent, RouterModule],
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.css'],
})
export class StudentListComponent implements OnInit {
  students: (Student & { selected?: boolean })[] = [];
  selectedStudent: Student | null = null;
  modalMode: 'view' | 'edit' | null = null;
  guardian: Guardian | null = null;
  loading = false;

  role$: Observable<RoleType | null>;
  RoleType = RoleType;

  // 🔍 Search + Filter Fields
  searchTerm = '';
  selectedForm: number | '' = '';
  selectedYear: number | '' = '';
  selectedStream: string = '';
  filteredStudents: (Student & { selected?: boolean })[] = [];
  private searchSubject = new Subject<string>();
  filterForm: number | '' = '';
  filterStream: string = '';
  filterYear: number | '' = '';

  constructor(
    private studentService: StudentService,
    private auth: AuthService,
    private toast: ToastService,
    private guardianService: GuardianService
  ) {
    this.role$ = this.auth
      .getProfile$()
      .pipe(map((profile) => profile?.role ?? null));
  }

  ngOnInit(): void {
    this.auth.getProfile().subscribe();
    this.fetchStudents();

    this.searchSubject.pipe(debounceTime(300)).subscribe((term) => {
      this.applyFilters();
    });
  }

  // ✅ Selection Logic
  get selectedIds(): string[] {
    return this.students.filter((s) => s.selected).map((s) => s.id!);
  }

  get allSelected(): boolean {
    return this.students.length > 0 && this.students.every((s) => s.selected);
  }

  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    this.students.forEach((s) => (s.selected = checked));
  }

  // 📦 Fetch All
  fetchStudents(): void {
    this.loading = true; // 👈 start loading
    this.studentService.getAll().subscribe({
      next: (res) => {
        this.students = res.data.map((s) => ({ ...s, selected: false }));
        this.applyFilters();
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Failed to fetch students', err.error?.message || '');
      },
      complete: () => {
        this.loading = false; // 👈 stop loading
      },
    });
  }

  // 🔍 Search + Filter Logic
  applyFilters(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredStudents = this.students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(term) ||
        s.admNo.toLowerCase().includes(term);

      const matchesForm =
        !this.filterForm || Number(s.class?.form) === Number(this.filterForm);

      const matchesStream =
        !this.filterStream ||
        s.class?.stream?.toLowerCase() === this.filterStream.toLowerCase();

      const matchesYear = !this.filterYear || s.class?.year === this.filterYear;

      return matchesSearch && matchesForm && matchesStream && matchesYear;
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  // 🔄 Modal Handling
  openModal(student: Student, mode: 'view' | 'edit'): void {
    this.selectedStudent = { ...student };
    this.modalMode = mode;

    if (mode === 'view' && student.guardianId) {
      this.loading = true; // 👈 start loading
      this.guardian = null;
      this.guardianService.getById(student.guardianId).subscribe({
        next: (res) => {
          this.guardian = res.data;
        },
        error: (err) => {
          console.error(err);
          this.toast.error(
            'Failed to fetch guardian info',
            err.error?.message || ''
          );
        },
        complete: () => {
          this.loading = false; // 👈 stop loading
        },
      });
    }
  }

  closeModal(): void {
    this.selectedStudent = null;
    this.modalMode = null;
  }

  saveChanges(): void {
    if (!this.selectedStudent?.id) return;

    this.studentService
      .update(this.selectedStudent.id, this.selectedStudent)
      .subscribe({
        next: () => {
          this.fetchStudents();
          this.closeModal();
          this.toast.success('Student updated successfully!');
        },
        error: (err) => {
          console.error(err);
          this.toast.error(
            'Failed to update student',
            err.error?.message || 'Please check your input.'
          );
        },
      });
  }

  // 🗑 Single Delete
  deleteStudent(id: string): void {
    if (!confirm('Are you sure you want to delete this student?')) return;

    this.studentService.delete(id).subscribe({
      next: () => {
        this.fetchStudents();
        this.toast.success('Student deleted.');
      },
      error: (err) => {
        console.error(err);
        this.toast.error(
          'Failed to delete student',
          err.error?.message || 'Could not complete the action.'
        );
      },
    });
  }

  // 🧹 Bulk Delete
  bulkDeleteSelected(): void {
    const ids = this.selectedIds;
    if (ids.length === 0) return;

    if (!confirm(`Delete ${ids.length} students?`)) return;

    this.studentService.bulkDelete(ids).subscribe({
      next: () => {
        this.fetchStudents();
        this.toast.success(`Deleted ${ids.length} students.`);
      },
      error: (err) => {
        this.toast.error(
          'Bulk delete failed',
          err.error?.message || 'Some records may not have been deleted.'
        );
      },
    });
  }
}
