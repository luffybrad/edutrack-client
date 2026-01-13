//src/app/shared/entities/exam/exam-list/exam-list.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { debounceTime, Subject, Observable } from 'rxjs';
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
  styleUrls: ['./exam-list.component.css'],
})
export class ExamListComponent implements OnInit {
  exams: (Exam & { selected?: boolean })[] = [];
  filteredExams: (Exam & { selected?: boolean })[] = [];

  selectedExam: Exam | null = null;
  modalMode: 'add' | 'edit' | 'view' | null = null;

  loading = false;
  searchTerm = '';
  private searchSubject = new Subject<string>();

  RoleType = RoleType;
  role$!: Observable<RoleType | null>; // initialized later in ngOnInit

  constructor(
    private examService: ExamService,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    // initialize role$ safely after auth is available
    this.role$ = this.auth.getProfile$().pipe(map((profile) => profile?.role ?? null));

    this.fetchExams();
    this.searchSubject.pipe(debounceTime(300)).subscribe(() => this.applySearch());
  }

  // --- Fetch exams ---
  fetchExams(): void {
    this.loading = true;
    this.examService.getAll().subscribe({
      next: (res) => {
        this.exams = (res.data || []).map((e) => ({ ...e, selected: false }));
        this.applySearch();
      },
      error: (err) => this.toast.apiError('Failed to fetch exams', err),
      complete: () => (this.loading = false),
    });
  }

  // --- Search ---
  triggerSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  applySearch(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredExams = this.exams.filter((e) => e.name.toLowerCase().includes(term));
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applySearch();
  }

  // --- Modals ---
  openModal(mode: 'add' | 'edit' | 'view', exam?: Exam): void {
    this.modalMode = mode;
    if (mode === 'add') {
      this.selectedExam = { name: '', date: '' };
    } else if (exam) {
      this.selectedExam = { ...exam, date: exam.date?.split('T')[0] };
    } else {
      this.selectedExam = null;
    }
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedExam = null;
  }

  // --- CRUD ---
  saveExam(): void {
    if (!this.selectedExam?.name || !this.selectedExam?.date) {
      this.toast.error('Name and date are required');
      return;
    }

    const action =
      this.modalMode === 'add'
        ? this.examService.create(this.selectedExam)
        : this.selectedExam.id
        ? this.examService.update(this.selectedExam.id, this.selectedExam)
        : null;

    action?.subscribe({
      next: () => {
        this.toast.success(
          `Exam ${this.modalMode === 'add' ? 'created' : 'updated'} successfully`
        );
        this.fetchExams();
        this.closeModal();
      },
      error: (err) => this.toast.apiError('Failed to save exam', err),
    });
  }

  deleteExam(id: string): void {
    if (!confirm('Are you sure?')) return;
    this.examService.delete(id).subscribe({
      next: () => {
        this.toast.success('Exam deleted');
        this.fetchExams();
      },
      error: (err) => this.toast.apiError('Failed to delete exam', err),
    });
  }

  bulkDeleteSelected(): void {
    const ids = this.exams.filter((e) => e.selected).map((e) => e.id!);
    if (!ids.length || !confirm(`Delete ${ids.length} exams?`)) return;

    let completed = 0;
    ids.forEach((id) => {
      this.examService.delete(id).subscribe({
        next: () => this.toast.success('Exam deleted'),
        error: (err) => this.toast.apiError('Failed to delete exam', err),
        complete: () => {
          completed++;
          if (completed === ids.length) this.fetchExams();
        },
      });
    });
  }

  // --- Selected Exams ---
get selectedIds(): string[] {
  return this.exams.filter((e) => e.selected).map((e) => e.id!);
}

get allSelected(): boolean {
  return this.exams.length > 0 && this.exams.every((e) => e.selected);
}


  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    this.exams.forEach((e) => (e.selected = checked));
  }
}
