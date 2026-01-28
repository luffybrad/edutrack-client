import { Component, OnInit } from '@angular/core';
import {
  TimetableService,
  Timetable,
  ClassScheduleData,
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

  isSelectingTimetable = false;
  allTimetables: Timetable[] = [];
  selectedTimetableId: string | null = null;

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
    this.loadAllTimetables();
  }

  private loadClasses() {
    this.classService.getAll().subscribe({
      next: (res) => {
        let classes = res.data || [];

        // Filter classes by teacher's class
        if (this.teacherClassId) {
          classes = classes.filter((cls) => cls.id === this.teacherClassId);
        }

        this.classes = classes;

        // Check timetable statuses for each class
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

    // This needs to be rewritten - we need to find a timetable that contains this class
    // First get all timetables
    this.timetableService.getAllTimetables().subscribe({
      next: (res) => {
        const timetables = res.data || [];
        // Find a timetable that has this class in its classSchedules
        const timetableWithClass = timetables.find(
          (t) => t.classSchedules && t.classSchedules[classId],
        );

        if (timetableWithClass) {
          this.selectedTimetable = timetableWithClass;
        } else {
          this.selectedTimetable = null;
          this.error = 'No timetable found for this class';
        }
        this.loading = false;
      },
      error: (err) => {
        this.selectedTimetable = null;
        this.error = 'Failed to fetch timetable';
        this.loading = false;
      },
    });
  }

  private checkAllTimetableStatuses(): void {
    // First get all timetables
    this.timetableService.getAllTimetables().subscribe({
      next: (res) => {
        const allTimetables = res.data || [];

        // Reset statuses
        this.timetableStatuses.clear();

        // Check each class against all timetables
        this.classes.forEach((cls) => {
          if (cls.id) {
            const hasTimetable = allTimetables.some(
              (t) => t.classSchedules && t.classSchedules[cls.id!],
            );
            this.timetableStatuses.set(cls.id!, hasTimetable);
          }
        });
      },
      error: (err) => {
        console.error('Failed to check timetable statuses:', err);
      },
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
    const selectElement = event.target as HTMLSelectElement;
    const classId = selectElement.value;

    if (!classId) {
      this.selectedClassId = null;
      this.selectedTimetable = null;
      return;
    }

    this.selectedClassId = classId;
    this.loading = true;
    this.error = null;

    // Find timetable containing this class
    this.timetableService.getAllTimetables().subscribe({
      next: (res) => {
        const timetables = res.data || [];
        const timetableWithClass = timetables.find(
          (t) => t.classSchedules && t.classSchedules[classId],
        );

        if (timetableWithClass) {
          this.selectedTimetable = timetableWithClass;
        } else {
          this.selectedTimetable = null;
          this.error = 'No timetable found for this class';
        }
        this.loading = false;
      },
      error: (err) => {
        this.selectedTimetable = null;
        this.error = 'Failed to fetch timetable';
        this.loading = false;
      },
    });
  }
  // Safe getter for lessons
  getLessons(day: string): string[] {
    if (
      !this.selectedTimetable ||
      !this.selectedClassId ||
      !this.selectedTimetable.classSchedules
    )
      return [];

    const classSchedule =
      this.selectedTimetable.classSchedules[this.selectedClassId];
    if (!classSchedule) return [];

    const key = day.toUpperCase();
    return classSchedule.schedule[key] || [];
  }

  deleteTimetable() {
    if (!this.selectedTimetable || !this.selectedTimetable.name) return;
    if (!confirm('Are you sure you want to delete this timetable?')) return;

    this.loading = true;
    this.error = null;

    // Use delete by name instead of by class
    this.timetableService
      .deleteTimetableByName(this.selectedTimetable.name)
      .subscribe({
        next: () => {
          this.selectedTimetable = null;
          this.loading = false;
          this.toast.success('Timetable deleted successfully!');
          // Refresh the list
          this.loadClasses();
          this.loadAllTimetables();
        },
        error: () => {
          this.error = 'Failed to delete timetable';
          this.loading = false;
        },
      });
  }

  downloadPDF() {
    if (
      !this.selectedTimetable ||
      !this.selectedClassId ||
      !this.selectedTimetable.name
    )
      return;

    this.loading = true;
    this.error = null;

    // Use new download method with timetable name and class ID
    this.timetableService
      .downloadClassTimetablePDF(
        this.selectedTimetable.name,
        this.selectedClassId,
      )
      .subscribe({
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
    let count = 0;
    this.timetableStatuses.forEach((hasTimetable) => {
      if (hasTimetable) count++;
    });
    return count;
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

  hasTimetableForSelectedClass(): boolean {
    if (
      !this.selectedTimetable ||
      !this.selectedClassId ||
      !this.selectedTimetable.classSchedules
    ) {
      return false;
    }
    return !!this.selectedTimetable.classSchedules[this.selectedClassId];
  }

  get currentClassSchedule(): ClassScheduleData | null {
    if (
      !this.selectedTimetable ||
      !this.selectedClassId ||
      !this.selectedTimetable.classSchedules
    ) {
      return null;
    }
    return this.selectedTimetable.classSchedules[this.selectedClassId] || null;
  }

  getSelectedTimetableName(): string {
    return this.selectedTimetable?.name || '--';
  }

  getTimetableDescription(): string {
    return this.selectedTimetable?.description || 'No description';
  }

  getTimetableCreatedDate(): string {
    if (!this.selectedTimetable?.createdAt) return '--';
    return new Date(this.selectedTimetable.createdAt).toLocaleDateString();
  }

  isTimetableActive(): boolean {
    return this.selectedTimetable?.isActive || false;
  }

  setAsActiveTimetable() {
    if (!this.selectedTimetable) return;

    this.loading = true;
    this.timetableService
      .setActiveTimetable(this.selectedTimetable.id)
      .subscribe({
        next: () => {
          this.loading = false;
          this.toast.success('Timetable set as active successfully!');
          // Refresh to show updated status
          this.loadClasses();
        },
        error: (err) => {
          this.loading = false;
          this.toast.apiError('Failed to set timetable as active', err);
        },
      });
  }

  downloadCompleteTimetablePDF() {
    if (!this.selectedTimetable?.name) return;

    this.loading = true;
    this.error = null;

    this.timetableService
      .downloadCompleteTimetablePDF(this.selectedTimetable.name)
      .subscribe({
        next: (blob: Blob) => {
          this.loading = false;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `complete-timetable-${this.selectedTimetable?.name}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Failed to download complete PDF';
          console.error(err);
        },
      });
  }

  loadAllTimetables() {
    this.timetableService.getAllTimetables().subscribe({
      next: (res) => {
        this.allTimetables = res.data || [];

        // Auto-select the active timetable if available
        const activeTimetable = this.allTimetables.find((t) => t.isActive);
        if (activeTimetable) {
          this.selectedTimetableId = activeTimetable.id;
          this.selectedTimetable = activeTimetable;
        }
      },
      error: (err) => {
        console.error('Failed to load timetables:', err);
      },
    });
  }

  selectTimetableById(timetableId: string) {
    this.timetableService.getTimetableById(timetableId).subscribe({
      next: (res) => {
        this.selectedTimetable = res.data;
      },
      error: (err) => {
        this.toast.apiError('Failed to load timetable', err);
      },
    });
  }

  getTotalClassesInTimetable(): number {
    if (!this.selectedTimetable?.classSchedules) return 0;
    return Object.keys(this.selectedTimetable.classSchedules).length;
  }

  getActiveTimetableName(): string {
    const activeTimetable = this.allTimetables.find((t) => t.isActive);
    return activeTimetable?.name || '--';
  }

  getTimetableCount(): number {
    return this.allTimetables.length;
  }

  onTimetableSelect() {
    if (!this.selectedTimetableId) {
      this.selectedTimetable = null;
      this.selectedClassId = null;
      return;
    }

    this.isSelectingTimetable = true;
    this.loading = true;
    this.error = null;

    this.timetableService.getTimetableById(this.selectedTimetableId).subscribe({
      next: (res) => {
        this.selectedTimetable = res.data;

        // If teacher is viewing, auto-select their class if it exists in this timetable
        if (
          this.teacherClassId &&
          this.selectedTimetable?.classSchedules?.[this.teacherClassId]
        ) {
          this.selectedClassId = this.teacherClassId;
        } else {
          // Otherwise, select the first class in the timetable
          const classIds = this.selectedTimetable?.classSchedules
            ? Object.keys(this.selectedTimetable.classSchedules)
            : [];
          this.selectedClassId = classIds.length > 0 ? classIds[0] : null;
        }

        this.loading = false;
        this.isSelectingTimetable = false;
      },
      error: (err) => {
        this.selectedTimetable = null;
        this.selectedClassId = null;
        this.error = 'Failed to load timetable';
        this.loading = false;
        this.isSelectingTimetable = false;
        this.toast.apiError('Failed to load timetable', err);
      },
    });
  }
}
