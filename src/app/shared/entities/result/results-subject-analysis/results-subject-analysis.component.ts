//src/app/shared/entities/result/results-subject-analysis/results-subject-analysis.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ResultService, SubjectAnalysis } from '../../../../services/result.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-results-subject-analysis',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results-subject-analysis.component.html',
})
export class ResultsSubjectAnalysisComponent implements OnInit {
  examId!: string;
  selectedSubject: string | null = null;

  loading = false;
  analysis: SubjectAnalysis | null = null;

  // Ideally fetched from exam setup / subjects service
  subjects: string[] = ['mathematics', 'english', 'physics', 'chemistry'];

  constructor(
    private route: ActivatedRoute,
    private resultService: ResultService
  ) {}

  ngOnInit(): void {
    this.examId = this.route.snapshot.paramMap.get('examId')!;
  }

  loadSubject(subject: string) {
    this.selectedSubject = subject;
    this.loading = true;
    this.analysis = null;

    this.resultService.analyzeSubject(this.examId, subject).subscribe({
      next: res => {
        this.analysis = res.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
