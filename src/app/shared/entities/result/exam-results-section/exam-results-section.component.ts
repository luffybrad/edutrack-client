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
    private examService: ExamService,
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
      this.resultService.downloadExamSummary(this.selectedExamId);
    }
  }

  downloadClassPerformance() {
    if (this.selectedExamId) {
      this.resultService.downloadClassPerformance(this.selectedExamId);
    }
  }

  getGradeColor(grade: string): string {
    const gradeColors: Record<string, string> = {
      A: 'bg-emerald-100 text-emerald-800',
      B: 'bg-blue-100 text-blue-800',
      C: 'bg-amber-100 text-amber-800',
      D: 'bg-orange-100 text-orange-800',
      E: 'bg-red-100 text-red-800',
      F: 'bg-red-200 text-red-900',
    };
    return gradeColors[grade] || 'bg-gray-100 text-gray-800';
  }

  getSubjectCount(): number {
    return this.results.length > 0
      ? Object.keys(this.results[0].subjectScores).length
      : 0;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
