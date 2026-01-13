import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  ResultService,
  StudentComparison,
  SubjectProgression,
  StudentImprovement
} from '../../../../services/result.service';
import { Observable, forkJoin, map } from 'rxjs';
import { ApiResponse } from '../../../../shared/utils/api-response';

@Component({
  selector: 'app-results-student-analysis',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results-student-analysis.component.html',
  styleUrl: './results-student-analysis.component.css'
})
export class ResultsStudentAnalysisComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private resultService = inject(ResultService);

  studentId!: string;
  comparison$: Observable<StudentComparison[]> | null = null;
  progression$: Observable<SubjectProgression> | null = null;
  improvement$: Observable<StudentImprovement[] | null> | null = null;
  loading = true;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.studentId = params.get('studentId') || '';
      if (this.studentId) {
        this.loadData();
      }
    });
  }

  loadData() {
    this.loading = true;

    this.comparison$ = this.resultService.compareStudent(this.studentId).pipe(
      map((res: ApiResponse<StudentComparison[]>) => res.data)
    );
    this.progression$ = this.resultService.trackSubjectProgression(this.studentId).pipe(
      map((res: ApiResponse<SubjectProgression>) => res.data)
    );
    this.improvement$ = this.resultService.studentImprovement(this.studentId).pipe(
      map((res: ApiResponse<StudentImprovement[] | null>) => res.data)
    );

    forkJoin([
      this.comparison$,
      this.progression$,
      this.improvement$
    ]).subscribe({
      next: () => this.loading = false,
      error: () => this.loading = false
    });
  }

  getSubjects(progression: SubjectProgression): string[] {
    return Object.keys(progression.progression);
  }

  // Helper to safely get score
  getScoreForExam(progression: SubjectProgression, subject: string, examName: string): number | string {
    const data = progression.progression[subject]?.find((e: { examName: string; score: number | null }) => e.examName === examName);
    return data?.score ?? '-';
  }
}
