// src/app/services/class.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../shared/utils/api-response';

export interface Student {
  id: string;
  admNo: string;
  name: string;
  classId: string;
  guardianId: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string; // Usually do NOT expose this on frontend!
  classId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id?: string;
  form: number; // 1–4
  stream: string; // e.g. "A"
  year: number;
  teacherId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  students?: Student[];
  teacher?: Teacher;
  studentsCount: number; // ✅ This comes from backend now
}

@Injectable({ providedIn: 'root' })
export class ClassService {
  private baseUrl = `${environment.apiUrl}/classes`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Class[]>> {
    return this.http.get<ApiResponse<Class[]>>(this.baseUrl, {
      withCredentials: true,
    });
  }

  getById(id: string): Observable<ApiResponse<Class>> {
    return this.http.get<ApiResponse<Class>>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }

  create(data: Class): Observable<ApiResponse<Class>> {
    return this.http.post<ApiResponse<Class>>(this.baseUrl, data, {
      withCredentials: true,
    });
  }

  update(id: string, data: Class): Observable<ApiResponse<Class>> {
    return this.http.put<ApiResponse<Class>>(`${this.baseUrl}/${id}`, data, {
      withCredentials: true,
    });
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }
}
