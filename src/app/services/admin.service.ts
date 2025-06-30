// src/app/services/admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../shared/utils/api-response'; // ✅ Ensure this path is correct

export interface Admin {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private baseUrl = `${environment.apiUrl}/admins`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Admin[]>> {
    return this.http.get<ApiResponse<Admin[]>>(this.baseUrl);
  }

  getById(id: string): Observable<ApiResponse<Admin>> {
    return this.http.get<ApiResponse<Admin>>(`${this.baseUrl}/${id}`);
  }

  create(admin: Partial<Admin>): Observable<ApiResponse<Admin>> {
    return this.http.post<ApiResponse<Admin>>(this.baseUrl, admin);
  }

  update(id: string, admin: Partial<Admin>): Observable<ApiResponse<Admin>> {
    return this.http.put<ApiResponse<Admin>>(`${this.baseUrl}/${id}`, admin);
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }
}
