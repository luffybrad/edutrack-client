import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../shared/utils/api-response';
import { Class } from './class.service';

export interface Subject {
  id?: string;
  name: string;
  assignedClasses?: Class[];
}

@Injectable({ providedIn: 'root' })
export class SubjectService {
  private baseUrl = `${environment.apiUrl}/subjects`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Subject[]>> {
    return this.http.get<ApiResponse<Subject[]>>(this.baseUrl, {
      withCredentials: true,
    });
  }

  getById(id: string): Observable<ApiResponse<Subject>> {
    return this.http.get<ApiResponse<Subject>>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }

  create(data: Subject): Observable<ApiResponse<Subject>> {
    return this.http.post<ApiResponse<Subject>>(this.baseUrl, data, {
      withCredentials: true,
    });
  }

  update(id: string, data: Subject): Observable<ApiResponse<Subject>> {
    return this.http.put<ApiResponse<Subject>>(`${this.baseUrl}/${id}`, data, {
      withCredentials: true,
    });
  }

  delete(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }

  /** ✅ REPLACEMENT: Replace the assigned classes for a subject (adds new, removes missing) */
  updateClasses(payload: {
    subjectId: string;
    classIds: string[];
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/update-classes`,
      payload,
      { withCredentials: true }
    );
  }
}
