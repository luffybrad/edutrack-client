import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TimetableService, GenerateTimetableDto, Timetable, TimetableSchedule } from '../../../../services/timetable.service';
import { ClassService, Class } from '../../../../services/class.service';
import { SubjectService, Subject } from '../../../../services/subject.service';

@Component({
  selector: 'app-timetable-generate',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './timetable-generate.component.html',
  styleUrls: ['./timetable-generate.component.css']
})
export class TimetableGenerateComponent implements OnInit {
  generateForm: FormGroup;
  classes: Class[] = [];
  subjects: Subject[] = [];
  generatedTimetable: Timetable | null = null;
  loading = false;
  error: string | null = null;

  readonly weekDays: (keyof TimetableSchedule)[] = [
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'
  ];

  constructor(
    private fb: FormBuilder,
    private timetableService: TimetableService,
    private classService: ClassService,
    private subjectService: SubjectService
  ) {
    this.generateForm = this.fb.group({
      classId: ['', Validators.required],
      subjectIds: [[], Validators.required], // array of selected subject IDs
      lessonsPerDay: [5, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    this.loadClasses();
    this.loadSubjects();

    // DEBUG: log subjectIds whenever selection changes
    this.generateForm.get('subjectIds')?.valueChanges.subscribe(val => {
      console.log('Selected subjects:', val);
    });
  }

  private loadClasses() {
    this.classService.getAll().subscribe({
      next: res => this.classes = res.data,
      error: () => this.error = 'Failed to load classes'
    });
  }

  private loadSubjects() {
    this.subjectService.getAll().subscribe({
      next: res => this.subjects = res.data,
      error: () => this.error = 'Failed to load subjects'
    });
  }

  generateTimetable() {
    console.log('Form value before submit:', this.generateForm.value);

    if (this.generateForm.invalid) return;

    this.loading = true;
    this.error = null;
    this.generatedTimetable = null;

    const dto: GenerateTimetableDto = this.generateForm.value;

    this.timetableService.generate(dto).subscribe({
      next: res => {
        this.generatedTimetable = res.data;
        this.loading = false;
      },
      error: err => {
        this.error = err?.error?.message || 'Failed to generate timetable';
        this.loading = false;
      }
    });
  }

  trackByIndex(index: number): number {
    return index;
  }

  getLessons(day: keyof TimetableSchedule): string[] {
    return this.generatedTimetable?.schedule?.[day] || [];
  }
}
