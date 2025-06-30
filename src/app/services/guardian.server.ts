import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../shared/utils/api-response'; // ✅ Make sure this path is correct

export interface Guardian {
  id?: string;
  name: string;
  email: string;
  phone: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class GuardianService {
  private baseUrl = `${environment.apiUrl}/guardians`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Guardian[]>> {
    return this.http.get<ApiResponse<Guardian[]>>(this.baseUrl);
  }

  getById(id: string): Observable<ApiResponse<Guardian>> {
    return this.http.get<ApiResponse<Guardian>>(`${this.baseUrl}/${id}`);
  }

  create(data: Guardian): Observable<ApiResponse<Guardian>> {
    return this.http.post<ApiResponse<Guardian>>(this.baseUrl, data);
  }

  update(id: string, data: Guardian): Observable<ApiResponse<Guardian>> {
    return this.http.put<ApiResponse<Guardian>>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }
}
