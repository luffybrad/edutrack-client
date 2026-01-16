//src/app/shared/entities/student/student-add/student-add.component.ts
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ClassService } from '../../../../services/class.service';
import { StudentService } from '../../../../services/student.service';
import { ToastService } from '../../../utils/toast.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoadingOverlayComponent } from '../../../components/loading-overlay/loading-overlay.component';
import { Class } from '../../../../services/class.service';

@Component({
  standalone: true,
  selector: 'app-student-add',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LoadingOverlayComponent,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './student-add.component.html',
})
export class StudentAddComponent implements OnInit {
  form: FormGroup;
  classes: Class[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private classService: ClassService,
    private studentService: StudentService,
    private toast: ToastService,
    private router: Router
  ) {
    this.form = this.fb.group({
      admNo: ['', Validators.required],
      name: ['', Validators.required],
      classId: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses(): void {
    this.classService.getAll().subscribe({
      next: (res) => {
        this.classes = res.data;
      },
      error: (err) => this.toast.apiError('Failed to load classes', err),
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/admin/students']);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.studentService.create(this.form.value).subscribe({
      next: () => {
        this.toast.success('Student added successfully!');
        this.router.navigate(['/dashboard/admin/students']);
      },
      error: (err) => {
        this.toast.apiError('Failed to add student', err);
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }
}
