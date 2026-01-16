import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ClassService } from '../../../../services/class.service';
import { ToastService } from '../../../utils/toast.service';
import { LoadingOverlayComponent } from '../../../components/loading-overlay/loading-overlay.component';

@Component({
  standalone: true,
  selector: 'app-class-add',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    LoadingOverlayComponent,
  ],
  templateUrl: './class-add.component.html',
})
export class ClassAddComponent implements OnInit {
  form: FormGroup;
  loading = false;
  currentYear = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private classService: ClassService,
    private toast: ToastService,
    private router: Router
  ) {
    this.form = this.fb.group({
      form: ['', [Validators.required, Validators.min(1), Validators.max(4)]],
      stream: ['', Validators.required],
      year: [new Date().getFullYear(), [Validators.required]],
    });
  }

  transformStreamToUppercase(): void {
    const value = this.form.get('stream')?.value;
    if (value) {
      this.form
        .get('stream')
        ?.setValue(value.toUpperCase(), { emitEvent: false });
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/admin/classes']);
  }

  ngOnInit(): void {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // Force uppercase stream again, in case user pasted something weird
    const payload = {
      ...this.form.value,
      stream: this.form.value.stream.toUpperCase(),
    };

    this.loading = true;
    this.classService.create(payload).subscribe({
      next: () => {
        this.toast.success('Class created successfully!');
        this.router.navigate(['/dashboard/admin/classes']); // go back to class list
      },
      error: (err) => {
        this.toast.apiError('Failed to create class', err);
        this.loading = false;
      },

      complete: () => (this.loading = false),
    });
  }
}
