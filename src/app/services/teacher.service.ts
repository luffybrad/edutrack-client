// src/app/services/teacher.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../shared/utils/api-response';
import { Subject } from './subject.service';

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
  classId?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  class?: ClassInfo;
  subjects?: TeacherSubject[];
}

export interface TeacherSubject {
  id: string;
  teacherId: string;
  subjectId: string;
  classId: string;

  teacher?: Teacher;
  subject?: Subject;
  class?: ClassInfo;
}

export interface AssignSubjectDto {
  subjectId: string;
  classId: string;
}

export interface BulkAssignSubjectsDto {
  subjectIds: string[];
  classId: string;
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

  /* -------------------- SUBJECT ASSIGNMENT METHODS -------------------- */

  // Assign a subject to teacher for a class
  assignSubject(
    teacherId: string,
    data: AssignSubjectDto,
  ): Observable<ApiResponse<TeacherSubject>> {
    return this.http.post<ApiResponse<TeacherSubject>>(
      `${this.baseUrl}/${teacherId}/subjects`,
      data,
      { withCredentials: true },
    );
  }

  // Get teacher's subjects (with optional class filter)
  getTeacherSubjects(
    teacherId: string,
    classId?: string,
  ): Observable<ApiResponse<TeacherSubject[]>> {
    let url = `${this.baseUrl}/${teacherId}/subjects`;

    if (classId) {
      url += `?classId=${classId}`;
    }

    return this.http.get<ApiResponse<TeacherSubject[]>>(url, {
      withCredentials: true,
    });
  }

  // Bulk assign multiple subjects
  bulkAssignSubjects(
    teacherId: string,
    data: BulkAssignSubjectsDto,
  ): Observable<ApiResponse<TeacherSubject[]>> {
    return this.http.post<ApiResponse<TeacherSubject[]>>(
      `${this.baseUrl}/${teacherId}/subjects/bulk`,
      data,
      { withCredentials: true },
    );
  }

  // Remove a subject assignment
  removeSubjectAssignment(assignmentId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.baseUrl}/subjects/${assignmentId}`,
      { withCredentials: true },
    );
  }

  // Get teachers teaching a specific subject in a class
  getSubjectTeachers(
    subjectId: string,
    classId: string,
  ): Observable<ApiResponse<TeacherSubject[]>> {
    return this.http.get<ApiResponse<TeacherSubject[]>>(
      `${this.baseUrl}/subjects/teachers?subjectId=${subjectId}&classId=${classId}`,
      { withCredentials: true },
    );
  }
}
