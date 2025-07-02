import { Component, OnInit } from '@angular/core';
import {
  GuardianService,
  Guardian,
} from '../../../../services/guardian.service';
import { ToastService } from '../../../utils/toast.service';
import { AuthService } from '../../../../auth/auth.service';
import { RoleType } from '../../../../auth/auth.routes';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LoadingOverlayComponent } from '../../../components/loading-overlay/loading-overlay.component';
import { map, Observable, Subject, debounceTime } from 'rxjs';
import { NgxMaskDirective } from 'ngx-mask';
import { Student, StudentService } from '../../../../services/student.service';

@Component({
  standalone: true,
  selector: 'app-guardian-list',
  templateUrl: './guardian-list.component.html',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LoadingOverlayComponent,
    NgxMaskDirective,
  ],
})
export class GuardianListComponent implements OnInit {
  guardians: Guardian[] = [];
  filteredGuardians: Guardian[] = [];
  searchTerm = '';
  loading = false;

  modalMode: 'view' | 'edit' | null = null;
  selectedGuardian: Guardian | null = null;

  role$!: Observable<RoleType | null>;
  RoleType = RoleType;

  students: Student[] = [];
  studentSearch = '';
  private searchSubject = new Subject<string>();

  constructor(
    private guardianService: GuardianService,
    private toast: ToastService,
    private authService: AuthService,
    private studentService: StudentService
  ) {}

  ngOnInit(): void {
    this.fetchGuardians();
    this.fetchStudents();

    this.role$ = this.authService
      .getProfile$()
      .pipe(map((p) => p?.role ?? null));

    this.searchSubject
      .pipe(debounceTime(300))
      .subscribe(() => this.applyFilters());
  }

  fetchGuardians(): void {
    this.loading = true;
    this.guardianService.getAll().subscribe({
      next: (res) => {
        this.guardians = res.data;
        this.filteredGuardians = [...this.guardians];
      },
      error: (err) => this.toast.apiError('Failed to load guardians', err),
      complete: () => (this.loading = false),
    });
  }

  fetchStudents(): void {
    this.studentService.getAll().subscribe({
      next: (res) => {
        this.students = res.data;
      },
      error: (err) => this.toast.apiError('Failed to load students', err),
    });
  }

  triggerSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredGuardians = this.guardians.filter(
      (g) =>
        g.name.toLowerCase().includes(term) ||
        g.email.toLowerCase().includes(term) ||
        g.phone.toLowerCase().includes(term)
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredGuardians = [...this.guardians];
  }

  openModal(guardian: Guardian, mode: 'view' | 'edit'): void {
    this.modalMode = mode;
    this.selectedGuardian = {
      ...guardian,
      studentIds: guardian.students?.map((s) => s.id!) ?? [],
    };
    this.studentSearch = '';
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedGuardian = null;
    this.studentSearch = '';
  }

  saveChanges(): void {
    if (!this.selectedGuardian) return;

    this.guardianService
      .update(this.selectedGuardian.id!, {
        ...this.selectedGuardian,
        studentIds: this.selectedGuardian.studentIds ?? [],
      })
      .subscribe({
        next: () => {
          this.toast.success('Guardian updated');
          this.fetchGuardians();
          this.closeModal();
        },
        error: (err) => this.toast.apiError('Failed to update guardian', err),
      });
  }

  deleteGuardian(id: string): void {
    if (!confirm('Are you sure you want to delete this guardian?')) return;

    this.guardianService.delete(id).subscribe({
      next: () => {
        this.toast.success('Guardian deleted');
        this.fetchGuardians();
      },
      error: (err) => this.toast.apiError('Failed to delete guardian', err),
    });
  }

  get filteredStudents(): Student[] {
    const term = this.studentSearch.trim().toLowerCase();
    return this.students.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.admNo.toLowerCase().includes(term)
    );
  }

  toggleStudent(studentId: string): void {
    if (!this.selectedGuardian) return;

    if (!this.selectedGuardian.studentIds) {
      this.selectedGuardian.studentIds = [];
    }

    const index = this.selectedGuardian.studentIds.indexOf(studentId);
    if (index === -1) {
      this.selectedGuardian.studentIds.push(studentId);
    } else {
      this.selectedGuardian.studentIds.splice(index, 1);
    }
  }

  studentListDisplay(guardian: Guardian): string {
    return guardian.students && guardian.students.length > 0
      ? guardian.students.map((s) => `${s.admNo} - ${s.name}`).join(', ')
      : '—';
  }

  getStudentInfo(studentId: string): string {
    const student = this.students.find((s) => s.id === studentId);
    return student ? `${student.admNo} - ${student.name}` : '—';
  }
}
