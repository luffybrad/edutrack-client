import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResultService } from '../../../../services/result.service';
import { ExamService } from '../../../../services/exam.service';

@Component({
  selector: 'app-upload-results-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload-results-section.component.html',
})
export class UploadResultsSectionComponent implements OnInit {
  exams: { id: string; name: string }[] = [];
  selectedExamId?: string;
  file?: File;

  loading = false;
  successMessage = '';
  errorMessage = '';

  @Output() uploaded = new EventEmitter<void>();

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
        .filter((exam) => exam.id) // ensure id exists
        .map((exam) => ({ id: exam.id!, name: exam.name }));
    });
  }

  onFileSelected(event: any) {
    this.file = event.target.files[0];
  }

  upload() {
    if (!this.selectedExamId || !this.file) return;
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.resultService.uploadResults(this.selectedExamId, this.file).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = `✅ Created: ${res.data.created}, Updated: ${res.data.updated}, Deleted: ${res.data.deleted}`;
        this.uploaded.emit();
        this.file = undefined; // reset file input
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = `❌ ${err.message || 'Upload failed'}`;
      },
    });
  }
}
