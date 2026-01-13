import { Component, OnInit } from '@angular/core';
import { TimetableService, Timetable } from '../../../../services/timetable.service';
import { ClassService, Class } from '../../../../services/class.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

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
    private router: Router
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
  const classId = (event.target as HTMLSelectElement).value;
  this.selectedClassId = classId;
  this.selectedTimetable = null;
  this.loading = true;
  this.error = null;

  this.timetableService.getByClass(classId).subscribe({
    next: res => {
      this.selectedTimetable = res.data;
      this.loading = false;
    },
    error: () => {
      this.error = 'No timetable found for this class';
      this.loading = false;
    }
  });
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
        alert('Timetable deleted successfully');
      },
      error: () => {
        this.error = 'Failed to delete timetable';
        this.loading = false;
      }
    });
  }

  

  trackByIndex(index: number) {
    return index;
  }
}
