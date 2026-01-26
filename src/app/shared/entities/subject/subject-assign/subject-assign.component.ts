import { Component, OnInit } from '@angular/core';
import { SubjectService, Subject } from '../../../../services/subject.service';
import { StudentService, Student } from '../../../../services/student.service';
import { ClassService, Class } from '../../../../services/class.service';
import { ToastService } from '../../../utils/toast.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingOverlayComponent } from '../../../components/loading-overlay/loading-overlay.component';
import { Observable, map } from 'rxjs';
import { AuthService } from '../../../../auth/auth.service';
import { RoleType } from '../../../../auth/auth.routes';

@Component({
  selector: 'app-subject-assign',
  standalone: true,
  imports: [FormsModule, CommonModule, LoadingOverlayComponent],
  templateUrl: './subject-assign.component.html',
})
export class SubjectAssignComponent implements OnInit {
  subject!: Subject;
  classes: Class[] = [];
  students: Student[] = [];
  assignedStudentIds = new Set<string>();
  loading = false;
  RoleType = RoleType;
  role$: Observable<RoleType | null>;
  teacherClassId?: string;

  constructor(
    private subjectService: SubjectService,
    private studentService: StudentService,
    private classService: ClassService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
  ) {
    this.role$ = this.auth.getProfile$().pipe(map((p) => p?.role ?? null));
  }

  ngOnInit(): void {
    const subjectId = this.route.snapshot.paramMap.get('id');
    if (!subjectId) {
      this.toast.error('No subject ID provided.');
      return;
    }

    this.loading = true;

    // Get user role and profile
    this.auth.getProfile$().subscribe((profile) => {
      const role = profile?.role;
      this.teacherClassId = profile?.classId;

      Promise.all([
        this.subjectService.getById(subjectId).toPromise(),
        this.classService.getAll().toPromise(),
        this.studentService.getAll().toPromise(),
      ])
        .then(([subjectRes, classRes, studentRes]) => {
          this.subject = subjectRes!.data;

          // Filter classes if teacher
          if (role === RoleType.Teacher && this.teacherClassId) {
            // Show only the teacher's class
            this.classes = classRes!.data.filter(
              (c) => c.id === this.teacherClassId,
            );
          } else {
            // Admin sees all classes
            this.classes = classRes!.data;
          }

          if (role == RoleType.Teacher && this.teacherClassId) {
            this.students = studentRes!.data.filter(
              (s) => s.classId === this.teacherClassId,
            );
          } else {
            this.students = studentRes!.data;
          }

          // Track assigned students
          let subjectStudents = this.subject.students ?? [];

          // If teacher, filter to only students in their class
          if (role === RoleType.Teacher && this.teacherClassId) {
            subjectStudents = subjectStudents.filter(
              (student) => student.classId === this.teacherClassId,
            );
          }

          this.assignedStudentIds = new Set(
            subjectStudents.map((s) => s.id).filter((id): id is string => !!id),
          );
        })
        .catch((err) => this.toast.apiError('Failed to load data', err))
        .finally(() => (this.loading = false));
    });
  }

  /** Students in a class */
  // Make classId access safe everywhere
  getStudentsForClass(classId?: string): Student[] {
    return classId ? this.students.filter((s) => s.classId === classId) : [];
  }

  // In your component class
  navigateToSubjects(): void {
    const currentUrl = this.router.url;

    if (currentUrl.includes('/dashboard/admin/')) {
      this.router.navigate(['/dashboard/admin/subjects']);
    } else if (currentUrl.includes('/dashboard/teacher/')) {
      this.router.navigate(['/dashboard/teacher/subjects']);
    } else {
      // Default fallback
      this.router.navigate(['/dashboard/admin/subjects']);
    }
  }

  /** Student checkbox state */
  isAssigned(student: Student): boolean {
    return !!student.id && this.assignedStudentIds.has(student.id);
  }

  /** Class checkbox state */
  isClassFullyAssigned(cls: Class): boolean {
    const classStudents = this.getStudentsForClass(cls.id!);
    return (
      classStudents.length > 0 &&
      classStudents.every((s) => !!s.id && this.assignedStudentIds.has(s.id))
    );
  }

  /** Toggle all students in a class */
  toggleClass(cls: Class, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.getStudentsForClass(cls.id!).forEach((student) => {
      if (!student.id) return;
      checked
        ? this.assignedStudentIds.add(student.id)
        : this.assignedStudentIds.delete(student.id);
    });
  }

  /** Toggle single student */
  toggleStudent(student: Student, event: Event): void {
    if (!student.id) return;
    const checked = (event.target as HTMLInputElement).checked;
    checked
      ? this.assignedStudentIds.add(student.id)
      : this.assignedStudentIds.delete(student.id);
  }

  /** Save assignments to backend */
  save(): void {
    if (!this.subject?.id) return;

    this.loading = true;

    // Get ALL current students assigned to the subject
    const allCurrentStudents = this.subject.students ?? [];

    let studentsToSave: string[] = [];

    if (this.teacherClassId) {
      // TEACHER LOGIC:
      // 1. Keep students from OTHER classes (always)
      const studentsFromOtherClasses = allCurrentStudents
        .filter((student) => student.classId !== this.teacherClassId)
        .map((student) => student.id!)
        .filter((id) => !!id);

      // 2. Add ONLY the SELECTED students from teacher's class
      const selectedStudentsFromMyClass = Array.from(this.assignedStudentIds);

      // Combine: other classes + selected from my class
      studentsToSave = [
        ...studentsFromOtherClasses,
        ...selectedStudentsFromMyClass,
      ];
    } else {
      // ADMIN LOGIC: Use all currently selected/assigned students
      studentsToSave = Array.from(this.assignedStudentIds);
    }

    // Remove duplicates just in case
    const uniqueStudentIds = [...new Set(studentsToSave)];

    this.subjectService
      .updateSubjectStudents(this.subject.id, uniqueStudentIds)
      .subscribe({
        next: () => {
          this.toast.success('Subject students updated successfully.');
          // Navigate based on role
          if (this.teacherClassId) {
            this.router.navigate(['/dashboard/teacher/subjects']);
          } else {
            this.router.navigate(['/dashboard/admin/subjects']);
          }
        },
        error: (err) => {
          this.toast.apiError('Failed to update subject students', err);
          this.loading = false;
        },
        complete: () => (this.loading = false),
      });
  }

  /** Total students currently assigned */
  getTotalAssigned(): number {
    return this.assignedStudentIds.size;
  }

  getSelectedStudentsForClass(cls: Class): number {
    const classStudents = this.getStudentsForClass(cls.id!);
    return classStudents.filter((student) => this.isAssigned(student)).length;
  }

  getClassSelectionStatus(cls: Class): string {
    const selected = this.getSelectedStudentsForClass(cls);
    const total = this.getStudentsForClass(cls.id!).length;

    if (selected === 0) return 'None';
    if (selected === total) return 'Fully Assigned';
    return 'Partial';
  }

  getClassSelectionColor(cls: Class): { bg: string; text: string } {
    const selected = this.getSelectedStudentsForClass(cls);

    if (selected > 0) {
      return { bg: 'bg-green-100', text: 'text-green-800' };
    }
    return { bg: 'bg-gray-100', text: 'text-gray-600' };
  }
}
