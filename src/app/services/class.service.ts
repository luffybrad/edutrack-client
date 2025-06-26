// src/app/services/class.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../shared/api-response'; // ✅ adjust the path as needed

export interface Class {
  id?: string;
  form: number; // 1 to 4
  stream: string; // e.g., "North", "West"
  year: number;
  teacherId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class ClassService {
  private baseUrl = `${environment.apiUrl}/classes`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Class[]>> {
    return this.http.get<ApiResponse<Class[]>>(this.baseUrl);
  }

  getById(id: string): Observable<ApiResponse<Class>> {
    return this.http.get<ApiResponse<Class>>(`${this.baseUrl}/${id}`);
  }

  create(data: Class): Observable<ApiResponse<Class>> {
    return this.http.post<ApiResponse<Class>>(this.baseUrl, data);
  }

  update(id: string, data: Class): Observable<ApiResponse<Class>> {
    return this.http.put<ApiResponse<Class>>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }
}
