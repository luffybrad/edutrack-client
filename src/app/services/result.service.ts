import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Result {
  id?: string;
  examId: string;
  studentId: string;
  subjectScores: Record<string, number | null>;
  totalScore: number;
  meanScore: number;
  grade: string;
}

@Injectable({ providedIn: 'root' })
export class ResultService {
  private baseUrl = `${environment.apiUrl}/results`;

  constructor(private http: HttpClient) {}

  upload(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/upload`, formData);
  }

  getByExam(examId: string): Observable<Result[]> {
    return this.http.get<Result[]>(`${this.baseUrl}/exam/${examId}`);
  }

  getByStudent(studentId: string): Observable<Result[]> {
    return this.http.get<Result[]>(`${this.baseUrl}/student/${studentId}`);
  }

  analyzeSubject(examId: string, subject: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/analyze/${examId}/${subject}`);
  }

  compareStudent(studentId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/compare/${studentId}`);
  }
}
