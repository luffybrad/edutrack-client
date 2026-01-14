// src/app/services/fee.service.ts
import { ApiResponse } from '../shared/utils/api-response';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Nested types
export interface FeeAuditLog {
  id?: string;
  action: string;
  previousData?: any;
  newData?: any;
  createdAt?: string;
}

export interface FeeTransaction {
  id: string;
  transactionCode: string;
  amountPaid: number;
  createdAt: Date;
  feeArrearId: string;
}

export interface FeeArrear {
  id: string;
  studentId: string;
  amountDue: number;
  totalPaid: number;
  balance: number;
  balancePercentage: number;
  status: string;
  transactions: FeeTransaction[];
  auditLogs?: FeeAuditLog[];
  createdAt: Date;
  updatedAt: Date;
}

// DTO for creation
export interface CreateFeeArrearDTO {
  studentId: string;
  amountDue: number;
}

@Injectable({ providedIn: 'root' })
export class FeeService {
  private baseUrl = `${environment.apiUrl}/fees`;

  constructor(private http: HttpClient) {}

  // -------------------
  // CRUD
  // -------------------
  getAll(): Observable<ApiResponse<FeeArrear[]>> {
    return this.http.get<ApiResponse<FeeArrear[]>>(this.baseUrl, {
      withCredentials: true,
    });
  }

  getById(id: string): Observable<ApiResponse<FeeArrear>> {
    return this.http.get<ApiResponse<FeeArrear>>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }

  create(data: CreateFeeArrearDTO): Observable<ApiResponse<FeeArrear>> {
    return this.http.post<ApiResponse<FeeArrear>>(this.baseUrl, data, {
      withCredentials: true,
    });
  }

  update(
    id: string,
    data: Partial<FeeArrear>
  ): Observable<ApiResponse<FeeArrear>> {
    return this.http.put<ApiResponse<FeeArrear>>(
      `${this.baseUrl}/${id}`,
      data,
      { withCredentials: true }
    );
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }

  // -------------------
  // Transactions
  // -------------------
  addTransaction(
    feeArrearId: string,
    transactionCode: string,
    amountPaid: number
  ): Observable<ApiResponse<FeeArrear>> {
    return this.http.post<ApiResponse<FeeArrear>>(
      `${this.baseUrl}/${feeArrearId}/transactions`,
      { transactionCode, amountPaid },
      { withCredentials: true }
    );
  }

  getTransactions(
    feeArrearId: string
  ): Observable<ApiResponse<FeeTransaction[]>> {
    return this.http.get<ApiResponse<FeeTransaction[]>>(
      `${this.baseUrl}/${feeArrearId}/transactions`,
      { withCredentials: true }
    );
  }

  getAuditLogs(feeArrearId: string): Observable<ApiResponse<FeeAuditLog[]>> {
    return this.http.get<ApiResponse<FeeAuditLog[]>>(
      `${this.baseUrl}/${feeArrearId}/audit-logs`,
      { withCredentials: true }
    );
  }

  // -------------------
  // Bulk delete
  // -------------------
  bulkDelete(ids: string[]): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      `${this.baseUrl}/bulk-delete`,
      { ids },
      { withCredentials: true }
    );
  }
}
