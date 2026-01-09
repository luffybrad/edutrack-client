import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { debounceTime, Subject as RxSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SubjectService, Subject } from '../../../../services/subject.service';
import { AuthService } from '../../../../auth/auth.service';
import { ToastService } from '../../../utils/toast.service';
import { LoadingOverlayComponent } from '../../../components/loading-overlay/loading-overlay.component';
import { RoleType } from '../../../../auth/auth.routes';

@Component({
  standalone: true,
  selector: 'app-subject-list',
  imports: [CommonModule, FormsModule, RouterModule, LoadingOverlayComponent],
  templateUrl: './subject-list.component.html',
  styleUrls: ['./subject-list.component.css'],
})
export class SubjectListComponent implements OnInit {
  subjects: (Subject & { selected?: boolean })[] = [];
  filteredSubjects: (Subject & { selected?: boolean })[] = [];

  selectedSubject: Subject | null = null;
  modalMode: 'add' | 'edit' | null = null;

  loading = false;
  RoleType = RoleType;
  role$: Observable<RoleType | null>;

  searchTerm = '';
  private searchSubject = new RxSubject<string>();

  constructor(
    private subjectService: SubjectService,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {
    this.role$ = this.auth.getProfile$().pipe(map((p) => p?.role ?? null));
  }

  ngOnInit(): void {
    this.auth.getProfile().subscribe();
    this.fetchSubjects();

    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.applySearch();
    });
  }

  fetchSubjects(): void {
    this.loading = true;
    this.subjectService.getAll().subscribe({
      next: (res) => {
        // subjects now contain totalStudents property
        this.subjects = res.data.map((s) => ({ ...s, selected: false }));
        this.applySearch();
      },
      error: (err) => this.toast.apiError('Failed to fetch subjects', err),
      complete: () => (this.loading = false),
    });
  }

  triggerSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  applySearch(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredSubjects = this.subjects.filter((s) =>
      s.name.toLowerCase().includes(term)
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applySearch();
  }

  allowLettersOnly(event: KeyboardEvent): void {
  if (!/^[a-zA-Z]$/.test(event.key)) {
    event.preventDefault();
  }
}

assignClasses(subject: Subject): void {
  // Navigate to the assign-classes page for this subject
  this.router.navigate(['/dashboard/admin/subjects', subject.id, 'assign-classes']);
}



  openModal(mode: 'add' | 'edit', subject?: Subject): void {
    this.modalMode = mode;
    this.selectedSubject =
      mode === 'edit' && subject ? { ...subject } : { name: '' };
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedSubject = null;
  }

  private sanitizeName(raw: string): string {
    return raw.replace(/[^a-zA-Z]/g, '').toLowerCase();
  }

  saveSubject(): void {
    if (!this.selectedSubject?.name?.trim()) {
      this.toast.error('Subject name is required');
      return;
    }

    const sanitizedName = this.sanitizeName(this.selectedSubject.name);
    if (!sanitizedName) {
      this.toast.error('Subject name must contain letters.');
      return;
    }

    const payload: Subject = { ...this.selectedSubject, name: sanitizedName };

    if (this.modalMode === 'add') {
      this.subjectService.create(payload).subscribe({
        next: () => {
          this.toast.success('Subject created!');
          this.fetchSubjects();
          this.closeModal();
        },
        error: (err) => this.toast.apiError('Failed to create subject', err),
      });
    } else if (this.modalMode === 'edit' && this.selectedSubject.id) {
      this.subjectService.update(this.selectedSubject.id, payload).subscribe({
        next: () => {
          this.toast.success('Subject updated!');
          this.fetchSubjects();
          this.closeModal();
        },
        error: (err) => this.toast.apiError('Failed to update subject', err),
      });
    }
  }

  deleteSubject(id: string): void {
    if (!confirm('Are you sure you want to delete this subject?')) return;

    this.subjectService.delete(id).subscribe({
      next: () => {
        this.toast.success('Subject deleted.');
        this.fetchSubjects();
      },
      error: (err) => this.toast.apiError('Failed to delete subject', err),
    });
  }

  get selectedIds(): string[] {
    return this.subjects.filter((s) => s.selected).map((s) => s.id!);
  }

  get allSelected(): boolean {
    return this.subjects.length > 0 && this.subjects.every((s) => s.selected);
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.subjects.forEach((s) => (s.selected = checked));
  }

  bulkDeleteSelected(): void {
    const ids = this.selectedIds;
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} subjects?`)) return;

    let completed = 0;
    ids.forEach((id) => {
      this.subjectService.delete(id).subscribe({
        next: () => this.toast.success('Subject deleted.'),
        error: (err) => this.toast.apiError('Failed to delete subject', err),
        complete: () => {
          completed++;
          if (completed === ids.length) this.fetchSubjects();
        },
      });
    });
  }
}
