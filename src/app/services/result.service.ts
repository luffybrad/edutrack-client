// src/app/services/result.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../shared/utils/api-response';

/* =======================
   Interfaces
======================= */
export interface Result {
  id: string;
  examId: string;
  studentId: string;
  subjectScores: Record<string, number | null>;
  totalScore: number;
  meanScore: number;
  grade: string;
  student?: {
    id: string;
    admNo: string;
    name: string;
    class?: string;
  };
}

export interface ExamResultsResponse {
  results: Result[];
  analysis: {
    highest: number;
    lowest: number;
    average: number;
    count: number;
    gradeDistribution?: Record<string, number>;
    subjectBreakdown?: Record<
      string,
      { highest: number; lowest: number; average: number; count: number }
    >;
  } | null;
  classAnalysis?: Record<string, any>;
}

export interface SubjectAnalysis {
  subject: string;
  highest: number;
  lowest: number;
  mean: number;
  count: number;
  gradeDistribution?: Record<string, number>;
}

export interface ExamAnalytics {
  topPerformers: Result[];
  weakSubjects: Record<string, number>;
}

export interface StudentComparison {
  examName: string;
  examDate: Date | string;
  totalScore: number;
  meanScore: number;
  grade: string;
  subjectScores: Record<string, number | null>;
}

export interface SubjectProgression {
  progression: Record<string, { examName: string; score: number | null }[]>;
  meanTrend: { examName: string; meanScore: number }[];
}

export interface StudentImprovement {
  examName: string;
  delta: number;
}

export interface ReportFile {
  filePath: string;
}

/* =======================
   Service
======================= */
@Injectable({ providedIn: 'root' })
export class ResultService {
  private baseUrl = `${environment.apiUrl}/results`;

  constructor(private http: HttpClient) {}

  /** Upload Excel Results */
  uploadResults(
    examId: string,
    file: File
  ): Observable<
    ApiResponse<{ created: number; updated: number; deleted: number }>
  > {
    const formData = new FormData();
    formData.append('examId', examId);
    formData.append('file', file);

    return this.http.post<
      ApiResponse<{ created: number; updated: number; deleted: number }>
    >(`${this.baseUrl}/upload`, formData, { withCredentials: true });
  }

  /** Get results per exam */
  getByExam(
    examId: string,
    classId?: string
  ): Observable<ApiResponse<ExamResultsResponse>> {
    const url = classId
      ? `${this.baseUrl}/exam/${examId}/class/${classId}`
      : `${this.baseUrl}/exam/${examId}`;
    return this.http.get<ApiResponse<ExamResultsResponse>>(url, {
      withCredentials: true,
    });
  }

  /** Get results per student */
  getByStudent(studentId: string): Observable<ApiResponse<Result[]>> {
    return this.http.get<ApiResponse<Result[]>>(
      `${this.baseUrl}/student/${studentId}`,
      {
        withCredentials: true,
      }
    );
  }

  /** Compare student results across exams */
  compareStudent(
    studentId: string
  ): Observable<ApiResponse<StudentComparison[]>> {
    return this.http.get<ApiResponse<StudentComparison[]>>(
      `${this.baseUrl}/student/${studentId}/compare`,
      { withCredentials: true }
    );
  }

  /** Track student subject progression */
  trackSubjectProgression(
    studentId: string
  ): Observable<ApiResponse<SubjectProgression>> {
    return this.http.get<ApiResponse<SubjectProgression>>(
      `${this.baseUrl}/student/${studentId}/progression`,
      { withCredentials: true }
    );
  }

  /** Student improvement (exam-to-exam mean score delta) */
  studentImprovement(
    studentId: string
  ): Observable<ApiResponse<StudentImprovement[] | null>> {
    return this.http.get<ApiResponse<StudentImprovement[] | null>>(
      `${this.baseUrl}/student/${studentId}/improvement`,
      { withCredentials: true }
    );
  }

  /** Analyze a subject in an exam */
  analyzeSubject(
    examId: string,
    subject: string
  ): Observable<ApiResponse<SubjectAnalysis>> {
    return this.http.get<ApiResponse<SubjectAnalysis>>(
      `${this.baseUrl}/analyze/${examId}/${subject}`,
      { withCredentials: true }
    );
  }

  /** Exam-level analytics */
  getExamAnalytics(examId: string): Observable<ApiResponse<ExamAnalytics>> {
    return this.http.get<ApiResponse<ExamAnalytics>>(
      `${this.baseUrl}/analytics/${examId}`,
      { withCredentials: true }
    );
  }

  /** Subject difficulty index across all exams */
  getSubjectDifficulty(
    subject: string
  ): Observable<ApiResponse<number | null>> {
    return this.http.get<ApiResponse<number | null>>(
      `${this.baseUrl}/subject/${subject}/difficulty`,
      { withCredentials: true }
    );
  }

  /** Compare classes across multiple exams */
  compareClassesAcrossExams(
    examIds: string[]
  ): Observable<ApiResponse<Record<string, any>>> {
    return this.http.post<ApiResponse<Record<string, any>>>(
      `${this.baseUrl}/classes/compare`,
      { examIds },
      { withCredentials: true }
    );
  }

  /** ================= File Downloads ================= */
  private downloadFile(url: string, fileName: string): void {
    this.http
      .get(url, { responseType: 'blob', withCredentials: true })
      .subscribe((blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(objectUrl);
      });
  }

  /** Generate and download student report PDF */
  downloadStudentReportPDF(studentId: string, fileName?: string): void {
    this.downloadFile(
      `${this.baseUrl}/report/student/${studentId}/pdf`,
      fileName || `Student-${studentId}-Report.pdf`
    );
  }

  /** Generate and download exam summary Excel */
  downloadExamSummaryExcel(examId: string, fileName?: string): void {
    this.downloadFile(
      `${this.baseUrl}/report/exam/${examId}/summary/excel`,
      fileName || `Exam-${examId}-Summary.xlsx`
    );
  }

  /** Generate and download subject analysis Excel */
  downloadSubjectAnalysisExcel(examId: string, fileName?: string): void {
    this.downloadFile(
      `${this.baseUrl}/report/exam/${examId}/subjects/excel`,
      fileName || `Exam-${examId}-Subjects.xlsx`
    );
  }

  /** Generate and download class performance PDF */
  downloadClassPerformancePDF(examId: string, fileName?: string): void {
    this.downloadFile(
      `${this.baseUrl}/report/exam/${examId}/class/pdf`,
      fileName || `Exam-${examId}-Class-Performance.pdf`
    );
  }
}
