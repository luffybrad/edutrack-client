import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../shared/api-response';

export interface Subject {
  id?: string;
  name: string;
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

  bulkAssign(payload: {
    subjectIds: string[];
    studentIds: string[];
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/bulk-assign`,
      payload
    );
  }

  bulkUnassign(payload: {
    subjectIds: string[];
    studentIds: string[];
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/bulk-unassign`,
      payload
    );
  }
}
