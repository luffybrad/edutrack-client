// src/app/shared/entities/result/exam-results-section/exam-results-section.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ResultService,
  ExamResultsResponse,
  Result,
} from '../../../../services/result.service';
import { ExamService, Exam } from '../../../../services/exam.service';

@Component({
  selector: 'app-exam-results-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-results-section.component.html',
})
export class ExamResultsSectionComponent implements OnInit {
  exams: { id: string; name: string }[] = [];
  classes: string[] = []; // e.g., "Form 1-A-2026"

  selectedExamId?: string;
  selectedClassId?: string;

  resultsResponse?: ExamResultsResponse;
  results: Result[] = [];
  loading = false;

  constructor(
    private resultService: ResultService,
    private examService: ExamService
  ) {}

  ngOnInit() {
    this.loadExams();
  }

  loadExams() {
    this.examService.getAll().subscribe((res) => {
      this.exams = (res.data || [])
        .filter((exam) => exam.id)
        .map((exam) => ({ id: exam.id!, name: exam.name }));
    });
  }

  onExamChange() {
    this.loadResults();
  }

  onClassChange() {
    this.loadResults();
  }

  loadResults() {
    if (!this.selectedExamId) return;
    this.loading = true;

    this.resultService
      .getByExam(this.selectedExamId, this.selectedClassId)
      .subscribe((res) => {
        this.resultsResponse = res.data;
        this.results = this.resultsResponse?.results || [];
        this.classes = Object.keys(this.resultsResponse?.classAnalysis || {});
        this.loading = false;
      });
  }

  downloadSummary() {
    if (this.selectedExamId) {
      this.resultService.downloadExamSummaryExcel(this.selectedExamId);
    }
  }

  downloadClassPerformance() {
    if (this.selectedExamId) {
      this.resultService.downloadClassPerformancePDF(this.selectedExamId);
    }
  }
}
