import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ClassService } from '../../../../services/class.service';
import { GuardianService } from '../../../../services/guardian.service';
import { StudentService } from '../../../../services/student.service';
import { ToastService } from '../../../utils/toast.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoadingOverlayComponent } from '../../../components/loading-overlay/loading-overlay.component';
import { Class } from '../../../../services/class.service';
import { Guardian } from '../../../../services/guardian.service';
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
  guardians: Guardian[] = [];
  loading = false;
  guardianSearch = '';
  filteredGuardians: Guardian[] = [];
  selectedGuardianName = '';

  filterGuardians() {
    const term = this.guardianSearch.toLowerCase();
    this.filteredGuardians = this.guardians.filter(
      (g) =>
        g.name.toLowerCase().includes(term) ||
        g.phone.toLowerCase().includes(term)
    );
  }

  selectGuardian(g: Guardian) {
    this.form.patchValue({ guardianId: g.id });
    this.guardianSearch = '';
    this.filteredGuardians = [];
    this.selectedGuardianName = `${g.name} (${g.phone})`;
  }

  constructor(
    private fb: FormBuilder,
    private classService: ClassService,
    private guardianService: GuardianService,
    private studentService: StudentService,
    private toast: ToastService,
    private router: Router
  ) {
    this.form = this.fb.group({
      admNo: ['', Validators.required],
      name: ['', Validators.required],
      classId: ['', Validators.required],
      guardianId: [''],
    });
  }

  ngOnInit(): void {
    this.loadClasses();
    this.loadGuardians();
  }

  loadClasses() {
    this.classService.getAll().subscribe({
      next: (res) => {
        this.classes = res.data;
      },
      error: () => this.toast.error('Failed to load classes'),
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/admin/students']);
  }

  loadGuardians() {
    this.guardianService.getAll().subscribe({
      next: (res) => {
        this.guardians = res.data;
      },
      error: () => this.toast.error('Failed to load guardians'),
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.studentService.create(this.form.value).subscribe({
      next: () => {
        this.toast.success('Student added successfully!');
        this.router.navigate(['/dashboard/admin/students']); // back to list
      },
      error: (err) => {
        this.toast.error('Failed to add student', err.error?.message || '');
      },
      complete: () => (this.loading = false),
    });
  }
}
