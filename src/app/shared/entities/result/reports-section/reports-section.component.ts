// src/app/shared/entities/result/reports-section/reports-section.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResultService } from '../../../../services/result.service';
import { ExamService } from '../../../../services/exam.service';
import { StudentService } from '../../../../services/student.service';
import { ClassService, Class } from '../../../../services/class.service';
import { SubjectService } from '../../../../services/subject.service';
import { AuthService } from '../../../../auth/auth.service';
import { RoleType } from '../../../../auth/auth.routes';
import { Observable, map } from 'rxjs';
import { Exam } from '../../../../services/exam.service';
import { Student } from '../../../../services/student.service';

@Component({
  selector: 'app-reports-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports-section.component.html',
})
export class ReportsSectionComponent implements OnInit {
  @Input() studentId?: string;
  @Input() examId?: string;
  @Input() selectedSubject?: string;
  @Input() selectedClassId?: string;

  guardianId: string | null = null;
  teacherClassId: string | null = null;
  filteredStudents: Student[] = [];

  RoleType = RoleType;
  role$!: Observable<RoleType | null>;

  // Additional data for better UX
  studentName?: string;
  examName?: string;
  className?: string;
  subjectName?: string;

  // State management
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Bulk operations
  bulkExamIds: string[] = [];
  selectedExamIds: string[] = [];

  // Add these new properties for filtering
  exams: Exam[] = [];
  students: Student[] = [];
  subjects: string[] = [];
  selectedStudentId?: string;
  classes: Class[] = [];

  selectedExamId: string | undefined;

  constructor(
    private resultService: ResultService,
    private examService: ExamService,
    private studentService: StudentService,
    private classService: ClassService,
    private subjectService: SubjectService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.authService.getProfile().subscribe();
    this.role$ = this.authService
      .getProfile$()
      .pipe(map((p) => p?.role ?? null));

    // Get teacher's classId from profile
    this.authService.getProfile$().subscribe((profile) => {
      this.teacherClassId = profile?.classId || null;
      // Get guardian ID if user is a guardian
      if (profile?.role === RoleType.Guardian) {
        this.guardianId = profile.id;
      }

      // Load data after getting profile
      this.loadAllData();
    });

    this.loadAdditionalData();
    this.loadAvailableExams();
  }

  ngOnChanges() {
    this.loadAdditionalData();
  }

  private loadAllData() {
    this.loadExams();
    this.loadStudents();
    this.loadClasses();
    this.loadSubjects();
  }

