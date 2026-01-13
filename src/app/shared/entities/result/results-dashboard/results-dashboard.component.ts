// src/app/shared/entities/result/results-dashboard/results-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { ResultService, ReportFile } from '../../../../services/result.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Exam, ExamService } from '../../../../services/exam.service';
import { ToastService } from '../../../../shared/utils/toast.service';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-results-dashboard',
  standalone: true,
  imports: [CommonModule,  RouterModule],
  templateUrl: './results-dashboard.component.html',
  styleUrl: './results-dashboard.component.css'
})
export class ResultsDashboardComponent implements OnInit {
  exams: Exam[] = [];
  loading = false;
  uploadingExamId: string | null = null;

  constructor(private http: HttpClient, private resultService: ResultService,
  private examService: ExamService,
  private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.fetchExams();
  }

fetchExams(): void {
  this.loading = true;

  this.examService.getAll()
    .pipe(finalize(() => this.loading = false))
    .subscribe({
      next: res => {
        if (res.success && res.data) {
          this.exams = res.data; // ✅ unwrap data from ApiResponse
        } else {
          this.exams = [];
          console.warn('No exams returned from API');
        }
      },
      error: err => {
        this.exams = [];
        console.error('Failed to fetch exams', err);
      }
    });
}


onFileSelected(event: Event, examId?: string): void {
  if (!examId) return;

  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  this.uploadingExamId = examId;

  this.resultService.uploadResults(examId, file).subscribe({
    next: (res) => {
      const { created, updated, deleted } = res.data; // ✅ unwrap data

      this.toast.success(
        `Upload complete: Created ${created}, Updated ${updated}, Deleted ${deleted}`
      );

      this.uploadingExamId = null;
      input.value = ''; // ✅ allow re-upload
    },
    error: (err) => {
      this.toast.apiError('Upload failed', err);
      this.uploadingExamId = null;
      input.value = ''; // ✅ reset on error
    }
  });
}


}

