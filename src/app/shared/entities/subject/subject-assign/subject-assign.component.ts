import { Component, OnInit } from '@angular/core';
import { SubjectService, Subject } from '../../../../services/subject.service';
import { StudentService, Student } from '../../../../services/student.service';
import { ClassService, Class } from '../../../../services/class.service';
import { ToastService } from '../../../utils/toast.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingOverlayComponent } from '../../../components/loading-overlay/loading-overlay.component';

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

  constructor(
    private subjectService: SubjectService,
    private studentService: StudentService,
    private classService: ClassService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const subjectId = this.route.snapshot.paramMap.get('id');
    if (!subjectId) {
      this.toast.error('No subject ID provided.');
      return;
    }

    this.loading = true;

    Promise.all([
      this.subjectService.getById(subjectId).toPromise(),
      this.classService.getAll().toPromise(),
      this.studentService.getAll().toPromise(),
    ])
      .then(([subjectRes, classRes, studentRes]) => {
        this.subject = subjectRes!.data;
        this.classes = classRes!.data;
        this.students = studentRes!.data;

        // Track assigned students
        this.assignedStudentIds = new Set(
          (this.subject.students ?? [])
            .map((s) => s.id)
            .filter((id): id is string => !!id)
        );
      })
      .catch((err) => this.toast.apiError('Failed to load data', err))
      .finally(() => (this.loading = false));
  }

  /** Students in a class */
  // Make classId access safe everywhere
  getStudentsForClass(classId?: string): Student[] {
    return classId ? this.students.filter((s) => s.classId === classId) : [];
  }

  // In your component class
  navigateToSubjects(): void {
    this.router.navigate(['/dashboard/admin/subjects']);
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
    this.subjectService
      .updateSubjectStudents(
        this.subject.id,
        Array.from(this.assignedStudentIds)
      )
      .subscribe({
        next: () => {
          this.toast.success('Subject students updated successfully.');
          this.router.navigate(['/dashboard/admin/subjects']);
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
