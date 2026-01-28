// src/app/services/exam.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../shared/utils/api-response';
import { Class } from './class.service';
import { Student } from './student.service';

// ✅ adjust the path if needed

export interface Exam {
  id?: string;
  name: string;
  date: string; // ISO format
  createdAt?: string;
  updatedAt?: string;
  students?: Student[];
}

@Injectable({ providedIn: 'root' })
export class ExamService {
  private baseUrl = `${environment.apiUrl}/exams`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Exam[]>> {
    return this.http.get<ApiResponse<Exam[]>>(this.baseUrl);
  }

  getById(id: string): Observable<ApiResponse<Exam>> {
    return this.http.get<ApiResponse<Exam>>(`${this.baseUrl}/${id}`);
  }

  create(data: Exam): Observable<ApiResponse<Exam>> {
    return this.http.post<ApiResponse<Exam>>(this.baseUrl, data);
  }

  update(id: string, data: Exam): Observable<ApiResponse<Exam>> {
    return this.http.put<ApiResponse<Exam>>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }
}
