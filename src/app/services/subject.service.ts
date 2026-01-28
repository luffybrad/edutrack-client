//src/app/services/subject.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../shared/utils/api-response';
import { Student, StudentService } from './student.service';

export interface Subject {
  id?: string;
  name: string;
  totalStudents?: number;
  totalClasses?: number;
  students?: Student[];
  classes?: Class[];
}

export interface Class {
  id: string;
  form: number;
  stream: string;
  year: number;
}

@Injectable({ providedIn: 'root' })
export class SubjectService {
  private baseUrl = `${environment.apiUrl}/subjects`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Subject[]>> {
    return this.http.get<ApiResponse<Subject[]>>(this.baseUrl);
  }

  getById(id: string): Observable<ApiResponse<Subject>> {
    return this.http.get<ApiResponse<Subject>>(`${this.baseUrl}/${id}`);
  }

  create(data: Subject): Observable<ApiResponse<Subject>> {
    return this.http.post<ApiResponse<Subject>>(this.baseUrl, data);
  }

  update(id: string, data: Subject): Observable<ApiResponse<Subject>> {
    return this.http.put<ApiResponse<Subject>>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${id}`);
  }

  // 🔹 Sync students assigned to a subject
  updateSubjectStudents(
    subjectId: string,
    studentIds: string[],
  ): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${this.baseUrl}/${subjectId}/students`,
      { studentIds },
    );
  }

  // Get subjects offered by a class
  getSubjectsByClass(classId: string): Observable<ApiResponse<Subject[]>> {
    return this.http.get<ApiResponse<Subject[]>>(
      `${this.baseUrl}/class/${classId}`,
    );
  }

  // Get classes offering a subject
  getClassesBySubject(subjectId: string): Observable<ApiResponse<Class[]>> {
    return this.http.get<ApiResponse<Class[]>>(
      `${this.baseUrl}/${subjectId}/classes`,
    );
  }
}
