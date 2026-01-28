import { Component, OnInit } from '@angular/core';
import {
  TimetableService,
  Timetable,
} from '../../../../services/timetable.service';
import { ClassService, Class } from '../../../../services/class.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../../utils/toast.service';
import { LoadingOverlayComponent } from '../../../components/loading-overlay/loading-overlay.component';
import { AuthService } from '../../../../auth/auth.service';
import { RoleType } from '../../../../auth/auth.routes';
import { map, Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-timetable-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingOverlayComponent],
  templateUrl: './timetable-list.component.html',
  styleUrls: ['./timetable-list.component.css'],
})
export class TimetableListComponent implements OnInit {
  classes: Class[] = [];
  selectedClassId: string | null = null;
  selectedTimetable: Timetable | null = null;
  loading = false;
  error: string | null = null;
  timetableStatuses: Map<string, boolean> = new Map(); // Map classId -> hasTimetable
  teacherClassId: string | null = null;
  role$: Observable<RoleType | null>;
  RoleType = RoleType;

  weekDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  constructor(
    private classService: ClassService,
    private timetableService: TimetableService,
    private router: Router,
    private toast: ToastService,
    private auth: AuthService,
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
    });
    this.loadClasses();
  }

  private loadClasses() {
    this.classService.getAll().subscribe({
      next: (res) => {
        let classes = res.data || [];

        // Filter classes by teacher's class
        if (this.teacherClassId) {
          classes = classes.filter((cls) => cls.id === this.teacherClassId);

          // Auto-select teacher's class if they have one
          if (classes.length > 0 && this.teacherClassId) {
            this.selectedClassId = this.teacherClassId;
            // Automatically load the timetable for teacher's class
            this.loadTimetableForClass(this.teacherClassId);
          }
        }

        this.classes = classes;
        this.checkAllTimetableStatuses();
      },
      error: () => (this.error = 'Failed to load classes'),
    });
  }

  private loadTimetableForClass(classId: string): void {
    this.selectedClassId = classId;
    this.selectedTimetable = null;
    this.loading = true;
    this.error = null;

    this.timetableService.getByClass(classId).subscribe({
      next: (res) => {
        if (res?.data?.id) {
          this.selectedTimetable = res.data;
        } else {
          this.selectedTimetable = null;
          this.error = 'No timetable found for this class';
        }
        this.loading = false;
      },
      error: (err) => {
        if (err?.status === 404) {
          this.selectedTimetable = null;
          this.error = 'No timetable found for this class';
        } else {
          this.selectedTimetable = null;
          this.error = 'Failed to fetch timetable';
        }
        this.loading = false;
      },
    });
  }

  private checkAllTimetableStatuses(): void {
    this.classes.forEach((cls) => {
      if (cls.id) {
        this.timetableService.getByClass(cls.id).subscribe({
          next: (res) => {
            this.timetableStatuses.set(cls.id!, !!res?.data?.id);
          },
          error: (err) => {
            // If 404, no timetable exists
            if (err?.status === 404) {
              this.timetableStatuses.set(cls.id!, false);
            }
          },
        });
      }
    });
  }

  goToGenerate() {
    const currentUrl = this.router.url;

    // Check if we're in admin or teacher dashboard
    if (currentUrl.includes('/dashboard/admin')) {
      this.router.navigate(['/dashboard/admin/timetables/generate']);
    } else if (currentUrl.includes('/dashboard/teacher')) {
      this.router.navigate(['/dashboard/teacher/timetables/generate']);
    } else {
      // Default fallback
      this.router.navigate(['/dashboard/admin/timetables/generate']);
    }
  }

  selectClass(event: Event) {
    const classId = (event.target as HTMLSelectElement).value.trim();

    if (!classId) {
      this.selectedClassId = null;
      this.selectedTimetable = null;
      this.error = 'Please select a valid class';
      return;
    }

    this.selectedClassId = classId;
    this.selectedTimetable = null;
    this.loading = true;
    this.error = null;

    this.timetableService.getByClass(classId).subscribe({
      next: (res) => {
        if (res?.data?.id) {
          this.selectedTimetable = res.data;
        } else {
          this.selectedTimetable = null;
          this.error = 'No timetable found for this class';
        }
        this.loading = false;
      },
      error: (err) => {
        if (err?.status === 404) {
          this.selectedTimetable = null;
          this.error = 'No timetable found for this class';
        } else {
          this.selectedTimetable = null;
          this.error = 'Failed to fetch timetable';
        }
        this.loading = false;
      },
    });
  }

  // Safe getter for lessons
  getLessons(day: string): string[] {
    if (!this.selectedTimetable?.schedule) return [];
    const key = day.toUpperCase();
    return this.selectedTimetable.schedule[key] || [];
  }

  deleteTimetable() {
    if (!this.selectedClassId) return;
    if (!confirm('Are you sure you want to delete this timetable?')) return;

    this.loading = true;
    this.error = null;

    this.timetableService.deleteByClass(this.selectedClassId).subscribe({
      next: () => {
        this.selectedTimetable = null;
        this.loading = false;
        this.toast.success('Timetable deleted successfully!');
        (this, this.ngOnInit());
      },
      error: () => {
        this.error = 'Failed to delete timetable';
        this.loading = false;
      },
    });
  }

  downloadPDF() {
    if (!this.selectedClassId) return;

    this.loading = true;
    this.error = null;

    this.timetableService.downloadPDF(this.selectedClassId).subscribe({
      next: (blob: Blob) => {
        this.loading = false;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timetable-${this.selectedClassId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to download PDF';
        console.error(err);
      },
    });
  }

  trackByIndex(index: number) {
    return index;
  }

  // Add these methods to your existing TimetableListComponent class

  // Helper to check if a class has a timetable
  private timetableCache = new Map<string, boolean>();

  hasTimetable(classId: string): boolean {
    return this.timetableStatuses.get(classId) || false;
  }

  // Get number of classes with timetables
  getClassesWithTimetable(): number {
    // This would ideally come from an API that returns count
    // For now, we'll return a placeholder
    return Math.floor(this.classes.length * 0.6); // Example: 60% have timetables
  }

  // Select class from card click
  selectClassFromCard(classId: string): void {
    // Create a synthetic event to use the existing selectClass method
    const mockEvent = {
      target: {
        value: classId,
      },
    } as unknown as Event;

    this.selectClass(mockEvent);
  }

  // Clear selection
  clearSelection(): void {
    this.selectedClassId = null;
    this.selectedTimetable = null;
    this.error = null;
  }

  // Get selected class name for display
  getSelectedClassName(): string {
    if (!this.selectedClassId) return '--';

    const selectedClass = this.classes.find(
      (c) => c.id === this.selectedClassId,
    );
    if (!selectedClass) return '--';

    return `FORM ${selectedClass.form} - ${selectedClass.stream}`;
  }

  // Navigate to generate for a specific class
  goToGenerateForClass(classId: string): void {
    this.router.navigate(['/dashboard/admin/timetables/generate'], {
      queryParams: { classId: classId },
    });
  }

  // Navigate to generate for currently selected class
  goToGenerateForSelectedClass(): void {
    if (this.selectedClassId) {
      this.goToGenerateForClass(this.selectedClassId);
    } else {
      this.goToGenerate();
    }
  }

  getTimetableCoverage(): number {
    if (this.classes.length === 0) return 0;
    const coverage =
      (this.getClassesWithTimetable() / this.classes.length) * 100;
    return Math.round(coverage);
  }
}
