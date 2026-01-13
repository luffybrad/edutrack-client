import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ExamResultsResponse, ExamAnalytics, ResultService } from '../../../../services/result.service';

@Component({
  selector: 'app-results-exam-analysis',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './results-exam-analysis.component.html',
  styleUrl: './results-exam-analysis.component.css'
})
export class ResultsExamAnalysisComponent implements OnInit {
  examId!: string;
  classId: string | null = null;

  loading = false;

  results: ExamResultsResponse | null = null;
  analytics: ExamAnalytics | null = null;

  constructor(
    private route: ActivatedRoute,
    private resultService: ResultService
  ) {}

  ngOnInit(): void {
    this.examId = this.route.snapshot.paramMap.get('examId')!;
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    this.resultService.getByExam(this.examId, this.classId || undefined)
      .subscribe({
        next: res => this.results = res.data,
        complete: () => this.loading = false
      });

    this.resultService.getExamAnalytics(this.examId)
      .subscribe(res => this.analytics = res.data);
  }
}
