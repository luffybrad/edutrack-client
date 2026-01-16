import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { TeacherService } from '../../../../services/teacher.service';
import { ClassService, Class } from '../../../../services/class.service';
import { ToastService } from '../../../utils/toast.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoadingOverlayComponent } from '../../../components/loading-overlay/loading-overlay.component';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

@Component({
  standalone: true,
  selector: 'app-teacher-add',
  templateUrl: './teacher-add.component.html',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LoadingOverlayComponent,
    NgxMaskDirective,
  ],
  providers: [provideNgxMask()],
})
export class TeacherAddComponent implements OnInit {
  teacherForm: FormGroup;
  classes: Class[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private teacherService: TeacherService,
    private classService: ClassService,
    private toast: ToastService,
    private router: Router
  ) {
    this.teacherForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      classId: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.fetchClasses();
  }

  fetchClasses(): void {
    this.classService.getAll().subscribe({
      next: (res) => {
        this.classes = res.data;
      },
      error: () => this.toast.error('Failed to load classes'),
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/admin/teachers']);
  }

  submit(): void {
    if (this.teacherForm.invalid) {
      this.teacherForm.markAllAsTouched();
      this.toast.error('Please fill in all required fields');
      return;
    }

    this.loading = true;

    this.teacherService.create(this.teacherForm.value).subscribe({
      next: () => {
        this.toast.success('Teacher created successfully!');
        this.router.navigate(['/dashboard/admin/teachers']);
      },
      error: (err) => {
        this.toast.apiError('Failed to create teacher', err);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  getSelectedClass(): Class | null {
    const classId = this.teacherForm.get('classId')?.value;
    return this.classes.find((c) => c.id === classId) || null;
  }
}
