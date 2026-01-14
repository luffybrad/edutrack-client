// src/app/shared/entities/result/reports-section/reports-section.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResultService } from '../../../../services/result.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reports-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports-section.component.html',
})
export class ReportsSectionComponent {
  @Input() studentId?: string;
  @Input() examId?: string;
  @Input() selectedSubject?: string;
  @Input() selectedClassId?: string;

  constructor(private resultService: ResultService) {}

  downloadStudentPDF() {
    if (!this.studentId) return;
    this.resultService.downloadStudentReportPDF(this.studentId);
  }

  downloadExamSummary() {
    if (!this.examId) return;
    this.resultService.downloadExamSummaryExcel(this.examId);
  }

  downloadSubjectAnalysis() {
    if (!this.examId || !this.selectedSubject) return;
    this.resultService.downloadSubjectAnalysisExcel(this.examId);
  }

  downloadClassPerformance() {
    if (!this.examId || !this.selectedClassId) return;
    this.resultService.downloadClassPerformancePDF(this.examId);
  }
}
