// src/app/shared/entities/student/student-list/student-list.component.ts
import { StudentService, Student } from '../../../../services/student.service';
import { RoleType } from '../../../../auth/auth.routes';
import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AuthService } from '../../../../auth/auth.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../utils/toast.service';
import { LoadingOverlayComponent } from '../../../components/loading-overlay/loading-overlay.component';
import {
  Guardian,
  GuardianService,
} from '../../../../services/guardian.service';
import { RouterModule } from '@angular/router';
import { ClassService, Class } from '../../../../services/class.service';

@Component({
  standalone: true,
  selector: 'app-student-list',
  imports: [CommonModule, FormsModule, LoadingOverlayComponent, RouterModule],
  templateUrl: './student-list.component.html',
})
export class StudentListComponent implements OnInit, OnDestroy {
  students: (Student & { selected?: boolean })[] = [];
  selectedStudent: Student | null = null;
  modalMode: 'view' | 'edit' | null = null;
  guardian: Guardian | null = null;
  teacherClassId: string | null = null;
  guardianId: string | null = null;

  loading = false;
  classes: Class[] = [];
  subjectsDisplay: string = '';

  role$: Observable<RoleType | null>;
  RoleType = RoleType;

  searchTerm = '';
  selectedForm: number | '' = '';
  selectedYear: number | '' = '';
  selectedStream: string = '';
  filteredStudents: (Student & { selected?: boolean })[] = [];
  private searchSubject = new Subject<string>();
  filterForm: number | '' = '';
  filterStream: string = '';
  filterYear: number | '' = '';

  // New properties for stats
  totalStudents = 0;
  studentsByForm: { form: number; count: number }[] = [];
  activeFilters = false;

  private searchSubscription?: Subscription;

  constructor(
    private studentService: StudentService,
    private classService: ClassService,
    private auth: AuthService,
    private toast: ToastService,
    private guardianService: GuardianService,
  ) {
    this.role$ = this.auth
      .getProfile$()
      .pipe(map((profile) => profile?.role ?? null));
  }

  ngOnInit(): void {
    this.auth.getProfile().subscribe();

    // Get teacher's classId from profile
    this.auth.getProfile$().subscribe((profile) => {
      this.teacherClassId = profile?.classId || null;
      // Get guardian ID if user is a guardian
      if (profile?.role === RoleType.Guardian) {
        this.guardianId = profile.id;
      }
    });

    this.fetchStudents();
    this.fetchClasses();

    // Setup debounced search
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.applyFilters();
      });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  setSubjectsDisplay(student: Student): void {
    if (student.subjects?.length) {
      this.subjectsDisplay = student.subjects.map((s) => s.name).join(', ');
    } else {
      this.subjectsDisplay = 'No subjects assigned';
    }
  }

  fetchClasses(): void {
    this.classService.getAll().subscribe({
      next: (res) => {
        let classes = res.data || [];

        // Filter classes by teacher's class
        if (this.teacherClassId) {
          classes = classes.filter((cls) => cls.id === this.teacherClassId);
        }

        this.classes = classes;
      },
      error: (err) => this.toast.apiError('Failed to load classes', err),
    });
  }

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

  fetchStudents(): void {
    this.loading = true;
    this.studentService.getAll().subscribe({
      next: (res) => {
        let students = res.data || [];

        // Filter students by teacher's class
        if (this.teacherClassId) {
          students = students.filter(
            (s) =>
              s.class?.id === this.teacherClassId ||
              s.classId === this.teacherClassId,
          );
        }

        // Filter students by guardian ID (for guardians)
        if (this.guardianId) {
          students = students.filter((s) => s.guardianId === this.guardianId);
        }

        this.students = students.map((s) => ({
          ...s,
          selected: false,
        }));
        this.totalStudents = this.students.length;
        this.calculateFormDistribution();
        this.applyFilters();
      },
      error: (err) => this.toast.apiError('Failed to fetch students', err),
      complete: () => {
        this.loading = false;
      },
    });
  }

  calculateFormDistribution(): void {
    const forms = [1, 2, 3, 4];
    this.studentsByForm = forms.map((form) => ({
      form,
      count: this.students.filter((s) => s.class?.form === form).length,
    }));
  }

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

    // Check if any filters are active
    this.activeFilters = !!(
      this.searchTerm.trim() ||
      this.filterForm ||
      this.filterStream ||
      this.filterYear
    );
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterForm = '';
    this.filterStream = '';
    this.filterYear = '';
    this.applyFilters();
  }

  openModal(student: Student, mode: 'view' | 'edit'): void {
    this.selectedStudent = {
      ...student,
      classId: student.classId || student.class?.id || '',
    };
    this.setSubjectsDisplay(this.selectedStudent);
    this.modalMode = mode;

    if (mode === 'view' && student.guardianId) {
      this.loading = true;
      this.guardian = null;
      this.guardianService.getById(student.guardianId).subscribe({
        next: (res) => {
          this.guardian = res.data;
        },
        error: (err) =>
          this.toast.apiError('Failed to fetch guardian info', err),
        complete: () => {
          this.loading = false;
        },
      });
    }
    if (mode === 'view' && student.subjects) {
      this.setSubjectsDisplay(student);
      this.guardian = null;
      this.loading = false;
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
        error: (err) => this.toast.apiError('Failed to update student', err),
      });
  }

  deleteStudent(id: string): void {
    if (!confirm('Are you sure you want to delete this student?')) return;

    this.studentService.delete(id).subscribe({
      next: () => {
        this.fetchStudents();
        this.toast.success('Student deleted.');
      },
      error: (err) => this.toast.apiError('Failed to delete student', err),
    });
  }

  bulkDeleteSelected(): void {
    const ids = this.selectedIds;
    if (ids.length === 0) return;

    if (!confirm(`Delete ${ids.length} students?`)) return;

    this.studentService.bulkDelete(ids).subscribe({
      next: () => {
        this.fetchStudents();
        this.toast.success(`Deleted ${ids.length} students.`);
      },
      error: (err) => this.toast.apiError('Bulk delete failed', err),
    });
  }

  getFormColor(form: number): string {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-emerald-100 text-emerald-800 border-emerald-200',
      'bg-violet-100 text-violet-800 border-violet-200',
      'bg-amber-100 text-amber-800 border-amber-200',
    ];
    return colors[form - 1] || colors[0];
  }
}
