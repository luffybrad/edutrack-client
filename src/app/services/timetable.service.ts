import { ApiResponse } from '../shared/utils/api-response';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TimetableSchedule {
  MONDAY: string[];
  TUESDAY: string[];
  WEDNESDAY: string[];
  THURSDAY: string[];
  FRIDAY: string[];
  [key: string]: string[] | undefined
}

export interface Timetable {
  id?: string;
  classId: string;
  lessonsPerDay: number;
  schedule?: TimetableSchedule;
}

export interface GenerateTimetableDto {
  classId: string;
  subjectIds: string[];
  lessonsPerDay: number;
}

@Injectable({ providedIn: 'root' })
export class TimetableService {
  private baseUrl = `${environment.apiUrl}/timetables`;

  constructor(private http: HttpClient) {}

  // Generate or regenerate timetable for a class
  generate(data: GenerateTimetableDto): Observable<ApiResponse<Timetable>> {
    return this.http.post<ApiResponse<Timetable>>(
      `${this.baseUrl}/generate`,
      data,
      { withCredentials: true }
    );
  }

  // Get timetable for a specific class
  getByClass(classId: string): Observable<ApiResponse<Timetable>> {
    return this.http.get<ApiResponse<Timetable>>(
      `${this.baseUrl}/${classId}`,
      { withCredentials: true }
    );
  }

  // Delete timetable for a specific class
  deleteByClass(classId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.baseUrl}/${classId}`,
      { withCredentials: true }
    );
  }
}
