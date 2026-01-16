// src/app/services/guardian.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../shared/utils/api-response';

export interface StudentInfo {
  id: string;
  admNo: string;
  name: string;
  classId: string;
  guardianId: string;
}

export interface Guardian {
  id?: string;
  name: string;
  email: string;
  phone: string;
  studentIds?: string[]; // ✅ for edit binding
  // present in the API response
  createdAt?: Date | string;

  updatedAt?: Date | string;
  students?: StudentInfo[]; // ✅ Array of students
}

@Injectable({ providedIn: 'root' })
export class GuardianService {
  private baseUrl = `${environment.apiUrl}/guardians`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Guardian[]>> {
    return this.http.get<ApiResponse<Guardian[]>>(this.baseUrl, {
      withCredentials: true,
    });
  }

  getById(id: string): Observable<ApiResponse<Guardian>> {
    return this.http.get<ApiResponse<Guardian>>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }

  create(data: Guardian): Observable<ApiResponse<Guardian>> {
    return this.http.post<ApiResponse<Guardian>>(this.baseUrl, data, {
      withCredentials: true,
    });
  }

  update(id: string, data: Guardian): Observable<ApiResponse<Guardian>> {
    return this.http.put<ApiResponse<Guardian>>(`${this.baseUrl}/${id}`, data, {
      withCredentials: true,
    });
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }
}
