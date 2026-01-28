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
  [key: string]: string[] | undefined;
}

export interface Timetable {
  id?: string;
  classId: string;
  lessonsPerDay: number;
  schedule?: TimetableSchedule;
}

// Add these interfaces
export interface LessonWithTeacher {
  subjectId: string;
  subjectName: string;
  teacherId?: string;
  teacherName?: string;
  isDoubleLesson: boolean;
}

export interface TeacherInfo {
  id: string;
  name: string;
  subject: string;
}

// Update GenerateTimetableDto to include teacher validation
export interface GenerateTimetableDto {
  classId: string;
  subjectIds: string[];
  lessonsPerDay: number;
  considerTeacherAvailability?: boolean; // Add this
}

@Injectable({ providedIn: 'root' })
export class TimetableService {
  private baseUrl = `${environment.apiUrl}/timetables`;

  constructor(private http: HttpClient) {}

  // Update generate method to include teacher consideration
  generate(data: GenerateTimetableDto): Observable<ApiResponse<Timetable>> {
    // Add default value for teacher consideration
    const requestData = {
      ...data,
      considerTeacherAvailability: data.considerTeacherAvailability ?? true,
    };

    return this.http.post<ApiResponse<Timetable>>(
      `${this.baseUrl}/generate`,
      requestData,
      { withCredentials: true },
    );
  }

  // Save or update timetable
  save(data: Timetable): Observable<ApiResponse<Timetable>> {
    return this.http.post<ApiResponse<Timetable>>(
      `${this.baseUrl}/save`,
      data,
      { withCredentials: true },
    );
  }

  // Get timetable for a specific class
  getByClass(classId: string): Observable<ApiResponse<Timetable>> {
    return this.http.get<ApiResponse<Timetable>>(`${this.baseUrl}/${classId}`, {
      withCredentials: true,
    });
  }

  // Delete timetable for a specific class
  deleteByClass(classId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${classId}`, {
      withCredentials: true,
    });
  }

  // Download timetable PDF
  downloadPDF(classId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${classId}/download`, {
      responseType: 'blob',
      withCredentials: true,
    });
  }

  // Add this method to get teacher-subject assignments
  // In timetable.service.ts - Update getClassTeachers method
  getClassTeachers(classId: string): Observable<ApiResponse<TeacherInfo[]>> {
    return this.http.get<ApiResponse<TeacherInfo[]>>(
      `${this.baseUrl}/${classId}/teachers`, // Use timetable endpoint
      { withCredentials: true },
    );
  }
}
