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
    file: File,
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
    classId?: string,
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
      },
    );
  }

  /** Compare student results across exams */
  compareStudent(
    studentId: string,
  ): Observable<ApiResponse<StudentComparison[]>> {
    return this.http.get<ApiResponse<StudentComparison[]>>(
      `${this.baseUrl}/student/${studentId}/compare`,
      { withCredentials: true },
    );
  }

  /** Track student subject progression */
  trackSubjectProgression(
    studentId: string,
  ): Observable<ApiResponse<SubjectProgression>> {
    return this.http.get<ApiResponse<SubjectProgression>>(
      `${this.baseUrl}/student/${studentId}/progression`,
      { withCredentials: true },
    );
  }

  /** Student improvement (exam-to-exam mean score delta) */
  studentImprovement(
    studentId: string,
  ): Observable<ApiResponse<StudentImprovement[] | null>> {
    return this.http.get<ApiResponse<StudentImprovement[] | null>>(
      `${this.baseUrl}/student/${studentId}/improvement`,
      { withCredentials: true },
    );
  }

  /** Exam-level analytics */
  getExamAnalytics(examId: string): Observable<ApiResponse<ExamAnalytics>> {
    return this.http.get<ApiResponse<ExamAnalytics>>(
      `${this.baseUrl}/analytics/${examId}`,
      { withCredentials: true },
    );
  }

  /** Compare classes across multiple exams */
  compareClassesAcrossExams(
    examIds: string[],
  ): Observable<ApiResponse<Record<string, any>>> {
    return this.http.post<ApiResponse<Record<string, any>>>(
      `${this.baseUrl}/classes/compare`,
      { examIds },
      { withCredentials: true },
    );
  }

  /** Analyze a subject in an exam */
  analyzeSubject(
    examId: string,
    subject: string,
  ): Observable<ApiResponse<SubjectAnalysis>> {
    return this.http.get<ApiResponse<SubjectAnalysis>>(
      `${this.baseUrl}/analyze/${examId}/${subject}`,
      { withCredentials: true },
    );
  }

  /** Subject difficulty index across all exams */
  getSubjectDifficulty(
    subject: string,
  ): Observable<ApiResponse<number | null>> {
    return this.http.get<ApiResponse<number | null>>(
      `${this.baseUrl}/subject/${subject}/difficulty`,
      { withCredentials: true },
    );
  }

  /** Generate Student Report PDF */
  generateStudentReportPDF(studentId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/students/${studentId}/report-pdf`, {
      responseType: 'blob',
      withCredentials: true,
    });
  }

  /** Generate Exam Summary PDF */
  generateExamSummaryPDF(examId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/exams/${examId}/summary-pdf`, {
      responseType: 'blob',
      withCredentials: true,
    });
  }

  /** Generate Subject Analysis PDF */
  generateSubjectAnalysisPDF(examId: string): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}/exams/${examId}/subject-analysis-pdf`,
      {
        responseType: 'blob',
        withCredentials: true,
      },
    );
  }

  /** Generate Class Performance PDF */
  generateClassPerformancePDF(examId: string): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}/exams/${examId}/class-performance-pdf`,
      {
        responseType: 'blob',
        withCredentials: true,
      },
    );
  }

  /** Generate Comprehensive Performance PDF */
  generateComprehensivePerformancePDF(examId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/exams/${examId}/comprehensive-pdf`, {
      responseType: 'blob',
      withCredentials: true,
    });
  }

  /** Generate Bulk Exam Reports (metadata) */
  generateBulkExamReportsPDF(examIds: string[]): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/exams/bulk-reports-pdf`,
      { examIds },
      { withCredentials: true },
    );
  }

  /** Generate Combined Exam Reports PDF */
  generateCombinedExamReportsPDF(examIds: string[]): Observable<Blob> {
    return this.http.post(
      `${this.baseUrl}/exams/combined-reports-pdf`,
      { examIds },
      {
        responseType: 'blob',
        withCredentials: true,
      },
    );
  }

  /** Helper method to download PDF blob */
  downloadPDF(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up URL object
    window.URL.revokeObjectURL(url);
  }

  /** Helper method to handle PDF download with loading state */
  downloadPDFWithLoading(
    pdfObservable: Observable<Blob>,
    filename: string,
    loadingCallback?: (isLoading: boolean) => void,
  ): void {
    if (loadingCallback) loadingCallback(true);

    pdfObservable.subscribe({
      next: (blob) => {
        this.downloadPDF(blob, filename);
        if (loadingCallback) loadingCallback(false);
      },
      error: (error) => {
        console.error('Failed to download PDF:', error);
        if (loadingCallback) loadingCallback(false);
        // You might want to show an error toast here
      },
    });
  }

  /** Convenience method to download student report */
  downloadStudentReport(
    studentId: string,
    studentName?: string,
    loadingCallback?: (isLoading: boolean) => void,
  ): void {
    const filename = `student-report-${studentName || studentId}.pdf`;
    this.downloadPDFWithLoading(
      this.generateStudentReportPDF(studentId),
      filename,
      loadingCallback,
    );
  }

  /** Convenience method to download exam summary */
  downloadExamSummary(
    examId: string,
    examName?: string,
    loadingCallback?: (isLoading: boolean) => void,
  ): void {
    const filename = `exam-summary-${examName || examId}.pdf`;
    this.downloadPDFWithLoading(
      this.generateExamSummaryPDF(examId),
      filename,
      loadingCallback,
    );
  }

  /** Convenience method to download subject analysis */
  downloadSubjectAnalysis(
    examId: string,
    examName?: string,
    loadingCallback?: (isLoading: boolean) => void,
  ): void {
    const filename = `subject-analysis-${examName || examId}.pdf`;
    this.downloadPDFWithLoading(
      this.generateSubjectAnalysisPDF(examId),
      filename,
      loadingCallback,
    );
  }

  /** Convenience method to download class performance report */
  downloadClassPerformance(
    examId: string,
    examName?: string,
    loadingCallback?: (isLoading: boolean) => void,
  ): void {
    const filename = `class-performance-${examName || examId}.pdf`;
    this.downloadPDFWithLoading(
      this.generateClassPerformancePDF(examId),
      filename,
      loadingCallback,
    );
  }

  /** Convenience method to download comprehensive report */
  downloadComprehensiveReport(
    examId: string,
    examName?: string,
    loadingCallback?: (isLoading: boolean) => void,
  ): void {
    const filename = `comprehensive-report-${examName || examId}.pdf`;
    this.downloadPDFWithLoading(
      this.generateComprehensivePerformancePDF(examId),
      filename,
      loadingCallback,
    );
  }
}
