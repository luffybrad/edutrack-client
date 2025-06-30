// src/app/services/teacher.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../shared/utils/api-response';

export interface ClassInfo {
  id: string;
  form: number; // 1–4
  stream: string; // e.g., "A"
  year: number; // e.g., 2025
}

export interface Teacher {
  id?: string;
  name: string;
  email: string;
  phone: string;
  classId: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;

  class?: ClassInfo;
}

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private baseUrl = `${environment.apiUrl}/teachers`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Teacher[]>> {
    return this.http.get<ApiResponse<Teacher[]>>(this.baseUrl, {
      withCredentials: true,
    });
  }

  getById(id: string): Observable<ApiResponse<Teacher>> {
    return this.http.get<ApiResponse<Teacher>>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }

  create(data: Teacher): Observable<ApiResponse<Teacher>> {
    return this.http.post<ApiResponse<Teacher>>(this.baseUrl, data, {
      withCredentials: true,
    });
  }

  update(id: string, data: Teacher): Observable<ApiResponse<Teacher>> {
    return this.http.put<ApiResponse<Teacher>>(`${this.baseUrl}/${id}`, data, {
      withCredentials: true,
    });
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }
}
