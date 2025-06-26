// src/app/services/teacher.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../shared/api-response'; // adjust import path if needed

export interface Teacher {
  id?: string;
  name: string;
  email: string;
  phone: string;
  classId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private baseUrl = `${environment.apiUrl}/teachers`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Teacher[]>> {
    return this.http.get<ApiResponse<Teacher[]>>(this.baseUrl);
  }

  getById(id: string): Observable<ApiResponse<Teacher>> {
    return this.http.get<ApiResponse<Teacher>>(`${this.baseUrl}/${id}`);
  }

  create(data: Teacher): Observable<ApiResponse<Teacher>> {
    return this.http.post<ApiResponse<Teacher>>(this.baseUrl, data);
  }

  update(id: string, data: Teacher): Observable<ApiResponse<Teacher>> {
    return this.http.put<ApiResponse<Teacher>>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }
}
