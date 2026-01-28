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
import { SubjectService } from '../../../../services/subject.service';

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

  // Add these properties after existing properties
  subjectsModalOpen = false;
  selectedTeacherForSubjects: Teacher | null = null;
  teacherSubjects: any[] = [];
  availableSubjects: any[] = [];
  selectedSubjectIds: string[] = [];
  assigningSubjects = false;
  selectedClassForSubjects: string = '';

  private searchSubject = new Subject<string>();

  constructor(
    private teacherService: TeacherService,
    private classService: ClassService,
    private toast: ToastService,
    private authService: AuthService,
    private subjectService: SubjectService,
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
        t.email.toLowerCase().includes(term),
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

  openSubjectsModal(teacher: Teacher): void {
    this.selectedTeacherForSubjects = teacher;
    this.subjectsModalOpen = true;
    this.loadTeacherSubjects(teacher.id!);
    this.loadAvailableSubjects();
  }

  closeSubjectsModal(): void {
    this.subjectsModalOpen = false;
    this.selectedTeacherForSubjects = null;
    this.teacherSubjects = [];
    this.selectedSubjectIds = [];
    this.selectedClassForSubjects = ''; // Reset class selection
  }

  loadTeacherSubjects(teacherId: string): void {
    // Remove the classId parameter to get all subjects across all classes
    this.teacherService
      .getTeacherSubjects(teacherId) // No second parameter
      .subscribe({
        next: (res) => {
          this.teacherSubjects = res.data;
        },
        error: (err) =>
          this.toast.apiError('Failed to load teacher subjects', err),
      });
  }

  loadAvailableSubjects(): void {
    this.subjectService.getAll().subscribe({
      next: (res) => {
        this.availableSubjects = res.data;
      },
      error: (err) => this.toast.apiError('Failed to load subjects', err),
    });
  }

  toggleSubjectSelection(subjectId: string): void {
    const index = this.selectedSubjectIds.indexOf(subjectId);
    if (index > -1) {
      this.selectedSubjectIds.splice(index, 1);
    } else {
      this.selectedSubjectIds.push(subjectId);
    }
  }

  bulkAssignSubjects(): void {
    if (
      !this.selectedTeacherForSubjects?.id ||
      this.selectedSubjectIds.length === 0 ||
      !this.selectedClassForSubjects
    )
      return;

    this.assigningSubjects = true;

    const data = {
      subjectIds: this.selectedSubjectIds,
      classId: this.selectedClassForSubjects, // Use selected class, not teacher's class
    };

    this.teacherService
      .bulkAssignSubjects(this.selectedTeacherForSubjects.id, data)
      .subscribe({
        next: (res) => {
          this.toast.success(
            `${res.data.length} subjects assigned successfully`,
          );
          this.loadTeacherSubjects(this.selectedTeacherForSubjects!.id!);
          this.selectedSubjectIds = [];
          this.selectedClassForSubjects = '';
          this.assigningSubjects = false;
        },
        error: (err) => {
          this.toast.apiError('Failed to assign subjects', err);
          this.assigningSubjects = false;
        },
      });
  }

  removeSubjectAssignment(assignmentId: string): void {
    if (!confirm('Remove this subject assignment?')) return;

    this.teacherService.removeSubjectAssignment(assignmentId).subscribe({
      next: () => {
        this.toast.success('Subject assignment removed');
        if (this.selectedTeacherForSubjects) {
          this.loadTeacherSubjects(this.selectedTeacherForSubjects.id!);
        }
      },
      error: (err) => this.toast.apiError('Failed to remove assignment', err),
    });
  }
}
