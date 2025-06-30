import { Component, OnInit } from '@angular/core';
import { ClassService, Class } from '../../../../services/class.service';
import { ToastService } from '../../../utils/toast.service';
import { AuthService } from '../../../../auth/auth.service';
import { RoleType } from '../../../../auth/auth.routes';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoadingOverlayComponent } from '../../../components/loading-overlay/loading-overlay.component';
import { map, Subject, debounceTime, Observable } from 'rxjs';
import { RouterModule } from '@angular/router';
import { Teacher } from '../../../../services/teacher.service';

@Component({
  standalone: true,
  selector: 'app-class-list',
  templateUrl: './class-list.component.html',
  imports: [
    CommonModule,
    FormsModule,
    LoadingOverlayComponent,
    ReactiveFormsModule,
    RouterModule,
  ],
})
export class ClassListComponent implements OnInit {
  classes: Class[] = [];
  filteredClasses: Class[] = [];
  searchTerm = '';
  loading = false;
  modalMode: 'view' | 'edit' | null = null;
  selectedClass: Class | null = null;

  role$!: Observable<RoleType | null>;
  RoleType = RoleType;

  private searchSubject = new Subject<string>();

  constructor(
    private classService: ClassService,
    private toast: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.getProfile().subscribe();
    this.role$ = this.authService
      .getProfile$()
      .pipe(map((p) => p?.role ?? null));
    this.fetchClasses();
    this.searchSubject
      .pipe(debounceTime(300))
      .subscribe(() => this.applyFilters());
  }

  transformSelectedClassStream(): void {
    if (this.selectedClass && this.selectedClass.stream) {
      this.selectedClass.stream = this.selectedClass.stream.toUpperCase();
    }
  }

  fetchClasses() {
    this.loading = true;
    this.classService.getAll().subscribe({
      next: (res) => {
        this.classes = res.data;
        this.filteredClasses = this.classes;
      },
      error: () => this.toast.error('Failed to load classes'),
      complete: () => (this.loading = false),
    });
  }

  triggerSearch() {
    this.searchSubject.next(this.searchTerm);
  }

  applyFilters() {
    const term = this.searchTerm.toLowerCase();
    this.filteredClasses = this.classes.filter(
      (cls) =>
        cls.stream.toLowerCase().includes(term) ||
        cls.teacher?.name?.toLowerCase().includes(term)
    );
  }

  teacherClassDisplay(teacher: Teacher): string {
    return teacher.class
      ? `Form ${teacher.class.form} ${teacher.class.stream} (${teacher.class.year})`
      : '—';
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredClasses = this.classes;
  }

  openModal(cls: Class, mode: 'view' | 'edit') {
    this.modalMode = mode;
    this.selectedClass = { ...cls };
  }

  closeModal() {
    this.modalMode = null;
    this.selectedClass = null;
  }

  saveChanges() {
    if (!this.selectedClass) return;

    this.selectedClass.stream = this.selectedClass.stream.toUpperCase();

    this.classService
      .update(this.selectedClass.id!, this.selectedClass)
      .subscribe({
        next: () => {
          this.toast.success('Class updated');
          this.fetchClasses();
          this.closeModal();
        },
        error: (err) =>
          this.toast.error('Failed to update class', err.error?.message),
      });
  }

  deleteClass(id: string) {
    if (!confirm('Are you sure?')) return;
    this.classService.delete(id).subscribe({
      next: () => {
        this.toast.success('Class deleted');
        this.fetchClasses();
      },
      error: (err) =>
        this.toast.error('Failed to delete class', err.error?.message),
    });
  }
}
