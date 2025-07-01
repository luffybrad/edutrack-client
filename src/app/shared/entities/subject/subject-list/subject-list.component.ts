import { RoleType } from '../../../../auth/auth.routes';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { debounceTime, Subject as RxSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SubjectService, Subject } from '../../../../services/subject.service';
import { AuthService } from '../../../../auth/auth.service';
import { ToastService } from '../../../utils/toast.service';
import { LoadingOverlayComponent } from '../../../components/loading-overlay/loading-overlay.component';
import { Class } from '../../../../services/class.service';

@Component({
  standalone: true,
  selector: 'app-subject-list',
  imports: [CommonModule, FormsModule, RouterModule, LoadingOverlayComponent],
  templateUrl: './subject-list.component.html',
  styleUrls: ['./subject-list.component.css'],
})
export class SubjectListComponent implements OnInit {
  subjects: (Subject & { selected?: boolean; assignedClasses?: Class[] })[] =
    [];
  filteredSubjects: (Subject & {
    selected?: boolean;
    assignedClasses?: Class[];
  })[] = [];

  selectedSubject: Subject | null = null;

  modalMode: 'add' | 'edit' | null = null;

  loading = false;

  RoleType = RoleType;
  role$: Observable<RoleType | null>;

  searchTerm = '';
  private searchSubject = new RxSubject<string>();

  private sanitizeName(rawName: string): string {
    return rawName.replace(/[^a-zA-Z]/g, '').toLowerCase();
  }

  constructor(
    private subjectService: SubjectService,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {
    this.role$ = this.auth
      .getProfile$()
      .pipe(map((profile) => profile?.role ?? null));
  }

  ngOnInit(): void {
    this.auth.getProfile().subscribe();
    this.fetchSubjects();

    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.applySearch();
    });
  }

  // 📦 Fetch all
  fetchSubjects(): void {
    this.loading = true;
    this.subjectService.getAll().subscribe({
      next: (res) => {
        this.subjects = res.data.map((s) => ({ ...s, selected: false }));
        this.applySearch();
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Failed to fetch subjects', err.error?.message || '');
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  getTotalStudents(subject: Subject & { assignedClasses?: Class[] }): number {
    if (!subject.assignedClasses) return 0;

    // Now use the studentsCount property directly:
    return subject.assignedClasses.reduce(
      (sum, cls) => sum + (cls.studentsCount || 0),
      0
    );
  }

  assignClasses(subject: Subject): void {
    // ✅ Navigate to /subjects/{id}/assign or your preferred path
    this.router.navigate(['/dashboard/admin/subjects/', subject.id, 'assign']);
  }

  // 🔍 Search logic
  triggerSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  applySearch(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredSubjects = this.subjects.filter((s) =>
      s.name.toLowerCase().includes(term)
    );
  }

  allowLettersOnly(event: KeyboardEvent): void {
    const inputChar = event.key;

    // Regex: allow only letters A-Z, a-z
    const regex = /^[a-zA-Z]$/;

    if (!regex.test(inputChar)) {
      event.preventDefault();
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applySearch();
  }

  // 🔄 Modal Handling
  openModal(mode: 'add' | 'edit', subject?: Subject): void {
    this.modalMode = mode;
    this.selectedSubject =
      mode === 'edit' && subject ? { ...subject } : { name: '' };
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedSubject = null;
  }

  saveSubject(): void {
    if (!this.selectedSubject?.name?.trim()) {
      this.toast.error('Subject name is required');
      return;
    }

    // Sanitize for backend
    const sanitizedName = this.sanitizeName(this.selectedSubject.name);

    if (!sanitizedName) {
      this.toast.error('Subject name must contain letters.');
      return;
    }

    // Sanitize final value: no symbols, no spaces, all lowercase
    this.selectedSubject.name = this.selectedSubject.name
      .toLowerCase()
      .replace(/[^a-z]/g, '');

    // We keep the original for display, but only send the sanitized
    const payload: Subject = {
      ...this.selectedSubject,
      name: sanitizedName,
    };

    if (this.modalMode === 'add') {
      this.subjectService.create(payload).subscribe({
        next: () => {
          this.toast.success('Subject created successfully!');
          this.fetchSubjects();
          this.closeModal();
        },
        error: (err) => {
          console.error(err);
          this.toast.error(
            'Failed to create subject',
            err.error?.message || ''
          );
        },
      });
    } else if (this.modalMode === 'edit' && this.selectedSubject?.id) {
      this.subjectService.update(this.selectedSubject.id, payload).subscribe({
        next: () => {
          this.toast.success('Subject updated successfully!');
          this.fetchSubjects();
          this.closeModal();
        },
        error: (err) => {
          console.error(err);
          this.toast.error(
            'Failed to update subject',
            err.error?.message || ''
          );
        },
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
      error: (err) => {
        console.error(err);
        this.toast.error('Failed to delete subject', err.error?.message || '');
      },
    });
  }

  // ✅ Future bulk selection logic
  get selectedIds(): string[] {
    return this.subjects.filter((s) => s.selected).map((s) => s.id!);
  }

  get allSelected(): boolean {
    return this.subjects.length > 0 && this.subjects.every((s) => s.selected);
  }

  bulkDeleteSelected(): void {
    const ids = this.selectedIds;
    if (ids.length === 0) return;

    if (!confirm(`Delete ${ids.length} subjects?`)) return;

    let completed = 0;
    ids.forEach((id) => {
      this.subjectService.delete(id).subscribe({
        next: () => {
          this.toast.success('Subject deleted.');
        },
        error: (err) => {
          console.error(err);
          this.toast.error(
            'Failed to delete subject',
            err.error?.message || ''
          );
        },
        complete: () => {
          completed++;
          if (completed === ids.length) {
            this.fetchSubjects();
          }
        },
      });
    });
  }

  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    this.subjects.forEach((s) => (s.selected = checked));
  }
}
