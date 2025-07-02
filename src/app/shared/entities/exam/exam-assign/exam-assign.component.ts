import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

import { ExamService, Exam } from '../../../../services/exam.service';
import { ClassService, Class } from '../../../../services/class.service';
import { ToastService } from '../../../utils/toast.service';
import { LoadingOverlayComponent } from '../../../components/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-exam-assign',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, LoadingOverlayComponent],
  templateUrl: './exam-assign.component.html',
  styleUrls: ['./exam-assign.component.css'],
})
export class ExamAssignComponent implements OnInit {
  exam: Exam | null = null;
  classes: (Class & { selected: boolean })[] = [];
  selectedClassIds: string[] = [];
  classSearchTerm = '';
  loading = false;

  constructor(
    private examService: ExamService,
    private classService: ClassService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.toast.error('No exam ID provided.');
      return;
    }

    this.loading = true;

    this.examService.getById(id).subscribe({
      next: (res) => {
        this.exam = res.data;
        const assignedClassIds =
          (res.data.classes?.map((c) => c.id).filter(Boolean) as string[]) ||
          [];
        this.selectedClassIds = assignedClassIds;

        this.classService.getAll().subscribe({
          next: (res) => {
            this.classes = res.data.map((cls) => ({
              ...cls,
              selected: assignedClassIds.includes(cls.id ?? ''),
            }));
          },
          error: (err) => this.toast.apiError('Failed to fetch classes', err),
          complete: () => (this.loading = false),
        });
      },
      error: (err) => {
        this.toast.apiError('Failed to load exam', err);
        this.loading = false;
      },
    });
  }

  filteredClasses() {
    const term = this.classSearchTerm.trim().toLowerCase();
    if (!term) return this.classes;
    return this.classes.filter((cls) =>
      `${cls.form} ${cls.stream} ${cls.year}`.toLowerCase().includes(term)
    );
  }

  backToExams() {
    this.router.navigate(['/dashboard/admin/exams']);
  }

  toggleClass(classItem: Class & { selected: boolean }, event?: Event) {
    classItem.selected = !classItem.selected;

    if (classItem.selected) {
      if (classItem.id && !this.selectedClassIds.includes(classItem.id)) {
        this.selectedClassIds.push(classItem.id);
      }
    } else {
      this.selectedClassIds = this.selectedClassIds.filter(
        (id) => id !== classItem.id
      );
    }

    if (event) {
      event.stopPropagation();
    }
  }

  updateExamClasses() {
    if (!this.exam?.id) {
      this.toast.error('No exam selected.');
      return;
    }

    this.loading = true;
    this.examService
      .updateClasses({
        examId: this.exam.id,
        classIds: this.selectedClassIds,
      })
      .subscribe({
        next: () => {
          this.toast.success('Exam classes updated successfully.');
          this.router.navigate(['/dashboard/admin/exams']);
        },
        error: (err) => {
          this.toast.apiError('Failed to update exam classes', err);
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        },
      });
  }
}
