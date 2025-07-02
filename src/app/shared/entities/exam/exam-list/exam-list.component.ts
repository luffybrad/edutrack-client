import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { debounceTime, Observable, Subject as RxSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { ExamService, Exam } from '../../../../services/exam.service';
import { AuthService } from '../../../../auth/auth.service';
import { ToastService } from '../../../utils/toast.service';
import { LoadingOverlayComponent } from '../../../components/loading-overlay/loading-overlay.component';
import { RoleType } from '../../../../auth/auth.routes';

@Component({
  standalone: true,
  selector: 'app-exam-list',
  imports: [CommonModule, FormsModule, RouterModule, LoadingOverlayComponent],
  templateUrl: './exam-list.component.html',
  styleUrl: './exam-list.component.css',
})
export class ExamListComponent implements OnInit {
  exams: (Exam & { selected?: boolean })[] = [];
  filteredExams: (Exam & { selected?: boolean })[] = [];

  selectedExam: Exam | null = null;
  modalMode: 'add' | 'edit' | 'view' | null = null;

  loading = false;

  RoleType = RoleType;
  role$: Observable<RoleType | null>;

  searchTerm = '';
  private searchSubject = new RxSubject<string>();

  constructor(
    private examService: ExamService,
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
    this.fetchExams();
    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.applySearch();
    });
  }

  fetchExams(): void {
    this.loading = true;
    this.examService.getAll().subscribe({
      next: (res) => {
        this.exams = (res.data || []).map((e) => ({ ...e, selected: false }));
        this.applySearch();
      },
      error: (err) => {
        this.toast.apiError('Failed to fetch exams', err);
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
  goToAssignClasses(id: string): void {
    this.router.navigate(['/dashboard/admin/exams', id, 'assign-classes']);
  }

  getTotalStudents(exam: Exam): number {
    return exam.students?.length || 0;
  }

  triggerSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  applySearch(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredExams = this.exams.filter((e) =>
      e.name.toLowerCase().includes(term)
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applySearch();
  }

  openModal(mode: 'add' | 'edit' | 'view', exam?: Exam): void {
    this.modalMode = mode;

    if (mode === 'add') {
      this.selectedExam = { name: '', date: '' };
    } else if (exam) {
      this.selectedExam = {
        ...exam,
        date: mode === 'edit' ? exam.date?.split('T')[0] : exam.date,
      };
    } else {
      this.selectedExam = null;
    }
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedExam = null;
  }

  saveExam(): void {
    if (!this.selectedExam?.name?.trim() || !this.selectedExam?.date?.trim()) {
      this.toast.error('Exam name and date are required');
      return;
    }

    if (this.modalMode === 'add') {
      this.examService.create(this.selectedExam).subscribe({
        next: () => {
          this.toast.success('Exam created successfully!');
          this.fetchExams();
          this.closeModal();
        },
        error: (err) => {
          this.toast.apiError('Failed to create exam', err);
        },
      });
    } else if (this.modalMode === 'edit' && this.selectedExam?.id) {
      this.examService
        .update(this.selectedExam.id, this.selectedExam)
        .subscribe({
          next: () => {
            this.toast.success('Exam updated successfully!');
            this.fetchExams();
            this.closeModal();
          },
          error: (err) => {
            this.toast.apiError('Failed to update exam', err);
          },
        });
    }
  }

  deleteExam(id: string): void {
    if (!confirm('Are you sure you want to delete this exam?')) return;

    this.examService.delete(id).subscribe({
      next: () => {
        this.toast.success('Exam deleted.');
        this.fetchExams();
      },
      error: (err) => {
        this.toast.apiError('Failed to delete exam', err);
      },
    });
  }

  get selectedIds(): string[] {
    return this.exams.filter((e) => e.selected).map((e) => e.id!);
  }

  get allSelected(): boolean {
    return this.exams.length > 0 && this.exams.every((e) => e.selected);
  }

  bulkDeleteSelected(): void {
    const ids = this.selectedIds;
    if (ids.length === 0) return;

    if (!confirm(`Delete ${ids.length} exams?`)) return;

    let completed = 0;
    ids.forEach((id) => {
      this.examService.delete(id).subscribe({
        next: () => {
          this.toast.success('Exam deleted.');
        },
        error: (err: any) => {
          this.toast.apiError('Failed to delete exam', err);
        },
        complete: () => {
          completed++;
          if (completed === ids.length) {
            this.fetchExams();
          }
        },
      });
    });
  }

  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    this.exams.forEach((e) => (e.selected = checked));
  }
}