  private loadExams() {
    this.examService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.exams = response.data;

          this.bulkExamIds = this.exams.map((exam) => exam.id!).filter(Boolean);
        }
      },
      error: (error) => {
        console.error('Error loading exams:', error);
      },
    });
  }

  private loadStudents() {
    this.studentService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          let students = response.data;

          // Filter students by teacher's class
          if (this.teacherClassId) {
            students = students.filter(
              (s) =>
                s.class?.id === this.teacherClassId ||
                s.classId === this.teacherClassId,
            );
          }

          // Filter students by guardian ID (for guardians)
          if (this.guardianId) {
            students = students.filter((s) => s.guardianId === this.guardianId);
          }

          this.students = students.map((s) => ({
            ...s,
          }));
          this.filteredStudents = [...this.students]; // Keep a copy if needed
        }
      },
      error: (error) => {
        console.error('Error loading students:', error);
      },
    });
  }

  private loadClasses() {
    this.classService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          let allClasses = response.data;

          // Filter classes for teachers
          if (this.teacherClassId) {
            allClasses = allClasses.filter(
              (cls) => cls.id === this.teacherClassId,
            );
          }

          this.classes = allClasses;
        }
      },
      error: (error) => {
        console.error('Error loading classes:', error);
      },
    });
  }

  private loadSubjects() {
    this.subjectService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Assuming subjects have a 'name' property
          this.subjects = response.data.map((sub) => sub.name);
        }
      },
      error: (error) => {
        console.error('Error loading subjects:', error);
      },
    });
  }

  onStudentChange() {
    this.studentId = this.selectedStudentId;

    // Also update selected class based on student's class
    if (this.selectedStudentId && this.students.length > 0) {
      const selectedStudent = this.students.find(
        (s) => s.id === this.selectedStudentId,
      );
      if (selectedStudent?.class) {
        if (typeof selectedStudent.class === 'object') {
          const cls = selectedStudent.class as Class;
          // Set to the class ID, not a formatted string
          this.selectedClassId = cls.id; // Changed from `${cls.form}${cls.stream}`
        }
      }
    }

    this.loadAdditionalData();
  }

  onClassChange() {
    this.loadAdditionalData();
  }

  onSubjectChange() {
    this.loadAdditionalData();
  }

  // Helper method to format class name
  formatClassName(cls: Class): string {
    return `Form ${cls.form} ${cls.stream} (${cls.year})`;
  }

  // Add method to clear all filters
  clearFilters() {
    this.examId = undefined;
    this.selectedExamId = undefined;
    this.studentId = undefined;
    this.selectedStudentId = undefined;
    this.selectedClassId = undefined;
    this.selectedSubject = undefined;
    this.loadAdditionalData();
  }

  private loadAdditionalData() {
    if (this.studentId) {
      this.loadStudentDetails();
    }
    if (this.examId) {
      this.loadExamDetails();
    }
    if (this.selectedClassId) {
      this.loadClassDetails();
    }
    if (this.selectedSubject) {
      this.loadSubjectDetails();
    }
  }

  private loadStudentDetails() {
    if (!this.studentId) return;

    this.studentService.getById(this.studentId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.studentName = response.data.name;
        }
      },
      error: () => {
        this.studentName = undefined;
      },
    });
  }

  private loadClassDetails() {
    if (!this.selectedClassId) return;

    // Find the class from our classes array
    const foundClass = this.classes.find(
      (cls) => cls.id === this.selectedClassId,
    );

    if (foundClass) {
      this.className = this.formatClassName(foundClass); // Use helper
    } else {
      // Fallback: try to fetch from API
      this.classService.getById(this.selectedClassId).subscribe({
        next: (classResponse) => {
          if (classResponse.success && classResponse.data) {
            const cls = classResponse.data;
            this.className = this.formatClassName(cls); // Use helper
          }
        },
        error: () => {
          this.className = undefined;
        },
      });
    }
  }

  private loadExamDetails() {
    if (!this.examId) return;

    this.examService.getById(this.examId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.examName = response.data.name;
        }
      },
      error: () => {
        this.examName = undefined;
      },
    });
  }

  // Add this method to calculate active filters
  getActiveFilterCount(): number {
    let count = 0;
    if (this.studentId) count++;
    if (this.examId) count++;
    if (this.selectedClassId) count++;
    if (this.selectedSubject) count++;
    return count;
  }

  // Add this method to clear all filters
  clearAllFilters(): void {
    this.clearFilters?.();
    // Reset local properties if needed
    this.studentId = undefined;
    this.examId = undefined;
    this.selectedClassId = undefined;
    this.selectedSubject = undefined;
  }

  onExamChange() {
    this.examId = this.selectedExamId;

    if (!this.selectedExamId) {
      this.loadAdditionalData();
      return;
    }

    this.selectedSubject = undefined;
    this.selectedClassId = undefined;

    this.resultService.getByExam(this.selectedExamId).subscribe((res) => {
      const results: any[] = res.data?.results || [];

      // Populate unique subjects
      const subjectSet = new Set<string>();
      results.forEach((r) =>
        Object.keys(r.subjectScores || {}).forEach((s) => subjectSet.add(s)),
      );
      this.subjects = Array.from(subjectSet).sort();

      // Create a Set to track unique class IDs
      const uniqueClassIds = new Set<string>();
      const tempClasses: Class[] = [];

      results.forEach((r) => {
        if (r.student?.class && typeof r.student.class === 'object') {
          const cls = r.student.class as any;

          // Check if we already have this class
          if (cls.id && !uniqueClassIds.has(cls.id)) {
            uniqueClassIds.add(cls.id);

            // If teacher is logged in, only add their class
            if (this.teacherClassId) {
              if (cls.id === this.teacherClassId) {
                tempClasses.push({
                  id: cls.id,
                  form: cls.form,
                  stream: cls.stream,
                  year: cls.year,
                  studentsCount: cls.studentsCount || 0,
                  // Add optional properties if needed
                  teacherId: cls.teacherId,
                  createdAt: cls.createdAt,
                  updatedAt: cls.updatedAt,
                });
              }
            } else {
              // Admin or guardian - add all classes
              tempClasses.push({
                id: cls.id,
                form: cls.form,
                stream: cls.stream,
                year: cls.year,
                studentsCount: cls.studentsCount || 0,
                teacherId: cls.teacherId,
                createdAt: cls.createdAt,
                updatedAt: cls.updatedAt,
              });
            }
          }
        }
      });

      this.classes = tempClasses;
      this.loadAdditionalData();
    });
  }

  private loadSubjectDetails() {
    if (!this.selectedSubject) return;

    this.subjectService.getById(this.selectedSubject).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.subjectName = response.data.name;
        }
      },
      error: () => {
        this.subjectName = undefined;
      },
    });
  }

  private loadAvailableExams() {
    this.examService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.bulkExamIds = response.data
            .map((exam) => exam.id!)
            .filter(Boolean);
        }
      },
    });
  }

  // PDF Download Methods
  downloadStudentPDF() {
    if (!this.studentId) return;

    this.loading = true;
    this.errorMessage = '';

    this.resultService.downloadStudentReport(
      this.studentId,
      this.studentName,
      (isLoading) => {
        this.loading = isLoading;
        if (!isLoading) {
          this.successMessage = 'Student report downloaded successfully!';
          setTimeout(() => (this.successMessage = ''), 3000);
        }
      },
    );
  }

  downloadExamSummary() {
    if (!this.examId) return;

    this.loading = true;
    this.errorMessage = '';

    this.resultService.downloadExamSummary(
      this.examId,
      this.examName,
      (isLoading) => {
        this.loading = isLoading;
        if (!isLoading) {
          this.successMessage = 'Exam summary downloaded successfully!';
          setTimeout(() => (this.successMessage = ''), 3000);
        }
      },
    );
  }

  downloadSubjectAnalysis() {
    if (!this.examId) return;

    this.loading = true;
    this.errorMessage = '';

    this.resultService.downloadSubjectAnalysis(
      this.examId,
      this.examName,
      (isLoading) => {
        this.loading = isLoading;
        if (!isLoading) {
          this.successMessage = 'Subject analysis downloaded successfully!';
          setTimeout(() => (this.successMessage = ''), 3000);
        }
      },
    );
  }

  downloadClassPerformance() {
    if (!this.examId) return;

    this.loading = true;
    this.errorMessage = '';

    // Find the selected class to get its details
    const selectedClass = this.classes.find(
      (c) => c.id === this.selectedClassId,
    );
    const className = selectedClass
      ? this.formatClassName(selectedClass) // Use helper
      : undefined;

    this.resultService.downloadClassPerformance(
      this.examId,
      this.selectedClassId,
      this.examName,
      className,
      (isLoading) => {
        this.loading = isLoading;
        if (!isLoading) {
          this.successMessage = this.selectedClassId
            ? 'Class performance report downloaded successfully!'
            : 'Classes comparison report downloaded successfully!';
          setTimeout(() => (this.successMessage = ''), 3000);
        }
      },
    );
  }

  downloadComprehensiveReport() {
    if (!this.examId) return;

    this.loading = true;
    this.errorMessage = '';

    this.resultService.downloadComprehensiveReport(
      this.examId,
      this.examName,
      (isLoading) => {
        this.loading = isLoading;
        if (!isLoading) {
          this.successMessage = 'Comprehensive report downloaded successfully!';
          setTimeout(() => (this.successMessage = ''), 3000);
        }
      },
    );
  }

  // Bulk operations
  toggleExamSelection(examId: string) {
    const index = this.selectedExamIds.indexOf(examId);
    if (index > -1) {
      this.selectedExamIds.splice(index, 1);
    } else {
      this.selectedExamIds.push(examId);
    }
  }

  downloadBulkReports() {
    if (this.selectedExamIds.length === 0) {
      this.errorMessage = 'Please select at least one exam';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.resultService
      .generateBulkExamReportsPDF(this.selectedExamIds)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.successMessage = `${response.data.count} reports ready for download!`;

            // Download each report individually
            response.data.reports.forEach((report: any) => {
              this.resultService
                .generateComprehensivePerformancePDF(report.examId)
                .subscribe((blob) => {
                  this.resultService.downloadPDF(blob, report.filename);
                });
            });

            setTimeout(() => (this.successMessage = ''), 5000);
          }
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to generate bulk reports';
          this.loading = false;
          console.error('Bulk reports error:', error);
        },
      });
  }

  downloadCombinedReport() {
    if (this.selectedExamIds.length === 0) {
      this.errorMessage = 'Please select at least one exam';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.resultService
      .generateCombinedExamReportsPDF(this.selectedExamIds)
      .subscribe({
        next: (blob) => {
          const filename = `combined-exam-reports-${new Date().getTime()}.pdf`;
          this.resultService.downloadPDF(blob, filename);
          this.successMessage = 'Combined report downloaded successfully!';
          this.loading = false;
          setTimeout(() => (this.successMessage = ''), 3000);
        },
        error: (error) => {
          this.errorMessage = 'Failed to generate combined report';
          this.loading = false;
          console.error('Combined report error:', error);
        },
      });
  }

  selectAllExams() {
    this.selectedExamIds = [...this.bulkExamIds];
  }

  clearAllExams() {
    this.selectedExamIds = [];
  }

  // Utility methods
  getSelectedExamsCount(): number {
    return this.selectedExamIds.length;
  }

  isAllSelected(): boolean {
    return (
      this.selectedExamIds.length === this.bulkExamIds.length &&
      this.bulkExamIds.length > 0
    );
  }

  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // In your component class, add this method to get exam name by ID
  getExamName(examId: string): string {
    const exam = this.exams.find((e) => e.id === examId);
    return exam ? exam.name : examId; // Fallback to ID if not found
  }
}
