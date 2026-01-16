import { Component, OnInit } from '@angular/core';
import { TeacherService, Teacher } from '../../../../services/teacher.service';
import { ClassService, Class } from '../../../../services/class.service';
import { ToastService } from '../../../utils/toast.service';
import { AuthService } from '../../../../auth/auth.service';
import { RoleType } from '../../../../auth/auth.routes';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LoadingOverlayComponent } from '../../../components/loading-overlay/loading-overlay.component';
import { map, Observable, Subject, debounceTime } from 'rxjs';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

@Component({
  standalone: true,
  selector: 'app-teacher-list',
  templateUrl: './teacher-list.component.html',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LoadingOverlayComponent,
    NgxMaskDirective,
  ],
  providers: [provideNgxMask()],
})
export class TeacherListComponent implements OnInit {
  teachers: Teacher[] = [];
  classes: Class[] = [];
  filteredTeachers: Teacher[] = [];
  searchTerm = '';
  loading = false;

  modalMode: 'view' | 'edit' | null = null;
  selectedTeacher: Teacher | null = null;

  role$!: Observable<RoleType | null>;
  RoleType = RoleType;

  private searchSubject = new Subject<string>();

  constructor(
    private teacherService: TeacherService,
    private classService: ClassService,
    private toast: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.fetchTeachers();
    this.fetchClasses();
    this.role$ = this.authService
      .getProfile$()
      .pipe(map((p) => p?.role ?? null));

    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.applySearchFilter();
    });
  }

  fetchTeachers(): void {
    this.loading = true;
    this.teacherService.getAll().subscribe({
      next: (res) => {
        this.teachers = res.data;
        this.filteredTeachers = [...this.teachers];
      },
      error: (err) => this.toast.apiError('Failed to load teachers', err),
      complete: () => (this.loading = false),
    });
  }

  fetchClasses(): void {
    this.classService.getAll().subscribe({
      next: (res) => {
        this.classes = res.data;
      },
      error: (err) => this.toast.apiError('Failed to load classes', err),
    });
  }

  teacherClassDisplay(teacher: Teacher): string {
    return teacher.class
      ? `Form ${teacher.class.form} ${teacher.class.stream} (${teacher.class.year})`
      : '—';
  }

  triggerSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  applySearchFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredTeachers = this.teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        t.email.toLowerCase().includes(term)
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredTeachers = [...this.teachers];
  }

  openModal(teacher: Teacher, mode: 'view' | 'edit'): void {
    this.modalMode = mode;
    this.selectedTeacher = { ...teacher };
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedTeacher = null;
  }

  saveChanges(): void {
    if (!this.selectedTeacher) return;

    this.teacherService
      .update(this.selectedTeacher.id!, this.selectedTeacher)
      .subscribe({
        next: () => {
          this.toast.success('Teacher updated');
          this.fetchTeachers();
          this.closeModal();
        },
        error: (err) => this.toast.apiError('Failed to update teacher', err),
      });
  }

  deleteTeacher(id: string): void {
    if (!confirm('Are you sure you want to delete this teacher?')) return;

    this.teacherService.delete(id).subscribe({
      next: () => {
        this.toast.success('Teacher deleted');
        this.fetchTeachers();
      },
      error: (err) => this.toast.apiError('Failed to delete teacher', err),
    });
  }

  // Add these getters after the existing properties
  get assignedTeachersCount(): number {
    return this.teachers.filter((t) => t.classId).length;
  }

  get unassignedTeachersCount(): number {
    return this.teachers.filter((t) => !t.classId).length;
  }

  get assignmentRate(): number {
    return this.teachers.length > 0
      ? Math.round((this.assignedTeachersCount / this.teachers.length) * 100)
      : 0;
  }
}
