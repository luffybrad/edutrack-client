import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  TimetableService,
  GenerateTimetableDto,
  Timetable,
  TimetableSchedule,
} from '../../../../services/timetable.service';
import { ClassService, Class } from '../../../../services/class.service';
import { SubjectService, Subject } from '../../../../services/subject.service';
import { ToastService } from '../../../utils/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-timetable-generate',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './timetable-generate.component.html',
  styleUrls: ['./timetable-generate.component.css'],
})
export class TimetableGenerateComponent implements OnInit {
  generateForm: FormGroup;
  classes: Class[] = [];
  subjects: Subject[] = [];
  generatedTimetable: Timetable | null = null;
  loading = false;
  error: string | null = null;
  saving = false;

  readonly weekDays: (keyof TimetableSchedule)[] = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
  ];

  constructor(
    private fb: FormBuilder,
    private timetableService: TimetableService,
    private classService: ClassService,
    private subjectService: SubjectService,
    private toast: ToastService,
    private router: Router
  ) {
    this.generateForm = this.fb.group({
      classId: [''],
      subjectIds: [[]], // array of selected subject IDs
      lessonsPerDay: [5],
    });
  }

  private loadSubjectsByClass(classId: string) {
    this.loading = true;
    this.subjectService.getSubjectsByClass(classId).subscribe({
      next: (res) => {
        this.subjects = res.data;
        const subjectIds = this.subjects.map((s) => s.id!);
        this.generateForm.get('subjectIds')?.setValue(subjectIds);
        this.loading = false;
      },
      error: (err) => {
        this.subjects = [];
        this.loading = false;
        this.error = 'Failed to load subjects for selected class';
        this.toast.apiError('Failed to load subjects', err);
      },
    });
  }

  ngOnInit(): void {
    this.loadClasses();

    // Whenever class selection changes, fetch subjects
    this.generateForm.get('classId')?.valueChanges.subscribe((classId) => {
      if (classId) {
        this.loadSubjectsByClass(classId);
      } else {
        this.subjects = [];
      }
    });
  }

  private loadClasses() {
    this.classService.getAll().subscribe({
      next: (res) => (this.classes = res.data),
      error: () => (this.error = 'Failed to load classes'),
    });
  }

  private loadSubjects() {
    this.subjectService.getAll().subscribe({
      next: (res) => (this.subjects = res.data),
      error: () => (this.error = 'Failed to load subjects'),
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
      next: (res) => {
        this.generatedTimetable = res.data;
        this.loading = false;
        this.toast.success('Timetable generated successfully!');
      },
      error: (err) => {
        this.loading = false;
        this.toast.apiError('Failed to generate timetable', err);
      },
    });
  }

  saveTimetable() {
    if (!this.generatedTimetable) return;

    this.saving = true;

    this.timetableService.save(this.generatedTimetable).subscribe({
      next: (res) => {
        this.toast.success('Timetable saved successfully!');
        this.generatedTimetable = res.data; // update with saved timetable if returned
        this.saving = false;
        this.router.navigate(['/dashboard/admin/timetables']);
      },
      error: (err) => {
        this.toast.apiError('Failed to save timetable', err);
        this.saving = false;
      },
    });
  }

  trackByIndex(index: number): number {
    return index;
  }

  getLessons(day: keyof TimetableSchedule): string[] {
    return this.generatedTimetable?.schedule?.[day] || [];
  }

  getSelectedClassInfo(): { form: string | number; stream: string } {
    const classId = this.generateForm.get('classId')?.value;
    if (!classId) return { form: '--', stream: '' };

    const selectedClass = this.classes.find((c) => c.id === classId);
    return {
      form: selectedClass?.form || '--',
      stream: selectedClass?.stream || '',
    };
  }
}
