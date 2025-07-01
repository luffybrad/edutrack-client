import { Component, OnInit } from '@angular/core';
import { SubjectService, Subject } from '../../../../services/subject.service';
import { ClassService, Class } from '../../../../services/class.service';
import { ToastService } from '../../../utils/toast.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { LoadingOverlayComponent } from '../../../components/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-subject-assign',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, LoadingOverlayComponent],
  templateUrl: './subject-assign.component.html',
  styleUrls: ['./subject-assign.component.css'],
})
export class SubjectAssignComponent implements OnInit {
  subject: Subject | null = null;
  classes: (Class & { selected: boolean })[] = [];
  selectedClassIds: string[] = [];
  classSearchTerm = '';
  loading = false;

  constructor(
    private subjectService: SubjectService,
    private classService: ClassService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.toast.error('No subject ID provided.');
      return;
    }

    this.loading = true;

    this.subjectService.getById(id).subscribe({
      next: (res) => {
        this.subject = res.data;
        const assignedClassIds =
          (res.data.assignedClasses
            ?.map((c) => c.id)
            .filter(Boolean) as string[]) || [];
        this.selectedClassIds = assignedClassIds;

        this.classService.getAll().subscribe({
          next: (res) => {
            this.classes = res.data.map((cls) => ({
              ...cls,
              selected: assignedClassIds.includes(cls.id ?? ''),
            }));
          },
          error: () => this.toast.error('Failed to fetch classes'),
          complete: () => (this.loading = false),
        });
      },
      error: (err) => {
        this.toast.error('Failed to load subject.', err.error?.message || '');
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

  backToSubjects() {
    this.router.navigate(['/dashboard/admin/subjects']);
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

  /** ✅ Use the new unified replace logic */
  updateSubjectClasses() {
    if (!this.subject?.id) {
      this.toast.error('No subject selected.');
      return;
    }

    this.loading = true;
    this.subjectService
      .updateClasses({
        subjectId: this.subject.id,
        classIds: this.selectedClassIds,
      })
      .subscribe({
        next: () => {
          this.toast.success('Subject classes updated successfully.');
          this.router.navigate(['/dashboard/admin/subjects']);
        },
        error: (err) => {
          this.toast.error('Failed to update classes.', err.error?.message);
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        },
      });
  }
}
