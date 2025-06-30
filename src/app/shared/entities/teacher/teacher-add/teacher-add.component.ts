import { Component, OnInit } from '@angular/core';
import { TeacherService, Teacher } from '../../../../services/teacher.service';
import { ClassService, Class } from '../../../../services/class.service';
import { ToastService } from '../../../utils/toast.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadingOverlayComponent } from '../../../components/loading-overlay/loading-overlay.component';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

@Component({
  standalone: true,
  selector: 'app-teacher-add',
  templateUrl: './teacher-add.component.html',
  imports: [
    CommonModule,
    FormsModule,
    LoadingOverlayComponent,
    NgxMaskDirective,
  ],
  providers: [provideNgxMask()],
})
export class TeacherAddComponent implements OnInit {
  newTeacher: Teacher = {
    name: '',
    email: '',
    phone: '',
    classId: '',
  };

  classes: Class[] = [];
  loading = false;

  constructor(
    private teacherService: TeacherService,
    private classService: ClassService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchClasses();
  }

  goBack() {
    this.router.navigate(['/dashboard/admin/teachers']);
  }

  fetchClasses() {
    this.classService.getAll().subscribe({
      next: (res) => {
        this.classes = res.data;
      },
      error: () => this.toast.error('Failed to load classes'),
    });
  }

  submit() {
    if (
      !this.newTeacher.name ||
      !this.newTeacher.email ||
      !this.newTeacher.phone ||
      !this.newTeacher.classId
    ) {
      this.toast.error('Please fill in all fields');
      return;
    }

    this.loading = true;

    this.teacherService.create(this.newTeacher).subscribe({
      next: () => {
        this.toast.success('Teacher created');
        this.router.navigate(['/dashboard/admin/teachers']);
      },
      error: (err) => {
        this.toast.error('Failed to create teacher', err.error?.message);
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }
}
