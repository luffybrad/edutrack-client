import { Component, OnInit } from '@angular/core';
import { FeeService, FeeArrear, FeeTransaction, FeeAuditLog } from '../../../../services/fee.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Student, StudentService } from '../../../../services/student.service';

@Component({
  selector: 'app-fee-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fee-list.component.html',
  styleUrls: ['./fee-list.component.css']
})
export class FeeListComponent implements OnInit {
  feeArrears: FeeArrear[] = [];
  loading = false;
  error = '';
  // Student search (frontend-only)
allStudents: Student[] = [];
filteredStudents: Student[] = [];
studentSearch = '';
selectedStudent: Student | null = null;


  // Modal state
  showTransactionModal = false;
  showDeleteModal = false;
  selectedFeeArrear: FeeArrear | null = null;

  // Transaction input
  transactionCode = '';
  amountPaid: number | null = null;

  constructor(private feeService: FeeService, private studentService: StudentService) {}

  ngOnInit(): void {
    this.fetchFeeArrears();
  }

  fetchFeeArrears(): void {
    this.loading = true;
    this.feeService.getAll().subscribe({
      next: (res) => {
        this.feeArrears = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Error fetching fee arrears';
        this.loading = false;
      }
    });
  }

  getStatusClasses(status?: string): string {
    return status === 'paid'
      ? 'bg-green-500 text-white px-2 py-1 rounded'
      : 'bg-yellow-400 text-black px-2 py-1 rounded';
  }

  // Open modals
  openTransactionModal(fee: FeeArrear) {
    this.selectedFeeArrear = fee;
    this.transactionCode = '';
    this.amountPaid = null;
    this.showTransactionModal = true;
  }

  openDeleteModal(fee: FeeArrear) {
    this.selectedFeeArrear = fee;
    this.showDeleteModal = true;
  }

  // Close modals
  closeTransactionModal() {
    this.showTransactionModal = false;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
  }

  // Add transaction
  submitTransaction() {
    if (!this.selectedFeeArrear || !this.transactionCode || this.amountPaid === null) return;

    this.feeService.addTransaction(this.selectedFeeArrear.id!, {
      transactionCode: this.transactionCode,
      amountPaid: this.amountPaid
    }).subscribe({
      next: () => {
        this.fetchFeeArrears();
        this.closeTransactionModal();
      },
      error: (err) => console.error(err)
    });
  }

  // Delete fee arrear
  confirmDelete() {
    if (!this.selectedFeeArrear) return;

    this.feeService.delete(this.selectedFeeArrear.id!).subscribe({
      next: () => {
        this.fetchFeeArrears();
        this.closeDeleteModal();
      },
      error: (err) => console.error(err)
    });
  }

  // Add these properties
showTransactionsModal = false;
transactions: FeeTransaction[] = [];
totalDue = 0;

// Update viewTransactions method
viewTransactions(feeArrearId?: string) {
  if (!feeArrearId) return;
  this.feeService.getTransactions(feeArrearId).subscribe({
    next: (res) => {
      this.transactions = res.data || [];
      const fee = this.feeArrears.find(f => f.id === feeArrearId);
      this.totalDue = fee?.amountDue || 0;
      this.showTransactionsModal = true;
    },
    error: (err) => {
      console.error(err);
      this.transactions = [];
      this.totalDue = 0;
      this.showTransactionsModal = true;
    }
  });
}


// Close transactions modal
closeTransactionsModal() {
  this.showTransactionsModal = false;
}

// Audit logs modal state
showAuditLogsModal = false;
auditLogs: FeeAuditLog[] = [];

// Update viewAuditLogs method
viewAuditLogs(feeArrearId?: string) {
  if (!feeArrearId) return;
  this.feeService.getAuditLogs(feeArrearId).subscribe({
    next: (res) => {
      this.auditLogs = res.data || [];
      this.showAuditLogsModal = true;
    },
    error: (err) => {
      console.error(err);
      this.auditLogs = [];
      this.showAuditLogsModal = true;
    }
  });
}


// Close audit logs modal
closeAuditLogsModal() {
  this.showAuditLogsModal = false;
}

// Add modal state for creating fee arrear
showAddFeeModal = false;

// Form inputs
newStudentId = '';
newAmountDue: number | null = null;

// Open/Close modal
openAddFeeModal() {
  this.newAmountDue = null;
  this.studentSearch = '';
  this.selectedStudent = null;
  this.filteredStudents = [];
  this.showAddFeeModal = true;

  // Load students once
  if (this.allStudents.length === 0) {
    this.studentService.getAll().subscribe({
      next: (res) => {
        this.allStudents = res.data || [];
      },
      error: () => {
        this.allStudents = [];
      }
    });
  }
}

filterStudents() {
  const q = this.studentSearch.toLowerCase();

  if (q.length < 2) {
    this.filteredStudents = [];
    return;
  }

  this.filteredStudents = this.allStudents.filter(
    (s) =>
      s.admNo.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q)
  ).slice(0, 10); // limit results
}


selectStudent(student: Student) {
  this.selectedStudent = student;
  this.newStudentId = student.id!;
  this.studentSearch = `${student.admNo} - ${student.name}`;
  this.filteredStudents = [];
}



closeAddFeeModal() {
  this.showAddFeeModal = false;
}

// Submit new fee arrear
submitNewFee() {
  if (!this.newStudentId || this.newAmountDue === null) return;

  this.feeService.create({
    studentId: this.newStudentId,
    amountDue: this.newAmountDue
  }).subscribe({
    next: () => {
      this.fetchFeeArrears();
      this.closeAddFeeModal();
    },
    error: (err) => console.error(err)
  });
}



}
