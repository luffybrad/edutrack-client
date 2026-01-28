// src/app/shared/services/timetable.service.ts
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

export interface ClassScheduleData {
  class: {
    id: string;
    form: number;
    stream: string;
    year: number;
  };
  lessonsPerDay: number;
  schedule: TimetableSchedule;
}

export interface Timetable {
  id: string;
  name: string;
  description?: string;
  classSchedules: { [classId: string]: ClassScheduleData };
  createdAt: Date;
  isActive: boolean;
}

export interface TeacherInfo {
  id: string;
  name: string;
  subject: string;
}

// For generating timetable for all classes
export interface GenerateTimetableDto {
  timetableName: string;
  description?: string;
  lessonsPerDay: number;
}

// For getting class schedule from a timetable
export interface ClassTimetableResponse {
  timetableName: string;
  class: {
    id: string;
    form: number;
    stream: string;
    year: number;
  };
  lessonsPerDay: number;
  schedule: TimetableSchedule;
}

// Statistics interface
export interface TimetableStatistics {
  totalClasses: number;
  totalLessons: number;
  teacherUtilization: number;
  freePeriods: number;
}

// Set active timetable request
export interface SetActiveTimetableDto {
  timetableId: string;
}

@Injectable({ providedIn: 'root' })
export class TimetableService {
  private baseUrl = `${environment.apiUrl}/timetables`;

  constructor(private http: HttpClient) {}

  // =================== NEW METHODS ===================

  // Generate timetable for all classes
  generateForAllClasses(
    data: GenerateTimetableDto,
  ): Observable<ApiResponse<Timetable>> {
    return this.http.post<ApiResponse<Timetable>>(
      `${this.baseUrl}/generate`,
      {
        ...data,
        lessonsPerDay: Number(data.lessonsPerDay),
      },
      { withCredentials: true },
    );
  }

  // Get all timetables
  getAllTimetables(): Observable<ApiResponse<Timetable[]>> {
    return this.http.get<ApiResponse<Timetable[]>>(`${this.baseUrl}/`, {
      withCredentials: true,
    });
  }

  // Get timetable by name
  getTimetableByName(name: string): Observable<ApiResponse<Timetable>> {
    return this.http.get<ApiResponse<Timetable>>(
      `${this.baseUrl}/name/${name}`,
      { withCredentials: true },
    );
  }

  // Get timetable by ID
  getTimetableById(id: string): Observable<ApiResponse<Timetable>> {
    return this.http.get<ApiResponse<Timetable>>(`${this.baseUrl}/id/${id}`, {
      withCredentials: true,
    });
  }

  // Get active timetable
  getActiveTimetable(): Observable<ApiResponse<Timetable>> {
    return this.http.get<ApiResponse<Timetable>>(`${this.baseUrl}/active`, {
      withCredentials: true,
    });
  }

  // Set active timetable
  setActiveTimetable(timetableId: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      `${this.baseUrl}/active`,
      { timetableId },
      { withCredentials: true },
    );
  }

  // Get class schedule from a specific timetable
  getClassTimetable(
    timetableName: string,
    classId: string,
  ): Observable<ApiResponse<ClassTimetableResponse>> {
    return this.http.get<ApiResponse<ClassTimetableResponse>>(
      `${this.baseUrl}/${timetableName}/classes/${classId}`,
      { withCredentials: true },
    );
  }

  // Get timetable statistics
  getTimetableStatistics(
    timetableId: string,
  ): Observable<ApiResponse<TimetableStatistics>> {
    return this.http.get<ApiResponse<TimetableStatistics>>(
      `${this.baseUrl}/${timetableId}/statistics`,
      { withCredentials: true },
    );
  }

  // Save or update timetable
  saveTimetable(data: Partial<Timetable>): Observable<ApiResponse<Timetable>> {
    return this.http.post<ApiResponse<Timetable>>(
      `${this.baseUrl}/save`,
      data,
      { withCredentials: true },
    );
  }

  // Delete timetable by ID
  deleteTimetable(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/id/${id}`, {
      withCredentials: true,
    });
  }

  // Delete timetable by name
  deleteTimetableByName(name: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/name/${name}`, {
      withCredentials: true,
    });
  }

  // Download PDF for a specific class from a timetable
  downloadClassTimetablePDF(
    timetableName: string,
    classId: string,
  ): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}/${timetableName}/classes/${classId}/pdf`,
      {
        responseType: 'blob',
        withCredentials: true,
      },
    );
  }

  // Download complete PDF for all classes in a timetable
  downloadCompleteTimetablePDF(timetableName: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${timetableName}/pdf/complete`, {
      responseType: 'blob',
      withCredentials: true,
    });
  }

  // =================== DEPRECATED METHODS (for backward compatibility) ===================

  // Deprecated: Generate timetable for single class
  generateForSingleClass(data: any): Observable<ApiResponse<any>> {
    console.warn('Deprecated: Use generateForAllClasses instead');
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/generate/single`,
      data,
      { withCredentials: true },
    );
  }

  // Deprecated: Get timetable by class ID (old structure)
  getByClass(classId: string): Observable<ApiResponse<any>> {
    console.warn(
      'Deprecated: Use getClassTimetable with timetable name instead',
    );
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/class/${classId}`, {
      withCredentials: true,
    });
  }

  // Deprecated: Delete timetable by class (old structure)
  deleteByClass(classId: string): Observable<ApiResponse<null>> {
    console.warn(
      'Deprecated: Use deleteTimetableByName or deleteTimetable instead',
    );
    return this.http.delete<ApiResponse<null>>(
      `${this.baseUrl}/class/${classId}`,
      { withCredentials: true },
    );
  }

  // Deprecated: Download PDF (old structure)
  downloadPDF(classId: string): Observable<Blob> {
    console.warn(
      'Deprecated: Use downloadClassTimetablePDF with timetable name instead',
    );
    return this.http.get(`${this.baseUrl}/class/${classId}/pdf`, {
      responseType: 'blob',
      withCredentials: true,
    });
  }

  // Get class teachers (keep this if still needed)
  getClassTeachers(classId: string): Observable<ApiResponse<TeacherInfo[]>> {
    return this.http.get<ApiResponse<TeacherInfo[]>>(
      `${environment.apiUrl}/teacher-subjects/class/${classId}/teachers`,
      { withCredentials: true },
    );
  }

  // =================== HELPER METHODS ===================

  // Helper to get all classes from a timetable
  getClassesFromTimetable(timetable: Timetable): any[] {
    if (!timetable.classSchedules) return [];

    return Object.values(timetable.classSchedules).map((schedule) => ({
      id: schedule.class.id,
      form: schedule.class.form,
      stream: schedule.class.stream,
      year: schedule.class.year,
      lessonsPerDay: schedule.lessonsPerDay,
    }));
  }

  // Helper to check if timetable has a specific class
  hasClass(timetable: Timetable, classId: string): boolean {
    return !!(timetable.classSchedules && timetable.classSchedules[classId]);
  }

  // Helper to get schedule for a class from timetable
  getClassSchedule(
    timetable: Timetable,
    classId: string,
  ): TimetableSchedule | null {
    if (!this.hasClass(timetable, classId)) return null;
    return timetable.classSchedules[classId].schedule;
  }

  // Helper to format timetable name for display
  formatTimetableName(timetable: Timetable): string {
    return `${timetable.name}${timetable.isActive ? ' (Active)' : ''}`;
  }

  // Helper to get timetable creation date
  getCreationDate(timetable: Timetable): string {
    return new Date(timetable.createdAt).toLocaleDateString();
  }
}
