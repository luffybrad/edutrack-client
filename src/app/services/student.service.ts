import { ApiResponse } from '../shared/utils/api-response';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StudentClass {
  id: string;
  form: number;
  stream: string;
  year: number;
}

export interface Student {
  id?: string;
  admNo: string;
  name: string;
  classId: string;
  guardianId?: string;
  class?: StudentClass; // ✅ proper nested type
}

@Injectable({ providedIn: 'root' })
export class StudentService {
  private baseUrl = `${environment.apiUrl}/students`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Student[]>> {
    return this.http.get<ApiResponse<Student[]>>(this.baseUrl, {
      withCredentials: true,
    });
  }

  getById(id: string): Observable<ApiResponse<Student>> {
    return this.http.get<ApiResponse<Student>>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }

  create(data: Student): Observable<ApiResponse<Student>> {
    return this.http.post<ApiResponse<Student>>(this.baseUrl, data, {
      withCredentials: true,
    });
  }

  update(id: string, data: Student): Observable<ApiResponse<Student>> {
    return this.http.put<ApiResponse<Student>>(`${this.baseUrl}/${id}`, data, {
      withCredentials: true,
    });
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }

  bulkDelete(ids: string[]): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      `${this.baseUrl}/bulk-delete`,
      { ids },
      {
        withCredentials: true,
      }
    );
  }

  getSubjects(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/${id}/subjects`, {
      withCredentials: true,
    });
  }
}
