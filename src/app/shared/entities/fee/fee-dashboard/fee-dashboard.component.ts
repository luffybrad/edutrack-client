// src/app/shared/entities/fee/fee-dashboard/fee-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import {
  FeeService,
  FeeArrear,
  FeeTransaction,
  FeeAuditLog,
} from '../../../../services/fee.service';
import { StudentService, Student } from '../../../../services/student.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-fee-dashboard',
  standalone: true,
  imports: [CommonModule, NgChartsModule, FormsModule, ReactiveFormsModule],
  templateUrl: './fee-dashboard.component.html',
})
export class FeeDashboardComponent implements OnInit {
  feeArrears: FeeArrear[] = [];
  students: Student[] = [];
  selectedArrear: FeeArrear | null = null;
  transactions: FeeTransaction[] = [];
  auditLogs: FeeAuditLog[] = [];
  searchTerm = '';

  // Modal controls
  showFeeModal = false;
  showTransactionModal = false;
  showDeleteModal = false;

  // Forms
  feeForm!: FormGroup;
  transactionForm!: FormGroup;

  // Chart
  balanceChartData!: ChartData<'doughnut'>;
  chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
  };

  loading = false;

  constructor(
    private feeService: FeeService,
    private studentService: StudentService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.loadStudents();
    this.loadFeeArrears();
    this.initForms();
  }

  private initForms() {
    this.feeForm = this.fb.group({
      studentId: ['', Validators.required],
      amountDue: [0, [Validators.required, Validators.min(1)]],
    });

    this.transactionForm = this.fb.group({
      transactionCode: ['', Validators.required],
      amountPaid: [0, [Validators.required, Validators.min(1)]],
    });
  }

  // -------------------
  // Load Students
  // -------------------
  private loadStudents() {
    this.studentService.getAll().subscribe({
      next: (res) => (this.students = res.data),
      error: () => this.showToast('error', 'Failed to load students'),
    });
  }

  // -------------------
  // Load Fee Arrears
  // -------------------
  loadFeeArrears() {
    this.loading = true;
    this.feeService.getAll().subscribe({
      next: (res) => {
        this.feeArrears = res.data.map((a) => ({
          ...a,
          amountDue: Number(a.amountDue) || 0,
          totalPaid: Number(a.totalPaid) || 0,
          balance: Number(a.balance) || 0,
          balancePercentage: Number(a.balancePercentage) || 0,
          transactions: a.transactions?.map((tx) => ({
            ...tx,
            amountPaid: Number(tx.amountPaid),
          })),
        }));
        this.updateChart();
        this.loading = false;
      },
      error: () => {
        this.showToast('error', 'Failed to load fee arrears');
        this.loading = false;
      },
    });
  }

  // -------------------
  // Utility: Toast
  // -------------------
  private showToast(icon: 'success' | 'error' | 'info', message: string) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  }

  // -------------------
  // Filter
  // -------------------
  filteredArrears() {
    const term = this.searchTerm.toLowerCase();
    return this.feeArrears.filter((a) =>
      this.getStudentName(a.studentId).toLowerCase().includes(term)
    );
  }

  getStudentName(studentId: string) {
    const student = this.students.find((s) => s.id === studentId);
    return student ? student.name : studentId;
  }

  // -------------------
  // Fee Arrear Modals
  // -------------------
  openCreateModal() {
    this.selectedArrear = null;
    this.feeForm.reset({ studentId: '', amountDue: 0 });
    this.showFeeModal = true;
  }

  openEditModal(arrear: FeeArrear) {
    this.selectedArrear = arrear;
    this.feeForm.setValue({
      studentId: arrear.studentId,
      amountDue: arrear.amountDue,
    });
    this.showFeeModal = true;
  }

  submitFeeForm() {
    const { studentId, amountDue } = this.feeForm.value;

    if (this.selectedArrear) {
      // Update existing arrear
      this.feeService.update(this.selectedArrear.id!, { amountDue }).subscribe({
        next: () => {
          this.loadFeeArrears();
          this.showToast('success', 'Fee arrear updated successfully');
          this.showFeeModal = false;
        },
        error: (err) =>
          this.showToast('error', err.error?.message || 'Update failed'),
      });
    } else {
      // Create new arrear using only the fields backend expects
      const payload = { studentId, amountDue };
      this.feeService.create(payload as any).subscribe({
        next: () => {
          this.loadFeeArrears();
          this.showToast('success', 'Fee arrear created successfully');
          this.showFeeModal = false;
        },
        error: (err) =>
          this.showToast('error', err.error?.message || 'Creation failed'),
      });
    }
  }

  // -------------------
  // Delete Arrear
  // -------------------
  confirmDelete(arrear: FeeArrear) {
    this.selectedArrear = arrear;
    this.showDeleteModal = true;
  }

  deleteArrear() {
    if (!this.selectedArrear) return;
    this.feeService.delete(this.selectedArrear.id!).subscribe({
      next: () => {
        this.loadFeeArrears();
        this.showToast('success', 'Fee arrear deleted successfully');
        this.showDeleteModal = false;
      },
      error: (err) =>
        this.showToast('error', err.error?.message || 'Delete failed'),
    });
  }

  // -------------------
  // Transactions
  // -------------------
  openTransactionModal(arrear: FeeArrear) {
    this.selectedArrear = arrear;
    this.transactionForm.reset({ transactionCode: '', amountPaid: 0 });
    this.showTransactionModal = true;
  }

  submitTransaction() {
    if (!this.selectedArrear) return;
    const { transactionCode, amountPaid } = this.transactionForm.value;
    this.feeService
      .addTransaction(this.selectedArrear.id!, transactionCode, amountPaid)
      .subscribe({
        next: (res) => {
          const updated = res.data;
          const index = this.feeArrears.findIndex((a) => a.id === updated.id);
          if (index > -1) this.feeArrears[index] = updated;
          this.updateChart();
          this.showToast('success', 'Transaction added successfully');
          this.showTransactionModal = false;
          this.loadFeeArrears();
        },
        error: () => this.showToast('error', 'Transaction failed'),
      });
  }

  viewTransactions(arrear: FeeArrear) {
    this.transactions = arrear.transactions || [];
    this.auditLogs = [];
  }

  viewAuditLogs(arrear: FeeArrear) {
    this.auditLogs = arrear.auditLogs || [];
    this.transactions = [];
  }

  // -------------------
  // Chart
  // -------------------
  private updateChart() {
    const paid = this.feeArrears.reduce(
      (sum, f) => sum + (f.totalPaid || 0),
      0
    );
    const due = this.feeArrears.reduce((sum, f) => sum + (f.balance || 0), 0);

    this.balanceChartData = {
      labels: ['Paid', 'Balance'],
      datasets: [
        { data: [paid, due], backgroundColor: ['#0C66EC', '#93C5FD'] },
      ],
    };
  }

  // -------------------
  // Kenyan Currency Formatter
  // -------------------
  formatKES(amount: number) {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(amount);
  }
}
