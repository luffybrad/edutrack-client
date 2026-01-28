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
  TeacherInfo,
  ClassScheduleData,
} from '../../../../services/timetable.service';
import { ClassService, Class } from '../../../../services/class.service';
import { SubjectService, Subject } from '../../../../services/subject.service';
import { ToastService } from '../../../utils/toast.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../../auth/auth.service';
import { RoleType } from '../../../../auth/auth.routes';
import { Observable, map } from 'rxjs';

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
  teacherClassId: string | null = null;

  role$: Observable<RoleType | null>;
  RoleType = RoleType;

  // Add these properties
  classTeachers: TeacherInfo[] = [];
  teacherConflicts: any[] = [];
  hasTeacherConflicts = false;
  loadingTeachers = false;

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
    private router: Router,
    private authService: AuthService,
  ) {
    this.role$ = this.authService
      .getProfile$()
      .pipe(map((profile) => profile?.role ?? null));

    this.generateForm = this.fb.group({
      timetableName: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      classId: [''],
      subjectIds: [[]],
      lessonsPerDay: [
        5,
        [Validators.required, Validators.min(1), Validators.max(10)],
      ],
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
    this.authService.getProfile().subscribe();

    // Get teacher's classId from profile
    this.authService.getProfile$().subscribe((profile) => {
      this.teacherClassId = profile?.classId || null;
    });

    this.loadClasses();

    // Update the classId value change subscription
    this.generateForm.get('classId')?.valueChanges.subscribe((classId) => {
      if (classId) {
        this.loadSubjectsByClass(classId);
        this.loadClassTeachers(classId); // Add this line
      } else {
        this.subjects = [];
        this.classTeachers = []; // Add this line
        this.hasTeacherConflicts = false;
      }
    });
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
      },
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

    if (this.generateForm.invalid) {
      // Show specific validation errors
      if (!this.generateForm.get('timetableName')?.valid) {
        this.toast.error('Please enter a timetable name (min 3 characters)');
      }
      if (!this.generateForm.get('lessonsPerDay')?.valid) {
        this.toast.error('Please enter valid lessons per day (1-10)');
      }
      return;
    }

    this.loading = true;
    this.error = null;
    this.generatedTimetable = null;

    const dto: GenerateTimetableDto = {
      timetableName: this.generateForm.get('timetableName')?.value,
      description: this.generateForm.get('description')?.value,
      lessonsPerDay: this.generateForm.get('lessonsPerDay')?.value,
    };

    this.timetableService.generateForAllClasses(dto).subscribe({
      next: (res) => {
        this.generatedTimetable = res.data;
        this.loading = false;
        this.toast.success('Timetable generated successfully for all classes!');
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

    // Change from save() to saveTimetable()
    this.timetableService.saveTimetable(this.generatedTimetable).subscribe({
      next: (res) => {
        this.toast.success('Timetable saved successfully!');
        this.generatedTimetable = res.data;
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
    if (!this.generatedTimetable || !this.generatedTimetable.classSchedules)
      return [];

    // Get the selected class schedule
    const selectedClassId = this.generateForm.get('classId')?.value;
    if (
      !selectedClassId ||
      !this.generatedTimetable.classSchedules[selectedClassId]
    ) {
      return [];
    }

    const classSchedule =
      this.generatedTimetable.classSchedules[selectedClassId];
    return classSchedule.schedule[day] || [];
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

  private loadClassTeachers(classId: string) {
    this.loadingTeachers = true;
    this.timetableService.getClassTeachers(classId).subscribe({
      next: (res) => {
        this.classTeachers = res.data;
        this.loadingTeachers = false;
        // Remove this line since the route doesn't exist
        // this.checkTeacherConflicts(classId);
      },
      error: (err) => {
        this.classTeachers = [];
        this.loadingTeachers = false;
        console.warn('Could not load class teachers:', err);
      },
    });
  }

  hasGeneratedTimetableForSelectedClass(): boolean {
    if (!this.generatedTimetable || !this.generatedTimetable.classSchedules) {
      return false;
    }

    const selectedClassId = this.generateForm.get('classId')?.value;
    if (!selectedClassId) {
      return false;
    }

    return !!this.generatedTimetable.classSchedules[selectedClassId];
  }

  getTotalClasses(): number {
    if (!this.generatedTimetable || !this.generatedTimetable.classSchedules) {
      return 0;
    }
    return Object.keys(this.generatedTimetable.classSchedules).length;
  }
}
