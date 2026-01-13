import { Component, OnInit } from '@angular/core';
import { TimetableService, Timetable } from '../../../../services/timetable.service';
import { ClassService, Class } from '../../../../services/class.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../../utils/toast.service';

@Component({
  selector: 'app-timetable-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './timetable-list.component.html',
  styleUrls: ['./timetable-list.component.css']
})
export class TimetableListComponent implements OnInit {
  classes: Class[] = [];
  selectedClassId: string | null = null;
  selectedTimetable: Timetable | null = null;
  loading = false;
  error: string | null = null;

  weekDays = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY'];

  constructor(
    private classService: ClassService,
    private timetableService: TimetableService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadClasses();
  }

  private loadClasses() {
    this.classService.getAll().subscribe({
      next: res => this.classes = res.data,
      error: () => this.error = 'Failed to load classes'
    });
  }

  goToGenerate() {
    this.router.navigate(['/dashboard/admin/timetables/generate']);
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
      next: res => {
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
      }
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
      },
      error: () => {
        this.error = 'Failed to delete timetable';
        this.loading = false;
      }
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
      }
    });
  }

  trackByIndex(index: number) {
    return index;
  }
}
