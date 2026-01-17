// src/app/shared/entities/result/results-dashboard/results-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentResultsSectionComponent } from '../student-results-section/student-results-section.component';
import { SubjectAnalysisSectionComponent } from '../subject-analysis-section/subject-analysis-section.component';
import { ExamResultsSectionComponent } from '../exam-results-section/exam-results-section.component';
import { ExamAnalyticsSectionComponent } from '../exam-analytics-section/exam-analytics-section.component';
import { ReportsSectionComponent } from '../reports-section/reports-section.component';
import { UploadResultsSectionComponent } from '../upload-results-section/upload-results-section.component';
import { ExamService, Exam } from '../../../../services/exam.service';
import { StudentService, Student } from '../../../../services/student.service';
import { ResultService, Result } from '../../../../services/result.service';
import { AuthService } from '../../../../auth/auth.service';
import { RoleType } from '../../../../auth/auth.routes';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-results-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UploadResultsSectionComponent,
    StudentResultsSectionComponent,
    SubjectAnalysisSectionComponent,
    ExamResultsSectionComponent,
    ExamAnalyticsSectionComponent,
    ReportsSectionComponent,
  ],
  templateUrl: './results-dashboard.component.html',
})
export class ResultsDashboardComponent implements OnInit {
  exams: Exam[] = [];
  students: Student[] = [];
  subjects: string[] = [];
  classes: string[] = [];

  selectedExamId?: string;
  selectedStudentId?: string;
  selectedSubject?: string;
  selectedClassId?: string;

  role$!: Observable<RoleType | null>;
  RoleType = RoleType;

  constructor(
    private examService: ExamService,
    private studentService: StudentService,
    private resultService: ResultService,
    private authService: AuthService,
  ) {
    this.role$ = this.authService
      .getProfile$()
      .pipe(map((p) => p?.role ?? null));
  }

  ngOnInit() {
    this.loadExams();
    this.loadStudents();
  }

  loadExams() {
    this.examService.getAll().subscribe((res) => {
      this.exams = res.data || [];
    });
  }

  loadStudents() {
    this.studentService.getAll().subscribe((res) => {
      this.students = res.data || [];
    });
  }

  onExamChange() {
    if (!this.selectedExamId) return;

    this.selectedSubject = undefined;
    this.selectedClassId = undefined;

    // Fetch results for this exam to populate subjects and classes dynamically
    this.resultService.getByExam(this.selectedExamId).subscribe((res) => {
      const results: Result[] = res.data?.results || [];

      // Populate unique subjects
      const subjectSet = new Set<string>();
      results.forEach((r) =>
        Object.keys(r.subjectScores).forEach((s) => subjectSet.add(s)),
      );
      this.subjects = Array.from(subjectSet).sort();

      // Populate unique classes
      const classSet = new Set<string>();
      results.forEach((r) => {
        if (r.student?.class) {
          if (typeof r.student.class === 'object') {
            const cls = r.student.class as any;
            if (cls.form && cls.stream) {
              classSet.add(`Form ${cls.form}${cls.stream}`);
            } else {
              classSet.add(cls.name || cls.id || 'Unknown Class');
            }
          } else {
            classSet.add(r.student.class as string);
          }
        }
      });
      this.classes = Array.from(classSet).sort();
    });
  }

  onUpload() {
    // Refresh exams, students, and reset filters
    this.loadExams();
    this.loadStudents();
    this.selectedExamId = undefined;
    this.selectedStudentId = undefined;
    this.selectedSubject = undefined;
    this.selectedClassId = undefined;
  }

  // Add these methods to your existing ResultsDashboardComponent class

  // Helper to count active filters
  getActiveFilterCount(): number {
    let count = 0;
    if (this.selectedExamId) count++;
    if (this.selectedStudentId) count++;
    if (this.selectedSubject) count++;
    if (this.selectedClassId) count++;
    return count;
  }

  // Clear all filters
  clearFilters(): void {
    this.selectedExamId = undefined;
    this.selectedStudentId = undefined;
    this.selectedSubject = undefined;
    this.selectedClassId = undefined;
  }

  // Current date/time for footer
  currentDateTime = new Date();
}
