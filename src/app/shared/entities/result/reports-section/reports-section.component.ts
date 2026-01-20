// src/app/shared/entities/result/reports-section/reports-section.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResultService } from '../../../../services/result.service';
import { ExamService } from '../../../../services/exam.service';
import { StudentService } from '../../../../services/student.service';
import { ClassService } from '../../../../services/class.service';
import { SubjectService } from '../../../../services/subject.service';

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

  // Additional data for better UX
  studentName?: string;
  examName?: string;
  className?: string;
  subjectName?: string;

  // State management
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Preview state
  previewMode = false;
  previewUrl?: string;
  previewFilename = '';

  // Bulk operations
  bulkExamIds: string[] = [];
  selectedExamIds: string[] = [];

  constructor(
    private resultService: ResultService,
    private examService: ExamService,
    private studentService: StudentService,
    private classService: ClassService,
    private subjectService: SubjectService,
  ) {}

  ngOnInit() {
    this.loadAdditionalData();
    this.loadAvailableExams();
  }

  ngOnChanges() {
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

  private loadClassDetails() {
    if (!this.selectedClassId) return;

    this.classService.getById(this.selectedClassId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.className = `${response.data.form}${response.data.stream} (${response.data.year})`;
        }
      },
      error: () => {
        this.className = undefined;
      },
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
    if (!this.examId || !this.selectedClassId) return;

    this.loading = true;
    this.errorMessage = '';

    this.resultService.downloadClassPerformance(
      this.examId,
      this.examName,
      (isLoading) => {
        this.loading = isLoading;
        if (!isLoading) {
          this.successMessage =
            'Class performance report downloaded successfully!';
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

  // Preview Methods
  previewStudentPDF() {
    if (!this.studentId) return;

    this.loading = true;
    this.errorMessage = '';

    this.resultService.generateStudentReportPDF(this.studentId).subscribe({
      next: (blob) => {
        this.createPreview(
          blob,
          `student-report-${this.studentName || this.studentId}.pdf`,
        );
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load PDF preview';
        this.loading = false;
        console.error('Preview error:', error);
      },
    });
  }

  previewExamSummary() {
    if (!this.examId) return;

    this.loading = true;
    this.errorMessage = '';

    this.resultService.generateExamSummaryPDF(this.examId).subscribe({
      next: (blob) => {
        this.createPreview(
          blob,
          `exam-summary-${this.examName || this.examId}.pdf`,
        );
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load PDF preview';
        this.loading = false;
        console.error('Preview error:', error);
      },
    });
  }

  previewSubjectAnalysis() {
    if (!this.examId) return;

    this.loading = true;
    this.errorMessage = '';

    this.resultService.generateSubjectAnalysisPDF(this.examId).subscribe({
      next: (blob) => {
        this.createPreview(
          blob,
          `subject-analysis-${this.examName || this.examId}.pdf`,
        );
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load PDF preview';
        this.loading = false;
        console.error('Preview error:', error);
      },
    });
  }

  previewClassPerformance() {
    if (!this.examId || !this.selectedClassId) return;

    this.loading = true;
    this.errorMessage = '';

    this.resultService.generateClassPerformancePDF(this.examId).subscribe({
      next: (blob) => {
        this.createPreview(
          blob,
          `class-performance-${this.examName || this.examId}.pdf`,
        );
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load PDF preview';
        this.loading = false;
        console.error('Preview error:', error);
      },
    });
  }

  previewComprehensiveReport() {
    if (!this.examId) return;

    this.loading = true;
    this.errorMessage = '';

    this.resultService
      .generateComprehensivePerformancePDF(this.examId)
      .subscribe({
        next: (blob) => {
          this.createPreview(
            blob,
            `comprehensive-report-${this.examName || this.examId}.pdf`,
          );
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load PDF preview';
          this.loading = false;
          console.error('Preview error:', error);
        },
      });
  }

  private createPreview(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    this.previewUrl = url;
    this.previewFilename = filename;
    this.previewMode = true;
  }

  closePreview() {
    if (this.previewUrl) {
      window.URL.revokeObjectURL(this.previewUrl);
    }
    this.previewMode = false;
    this.previewUrl = undefined;
    this.previewFilename = '';
  }

  downloadFromPreview() {
    if (!this.previewUrl || !this.previewFilename) return;

    const link = document.createElement('a');
    link.href = this.previewUrl;
    link.download = this.previewFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.successMessage = 'Report downloaded successfully!';
    setTimeout(() => (this.successMessage = ''), 3000);
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
}
