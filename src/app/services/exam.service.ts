// ✅ src/app/services/exam.service.ts
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
  classes?: Class[]; // Optional, if you want to include class details
  students?: Student[];
}

@Injectable({ providedIn: 'root' })
export class ExamService {
  private baseUrl = `${environment.apiUrl}/exams`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Exam[]>> {
    return this.http.get<ApiResponse<Exam[]>>(this.baseUrl, {
      withCredentials: true,
    });
  }

  getById(id: string): Observable<ApiResponse<Exam>> {
    return this.http.get<ApiResponse<Exam>>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }

  create(data: Exam): Observable<ApiResponse<Exam>> {
    return this.http.post<ApiResponse<Exam>>(this.baseUrl, data, {
      withCredentials: true,
    });
  }

  update(id: string, data: Exam): Observable<ApiResponse<Exam>> {
    return this.http.put<ApiResponse<Exam>>(`${this.baseUrl}/${id}`, data, {
      withCredentials: true,
    });
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }
  updateClasses(data: {
    examId: string;
    classIds: string[];
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/update-classes`,
      data,
      { withCredentials: true }
    );
  }

  getStudents(id: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/${id}/students`, {
      withCredentials: true,
    });
  }
}
